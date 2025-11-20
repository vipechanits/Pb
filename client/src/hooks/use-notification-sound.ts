import { useEffect, useRef, useState } from 'react';

/**
 * Hook to play notification sounds using Web Audio API
 * Generates a pleasant double bell chime sound
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

  const playDoubleChime = () => {
    if (isMuted || !audioContextRef.current) return;

    const context = audioContextRef.current;
    const currentTime = context.currentTime;

    // First bell (higher pitch)
    const playBell = (startTime: number, frequency: number) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Bell envelope: quick attack, moderate decay
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    };

    // Play two bells with slight delay
    playBell(currentTime, 800); // Higher pitch first bell
    playBell(currentTime + 0.15, 600); // Lower pitch second bell
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('notifications-muted', String(newMuted));
  };

  return {
    playDoubleChime,
    isMuted,
    toggleMute,
  };
}
