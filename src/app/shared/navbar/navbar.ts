import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModalService } from '../../core/modal-service';
import { AuthService } from '../../core/auth-service';
@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styles: [`
    @keyframes dropdownSlide {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-dropdown {
      animation: dropdownSlide 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `],
})

export class Navbar {
  modal = inject(ModalService);
  auth = inject(AuthService);
  private host = inject(ElementRef);

  menuOpen = signal(false);

  initials = computed(() => {
    const u = this.auth.user();
    if (!u) return '';
    const source = u.fullName?.trim() || u.username;
    const parts = source.split(/\s+/);
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
  });

  displayName = computed(() => {
    const u = this.auth.user();
    return u ? u.fullName?.trim().split(/\s+/)[0] || u.username : '';
  });

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null) {
    if (!this.host.nativeElement.contains(target as Node)) this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.menuOpen.set(false);
  }

  logout() {
    this.menuOpen.set(false);
    this.auth.logout().subscribe({ error: () => {} });
  }
}