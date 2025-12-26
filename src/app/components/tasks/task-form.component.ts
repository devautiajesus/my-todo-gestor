import { Component, input, output, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-form',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <label [for]="'title-' + formId()" class="block text-sm font-medium text-neutral-700">
          Título {{ levelLabel() }}
        </label>
        <input
          [id]="'title-' + formId()"
          type="text"
          formControlName="title"
          placeholder="Ingresa el título..."
          class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          [class.border-danger-500]="titleControl?.invalid && titleControl?.touched"
        />
        @if (titleControl?.invalid && titleControl?.touched) {
          <p class="mt-1 text-sm text-danger-600">El título es requerido</p>
        }
      </div>

      @if (showDueDate()) {
        <div>
          <label [for]="'dueDate-' + formId()" class="block text-sm font-medium text-neutral-700">
            Fecha de vencimiento (opcional)
          </label>
          <input
            [id]="'dueDate-' + formId()"
            type="date"
            formControlName="dueDate"
            class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      }

      <div class="flex gap-2 justify-end">
        <button
          type="button"
          (click)="cancel.emit()"
          class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          [disabled]="form.invalid"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitLabel() }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TaskFormComponent implements OnInit {
  private fb = new FormBuilder();

  // Inputs
  level = input.required<'macro' | 'sub' | 'simple'>();
  initialTitle = input<string>('');
  initialDueDate = input<Date | undefined>(undefined);
  submitLabel = input<string>('Guardar');

  // Outputs
  save = output<{ title: string; dueDate?: Date }>();
  cancel = output<void>();

  // Computed
  showDueDate = signal(false);
  formId = signal(Math.random().toString(36).substring(7));

  form = this.fb.nonNullable.group({
    title: [this.initialTitle(), [Validators.required]],
    dueDate: ['']
  });

  constructor() {
    // Show due date field for macro and simple tasks - use effect to respond to input changes
  }

  ngOnInit(): void {
    const level = this.level();
    this.showDueDate.set(level === 'macro' || level === 'simple');

    // Set initial date if provided
    const initialDate = this.initialDueDate();
    if (initialDate) {
      const dateString = initialDate.toISOString().split('T')[0];
      this.form.patchValue({ dueDate: dateString });
    }
  }

  get titleControl() {
    return this.form.get('title');
  }

  levelLabel(): string {
    const level = this.level();
    if (level === 'macro') return '(Macro Tarea)';
    if (level === 'sub') return '(Sub Tarea)';
    return '(Tarea Simple)';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const { title, dueDate } = this.form.getRawValue();
    const dueDateObj = dueDate ? new Date(dueDate) : undefined;

    this.save.emit({ title, dueDate: dueDateObj });
    this.form.reset();
  }
}
