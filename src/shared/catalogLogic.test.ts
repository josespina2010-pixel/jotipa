import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGeminiCatalogContext,
  computeCatalogSummary,
  filterVenues,
  validateVenueInput,
} from './catalogLogic';
import { SEED_VENUES } from './seedData';

test('filterVenues encuentra tiendas que venden guitarras (consulta de prueba 1)', () => {
  const results = filterVenues(SEED_VENUES, {
    category: 'tienda',
    itemType: 'instrumento',
    query: 'guitarra',
  });
  assert.equal(results.length, 2);
  assert.ok(results.some((v) => v.name.includes('Casa Sonora')));
  assert.ok(results.some((v) => v.name.includes('Armonía Centro Musical')));
});

test('filterVenues encuentra escuelas que ofrecen clases de piano (consulta de prueba 3)', () => {
  const results = filterVenues(SEED_VENUES, {
    category: 'escuela',
    itemType: 'clase',
    query: 'piano',
  });
  assert.equal(results.length, 2);
  assert.ok(results.some((v) => v.name.includes('Conservatorio Coyoacán')));
  assert.ok(results.some((v) => v.name.includes('Academia Polanco')));
});

test('filterVenues soporta búsqueda insensible a acentos', () => {
  const results = filterVenues(SEED_VENUES, {
    category: 'todas',
    itemType: 'todos',
    query: 'coyoacan',
  });
  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'Conservatorio Coyoacán');
});

test('computeCatalogSummary calcula totales correctos', () => {
  const summary = computeCatalogSummary(SEED_VENUES);
  assert.equal(summary.totalVenues, 6);
  assert.equal(summary.totalInstruments, 6);
  assert.equal(summary.totalClasses, 6);
  assert.equal(summary.totalServices, 6);
});

test('validateVenueInput rechaza campos vacíos o coordenadas inválidas', () => {
  const invalid = validateVenueInput({
    name: 'A',
    category: 'otra',
    address: '123',
    phone: '',
    email: '',
    latitude: 120,
    longitude: -99,
    items: [],
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 4);
});

test('validateVenueInput acepta y sanitiza un local válido', () => {
  const valid = validateVenueInput({
    name: '  Estudio Norte  ',
    category: 'estudio',
    description: 'Grabación multipista',
    address: 'Av. Reforma 250, Juárez',
    city: 'Ciudad de México',
    phone: '+52 55 1234 5678',
    email: 'hola@estudionorte.mx',
    latitude: 19.4284,
    longitude: -99.1636,
    items: [
      {
        itemType: 'servicio',
        name: 'Grabación por hora',
        brandOrLevel: 'Sala Principal',
        price: 800,
        currency: 'mxn',
        billingUnit: 'hora',
        description: 'Incluye ingeniero',
      },
    ],
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.sanitized?.name, 'Estudio Norte');
  assert.equal(valid.sanitized?.items[0].currency, 'MXN');
});

test('buildGeminiCatalogContext serializa nombres, direcciones, contactos y precios reales', () => {
  const ctx = buildGeminiCatalogContext(SEED_VENUES);
  assert.ok(ctx.includes('Casa Sonora Luthiers & Guitarras'));
  assert.ok(ctx.includes('Conservatorio Coyoacán'));
  assert.ok(ctx.includes('Clases de Piano Clásico y Contemporáneo'));
  assert.ok(ctx.includes('19.4195, -99.1602'));
});
