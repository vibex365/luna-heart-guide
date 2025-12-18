import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseVoiceRecorderOptions {
  maxDuration?: number; // in seconds
  onRecordingComplete?: (audioUrl: string) => void;
}

export const useVoiceRecorder = (options: UseVoiceRecorderOptions = {}) => {
  const { maxDuration = 60, onRecordingComplete } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Update duration every 100ms
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  }, [maxDuration]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    
    return new Promise<Blob>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        resolve(audioBlob);
      };
      
      mediaRecorder.stop();
      setIsRecording(false);
    });
  }, []);

  const uploadAudio = useCallback(async (userId: string, gameId: string): Promise<string | null> => {
    const audioBlob = await stopRecording();
    if (!audioBlob || audioBlob.size === 0) {
      toast.error("No audio recorded");
      return null;
    }
    
    setIsUploading(true);
    
    try {
      const fileName = `${userId}/${gameId}/${Date.now()}.webm`;
      
      const { data, error } = await supabase.storage
        .from("voice-messages")
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: true,
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from("voice-messages")
        .getPublicUrl(data.path);
      
      // For private bucket, we need to create a signed URL
      const { data: signedData } = await supabase.storage
        .from("voice-messages")
        .createSignedUrl(data.path, 3600 * 24); // 24 hour expiry
      
      const url = signedData?.signedUrl || urlData.publicUrl;
      setAudioUrl(url);
      onRecordingComplete?.(url);
      
      return url;
    } catch (error) {
      console.error("Error uploading audio:", error);
      toast.error("Failed to upload voice message");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [stopRecording, onRecordingComplete]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setDuration(0);
    audioChunksRef.current = [];
  }, []);

  const clearAudio = useCallback(() => {
    setAudioUrl(null);
    setDuration(0);
  }, []);

  return {
    isRecording,
    isUploading,
    audioUrl,
    duration,
    startRecording,
    stopRecording,
    uploadAudio,
    cancelRecording,
    clearAudio,
  };
};
