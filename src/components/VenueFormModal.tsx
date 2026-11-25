import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { validateVenueInput } from '../shared/catalogLogic';
import type { CatalogItemInput, ItemType, Venue, VenueCategory, VenueInput } from '../shared/types';

interface VenueFormModalProps {
  open: boolean;
  editingVenue: Venue | null;
  onClose: () => void;
  onSubmit: (payload: VenueInput, editingId?: string) => Promise<void>;
}

const EMPTY_ITEM: CatalogItemInput = {
  itemType: 'instrumento',
  name: '',
  brandOrLevel: '',
  price: 0,
  currency: 'MXN',
  billingUnit: 'pieza',
  description: '',
};

const ZONE_PRESETS = [
  { label: 'Roma Norte (CDMX)', lat: 19.4195, lng: -99.1602 },
  { label: 'Condesa (CDMX)', lat: 19.4112, lng: -99.1748 },
  { label: 'Coyoacán (CDMX)', lat: 19.3496, lng: -99.1653 },
  { label: 'Polanco (CDMX)', lat: 19.4336, lng: -99.1904 },
  { label: 'Del Valle (CDMX)', lat: 19.3894, lng: -99.1672 },
];

export function VenueFormModal({
  open,
  editingVenue,
  onClose,
  onSubmit,
}: VenueFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VenueCategory>('tienda');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Ciudad de México');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [latitude, setLatitude] = useState('19.4195');
  const [longitude, setLongitude] = useState('-99.1602');
  const [items, setItems] = useState<CatalogItemInput[]>([{ ...EMPTY_ITEM }]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors([]);
    if (editingVenue) {
      setName(editingVenue.name);
      setCategory(editingVenue.category);
      setDescription(editingVenue.description);
      setAddress(editingVenue.address);
      setCity(editingVenue.city);
      setPhone(editingVenue.phone);
      setEmail(editingVenue.email);
      setWebsite(editingVenue.website);
      setLatitude(String(editingVenue.latitude));
      setLongitude(String(editingVenue.longitude));
      setItems(
        editingVenue.items.length > 0
          ? editingVenue.items.map((item) => ({
              id: item.id,
              itemType: item.itemType,
              name: item.name,
              brandOrLevel: item.brandOrLevel,
              price: item.price,
              currency: item.currency,
              billingUnit: item.billingUnit,
              description: item.description,
            }))
          : [{ ...EMPTY_ITEM }]
      );
    } else {
      setName('');
      setCategory('tienda');
      setDescription('');
      setAddress('');
      setCity('Ciudad de México');
      setPhone('');
      setEmail('');
      setWebsite('');
      setLatitude('19.4195');
      setLongitude('-99.1602');
      setItems([{ ...EMPTY_ITEM }]);
    }
  }, [open, editingVenue]);

  if (!open) return null;

  const updateItem = (index: number, patch: Partial<CatalogItemInput>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addItemRow = () => {
    const defaultType: ItemType =
      category === 'escuela' ? 'clase' : category === 'estudio' ? 'servicio' : 'instrumento';
    setItems((prev) => [
      ...prev,
      {
        ...EMPTY_ITEM,
        itemType: defaultType,
        billingUnit: defaultType === 'clase' ? 'mes' : defaultType === 'servicio' ? 'hora' : 'pieza',
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const candidate = {
      name,
      category,
      description,
      address,
      city,
      phone,
      email,
      website,
      latitude: Number(latitude),
      longitude: Number(longitude),
      items: items.map((item) => ({ ...item, price: Number(item.price) })),
    };

    const validation = validateVenueInput(candidate);
    if (!validation.valid || !validation.sanitized) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    setSubmitting(true);
    try {
      await onSubmit(validation.sanitized, editingVenue?.id);
      onClose();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'No se pudo guardar el registro.']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2
              id="venue-form-title"
              className="text-xl font-semibold text-neutral-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {editingVenue ? `Editar: ${editingVenue.name}` : 'Registrar nuevo local musical'}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-600">
              Los cambios se guardan en la base de datos y actualizan el mapa y el asistente al instante.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-stone-100 hover:text-neutral-900 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
          {errors.length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800"
            >
              <p className="font-semibold">Revisa los siguientes campos:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="venue-name" className="block text-xs font-medium text-neutral-700">
                Nombre del local *
              </label>
              <input
                id="venue-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Casa Musical Bellas Artes"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="venue-category" className="block text-xs font-medium text-neutral-700">
                Giro / Categoría *
              </label>
              <select
                id="venue-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as VenueCategory)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-[#1B4D3E] focus:outline-none"
              >
                <option value="tienda">Tienda de instrumentos</option>
                <option value="estudio">Estudio de música</option>
                <option value="escuela">Escuela de música</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="venue-address" className="block text-xs font-medium text-neutral-700">
                Dirección completa *
              </label>
              <input
                id="venue-address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, colonia y alcaldía"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="venue-city" className="block text-xs font-medium text-neutral-700">
                Ciudad
              </label>
              <input
                id="venue-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="venue-phone" className="block text-xs font-medium text-neutral-700">
                Teléfono de contacto *
              </label>
              <input
                id="venue-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="venue-email" className="block text-xs font-medium text-neutral-700">
                Correo electrónico
              </label>
              <input
                id="venue-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@local.mx"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="venue-website" className="block text-xs font-medium text-neutral-700">
                Sitio web (opcional)
              </label>
              <input
                id="venue-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="venue-lat" className="block text-xs font-medium text-neutral-700">
                Latitud *
              </label>
              <input
                id="venue-lat"
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm text-neutral-900 focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="venue-lng" className="block text-xs font-medium text-neutral-700">
                Longitud *
              </label>
              <input
                id="venue-lng"
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm text-neutral-900 focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                <span>Coordenadas rápidas:</span>
                {ZONE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setLatitude(String(preset.lat));
                      setLongitude(String(preset.lng));
                    }}
                    className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-stone-100 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="venue-desc" className="block text-xs font-medium text-neutral-700">
                Descripción
              </label>
              <textarea
                id="venue-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe brevemente la especialidad del local..."
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#1B4D3E] focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-stone-200 pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Catálogo de instrumentos, clases y servicios *
                </h3>
                <p className="text-xs text-neutral-500">
                  Registra al menos un elemento con su precio correspondiente.
                </p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-stone-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Agregar concepto</span>
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 sm:grid-cols-12"
                >
                  <div className="sm:col-span-3">
                    <label
                      htmlFor={`item-type-${idx}`}
                      className="block text-[11px] font-medium text-neutral-600"
                    >
                      Tipo
                    </label>
                    <select
                      id={`item-type-${idx}`}
                      value={item.itemType}
                      onChange={(e) =>
                        updateItem(idx, { itemType: e.target.value as ItemType })
                      }
                      className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900"
                    >
                      <option value="instrumento">Instrumento</option>
                      <option value="clase">Clase</option>
                      <option value="servicio">Servicio</option>
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <label
                      htmlFor={`item-name-${idx}`}
                      className="block text-[11px] font-medium text-neutral-600"
                    >
                      Nombre *
                    </label>
                    <input
                      id={`item-name-${idx}`}
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                      placeholder="Ej. Guitarra acústica / Clases de piano"
                      className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`item-price-${idx}`}
                      className="block text-[11px] font-medium text-neutral-600"
                    >
                      Precio (MXN) *
                    </label>
                    <input
                      id={`item-price-${idx}`}
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={item.price}
                      onChange={(e) =>
                        updateItem(idx, { price: Number(e.target.value) })
                      }
                      className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 font-mono text-xs text-neutral-900"
                    />
                  </div>

                  <div className="flex items-end justify-between gap-2 sm:col-span-2">
                    <div className="flex-1">
                      <label
                        htmlFor={`item-unit-${idx}`}
                        className="block text-[11px] font-medium text-neutral-600"
                      >
                        Unidad
                      </label>
                      <input
                        id={`item-unit-${idx}`}
                        type="text"
                        value={item.billingUnit}
                        onChange={(e) => updateItem(idx, { billingUnit: e.target.value })}
                        placeholder="pieza / mes"
                        className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        aria-label={`Quitar concepto ${idx + 1}`}
                        className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="sm:col-span-5">
                    <label
                      htmlFor={`item-brand-${idx}`}
                      className="block text-[11px] font-medium text-neutral-600"
                    >
                      Marca o nivel
                    </label>
                    <input
                      id={`item-brand-${idx}`}
                      type="text"
                      value={item.brandOrLevel}
                      onChange={(e) => updateItem(idx, { brandOrLevel: e.target.value })}
                      placeholder="Ej. Yamaha / Principiantes"
                      className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900"
                    />
                  </div>

                  <div className="sm:col-span-7">
                    <label
                      htmlFor={`item-desc-${idx}`}
                      className="block text-[11px] font-medium text-neutral-600"
                    >
                      Descripción breve
                    </label>
                    <input
                      id={`item-desc-${idx}`}
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                      placeholder="Detalles adicionales de la oferta"
                      className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-stone-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#1B4D3E] px-5 py-2 text-xs font-medium text-white hover:bg-[#143B2F] disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? 'Guardando...'
                : editingVenue
                ? 'Guardar cambios'
                : 'Registrar local'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
