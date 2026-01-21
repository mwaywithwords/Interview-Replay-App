'use server';

import { createClient, requireUser } from '@/lib/supabase/server';
import type { SessionType } from '@/types';

export interface DashboardStats {
  sessionsThisWeek: number;
  totalMinutesPracticed: number;
  topSessionType: SessionType | null;
}

/**
 * Get the start of the current week (Sunday at 00:00:00)
 */
function getStartOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = now.getDate() - dayOfWeek;
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * Server Action: Get dashboard stats for the current user
 */
export async function getDashboardStats(): Promise<{
  stats: DashboardStats | null;
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  try {
    // 1. Get sessions this week
    const startOfWeek = getStartOfWeek().toISOString();
    const { count: sessionsThisWeek, error: weekError } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfWeek);

    if (weekError) {
      return { stats: null, error: weekError.message };
    }

    // 2. Get total minutes practiced (sum of audio/video duration for recorded sessions)
    // We use COALESCE to get either audio or video duration, whichever is set
    const { data: durationData, error: durationError } = await supabase
      .from('sessions')
      .select('audio_duration_seconds, video_duration_seconds')
      .eq('user_id', user.id)
      .eq('status', 'recorded');

    if (durationError) {
      return { stats: null, error: durationError.message };
    }

    // Calculate total seconds from all sessions
    const totalSeconds = durationData?.reduce((acc, session) => {
      const duration = session.audio_duration_seconds || session.video_duration_seconds || 0;
      return acc + duration;
    }, 0) || 0;

    const totalMinutesPracticed = Math.round(totalSeconds / 60);

    // 3. Get top session type (most frequent, if tied pick most recent)
    const { data: sessionTypeData, error: typeError } = await supabase
      .from('sessions')
      .select('metadata, created_at')
      .eq('user_id', user.id)
      .not('metadata->>session_type', 'is', null);

    if (typeError) {
      return { stats: null, error: typeError.message };
    }

    // Count session types and track most recent for each type
    const typeCounts = new Map<SessionType, { count: number; mostRecent: string }>();
    
    sessionTypeData?.forEach((session) => {
      const metadata = session.metadata as { session_type?: SessionType } | null;
      const sessionType = metadata?.session_type;
      
      if (sessionType) {
        const existing = typeCounts.get(sessionType);
        if (existing) {
          typeCounts.set(sessionType, {
            count: existing.count + 1,
            mostRecent: session.created_at > existing.mostRecent ? session.created_at : existing.mostRecent,
          });
        } else {
          typeCounts.set(sessionType, {
            count: 1,
            mostRecent: session.created_at,
          });
        }
      }
    });

    // Find the top session type (highest count, if tied pick most recent)
    let topSessionType: SessionType | null = null;
    let maxCount = 0;
    let mostRecentForMax = '';

    typeCounts.forEach((value, type) => {
      if (
        value.count > maxCount ||
        (value.count === maxCount && value.mostRecent > mostRecentForMax)
      ) {
        topSessionType = type;
        maxCount = value.count;
        mostRecentForMax = value.mostRecent;
      }
    });

    return {
      stats: {
        sessionsThisWeek: sessionsThisWeek || 0,
        totalMinutesPracticed,
        topSessionType,
      },
      error: null,
    };
  } catch (error) {
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
