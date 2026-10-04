import { Injectable, inject } from '@angular/core';
import { Api } from './api';
import { ApiResponse, Movie } from './models';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  private api = inject(Api);

  featured() {
    return this.api.get<ApiResponse<Movie[]>>('/movies/featured');
  }

  nowPlaying() {
    return this.api.get<ApiResponse<Movie[]>>('/movies/now-playing');
  }

  comingSoon() {
    return this.api.get<ApiResponse<Movie[]>>('/movies/coming-soon');
  }
}