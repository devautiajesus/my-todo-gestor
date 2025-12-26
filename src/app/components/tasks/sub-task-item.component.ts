import { Component, input, signal, inject, ChangeDetectionStrategy, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubTask, SimpleTask } from '../../models';
import { TaskService } from '../../services/task.service';
import { TaskFormComponent } from './task-form.component';
import { CommentSectionComponent } from '../comments/comment-section.component';

@Component({
  selector: 'app-sub-task-item',
  imports: [CommonModule, TaskFormComponent, CommentSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden">
      <!-- Header -->
      <div class="p-3 bg-secondary-50 border-b border-neutral-200">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            @if (isEditing()) {
              <app-task-form
                [level]="'sub'"
                [initialTitle]="subTask().title"
                [submitLabel]="'Actualizar'"
                (save)="onUpdate($event)"
                (cancel)="isEditing.set(false)"
              />
            } @else {
              <div class="flex items-center gap-2">
                <button
                  (click)="toggleExpanded()"
                  class="p-1 text-neutral-600 hover:text-secondary-600 transition-colors"
                  [attr.aria-label]="isExpanded() ? 'Contraer' : 'Expandir'"
                >
                  <svg class="w-4 h-4 transition-transform" [class.rotate-90]="isExpanded()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <h4 class="text-base font-medium text-neutral-900">{{ subTask().title }}</h4>
              </div>
            }
          </div>

          @if (!isEditing()) {
            <div class="flex gap-2 ml-4">
              <button
                (click)="isEditing.set(true)"
                class="p-1.5 text-neutral-600 hover:text-secondary-600 transition-colors"
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

      <!-- Expanded Content -->
      @if (isExpanded()) {
        <div class="p-3 space-y-3">
          <!-- Add Simple Task -->
          <div>
            @if (showAddSimpleTask()) {
              <div class="bg-white p-3 rounded-lg border border-neutral-200">
                <app-task-form
                  [level]="'simple'"
                  (save)="onCreateSimpleTask($event)"
                  (cancel)="showAddSimpleTask.set(false)"
                />
              </div>
            } @else {
              <button
                (click)="showAddSimpleTask.set(true)"
                class="w-full px-3 py-2 text-sm font-medium text-secondary-700 bg-secondary-50 border border-secondary-200 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                + Agregar Tarea Simple
              </button>
            }
          </div>

          <!-- Simple Tasks List -->
          @if (simpleTasks().length > 0 && simpleTaskComponent()) {
            <div class="space-y-2 pl-3 border-l-2 border-secondary-300">
              @for (simpleTask of simpleTasks(); track simpleTask.id) {
                <ng-container *ngComponentOutlet="simpleTaskComponent(); inputs: {simpleTask: simpleTask, macroTaskId: macroTaskId(), subTaskId: subTask().id!}" />
              }
            </div>
          }

          <!-- Comments Section -->
          <div class="pt-3 border-t border-neutral-200">
            <app-comment-section
              [entityType]="'subTask'"
              [macroTaskId]="macroTaskId()"
              [subTaskId]="subTask().id!"
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
export class SubTaskItemComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private ngZone = inject(NgZone);

  // Inputs
  subTask = input.required<SubTask>();
  macroTaskId = input.required<string>();

  // Local state
  isExpanded = signal(false);
  isEditing = signal(false);
  showAddSimpleTask = signal(false);
  simpleTasks = signal<SimpleTask[]>([]);
  simpleTaskComponent = signal<any>(null);

  private unsubscribe?: () => void;

  ngOnInit(): void {
    const macroTaskId = this.macroTaskId();
    const subTaskId = this.subTask().id;

    if (macroTaskId && subTaskId) {
      this.unsubscribe = this.taskService.subscribeToSimpleTasks(macroTaskId, subTaskId, (simpleTasks) => {
        this.simpleTasks.set(simpleTasks);
      });
    }

    // Load SimpleTaskItemComponent lazily to avoid circular dependency
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        // @ts-ignore - Dynamic import
        import('./simple-task-item.component').then((m: any) => {
          this.ngZone.run(() => {
            this.simpleTaskComponent.set(m.SimpleTaskItemComponent);
          });
        }).catch((err: any) => {
          console.warn('Failed to lazy load simple-task component', err);
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

  async onUpdate(data: { title: string }): Promise<void> {
    try {
      await this.taskService.updateSubTask(this.macroTaskId(), this.subTask().id!, data);
      this.isEditing.set(false);
    } catch (error) {
      console.error('Update sub task error:', error);
    }
  }

  async onDelete(): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar esta sub tarea y todas sus tareas simples?')) {
      return;
    }

    try {
      await this.taskService.deleteSubTask(this.macroTaskId(), this.subTask().id!);
    } catch (error) {
      console.error('Delete sub task error:', error);
    }
  }

  async onCreateSimpleTask(data: { title: string; dueDate?: Date }): Promise<void> {
    try {
      await this.taskService.createSimpleTask(
        this.macroTaskId(),
        this.subTask().id!,
        data.title,
        data.dueDate
      );
      this.showAddSimpleTask.set(false);
    } catch (error) {
      console.error('Create simple task error:', error);
    }
  }
}
