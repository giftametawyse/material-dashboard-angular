import { Component, OnInit } from '@angular/core';

export interface RouteInfo {
  path: string;
  title: string;
  icon: string;
}

export const ROUTES: RouteInfo[] = [
  { path: '/dashboard', title: 'Dashboard', icon: 'dashboard' },
  { path: '/user-profile', title: 'User Profile', icon: 'person' },

  { path: '/sensors/humidity', title: 'Humidity', icon: 'water_drop' },
  { path: '/sensors/oxygen', title: 'Oxygen', icon: 'air' },
  { path: '/sensors/hydrogen', title: 'Hydrogen', icon: 'science' },
  { path: '/sensors/temperature', title: 'Temperature', icon: 'device_thermostat' },
  { path: '/sensors/voltage', title: 'Voltage', icon: 'bolt' },

  { path: '/notifications', title: 'Notifications', icon: 'notifications' },
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  menuItems: RouteInfo[] = [];

  ngOnInit(): void {
    this.menuItems = ROUTES;
  }
}
