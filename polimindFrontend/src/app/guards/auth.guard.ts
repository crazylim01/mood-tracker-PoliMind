// src/app/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MoodStoreService } from '../services/mood-store.service';

export const authGuard: CanActivateFn = () => {
  const store  = inject(MoodStoreService);
  const router = inject(Router);

  if (store.isAuthenticated) return true;

  router.navigate(['/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const store  = inject(MoodStoreService);
  const router = inject(Router);

  if (!store.isAuthenticated) return true;

  router.navigate(['/']);
  return false;
};
