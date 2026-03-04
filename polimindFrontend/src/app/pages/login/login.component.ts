// src/app/pages/login/login.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MoodStoreService } from '../../services/mood-store.service';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  loginMode: 'student' | 'staff' = 'student';
  username   = '';
  password   = '';
  newName    = '';
  showPassword  = false;
  agreed        = false;
  showPrivacyModal = false;
  isLoggingIn   = false;
  errorMsg      = '';

  constructor(
    private store:  MoodStoreService,
    private api:    ApiService,
    private router: Router
  ) {}

  get normalized(): string {
    return this.username.toUpperCase().trim();
  }

  get looksLikeNewStudent(): boolean {
    return (
      this.loginMode === 'student' &&
      this.normalized.startsWith('08') &&
      this.normalized.length === 12
    );
  }

  get needsRegistration(): boolean {
    return this.looksLikeNewStudent && this.errorMsg.includes('New student');
  }

  get usernameLength(): number {
    return this.username.trim().length;
  }

  setMode(mode: 'student' | 'staff'): void {
    this.loginMode = mode;
    this.errorMsg = '';
  }

  onUsernameChange(): void {
    this.errorMsg = '';
  }

  async handleLogin(): Promise<void> {
    this.errorMsg = '';

    if (!this.username.trim()) { this.errorMsg = 'ID is required'; return; }
    if (!this.password.trim()) { this.errorMsg = 'Password is required'; return; }
    if (!this.agreed) { this.errorMsg = 'Please agree to the privacy policy to continue.'; return; }

    this.isLoggingIn = true;
    const result = await this.store.login(this.username.trim(), this.password);
    this.isLoggingIn = false;

    if (result.success) {
      this.router.navigate(['/']);
      return;
    }

    // If user not found and looks like new student, attempt register + login
    if (result.message === 'User not found' && this.looksLikeNewStudent) {
      if (!this.newName.trim()) {
        this.errorMsg = 'New student detected. Please enter your full name to register.';
        return;
      }

      this.isLoggingIn = true;
      try {
        await this.store.register(this.normalized, this.password, this.newName.trim());
        const loginResult = await this.store.login(this.normalized, this.password);
        if (loginResult.success) {
          this.router.navigate(['/']);
        } else {
          this.errorMsg = loginResult.message || 'Login failed after registration.';
        }
      } catch (err: any) {
        this.errorMsg = err.message || 'Registration failed.';
      } finally {
        this.isLoggingIn = false;
      }
      return;
    }

    this.errorMsg = result.message || 'Login failed';
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.handleLogin();
  }
}