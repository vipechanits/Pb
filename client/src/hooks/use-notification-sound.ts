import { useEffect, useRef, useState } from 'react';

/**
 * Hook to play notification sounds using Web Audio API
 * Generates different sounds for success (double bell), alert (three chimes)
 */
export function useNotificationSound() {
  const [isMuted, setIsMuted] = useState(() => {
    const stored = localStorage.getItem('notifications-muted');
    return stored === 'true';
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first user interaction
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    document.addEventListener('click', initAudioContext, { once: true });
    return () => document.removeEventListener('click', initAudioContext);
  }, []);

  const playBell = (context: AudioContext, startTime: number, frequency: number, duration: number = 0.3) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Bell envelope: quick attack, moderate decay
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  const playSuccessSound = () => {
    if (isMuted || !audioContextRef.current) return;

    const context = audioContextRef.current;
    const currentTime = context.currentTime;

    // Play two bells with slight delay (pleasant double chime for success)
    playBell(context, currentTime, 800); // Higher pitch first bell
    playBell(context, currentTime + 0.15, 600); // Lower pitch second bell
  };

  const playAlertSound = () => {
    if (isMuted || !audioContextRef.current) return;

    const context = audioContextRef.current;
    const currentTime = context.currentTime;

    // Play three ascending chimes for alert/warning
    playBell(context, currentTime, 600); // Low pitch
    playBell(context, currentTime + 0.12, 800); // Medium pitch
    playBell(context, currentTime + 0.24, 1000); // High pitch
  };

  const playDoubleChime = () => {
    // Alias for playSuccessSound for backward compatibility
    playSuccessSound();
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('notifications-muted', String(newMuted));
  };

  return {
    playSuccessSound,
    playAlertSound,
    playDoubleChime,
    isMuted,
    toggleMute,
  };
}
