// ─── useVoiceInput: Web Speech API hook ────────────────────────────────────
// Supports Hindi (hi-IN), English (en-IN), Marathi (mr-IN)
// Works in Chrome/Edge. Safari has partial support.

import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceLang = 'en-IN' | 'hi-IN' | 'mr-IN';

interface UseVoiceInputOptions {
    onTranscript: (text: string) => void;
    onError?: (error: string) => void;
    lang?: VoiceLang;
}

// Map app language codes → BCP-47 speech codes
const LANG_MAP: Record<string, VoiceLang> = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
};

// ── Type stubs for Web Speech API (not in all TS lib versions) ─────────────
interface ISpeechRecognitionResult {
    readonly length: number;
    item(index: number): ISpeechRecognitionAlternative;
    [index: number]: ISpeechRecognitionAlternative;
    readonly isFinal: boolean;
}
interface ISpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}
interface ISpeechRecognitionResultList {
    readonly length: number;
    item(index: number): ISpeechRecognitionResult;
    [index: number]: ISpeechRecognitionResult;
}
interface ISpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: ISpeechRecognitionResultList;
}
interface ISpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}
interface ISpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
    onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
    onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
    onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
}
interface ISpeechRecognitionConstructor {
    new(): ISpeechRecognition;
}

function getSpeechRecognition(): ISpeechRecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as Record<string, ISpeechRecognitionConstructor | undefined>;
    return w['SpeechRecognition'] || w['webkitSpeechRecognition'] || null;
}

export function useVoiceInput({ onTranscript, onError, lang = 'en-IN' }: UseVoiceInputOptions) {
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const recognitionRef = useRef<ISpeechRecognition | null>(null);

    const SR = getSpeechRecognition();
    const isSupported = SR !== null;

    const start = useCallback(() => {
        const SRClass = getSpeechRecognition();
        if (!SRClass) {
            onError?.('Voice input is not supported in this browser. Please use Chrome or Edge.');
            return;
        }
        if (isListening) return;

        const recognition = new SRClass();
        recognition.lang = lang;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setInterimText('');
        };

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += t;
                } else {
                    interim += t;
                }
            }
            setInterimText(interim);
            if (final) {
                onTranscript(final.trim());
                setInterimText('');
            }
        };

        recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
            setIsListening(false);
            setInterimText('');
            const msgs: Record<string, string> = {
                'no-speech': 'No speech detected. Please try again.',
                'audio-capture': 'Microphone not accessible. Check device permissions.',
                'not-allowed': 'Microphone permission denied. Please allow mic access in browser.',
                'network': 'Network error during voice recognition.',
            };
            onError?.(msgs[event.error] || `Voice error: ${event.error}`);
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimText('');
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [isListening, lang, onTranscript, onError]);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
        setInterimText('');
    }, []);

    useEffect(() => {
        return () => { recognitionRef.current?.abort(); };
    }, []);

    return { isListening, interimText, start, stop, isSupported };
}

// ─── useTTS: Text-to-Speech for bot responses ─────────────────────────────

interface TTSOptions {
    lang?: VoiceLang;
    enabled?: boolean;
}

export function useTTS({ lang = 'en-IN', enabled = false }: TTSOptions = {}) {
    // Use a ref so the speak callback always reads the *current* enabled value,
    // not a stale closure captured at render time.
    const enabledRef = useRef(enabled);
    useEffect(() => {
        enabledRef.current = enabled;
        // Cancel any ongoing speech immediately when user turns TTS off
        if (!enabled && typeof window !== 'undefined') {
            window.speechSynthesis?.cancel();
        }
    }, [enabled]);

    const speak = useCallback((text: string) => {
        if (!enabledRef.current || typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        const cleaned = text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/[•✅❌⚠️🚨📋🔍👶📌🎬💼🏛️]/g, '')
            .slice(0, 300);

        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = lang;
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        // Attempt to find a voice matching the language
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.lang === lang);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, [lang]);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    }, []);

    return { speak, stop };
}


// ─── mapLanguage helper ──────────────────────────────────────────────────────
export function mapLanguageToVoice(appLang: string): VoiceLang {
    return LANG_MAP[appLang] || 'en-IN';
}
