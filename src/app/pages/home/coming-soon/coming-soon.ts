import { Component, input, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Movie } from '../../../core/models';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './coming-soon.html',
})
export class ComingSoon {
  movies = input<Movie[]>([]);

  canScrollLeft = signal<boolean>(false);
  canScrollRight = signal<boolean>(true);

  onScroll(el: HTMLElement) {
    this.canScrollLeft.set(el.scrollLeft > 15);
    const maxScroll = el.scrollWidth - el.clientWidth - 15;
    this.canScrollRight.set(el.scrollLeft < maxScroll);
  }

  scroll(el: HTMLElement, direction: 'left' | 'right') {
    // Scrolls by 2 wide cards (470px + 24px gap = 494px * 2 = 988px)
    const amount = direction === 'right' ? 988 : -988;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }

  toggleNotify(movie: Movie) {
    movie.isNotified = !movie.isNotified;
  }
}