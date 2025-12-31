import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private base = environment.apiUrl; // http://localhost:5000/api

  constructor(private http: HttpClient) {}

  // LOGIN
  login(payload: { identifier: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/login`, payload).pipe(
      tap(res => {
        if (res?.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  // REGISTER
  register(payload: any): Observable<any> {
    return this.http.post(`${this.base}/register`, payload);
  }

  // TOKEN (for interceptor)
  getToken(): string | null {
    const user = localStorage.getItem('user');
    return user ? 'dummy-token' : null; // backend does not use JWT now
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  logout(): void {
    localStorage.removeItem('user');
  }
}
