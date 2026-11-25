export type VenueCategory = 'tienda' | 'estudio' | 'escuela';

export type ItemType = 'instrumento' | 'clase' | 'servicio';

export interface CatalogItem {
  id: string;
  venueId?: string;
  itemType: ItemType;
  name: string;
  brandOrLevel: string;
  price: number;
  currency: string;
  billingUnit: string;
  description: string;
}

export interface Venue {
  id: string;
  name: string;
  category: VenueCategory;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  items: CatalogItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalogItemInput {
  id?: string;
  itemType: ItemType;
  name: string;
  brandOrLevel: string;
  price: number;
  currency: string;
  billingUnit: string;
  description: string;
}

export interface VenueInput {
  name: string;
  category: VenueCategory;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  items: CatalogItemInput[];
}

export interface CatalogFilters {
  category: VenueCategory | 'todas';
  itemType: ItemType | 'todos';
  query: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
