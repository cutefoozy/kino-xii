import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../../core/models';

@Component({
  selector: 'app-now-playing',
  imports: [RouterLink],
  templateUrl: './now-playing.html',
})
export class NowPlaying {
  movies = input.required<Movie[]>();
  canScrollLeft = signal(false);
  canScrollRight = signal(true);

  onScroll(el: HTMLElement) {
    this.canScrollLeft.set(el.scrollLeft > 15);
    const maxScroll = el.scrollWidth - el.clientWidth - 15;
    this.canScrollRight.set(el.scrollLeft < maxScroll);
  }

  scroll(el: HTMLElement, direction: 'left' | 'right') {
    const step = 1024;
    const amount = direction === 'right' ? step : -step;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }
}