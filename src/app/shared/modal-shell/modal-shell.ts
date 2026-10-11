import { Component, HostListener, OnDestroy, OnInit, input, output, signal, computed } from '@angular/core';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  template: `
    <div
      [class]="backdropClasses()"
      (mousedown)="onMouseDown($event)"
      (click)="onClick($event)"
    >
      <div
        role="dialog"
        aria-modal="true"
        [class]="modalClasses()"
        (click)="$event.stopPropagation()"
      >
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
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
  
  maxWidth = input('max-w-[475px]');
  isClosing = signal(false);
  private mouseDownOnBackdrop = false;

  backdropClasses = computed(() => {
    const base = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm';
    const anim = this.isClosing() ? 'animate-backdrop-out' : 'animate-backdrop-in';
    return `${base} ${anim}`;
  });

  modalClasses = computed(() => {
    const base = 'relative max-h-full w-full overflow-y-auto rounded-4xl border border-[#2A2C3D] bg-[#050B1A] p-8 text-white';
    const anim = this.isClosing() ? 'animate-modal-out' : 'animate-modal-in';
    return `${base} ${this.maxWidth()} ${anim}`;
  });

  requestClose() {
    if (this.isClosing()) return;
    this.isClosing.set(true);
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