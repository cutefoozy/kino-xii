import { Injectable, signal } from '@angular/core';

export type ModalType = 'login' | 'register';

@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly active = signal<ModalType | null>(null);

  open(type: ModalType) {
    this.active.set(type);
  }

  close() {
    this.active.set(null);
  }
}