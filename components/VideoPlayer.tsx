'use client';

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createSignedVideoUrl } from '@/app/actions/storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Video,
  Loader2,
  AlertCircle,
  RefreshCw,
  VideoOff,
} from 'lucide-react';

/**
 * Skeleton loader for video player
 */
export function VideoPlayerSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border bg-card overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 pt-0">
          <Skeleton className="w-full aspect-video rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export interface MediaPlayerRef {
  getCurrentTimeMs: () => number;
  seekToMs: (ms: number) => void;
}

interface VideoPlayerProps {
  sessionId: string;
  hasVideo: boolean; // Whether the session has recording_type = 'video'
  className?: string;
}

/**
 * VideoPlayer component for playing video from private Supabase Storage buckets.
 * Uses signed URLs with automatic refresh before expiration.
 * 
 * Features:
 * - Fetches signed URL with 60-second expiration
 * - Automatically refreshes URL 10 seconds before expiration during playback
 * - Handles expired URLs gracefully with automatic retry
 * - Shows friendly empty state when no video exists
 * 
 * Exposes ref methods:
 * - getCurrentTimeMs(): Returns current playback position in milliseconds
 * - seekToMs(ms): Seeks to the specified position in milliseconds
 */
export const VideoPlayer = forwardRef<MediaPlayerRef, VideoPlayerProps>(
  function VideoPlayer({ sessionId, hasVideo, className }, ref) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasPlayingRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getCurrentTimeMs: () => {
      if (videoRef.current) {
        return Math.round(videoRef.current.currentTime * 1000);
      }
      return 0;
    },
    seekToMs: (ms: number) => {
      if (videoRef.current) {
        const seconds = ms / 1000;
        videoRef.current.currentTime = Math.max(0, Math.min(seconds, videoRef.current.duration || seconds));
      }
    },
  }), []);

  /**
   * Fetch a new signed URL from the server
   */
  const fetchSignedUrl = useCallback(async (preservePlaybackState = false) => {
    if (!hasVideo) return;

    // Store current playback state if needed
    if (preservePlaybackState && videoRef.current) {
      wasPlayingRef.current = !videoRef.current.paused;
      currentTimeRef.current = videoRef.current.currentTime;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createSignedVideoUrl(sessionId);

      if (result.error) {
        setError(result.error);
        setVideoUrl(null);
        setExpiresAt(null);
        return;
      }

      setVideoUrl(result.url);
      setExpiresAt(result.expiresAt);
    } catch (err) {
      console.error('Failed to fetch signed URL:', err);
      setError('Failed to load video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, hasVideo]);

  /**
   * Schedule URL refresh before expiration
   * Refresh 10 seconds before expiration to ensure seamless playback
   */
  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (!expiresAt) return;

    // Calculate time until expiration (refresh 10 seconds early)
    const timeUntilExpiration = expiresAt - Date.now() - 10000;

    if (timeUntilExpiration <= 0) {
      // URL already expired or about to expire, refresh immediately
      fetchSignedUrl(true);
      return;
    }

    refreshTimeoutRef.current = setTimeout(() => {
      // Only refresh if video is playing or paused (user is actively watching)
      if (videoRef.current && !videoRef.current.ended) {
        fetchSignedUrl(true);
      }
    }, timeUntilExpiration);
  }, [expiresAt, fetchSignedUrl]);

  // Fetch signed URL on mount if hasVideo is true
  useEffect(() => {
    if (hasVideo) {
      fetchSignedUrl();
    }
  }, [hasVideo, fetchSignedUrl]);

  // Schedule refresh when expiresAt changes
  useEffect(() => {
    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [scheduleRefresh]);

  // Restore playback state after URL refresh
  useEffect(() => {
    if (videoUrl && videoRef.current && currentTimeRef.current > 0) {
      const video = videoRef.current;
      
      const handleCanPlay = () => {
        // Restore position
        video.currentTime = currentTimeRef.current;
        
        // Resume playback if it was playing before
        if (wasPlayingRef.current) {
          video.play().catch(() => {
            // Autoplay might be blocked, that's okay
          });
        }
        
        // Reset refs
        currentTimeRef.current = 0;
        wasPlayingRef.current = false;
        
        // Remove listener
        video.removeEventListener('canplay', handleCanPlay);
      };

      video.addEventListener('canplay', handleCanPlay);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [videoUrl]);

  // Handle video errors (including expired URLs)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = () => {
      // Check if URL might have expired
      if (expiresAt && Date.now() >= expiresAt) {
        setError('Playback URL expired. Refreshing...');
        fetchSignedUrl(true);
      } else {
        setError('Failed to load video. Please try again.');
      }
    };

    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('error', handleError);
    };
  }, [expiresAt, fetchSignedUrl]);

  // Empty state: No video recording exists
  if (!hasVideo) {
    return (
      <Card className={cn("border-border bg-card shadow-lg", className)}>
        <CardHeader className="py-2 px-3">
          <CardTitle className="flex items-center gap-2 text-sm text-foreground">
            <Video className="h-4 w-4 text-primary" />
            Video Playback
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2 pt-0">
          {/* 16:9 aspect ratio container - taller card */}
          <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: '320px' }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-muted/30 rounded-md border border-border">
              <div className="mb-3 rounded-full bg-muted p-4">
                <VideoOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium text-sm">No video recording yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use the Video Recorder above to create a recording
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border bg-card overflow-hidden shadow-lg", className)}>
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-sm text-foreground">
          <Video className="h-4 w-4 text-primary" />
          Video Playback
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2 pt-0">
        {/* Loading State */}
        {isLoading && !videoUrl && (
          <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: '320px' }}>
            <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-md border border-border">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading video...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: '320px' }}>
            <div className="absolute inset-0 rounded-md border border-destructive/30 bg-destructive/10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0" />
                <p className="text-sm text-foreground font-medium">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchSignedUrl()}
                  className="mt-2"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Video Player */}
        {videoUrl && !error && (
          <>
            {/* 16:9 aspect ratio container with min-height for larger video */}
            <div className="relative w-full rounded-md overflow-hidden bg-black" style={{ aspectRatio: '16/9', minHeight: '320px' }}>
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-contain"
              />
              
              {/* Loading overlay during URL refresh */}
              {isLoading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center gap-2 text-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Refreshing URL...</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});
