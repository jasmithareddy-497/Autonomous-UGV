import { useEffect, useRef } from 'react';
import type { Detection, UGVState, EnvironmentMode, CameraMode, RealDetection, AIStats } from '@/types';
import { OBSTACLE_COLORS } from '@/sim/perception';
import { ENVIRONMENT_CONFIGS, COCO_COLORS } from '@/types';
import { Camera, CameraOff, ScanLine, Cpu, Zap, Activity } from 'lucide-react';

interface CameraPanelProps {
  detections: Detection[];
  ugv: UGVState;
  active: boolean;
  time: number;
  environment: EnvironmentMode;
  riskLevel: number;
  collisionWarning: boolean;
  cameraMode: CameraMode;
  cameraEnabled: boolean;
  cameraStream: MediaStream | null;
  cameraError: string | null;
  realDetections: RealDetection[];
  aiStats: AIStats;
  videoRef: React.RefObject<HTMLVideoElement>;
  onEnableCamera: () => void;
  onDisableCamera: () => void;
}

export default function CameraPanel({
  detections,
  ugv,
  active,
  time,
  environment,
  riskLevel,
  collisionWarning,
  cameraMode,
  cameraEnabled,
  cameraStream,
  cameraError,
  realDetections,
  aiStats,
  videoRef,
  onEnableCamera,
  onDisableCamera,
}: CameraPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLive = cameraMode === 'live' && cameraEnabled;
  const modelReady = aiStats.modelStatus === 'ready';

  // Attach stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isLive && cameraStream) {
      video.srcObject = cameraStream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [isLive, cameraStream, videoRef]);

  // Simulation camera rendering
  useEffect(() => {
    if (isLive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const envConfig = ENVIRONMENT_CONFIGS[environment];

    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.4);
    if (environment === 'low_light') {
      skyGrad.addColorStop(0, '#050810'); skyGrad.addColorStop(0.5, '#0a0f1a'); skyGrad.addColorStop(1, '#0d1810');
    } else if (environment === 'shadows') {
      skyGrad.addColorStop(0, '#0a1520'); skyGrad.addColorStop(0.5, '#101d28'); skyGrad.addColorStop(1, '#141e22');
    } else if (environment === 'overcast') {
      skyGrad.addColorStop(0, '#1a2530'); skyGrad.addColorStop(0.5, '#202d38'); skyGrad.addColorStop(1, envConfig.groundTint);
    } else {
      skyGrad.addColorStop(0, envConfig.skyColor); skyGrad.addColorStop(0.5, '#162d3a'); skyGrad.addColorStop(1, envConfig.groundTint);
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.4);

    const groundGrad = ctx.createLinearGradient(0, H * 0.4, 0, H);
    if (environment === 'low_light') {
      groundGrad.addColorStop(0, '#0d1810'); groundGrad.addColorStop(0.5, '#0a1410'); groundGrad.addColorStop(1, '#050a08');
    } else if (environment === 'shadows') {
      groundGrad.addColorStop(0, '#161e22'); groundGrad.addColorStop(0.5, '#121820'); groundGrad.addColorStop(1, '#0a1018');
    } else {
      groundGrad.addColorStop(0, envConfig.groundTint); groundGrad.addColorStop(0.5, '#152820'); groundGrad.addColorStop(1, '#0d1a14');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H * 0.4, W, H * 0.6);

    if (environment === 'shadows') {
      for (let i = 0; i < 5; i++) {
        const sx = (i * W / 5 + time * 5) % W;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(sx, H * 0.4, W / 10, H * 0.6);
      }
    }
    if (environment === 'overcast') {
      ctx.fillStyle = 'rgba(180, 190, 200, 0.05)';
      ctx.fillRect(0, 0, W, H);
    }

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H * 0.4); ctx.lineTo(W, H * 0.4); ctx.stroke();

    ctx.strokeStyle = `rgba(34, 197, 94, ${environment === 'low_light' ? 0.04 : 0.08})`;
    const horizonY = H * 0.4;
    const vanishX = W / 2;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath(); ctx.moveTo(vanishX, horizonY); ctx.lineTo(vanishX + i * W * 0.15, H); ctx.stroke();
    }
    const scrollOffset = (time * 0.5) % 1;
    for (let i = 0; i < 8; i++) {
      const t = (i / 8 + scrollOffset / 8) % 1;
      const y = horizonY + t * t * (H - horizonY);
      ctx.globalAlpha = t * (environment === 'low_light' ? 0.15 : 0.3);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const textureCount = environment === 'low_light' ? 8 : 20;
    for (let i = 0; i < textureCount; i++) {
      const seed = i * 137;
      const x = ((seed * 7 + time * 0.3) % W);
      const y = horizonY + ((seed * 13) % (H - horizonY));
      const size = 2 + (seed % 4);
      const alpha = environment === 'low_light' ? 0.06 : 0.15;
      ctx.fillStyle = `rgba(${34 + (seed % 40)}, ${197 - (seed % 60)}, ${94 - (seed % 30)}, ${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    }

    drawSimDetections(ctx, detections, W, H);

    if (active) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 20, H / 2); ctx.lineTo(W / 2 - 5, H / 2);
      ctx.moveTo(W / 2 + 5, H / 2); ctx.lineTo(W / 2 + 20, H / 2);
      ctx.moveTo(W / 2, H / 2 - 20); ctx.lineTo(W / 2, H / 2 - 5);
      ctx.moveTo(W / 2, H / 2 + 5); ctx.lineTo(W / 2, H / 2 + 20);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 2, 0, Math.PI * 2); ctx.fill();
    }

    drawScanLine(ctx, W, H, time);
    if (collisionWarning) drawCollisionOverlay(ctx, W, H, time);
    drawSimHUD(ctx, detections, ugv, active, time, environment, riskLevel, W, H);
  }, [detections, ugv, active, time, environment, riskLevel, collisionWarning, isLive]);

  // Live camera overlay — draws REAL model detections on top of video
  useEffect(() => {
    if (!isLive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Draw real detections from model inference
    if (modelReady && realDetections.length > 0) {
      for (const det of realDetections) {
        const [bx, by, bw, bh] = det.bbox;
        const color = COCO_COLORS[det.class] ?? OBSTACLE_COLORS[det.obstacleType];

        // Solid bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(bx, by, bw, bh);

        // Corner accents for emphasis
        const cl = 10;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(bx, by + cl); ctx.lineTo(bx, by); ctx.lineTo(bx + cl, by);
        ctx.moveTo(bx + bw - cl, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cl);
        ctx.moveTo(bx + bw, by + bh - cl); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw - cl, by + bh);
        ctx.moveTo(bx + cl, by + bh); ctx.lineTo(bx, by + bh); ctx.lineTo(bx, by + bh - cl);
        ctx.stroke();

        // Label with class name + confidence
        const label = `${det.class} ${(det.score * 100).toFixed(0)}%`;
        const distLabel = `${det.distance.toFixed(1)}m`;
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        const labelW = ctx.measureText(label).width;
        ctx.fillStyle = color;
        ctx.fillRect(bx, by - 18, labelW + 10, 18);
        ctx.fillStyle = '#0a0e14';
        ctx.fillText(label, bx + 5, by - 5);

        ctx.font = '10px JetBrains Mono, monospace';
        const distW = ctx.measureText(distLabel).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(bx + bw - distW - 8, by + bh, distW + 8, 15);
        ctx.fillStyle = color;
        ctx.fillText(distLabel, bx + bw - distW - 4, by + bh + 11);
      }
    }

    // Terrain zones overlay
    drawTerrainZones(ctx, W, H, riskLevel, time);

    // Scan line
    drawScanLine(ctx, W, H, time);
    if (collisionWarning) drawCollisionOverlay(ctx, W, H, time);

    // Live HUD with AI stats
    drawLiveHUD(ctx, ugv, active, time, environment, riskLevel, W, H, aiStats, realDetections.length);
  }, [realDetections, aiStats, time, isLive, modelReady, ugv, active, environment, riskLevel, collisionWarning]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black">
      {/* Live video */}
      {isLive && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
        />
      )}

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-sky-400/60 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-sky-400/60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-sky-400/60 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-sky-400/60 pointer-events-none" />

      {/* LIVE / SIM badge */}
      <div className="absolute top-7 left-2 flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-black/60 border border-sky-500/30 pointer-events-none">
        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-400 animate-pulse' : 'bg-amber-400'}`} />
        <span className="text-[9px] font-mono font-bold tracking-wider text-sky-300">
          {isLive ? 'LIVE CAMERA' : 'SIMULATION'}
        </span>
      </div>

      {/* AI status badge */}
      {isLive && (
        <div className="absolute top-7 right-2 px-1.5 py-0.5 rounded pointer-events-none">
          {aiStats.modelStatus === 'ready' ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/40">
              <Activity className="w-2.5 h-2.5 text-green-400" />
              <span className="text-[8px] font-mono font-bold text-green-400 tracking-wider">
                AI DETECTION: ACTIVE
              </span>
            </div>
          ) : aiStats.modelStatus === 'loading' ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-500/40">
              <Cpu className="w-2.5 h-2.5 text-sky-400 animate-pulse" />
              <span className="text-[8px] font-mono font-bold text-sky-400 tracking-wider">
                LOADING MODEL...
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40">
              <Zap className="w-2.5 h-2.5 text-red-400" />
              <span className="text-[8px] font-mono font-bold text-red-400 tracking-wider">
                AI MODEL OFFLINE — CHECK MODEL/NETWORK
              </span>
            </div>
          )}
        </div>
      )}

      {/* AI stats overlay (live + model ready) */}
      {isLive && modelReady && (
        <div className="absolute bottom-8 left-2 flex items-center gap-2 px-2 py-1 rounded bg-black/70 border border-sky-500/20 pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono text-slate-500">FPS</span>
            <span className="text-[9px] font-mono font-bold text-green-400">{aiStats.fps.toFixed(1)}</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono text-slate-500">INFER</span>
            <span className="text-[9px] font-mono font-bold text-sky-400">{aiStats.inferenceMs}ms</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-mono text-slate-500">OBJ</span>
            <span className="text-[9px] font-mono font-bold text-amber-400">{aiStats.objectCount}</span>
          </div>
          {aiStats.topClass && (
            <>
              <div className="w-px h-3 bg-slate-700" />
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-mono text-slate-500">TOP</span>
                <span className="text-[9px] font-mono font-bold text-sky-300">
                  {aiStats.topClass} {(aiStats.topScore * 100).toFixed(0)}%
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Camera error toast */}
      {cameraError && isLive && (
        <div className="absolute bottom-14 left-2 right-2 px-2 py-1 rounded bg-amber-950/80 border border-amber-700/40 pointer-events-none">
          <span className="text-[9px] font-mono text-amber-300">{cameraError}</span>
        </div>
      )}

      {/* Camera control toolbar */}
      <div className="absolute bottom-1 left-2 right-2 flex items-center gap-1.5 pointer-events-auto">
        {!cameraEnabled ? (
          <button
            onClick={onEnableCamera}
            className="flex items-center gap-1 px-2 py-1 rounded bg-sky-600/30 border border-sky-500/40 text-sky-300 text-[9px] font-mono font-bold hover:bg-sky-600/50 transition-all"
          >
            <Camera className="w-2.5 h-2.5" />
            ENABLE CAMERA
          </button>
        ) : (
          <button
            onClick={onDisableCamera}
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-600/30 border border-red-500/40 text-red-300 text-[9px] font-mono font-bold hover:bg-red-600/50 transition-all"
          >
            <CameraOff className="w-2.5 h-2.5" />
            {isLive ? 'STOP CAM' : 'DISABLE'}
          </button>
        )}
        <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 pointer-events-none">
          <ScanLine className="w-2.5 h-2.5 text-sky-500/60" />
          <span className="text-[8px] font-mono text-slate-500">
            DET: {isLive ? realDetections.length : detections.length}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Drawing helpers ---

function drawSimDetections(ctx: CanvasRenderingContext2D, dets: Detection[], W: number, H: number) {
  for (const det of dets) {
    const bx = det.bbox.x * W, by = det.bbox.y * H, bw = det.bbox.w * W, bh = det.bbox.h * H;
    const color = OBSTACLE_COLORS[det.type];
    ctx.strokeStyle = color;
    ctx.lineWidth = det.safetyPriority >= 3 ? 3 : 2;
    ctx.setLineDash(det.moving ? [8, 4] : []);
    ctx.strokeRect(bx, by, bw, bh);
    ctx.setLineDash([]);

    const label = `${det.label}${det.moving ? ' [MOVING]' : ''} ${Math.round(det.confidence * 100)}%`;
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    const labelW = ctx.measureText(label).width;
    ctx.fillStyle = color;
    ctx.fillRect(bx, by - 16, labelW + 8, 16);
    ctx.fillStyle = '#0a0e14';
    ctx.fillText(label, bx + 4, by - 4);
  }
}

function drawTerrainZones(ctx: CanvasRenderingContext2D, W: number, H: number, risk: number, t: number) {
  const zoneY = H * 0.72;
  ctx.font = 'bold 9px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
  ctx.fillRect(0, zoneY, W * 0.4, H - zoneY);
  ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
  ctx.fillText('SAFE / TRAVERSABLE', 6, zoneY + 14);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
  ctx.fillRect(W * 0.4, zoneY, W * 0.35, H - zoneY);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
  ctx.fillText('CAUTION', W * 0.4 + 6, zoneY + 14);
  ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
  ctx.fillRect(W * 0.75, zoneY, W * 0.25, H - zoneY);
  ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
  ctx.fillText('OBSTACLE', W * 0.75 + 6, zoneY + 14);
  if (risk > 70) {
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + Math.sin(t * 8) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.75, zoneY, W * 0.25, H - zoneY);
  }
}

function drawScanLine(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const scanY = ((t * 0.8) % 1) * H;
  const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
  grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.12)');
  grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, scanY - 30, W, 60);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(W, scanY); ctx.stroke();
}

function drawCollisionOverlay(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(t * 10) * 0.3})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);
  ctx.fillStyle = `rgba(239, 68, 68, ${0.05 + Math.sin(t * 10) * 0.05})`;
  ctx.fillRect(0, 0, W, H);
}

function drawSimHUD(
  ctx: CanvasRenderingContext2D,
  dets: Detection[],
  ugvState: UGVState,
  isActive: boolean,
  t: number,
  env: EnvironmentMode,
  risk: number,
  W: number, H: number,
) {
  const envConfig = ENVIRONMENT_CONFIGS[env];
  ctx.fillStyle = 'rgba(10, 14, 20, 0.7)';
  ctx.fillRect(0, 0, W, 28);
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
  ctx.fillText('CAM-01 | VISION PIPELINE v3.0', 8, 18);
  ctx.fillStyle = isActive ? '#22c55e' : '#64748b';
  ctx.fillText(isActive ? '● LIVE' : '○ STANDBY', W - 80, 18);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
  ctx.fillText(`DET: ${dets.length}`, W / 2 - 30, 18);
  const riskColor = risk > 70 ? '#ef4444' : risk > 40 ? '#f59e0b' : '#22c55e';
  ctx.fillStyle = riskColor;
  ctx.fillText(`RISK: ${risk.toFixed(0)}%`, W / 2 + 30, 18);
  ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
  ctx.fillText(envConfig.label, 140, 18);

  ctx.fillStyle = 'rgba(10, 14, 20, 0.7)';
  ctx.fillRect(0, H - 24, W, 24);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
  const headingDeg = Math.round(((ugvState.heading * 180) / Math.PI + 360) % 360);
  ctx.fillText(`HDG ${headingDeg.toString().padStart(3, '0')}° | SPD ${ugvState.speed.toFixed(1)}m/s`, 8, H - 8);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
  ctx.fillText('SIMULATION', W - 70, H - 8);
}

function drawLiveHUD(
  ctx: CanvasRenderingContext2D,
  ugvState: UGVState,
  isActive: boolean,
  t: number,
  env: EnvironmentMode,
  risk: number,
  W: number, H: number,
  stats: AIStats,
  detCount: number,
) {
  const envConfig = ENVIRONMENT_CONFIGS[env];
  // Top HUD
  ctx.fillStyle = 'rgba(10, 14, 20, 0.7)';
  ctx.fillRect(0, 0, W, 28);
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
  ctx.fillText('CAM-01 | LIVE FEED — COCO-SSD', 8, 18);
  ctx.fillStyle = isActive ? '#22c55e' : '#64748b';
  ctx.fillText(isActive ? '● LIVE' : '○ STANDBY', W - 80, 18);
  ctx.fillStyle = stats.modelStatus === 'ready' ? '#22c55e' : '#ef4444';
  ctx.fillText(
    stats.modelStatus === 'ready' ? `AI: ${detCount} OBJ ${stats.fps.toFixed(0)}FPS` : 'AI: OFFLINE',
    W / 2 - 40, 18,
  );
  ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
  ctx.fillText(envConfig.label, 180, 18);

  // Bottom HUD
  ctx.fillStyle = 'rgba(10, 14, 20, 0.7)';
  ctx.fillRect(0, H - 24, W, 24);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
  const headingDeg = Math.round(((ugvState.heading * 180) / Math.PI + 360) % 360);
  ctx.fillText(`HDG ${headingDeg.toString().padStart(3, '0')}° | SPD ${ugvState.speed.toFixed(1)}m/s`, 8, H - 8);
  ctx.fillStyle = '#22c55e';
  ctx.fillText(stats.modelStatus === 'ready' ? 'AI DETECTION ACTIVE' : 'AI OFFLINE', W - 90, H - 8);
}
