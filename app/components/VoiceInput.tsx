'use client';
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface Props {
  onTranscript: (text: string) => void;
  accent: string;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, accent, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  const toggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={listening ? 'Stop listening' : 'Voice input'}
      className="w-8 h-8 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 flex-shrink-0"
      style={{
        background: listening ? `${accent}25` : 'transparent',
        color: listening ? accent : 'rgba(255,255,255,0.3)',
        border: listening ? `1px solid ${accent}40` : '1px solid transparent',
      }}
    >
      {listening
        ? <Mic size={15} strokeWidth={2} className="animate-pulse" />
        : <Mic size={15} strokeWidth={1.75} />
      }
    </button>
  );
}
