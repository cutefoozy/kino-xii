import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Sessions } from './pages/sessions/sessions';
import { Profile } from './pages/profile/profile';
import { MovieDetail } from './pages/movie-detail/movie-detail';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'sessions', component: Sessions },
  { path: 'profile', component: Profile },
  { path: 'movies/:slug', component: MovieDetail },
];