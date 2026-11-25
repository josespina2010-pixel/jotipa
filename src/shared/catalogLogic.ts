import type { CatalogFilters, ItemType, Venue, VenueCategory, VenueInput } from './types';

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function categoryLabel(category: VenueCategory): string {
  switch (category) {
    case 'tienda':
      return 'Tienda de instrumentos';
    case 'estudio':
      return 'Estudio de música';
    case 'escuela':
      return 'Escuela de música';
  }
}

export function itemTypeLabel(type: ItemType): string {
  switch (type) {
    case 'instrumento':
      return 'Instrumento';
    case 'clase':
      return 'Clase';
    case 'servicio':
      return 'Servicio';
  }
}

export function formatCurrency(amount: number, currency = 'MXN'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    return `$${Math.round(safeAmount)} ${currency || 'MXN'}`;
  }
}

export function filterVenues(venues: Venue[], filters: CatalogFilters): Venue[] {
  const normalizedQuery = normalizeText(filters.query || '');

  return venues.filter((venue) => {
    if (filters.category !== 'todas' && venue.category !== filters.category) {
      return false;
    }

    if (
      filters.itemType !== 'todos' &&
      !venue.items.some((item) => item.itemType === filters.itemType)
    ) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const venueFields = [
      venue.name,
      venue.category,
      categoryLabel(venue.category),
      venue.description,
      venue.address,
      venue.city,
    ].map(normalizeText);

    if (venueFields.some((field) => field.includes(normalizedQuery))) {
      return true;
    }

    return venue.items.some((item) => {
      const itemFields = [
        item.name,
        item.brandOrLevel,
        item.itemType,
        item.description,
      ].map(normalizeText);
      return itemFields.some((field) => field.includes(normalizedQuery));
    });
  });
}

export interface CatalogSummary {
  totalVenues: number;
  totalInstruments: number;
  totalClasses: number;
  totalServices: number;
}

export function computeCatalogSummary(venues: Venue[]): CatalogSummary {
  let totalInstruments = 0;
  let totalClasses = 0;
  let totalServices = 0;

  for (const venue of venues) {
    for (const item of venue.items) {
      if (item.itemType === 'instrumento') totalInstruments += 1;
      else if (item.itemType === 'clase') totalClasses += 1;
      else if (item.itemType === 'servicio') totalServices += 1;
    }
  }

  return {
    totalVenues: venues.length,
    totalInstruments,
    totalClasses,
    totalServices,
  };
}

export function validateVenueInput(input: unknown): {
  valid: boolean;
  errors: string[];
  sanitized?: VenueInput;
} {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Los datos del local son obligatorios.'] };
  }

  const raw = input as Record<string, unknown>;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const category = raw.category;
  const description = typeof raw.description === 'string' ? raw.description.trim() : '';
  const address = typeof raw.address === 'string' ? raw.address.trim() : '';
  const city = typeof raw.city === 'string' && raw.city.trim() ? raw.city.trim() : 'Ciudad de México';
  const phone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
  const email = typeof raw.email === 'string' ? raw.email.trim() : '';
  const website = typeof raw.website === 'string' ? raw.website.trim() : '';
  const imageUrl = typeof raw.imageUrl === 'string' ? raw.imageUrl.trim() : '';
  const latitude = Number(raw.latitude);
  const longitude = Number(raw.longitude);

  if (name.length < 2) {
    errors.push('El nombre del local debe tener al menos 2 caracteres.');
  }

  if (category !== 'tienda' && category !== 'estudio' && category !== 'escuela') {
    errors.push('La categoría debe ser tienda, estudio o escuela.');
  }

  if (address.length < 5) {
    errors.push('La dirección debe tener al menos 5 caracteres.');
  }

  if (!phone && !email) {
    errors.push('Ingresa al menos un teléfono o correo de contacto.');
  }

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.push('La latitud debe ser un número válido entre -90 y 90.');
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.push('La longitud debe ser un número válido entre -180 y 180.');
  }

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  if (rawItems.length === 0) {
    errors.push('Agrega al menos un instrumento, clase o servicio al catálogo del local.');
  }

  const sanitizedItems: VenueInput['items'] = [];
  for (let i = 0; i < rawItems.length; i += 1) {
    const item = rawItems[i] as Record<string, unknown>;
    const itemType = item?.itemType;
    const itemName = typeof item?.name === 'string' ? item.name.trim() : '';
    const brandOrLevel = typeof item?.brandOrLevel === 'string' ? item.brandOrLevel.trim() : '';
    const price = Number(item?.price);
    const currency =
      typeof item?.currency === 'string' && item.currency.trim() ? item.currency.trim().toUpperCase() : 'MXN';
    const billingUnit =
      typeof item?.billingUnit === 'string' && item.billingUnit.trim() ? item.billingUnit.trim() : 'unidad';
    const itemDesc = typeof item?.description === 'string' ? item.description.trim() : '';

    if (itemType !== 'instrumento' && itemType !== 'clase' && itemType !== 'servicio') {
      errors.push(`El elemento #${i + 1} debe ser instrumento, clase o servicio.`);
      continue;
    }
    if (itemName.length < 2) {
      errors.push(`El elemento #${i + 1} requiere un nombre válido.`);
      continue;
    }
    if (!Number.isFinite(price) || price < 0) {
      errors.push(`El elemento "${itemName}" requiere un precio válido igual o mayor a 0.`);
      continue;
    }

    sanitizedItems.push({
      id: typeof item?.id === 'string' ? item.id : undefined,
      itemType,
      name: itemName,
      brandOrLevel,
      price,
      currency,
      billingUnit,
      description: itemDesc,
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      name,
      category: category as VenueCategory,
      description,
      address,
      city,
      phone,
      email,
      website,
      latitude,
      longitude,
      imageUrl,
      items: sanitizedItems,
    },
  };
}

export function buildGeminiCatalogContext(venues: Venue[]): string {
  if (venues.length === 0) {
    return 'No hay locales registrados actualmente en la base de datos.';
  }

  return venues
    .map((venue, index) => {
      const itemsText =
        venue.items.length > 0
          ? venue.items
              .map(
                (item) =>
                  `  - [${item.itemType.toUpperCase()}] ${item.name}` +
                  (item.brandOrLevel ? ` (${item.brandOrLevel})` : '') +
                  `: ${formatCurrency(item.price, item.currency)} / ${item.billingUnit}` +
                  (item.description ? ` — ${item.description}` : '')
              )
              .join('\n')
          : '  - Sin elementos registrados';

      return [
        `${index + 1}. ${venue.name} [${categoryLabel(venue.category)}]`,
        `   Dirección: ${venue.address}, ${venue.city}`,
        `   Coordenadas: ${venue.latitude}, ${venue.longitude}`,
        `   Contacto: Tel ${venue.phone || 'N/D'} | Email ${venue.email || 'N/D'}`,
        `   Descripción: ${venue.description || 'N/D'}`,
        `   Catálogo y precios:\n${itemsText}`,
      ].join('\n');
    })
    .join('\n\n');
}
