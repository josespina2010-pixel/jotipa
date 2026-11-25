import { useState } from 'react';
import { MapPin, Pencil, Search, Trash2, X } from 'lucide-react';
import { categoryLabel, formatCurrency, itemTypeLabel } from '../shared/catalogLogic';
import type { CatalogFilters, ItemType, Venue, VenueCategory } from '../shared/types';

interface CatalogSectionProps {
  venues: Venue[];
  totalCount: number;
  loading: boolean;
  filters: CatalogFilters;
  onFiltersChange: (next: CatalogFilters) => void;
  onSelectOnMap: (venue: Venue) => void;
  onOpenDetails: (venue: Venue) => void;
  onEditVenue: (venue: Venue) => void;
  onDeleteVenue: (venueId: string) => Promise<void>;
}

const CATEGORY_TABS: Array<{ value: VenueCategory | 'todas'; label: string }> = [
  { value: 'todas', label: 'Todos' },
  { value: 'tienda', label: 'Tiendas' },
  { value: 'estudio', label: 'Estudios' },
  { value: 'escuela', label: 'Escuelas' },
];

const ITEM_TYPE_OPTIONS: Array<{ value: ItemType | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todo el catálogo' },
  { value: 'instrumento', label: 'Instrumentos' },
  { value: 'clase', label: 'Clases' },
  { value: 'servicio', label: 'Servicios' },
];

export function CatalogSection({
  venues,
  totalCount,
  loading,
  filters,
  onFiltersChange,
  onSelectOnMap,
  onOpenDetails,
  onEditVenue,
  onDeleteVenue,
}: CatalogSectionProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasActiveFilters =
    filters.category !== 'todas' || filters.itemType !== 'todos' || filters.query.trim() !== '';

  const handleConfirmDelete = async (venueId: string) => {
    setDeletingId(venueId);
    try {
      await onDeleteVenue(venueId);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section id="catalogo" className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Catálogo de locales, instrumentos y clases
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Filtra por giro del local, tipo de oferta o busca directamente por instrumento, marca o servicio.
            </p>
          </div>
          <p className="font-mono text-xs text-neutral-500 tabular-nums">
            Mostrando {venues.length} de {totalCount} registros
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <label htmlFor="catalog-search" className="sr-only">
              Buscar en el catálogo
            </label>
            <input
              id="catalog-search"
              type="search"
              value={filters.query}
              onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
              placeholder="Buscar guitarra, piano, mezcla, Coyoacán, Yamaha..."
              className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#1B4D3E] focus:outline-none"
            />
            {filters.query && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => onFiltersChange({ ...filters, query: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Filtrar por categoría de local"
              className="inline-flex items-center gap-1 rounded-lg bg-stone-200/75 p-1"
            >
              {CATEGORY_TABS.map((tab) => {
                const active = filters.category === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => onFiltersChange({ ...filters, category: tab.value })}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div>
              <label htmlFor="item-type-filter" className="sr-only">
                Filtrar por tipo de oferta
              </label>
              <select
                id="item-type-filter"
                value={filters.itemType}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    itemType: e.target.value as ItemType | 'todos',
                  })
                }
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-neutral-800 focus:border-[#1B4D3E] focus:outline-none"
              >
                {ITEM_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-[420px] animate-pulse rounded-xl border border-stone-200 bg-white"
            />
          ))}
        </div>
      ) : venues.length === 0 ? (
        <div className="mt-8 rounded-xl border border-stone-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-neutral-900">
            No encontramos locales con esos criterios
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Prueba otra palabra clave o restablece los filtros activos para ver todo el directorio.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                onFiltersChange({ category: 'todas', itemType: 'todos', query: '' })
              }
              className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div
          data-testid="catalog-grid"
          className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {venues.map((venue) => (
            <article
              key={venue.id}
              data-testid="venue-card"
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200 bg-white transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div>
                <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
                  <img
                    src={venue.imageUrl}
                    alt={venue.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                    <span className="font-medium text-[#1B4D3E]">
                      {categoryLabel(venue.category)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{venue.city}</span>
                  </div>

                  <h3 className="mt-1.5 text-lg font-semibold leading-snug text-neutral-900">
                    {venue.name}
                  </h3>

                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-600 line-clamp-2">
                    {venue.description || venue.address}
                  </p>

                  <p className="mt-2.5 text-xs text-neutral-500">
                    {venue.address}
                  </p>
                  <p className="mt-1 font-mono text-xs text-neutral-600 tabular-nums">
                    {venue.phone || venue.email}
                  </p>

                  <div className="mt-4 border-t border-stone-200 pt-3">
                    <p className="text-[11px] font-medium text-neutral-500">
                      Oferta y precios ({venue.items.length})
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {venue.items.slice(0, 3).map((item) => (
                        <li
                          key={item.id}
                          className="flex items-baseline justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 truncate">
                            <span className="font-medium text-neutral-800">{item.name}</span>
                            <span className="ml-1.5 text-neutral-400">
                              / {itemTypeLabel(item.itemType)}
                            </span>
                          </div>
                          <span className="font-mono font-semibold text-neutral-900 tabular-nums shrink-0">
                            {formatCurrency(item.price, item.currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-200 bg-stone-50/60 px-5 py-3">
                {confirmDeleteId === venue.id ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-red-700">
                      ¿Eliminar registro?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-stone-100 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === venue.id}
                        onClick={() => handleConfirmDelete(venue.id)}
                        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                      >
                        {deletingId === venue.id ? 'Eliminando...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenDetails(venue)}
                        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Detalles
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectOnMap(venue)}
                        aria-label={`Ver ${venue.name} en el mapa`}
                        className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-stone-100 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" aria-hidden="true" />
                        <span>Mapa</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditVenue(venue)}
                        aria-label={`Editar ${venue.name}`}
                        className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-stone-200/70 hover:text-neutral-900 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(venue.id)}
                        aria-label={`Eliminar ${venue.name}`}
                        className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
