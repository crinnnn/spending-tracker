/**
 * Voice Recognition utility using Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 */

export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

export function createSpeechRecognizer({ onResult, onError, onEnd, onStart }) {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = navigator.language || 'en-US';

  recognition.onstart = () => {
    onStart?.();
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    onResult?.({
      transcript: finalTranscript || interimTranscript,
      isFinal: Boolean(finalTranscript),
    });
  };

  recognition.onerror = (event) => {
    let message = 'Voice input error.';
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      message = 'Microphone access was denied. Please allow microphone permissions in your browser.';
    } else if (event.error === 'no-speech') {
      message = 'No speech was detected. Please try speaking closer to the microphone.';
    } else if (event.error === 'network') {
      message = 'Network error during voice recognition.';
    }
    onError?.(message);
  };

  recognition.onend = () => {
    onEnd?.();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Speech recognition start failed or already active:', err);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('Speech recognition stop failed:', err);
      }
    },
    abort: () => {
      try {
        recognition.abort();
      } catch (err) {
        console.warn('Speech recognition abort failed:', err);
      }
    },
  };
}
