export function DeployGuideSection() {
  return (
    <section id="arquitectura" className="mx-auto max-w-[1280px] px-4 pt-6 pb-14 sm:px-6 lg:px-8">
      <div className="border-t border-stone-200 pt-10">
        <h2
          className="text-2xl font-semibold tracking-tight text-neutral-900"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Infraestructura compatible con GitHub, Render y Supabase
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-neutral-600">
          El repositorio incluye el esquema relacional para PostgreSQL en Supabase, la configuración de servicio web para Render y la protección de claves mediante variables de entorno en el servidor.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-[#1B4D3E]">01. Base de datos Supabase</p>
            <h3 className="mt-1.5 text-base font-semibold text-neutral-900">
              Tablas venues y catalog_items
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
              Ejecuta <code className="font-mono text-neutral-800">supabase/schema.sql</code> en el editor SQL de Supabase para almacenar locales, coordenadas y precios con integridad referencial.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-[#1B4D3E]">02. Repositorio en GitHub</p>
            <h3 className="mt-1.5 text-base font-semibold text-neutral-900">
              Control de versiones limpio
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
              Todas las credenciales permanecen fuera del código fuente mediante <code className="font-mono text-neutral-800">.env.example</code> y <code className="font-mono text-neutral-800">.gitignore</code>.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold text-[#1B4D3E]">03. Publicación en Render</p>
            <h3 className="mt-1.5 text-base font-semibold text-neutral-900">
              Despliegue automático con render.yaml
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
              Conecta el repositorio en Render y define <code className="font-mono text-neutral-800">SUPABASE_URL</code>, <code className="font-mono text-neutral-800">SUPABASE_SERVICE_ROLE_KEY</code>, <code className="font-mono text-neutral-800">GEMINI_API_KEY</code> y <code className="font-mono text-neutral-800">VITE_GOOGLE_MAPS_API_KEY</code>.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-stone-200 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center">
        <p>Acorde · Directorio de tiendas, estudios y escuelas de música</p>
        <p>Catálogo conectado con Supabase, Google Maps Platform y Gemini API</p>
      </footer>
    </section>
  );
}
