import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-checkbox-option',
  template: `
    <button type="button" role="checkbox" [attr.aria-checked]="checked()" (click)="toggled.emit()"
      class="group flex w-full cursor-pointer select-none items-center gap-2.5 text-left outline-none">
      <span class="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition-colors"
        [class]="checked()
          ? 'border-none bg-[#EC3013]'
          : 'border-[#505261] bg-transparent group-hover:border-white/60'">
        @if (checked()) {
          <img src="Valid-White.svg" alt="" class="h-3 w-3" />
        } 
      </span>
      <span class="min-w-0 text-sm font-semibold text-white"><ng-content /></span>
    </button>
  `,
})
export class CheckboxOption {
  checked = input(false);
  toggled = output<void>();
}