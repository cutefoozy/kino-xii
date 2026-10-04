import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Sessions } from './pages/sessions/sessions';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'sessions', component: Sessions },
  { path: '**', redirectTo: '' },
];