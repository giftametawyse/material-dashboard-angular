import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  registerForm: FormGroup;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    public router: Router
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phone: ['']
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    // ✅ IMPORTANT: match backend payload
    const payload = {
      first_name: this.registerForm.value.first_name,
      last_name: this.registerForm.value.last_name,
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      confirm_password: this.registerForm.value.password,
      phone: this.registerForm.value.phone
    };

    this.auth.register(payload).subscribe({
      next: () => {
        this.successMessage = 'Registration successful';
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Registration failed';
      }
    });
  }
}
