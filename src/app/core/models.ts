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
}

export interface PreferredVenue {
  id: number;
  slug: string;
  name: string;
  city: string;
  formats: Format[];
}

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