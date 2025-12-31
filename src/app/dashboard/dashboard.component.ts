// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Chartist from 'chartist';

declare var RadialGauge: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  sensors = ['temperature', 'humidity', 'hydrogen', 'oxymeter', 'voltage_sensor'];

  latestData: { [key: string]: any } = {};
  voltageGauge: any;
  humidityValue = 0;

  ticks: any[] = [];
  tickLabels: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    console.log('Sensors list:', this.sensors);

    /* ================= TEMPERATURE TICKS ================= */
    this.initTemperatureTicks();

    this.sensors.forEach(sensor => {

      /* ================= LATEST DATA ================= */
      this.http.get<any>(`http://localhost:5000/api/${sensor}/latest`)
        .subscribe({
          next: data => {
            this.latestData[sensor] = data;

            if (sensor === 'humidity') {
              this.humidityValue = data.sensor_reading;
            }

            if (sensor === 'voltage_sensor') {
              if (!this.voltageGauge) {
                this.initVoltageGauge(data.sensor_reading);
              } else {
                this.voltageGauge.value = data.sensor_reading;
              }
            }
          },
          error: () => {
            this.latestData[sensor] = { sensor_reading: 0 };
          }
        });

      /* ================= GRAPH ================= */
      this.http.get<any[]>(`http://localhost:5000/api/${sensor}/history?limit=50`)
        .subscribe(history => {
          if (!history || history.length === 0) return;

          const labels = history.map((d, i) => {
            const t = new Date(d.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
            return i % 4 === 0 ? t : '';
          });

          const values = history.map(d => d.sensor_reading);
          const chartId = `#${sensor}Chart`;

          let high = 100;
          if (sensor === 'temperature') high = 60;
          if (sensor === 'voltage_sensor') high = 260;
          if (sensor === 'hydrogen') high = 5;

          const chart = new Chartist.Line(
            chartId,
            { labels, series: [values] },
            {
              low: 0,
              high,
              fullWidth: true,
              showArea: false,
              lineSmooth: Chartist.Interpolation.cardinal({ tension: 0.4 }),
              axisX: { showGrid: false, offset: 40 },
              axisY: { showGrid: true, offset: 40 },
              chartPadding: { top: 20, right: 20, bottom: 30, left: 20 }
            }
          );

          
        });
    });
  }

  /* ================= VOLTAGE GAUGE ================= */
  initVoltageGauge(value: number): void {
    this.voltageGauge = new RadialGauge({
      renderTo: 'voltageGauge',
      width: 200,
      height: 200,
      units: 'V',
      title: 'Voltage',
      minValue: 0,
      maxValue: 400,
      majorTicks: ['0','50','100','150','200','250','300','350','400'],
      minorTicks: 5,
      highlights: [
        { from: 0, to: 200, color: 'rgba(0,100,0,.8)' },
        { from: 200, to: 300, color: 'orange' },
        { from: 300, to: 400, color: 'red' }
      ],
      value
    }).draw();
  }

  /* ================= HUMIDITY ================= */
  getHumidityFillHeight(): number {
    return Math.min(200, (this.humidityValue / 100) * 200);
  }

  /* ================= ARC PATHS ================= */
  getArcPath(sensor: string): string {

    let percent = 0;

    if (sensor === 'oxymeter') {
      percent = Math.min(100, this.latestData.oxymeter?.sensor_reading || 0) / 100;
    }

    if (sensor === 'hydrogen') {
      let raw = this.latestData.hydrogen?.sensor_reading || 1;
      raw = Math.max(1, Math.min(5, raw));
      percent = (raw - 1) / 4;
    }

    const cx = 100;
    const cy = 100;
    const r = 90;

    const startAngle = sensor === 'hydrogen' ? 180 : 0;
    const endAngle = sensor === 'hydrogen'
      ? 180 - percent * 180
      : percent * 360;

    const start = this.polarToCartesian(cx, cy, r, startAngle);
    const end = this.polarToCartesian(cx, cy, r, endAngle);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  }

  polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  }

  /* ================= TEMPERATURE TICKS ================= */
  initTemperatureTicks(): void {
    this.ticks = [];
    this.tickLabels = [];

    for (let i = 0; i <= 5; i++) {
      const angle = -135 + (i * 270) / 5;
      const a = (angle - 90) * Math.PI / 180;

      this.ticks.push({
        x1: 100 + 85 * Math.cos(a),
        y1: 100 + 85 * Math.sin(a),
        x2: 100 + 78 * Math.cos(a),
        y2: 100 + 78 * Math.sin(a)
      });

      this.tickLabels.push({
        value: i * 10,
        x: 100 + 65 * Math.cos(a),
        y: 100 + 65 * Math.sin(a)
      });
    }
  }

  /* ================= LABELS & ICONS ================= */
  getSensorLabel(sensor: string): string {
    return {
      temperature: 'Temperature',
      humidity: 'Humidity',
      hydrogen: 'Hydrogen',
      oxymeter: 'Oxygen',
      voltage_sensor: 'Voltage'
    }[sensor] || sensor;
  }

  getSensorIcon(sensor: string): string {
    return {
      temperature: 'thermostat',
      humidity: 'water_drop',
      hydrogen: 'science',
      oxymeter: 'air',
      voltage_sensor: 'bolt'
    }[sensor] || 'sensors';
  }
}
