'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: 'video' | 'play' | 'chart';
  gradient: string;
  bgGlow: string;
  buttonText: string;
}

interface DashboardFeaturesProps {
  features: Feature[];
}

const iconMap = {
  video: (
    <svg
      className="h-8 w-8 text-emerald-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  ),
  play: (
    <svg
      className="h-8 w-8 text-cyan-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  chart: (
    <svg
      className="h-8 w-8 text-amber-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
};

export function DashboardFeatures({ features }: DashboardFeaturesProps) {
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {features.map((feature) => (
        <Card
          key={feature.id}
          className="group relative cursor-pointer overflow-hidden border-slate-800 bg-slate-900/50 transition-all duration-300 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50"
          onClick={() => setShowComingSoon(feature.id)}
        >
          {/* Glow effect on hover */}
          <div
            className={`absolute -top-24 -right-24 h-48 w-48 rounded-full ${feature.bgGlow} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
          />

          <CardHeader className="relative">
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5`}
            >
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900">
                {iconMap[feature.icon]}
              </div>
            </div>
            <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
            <CardDescription className="text-slate-400">
              {feature.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              className={`w-full bg-gradient-to-r ${feature.gradient} text-white hover:opacity-90`}
              onClick={(e) => {
                e.stopPropagation();
                setShowComingSoon(feature.id);
              }}
            >
              {feature.buttonText}
            </Button>
          </CardContent>

          {/* Coming Soon Overlay */}
          {showComingSoon === feature.id && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowComingSoon(null);
              }}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="mb-2 text-lg font-semibold text-white">
                Coming Soon
              </p>
              <p className="px-6 text-center text-sm text-slate-400">
                This feature is under development. Click anywhere to dismiss.
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
