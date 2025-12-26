import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-linear-to-br from-primary-50 to-secondary-50">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-3xl font-bold text-neutral-900">Todo Gestor</h2>
          <p class="mt-2 text-sm text-neutral-600">Crea tu cuenta</p>
        </div>

        <!-- Register Form -->
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg">
          <!-- Display Name Field -->
          <div>
            <label for="displayName" class="block text-sm font-medium text-neutral-700">
              Nombre completo
            </label>
            <input
              id="displayName"
              type="text"
              formControlName="displayName"
              class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              [class.border-danger-500]="displayName?.invalid && displayName?.touched"
            />
            @if (displayName?.invalid && displayName?.touched) {
              <p class="mt-1 text-sm text-danger-600">
                @if (displayName?.errors?.['minlength']) {
                  El nombre debe tener al menos 2 caracteres
                }
              </p>
            }
          </div>

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

          <!-- Confirm Password Field -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-neutral-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              required
              class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              [class.border-danger-500]="confirmPassword?.invalid && confirmPassword?.touched"
            />
            @if (confirmPassword?.invalid && confirmPassword?.touched) {
              <p class="mt-1 text-sm text-danger-600">
                @if (confirmPassword?.errors?.['required']) {
                  Confirma tu contraseña
                }
              </p>
            }
            @if (registerForm.errors?.['passwordMismatch'] && confirmPassword?.touched) {
              <p class="mt-1 text-sm text-danger-600">
                Las contraseñas no coinciden
              </p>
            }
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="rounded-lg bg-danger-50 p-4">
              <p class="text-sm text-danger-800">{{ errorMessage() }}</p>
            </div>
          }

          <!-- Success Message -->
          @if (successMessage()) {
            <div class="rounded-lg bg-success-50 p-4">
              <p class="text-sm text-success-800">{{ successMessage() }}</p>
            </div>
          }

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading()"
              class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              @if (isLoading()) {
                <span>Creando cuenta...</span>
              } @else {
                <span>Crear cuenta</span>
              }
            </button>
          </div>

          <!-- Login Link -->
          <div class="text-center">
            <p class="text-sm text-neutral-600">
              ¿Ya tienes cuenta?
              <a routerLink="/login" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Inicia sesión aquí
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
export class RegisterComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  registerForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  get displayName() {
    return this.registerForm.get('displayName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  private passwordMatchValidator(form: any) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { email, password, displayName } = this.registerForm.getRawValue();

    try {
      await this.authService.register(email, password, displayName || undefined);

      this.successMessage.set('Cuenta creada exitosamente. Redirigiendo...');

      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1500);

    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle Firebase errors
      let message = 'Error al crear la cuenta. Intenta nuevamente.';

      if (error.code === 'auth/email-already-in-use') {
        message = 'Ya existe una cuenta con este email.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido.';
      } else if (error.code === 'auth/weak-password') {
        message = 'La contraseña es muy débil.';
      }

      this.errorMessage.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }
}
