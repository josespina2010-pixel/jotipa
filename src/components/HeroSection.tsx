import { ArrowDownRight, MessageSquare, Music2 } from 'lucide-react';
import type { CatalogSummary } from '../shared/catalogLogic';
import { VENUE_IMAGES } from '../shared/seedData';

interface HeroSectionProps {
  summary: CatalogSummary;
  onFocusAssistant: () => void;
}

export function HeroSection({ summary, onFocusAssistant }: HeroSectionProps) {
  return (
    <section id="inicio" className="mx-auto max-w-[1280px] px-4 pt-8 pb-10 sm:px-6 lg:px-8 lg:pt-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between gap-6 lg:col-span-6 lg:py-4">
          <div className="space-y-4">
            <p className="text-sm font-medium tracking-wide text-[#1B4D3E]">
              Directorio musical en tiempo real
            </p>
            <h1
              className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
              style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
            >
              Tiendas, estudios y escuelas de música en un solo catálogo.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
              Consulta instrumentos disponibles, tarifas de clases y servicios de estudio,
              explora cada sede en Google Maps y pregunta directamente al asistente
              conectado a la base de datos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#catalogo"
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 whitespace-nowrap shrink-0"
            >
              <span>Explorar catálogo</span>
              <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={onFocusAssistant}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-stone-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 text-[#1B4D3E]" aria-hidden="true" />
              <span>Consultar al asistente</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-200 lg:aspect-auto lg:h-full lg:min-h-[340px]">
            <img
              src={VENUE_IMAGES.hero}
              alt="Taller y tienda de instrumentos musicales con guitarras acústicas y piano vertical"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-2 text-xs font-medium sm:text-sm">
                <Music2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Guitarras · Pianos · Grabación · Formación musical</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-stone-200 bg-stone-200 sm:grid-cols-4">
        <div className="bg-white px-5 py-4">
          <p className="text-xs font-medium text-neutral-500">Locales registrados</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-neutral-900 tabular-nums">
            {summary.totalVenues}
          </p>
        </div>
        <div className="bg-white px-5 py-4">
          <p className="text-xs font-medium text-neutral-500">Instrumentos en venta</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-neutral-900 tabular-nums">
            {summary.totalInstruments}
          </p>
        </div>
        <div className="bg-white px-5 py-4">
          <p className="text-xs font-medium text-neutral-500">Programas de clases</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-neutral-900 tabular-nums">
            {summary.totalClasses}
          </p>
        </div>
        <div className="bg-white px-5 py-4">
          <p className="text-xs font-medium text-neutral-500">Servicios y salas</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-neutral-900 tabular-nums">
            {summary.totalServices}
          </p>
        </div>
      </div>
    </section>
  );
}
