import type { EnvironmentMode } from '@/types';
import { ENVIRONMENT_CONFIGS } from '@/types';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Flag,
  MapPin,
  Rocket,
  AlertOctagon,
  Sun,
  Moon,
  CloudSun,
  Cloud,
  Navigation,
  Crosshair,
  Trash2,
  Radio,
  Eye,
  Satellite,
} from 'lucide-react';

interface MissionControlProps {
  mission: { status: string; progress: number; pointA: { x: number; y: number } | null; pointB: { x: number; y: number } | null };
  ugvPos: { x: number; y: number };
  distanceToDestination: number;
  onSelectDestination: () => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onClear: () => void;
  onDemo: () => void;
  onEmergencyStop: () => void;
  selectingMode: 'destination' | null;
  environment: EnvironmentMode;
  onEnvironmentChange: (mode: EnvironmentMode) => void;
  gpsMode: 'ACTIVE' | 'DENIED';
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  IDLE: { label: 'IDLE', color: 'text-slate-400', bg: 'bg-slate-800/60' },
  PLANNING: { label: 'PLANNING ROUTE', color: 'text-sky-400', bg: 'bg-sky-950/40' },
  NAVIGATING: { label: 'NAVIGATING', color: 'text-green-400', bg: 'bg-green-950/40' },
  OBSTACLE_DETECTED: { label: 'OBSTACLE DETECTED', color: 'text-red-400', bg: 'bg-red-950/40' },
  REPLANNING: { label: 'REPLANNING ROUTE', color: 'text-amber-400', bg: 'bg-amber-950/40' },
  PAUSED: { label: 'PAUSED', color: 'text-amber-400', bg: 'bg-amber-950/40' },
  COMPLETED: { label: 'MISSION COMPLETE', color: 'text-green-400', bg: 'bg-green-950/40' },
  EMERGENCY_STOP: { label: 'EMERGENCY STOP', color: 'text-red-500', bg: 'bg-red-950/60' },
};

const envIcons: Record<EnvironmentMode, React.ReactNode> = {
  daylight: <Sun className="w-3 h-3" />,
  low_light: <Moon className="w-3 h-3" />,
  shadows: <CloudSun className="w-3 h-3" />,
  overcast: <Cloud className="w-3 h-3" />,
};

export default function MissionControl({
  mission,
  ugvPos,
  distanceToDestination,
  onSelectDestination,
  onStart,
  onPause,
  onStop,
  onClear,
  onDemo,
  onEmergencyStop,
  selectingMode,
  environment,
  onEnvironmentChange,
  gpsMode,
}: MissionControlProps) {
  const status = statusConfig[mission.status] || statusConfig.IDLE;
  const isRunning = mission.status === 'NAVIGATING';
  const isPaused = mission.status === 'PAUSED';
  const canStart = mission.pointB && mission.status === 'IDLE';

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Mission Status Banner */}
      <div className={`px-3 py-2.5 rounded-lg border ${status.bg} ${
        mission.status === 'OBSTACLE_DETECTED' || mission.status === 'EMERGENCY_STOP'
          ? 'border-red-700/40 animate-pulse'
          : 'border-slate-700/30'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">MISSION STATUS</span>
          <div className="flex items-center gap-1.5">
            {mission.status === 'NAVIGATING' && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
            <span className={`text-sm font-mono font-bold ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Mission Info Panel */}
      <div className="space-y-1.5 px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700/30">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="flex items-center gap-1 text-slate-500">
            <MapPin className="w-2.5 h-2.5 text-green-400" />
            CURRENT POSITION
          </span>
          <span className="text-green-400 font-bold">
            {ugvPos.x.toFixed(1)}, {ugvPos.y.toFixed(1)}
          </span>
        </div>
        <div className="text-[8px] font-mono text-slate-600 pl-3.5">
          SIMULATED VISUAL POSITION
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono pt-1">
          <span className="flex items-center gap-1 text-slate-500">
            <Flag className="w-2.5 h-2.5 text-amber-400" />
            DESTINATION
          </span>
          <span className={mission.pointB ? 'text-amber-400 font-bold' : 'text-slate-600'}>
            {mission.pointB
              ? `${mission.pointB.x.toFixed(1)}, ${mission.pointB.y.toFixed(1)}`
              : 'NOT SET'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono pt-1">
          <span className="text-slate-500">DIST TO DEST</span>
          <span className={mission.pointB ? 'text-sky-400 font-bold' : 'text-slate-600'}>
            {mission.pointB ? `${distanceToDestination.toFixed(1)}m` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono pt-1">
          <span className="flex items-center gap-1 text-slate-500">
            <Navigation className="w-2.5 h-2.5" />
            NAV MODE
          </span>
          <span className="text-sky-400 font-bold">AUTONOMOUS</span>
        </div>
      </div>

      {/* GPS / Localization Status */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/30 border border-red-700/30">
        <Satellite className="w-3 h-3 text-red-400" />
        <span className="text-[10px] font-mono font-bold text-red-400">GPS: OFF</span>
        <div className="w-px h-3 bg-slate-700" />
        <Eye className="w-3 h-3 text-sky-400" />
        <span className="text-[10px] font-mono font-bold text-sky-400">VISUAL LOC: ACTIVE</span>
      </div>
      <div className="text-[8px] font-mono text-slate-600 -mt-2 px-1">
        VISUAL LOCALIZATION — SIMULATION
      </div>

      {/* Mission Progress */}
      <div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
          <span>MISSION PROGRESS</span>
          <span className="text-sky-400">{mission.progress.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              mission.status === 'COMPLETED'
                ? 'bg-gradient-to-r from-green-600 to-green-400'
                : mission.status === 'OBSTACLE_DETECTED' || mission.status === 'REPLANNING'
                ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                : 'bg-gradient-to-r from-sky-600 to-cyan-400'
            }`}
            style={{ width: `${mission.progress}%` }}
          />
          {mission.status === 'NAVIGATING' && mission.progress > 0 && mission.progress < 100 && (
            <div className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          )}
        </div>
      </div>

      {/* Destination Selection */}
      <button
        onClick={onSelectDestination}
        disabled={isRunning || isPaused}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-mono font-bold transition-all w-full ${
          selectingMode === 'destination'
            ? 'border-amber-500 bg-amber-950/40 text-amber-400 animate-pulse'
            : mission.pointB
            ? 'border-amber-700/30 bg-amber-950/20 text-amber-400/80'
            : 'border-slate-700/40 bg-slate-900/40 text-slate-500 hover:border-amber-700/30 disabled:opacity-30'
        } disabled:cursor-not-allowed`}
      >
        <Crosshair className="w-3.5 h-3.5" />
        <div className="flex flex-col items-start">
          <span>SET DESTINATION</span>
          {mission.pointB && (
            <span className="text-[9px] text-slate-500 font-normal">
              {mission.pointB.x.toFixed(0)}, {mission.pointB.y.toFixed(0)}
            </span>
          )}
        </div>
      </button>

      {/* Mission Controls */}
      <div className="grid grid-cols-3 gap-2">
        {!isRunning && !isPaused ? (
          <button
            onClick={onStart}
            disabled={!canStart}
            className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg bg-green-600/20 border border-green-600/40 text-green-400 text-xs font-mono font-bold hover:bg-green-600/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5" />
            START
          </button>
        ) : isRunning ? (
          <button
            onClick={onPause}
            className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg bg-amber-600/20 border border-amber-600/40 text-amber-400 text-xs font-mono font-bold hover:bg-amber-600/30 transition-all"
          >
            <Pause className="w-3.5 h-3.5" />
            PAUSE
          </button>
        ) : (
          <button
            onClick={onStart}
            className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg bg-green-600/20 border border-green-600/40 text-green-400 text-xs font-mono font-bold hover:bg-green-600/30 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            RESUME
          </button>
        )}

        <button
          onClick={onStop}
          disabled={!isRunning && !isPaused}
          className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg bg-slate-700/30 border border-slate-600/40 text-slate-300 text-xs font-mono font-bold hover:bg-slate-700/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Square className="w-3.5 h-3.5" />
          STOP
        </button>

        <button
          onClick={onClear}
          disabled={isRunning}
          className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg bg-slate-700/30 border border-slate-600/40 text-slate-300 text-xs font-mono font-bold hover:bg-slate-700/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          CLEAR
        </button>
      </div>

      {/* Demo & Emergency */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onDemo}
          disabled={isRunning || isPaused}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-gradient-to-r from-sky-600/30 to-cyan-600/30 border border-sky-500/40 text-sky-300 text-xs font-mono font-bold hover:from-sky-600/40 hover:to-cyan-600/40 transition-all disabled:opacity-30"
        >
          <Rocket className="w-3.5 h-3.5" />
          START DEMO
        </button>

        <button
          onClick={onEmergencyStop}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-600/30 border-2 border-red-500/60 text-red-400 text-xs font-mono font-bold hover:bg-red-600/50 transition-all animate-pulse-glow"
          style={{ color: '#ef4444' }}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          E-STOP
        </button>
      </div>

      {/* Environment Selector */}
      <div>
        <div className="text-[10px] font-mono text-slate-500 mb-1.5 tracking-wider">ENVIRONMENT MODE</div>
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.keys(ENVIRONMENT_CONFIGS) as EnvironmentMode[]).map((mode) => {
            const config = ENVIRONMENT_CONFIGS[mode];
            const isActive = environment === mode;
            return (
              <button
                key={mode}
                onClick={() => onEnvironmentChange(mode)}
                className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg border text-[9px] font-mono font-bold transition-all ${
                  isActive
                    ? 'border-sky-500 bg-sky-950/40 text-sky-300'
                    : 'border-slate-700/40 bg-slate-900/40 text-slate-500 hover:border-sky-700/30'
                }`}
              >
                {envIcons[mode]}
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
