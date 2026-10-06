import { Component, OnDestroy, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { FormField } from '../form-field/form-field';
import { ModalService } from '../../core/modal-service';
import { HttpErrorResponse } from '@angular/common/http';
import { applyServerErrors } from '../../core/server-errors';
import { AuthService } from '../../core/auth-service';

function matchPassword(control: AbstractControl): ValidationErrors | null {
  const password = control.parent?.get('password')?.value;
  return control.value === password ? null : { mismatch: true };
}

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormField],
  template: `
    <h2 class="text-xl font-extrabold">Sign up</h2>
    <p class="mt-2 text-xs text-[#A9A9A9]">Welcome to Kino XII</p>

    <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 flex flex-col gap-8" novalidate>
      <div class="flex items-center gap-4">
        <label class="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[10px] bg-[#FFFFFF]/10">
          @if (avatarPreview()) {
            <img [src]="avatarPreview()" alt="" class="h-full w-full object-cover"/>
          } @else {
            <img src="Upload.svg" alt=""/>
          }
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="hidden"
            (change)="onAvatarSelected($event)"
          />
        </label>
        <div>
          <p class="text-sm font-extrabold">Upload avatar (optional)</p>
          <p class="text-xs text-[#A9A9A9]">JPG, PNG or WEBP</p>
        </div>
      </div>
      @if (avatarError()) {
        <p class="-mt-3 text-xs text-[#EC3013]">{{ avatarError() }}</p>
      }

      <app-form-field
        label="Username"
        placeholder="User"
        [control]="form.controls.username"
        [errors]="{ required: 'Username is required', minlength: 'At least 3 characters' }"
      />

      <app-form-field
        label="Email"
        type="email"
        placeholder="example@gmail.com"
        [control]="form.controls.email"
        [errors]="{ required: 'Email is required', email: 'Enter a valid email' }"
      />

      <div class="grid grid-cols-2 items-start gap-3">
        <app-form-field
          label="Password"
          type="password"
          placeholder="••••••••"
          [control]="form.controls.password"
          [errors]="{ required: 'Password is required', minlength: 'At least 3 characters' }"
        />
        <app-form-field
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          [control]="form.controls.confirmPassword"
          [errors]="{ required: 'Confirm your password', minlength: 'At least 3 characters', mismatch: 'Passwords do not match' }"
        />
      </div>

      <button
        type="submit"
        [disabled]="form.invalid || loading()"
        class="h-10 rounded-full bg-[#EC3013] font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#505261] disabled:text-[#A9A9A9] cursor-pointer"
      >
        Sign up
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-[#A9A9A9]">
      Already have an account?
      <button type="button" class="font-extrabold text-[#EC3013] cursor-pointer" (click)="modal.open('login')">
        Log in
      </button>
    </p>
  `,
})
export class RegisterModal implements OnDestroy {
  modal = inject(ModalService);
  loading = signal(false);
  auth = inject(AuthService);
  
  serverError = signal<string | null>(null);
  avatarFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);
  avatarError = signal<string | null>(null);

  form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    confirmPassword: new FormControl('', { 
      nonNullable: true, 
      validators: [Validators.required, Validators.minLength(3), matchPassword] 
    }),
  });

  constructor() {
    this.form.controls.password.valueChanges.subscribe(() =>
      this.form.controls.confirmPassword.updateValueAndValidity(),
    );
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.avatarError.set('Only JPG, PNG or WEBP files are allowed');
      input.value = '';
      return;
    }

    this.avatarError.set(null);
    this.avatarFile.set(file);

    const old = this.avatarPreview();
    if (old) URL.revokeObjectURL(old);
    this.avatarPreview.set(URL.createObjectURL(file));
  }

  submit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.serverError.set(null);

    const v = this.form.getRawValue();
    const body = new FormData();
    body.append('username', v.username);
    body.append('email', v.email);
    body.append('password', v.password);
    body.append('password_confirmation', v.confirmPassword);
    const avatar = this.avatarFile();
    if (avatar) body.append('avatar', avatar);

    this.auth.register(body).subscribe({
      next: () => {
        this.loading.set(false);
        this.modal.close();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 422) applyServerErrors(this.form, err.error?.errors);
        this.serverError.set(err.error?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }

  ngOnDestroy() {
    const url = this.avatarPreview();
    if (url) URL.revokeObjectURL(url);
  }
}