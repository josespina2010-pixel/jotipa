import { useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessage } from '../shared/types';

const SUGGESTED_PROMPTS = [
  '¿Qué tiendas registradas venden guitarras?',
  '¿Qué instrumento es recomendable para comenzar a estudiar música?',
  '¿Qué escuelas del catálogo ofrecen clases de piano?',
];

export function AssistantPanel({
  inputRef,
}: {
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hola, soy el asistente musical de Acorde. Consulto en tiempo real los locales, instrumentos, clases, servicios y precios registrados en la base de datos. ¿En qué te ayudo hoy?',
      timestamp: new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || sending) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages
            .filter((m) => m.id !== 'welcome')
            .slice(-8)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo obtener respuesta del asistente.');
      }

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al consultar el asistente inteligente.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  return (
    <section id="asistente" className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 rounded-2xl border border-stone-200 bg-white p-6 lg:grid-cols-12 lg:p-8">
        <div className="flex flex-col justify-between gap-6 lg:col-span-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#1B4D3E]">
              Asistente con Gemini API
            </p>
            <h2
              className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl"
              style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
            >
              Consulta el catálogo real mediante lenguaje natural
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
              Cada respuesta consulta los registros actuales de tiendas, estudios, escuelas y tarifas almacenados en la base de datos.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-neutral-700">
              Consultas sugeridas
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={sending}
                  onClick={() => void sendQuestion(prompt)}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-left text-xs font-medium text-neutral-800 transition-colors hover:border-[#1B4D3E] hover:bg-white disabled:opacity-50 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-[#F8F7F4] lg:col-span-7">
          <div
            ref={scrollContainerRef}
            aria-live="polite"
            className="flex h-[380px] flex-col gap-3 overflow-y-auto p-4 sm:p-5"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-[#1B4D3E] text-white'
                      : 'border border-stone-200 bg-white text-neutral-800'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="mt-1 font-mono text-[11px] text-neutral-400 tabular-nums">
                  {msg.role === 'user' ? 'Tú' : 'Asistente'} · {msg.timestamp}
                </span>
              </div>
            ))}

            {sending && (
              <div className="flex items-start">
                <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-neutral-500">
                  Consultando registros del catálogo y redactando respuesta...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-stone-200 bg-white p-3"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Escribe tu pregunta para el asistente musical
            </label>
            <input
              ref={inputRef}
              id="assistant-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre instrumentos, precios, escuelas o estudios..."
              className="flex-1 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#1B4D3E] focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Enviar pregunta"
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Enviar</span>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
