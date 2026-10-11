import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex flex-col gap-2">
      <label
        class="text-xs font-semibold"
        [class]="showInvalid() ? 'text-[#EC3013]' : 'text-white'"
      >
        {{ label() }}
      </label>

      <div class="relative">
        <input
          [type]="inputType()"
          [placeholder]="placeholder()"
          [formControl]="control()"
          [readOnly]="readonly()"
          (focus)="onFocus($event)"
          (blur)="onBlur()"
          class="h-10 w-full rounded-xl border bg-[#1E2031] px-4 pr-11 text-xs outline-none font-semibold transition-colors duration-300 ease-in-out [color-scheme:dark]"
          [class]="inputClass()"
        />

        @if (showIcons() && showValid()) {
          <img src="Valid.svg" alt="" class="absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2"/>
        }
        @if (showIcons() && showInvalid()) {
          <img src="Invalid.svg" alt="" class="absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2"/>
        }
      </div>

      @if (hint()) {
        <p class="text-xs text-[#A9A9A9]">{{ hint() }}</p>
      }

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
  hint = input('');
  readonly = input(false);
  showIcons = input(true);
  private dateFocused = signal(false);

  showInvalid() {
    const c = this.control();
    return c.invalid && c.touched;
  }

  showValid() {
    const c = this.control();
    return c.valid && c.touched;
  }

  inputClass() {
    if (this.readonly()) {
      return 'border-transparent text-white/60 cursor-not-allowed placeholder:text-[#A9A9A9]';
    }
    return this.showInvalid()
      ? 'border-[#EC3013] text-[#EC3013] placeholder:text-[#EC3013]'
      : 'border-transparent text-white placeholder:text-[#A9A9A9] hover:border-[#505261] hover:bg-white/15 focus:border-[#505261] focus:bg-[#1E2031]';
  }

  errorMessage() {
    const errs = this.control().errors;
    if (!errs) return '';
    if (typeof errs['server'] === 'string') return errs['server'];
    const key = Object.keys(errs).find((k) => this.errors()[k]);
    return key ? this.errors()[key] : '';
  }

  inputType() {
    if (this.type() === 'date' && !this.control().value && !this.dateFocused()) return 'text';
    return this.type();
  }

  onFocus(event: FocusEvent) {
    this.dateFocused.set(true);
    if (this.type() === 'date') {
      const input = event.target as HTMLInputElement;
      setTimeout(() => {
        try { input.showPicker(); } catch {}
      });
    }
  }

  onBlur() {
    this.dateFocused.set(false);
  }
}