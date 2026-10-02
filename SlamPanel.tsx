import type { MissionStatus } from '@/types';
import { Radio, Satellite, Scan, Eye, Zap, Crosshair, MapPin } from 'lucide-react';

interface SlamPanelProps {
  gpsMode: 'ACTIVE' | 'DENIED';
  status: MissionStatus;
  exploredArea: number;
  totalArea: number;
  loopClosures: number;
  featurePoints: number;
  totalLandmarks: number;
  observedLandmarks: number;
}

export default function SlamPanel({
  gpsMode,
  status,
  exploredArea,
  totalArea,
  loopClosures,
  featurePoints,
  totalLandmarks,
  observedLandmarks,
}: SlamPanelProps) {
  const exploredPct = (exploredArea / totalArea) * 100;

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Satellite className={`w-4 h-4 ${gpsMode === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`} />
        <span className="text-xs font-mono font-bold text-sky-300 tracking-wider">
          VISUAL LOCALIZATION
        </span>
      </div>

      {/* GPS / SLAM Mode */}
      <div className={`px-3 py-2 rounded-lg border ${
        gpsMode === 'ACTIVE'
          ? 'bg-green-950/30 border-green-700/30'
          : 'bg-red-950/30 border-red-700/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {gpsMode === 'ACTIVE' ? (
              <Radio className="w-3 h-3 text-green-400" />
            ) : (
              <Eye className="w-3 h-3 text-red-400 animate-pulse" />
            )}
            <span className="text-[10px] font-mono font-bold">
              {gpsMode === 'ACTIVE' ? (
                <span className="text-green-400">GPS SATELLITE LOCK</span>
              ) : (
                <span className="text-red-400">VISUAL SLAM — GPS DENIED</span>
              )}
            </span>
          </div>
          <button
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-sky-400 hover:border-sky-700/40 transition-all"
            onClick={() => {
              const event = new CustomEvent('toggle-gps');
              window.dispatchEvent(event);
            }}
          >
            TOGGLE
          </button>
        </div>
      </div>

      {/* SLAM Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="px-2 py-1.5 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
            <Scan className="w-2.5 h-2.5" /> EXPLORED
          </div>
          <div className="text-sm font-mono font-bold text-sky-400">
            {exploredPct.toFixed(1)}%
          </div>
        </div>

        <div className="px-2 py-1.5 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
            <Crosshair className="w-2.5 h-2.5" /> FEATURES
          </div>
          <div className="text-sm font-mono font-bold text-sky-400">
            {observedLandmarks}<span className="text-slate-600 text-[10px]">/{totalLandmarks}</span>
          </div>
        </div>

        <div className="px-2 py-1.5 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
            <Zap className="w-2.5 h-2.5" /> LOOP CL.
          </div>
          <div className="text-sm font-mono font-bold text-purple-400">
            {loopClosures}
          </div>
        </div>

        <div className="px-2 py-1.5 rounded bg-slate-900/60 border border-slate-700/40">
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
            <Radio className="w-2.5 h-2.5" /> ODOMETRY
          </div>
          <div className={`text-sm font-mono font-bold ${
            status === 'NAVIGATING' ? 'text-green-400' : 'text-slate-400'
          }`}>
            {status === 'NAVIGATING' ? 'TRACKING' : 'IDLE'}
          </div>
        </div>
      </div>

      {/* Explored area bar */}
      <div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
          <span>MAP EXPLORATION</span>
          <span className="text-sky-500">{exploredArea.toFixed(0)} / {totalArea.toFixed(0)} m²</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${exploredPct}%` }} />
        </div>
      </div>

      {/* Visual odometry info */}
      <div className="px-3 py-2 rounded bg-slate-900/60 border border-slate-700/40">
        <div className="flex items-center gap-1.5 mb-1">
          <MapPin className="w-2.5 h-2.5 text-purple-400" />
          <span className="text-[10px] font-mono text-slate-500">VISUAL ODOMETRY</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
          <div>Method: Feature-point matching</div>
          <div>Fusion: Mono camera + IMU</div>
          <div>Drift: {(exploredPct * 0.02).toFixed(2)}m (est.)</div>
        </div>
      </div>
    </div>
  );
}
