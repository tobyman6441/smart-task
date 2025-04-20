import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface TaskInputProps {
  onSubmit: (entry: string) => void;
}

export default function TaskInput({ onSubmit }: TaskInputProps) {
  const [entry, setEntry] = useState('');
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    // Focus the textarea and open keyboard when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Trigger click to ensure keyboard opens on mobile
      textareaRef.current.click();
    }
  }, []);

  useEffect(() => {
    setIsBrowserSupported(browserSupportsSpeechRecognition);
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    if (transcript) {
      setEntry(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entry.trim()) {
      onSubmit(entry.trim());
      setEntry('');
      resetTranscript();
    }
  };

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          autoFocus
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Type or speak your entry here..."
          className="w-full h-40 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black placeholder-gray-400 text-base font-light transition-all duration-200 resize-none"
        />
        {isBrowserSupported && (
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute bottom-4 right-4 p-2.5 rounded-full ${
              listening ? 'bg-black' : 'bg-gray-100'
            } transition-colors duration-200 hover:bg-gray-800`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke={listening ? 'white' : 'black'}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          </button>
        )}
      </div>
      {!isBrowserSupported && (
        <div className="text-red-500 text-sm font-medium">
          Browser doesn&apos;t support speech recognition.
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          className="w-full sm:w-auto min-w-[120px] px-6 py-5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm font-medium"
        >
          Add Entry
        </button>
      </div>
    </form>
  );
} 