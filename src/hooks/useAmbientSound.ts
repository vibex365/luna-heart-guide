import { useState, useRef, useEffect, useCallback } from "react";

interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export const ambientSounds: AmbientSound[] = [
  {
    id: "rain",
    name: "Rain",
    icon: "🌧️",
    url: "https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3",
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    icon: "🌊",
    url: "https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3",
  },
  {
    id: "forest",
    name: "Forest",
    icon: "🌲",
    url: "https://assets.mixkit.co/active_storage/sfx/2437/2437-preview.mp3",
  },
  {
    id: "wind",
    name: "Gentle Wind",
    icon: "💨",
    url: "https://assets.mixkit.co/active_storage/sfx/2433/2433-preview.mp3",
  },
  {
    id: "fire",
    name: "Crackling Fire",
    icon: "🔥",
    url: "https://assets.mixkit.co/active_storage/sfx/2435/2435-preview.mp3",
  },
];

export function useAmbientSound() {
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((soundId: string) => {
    const sound = ambientSounds.find((s) => s.id === soundId);
    if (!sound) return;

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsLoading(true);
    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.volume = volume;

    audio.oncanplaythrough = () => {
      setIsLoading(false);
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        setIsLoading(false);
      });
    };

    audio.onerror = () => {
      console.error("Error loading audio");
      setIsLoading(false);
    };

    audioRef.current = audio;
    setCurrentSound(soundId);
  }, [volume]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentSound(null);
  }, []);

  const toggleSound = useCallback((soundId: string) => {
    if (currentSound === soundId) {
      stopSound();
    } else {
      playSound(soundId);
    }
  }, [currentSound, playSound, stopSound]);

  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    currentSound,
    volume,
    isLoading,
    playSound,
    stopSound,
    toggleSound,
    updateVolume,
    sounds: ambientSounds,
  };
}
