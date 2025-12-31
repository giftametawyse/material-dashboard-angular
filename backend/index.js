// backend/index.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const app = express();

// ---------- CONFIG ----------
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',       // <-- put your MySQL password if any
  database: 'mqtt_data',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Allowed sensor tables (prevent SQL injection)
const ALLOWED_SENSORS = new Set([
  'temperature', 'humidity', 'hydrogen', 'oxymeter', 'voltage', 'voltage_sensor'
]);

// ---------- MIDDLEWARE ----------
app.use(express.json());

// CORS: permissive for local dev. Replace origin:true with an array of allowed origins for production.
app.use(cors({
  origin: true,
  credentials: true
}));

// Simple request logging
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl, 'from', req.ip);
  next();
});

// Create a pool (recommended vs single connection)
const pool = mysql.createPool(DB_CONFIG);

// ---------- HELPERS ----------
function sanitizeSensor(sensor) {
  if (!sensor || typeof sensor !== 'string') return null;
  const s = sensor.trim();
  return ALLOWED_SENSORS.has(s) ? s : null;
}

function parseLimit(q) {
  const n = parseInt(q, 10);
  if (Number.isNaN(n)) return 200;
  // clamp
  return Math.min(1000, Math.max(1, n));
}

// ---------- ROUTES ----------

// Generic latest endpoint
app.get('/api/:sensor/latest', async (req, res) => {
  try {
    const raw = req.params.sensor;
    const sensor = sanitizeSensor(raw);
    if (!sensor) return res.status(404).json({ error: 'Unknown sensor' });

    const sql = `SELECT id, timestamp, sensor_reading, serial_no FROM \`${sensor}\` ORDER BY id DESC LIMIT 1`;
    const [rows] = await pool.query(sql);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No data' });
    }

    // Return a single object
    return res.json(rows[0]);
  } catch (err) {
    console.error('/api/:sensor/latest error', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Generic history endpoint: /api/:sensor/history?limit=200
app.get('/api/:sensor/history', async (req, res) => {
  try {
    const raw = req.params.sensor;
    const sensor = sanitizeSensor(raw);
    if (!sensor) return res.status(404).json({ error: 'Unknown sensor' });

    const limit = parseLimit(req.query.limit);
    // Note: ORDER BY id DESC returns newest-first. If frontend expects oldest-first,
    // you can reverse rows before return: rows.reverse()
    const sql = `SELECT id, timestamp, sensor_reading, serial_no FROM \`${sensor}\` ORDER BY id DESC LIMIT ?`;
    const [rows] = await pool.query(sql, [limit]);

    return res.json(rows);
  } catch (err) {
    console.error('/api/:sensor/history error', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/* ------------------ user endpoints ------------------ */
app.post('/api/register', async (req, res) => {
  console.log('Incoming /api/register', req.ip);
  const { first_name, last_name, username, email, password, phone } = req.body || {};
  if (!first_name || !last_name || !username || !email || !password) {
    return res.status(422).json({ error: 'Missing required fields' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.execute(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );
    if (rows.length) {
      conn.release();
      return res.status(409).json({ error: 'Username or email exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await conn.execute(
      'INSERT INTO users (first_name, last_name, username, email, password, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, username, email, hashed, phone || null]
    );
    conn.release();

    return res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Register error:', err);
    if (conn) conn.release();
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password)
    return res.status(422).json({ error: 'Missing fields' });

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.execute(
      'SELECT id, username, email, password FROM users WHERE username = ? OR email = ? LIMIT 1',
      [identifier, identifier]
    );

    if (!rows.length) {
      conn.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    conn.release();

    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // ✅ SEND TOKEN + USER
    return res.json({
      success: true,
      token: 'dummy-token-for-now', // you can add JWT later
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    if (conn) conn.release();
    return res.status(500).json({ error: 'Server error' });
  }
});

/* --------------------------------------------------- */

// health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get('/api/profile/:username', async (req, res) => {
  const { username } = req.params;

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.execute(
      'SELECT id, first_name, last_name, username, email, phone FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    conn.release();

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(rows[0]);
  } catch (err) {
    if (conn) conn.release();
    console.error('Profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


// start server
const server = app.listen(PORT, HOST, () => {
  console.log(`API listening on ${HOST}:${PORT}`);
});

// graceful shutdown
async function shutdown() {
  console.log('Shutting down server...');
  try {
    await pool.end();
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('Error during shutdown', err);
    process.exit(1);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
