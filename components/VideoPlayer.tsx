'use client';

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createSignedVideoUrl } from '@/app/actions/storage';
import {
  Card,
  CardContent,
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
  SkipBack,
  SkipForward,
  Gauge,
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
  compact?: boolean;
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
  function VideoPlayer({ sessionId, hasVideo, className, compact = false }, ref) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasPlayingRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);

  // Available playback speeds
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

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

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(0, videoRef.current.currentTime - 10);
      videoRef.current.currentTime = newTime;
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(
        videoRef.current.duration || Infinity,
        videoRef.current.currentTime + 10
      );
      videoRef.current.currentTime = newTime;
    }
  };

  // Empty state: No video recording exists
  if (!hasVideo) {
    return (
      <Card className={cn(
        "overflow-hidden border-border/70 bg-card/70 shadow-[var(--shadow-card)] backdrop-blur",
        compact ? "rounded-xl border-0 bg-transparent shadow-none" : "rounded-[1.75rem] border-border/70",
        className
      )}>
        {!compact && (
          <CardHeader className="px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm text-foreground">
              <Video className="h-4 w-4 text-primary" />
              Video Playback
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={cn(compact ? "p-0" : "px-3 pb-3 pt-0")}>
          <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: compact ? '180px' : '320px' }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/30 text-center">
              <div className="mb-3 rounded-2xl bg-muted p-4">
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
    <Card className={cn(
      "overflow-hidden border-blue-100/80 bg-[#f8fbff]/80 shadow-[var(--shadow-card)] backdrop-blur-xl dark:border-border/70 dark:bg-card/70",
      compact ? "rounded-xl border-0 bg-transparent shadow-none" : "rounded-[1.75rem]",
      className
    )}>
      {!compact && (
        <CardHeader className="border-b border-blue-100/70 bg-[#eef4fa]/45 px-4 py-3 dark:border-border/70 dark:bg-background/35">
          <CardTitle className="flex items-center gap-2 text-sm text-foreground">
            <Video className="h-4 w-4 text-primary" />
            Video Playback
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(compact ? "p-0" : "px-3 pb-4 pt-3")}>
        {/* Loading State */}
        {isLoading && !videoUrl && (
          <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: compact ? '180px' : '320px' }}>
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-border/70 bg-muted/30">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading video...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: compact ? '180px' : '320px' }}>
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-destructive/30 bg-destructive/10">
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
            <div className="relative w-full overflow-hidden rounded-2xl border border-blue-100/80 bg-[linear-gradient(135deg,#fbfdff_0%,#eef4ff_48%,#eaf2fb_100%)] shadow-[0_1px_1px_rgba(255,255,255,0.85)_inset,0_12px_34px_rgba(59,99,243,0.10)] ring-1 ring-blue-200/60 dark:border-transparent dark:bg-none dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950 dark:shadow-[var(--shadow-elevated)] dark:ring-white/10" style={{ aspectRatio: '16/9', minHeight: compact ? '180px' : '320px' }}>
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-contain"
              />
              <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),inset_0_0_42px_rgba(59,99,243,0.06)] dark:shadow-[inset_0_0_80px_rgba(0,0,0,0.45)]" aria-hidden />
              
              {/* Loading overlay during URL refresh */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Refreshing URL...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Controls */}
            <div className={cn("flex flex-col", compact ? "gap-1 px-0 pt-1" : "gap-3 px-1 pt-4")}>
              {/* Skip Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={skipBackward}
                  className="h-8 rounded-full border border-blue-100/80 bg-[#fbfdff]/80 px-3 text-slate-600 shadow-sm backdrop-blur-sm hover:border-primary/25 hover:bg-white/90 hover:text-slate-900 dark:border-border/40 dark:bg-background/50 dark:text-muted-foreground dark:hover:border-border/70 dark:hover:bg-background/80 dark:hover:text-foreground"
                  title="Skip backward 10s"
                >
                  <SkipBack className="h-4 w-4 mr-1" />
                  10s
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={skipForward}
                  className="h-8 rounded-full border border-blue-100/80 bg-[#fbfdff]/80 px-3 text-slate-600 shadow-sm backdrop-blur-sm hover:border-primary/25 hover:bg-white/90 hover:text-slate-900 dark:border-border/40 dark:bg-background/50 dark:text-muted-foreground dark:hover:border-border/70 dark:hover:bg-background/80 dark:hover:text-foreground"
                  title="Skip forward 10s"
                >
                  10s
                  <SkipForward className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Speed Control */}
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-blue-100/80 bg-[#fbfdff]/80 px-3 py-1.5 shadow-sm backdrop-blur-sm dark:border-border/35 dark:bg-background/40">
                <Gauge className="h-3.5 w-3.5 text-slate-500 dark:text-muted-foreground" />
                <span className="text-xs font-medium text-slate-600 dark:text-muted-foreground">Speed</span>
                <div className="flex items-center gap-0.5">
                  {speedOptions.map((speed) => (
                    <Button
                      key={speed}
                      size="sm"
                      variant={playbackSpeed === speed ? 'default' : 'ghost'}
                      onClick={() => handleSpeedChange(speed)}
                      className={cn(
                        "h-7 min-w-[2.25rem] rounded-full px-2 text-xs font-semibold tabular-nums",
                        playbackSpeed === speed 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-slate-600 hover:bg-white/80 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-background/70 dark:hover:text-foreground"
                      )}
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});
