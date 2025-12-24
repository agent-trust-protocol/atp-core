'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MonitoringDashboard = dynamic(
  () => import('@/components/atp/monitoring-dashboard').then(mod => ({ default: mod.MonitoringDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto px-4 py-8">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading monitoring dashboard...</p>
          </div>
        </div>
      </div>
    ),
  }
);

export default function MonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MonitoringDashboard />
    </div>
  );
}
