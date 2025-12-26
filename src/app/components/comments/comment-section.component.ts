import { Component, input, signal, inject, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Comment } from '../../models';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-comment-section',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h5 class="text-sm font-medium text-neutral-700">Comentarios</h5>
        <button
          (click)="showForm.set(!showForm())"
          class="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          {{ showForm() ? 'Cancelar' : '+ Agregar' }}
        </button>
      </div>

      <!-- Add Comment Form -->
      @if (showForm()) {
        <form [formGroup]="commentForm" (ngSubmit)="onSubmit()" class="space-y-2">
          <textarea
            formControlName="text"
            rows="3"
            placeholder="Escribe tu comentario..."
            class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            [class.border-danger-500]="textControl?.invalid && textControl?.touched"
          ></textarea>
          @if (textControl?.invalid && textControl?.touched) {
            <p class="text-xs text-danger-600">El comentario es requerido</p>
          }
          <div class="flex justify-end">
            <button
              type="submit"
              [disabled]="commentForm.invalid || isSaving()"
              class="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSaving() ? 'Guardando...' : 'Publicar' }}
            </button>
          </div>
        </form>
      }

      <!-- Comments List -->
      @if (comments().length > 0) {
        <div class="space-y-2 max-h-64 overflow-y-auto">
          @for (comment of comments(); track comment.id) {
            <div class="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
              <div class="flex justify-between items-start gap-2">
                <div class="flex-1 min-w-0">
                  @if (editingCommentId() === comment.id) {
                    <form [formGroup]="editForm" (ngSubmit)="onUpdate(comment.id!)" class="space-y-2">
                      <textarea
                        formControlName="text"
                        rows="2"
                        class="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      ></textarea>
                      <div class="flex gap-2">
                        <button
                          type="submit"
                          [disabled]="editForm.invalid"
                          class="px-2 py-1 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          (click)="cancelEdit()"
                          class="px-2 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  } @else {
                    <p class="text-sm text-neutral-900">{{ comment.text }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <p class="text-xs text-neutral-500">{{ comment.userEmail }}</p>
                      <span class="text-xs text-neutral-400">•</span>
                      <p class="text-xs text-neutral-500">{{ formatDate(comment.createdAt) }}</p>
                    </div>
                  }
                </div>

                @if (editingCommentId() !== comment.id && canEdit(comment)) {
                  <div class="flex gap-1 shrink-0">
                    <button
                      (click)="startEdit(comment)"
                      class="p-1 text-neutral-500 hover:text-primary-600 transition-colors"
                      aria-label="Editar comentario"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      (click)="onDelete(comment.id!)"
                      class="p-1 text-neutral-500 hover:text-danger-600 transition-colors"
                      aria-label="Eliminar comentario"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      } @else if (!showForm()) {
        <p class="text-xs text-neutral-500 text-center py-4">No hay comentarios aún</p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Custom scrollbar for comments list */
    .overflow-y-auto::-webkit-scrollbar {
      width: 6px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: var(--color-neutral-100);
      border-radius: var(--radius-full);
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: var(--color-neutral-300);
      border-radius: var(--radius-full);
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: var(--color-neutral-400);
    }
  `]
})
export class CommentSectionComponent implements OnInit, OnDestroy {
  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Inputs
  entityType = input.required<'macroTask' | 'subTask' | 'simpleTask'>();
  macroTaskId = input.required<string>();
  subTaskId = input<string>();
  simpleTaskId = input<string>();

  // Local state
  comments = signal<Comment[]>([]);
  showForm = signal(false);
  isSaving = signal(false);
  editingCommentId = signal<string | null>(null);

  commentForm = this.fb.nonNullable.group({
    text: ['', [Validators.required, Validators.minLength(1)]]
  });

  editForm = this.fb.nonNullable.group({
    text: ['', [Validators.required, Validators.minLength(1)]]
  });

  private unsubscribe?: () => void;

  get textControl() {
    return this.commentForm.get('text');
  }

  ngOnInit(): void {
    this.subscribeToComments();
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  private subscribeToComments(): void {
    const entityType = this.entityType();
    const macroTaskId = this.macroTaskId();

    if (entityType === 'macroTask') {
      this.unsubscribe = this.commentService.subscribeToMacroTaskComments(macroTaskId, (comments) => {
        this.comments.set(comments);
      });
    } else if (entityType === 'subTask') {
      const subTaskId = this.subTaskId();
      if (subTaskId) {
        this.unsubscribe = this.commentService.subscribeToSubTaskComments(
          macroTaskId,
          subTaskId,
          (comments) => {
            this.comments.set(comments);
          }
        );
      }
    } else if (entityType === 'simpleTask') {
      const subTaskId = this.subTaskId();
      const simpleTaskId = this.simpleTaskId();
      if (subTaskId && simpleTaskId) {
        this.unsubscribe = this.commentService.subscribeToSimpleTaskComments(
          macroTaskId,
          subTaskId,
          simpleTaskId,
          (comments) => {
            this.comments.set(comments);
          }
        );
      }
    }
  }

  async onSubmit(): Promise<void> {
    if (this.commentForm.invalid) return;

    this.isSaving.set(true);
    const { text } = this.commentForm.getRawValue();

    try {
      const entityType = this.entityType();
      const macroTaskId = this.macroTaskId();

      if (entityType === 'macroTask') {
        await this.commentService.addMacroTaskComment(macroTaskId, text);
      } else if (entityType === 'subTask') {
        const subTaskId = this.subTaskId();
        if (subTaskId) {
          await this.commentService.addSubTaskComment(macroTaskId, subTaskId, text);
        }
      } else if (entityType === 'simpleTask') {
        const subTaskId = this.subTaskId();
        const simpleTaskId = this.simpleTaskId();
        if (subTaskId && simpleTaskId) {
          await this.commentService.addSimpleTaskComment(macroTaskId, subTaskId, simpleTaskId, text);
        }
      }

      this.commentForm.reset();
      this.showForm.set(false);
    } catch (error) {
      console.error('Add comment error:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  startEdit(comment: Comment): void {
    this.editingCommentId.set(comment.id!);
    this.editForm.patchValue({ text: comment.text });
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editForm.reset();
  }

  async onUpdate(commentId: string): Promise<void> {
    if (this.editForm.invalid) return;

    const { text } = this.editForm.getRawValue();

    try {
      const entityType = this.entityType();
      const macroTaskId = this.macroTaskId();

      if (entityType === 'macroTask') {
        await this.commentService.updateMacroTaskComment(macroTaskId, commentId, text);
      } else if (entityType === 'subTask') {
        const subTaskId = this.subTaskId();
        if (subTaskId) {
          await this.commentService.updateSubTaskComment(macroTaskId, subTaskId, commentId, text);
        }
      } else if (entityType === 'simpleTask') {
        const subTaskId = this.subTaskId();
        const simpleTaskId = this.simpleTaskId();
        if (subTaskId && simpleTaskId) {
          await this.commentService.updateSimpleTaskComment(
            macroTaskId,
            subTaskId,
            simpleTaskId,
            commentId,
            text
          );
        }
      }

      this.cancelEdit();
    } catch (error) {
      console.error('Update comment error:', error);
    }
  }

  async onDelete(commentId: string): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) {
      return;
    }

    try {
      const entityType = this.entityType();
      const macroTaskId = this.macroTaskId();

      if (entityType === 'macroTask') {
        await this.commentService.deleteMacroTaskComment(macroTaskId, commentId);
      } else if (entityType === 'subTask') {
        const subTaskId = this.subTaskId();
        if (subTaskId) {
          await this.commentService.deleteSubTaskComment(macroTaskId, subTaskId, commentId);
        }
      } else if (entityType === 'simpleTask') {
        const subTaskId = this.subTaskId();
        const simpleTaskId = this.simpleTaskId();
        if (subTaskId && simpleTaskId) {
          await this.commentService.deleteSimpleTaskComment(
            macroTaskId,
            subTaskId,
            simpleTaskId,
            commentId
          );
        }
      }
    } catch (error) {
      console.error('Delete comment error:', error);
    }
  }

  canEdit(comment: Comment): boolean {
    const currentUser = this.authService.currentUser();
    return currentUser?.uid === comment.userId;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}
