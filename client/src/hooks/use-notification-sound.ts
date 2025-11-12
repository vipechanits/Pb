import { useCallback, useRef } from 'react';

/**
 * Custom hook for playing notification sounds
 * Uses Web Audio API to generate pleasant notification tones
 */
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Get or create AudioContext and ensure it's resumed
   * Required for Chrome/Safari which suspend context until user interaction
   */
  const getAudioContext = useCallback(async (): Promise<AudioContext | null> => {
    if (typeof window === 'undefined') return null;

    // Create context if it doesn't exist (with webkit fallback)
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      audioContextRef.current = new AudioContextClass();
    }

    const audioContext = audioContextRef.current;

    // Resume context if suspended (required by Chrome/Safari)
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error);
        return null;
      }
    }

    return audioContext;
  }, []);

  /**
   * Play a pleasant notification sound (similar to Replit's notification)
   * Uses a combination of tones for a professional sound
   */
  const playNotificationSound = useCallback(async () => {
    const audioContext = await getAudioContext();
    if (!audioContext) return;

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
  }, [getAudioContext]);

  /**
   * Play a success sound (payment confirmed, activation complete)
   */
  const playSuccessSound = useCallback(async () => {
    const audioContext = await getAudioContext();
    if (!audioContext) return;

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
  }, [getAudioContext]);

  /**
   * Play a warning/alert sound
   */
  const playAlertSound = useCallback(async () => {
    const audioContext = await getAudioContext();
    if (!audioContext) return;

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
  }, [getAudioContext]);

  return {
    playNotificationSound,
    playSuccessSound,
    playAlertSound,
  };
}
