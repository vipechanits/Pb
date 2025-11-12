import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for playing notification sounds
 * Uses Web Audio API to generate pleasant notification tones
 */
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on mount
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext();
    }

    // Cleanup on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /**
   * Play a pleasant notification sound (similar to Replit's notification)
   * Uses a combination of tones for a professional sound
   */
  const playNotificationSound = useCallback(() => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const currentTime = audioContext.currentTime;

    // Create oscillators for a pleasant two-tone notification
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure first tone (higher pitch)
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(800, currentTime); // 800 Hz

    // Configure second tone (harmonious)
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(1000, currentTime); // 1000 Hz

    // Volume envelope (fade in and out)
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, currentTime + 0.05); // Fade in
    gainNode.gain.linearRampToValueAtTime(0.1, currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.3); // Fade out

    // Play the sound
    oscillator1.start(currentTime);
    oscillator2.start(currentTime);
    
    // Stop after duration
    oscillator1.stop(currentTime + 0.3);
    oscillator2.stop(currentTime + 0.3);
  }, []);

  /**
   * Play a success sound (payment confirmed, activation complete)
   */
  const playSuccessSound = useCallback(() => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const currentTime = audioContext.currentTime;

    // Create a pleasant ascending tone sequence
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)
    
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, currentTime + index * 0.1);
      
      gainNode.gain.setValueAtTime(0, currentTime + index * 0.1);
      gainNode.gain.linearRampToValueAtTime(0.12, currentTime + index * 0.1 + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, currentTime + index * 0.1 + 0.2);
      
      oscillator.start(currentTime + index * 0.1);
      oscillator.stop(currentTime + index * 0.1 + 0.2);
    });
  }, []);

  /**
   * Play a warning/alert sound
   */
  const playAlertSound = useCallback(() => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const currentTime = audioContext.currentTime;

    // Create a two-tone alert
    [600, 600].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(frequency, currentTime + index * 0.15);
      
      gainNode.gain.setValueAtTime(0, currentTime + index * 0.15);
      gainNode.gain.linearRampToValueAtTime(0.08, currentTime + index * 0.15 + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, currentTime + index * 0.15 + 0.12);
      
      oscillator.start(currentTime + index * 0.15);
      oscillator.stop(currentTime + index * 0.15 + 0.12);
    });
  }, []);

  return {
    playNotificationSound,
    playSuccessSound,
    playAlertSound,
  };
}
