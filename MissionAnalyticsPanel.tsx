import type { MissionAnalytics } from '@/types';
import { formatDuration } from '@/sim/terrain';
import {
  Timer,
  Ruler,
  Eye,
  GitBranch,
  Gauge,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface MissionAnalyticsPanelProps {
  analytics: MissionAnalytics;
}

export default function MissionAnalyticsPanel({ analytics }: MissionAnalyticsPanelProps) {
  const items = [
    { icon: Timer, label: 'MISSION TIME', value: formatDuration(analytics.missionTime), color: 'text-sky-400' },
    { icon: Ruler, label: 'DISTANCE', value: `${analytics.distance.toFixed(1)}m`, color: 'text-sky-400' },
    { icon: Eye, label: 'OBSTACLES DETECTED', value: analytics.obstaclesDetected.toString(), color: 'text-amber-400' },
    { icon: GitBranch, label: 'ROUTE REPLANS', value: analytics.routeReplans.toString(), color: 'text-amber-400' },
    { icon: Gauge, label: 'AVG SPEED', value: `${analytics.averageSpeed.toFixed(2)}m/s`, color: 'text-sky-400' },
    {
      icon: ShieldAlert,
      label: 'MAX RISK',
      value: `${analytics.maxRisk.toFixed(0)}%`,
      color: analytics.maxRisk > 70 ? 'text-red-400' : analytics.maxRisk > 40 ? 'text-amber-400' : 'text-green-400',
    },
    {
      icon: AlertTriangle,
      label: 'COLLISIONS',
      value: analytics.collisions.toString(),
      color: analytics.collisions > 0 ? 'text-red-400' : 'text-green-400',
    },
  ];

  return (
    <div className="flex flex-col gap-2 p-3 animate-fade-in">
      {/* Completion Banner */}
      <div className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-green-950/30 border border-green-700/30">
        <CheckCircle2 className="w-5 h-5 text-green-400" />
        <span className="text-sm font-mono font-bold text-green-400 tracking-wider">
          MISSION COMPLETED
        </span>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="px-2.5 py-2 rounded bg-slate-900/60 border border-slate-700/40"
          >
            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-mono tracking-wider">
              <item.icon className="w-2.5 h-2.5" />
              {item.label}
            </div>
            <div className={`text-base font-mono font-bold ${item.color}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="px-3 py-2 rounded bg-slate-900/60 border border-slate-700/40">
        <div className="flex items-center gap-1.5 mb-1">
          <Layers className="w-2.5 h-2.5 text-sky-400" />
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">MISSION SUMMARY</span>
        </div>
        <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
          UGV traveled {analytics.distance.toFixed(1)}m in {formatDuration(analytics.missionTime)}
          {' '}at avg {analytics.averageSpeed.toFixed(2)}m/s. Encountered {analytics.obstaclesDetected} obstacles,
          {' '}performed {analytics.routeReplans} route replans. Peak risk {analytics.maxRisk.toFixed(0)}%,
          {' '}{analytics.collisions} collision{analytics.collisions !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Data Source */}
      <div className="px-2 py-1 rounded bg-amber-500/5 border border-amber-500/20">
        <span className="text-[9px] font-mono text-amber-500/60">
          SIMULATION DATA — Not from real hardware sensors
        </span>
      </div>
    </div>
  );
}
