import { Globe, Mail, MapPin, Pencil, Phone, X } from 'lucide-react';
import { categoryLabel, formatCurrency, itemTypeLabel } from '../shared/catalogLogic';
import type { Venue } from '../shared/types';

interface VenueDetailModalProps {
  venue: Venue | null;
  onClose: () => void;
  onEdit: (venue: Venue) => void;
  onSelectOnMap: (venue: Venue) => void;
}

function safeExternalUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function VenueDetailModal({
  venue,
  onClose,
  onEdit,
  onSelectOnMap,
}: VenueDetailModalProps) {
  if (!venue) return null;

  const websiteUrl = safeExternalUrl(venue.website);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100 sm:aspect-[21/9]">
          <img
            src={venue.imageUrl}
            alt={venue.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha del local"
            className="absolute right-3 top-3 rounded-lg bg-white/95 p-2 text-neutral-700 shadow-sm hover:bg-white hover:text-neutral-900 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span className="font-semibold text-[#1B4D3E]">
              {categoryLabel(venue.category)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{venue.city}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
            </span>
          </div>

          <h2
            id="venue-detail-title"
            className="mt-1.5 text-2xl font-semibold text-neutral-900"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {venue.name}
          </h2>

          {venue.description && (
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{venue.description}</p>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 border-y border-stone-200 py-4 text-xs text-neutral-700 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1B4D3E]" aria-hidden="true" />
              <span>{venue.address}</span>
            </div>
            {venue.phone && (
              <div className="flex items-center gap-2 font-mono tabular-nums">
                <Phone className="h-4 w-4 shrink-0 text-[#1B4D3E]" aria-hidden="true" />
                <span>{venue.phone}</span>
              </div>
            )}
            {venue.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-[#1B4D3E]" aria-hidden="true" />
                <span>{venue.email}</span>
              </div>
            )}
            {websiteUrl && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-[#1B4D3E]" aria-hidden="true" />
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[#1B4D3E] underline underline-offset-2 hover:text-[#143B2F]"
                >
                  {websiteUrl}
                </a>
              </div>
            )}
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-neutral-900">
              Instrumentos, clases y servicios ({venue.items.length})
            </h3>
            <div className="mt-3 overflow-x-auto rounded-lg border border-stone-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-stone-50 text-neutral-500">
                  <tr>
                    <th className="px-3.5 py-2.5 font-medium">Concepto</th>
                    <th className="px-3.5 py-2.5 font-medium">Tipo</th>
                    <th className="px-3.5 py-2.5 font-medium">Detalle</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {venue.items.map((item) => (
                    <tr key={item.id} className="bg-white">
                      <td className="px-3.5 py-3 align-top">
                        <p className="font-medium text-neutral-900">{item.name}</p>
                        {item.description && (
                          <p className="mt-0.5 text-[11px] text-neutral-500">{item.description}</p>
                        )}
                      </td>
                      <td className="px-3.5 py-3 align-top text-neutral-600 whitespace-nowrap">
                        {itemTypeLabel(item.itemType)}
                      </td>
                      <td className="px-3.5 py-3 align-top text-neutral-600">
                        {item.brandOrLevel || '—'}
                      </td>
                      <td className="px-3.5 py-3 align-top text-right font-mono font-semibold text-neutral-900 tabular-nums whitespace-nowrap">
                        <div>{formatCurrency(item.price, item.currency)}</div>
                        <div className="text-[11px] font-normal text-neutral-500">
                          / {item.billingUnit}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                onSelectOnMap(venue);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-neutral-800 hover:bg-stone-50 cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-[#1B4D3E]" aria-hidden="true" />
              <span>Centrar en mapa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(venue);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B4D3E] px-4 py-2 text-xs font-medium text-white hover:bg-[#143B2F] cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Editar registro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
