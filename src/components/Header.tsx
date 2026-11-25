import { Plus } from 'lucide-react';

interface HeaderProps {
  onOpenCreate: () => void;
}

export function Header({ onOpenCreate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#F8F7F4]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        <a
          href="#inicio"
          className="font-display text-2xl font-semibold tracking-tight text-neutral-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4D3E]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Acorde
        </a>

        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600"
        >
          <a
            href="#catalogo"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-neutral-900 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4D3E]"
          >
            Catálogo
          </a>
          <a
            href="#mapa"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-neutral-900 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4D3E]"
          >
            Mapa
          </a>
          <a
            href="#asistente"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-neutral-900 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4D3E]"
          >
            Asistente
          </a>
          <a
            href="#arquitectura"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-neutral-900 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4D3E]"
          >
            Infraestructura
          </a>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1B4D3E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#143B2F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4D3E] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Registrar local</span>
          </button>
        </div>
      </div>
    </header>
  );
}
