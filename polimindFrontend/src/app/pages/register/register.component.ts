// src/app/pages/register/register.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MoodStoreService } from '../../services/mood-store.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  fullName            = '';
  username            = '';
  password            = '';
  confirmPassword     = '';
  showPassword        = false;
  showConfirmPassword = false;
  agreed              = false;
  showPrivacyModal    = false;
  isRegistering       = false;
  errorMsg            = '';
  successMsg          = '';

  constructor(
    private store:  MoodStoreService,
    private api:    ApiService,
    private router: Router
  ) {}

  get normalized(): string {
    return this.username.toUpperCase().trim();
  }

  get usernameLength(): number {
    return this.username.trim().length;
  }

  clearError(): void {
    this.errorMsg   = '';
    this.successMsg = '';
  }

  async handleRegister(): Promise<void> {
    this.errorMsg   = '';
    this.successMsg = '';

    if (!this.fullName.trim())        { this.errorMsg = 'Full name is required.'; return; }
    if (!this.username.trim())        { this.errorMsg = 'Matrix number is required.'; return; }
    if (!this.password.trim())        { this.errorMsg = 'Password is required.'; return; }
    if (!this.confirmPassword.trim()) { this.errorMsg = 'Please confirm your password.'; return; }
    if (this.password !== this.confirmPassword) { this.errorMsg = 'Passwords do not match.'; return; }
    if (!this.agreed)                 { this.errorMsg = 'Please agree to the privacy policy to continue.'; return; }

    if (!this.normalized.startsWith('08') || this.normalized.length !== 12) {
      this.errorMsg = 'Invalid matrix number. Must start with 08 and be exactly 12 characters.';
      return;
    }

    this.isRegistering = true;
    try {
      await this.store.register(this.normalized, this.password, this.fullName.trim());
      this.successMsg = 'Account created successfully! Redirecting to login...';
      setTimeout(() => this.router.navigate(['/login']), 1500);
    } catch (err: any) {
      this.errorMsg = err.message || 'Registration failed. Please try again.';
    } finally {
      this.isRegistering = false;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.handleRegister();
  }
}