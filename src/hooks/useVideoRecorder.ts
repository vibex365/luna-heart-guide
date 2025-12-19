import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseVideoRecorderOptions {
  maxDuration?: number;
  onRecordingComplete?: (videoUrl: string, thumbnailUrl?: string) => void;
}

export const useVideoRecorder = (options: UseVideoRecorderOptions = {}) => {
  const { maxDuration = 60, onRecordingComplete } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const videoBlobRef = useRef<Blob | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      setStream(mediaStream);
      return mediaStream;
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera. Please check permissions.");
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const getSupportedMimeType = useCallback(() => {
    // Check for supported MIME types in order of preference
    const mimeTypes = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4;codecs=avc1",
      "video/mp4",
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log("Using MIME type:", mimeType);
        return mimeType;
      }
    }

    // Fallback - let browser choose
    console.log("No preferred MIME type supported, using default");
    return undefined;
  }, []);

  const startRecording = useCallback(async () => {
    let mediaStream = stream;
    if (!mediaStream) {
      mediaStream = await startCamera();
      if (!mediaStream) return;
    }

    try {
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

      console.log("Creating MediaRecorder with options:", options);
      const mediaRecorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording error occurred");
        cancelRecording();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      startTimeRef.current = Date.now();
      console.log("Recording started");

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not start recording. Your browser may not support video recording.");
    }
  }, [stream, startCamera, maxDuration, getSupportedMimeType]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

    return new Promise<Blob | null>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        const videoBlob = new Blob(videoChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        videoBlobRef.current = videoBlob;

        // Create preview URL
        const url = URL.createObjectURL(videoBlob);
        setPreviewUrl(url);
        setIsPreviewing(true);
        setIsRecording(false);

        resolve(videoBlob);
      };

      mediaRecorder.stop();
    });
  }, []);

  const generateThumbnail = useCallback(async (videoBlob: Blob): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(videoBlob);
      video.currentTime = 0.5;
      video.muted = true;

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(URL.createObjectURL(blob));
              } else {
                resolve(null);
              }
            },
            "image/jpeg",
            0.7
          );
        } else {
          resolve(null);
        }
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => resolve(null);
    });
  }, []);

  const uploadVideo = useCallback(
    async (partnerLinkId: string, userId: string): Promise<{ videoUrl: string; thumbnailUrl?: string } | null> => {
      const videoBlob = videoBlobRef.current;
      if (!videoBlob || videoBlob.size === 0) {
        toast.error("No video recorded");
        return null;
      }

      setIsUploading(true);

      try {
        const timestamp = Date.now();
        const videoFileName = `${partnerLinkId}/${userId}/${timestamp}.webm`;

        // Upload video
        const { data: videoData, error: videoError } = await supabase.storage
          .from("couples-media")
          .upload(videoFileName, videoBlob, {
            contentType: videoBlob.type,
            upsert: true,
          });

        if (videoError) throw videoError;

        // Get signed URL for video
        const { data: signedVideoData } = await supabase.storage
          .from("couples-media")
          .createSignedUrl(videoData.path, 3600 * 24);

        const finalVideoUrl = signedVideoData?.signedUrl || "";

        // Generate and upload thumbnail
        let thumbnailUrl: string | undefined;
        const thumbnailBlob = await generateThumbnailBlob(videoBlob);
        if (thumbnailBlob) {
          const thumbFileName = `${partnerLinkId}/${userId}/${timestamp}_thumb.jpg`;
          const { data: thumbData } = await supabase.storage
            .from("couples-media")
            .upload(thumbFileName, thumbnailBlob, {
              contentType: "image/jpeg",
              upsert: true,
            });

          if (thumbData) {
            const { data: signedThumbData } = await supabase.storage
              .from("couples-media")
              .createSignedUrl(thumbData.path, 3600 * 24);
            thumbnailUrl = signedThumbData?.signedUrl;
          }
        }

        setVideoUrl(finalVideoUrl);
        onRecordingComplete?.(finalVideoUrl, thumbnailUrl);

        // Cleanup
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setIsPreviewing(false);
        stopCamera();

        return { videoUrl: finalVideoUrl, thumbnailUrl };
      } catch (error) {
        console.error("Error uploading video:", error);
        toast.error("Failed to upload video");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [previewUrl, stopCamera, onRecordingComplete]
  );

  const generateThumbnailBlob = async (videoBlob: Blob): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(videoBlob);
      video.currentTime = 0.5;
      video.muted = true;

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(video.videoWidth, 320);
        canvas.height = Math.min(video.videoHeight, 480);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => resolve(blob),
            "image/jpeg",
            0.7
          );
        } else {
          resolve(null);
        }
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => resolve(null);
    });
  };

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    stopCamera();
    setIsRecording(false);
    setIsPreviewing(false);
    setDuration(0);
    videoChunksRef.current = [];
    videoBlobRef.current = null;
  }, [previewUrl, stopCamera]);

  const retakeVideo = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setIsPreviewing(false);
    setDuration(0);
    videoChunksRef.current = [];
    videoBlobRef.current = null;
  }, [previewUrl]);

  const clearVideo = useCallback(() => {
    setVideoUrl(null);
    setDuration(0);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setIsPreviewing(false);
  }, [previewUrl]);

  return {
    isRecording,
    isUploading,
    isPreviewing,
    videoUrl,
    previewUrl,
    duration,
    stream,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    uploadVideo,
    cancelRecording,
    retakeVideo,
    clearVideo,
  };
};
