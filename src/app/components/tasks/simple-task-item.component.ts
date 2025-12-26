import { Component, input, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleTask } from '../../models';
import { TaskService } from '../../services/task.service';
import { TaskFormComponent } from './task-form.component';
import { CommentSectionComponent } from '../comments/comment-section.component';

@Component({
  selector: 'app-simple-task-item',
  imports: [CommonModule, TaskFormComponent, CommentSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <!-- Header -->
      <div class="p-3">
        <div class="flex justify-between items-start gap-2">
          <div class="flex items-start gap-3 flex-1">
            <!-- Checkbox -->
            <button
              (click)="onToggleComplete()"
              class="mt-0.5 shrink-0"
              [attr.aria-label]="simpleTask().completed ? 'Marcar como incompleta' : 'Marcar como completa'"
            >
              <div
                class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                [class.bg-success-500]="simpleTask().completed"
                [class.border-success-500]="simpleTask().completed"
                [class.border-neutral-300]="!simpleTask().completed"
              >
                @if (simpleTask().completed) {
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                }
              </div>
            </button>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              @if (isEditing()) {
                <app-task-form
                  [level]="'simple'"
                  [initialTitle]="simpleTask().title"
                  [initialDueDate]="simpleTask().dueDate"
                  [submitLabel]="'Actualizar'"
                  (save)="onUpdate($event)"
                  (cancel)="isEditing.set(false)"
                />
              } @else {
                <div>
                  <p
                    class="text-sm font-medium"
                    [class.line-through]="simpleTask().completed"
                    [class.text-neutral-500]="simpleTask().completed"
                    [class.text-neutral-900]="!simpleTask().completed"
                  >
                    {{ simpleTask().title }}
                  </p>
                  @if (simpleTask().dueDate) {
                    <p class="text-xs text-neutral-500 mt-1">
                      Vence: {{ formatDate(simpleTask().dueDate!) }}
                    </p>
                  }
                </div>
              }
            </div>
          </div>

          @if (!isEditing()) {
            <div class="flex gap-1 shrink-0">
              <button
                (click)="toggleComments()"
                class="p-1.5 text-neutral-600 hover:text-primary-600 transition-colors"
                [attr.aria-label]="showComments() ? 'Ocultar comentarios' : 'Mostrar comentarios'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button
                (click)="isEditing.set(true)"
                class="p-1.5 text-neutral-600 hover:text-primary-600 transition-colors"
                aria-label="Editar"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                (click)="onDelete()"
                class="p-1.5 text-neutral-600 hover:text-danger-600 transition-colors"
                aria-label="Eliminar"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Comments Section -->
      @if (showComments()) {
        <div class="px-3 pb-3 pt-0 border-t border-neutral-200">
          <app-comment-section
            [entityType]="'simpleTask'"
            [macroTaskId]="macroTaskId()"
            [subTaskId]="subTaskId()"
            [simpleTaskId]="simpleTask().id!"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SimpleTaskItemComponent {
  private taskService = inject(TaskService);

  // Inputs
  simpleTask = input.required<SimpleTask>();
  macroTaskId = input.required<string>();
  subTaskId = input.required<string>();

  // Local state
  isEditing = signal(false);
  showComments = signal(false);

  toggleComments(): void {
    this.showComments.update(v => !v);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  async onToggleComplete(): Promise<void> {
    try {
      const newCompleted = !this.simpleTask().completed;
      await this.taskService.toggleSimpleTaskComplete(
        this.macroTaskId(),
        this.subTaskId(),
        this.simpleTask().id!,
        newCompleted
      );
    } catch (error) {
      console.error('Toggle complete error:', error);
    }
  }

  async onUpdate(data: { title: string; dueDate?: Date }): Promise<void> {
    try {
      await this.taskService.updateSimpleTask(
        this.macroTaskId(),
        this.subTaskId(),
        this.simpleTask().id!,
        data
      );
      this.isEditing.set(false);
    } catch (error) {
      console.error('Update simple task error:', error);
    }
  }

  async onDelete(): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) {
      return;
    }

    try {
      await this.taskService.deleteSimpleTask(
        this.macroTaskId(),
        this.subTaskId(),
        this.simpleTask().id!
      );
    } catch (error) {
      console.error('Delete simple task error:', error);
    }
  }
}
