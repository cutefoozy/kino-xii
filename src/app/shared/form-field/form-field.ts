import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex flex-col gap-2">
      <label
        class="text-sm font-semibold"
        [class]="showInvalid() ? 'text-[#EC3013]' : 'text-white'"
      >
        {{ label() }}
      </label>

      <div class="relative">
        <input
          [type]="type()"
          [placeholder]="placeholder()"
          [formControl]="control()"
          class="h-10 w-full rounded-xl border bg-[#1E2031] px-4 pr-11 text-xs outline-none font-semibold"
          [class]="showInvalid() ? 'border-[#EC3013] text-[#EC3013] placeholder:text-[#EC3013]' : 'border-transparent text-white placeholder:text-[#A9A9A9]'"
        />

        @if (showValid()) {
          <img src="Valid.svg" alt="" class="absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2"/>
        }
        @if (showInvalid()) {
          <img src="Invalid.svg" alt="" class="absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2"/>
        }
      </div>

      @if (showInvalid()) {
        <p class="text-xs font-semibold text-[#EC3013]">{{ errorMessage() }}</p>
      }
    </div>
  `,
})
export class FormField {
  label = input.required<string>();
  control = input.required<FormControl>();
  type = input('text');
  placeholder = input('');
  errors = input<Record<string, string>>({});

  showInvalid() {
    const c = this.control();
    return c.invalid && c.touched;
  }

  showValid() {
    const c = this.control();
    return c.valid && c.touched;
  }

  errorMessage() {
    const errs = this.control().errors;
    if (!errs) return '';
    if (typeof errs['server'] === 'string') return errs['server'];
    const key = Object.keys(errs).find((k) => this.errors()[k]);
    return key ? this.errors()[key] : '';
  }
}