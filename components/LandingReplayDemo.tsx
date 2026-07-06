'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  Maximize2, 
  Bookmark,
  MessageSquareText,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo data - bookmarks with timestamps and associated transcript lines
const DEMO_BOOKMARKS = [
  { id: 1, time: 12, label: '00:12', transcriptIndex: 0 },
  { id: 2, time: 45, label: '00:45', transcriptIndex: 2 },
  { id: 3, time: 70, label: '01:10', transcriptIndex: 4 },
  { id: 4, time: 98, label: '01:38', transcriptIndex: 6 },
  { id: 5, time: 125, label: '02:05', transcriptIndex: 8 },
];

const DEMO_TRANSCRIPT = [
  { time: '00:10', speaker: 'Interviewer', text: 'Tell me about a challenging project you led recently.' },
  { time: '00:18', speaker: 'You', text: 'Sure! I led a migration of our monolith to microservices...' },
  { time: '00:42', speaker: 'You', text: '...the main challenge was maintaining uptime during the transition.' },
  { time: '00:55', speaker: 'Interviewer', text: 'How did you handle team coordination?' },
  { time: '01:08', speaker: 'You', text: 'We implemented daily standups and async documentation updates.' },
  { time: '01:22', speaker: 'Interviewer', text: 'What metrics did you track for success?' },
  { time: '01:35', speaker: 'You', text: 'Latency, error rates, and deployment frequency were our key metrics.' },
  { time: '01:50', speaker: 'Interviewer', text: 'Interesting approach. What would you do differently?' },
  { time: '02:02', speaker: 'You', text: 'I would have invested more in automated testing earlier on.' },
  { time: '02:15', speaker: 'Interviewer', text: 'Great insight. Let\'s move on to system design...' },
];

const TOTAL_DURATION = 150; // 2:30 in seconds

export function LandingReplayDemo() {
  const [currentTime, setCurrentTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [highlightedLine, setHighlightedLine] = React.useState<number | null>(null);
  const transcriptRef = React.useRef<HTMLDivElement>(null);
  const lineRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle bookmark click
  const handleBookmarkClick = (bookmark: typeof DEMO_BOOKMARKS[0]) => {
    setCurrentTime(bookmark.time);
    setHighlightedLine(bookmark.transcriptIndex);
    
    // Scroll to transcript line
    const lineElement = lineRefs.current[bookmark.transcriptIndex];
    if (lineElement && transcriptRef.current) {
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Clear highlight after animation
    setTimeout(() => {
      setHighlightedLine(null);
    }, 2000);
  };

  // Handle scrubber click
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = Math.floor(percentage * TOTAL_DURATION);
    setCurrentTime(Math.max(0, Math.min(newTime, TOTAL_DURATION)));
  };

  // Calculate scrubber position
  const scrubberPosition = (currentTime / TOTAL_DURATION) * 100;

  return (
    <Card className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border-border/70 bg-card/70 shadow-[var(--shadow-elevated)] backdrop-blur-xl">
      <CardContent className="p-0">
        <div className="border-b border-border/70 bg-background/45 px-5 py-4 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[-0.015em] text-foreground">
                  Replay room
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Synced media, transcript, and coachable moments
                </div>
              </div>
            </div>
            <Badge variant="info" className="w-fit">
              Live demo
            </Badge>
          </div>
        </div>

        <div className="grid divide-y divide-border/70 lg:grid-cols-[1.08fr_0.92fr] lg:divide-x lg:divide-y-0">
          <div className="space-y-5 p-5 md:p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Play className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Practice answer recording</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                02:30
              </Badge>
            </div>

            <div className="group relative aspect-video overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-muted via-background to-primary/10 shadow-[var(--shadow-card)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--primary),transparent_34%),radial-gradient(circle_at_70%_80%,var(--info),transparent_30%)] opacity-20" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Job Prep practice
              </div>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 flex cursor-pointer items-center justify-center"
              >
                <div className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-primary/90 shadow-2xl shadow-primary/30 backdrop-blur transition-all duration-300",
                  "hover:scale-110 hover:bg-primary",
                  "group-hover:shadow-primary/40"
                )}>
                  {isPlaying ? (
                    <Pause className="ml-0 h-8 w-8 text-primary-foreground" />
                  ) : (
                    <Play className="ml-1 h-8 w-8 text-primary-foreground" />
                  )}
                </div>
              </button>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                <div className="flex items-center gap-3 text-white">
                  <span className="font-mono text-xs font-medium tabular-nums">{formatTime(currentTime)}</span>
                  <span className="text-xs text-white/60">/</span>
                  <span className="font-mono text-xs text-white/60 tabular-nums">{formatTime(TOTAL_DURATION)}</span>
                  <div className="flex-1" />
                  <Volume2 className="h-4 w-4 cursor-pointer text-white/80 transition-colors hover:text-white" />
                  <Maximize2 className="h-4 w-4 cursor-pointer text-white/80 transition-colors hover:text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/50 p-4 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Timeline
                </span>
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {formatTime(currentTime)}
                </span>
              </div>
              <div 
                className="group/scrubber relative h-2 cursor-pointer rounded-full bg-muted"
                onClick={handleScrubberClick}
              >
                <div 
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary to-info transition-all duration-150"
                  style={{ width: `${scrubberPosition}%` }}
                />
                
                <div 
                  className={cn(
                    "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-lg transition-all duration-150",
                    "scale-75 opacity-0 group-hover/scrubber:scale-100 group-hover/scrubber:opacity-100"
                  )}
                  style={{ left: `calc(${scrubberPosition}% - 8px)` }}
                />

                {DEMO_BOOKMARKS.map((bookmark) => {
                  const position = (bookmark.time / TOTAL_DURATION) * 100;
                  return (
                    <button
                      key={bookmark.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmarkClick(bookmark);
                      }}
                      className={cn(
                        "absolute top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full transition-all duration-200",
                        "bg-warning shadow-sm ring-2 ring-background hover:scale-150 hover:bg-warning/80"
                      )}
                      style={{ left: `calc(${position}% - 6px)` }}
                      title={bookmark.label}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Bookmark className="h-4 w-4 text-warning" />
                <span className="text-xs font-medium text-muted-foreground">Bookmarks:</span>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_BOOKMARKS.map((bookmark) => (
                    <Button
                      key={bookmark.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmarkClick(bookmark)}
                      className={cn(
                        "h-7 rounded-lg px-2.5 font-mono text-xs",
                        "border border-warning/20 bg-warning/10 text-warning",
                        "hover:border-warning/40 hover:bg-warning/20 hover:text-warning",
                        "transition-all duration-200"
                      )}
                    >
                      {bookmark.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 md:p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-info/10">
                <MessageSquareText className="h-4 w-4 text-info" />
              </div>
              <span className="text-sm font-semibold text-foreground">Transcript</span>
              <Badge variant="info" className="ml-auto text-xs">
                Live Sync
              </Badge>
            </div>

            <div 
              ref={transcriptRef}
              className="h-[340px] space-y-1 overflow-y-auto rounded-2xl border border-border/70 bg-background/45 p-2 pr-2 shadow-inner"
            >
              {DEMO_TRANSCRIPT.map((line, index) => (
                <div
                  key={index}
                  ref={(el) => { lineRefs.current[index] = el; }}
                  className={cn(
                    "rounded-xl border border-transparent p-3 transition-all duration-500",
                    highlightedLine === index 
                      ? "border-primary/30 bg-primary/15 shadow-sm shadow-primary/10" 
                      : "hover:border-border/70 hover:bg-muted/45"
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {line.time}
                    </span>
                    <span className={cn(
                      "text-xs font-semibold",
                      line.speaker === 'You' ? 'text-primary' : 'text-blue-500'
                    )}>
                      {line.speaker}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm leading-relaxed transition-colors duration-500",
                    highlightedLine === index 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground"
                  )}>
                    {line.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  AI note
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                  Your strongest answer used a clear metric, but the setup ran long.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Coach tip
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                  Tighten the first 20 seconds before adding implementation detail.
                </p>
              </div>
            </div>

            <div className="border-t border-border/70 pt-4">
              <p className="text-center text-xs text-muted-foreground">
                <span className="font-semibold text-warning">Click a bookmark</span> to jump to that moment
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
