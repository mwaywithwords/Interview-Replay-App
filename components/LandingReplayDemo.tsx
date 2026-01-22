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
  MessageSquareText
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
    <Card className="w-full max-w-6xl mx-auto overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
          {/* Left Column - Video Player Preview */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Play className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Session Replay</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Interview
              </Badge>
            </div>

            {/* Fake Video Player */}
            <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl overflow-hidden border border-border/50 group">
              {/* Video placeholder with pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              {/* Center play button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
              >
                <div className={cn(
                  "w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-xl transition-all duration-300",
                  "hover:bg-primary hover:scale-110",
                  "group-hover:shadow-2xl group-hover:shadow-primary/30"
                )}>
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-primary-foreground ml-0" />
                  ) : (
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  )}
                </div>
              </button>

              {/* Bottom controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-3 text-white">
                  <span className="text-xs font-medium tabular-nums">{formatTime(currentTime)}</span>
                  <span className="text-xs text-white/60">/</span>
                  <span className="text-xs text-white/60 tabular-nums">{formatTime(TOTAL_DURATION)}</span>
                  <div className="flex-1" />
                  <Volume2 className="w-4 h-4 text-white/80 hover:text-white cursor-pointer transition-colors" />
                  <Maximize2 className="w-4 h-4 text-white/80 hover:text-white cursor-pointer transition-colors" />
                </div>
              </div>
            </div>

            {/* Timeline Scrubber */}
            <div className="mt-4 space-y-2">
              <div 
                className="relative h-2 bg-muted rounded-full cursor-pointer group/scrubber"
                onClick={handleScrubberClick}
              >
                {/* Progress bar */}
                <div 
                  className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${scrubberPosition}%` }}
                />
                
                {/* Scrubber thumb */}
                <div 
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg transition-all duration-150",
                    "opacity-0 group-hover/scrubber:opacity-100 scale-75 group-hover/scrubber:scale-100"
                  )}
                  style={{ left: `calc(${scrubberPosition}% - 8px)` }}
                />

                {/* Bookmark markers on timeline */}
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
                        "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-200",
                        "bg-amber-500 hover:bg-amber-400 hover:scale-150 z-10",
                        "ring-2 ring-background shadow-sm"
                      )}
                      style={{ left: `calc(${position}% - 6px)` }}
                      title={bookmark.label}
                    />
                  );
                })}
              </div>

              {/* Bookmark buttons row */}
              <div className="flex items-center gap-2 pt-2">
                <Bookmark className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground font-medium">Bookmarks:</span>
                <div className="flex flex-wrap gap-1.5">
                  {DEMO_BOOKMARKS.map((bookmark) => (
                    <Button
                      key={bookmark.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmarkClick(bookmark)}
                      className={cn(
                        "h-7 px-2.5 text-xs font-mono rounded-lg",
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        "hover:bg-amber-500/20 hover:text-amber-500",
                        "border border-amber-500/20 hover:border-amber-500/40",
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

          {/* Right Column - Transcript Panel */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquareText className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm font-semibold text-foreground">Transcript</span>
              <Badge variant="info" className="ml-auto text-xs">
                Live Sync
              </Badge>
            </div>

            {/* Transcript lines */}
            <div 
              ref={transcriptRef}
              className="h-[340px] overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              {DEMO_TRANSCRIPT.map((line, index) => (
                <div
                  key={index}
                  ref={(el) => { lineRefs.current[index] = el; }}
                  className={cn(
                    "p-3 rounded-lg transition-all duration-500",
                    highlightedLine === index 
                      ? "bg-primary/15 border border-primary/30 shadow-sm shadow-primary/10" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
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

            {/* Transcript footer hint */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                <span className="text-amber-500">Click a bookmark</span> to jump to that moment
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
