import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {

  constructor(private router: Router) {}

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  goToSettings(): void {
    this.router.navigate(['/user-profile']); // or /settings if you have it
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
