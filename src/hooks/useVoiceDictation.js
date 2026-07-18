import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeAudioBlob } from '../services/transcribe.js';

const CHUNK_MS = 2800;

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return '';
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function appendTranscript(current, next) {
  const addition = String(next || '').trim();
  if (!addition) return current;
  const base = String(current || '').trim();
  if (!base) return addition;
  // Avoid duplicating if Whisper repeats the same phrase across overlapping windows.
  if (base.endsWith(addition) || base.includes(addition)) {
    return base;
  }
  return `${base} ${addition}`;
}

/**
 * Toggle voice dictation: records mic audio in short clips, transcribes with Whisper,
 * and streams text into the prompt field while the mic is on (red).
 *
 * @param {object} options
 * @param {string} options.prompt - Current prompt text (controlled)
 * @param {Function} options.setPrompt - Setter for the prompt text
 * @param {boolean} [options.disabled] - Disable the hook entirely
 * @param {Function} [options.onStopCallback] - Called with the final prompt string once the mic
 *   stops and any pending transcription chunk is flushed. Use this to auto-submit.
 */
export function useVoiceDictation({ prompt, setPrompt, disabled = false, onStopCallback }) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState(null);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const listeningRef = useRef(false);
  const promptRef = useRef(prompt);
  const cycleTimerRef = useRef(null);
  const mimeTypeRef = useRef('');
  // Set to true when user presses Stop — the transcribeChunk that fires after
  // the final recorder.stop() will call onStopCallback once it's done.
  const pendingStopRef = useRef(false);
  const onStopCallbackRef = useRef(onStopCallback);
  // Keep ref in sync so the async transcribeChunk closure always sees the latest value.
  useEffect(() => {
    onStopCallbackRef.current = onStopCallback;
  }, [onStopCallback]);

  useEffect(() => {
    promptRef.current = prompt;
  }, [prompt]);

  const cleanupStream = useCallback(() => {
    if (cycleTimerRef.current) {
      window.clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const transcribeChunk = useCallback(async (blob, isFinalChunk = false) => {
    if (!blob || blob.size < 100) {
      // Even if audio too short, still fire callback on final chunk.
      if (isFinalChunk && pendingStopRef.current) {
        pendingStopRef.current = false;
        const cb = onStopCallbackRef.current;
        if (typeof cb === 'function') cb(promptRef.current);
      }
      return;
    }
    setIsTranscribing(true);
    try {
      const text = await transcribeAudioBlob(blob);
      if (text) {
        const next = appendTranscript(promptRef.current, text);
        promptRef.current = next;
        setPrompt(next);
      }
    } catch (error) {
      setVoiceError(error.message || 'Voice transcription failed.');
    } finally {
      setIsTranscribing(false);
      // If this was the last chunk after mic was stopped, fire the callback.
      if (isFinalChunk && pendingStopRef.current) {
        pendingStopRef.current = false;
        const cb = onStopCallbackRef.current;
        if (typeof cb === 'function') cb(promptRef.current);
      }
    }
  }, [setPrompt]);

  const startRecorderCycle = useCallback(() => {
    if (!listeningRef.current || !streamRef.current) return;

    const mimeType = mimeTypeRef.current;
    const options = mimeType ? { mimeType } : undefined;
    let recorder;
    try {
      recorder = new MediaRecorder(streamRef.current, options);
    } catch {
      recorder = new MediaRecorder(streamRef.current);
    }

    chunksRef.current = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blobType = mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: blobType });
      chunksRef.current = [];
      // Pass `isFinalChunk=true` when the mic is no longer listening so the
      // callback fires after the last transcription completes.
      const isFinal = !listeningRef.current;
      void transcribeChunk(blob, isFinal);

      if (listeningRef.current) {
        cycleTimerRef.current = window.setTimeout(() => {
          startRecorderCycle();
        }, 40);
      }
    };

    recorder.start();
    cycleTimerRef.current = window.setTimeout(() => {
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
      }
    }, CHUNK_MS);
  }, [transcribeChunk]);

  const stopListening = useCallback(() => {
    pendingStopRef.current = true;  // Signal transcribeChunk to fire callback after last chunk.
    listeningRef.current = false;
    setIsListening(false);
    if (cycleTimerRef.current) {
      window.clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      // recorder.onstop will fire → transcribeChunk(blob, isFinal=true) → callback.
      recorderRef.current.stop();
    } else {
      // No recording in flight — fire callback immediately with current prompt.
      pendingStopRef.current = false;
      cleanupStream();
      const cb = onStopCallbackRef.current;
      if (typeof cb === 'function') cb(promptRef.current);
    }
    // Stop tracks after final onstop fires.
    window.setTimeout(() => {
      if (!listeningRef.current) {
        cleanupStream();
      }
    }, 500);
  }, [cleanupStream]);

  const startListening = useCallback(async () => {
    if (disabled || listeningRef.current) return;
    setVoiceError(null);

    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mimeTypeRef.current = pickMimeType();
      listeningRef.current = true;
      setIsListening(true);
      startRecorderCycle();
    } catch {
      setVoiceError('Microphone access was denied. Allow mic permission to use voice.');
      cleanupStream();
      listeningRef.current = false;
      setIsListening(false);
    }
  }, [cleanupStream, disabled, startRecorderCycle]);

  const toggleListening = useCallback(async () => {
    if (listeningRef.current) {
      stopListening();
    } else {
      await startListening();
    }
  }, [startListening, stopListening]);

  return {
    isListening,
    isTranscribing,
    voiceError,
    toggleListening,
    stopListening,
  };
}
