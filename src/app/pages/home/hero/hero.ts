import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../../core/models';
import { DatePipe } from '@angular/common';

const slide_time = 5000;

@Component({
  selector: 'app-hero',
  imports: [RouterLink, DatePipe],
  templateUrl: './hero.html',
})
export class Hero {
  movies = input.required<Movie[]>();
  current = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    this.startTimer();
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
  }

  private move(index: number) {
    const length = this.movies().length;
    if (!length) return;
    this.current.set((index + length) % length);
  }

  private startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.move(this.current() + 1), slide_time);
  }

  next() {
    this.move(this.current() + 1);
    this.startTimer();
  }

  prev() {
    this.move(this.current() - 1);
    this.startTimer();
  }

  go(index: number) {
    this.move(index);
    this.startTimer();
  }
}