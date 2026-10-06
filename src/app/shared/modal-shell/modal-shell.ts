import { Component, HostListener, OnDestroy, OnInit, output, signal } from '@angular/core';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      [class]="isClosing() ? 'animate-backdrop-out' : 'animate-backdrop-in'"
      (mousedown)="onMouseDown($event)"
      (click)="onClick($event)"
    >
      <div
        role="dialog"
        aria-modal="true"
        class="relative max-h-full w-full max-w-[475px] overflow-y-auto rounded-4xl border border-[#2A2C3D] bg-[#070C1C] p-8 text-white"
        [class]="isClosing() ? 'animate-modal-out' : 'animate-modal-in'"
        (click)="$event.stopPropagation()"
      >
        <button
          type="button"
          aria-label="Close"
          class="absolute right-9 top-9 cursor-pointer transition-opacity hover:opacity-80"
          (click)="requestClose()"
        >
          <img src="X.svg" alt=""/>
        </button>
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    /* Entrance */
    @keyframes backdropIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modalIn {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Exit */
    @keyframes backdropOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes modalOut {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.96);
      }
    }

    .animate-backdrop-in {
      animation: backdropIn 180ms ease-out forwards;
    }
    .animate-backdrop-out {
      animation: backdropOut 140ms ease-in forwards;
    }

    .animate-modal-in {
      animation: modalIn 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-modal-out {
      animation: modalOut 140ms ease-in forwards;
    }
  `],
})
export class ModalShell implements OnInit, OnDestroy {
  closed = output<void>();
  isClosing = signal(false);
  private mouseDownOnBackdrop = false;

  requestClose() {
    if (this.isClosing()) return;
    this.isClosing.set(true);
    // Wait for the 140ms exit animation to complete before removing from DOM
    setTimeout(() => {
      this.closed.emit();
    }, 140);
  }

  onMouseDown(event: MouseEvent) {
    this.mouseDownOnBackdrop = event.target === event.currentTarget;
  }

  onClick(event: MouseEvent) {
    if (this.mouseDownOnBackdrop && event.target === event.currentTarget) {
      this.requestClose();
    }
    this.mouseDownOnBackdrop = false;
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.requestClose();
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }
}