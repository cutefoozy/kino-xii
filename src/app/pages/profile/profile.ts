import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth-service';
import { ModalService } from '../../core/modal-service';
import { ProfileService } from '../../core/profile-service';
import { TicketsService } from '../../core/tickets-service';
import { FilterOptionsService } from '../../core/filter-options-service';
import { applyServerErrors } from '../../core/server-errors';
import { Order, User } from '../../core/models';
import { FormField } from '../../shared/form-field/form-field';
import { ModalShell } from '../../shared/modal-shell/modal-shell';

const REFUND_CUTOFF_MS = 2 * 60 * 60 * 1000;

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, FormField, ModalShell],
  templateUrl: './profile.html',
})
export class Profile {
  auth = inject(AuthService);
  modal = inject(ModalService);
  filterOptions = inject(FilterOptionsService);
  private profileService = inject(ProfileService);
  private ticketsService = inject(TicketsService);

  tab = signal<'info' | 'tickets'>('info');
  ticketsTab = signal<'upcoming' | 'past'>('upcoming');

  saving = signal(false);
  saved = signal(false);
  saveError = signal<string | null>(null);

  form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    mobileNumber: new FormControl('', { nonNullable: true }),
    dateOfBirth: new FormControl('', { nonNullable: true }),
    preferredVenueId: new FormControl<number | null>(null),
  });

  orders = signal<Order[]>([]);
  ticketsLoading = signal(false);
  ticketsError = signal(false);
  upcoming = computed(() => this.orders().filter((o) => o.isUpcoming));
  past = computed(() => this.orders().filter((o) => !o.isUpcoming));
  visibleOrders = computed(() => (this.ticketsTab() === 'upcoming' ? this.upcoming() : this.past()));

  refundTarget = signal<Order | null>(null);
  refunding = signal(false);
  refundError = signal<string | null>(null);

  private ticketsRequested = false;

  constructor() {
    this.filterOptions.load();

    effect(() => {
      const u = this.auth.user();
      untracked(() => {
        if (u) {
          this.fill(u);
          if (!this.ticketsRequested) {
            this.ticketsRequested = true;
            this.loadTickets();
          }
        } else {
          this.ticketsRequested = false;
          this.orders.set([]);
        }
      });
    });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.saved.set(false));
  }

  private fill(u: User) {
    this.form.patchValue(
      {
        fullName: u.fullName ?? '',
        email: u.email,
        mobileNumber: u.mobileNumber ?? '',
        dateOfBirth: u.dateOfBirth ?? '',
        preferredVenueId: u.preferredVenue?.id ?? null,
      },
      { emitEvent: false },
    );
  }

  save() {
    if (this.saving()) return;
    this.saving.set(true);
    this.saved.set(false);
    this.saveError.set(null);

    const v = this.form.getRawValue();
    this.profileService
      .update({
        fullName: v.fullName,
        mobileNumber: v.mobileNumber,
        dateOfBirth: v.dateOfBirth,
        preferredVenueId: v.preferredVenueId,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.set(true);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          if (err.status === 422) applyServerErrors(this.form, err.error?.errors);
          else if (err.status !== 401) this.saveError.set('Something went wrong. Please try again.');
        },
      });
  }

  loadTickets() {
    this.ticketsLoading.set(true);
    this.ticketsError.set(false);
    this.ticketsService.list().subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.ticketsLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.ticketsLoading.set(false);
        if (err.status !== 401) this.ticketsError.set(true);
      },
    });
  }

  refundDeadline(order: Order) {
    return new Date(new Date(order.session.startsAt).getTime() - REFUND_CUTOFF_MS);
  }

  askRefund(order: Order) {
    this.refundError.set(null);
    this.refundTarget.set(order);
  }

  cancelRefund() {
    if (this.refunding()) return;
    this.refundTarget.set(null);
  }

  confirmRefund() {
    const order = this.refundTarget();
    if (!order || this.refunding()) return;
    this.refunding.set(true);
    this.refundError.set(null);

    this.ticketsService.refund(order.reference).subscribe({
      next: (res) => {
        this.orders.update((list) => list.map((o) => (o.id === res.data.id ? res.data : o)));
        this.refunding.set(false);
        this.refundTarget.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.refunding.set(false);
        if (err.status === 401) {
          this.refundTarget.set(null); 
          return;
        }
        this.refundError.set(err.error?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }
}