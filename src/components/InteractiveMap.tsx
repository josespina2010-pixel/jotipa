import { useEffect, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import { FileText, MapPin, Phone } from 'lucide-react';
import { categoryLabel, formatCurrency } from '../shared/catalogLogic';
import type { Venue, VenueCategory } from '../shared/types';

interface InteractiveMapProps {
  apiKey: string;
  venues: Venue[];
  selectedVenueId: string | null;
  onSelectVenue: (venueId: string | null) => void;
  onOpenDetails: (venue: Venue) => void;
}

const DEFAULT_CENTER = { lat: 19.403, lng: -99.167 };

function pinColorsForCategory(category: VenueCategory): {
  background: string;
  borderColor: string;
  glyphColor: string;
  glyphText: string;
} {
  switch (category) {
    case 'tienda':
      return {
        background: '#1B4D3E',
        borderColor: '#0F2E25',
        glyphColor: '#FFFFFF',
        glyphText: 'T',
      };
    case 'estudio':
      return {
        background: '#B45309',
        borderColor: '#78350F',
        glyphColor: '#FFFFFF',
        glyphText: 'E',
      };
    case 'escuela':
      return {
        background: '#1E3A5F',
        borderColor: '#10233B',
        glyphColor: '#FFFFFF',
        glyphText: 'A',
      };
  }
}

function VenueMarker({
  venue,
  isSelected,
  onSelect,
  onClose,
  onOpenDetails,
}: {
  venue: Venue;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
  onOpenDetails: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const colors = pinColorsForCategory(venue.category);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: venue.latitude, lng: venue.longitude }}
        title={venue.name}
        onClick={onSelect}
      >
        <Pin
          background={colors.background}
          borderColor={colors.borderColor}
          glyphColor={colors.glyphColor}
          glyph={colors.glyphText}
          scale={isSelected ? 1.25 : 1}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} maxWidth={290} onCloseClick={onClose}>
          <div className="space-y-2 p-1 text-neutral-900">
            <div>
              <p className="text-[11px] font-medium text-neutral-500">
                {categoryLabel(venue.category)}
              </p>
              <h3 className="text-sm font-semibold text-neutral-900">{venue.name}</h3>
            </div>

            <p className="text-xs leading-snug text-neutral-600">{venue.address}</p>

            {venue.phone && (
              <p className="flex items-center gap-1.5 font-mono text-xs text-neutral-700 tabular-nums">
                <Phone className="h-3 w-3 text-neutral-400" aria-hidden="true" />
                <span>{venue.phone}</span>
              </p>
            )}

            {venue.items.length > 0 && (
              <div className="border-t border-stone-200 pt-2">
                <p className="text-[11px] font-medium text-neutral-500">Destacado del catálogo</p>
                <ul className="mt-1 space-y-1">
                  {venue.items.slice(0, 2).map((item) => (
                    <li key={item.id} className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate text-neutral-800">{item.name}</span>
                      <span className="font-mono font-medium text-neutral-900 tabular-nums shrink-0">
                        {formatCurrency(item.price, item.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={onOpenDetails}
              className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#1B4D3E] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#143B2F] cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ver ficha completa</span>
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MapCameraSync({
  venues,
  selectedVenueId,
}: {
  venues: Venue[];
  selectedVenueId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (selectedVenueId) {
      const target = venues.find((v) => v.id === selectedVenueId);
      if (target) {
        map.panTo({ lat: target.latitude, lng: target.longitude });
        const currentZoom = map.getZoom() ?? 12;
        if (currentZoom < 14) {
          map.setZoom(14);
        }
      }
      return;
    }

    if (venues.length > 1) {
      let north = -90;
      let south = 90;
      let east = -180;
      let west = 180;
      for (const v of venues) {
        if (v.latitude > north) north = v.latitude;
        if (v.latitude < south) south = v.latitude;
        if (v.longitude > east) east = v.longitude;
        if (v.longitude < west) west = v.longitude;
      }
      map.fitBounds({ north, south, east, west }, 60);
    } else if (venues.length === 1) {
      map.panTo({ lat: venues[0].latitude, lng: venues[0].longitude });
      map.setZoom(14);
    }
  }, [map, venues, selectedVenueId]);

  return null;
}

function MapStatusMonitor() {
  const status = useApiLoadingStatus();

  useEffect(() => {
    if (status === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [status]);

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 rounded-lg border border-amber-200 bg-amber-50/95 px-4 py-2.5 text-xs text-amber-900">
        No se pudo cargar el mapa interactivo en este momento. Verifica la clave o cuota de Google Maps Platform.
      </div>
    );
  }

  return null;
}

export function InteractiveMap({
  apiKey,
  venues,
  selectedVenueId,
  onSelectVenue,
  onOpenDetails,
}: InteractiveMapProps) {
  const [mapCenter] = useState(DEFAULT_CENTER);
  const selectedVenue = venues.find((v) => v.id === selectedVenueId) || null;

  return (
    <section id="mapa" className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Mapa interactivo de locales
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Selecciona cualquier marcador para consultar dirección, contacto, instrumentos, clases y precios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#1B4D3E]" aria-hidden="true" />
            Tiendas (T)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#B45309]" aria-hidden="true" />
            Estudios (E)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#1E3A5F]" aria-hidden="true" />
            Escuelas (A)
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100 lg:col-span-8">
          {apiKey ? (
            <div className="relative h-[440px] w-full sm:h-[500px]">
              <APIProvider apiKey={apiKey} libraries={['marker']} language="es" region="MX">
                <MapStatusMonitor />
                <GoogleMap
                  defaultCenter={mapCenter}
                  defaultZoom={12}
                  mapId="DEMO_MAP_ID"
                  gestureHandling="greedy"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  <MapCameraSync venues={venues} selectedVenueId={selectedVenueId} />
                  {venues.map((venue) => (
                    <VenueMarker
                      key={venue.id}
                      venue={venue}
                      isSelected={venue.id === selectedVenueId}
                      onSelect={() => onSelectVenue(venue.id)}
                      onClose={() => onSelectVenue(null)}
                      onOpenDetails={() => onOpenDetails(venue)}
                    />
                  ))}
                </GoogleMap>
              </APIProvider>
            </div>
          ) : (
            <div className="flex h-[440px] flex-col items-center justify-center gap-3 p-6 text-center sm:h-[500px]">
              <MapPin className="h-8 w-8 text-neutral-400" aria-hidden="true" />
              <div className="max-w-md space-y-1">
                <p className="text-sm font-semibold text-neutral-800">
                  Mapa interactivo en espera de clave de Google Maps
                </p>
                <p className="text-xs text-neutral-600">
                  Configura <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> en tus variables de entorno. Mientras tanto puedes explorar las {venues.length} ubicaciones desde la lista lateral.
                </p>
              </div>
            </div>
          )}
        </div>

        <aside
          aria-label="Ubicaciones registradas"
          className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 lg:col-span-4"
        >
          <div>
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-semibold text-neutral-900">
                Ubicaciones activas
              </h3>
              <span className="font-mono text-xs text-neutral-500 tabular-nums">
                {venues.length} sedes
              </span>
            </div>

            <div className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
              {venues.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-500">
                  No hay ubicaciones que coincidan con el filtro actual.
                </p>
              ) : (
                venues.map((venue) => {
                  const active = venue.id === selectedVenueId;
                  return (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => onSelectVenue(venue.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1B4D3E] bg-[#1B4D3E]/5'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-neutral-900">
                          {venue.name}
                        </span>
                        <span className="font-mono text-[11px] text-neutral-500 tabular-nums shrink-0">
                          {venue.latitude.toFixed(3)}, {venue.longitude.toFixed(3)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {categoryLabel(venue.category)} · {venue.city}
                      </p>
                      <p className="mt-1 truncate text-xs text-neutral-600">{venue.address}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {selectedVenue && (
            <div className="mt-4 border-t border-stone-200 pt-3">
              <p className="text-xs font-medium text-neutral-500">Seleccionado</p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-900">{selectedVenue.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDetails(selectedVenue)}
                  className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800 cursor-pointer"
                >
                  Abrir ficha completa
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
