import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AssistantPanel } from './components/AssistantPanel';
import { CatalogSection } from './components/CatalogSection';
import { DeployGuideSection } from './components/DeployGuideSection';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InteractiveMap } from './components/InteractiveMap';
import { VenueDetailModal } from './components/VenueDetailModal';
import { VenueFormModal } from './components/VenueFormModal';
import { computeCatalogSummary, filterVenues } from './shared/catalogLogic';
import type { CatalogFilters, Venue, VenueInput } from './shared/types';

export default function App() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [filters, setFilters] = useState<CatalogFilters>({
    category: 'todas',
    itemType: 'todos',
    query: '',
  });
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [detailVenue, setDetailVenue] = useState<Venue | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);

  const assistantInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const loadVenues = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await fetch('/api/venues');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo cargar el catálogo.');
      }
      setVenues(Array.isArray(data.venues) ? data.venues : []);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Error de conexión al cargar el catálogo.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVenues();
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      fetch('/api/public-config')
        .then((res) => (res.ok ? res.json() : null))
        .then((cfg) => {
          if (cfg?.googleMapsApiKey) {
            setMapsApiKey(cfg.googleMapsApiKey);
          }
        })
        .catch(() => {
          // Non-fatal fallback
        });
    }
  }, [loadVenues]);

  const filteredVenues = useMemo(
    () => filterVenues(venues, filters),
    [venues, filters]
  );

  const summary = useMemo(() => computeCatalogSummary(venues), [venues]);

  const handleSelectOnMap = (venue: Venue) => {
    setSelectedVenueId(venue.id);
    document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFocusAssistant = () => {
    document.getElementById('asistente')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      assistantInputRef.current?.focus();
    }, 350);
  };

  const handleSaveVenue = async (payload: VenueInput, editingId?: string) => {
    const endpoint = editingId ? `/api/venues/${editingId}` : '/api/venues';
    const method = editingId ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'No se pudo guardar el registro.');
    }

    await loadVenues();
    if (data.venue?.id) {
      setSelectedVenueId(data.venue.id);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    const response = await fetch(`/api/venues/${venueId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      setApiError(data.error || 'No se pudo eliminar el registro.');
      return;
    }

    if (selectedVenueId === venueId) {
      setSelectedVenueId(null);
    }
    if (detailVenue?.id === venueId) {
      setDetailVenue(null);
    }
    await loadVenues();
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-neutral-900">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Header
        onOpenCreate={() => {
          setEditingVenue(null);
          setFormOpen(true);
        }}
      />

      <main>
        {apiError && (
          <div className="mx-auto mt-4 max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div
              role="alert"
              className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
            >
              <span>{apiError}</span>
              <button
                type="button"
                onClick={() => void loadVenues()}
                className="font-semibold underline cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        <HeroSection summary={summary} onFocusAssistant={handleFocusAssistant} />

        <InteractiveMap
          apiKey={mapsApiKey}
          venues={filteredVenues}
          selectedVenueId={selectedVenueId}
          onSelectVenue={setSelectedVenueId}
          onOpenDetails={(venue) => setDetailVenue(venue)}
        />

        <CatalogSection
          venues={filteredVenues}
          totalCount={venues.length}
          loading={loading}
          filters={filters}
          onFiltersChange={setFilters}
          onSelectOnMap={handleSelectOnMap}
          onOpenDetails={(venue) => setDetailVenue(venue)}
          onEditVenue={(venue) => {
            setEditingVenue(venue);
            setFormOpen(true);
          }}
          onDeleteVenue={handleDeleteVenue}
        />

        <AssistantPanel inputRef={assistantInputRef} />

        <DeployGuideSection />
      </main>

      <VenueDetailModal
        venue={detailVenue}
        onClose={() => setDetailVenue(null)}
        onEdit={(venue) => {
          setEditingVenue(venue);
          setFormOpen(true);
        }}
        onSelectOnMap={handleSelectOnMap}
      />

      <VenueFormModal
        open={formOpen}
        editingVenue={editingVenue}
        onClose={() => {
          setFormOpen(false);
          setEditingVenue(null);
        }}
        onSubmit={handleSaveVenue}
      />
    </div>
  );
}
