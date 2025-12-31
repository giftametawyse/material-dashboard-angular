// mqtt-to-mysql.js
// Simple MQTT -> MySQL bridge (updated)
// Usage: node mqtt-to-mysql.js
// Config via env vars: MQTT_URL, DB_HOST, DB_USER, DB_PASS, DB_NAME

const mqtt = require('mqtt');
const mysql = require('mysql2/promise');

// === CONFIG (change if your DB credentials are different) ===
const MQTT_URL = process.env.MQTT_URL || 'mqtt://192.168.1.12:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'sensors/#';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',   // put your DB password here if any
  database: process.env.DB_NAME || 'mqtt_data',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Allowed tables — adjust if your DB uses other names
const ALLOWED_SENSORS = new Set([
  'temperature','humidity','hydrogen','oxymeter','voltage','voltage_sensor'
]);

// Optional alias map (topic -> table)
const ALIAS = {
  'voltage': 'voltage_sensor',
  'oxygen': 'oxymeter'
};

let pool;

async function initDb() {
  pool = mysql.createPool(DB_CONFIG);
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    console.log('Connected to MySQL:', DB_CONFIG.database);
  } finally {
    conn.release();
  }
}

function resolveTable(sensor) {
  if (!sensor) return null;
  const mapped = ALIAS[sensor] || sensor;
  return ALLOWED_SENSORS.has(mapped) ? mapped : null;
}

async function insertRow(table, { timestamp, sensor_reading, serial_no }) {
  const conn = await pool.getConnection();
  try {
    // Convert timestamp to MySQL DATETIME string if present and valid
    let ts = null;
    if (timestamp) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        ts = d.toISOString().slice(0,19).replace('T',' ');
      }
    }
    if (ts) {
      const sql = `INSERT INTO \`${table}\` (timestamp, sensor_reading, serial_no) VALUES (?, ?, ?)`;
      const [res] = await conn.execute(sql, [ts, sensor_reading, serial_no || null]);
      return res;
    } else {
      const sql = `INSERT INTO \`${table}\` (timestamp, sensor_reading, serial_no) VALUES (NOW(), ?, ?)`;
      const [res] = await conn.execute(sql, [sensor_reading, serial_no || null]);
      return res;
    }
  } finally {
    conn.release();
  }
}

function tryParsePayload(payloadStr) {
  // 1) Try native JSON parse
  try {
    return JSON.parse(payloadStr);
  } catch (e) {
    // continue to next attempts
  }

  // 2) Try to normalize JS object-literal keys to JSON keys
  //    e.g. {sensor_reading:230.5,serial_no:VOL-1} -> {"sensor_reading":230.5,"serial_no":"VOL-1"}
  //    This uses a regex to quote keys; it is forgiving but not bulletproof for all malformed input.
  try {
    const candidate = payloadStr.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    return JSON.parse(candidate);
  } catch (e) {
    // continue
  }

  // 3) If payload is a plain numeric string, accept it as sensor_reading
  const n = parseFloat(payloadStr);
  if (!isNaN(n)) {
    return { sensor_reading: n, timestamp: new Date().toISOString() };
  }

  // No parse succeeded
  return null;
}

async function start() {
  await initDb();
  const client = mqtt.connect(MQTT_URL);

  client.on('connect', () => {
    console.log('Connected to MQTT at', MQTT_URL);
    client.subscribe(MQTT_TOPIC, (err, granted) => {
      if (err) console.error('Subscribe error', err);
      else console.log('Subscribed to topic', MQTT_TOPIC, 'granted:', (granted || []).map(g => g.topic).join(','));
    });
  });

  client.on('reconnect', () => console.log('MQTT reconnecting...'));
  client.on('close', () => console.log('MQTT connection closed'));
  client.on('error', (err) => console.error('MQTT error', err));

  client.on('message', async (topic, payloadBuffer) => {
    const payloadStr = payloadBuffer.toString().trim();
    console.log('Received', topic, payloadStr);

    // Expect topic like sensors/<sensorName> or sensors/<group>/<sensorName>
    const parts = topic.split('/').filter(Boolean);
    // pick the last token as sensor name (more flexible)
    const sensor = parts.length ? parts[parts.length - 1] : topic;
    const table = resolveTable(sensor);
    if (!table) {
      console.warn('Unknown sensor from topic:', sensor, '- ignoring');
      return;
    }

    const obj = tryParsePayload(payloadStr);
    if (!obj) {
      console.error('Invalid payload (not JSON or number):', payloadStr);
      return;
    }

    const row = {
      timestamp: obj.timestamp || obj.time || new Date().toISOString(),
      sensor_reading: (typeof obj.sensor_reading !== 'undefined') ? obj.sensor_reading : (obj.value || obj.reading),
      serial_no: obj.serial_no || obj.serial || obj.device || null
    };

    // final check for numeric reading
    const numericValue = parseFloat(row.sensor_reading);
    if (row.sensor_reading === undefined || row.sensor_reading === null || isNaN(numericValue)) {
      console.error('Payload missing numeric sensor value:', payloadStr, '-> parsed:', obj);
      return;
    }
    // ensure reading is numeric type
    row.sensor_reading = numericValue;

    try {
      const res = await insertRow(table, row);
      console.log(`Inserted into ${table} id=${res.insertId} value=${row.sensor_reading}`);
    } catch (err) {
      console.error('DB insert error:', err);
    }
  });
}

start().catch(err => { console.error('Fatal:', err); process.exit(1); });
