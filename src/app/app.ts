import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';
import { LoginModal } from './shared/login-modal/login-modal';
import { RegisterModal } from './shared/register-modal/register-modal';
import { ModalService } from './core/modal-service';
import { AuthService } from './core/auth-service';
import { ModalShell } from './shared/modal-shell/modal-shell';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, LoginModal, RegisterModal, ModalShell],
  templateUrl: './app.html',
})
export class App {
  modal = inject(ModalService);

  constructor() {
    inject(AuthService).restore();
  }
}