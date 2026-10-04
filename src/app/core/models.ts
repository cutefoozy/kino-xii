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