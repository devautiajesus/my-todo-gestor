import { Component, input, signal, computed, inject, ChangeDetectionStrategy, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MacroTask, SubTask } from '../../models';
import { TaskService } from '../../services/task.service';
import { CommentService } from '../../services/comment.service';
import { TaskFormComponent } from './task-form.component';
import { CommentSectionComponent } from '../comments/comment-section.component';

@Component({
  selector: 'app-macro-task-item',
  imports: [CommonModule, TaskFormComponent, CommentSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-neutral-200 bg-primary-50">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            @if (isEditing()) {
              <app-task-form
                [level]="'macro'"
                [initialTitle]="macroTask().title"
                [initialDueDate]="macroTask().dueDate"
                [submitLabel]="'Actualizar'"
                (save)="onUpdate($event)"
                (cancel)="isEditing.set(false)"
              />
            } @else {
              <div>
                <h3 class="text-lg font-semibold text-neutral-900">{{ macroTask().title }}</h3>
                @if (macroTask().dueDate) {
                  <p class="text-sm text-neutral-600 mt-1">
                    Vence: {{ formatDate(macroTask().dueDate!) }}
                  </p>
                }
              </div>
            }
          </div>

          @if (!isEditing()) {
            <div class="flex gap-2 ml-4">
              <button
                (click)="toggleExpanded()"
                class="p-2 text-neutral-600 hover:text-primary-600 transition-colors"
                [attr.aria-label]="isExpanded() ? 'Contraer' : 'Expandir'"
              >
                <svg class="w-5 h-5 transition-transform" [class.rotate-180]="isExpanded()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                (click)="isEditing.set(true)"
                class="p-2 text-neutral-600 hover:text-primary-600 transition-colors"
                aria-label="Editar"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                (click)="onDelete()"
                class="p-2 text-neutral-600 hover:text-danger-600 transition-colors"
                aria-label="Eliminar"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Expanded Content -->
      @if (isExpanded()) {
        <div class="p-4 space-y-4">
          <!-- Add Sub Task -->
          <div>
            @if (showAddSubTask()) {
              <div class="bg-neutral-50 p-4 rounded-lg">
                <app-task-form
                  [level]="'sub'"
                  (save)="onCreateSubTask($event)"
                  (cancel)="showAddSubTask.set(false)"
                />
              </div>
            } @else {
              <button
                (click)="showAddSubTask.set(true)"
                class="w-full px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
              >
                + Agregar Sub Tarea
              </button>
            }
          </div>

          <!-- Sub Tasks List -->
          @if (subTasks().length > 0 && subTaskComponent()) {
            <div class="space-y-3 pl-4 border-l-2 border-primary-300">
              @for (subTask of subTasks(); track subTask.id) {
                <ng-container *ngComponentOutlet="subTaskComponent(); inputs: {subTask: subTask, macroTaskId: macroTask().id!}" />
              }
            </div>
          }

          <!-- Comments Section -->
          <div class="pt-4 border-t border-neutral-200">
            <app-comment-section
              [entityType]="'macroTask'"
              [macroTaskId]="macroTask().id!"
            />
          </div>
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
export class MacroTaskItemComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private ngZone = inject(NgZone);

  // Inputs
  macroTask = input.required<MacroTask>();

  // Local state
  isExpanded = signal(false);
  isEditing = signal(false);
  showAddSubTask = signal(false);
  subTasks = signal<SubTask[]>([]);
  subTaskComponent = signal<any>(null);

  private unsubscribe?: () => void;

  ngOnInit(): void {
    const macroTaskId = this.macroTask().id;
    if (macroTaskId) {
      this.unsubscribe = this.taskService.subscribeToSubTasks(macroTaskId, (subTasks) => {
        this.subTasks.set(subTasks);
      });
    }

    // Load SubTaskItemComponent lazily to avoid circular dependency
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        // @ts-ignore - Dynamic import
        import('./sub-task-item.component').then((m: any) => {
          this.ngZone.run(() => {
            this.subTaskComponent.set(m.SubTaskItemComponent);
          });
        }).catch((err: any) => {
          console.warn('Failed to lazy load sub-task component', err);
        });
      }, 0);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  toggleExpanded(): void {
    this.isExpanded.update(v => !v);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  async onUpdate(data: { title: string; dueDate?: Date }): Promise<void> {
    try {
      await this.taskService.updateMacroTask(this.macroTask().id!, data);
      this.isEditing.set(false);
    } catch (error) {
      console.error('Update macro task error:', error);
    }
  }

  async onDelete(): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar esta macro tarea y todas sus sub tareas?')) {
      return;
    }

    try {
      await this.taskService.deleteMacroTask(this.macroTask().id!);
    } catch (error) {
      console.error('Delete macro task error:', error);
    }
  }

  async onCreateSubTask(data: { title: string }): Promise<void> {
    try {
      await this.taskService.createSubTask(this.macroTask().id!, data.title);
      this.showAddSubTask.set(false);
    } catch (error) {
      console.error('Create sub task error:', error);
    }
  }
}
