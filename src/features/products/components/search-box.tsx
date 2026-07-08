"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FILTER_PARAM_KEYS = ["q", "category", "brand", "supplier", "tag", "browse", "page"];

/**
 * Buscador con debounce que escribe el término en la URL (?q=...). Así la
 * búsqueda queda en un Server Component (queries.ts) y es enlazable/compartible,
 * sin necesitar un endpoint de API aparte.
 *
 * Incluye una "x" para limpiar todo de un toque: no solo el texto tipeado,
 * tambien cualquier filtro de categoria/marca/proveedor/tag que estuviera
 * aplicado -- vuelve a la pantalla de aterrizaje sin nada puesto.
 *
 * Tambien incluye un boton de busqueda por voz (Web Speech API) cuando el
 * navegador la soporta -- pensado para uso 100% tactil/manos ocupadas en el
 * mostrador: un toque, se escucha una frase, se busca sola.
 */
export function SearchBox({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page");
      // Escribir un termino de busqueda tiene prioridad sobre cualquier
      // selector de tiles que estuviera abierto (categoria/marca/proveedor/
      // tag) -- se cierra y se muestran resultados directamente.
      params.delete("browse");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 250);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Deteccion en el cliente, despues del montaje: si se evalua en el primer
  // render ya da distinto en servidor (sin window) vs. cliente y React tira
  // un error de hidratacion. Asi el boton aparece un instante despues, pero
  // sin romper nada.
  useEffect(() => {
    setVoiceSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => {
      recognitionRef.current?.abort();
      if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
    };
  }, []);

  // Safari/iOS soporta la API pero a veces nunca dispara onend ni onerror
  // (queda "escuchando" para siempre en la UI aunque el reconocimiento ya
  // murio). Esta funcion es el unico lugar que apaga isListening, para que
  // tanto un resultado normal como el timeout de seguridad de mas abajo
  // usen el mismo camino y no se pisen.
  function stopListening() {
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    setIsListening(false);
  }

  function handleVoiceClick() {
    if (isListening) {
      recognitionRef.current?.abort();
      stopListening();
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "es-AR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setValue(transcript);
    };
    recognition.onerror = () => {
      setVoiceError(true);
      setTimeout(() => setVoiceError(false), 2500);
      stopListening();
    };
    recognition.onend = stopListening;

    recognitionRef.current = recognition;
    setVoiceError(false);
    setIsListening(true);
    recognition.start();

    // Salvavidas: en iOS a veces no llega ni onresult, ni onerror, ni onend.
    // Sin esto el boton queda "tildado" en modo escuchando para siempre.
    voiceTimeoutRef.current = setTimeout(() => {
      recognitionRef.current?.abort();
      stopListening();
      setVoiceError(true);
      setTimeout(() => setVoiceError(false), 2500);
    }, 8000);
  }

  const hasAnythingToClear =
    value.length > 0 || FILTER_PARAM_KEYS.some((key) => searchParams.get(key));

  function handleClear() {
    setValue("");
    startTransition(() => {
      router.replace(pathname);
    });
  }

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:left-4 md:h-5 md:w-5" />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder ?? "Que estas buscando?"}
            className="h-12 pl-10 pr-10 text-base md:h-14 md:pl-12 md:pr-12 md:text-lg"
          />
          {hasAnythingToClear && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda y filtros"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground md:right-3 md:h-9 md:w-9"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          )}
        </div>

        {voiceSupported && (
          <button
            type="button"
            onClick={handleVoiceClick}
            aria-label={isListening ? "Detener búsqueda por voz" : "Buscar por voz"}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors md:h-14 md:w-14",
              isListening
                ? "animate-pulse bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Mic className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        )}
      </div>

      {isListening && (
        <p className="mt-1.5 text-center text-sm text-muted-foreground">Escuchando... hablá ahora</p>
      )}
      {voiceError && (
        <p className="mt-1.5 text-center text-sm text-destructive">
          No se pudo usar el micrófono. Probá de nuevo.
        </p>
      )}
    </div>
  );
}
