import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { SEED_VENUES, VENUE_IMAGES } from '../shared/seedData.ts';
import type { CatalogItem, Venue, VenueCategory, VenueInput } from '../shared/types.ts';

interface DbVenueRow {
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
  image_url: string;
  created_at?: string;
  updated_at?: string;
  catalog_items?: DbCatalogItemRow[];
}

interface DbCatalogItemRow {
  id: string;
  venue_id: string;
  item_type: 'instrumento' | 'clase' | 'servicio';
  name: string;
  brand_or_level: string;
  price: number;
  currency: string;
  billing_unit: string;
  description: string;
}

const LOCAL_DATA_FILE = path.resolve(process.cwd(), 'data', 'catalog.json');

function defaultImageForCategory(category: VenueCategory): string {
  switch (category) {
    case 'tienda':
      return VENUE_IMAGES.tienda;
    case 'estudio':
      return VENUE_IMAGES.estudio;
    case 'escuela':
      return VENUE_IMAGES.escuela;
  }
}

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getStorageMode(): 'supabase' | 'local' {
  return getSupabaseClient() ? 'supabase' : 'local';
}

function mapDbRowToVenue(row: DbVenueRow): Venue {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description || '',
    address: row.address,
    city: row.city || 'Ciudad de México',
    phone: row.phone || '',
    email: row.email || '',
    website: row.website || '',
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    imageUrl: row.image_url || defaultImageForCategory(row.category),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.catalog_items || []).map((item) => ({
      id: item.id,
      venueId: item.venue_id,
      itemType: item.item_type,
      name: item.name,
      brandOrLevel: item.brand_or_level || '',
      price: Number(item.price),
      currency: item.currency || 'MXN',
      billingUnit: item.billing_unit || 'unidad',
      description: item.description || '',
    })),
  };
}

function readLocalVenues(): Venue[] {
  const dir = path.dirname(LOCAL_DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DATA_FILE)) {
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(SEED_VENUES, null, 2), 'utf-8');
    return structuredClone(SEED_VENUES);
  }
  try {
    const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : structuredClone(SEED_VENUES);
  } catch {
    return structuredClone(SEED_VENUES);
  }
}

function writeLocalVenues(venues: Venue[]): void {
  const dir = path.dirname(LOCAL_DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(venues, null, 2), 'utf-8');
}

async function seedSupabaseIfEmpty(client: SupabaseClient): Promise<void> {
  const { count, error } = await client
    .from('venues')
    .select('id', { count: 'exact', head: true });

  if (error || (count ?? 0) > 0) {
    return;
  }

  for (const venue of SEED_VENUES) {
    const { error: venueError } = await client.from('venues').insert({
      id: venue.id,
      name: venue.name,
      category: venue.category,
      description: venue.description,
      address: venue.address,
      city: venue.city,
      phone: venue.phone,
      email: venue.email,
      website: venue.website,
      latitude: venue.latitude,
      longitude: venue.longitude,
      image_url: venue.imageUrl,
    });

    if (venueError) {
      console.error('Error al sembrar local en Supabase:', venueError.message);
      continue;
    }

    if (venue.items.length > 0) {
      const { error: itemsError } = await client.from('catalog_items').insert(
        venue.items.map((item) => ({
          id: item.id,
          venue_id: venue.id,
          item_type: item.itemType,
          name: item.name,
          brand_or_level: item.brandOrLevel,
          price: item.price,
          currency: item.currency,
          billing_unit: item.billingUnit,
          description: item.description,
        }))
      );
      if (itemsError) {
        console.error('Error al sembrar catálogo en Supabase:', itemsError.message);
      }
    }
  }
}

export async function listVenues(): Promise<Venue[]> {
  const client = getSupabaseClient();
  if (!client) {
    return readLocalVenues();
  }

  await seedSupabaseIfEmpty(client);
  const { data, error } = await client
    .from('venues')
    .select('*, catalog_items(*)')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Error al consultar Supabase: ${error.message}`);
  }

  return (data as DbVenueRow[]).map(mapDbRowToVenue);
}

export async function getVenueById(id: string): Promise<Venue | null> {
  const client = getSupabaseClient();
  if (!client) {
    const venues = readLocalVenues();
    return venues.find((v) => v.id === id) || null;
  }

  const { data, error } = await client
    .from('venues')
    .select('*, catalog_items(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al consultar local en Supabase: ${error.message}`);
  }

  return data ? mapDbRowToVenue(data as DbVenueRow) : null;
}

export async function createVenue(input: VenueInput): Promise<Venue> {
  const imageUrl = input.imageUrl?.trim() || defaultImageForCategory(input.category);
  const client = getSupabaseClient();

  if (!client) {
    const venues = readLocalVenues();
    const id = randomUUID();
    const now = new Date().toISOString();
    const created: Venue = {
      id,
      name: input.name,
      category: input.category,
      description: input.description,
      address: input.address,
      city: input.city,
      phone: input.phone,
      email: input.email,
      website: input.website || '',
      latitude: input.latitude,
      longitude: input.longitude,
      imageUrl,
      createdAt: now,
      updatedAt: now,
      items: input.items.map<CatalogItem>((item) => ({
        id: randomUUID(),
        venueId: id,
        itemType: item.itemType,
        name: item.name,
        brandOrLevel: item.brandOrLevel,
        price: item.price,
        currency: item.currency,
        billingUnit: item.billingUnit,
        description: item.description,
      })),
    };
    venues.push(created);
    writeLocalVenues(venues);
    return created;
  }

  const { data: venueData, error: venueError } = await client
    .from('venues')
    .insert({
      name: input.name,
      category: input.category,
      description: input.description,
      address: input.address,
      city: input.city,
      phone: input.phone,
      email: input.email,
      website: input.website || '',
      latitude: input.latitude,
      longitude: input.longitude,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (venueError || !venueData) {
    throw new Error(`Error al registrar local en Supabase: ${venueError?.message}`);
  }

  if (input.items.length > 0) {
    const { error: itemsError } = await client.from('catalog_items').insert(
      input.items.map((item) => ({
        venue_id: venueData.id,
        item_type: item.itemType,
        name: item.name,
        brand_or_level: item.brandOrLevel,
        price: item.price,
        currency: item.currency,
        billing_unit: item.billingUnit,
        description: item.description,
      }))
    );

    if (itemsError) {
      throw new Error(`Error al guardar elementos del catálogo: ${itemsError.message}`);
    }
  }

  const created = await getVenueById(venueData.id);
  if (!created) {
    throw new Error('No se pudo recuperar el local recién creado.');
  }
  return created;
}

export async function updateVenue(id: string, input: VenueInput): Promise<Venue | null> {
  const imageUrl = input.imageUrl?.trim() || defaultImageForCategory(input.category);
  const client = getSupabaseClient();

  if (!client) {
    const venues = readLocalVenues();
    const idx = venues.findIndex((v) => v.id === id);
    if (idx === -1) return null;

    const updated: Venue = {
      ...venues[idx],
      name: input.name,
      category: input.category,
      description: input.description,
      address: input.address,
      city: input.city,
      phone: input.phone,
      email: input.email,
      website: input.website || '',
      latitude: input.latitude,
      longitude: input.longitude,
      imageUrl,
      updatedAt: new Date().toISOString(),
      items: input.items.map((item) => ({
        id: item.id || randomUUID(),
        venueId: id,
        itemType: item.itemType,
        name: item.name,
        brandOrLevel: item.brandOrLevel,
        price: item.price,
        currency: item.currency,
        billingUnit: item.billingUnit,
        description: item.description,
      })),
    };
    venues[idx] = updated;
    writeLocalVenues(venues);
    return updated;
  }

  const { data: updatedRow, error: venueError } = await client
    .from('venues')
    .update({
      name: input.name,
      category: input.category,
      description: input.description,
      address: input.address,
      city: input.city,
      phone: input.phone,
      email: input.email,
      website: input.website || '',
      latitude: input.latitude,
      longitude: input.longitude,
      image_url: imageUrl,
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (venueError) {
    throw new Error(`Error al actualizar local en Supabase: ${venueError.message}`);
  }
  if (!updatedRow) {
    return null;
  }

  const { error: deleteItemsError } = await client
    .from('catalog_items')
    .delete()
    .eq('venue_id', id);

  if (deleteItemsError) {
    throw new Error(`Error al actualizar elementos del catálogo: ${deleteItemsError.message}`);
  }

  if (input.items.length > 0) {
    const { error: insertItemsError } = await client.from('catalog_items').insert(
      input.items.map((item) => ({
        venue_id: id,
        item_type: item.itemType,
        name: item.name,
        brand_or_level: item.brandOrLevel,
        price: item.price,
        currency: item.currency,
        billing_unit: item.billingUnit,
        description: item.description,
      }))
    );

    if (insertItemsError) {
      throw new Error(`Error al insertar elementos actualizados: ${insertItemsError.message}`);
    }
  }

  return getVenueById(id);
}

export async function deleteVenue(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    const venues = readLocalVenues();
    const filtered = venues.filter((v) => v.id !== id);
    if (filtered.length === venues.length) return false;
    writeLocalVenues(filtered);
    return true;
  }

  const { data, error } = await client
    .from('venues')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    throw new Error(`Error al eliminar local en Supabase: ${error.message}`);
  }

  return Array.isArray(data) && data.length > 0;
}
