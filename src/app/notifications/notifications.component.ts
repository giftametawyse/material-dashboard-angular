import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var $: any;

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

  sensors = ['temperature', 'humidity', 'hydrogen', 'oxymeter', 'voltage_sensor'];

  // Prevent repeated alerts
  alertShown: any = {
    temperature: false,
    humidity: false,
    hydrogen: false,
    oxymeter: false,
    voltage_sensor: false
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.startMonitoring();
  }

  /* ================= START MONITORING ================= */

  startMonitoring(): void {
    this.sensors.forEach(sensor => {
      this.http.get<any>(`http://localhost:5000/api/${sensor}/latest`)
        .subscribe(data => {
          this.checkAlerts(sensor, data.sensor_reading);
        });
    });

    // poll every 5 seconds (real-time feel)
    setTimeout(() => this.startMonitoring(), 5000);
  }

  /* ================= ALERT LOGIC ================= */

  checkAlerts(sensor: string, value: number): void {

    // 🔥 Temperature
    if (sensor === 'temperature') {
      if (value > 40 && !this.alertShown.temperature) {
        this.notify(`🔥 Temperature HIGH: ${value}°C`, 'danger');
        this.alertShown.temperature = true;
      }
      if (value <= 40) this.alertShown.temperature = false;
    }

    // 💧 Humidity
    if (sensor === 'humidity') {
      if (value < 30 && !this.alertShown.humidity) {
        this.notify(`💧 Humidity LOW: ${value}%`, 'warning');
        this.alertShown.humidity = true;
      }
      if (value >= 30) this.alertShown.humidity = false;
    }

    // 🧪 Hydrogen
    if (sensor === 'hydrogen') {
      if (value > 3 && !this.alertShown.hydrogen) {
        this.notify(`🧪 Hydrogen CRITICAL: ${value}`, 'danger');
        this.alertShown.hydrogen = true;
      }
      if (value <= 3) this.alertShown.hydrogen = false;
    }

    // 🫁 Oxygen
    if (sensor === 'oxymeter') {
      if (value < 90 && !this.alertShown.oxymeter) {
        this.notify(`🫁 Oxygen LOW: ${value}%`, 'warning');
        this.alertShown.oxymeter = true;
      }
      if (value >= 90) this.alertShown.oxymeter = false;
    }

    // ⚡ Voltage
    if (sensor === 'voltage_sensor') {
      if (value > 260 && !this.alertShown.voltage_sensor) {
        this.notify(`⚡ Voltage HIGH: ${value}V`, 'danger');
        this.alertShown.voltage_sensor = true;
      }
      if (value <= 260) this.alertShown.voltage_sensor = false;
    }
  }

  /* ================= SHOW NOTIFICATION ================= */

  notify(message: string, type: string): void {
    $.notify(
      {
        icon: 'notifications',
        message
      },
      {
        type,
        timer: 4000,
        placement: { from: 'top', align: 'right' },
        template: `
        <div data-notify="container"
             class="alert alert-${type} alert-with-icon"
             role="alert">
          <button type="button" class="close" data-notify="dismiss">
            <i class="material-icons">close</i>
          </button>
          <i class="material-icons">notifications</i>
          <span data-notify="message">${message}</span>
        </div>`
      }
    );
  }
}
