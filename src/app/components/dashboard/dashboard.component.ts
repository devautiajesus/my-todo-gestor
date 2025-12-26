import { Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { MacroTaskItemComponent } from '../tasks/macro-task-item.component';
import { TaskFormComponent } from '../tasks/task-form.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MacroTaskItemComponent, TaskFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-neutral-50">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-neutral-900">Todo Gestor</h1>
              @if (authService.currentUser(); as user) {
                <p class="text-sm text-neutral-600">Bienvenido, {{ user.displayName || user.email }}</p>
              }
            </div>
            <button
              (click)="onLogout()"
              class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Add Macro Task Button -->
        <div class="mb-6">
          <button
            (click)="showAddForm.set(true)"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Macro Tarea
          </button>
        </div>

        <!-- Add Task Form -->
        @if (showAddForm()) {
          <div class="mb-6 bg-white rounded-lg shadow-sm p-6">
            <app-task-form
              [level]="'macro'"
              (save)="onCreateMacroTask($event)"
              (cancel)="showAddForm.set(false)"
            />
          </div>
        }

        <!-- Loading State -->
        @if (taskService.isLoading()) {
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        }

        <!-- Macro Tasks List -->
        @if (!taskService.isLoading()) {
          @if (taskService.macroTasks().length === 0) {
            <div class="text-center py-12 bg-white rounded-lg shadow-sm">
              <svg class="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-neutral-900">No hay tareas</h3>
              <p class="mt-1 text-sm text-neutral-500">Comienza creando tu primera macro tarea.</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (macroTask of taskService.macroTasks(); track macroTask.id) {
                <app-macro-task-item [macroTask]="macroTask" />
              }
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardComponent implements OnDestroy {
  authService = inject(AuthService);
  taskService = inject(TaskService);

  showAddForm = signal(false);

  async onLogout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async onCreateMacroTask(data: { title: string; dueDate?: Date }): Promise<void> {
    try {
      await this.taskService.createMacroTask(data.title, data.dueDate);
      this.showAddForm.set(false);
    } catch (error) {
      console.error('Create macro task error:', error);
    }
  }

  ngOnDestroy(): void {
    // Cleanup is handled in the TaskService
  }
}
