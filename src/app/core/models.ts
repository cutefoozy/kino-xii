export interface ApiResponse<T> {
  data: T;
}

export interface AgeRating {
  code: string;
  minAge: number;
  description: string;
}

export interface Genre {
  id: number;
  slug: string;
  name: string;
}

export interface Format {
  id: number;
  slug: string;
  name: string;
  priceUplift: number;
}

export interface Movie {
  id: number;
  slug: string;
  title: string;
  kind: string;
  runtimeMinutes: number;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  isComingSoon: boolean;
  isNotified: boolean;
  isFeatured: boolean;
  fromPrice: number | null;
  ageRating: AgeRating;
  genres: Genre[];
  formats: Format[];
  synopsis: string;
  director?: string | null;
  cast?: string | null;
  availableDates?: string[];
}

export interface PreferredVenue {
  id: number;
  slug: string;
  name: string;
  city: string;
  formats: Format[];
}

export type Venue = PreferredVenue;

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  fullName: string | null;
  mobileNumber: string | null;
  dateOfBirth: string | null;
  age: number | null;
  preferredVenue: PreferredVenue | null;
  profileComplete: boolean;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface Language {
  id: number;
  slug: string;
  name: string;
  code: string;
}

export interface Hall {
  id: number;
  name: string;
}

export interface Session {
  id: number;
  startsAt: string;
  date: string;
  time: string;
  timeBand?: 'morning' | 'afternoon' | 'evening';
  price?: number;
  seatsLeft?: number;
  isSoldOut?: boolean;
  hall: Hall;
  venue: PreferredVenue;
  format: Format;
  language: Language;
  movie: Movie;
}

export interface OrderTicket {
  id: number;
  seatCode: string;
  ticketType: { slug: string; name: string };
  price: number;
}

export interface Order {
  id: number;
  reference: string;
  status: 'paid' | 'refunded';
  totalPrice: number;
  paidAt: string;
  refundedAt: string | null;
  isUpcoming: boolean;
  isRefundable: boolean;
  cardLastFour: string;
  contact: { fullName: string; email: string; mobileNumber: string };
  session: Session;
  tickets: OrderTicket[];
}

export interface TimeBand {
  id: string;
  label: string;
  hint?: string;
}

export interface SortOption {
  id: string;
  label: string;
}

export interface TicketType {
  id: number;
  slug: 'adult' | 'child' | 'student';
  name: string;
  priceRatio: number;
  note: string | null;
  blockedFromRatingAge: number | null;
}

export interface FilterOptions {
  venues: PreferredVenue[];
  formats?: Format[];
  languages?: Language[];
  timeBands?: TimeBand[];
  sorts?: SortOption[];
  ticketTypes?: TicketType[];
  ageRatings?: AgeRating[];
  maxSeatsPerOrder: number;
  holdMinutes: number;
}

export interface MovieSessionGroup {
  movie: Movie;
  sessions: Session[];
}

export interface SessionsMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  totalSessions: number;
  totalMovies: number;
  date: string;
}

export interface SessionsResponse {
  data: MovieSessionGroup[];
  meta: SessionsMeta;
}

export interface Seat {
  id: number;
  code: string;
  label: string;
  state: 'available' | 'sold' | 'held' | 'unavailable';
  aisleAfter: boolean;
  isMine: boolean;
}

export interface SeatRow {
  label: string;
  seats: Seat[];
}

export interface SeatSection {
  name: string;
  rows: SeatRow[];
}

export interface SeatMap {
  sessionId: number;
  hall: {
    id: number;
    name: string;
    venue: PreferredVenue;
  };
  sections: SeatSection[];
}

export interface HeldSeatItem {
  seatId: number;
  code: string;
  ticketType: {
    slug: string;
    name: string;
  };
  price: number;
}

export interface SeatHold {
  holdId: string;
  sessionId: number;
  expiresAt: string;
  secondsRemaining: number;
  isLive: boolean;
  subtotal: number;
  seats: HeldSeatItem[];
}

export interface VenueSessions {
  venue: PreferredVenue;
  sessions: Session[];
}

export interface NotifyResult {
  movieId: number;
  subscribed: boolean;
}