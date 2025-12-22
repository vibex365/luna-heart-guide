import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export type VoiceSessionStatus = 'idle' | 'connecting' | 'active' | 'ending' | 'ended' | 'error';

interface VoiceSessionState {
  status: VoiceSessionStatus;
  sessionId: string | null;
  durationSeconds: number;
  isLunaSpeaking: boolean;
  transcript: string;
  lunaResponse: string;
}

export const useVoiceSession = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<VoiceSessionState>({
    status: 'idle',
    sessionId: null,
    durationSeconds: 0,
    isLunaSpeaking: false,
    transcript: '',
    lunaResponse: ''
  });

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Duration timer
  useEffect(() => {
    if (state.status === 'active' && startTimeRef.current) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!.getTime()) / 1000);
        setState(prev => ({ ...prev, durationSeconds: elapsed }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.status]);

  const startSession = useCallback(async (sessionType: 'solo' | 'couples' = 'solo', partnerLinkId?: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to start a voice session.",
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({ ...prev, status: 'connecting', transcript: '', lunaResponse: '' }));

    try {
      // 1. Start session on backend
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('voice-session-start', {
        body: { sessionType, partnerLinkId }
      });

      if (sessionError || sessionData?.error) {
        const errorMsg = sessionData?.error || sessionError?.message;
        if (sessionData?.error === 'INSUFFICIENT_MINUTES') {
          toast({
            title: "No Minutes Available",
            description: sessionData.message,
            variant: "destructive"
          });
          setState(prev => ({ ...prev, status: 'idle' }));
          return { needsMinutes: true };
        }
        throw new Error(errorMsg);
      }

      const { sessionId, userName, partnerName, minutesBalance } = sessionData;
      setState(prev => ({ ...prev, sessionId }));

      // 2. Get ephemeral token from OpenAI
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('realtime-voice-token', {
        body: { sessionId, sessionType, userName, partnerName }
      });

      if (tokenError || tokenData?.error) {
        throw new Error(tokenData?.error || tokenError?.message);
      }

      const EPHEMERAL_KEY = tokenData.client_secret?.value;
      if (!EPHEMERAL_KEY) {
        throw new Error("Failed to get voice session token");
      }

      // 3. Create WebRTC peer connection
      pcRef.current = new RTCPeerConnection();

      // Set up audio element for remote audio
      audioElRef.current = document.createElement('audio');
      audioElRef.current.autoplay = true;
      
      // Create AudioContext for recording both streams
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const destination = audioContext.createMediaStreamDestination();
      
      pcRef.current.ontrack = (e) => {
        audioElRef.current!.srcObject = e.streams[0];
        // Add remote audio to recording
        try {
          const remoteSource = audioContext.createMediaStreamSource(e.streams[0]);
          remoteSource.connect(destination);
        } catch (err) {
          console.log("Could not add remote audio to recording:", err);
        }
      };

      // Get local audio
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      pcRef.current.addTrack(streamRef.current.getTracks()[0]);
      
      // Add local audio to recording destination
      try {
        const localSource = audioContext.createMediaStreamSource(streamRef.current);
        localSource.connect(destination);
        
        // Start recording
        audioChunksRef.current = [];
        mediaRecorderRef.current = new MediaRecorder(destination.stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorderRef.current.start(1000); // Capture every second
        console.log("Audio recording started");
      } catch (err) {
        console.log("Could not start audio recording:", err);
      }

      // Set up data channel for events
      dcRef.current = pcRef.current.createDataChannel('oai-events');
      
      dcRef.current.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log("Voice event:", event.type);

          if (event.type === 'response.audio_transcript.delta') {
            setState(prev => ({ 
              ...prev, 
              lunaResponse: prev.lunaResponse + (event.delta || ''),
              isLunaSpeaking: true
            }));
          } else if (event.type === 'response.audio.done') {
            setState(prev => ({ ...prev, isLunaSpeaking: false }));
          } else if (event.type === 'conversation.item.input_audio_transcription.completed') {
            setState(prev => ({ 
              ...prev, 
              transcript: prev.transcript + (event.transcript || '') + '\n'
            }));
          } else if (event.type === 'response.done') {
            setState(prev => ({ ...prev, lunaResponse: prev.lunaResponse + '\n\n' }));
          }
        } catch (err) {
          console.error("Error parsing voice event:", err);
        }
      });

      // Create and set local description
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      // Connect to OpenAI Realtime API
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp'
        }
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect to voice service');
      }

      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text()
      };

      await pcRef.current.setRemoteDescription(answer);
      
      startTimeRef.current = new Date();
      setState(prev => ({ ...prev, status: 'active' }));

      toast({
        title: "Connected to Luna",
        description: `You have ${minutesBalance} minutes available.`
      });

      return { success: true };

    } catch (error) {
      console.error("Voice session error:", error);
      setState(prev => ({ ...prev, status: 'error' }));
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to start voice session.",
        variant: "destructive"
      });
      return { error: true };
    }
  }, [user, toast]);

  const endSession = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'ending' }));

    try {
      // Stop and save recording
      let audioUrl: string | null = null;
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        
        // Wait for recording to finish
        await new Promise<void>((resolve) => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = () => resolve();
          } else {
            resolve();
          }
        });
        
        // Upload recording if we have data
        if (audioChunksRef.current.length > 0 && state.sessionId && user) {
          try {
            const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
            const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            const fileName = `${user.id}/${state.sessionId}.${extension}`;
            
            const { error: uploadError } = await supabase.storage
              .from('voice-recordings')
              .upload(fileName, audioBlob);
            
            if (!uploadError) {
              audioUrl = fileName;
              console.log("Audio recording uploaded:", fileName);
            } else {
              console.error("Failed to upload recording:", uploadError);
            }
          } catch (uploadErr) {
            console.error("Error uploading recording:", uploadErr);
          }
        }
        
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      }

      // Stop media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Close data channel
      if (dcRef.current) {
        dcRef.current.close();
        dcRef.current = null;
      }

      // Close peer connection
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      // Stop audio
      if (audioElRef.current) {
        audioElRef.current.srcObject = null;
        audioElRef.current = null;
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Report session end to backend with transcripts and audio URL
      if (state.sessionId) {
        const { data, error } = await supabase.functions.invoke('voice-session-end', {
          body: {
            sessionId: state.sessionId,
            durationSeconds: state.durationSeconds,
            summary: state.lunaResponse.slice(0, 500),
            userTranscript: state.transcript,
            lunaTranscript: state.lunaResponse,
            audioUrl
          }
        });

        if (!error && data) {
          toast({
            title: "Session Ended",
            description: `Used ${data.minutesBilled} minute(s). Balance: ${data.newBalance} minutes.`
          });
        }
      }

      // Refresh minutes balance
      queryClient.invalidateQueries({ queryKey: ['user-minutes'] });
      queryClient.invalidateQueries({ queryKey: ['minute-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['voice-sessions'] });

      setState({
        status: 'ended',
        sessionId: null,
        durationSeconds: 0,
        isLunaSpeaking: false,
        transcript: '',
        lunaResponse: ''
      });

    } catch (error) {
      console.error("Error ending session:", error);
      setState(prev => ({ ...prev, status: 'idle' }));
    }
  }, [state.sessionId, state.durationSeconds, state.lunaResponse, state.transcript, user, toast, queryClient]);

  const resetSession = useCallback(() => {
    setState({
      status: 'idle',
      sessionId: null,
      durationSeconds: 0,
      isLunaSpeaking: false,
      transcript: '',
      lunaResponse: ''
    });
  }, []);

  return {
    ...state,
    startSession,
    endSession,
    resetSession,
    isConnecting: state.status === 'connecting',
    isActive: state.status === 'active',
    isEnding: state.status === 'ending'
  };
};
