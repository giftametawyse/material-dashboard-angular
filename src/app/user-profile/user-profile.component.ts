import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  user: any = null;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      this.errorMessage = 'User not logged in';
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      this.http.get<any>(
  `http://localhost:5000/api/profile/${parsedUser.username}`
).subscribe({
  next: (data) => this.user = data,
  error: () => this.errorMessage = 'Failed to load profile'
});


    } catch {
      localStorage.removeItem('user');
      this.errorMessage = 'Invalid session';
    }
  }
}
