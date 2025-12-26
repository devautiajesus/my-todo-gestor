import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-linear-to-br from-primary-50 to-secondary-50">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-3xl font-bold text-neutral-900">Todo Gestor</h2>
          <p class="mt-2 text-sm text-neutral-600">Inicia sesión en tu cuenta</p>
        </div>

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              [class.border-danger-500]="email?.invalid && email?.touched"
            />
            @if (email?.invalid && email?.touched) {
              <p class="mt-1 text-sm text-danger-600">
                @if (email?.errors?.['required']) {
                  El email es requerido
                }
                @if (email?.errors?.['email']) {
                  Ingresa un email válido
                }
              </p>
            }
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-neutral-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              [class.border-danger-500]="password?.invalid && password?.touched"
            />
            @if (password?.invalid && password?.touched) {
              <p class="mt-1 text-sm text-danger-600">
                @if (password?.errors?.['required']) {
                  La contraseña es requerida
                }
                @if (password?.errors?.['minlength']) {
                  La contraseña debe tener al menos 6 caracteres
                }
              </p>
            }
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="rounded-lg bg-danger-50 p-4">
              <p class="text-sm text-danger-800">{{ errorMessage() }}</p>
            </div>
          }

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              [disabled]="loginForm.invalid || isLoading()"
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              @if (isLoading()) {
                <span>Iniciando sesión...</span>
              } @else {
                <span>Iniciar sesión</span>
              }
            </button>
          </div>

          <!-- Register Link -->
          <div class="text-center">
            <p class="text-sm text-neutral-600">
              ¿No tienes cuenta?
              <a routerLink="/register" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Regístrate aquí
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .bg-gradient-to-br {
      background-image: linear-gradient(to bottom right, var(--color-primary-50), var(--color-secondary-50));
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    try {
      await this.authService.login(email, password);
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle Firebase errors
      let message = 'Error al iniciar sesión. Intenta nuevamente.';

      if (error.code === 'auth/user-not-found') {
        message = 'No existe una cuenta con este email.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Contraseña incorrecta.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Credenciales inválidas.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos. Intenta más tarde.';
      }

      this.errorMessage.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }
}
