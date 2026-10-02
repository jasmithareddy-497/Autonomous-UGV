import type { Detection, CameraMode, RealDetection, AIStats } from '@/types';
import { OBSTACLE_COLORS } from '@/sim/perception';
import { COCO_COLORS } from '@/types';
import { AlertTriangle, Eye, Radar, ScanLine, Move, Zap, Cpu, Activity, Camera } from 'lucide-react';

interface DetectionListProps {
  detections: Detection[];
  cameraMode?: CameraMode;
  realDetections?: RealDetection[];
  aiStats?: AIStats;
}

export default function DetectionList({
  detections,
  cameraMode = 'sim',
  realDetections = [],
  aiStats,
}: DetectionListProps) {
  const isLive = cameraMode === 'live';
  const modelReady = aiStats?.modelStatus === 'ready';
  const movingCount = detections.filter((d) => d.moving).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-sky-500/10">
        <ScanLine className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-xs font-mono font-bold text-sky-300 tracking-wider">
          AI DETECTIONS
        </span>
        <span className="ml-auto text-xs font-mono text-sky-500/60">
          {isLive ? realDetections.length : detections.length} objects
          {movingCount > 0 && <span className="text-amber-400 ml-1">| {movingCount} moving</span>}
        </span>
      </div>

      {/* AI Model Status Bar */}
      {isLive && (
        <div className={`px-3 py-1.5 border-b flex items-center justify-between ${
          modelReady
            ? 'bg-green-950/30 border-green-700/30'
            : aiStats?.modelStatus === 'loading'
            ? 'bg-sky-950/30 border-sky-700/30'
            : 'bg-red-950/30 border-red-700/30'
        }`}>
          <div className="flex items-center gap-1.5">
            {modelReady ? (
              <Activity className="w-3 h-3 text-green-400" />
            ) : aiStats?.modelStatus === 'loading' ? (
              <Cpu className="w-3 h-3 text-sky-400 animate-pulse" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-red-400" />
            )}
            <span className={`text-[9px] font-mono font-bold tracking-wider ${
              modelReady ? 'text-green-400'
                : aiStats?.modelStatus === 'loading' ? 'text-sky-400'
                : 'text-red-400'
            }`}>
              {modelReady ? 'AI DETECTION: ACTIVE'
                : aiStats?.modelStatus === 'loading' ? 'LOADING MODEL...'
                : 'AI MODEL OFFLINE — CHECK MODEL/NETWORK'}
            </span>
          </div>
          {modelReady && aiStats && (
            <div className="flex items-center gap-2 text-[8px] font-mono text-slate-500">
              <span className="text-green-400">{aiStats.fps.toFixed(0)} FPS</span>
              <span className="text-sky-400">{aiStats.inferenceMs}ms</span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {/* Real AI detections (live mode) */}
        {isLive && modelReady && realDetections.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-mono text-green-400/70">
            <Camera className="w-2.5 h-2.5" />
            <span>REAL AI DETECTIONS — COCO-SSD</span>
          </div>
        )}
        {isLive && modelReady && realDetections.map((det, i) => {
          const color = COCO_COLORS[det.class] ?? OBSTACLE_COLORS[det.obstacleType];
          return (
            <div
              key={`ai-${i}`}
              className="flex items-center gap-2 px-2.5 py-2 rounded bg-slate-900/60 border border-green-600/30 transition-all animate-fade-in"
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse-glow"
                style={{ color, background: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase">{det.class}</span>
                  <span className="flex items-center gap-0.5 px-1 rounded bg-green-500/20 border border-green-500/30">
                    <Activity className="w-2.5 h-2.5 text-green-400" />
                    <span className="text-[8px] font-mono font-bold text-green-400">AI</span>
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  CAM | {det.distance.toFixed(1)}m | COCO-SSD
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-mono font-bold" style={{ color }}>
                  {(det.score * 100).toFixed(0)}%
                </span>
                <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${det.score * 100}%`, background: color }} />
                </div>
              </div>
            </div>
          );
        })}

        {/* No detections in live mode */}
        {isLive && modelReady && realDetections.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <Eye className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-xs font-mono">SCANNING...</span>
            <span className="text-xs font-mono text-slate-700 mt-1">NO OBJECTS DETECTED YET</span>
          </div>
        )}

        {/* Model offline in live mode */}
        {isLive && !modelReady && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <AlertTriangle className="w-8 h-8 mb-2 text-red-400/40" />
            <span className="text-xs font-mono text-red-400/60">AI MODEL OFFLINE</span>
            <span className="text-xs font-mono text-slate-700 mt-1">
              {aiStats?.modelStatus === 'loading' ? 'Loading COCO-SSD model...' : 'Check network connection'}
            </span>
          </div>
        )}

        {/* Sim detections */}
        {!isLive && detections.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <Eye className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-xs font-mono">NO OBSTACLES DETECTED</span>
            <span className="text-xs font-mono text-slate-700 mt-1">PATH CLEAR</span>
          </div>
        )}
        {!isLive && detections.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-mono text-sky-400/50">
            <Radar className="w-2.5 h-2.5" />
            <span>SIM PERCEPTION</span>
          </div>
        )}
        {!isLive && detections.map((det) => {
          const color = OBSTACLE_COLORS[det.type];
          return (
            <div
              key={det.id}
              className={`flex items-center gap-2 px-2.5 py-2 rounded bg-slate-900/60 border transition-all animate-fade-in ${
                det.moving ? 'border-amber-600/40' : 'border-slate-700/50 hover:border-sky-500/30'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse-glow"
                style={{ color, background: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-slate-200">{det.label}</span>
                  {det.terrain === 'danger' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                  {det.moving && (
                    <span className="flex items-center gap-0.5 px-1 rounded bg-amber-500/20 border border-amber-500/30">
                      <Move className="w-2.5 h-2.5 text-amber-400" />
                      <span className="text-[8px] font-mono font-bold text-amber-400">MOVING</span>
                    </span>
                  )}
                  {det.safetyPriority >= 3 && <Zap className="w-2.5 h-2.5 text-red-400" />}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  ID: {det.id} | {det.distance.toFixed(1)}m{det.safetyPriority >= 3 ? ' | HIGH PRIORITY' : ''}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] font-mono font-bold" style={{ color }}>
                  {Math.round(det.confidence * 100)}%
                </span>
                <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${det.confidence * 100}%`, background: color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-sky-500/10 flex items-center gap-2">
        <Radar className="w-3 h-3 text-sky-500/60" />
        <span className="text-[10px] font-mono text-slate-500">
          {isLive
            ? modelReady
              ? 'COCO-SSD | REAL-TIME INFERENCE | 80 CLASSES'
              : 'COCO-SSD | MODEL OFFLINE'
            : 'YOLO-SIM v3.0 | SIMULATED PERCEPTION'}
        </span>
      </div>
    </div>
  );
}
