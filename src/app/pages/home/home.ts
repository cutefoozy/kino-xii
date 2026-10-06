import { Component, inject, OnInit, signal } from '@angular/core';
import { MoviesService } from '../../core/movies';
import { Movie } from '../../core/models';
import { Hero } from './hero/hero';
import { NowPlaying } from './now-playing/now-playing';
import { ComingSoon } from './coming-soon/coming-soon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Hero, NowPlaying, ComingSoon],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private movies = inject(MoviesService);

  featured = signal<Movie[]>([]);
  nowPlaying = signal<Movie[]>([]);
  comingSoon = signal<Movie[]>([]);

  ngOnInit() {
    this.movies.featured().subscribe((res) => this.featured.set(res.data));
    this.movies.nowPlaying().subscribe((res) => this.nowPlaying.set(res.data));
    this.movies.comingSoon().subscribe((res) => this.comingSoon.set(res.data));
  }
}