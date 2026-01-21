'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createSignedVideoUrl } from '@/app/actions/storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Video,
  Loader2,
  AlertCircle,
  RefreshCw,
  VideoOff,
} from 'lucide-react';

interface VideoPlayerProps {
  sessionId: string;
  hasVideo: boolean; // Whether the session has video_storage_path
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
 */
export function VideoPlayer({ sessionId, hasVideo, className }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasPlayingRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);

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
      <Card className={`border-slate-700 bg-slate-800/50 ${className || ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Video className="h-5 w-5" />
            Video Playback
          </CardTitle>
          <CardDescription className="text-slate-400">
            Watch your recorded interview video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-slate-700/50 p-6">
              <VideoOff className="h-10 w-10 text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium">No video recording yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Use the Video Recorder above to create a recording for this session
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-slate-700 bg-slate-800/50 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <Video className="h-5 w-5" />
          Video Playback
        </CardTitle>
        <CardDescription className="text-slate-400">
          Watch your recorded interview video
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && !videoUrl && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <span className="ml-3 text-slate-400">Loading video...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-300 font-medium">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchSignedUrl()}
                className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-200"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Video Player */}
        {videoUrl && !error && (
          <div className="space-y-4">
            {/* Video element with native controls */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
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
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Refreshing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* URL refresh indicator */}
            {expiresAt && (
              <p className="text-xs text-slate-500 text-center">
                Playback URL refreshes automatically
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
