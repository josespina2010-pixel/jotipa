-- Esquema SQL para Supabase (PostgreSQL)
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla principal de locales (tiendas de instrumentos, estudios y escuelas de música)
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tienda', 'estudio', 'escuela')),
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Ciudad de México',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de catálogo: instrumentos, clases, servicios y precios asociados a cada local
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('instrumento', 'clase', 'servicio')),
  name TEXT NOT NULL,
  brand_or_level TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  billing_unit TEXT NOT NULL DEFAULT 'unidad',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_category ON public.venues(category);
CREATE INDEX IF NOT EXISTS idx_catalog_items_venue_id ON public.catalog_items(venue_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_type ON public.catalog_items(item_type);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_venues_updated_at ON public.venues;
CREATE TRIGGER trg_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Habilitar Row Level Security (el servidor Express usa SUPABASE_SERVICE_ROLE_KEY)
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (opcional para consultas directas con anon key)
DROP POLICY IF EXISTS "Lectura pública de locales" ON public.venues;
CREATE POLICY "Lectura pública de locales"
  ON public.venues FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Lectura pública de catálogo" ON public.catalog_items;
CREATE POLICY "Lectura pública de catálogo"
  ON public.catalog_items FOR SELECT
  USING (true);
