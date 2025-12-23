import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import LunaAvatar from './LunaAvatar';

// Demo conversation transcript
const demoTranscript = [
  { speaker: 'user', text: "Luna, I've been feeling really stressed about my relationship lately...", delay: 0 },
  { speaker: 'luna', text: "I hear you, and I'm so glad you reached out. Relationships can be challenging, especially when stress builds up. Tell me, what's been weighing on you the most?", delay: 3000 },
  { speaker: 'user', text: "We just don't seem to communicate well anymore. Everything turns into an argument.", delay: 8000 },
  { speaker: 'luna', text: "That sounds really frustrating. When communication breaks down, it can feel like you're speaking different languages. Have you noticed any patterns in when these arguments tend to happen?", delay: 12000 },
];

const LunaVoiceDemo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<typeof demoTranscript>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.5 });
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  const createAmbientSound = useCallback(() => {
    if (audioContextRef.current || isMuted) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.02; // Very soft ambient sound
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Create soft ambient tones (A minor chord: A, C, E)
      const frequencies = [220, 261.63, 329.63, 440];
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        oscGain.gain.value = 0.3 / (index + 1); // Decreasing volume for higher frequencies
        
        // Add slight detuning for richness
        oscillator.detune.value = Math.random() * 10 - 5;
        
        oscillator.connect(oscGain);
        oscGain.connect(gainNode);
        oscillator.start();
        oscillatorsRef.current.push(oscillator);
      });
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }, [isMuted]);

  const stopAmbientSound = useCallback(() => {
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    oscillatorsRef.current = [];
    
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    gainNodeRef.current = null;
  }, []);

  // Handle mute toggle
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 0.02;
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      transcriptTimeoutsRef.current.forEach(clearTimeout);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      stopAmbientSound();
    };
  }, [stopAmbientSound]);

  useEffect(() => {
    if (isInView && !isPlaying) {
      handlePlay();
    } else if (!isInView && isPlaying) {
      handlePause();
    }
  }, [isInView]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentTranscript([]);
    setProgress(0);
    
    // Clear previous timeouts
    transcriptTimeoutsRef.current.forEach(clearTimeout);
    transcriptTimeoutsRef.current = [];

    // Start ambient sound
    createAmbientSound();

    // Simulate transcript appearing over time
    demoTranscript.forEach((item) => {
      const timeout = setTimeout(() => {
        setCurrentTranscript(prev => [...prev, item]);
      }, item.delay);
      transcriptTimeoutsRef.current.push(timeout);
    });

    // Progress bar simulation (20 second demo)
    const totalDuration = 20000;
    const updateInterval = 100;
    let elapsed = 0;

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      elapsed += updateInterval;
      setProgress((elapsed / totalDuration) * 100);
      
      if (elapsed >= totalDuration) {
        // Loop the demo
        elapsed = 0;
        setCurrentTranscript([]);
        setProgress(0);
        
        transcriptTimeoutsRef.current.forEach(clearTimeout);
        transcriptTimeoutsRef.current = [];
        
        demoTranscript.forEach((item) => {
          const timeout = setTimeout(() => {
            setCurrentTranscript(prev => [...prev, item]);
          }, item.delay);
          transcriptTimeoutsRef.current.push(timeout);
        });
      }
    }, updateInterval);
  };

  const handlePause = () => {
    setIsPlaying(false);
    transcriptTimeoutsRef.current.forEach(clearTimeout);
    transcriptTimeoutsRef.current = [];
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    stopAmbientSound();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div ref={containerRef} className="relative bg-card/80 backdrop-blur-sm rounded-3xl border border-accent/20 shadow-luna p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <LunaAvatar size="md" showGlow={isPlaying} />
            {isPlaying && (
              <motion.div 
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">Live Demo</h3>
            <p className="text-xs text-muted-foreground">
              {isPlaying ? "Voice session in progress..." : "Click to experience Luna"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-accent-foreground" />
            ) : (
              <Play className="w-5 h-5 text-accent-foreground ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted/30 rounded-full mb-4 overflow-hidden">
        <motion.div 
          className="h-full bg-accent rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Audio waveform visualization */}
      <div className="flex items-center justify-center gap-0.5 h-12 mb-4">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-accent/60 rounded-full"
            animate={isPlaying ? {
              height: [4, Math.random() * 32 + 8, 4],
            } : { height: 4 }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.02,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Live transcript */}
      <div className="bg-muted/20 rounded-xl p-4 min-h-[160px] max-h-[200px] overflow-y-auto">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Live Transcript</p>
        <AnimatePresence>
          {currentTranscript.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-3 ${item.speaker === 'luna' ? 'pl-0' : 'pl-4'}`}
            >
              <p className={`text-xs font-medium mb-1 ${
                item.speaker === 'luna' ? 'text-accent' : 'text-emerald-400'
              }`}>
                {item.speaker === 'luna' ? '🌙 Luna' : '👤 You'}
              </p>
              <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {currentTranscript.length === 0 && !isPlaying && (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <p className="text-muted-foreground text-sm">Scroll to start the demo</p>
            <p className="text-muted-foreground/60 text-xs mt-1">or click play above</p>
          </div>
        )}
        
        {isPlaying && currentTranscript.length === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              Listening...
            </motion.span>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
        <span className="text-xs text-muted-foreground">
          {isPlaying ? 'Demo Active • Private Session' : 'Demo Ready'}
        </span>
      </div>
    </div>
  );
};

export default LunaVoiceDemo;
