import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalService } from '../../core/modal-service';
import { FormField } from '../form-field/form-field';
import { AuthService } from '../../core/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { applyServerErrors } from '../../core/server-errors';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormField],
  template: `
    <h2 class="text-xl font-extrabold">Log in</h2>
    <p class="mt-2 text-xs text-[#A9A9A9]">Welcome back to Kino XII</p>

    <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 flex flex-col gap-6" novalidate>
      <app-form-field
        label="Email"
        type="email"
        placeholder="example@gmail.com"
        [control]="form.controls.email"
        [errors]="{ required: 'Email is required', email: 'Enter a valid email' }"
      />

      <app-form-field
        label="Password"
        type="password"
        placeholder="••••••••"
        [control]="form.controls.password"
        [errors]="{ required: 'Password is required', minlength: 'At least 3 characters' }"
      />
      
      <button
        type="submit"
        [disabled]="!canSubmit() || loading()"
        class="h-[42px] rounded-full bg-[#EC3013] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#505261] disabled:text-[#A9A9A9] cursor-pointer"
      >
        Log in
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-[#A9A9A9]">
      Don't have an account?
      <button type="button" class="font-extrabold text-[#EC3013] cursor-pointer" (click)="modal.open('register')">
        Sign up
      </button>
    </p>
  `,
})
export class LoginModal {
  modal = inject(ModalService);
  auth = inject(AuthService);
  loading = signal(false);

  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
  });

  canSubmit() {
    return Object.values(this.form.controls).every((c) => {
      const keys = Object.keys(c.errors ?? {});
      return keys.length === 0 || (keys.length === 1 && keys[0] === 'server');
    });
  }

  submit() {
    if (this.loading()) return;

    Object.values(this.form.controls).forEach((c) => c.updateValueAndValidity());
    if (this.form.invalid) return;

    this.loading.set(true);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.modal.close();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);

        if (err.status === 422) {
          applyServerErrors(this.form, err.error?.errors);
        } else {
          const password = this.form.controls.password;
          password.setErrors({ server: err.error?.message ?? 'Something went wrong. Please try again.' });
          password.markAsTouched();
        }
      },
    });
  }
}