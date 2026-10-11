import { Component, OnDestroy, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ModalShell } from '../modal-shell/modal-shell';
import { FormField } from '../form-field/form-field';
import { Order, Seat, SeatHold, SeatMap, Session, TicketType } from '../../core/models';
import { applyServerErrors } from '../../core/server-errors';
import { BookingService } from '../../core/booking-service';
import { AuthService } from '../../core/auth-service';
import { FilterOptionsService } from '../../core/filter-options-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-seat-modal',
  imports: [ReactiveFormsModule, ModalShell, FormField, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './seat-modal.html'
})
export class SeatModal implements OnInit, OnDestroy {
  sessionId = input.required<number>();
  closed = output<void>();

  private booking = inject(BookingService);
  private auth = inject(AuthService);
  private filterOptionsService = inject(FilterOptionsService);

  step = signal<1 | 2 | 3>(1);
  loading = signal(true);
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  session = signal<Session | null>(null);
  options = this.filterOptionsService.options;
  seatMap = signal<SeatMap | null>(null);
  
  selectedSeats = signal<{ seat: Seat; type: TicketType }[]>([]);
  
  hold = signal<SeatHold | null>(null);
  holdRemaining = signal<string>('08:00');
  private timerInterval: any;

  orderResult = signal<Order | null>(null);

  checkoutForm = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    mobileNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern('^5\\d{8}$')] }),
    cardNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(16), Validators.maxLength(16)] }),
    expiry: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])/\\d{2}$')] }),
    cvv: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(3)] })
  });

  subtotal = computed(() => {
    const basePrice = this.session()?.price || 0;
    return this.selectedSeats().reduce((sum, item) => sum + (basePrice * item.type.priceRatio), 0);
  });

  ngOnInit() {
    this.prefillForm();
    this.fetchData();
  }

  private prefillForm() {
    const user = this.auth.user();
    if (user) {
      this.checkoutForm.patchValue({
        fullName: user.fullName || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || ''
      });
    }
  }

  fetchData() {
    this.loading.set(true);
    
    this.filterOptionsService.load();
    
    Promise.all([
      this.booking.getSeats(this.sessionId()).toPromise(),
      this.booking.getSession(this.sessionId()).toPromise()
    ]).then(([mapRes, sessionRes]) => {
      if (mapRes?.data) this.seatMap.set(mapRes.data);
      if (sessionRes?.data) this.session.set(sessionRes.data);
      this.loading.set(false);
    }).catch(() => {
      this.errorMessage.set('Failed to load seat map. Please try again.');
      this.loading.set(false);
    });
  }

  toggleSeat(seat: Seat) {
    if (seat.state === 'sold' || seat.state === 'held' || seat.state === 'unavailable') return;

    const current = this.selectedSeats();
    const exists = current.find(s => s.seat.id === seat.id);

    if (exists) {
      this.selectedSeats.set(current.filter(s => s.seat.id !== seat.id));
      this.errorMessage.set(null);
    } else {
      const maxSeats = this.options()?.maxSeatsPerOrder || 3;
      if (current.length >= maxSeats) {
        this.errorMessage.set(`You can only select up to ${maxSeats} seats.`);
        return;
      }
      
      const defaultType = this.options()?.ticketTypes?.find(t => t.slug === 'adult');
      if (defaultType) {
        this.selectedSeats.set([...current, { seat, type: defaultType }]);
        this.errorMessage.set(null);
      }
    }
  }

  changeTicketType(seatId: number, typeSlug: string) {
    const type = this.options()?.ticketTypes?.find(t => t.slug === typeSlug);
    if (!type) return;

    const minAge = this.session()?.movie.ageRating.minAge || 0;
    if (type.blockedFromRatingAge && minAge >= type.blockedFromRatingAge) {
      this.errorMessage.set(`${type.name} tickets are not allowed for this film's age rating.`);
      return;
    }

    this.selectedSeats.update(seats => 
      seats.map(s => s.seat.id === seatId ? { ...s, type } : s)
    );
    this.errorMessage.set(null);
  }

  continueToCheckout() {
    if (this.selectedSeats().length === 0) return;
    
    this.submitting.set(true);
    const payload = this.selectedSeats().map(s => ({
      seatId: s.seat.id,
      ticketType: s.type.slug
    }));

    this.booking.holdSeats(this.sessionId(), payload).subscribe({
      next: (res) => {
        this.hold.set(res.data);
        this.startTimer(res.data.expiresAt);
        this.step.set(2);
        this.submitting.set(false);
        this.errorMessage.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 409) {
          const contested: string[] = err.error?.contested || [];
          this.errorMessage.set(err.error?.message || 'Some of those seats were just taken.');
          this.selectedSeats.update(seats => seats.filter(s => !contested.includes(s.seat.code)));
          this.fetchData();
        } else if (err.status === 422) {
          this.errorMessage.set(err.error?.message || 'Booking blocked by rules.');
        } else {
          this.errorMessage.set('An error occurred while holding seats.');
        }
      }
    });
  }

  startTimer(expiresAtStr: string) {
    this.clearTimer();
    const expiresAt = new Date(expiresAtStr).getTime();

    this.timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiresAt - now;

      if (distance <= 0) {
        this.expireHold();
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        this.holdRemaining.set(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
  }

  private expireHold() {
    this.clearTimer();
    this.step.set(1);
    this.selectedSeats.set([]);
    this.hold.set(null);
    this.errorMessage.set("Your hold time expired. Please re-select your seats.");
    this.fetchData();
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  completeCheckout() {
    if (this.checkoutForm.invalid || this.submitting()) return;
    this.submitting.set(true);
    
    const holdId = this.hold()?.holdId;
    if (!holdId) return;

    this.booking.completeOrder({ holdId, ...this.checkoutForm.getRawValue() }).subscribe({
      next: (res) => {
        this.clearTimer();
        this.orderResult.set(res.data);
        this.step.set(3);
        this.submitting.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 422 && err.error?.errors) {
          applyServerErrors(this.checkoutForm, err.error.errors);
        } else if (err.status === 422) {
          this.expireHold();
        } else if (err.status === 409) {
          this.errorMessage.set(err.error?.message || 'Seats were taken.');
          this.step.set(1);
          this.fetchData();
        } else {
          this.errorMessage.set('Payment failed. Please try again.');
        }
      }
    });
  }

  ngOnDestroy() {
    this.clearTimer();
    const activeHold = this.hold();
    if (this.step() === 2 && activeHold) {
      this.booking.releaseHold(activeHold.holdId).subscribe({ error: () => {} });
    }
  }
}