// Tipos minimos para la Web Speech API (SpeechRecognition). No forma parte
// del lib "dom" estandar de TypeScript porque todavia es una API no
// estandarizada del todo -- Chrome (incluido Android) la soporta bien de
// forma nativa via el prefijo "webkit", que es el unico caso que usamos
// (ver features/products/components/search-box.tsx).

interface SpeechRecognitionResult {
  [index: number]: { transcript: string };
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}
