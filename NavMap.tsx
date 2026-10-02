import { useRef, useEffect, useCallback } from 'react';
import type {
  GridCell,
  Obstacle,
  UGVState,
  Vec2,
  Mission,
  Landmark,
} from '@/types';
import { SURFACE_COLORS } from '@/types';
import {
  GRID_SIZE,
  CELL_SIZE,
  WORLD_SIZE,
  worldToGrid,
} from '@/sim/terrain';

interface NavMapProps {
  terrain: GridCell[][];
  obstacles: Obstacle[];
  ugv: UGVState;
  mission: Mission;
  gpsMode: 'ACTIVE' | 'DENIED';
  selectingMode: 'destination' | null;
  time: number;
  onMapClick: (worldPos: Vec2) => void;
  exploredRadius: number;
  landmarks: Landmark[];
  riskLevel: number;
}

export default function NavMap({
  terrain,
  obstacles,
  ugv,
  mission,
  gpsMode,
  selectingMode,
  time,
  onMapClick,
  exploredRadius,
  landmarks,
  riskLevel,
}: NavMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cellW = W / GRID_SIZE;
    const cellH = H / GRID_SIZE;

    ctx.fillStyle = '#070b10';
    ctx.fillRect(0, 0, W, H);

    // Draw terrain cells with surface colors
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = terrain[y][x];
        if (!cell.explored) {
          ctx.fillStyle = '#0a1018';
          ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
          continue;
        }

        // Use surface color with terrain-based opacity
        const baseColor = SURFACE_COLORS[cell.surface];
        let alpha = 0.5;
        if (cell.terrain === 'danger') alpha = 0.7;
        else if (cell.terrain === 'caution') alpha = 0.55;
        else alpha = 0.45;

        ctx.fillStyle = baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Fog of war
    const ugvGrid = worldToGrid(ugv.pos.x, ugv.pos.y);
    const radiusGrid = exploredRadius / CELL_SIZE;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const dist = Math.sqrt((x - ugvGrid.x) ** 2 + (y - ugvGrid.y) ** 2);
        if (dist < radiusGrid && !terrain[y][x].explored) {
          ctx.fillStyle = `rgba(15, 25, 40, ${1 - dist / radiusGrid})`;
          ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    // Grid overlay
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i += 2) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(W, i * cellH);
      ctx.stroke();
    }

    // Draw landmarks (SLAM features)
    for (const lm of landmarks) {
      if (!lm.observed) continue;
      const px = (lm.pos.x / WORLD_SIZE) * W;
      const py = (lm.pos.y / WORLD_SIZE) * H;
      if (lm.type === 'loop') {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw planned path
    if (mission.plannedPath.length > 1) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -time * 20;
      ctx.beginPath();
      for (let i = 0; i < mission.plannedPath.length; i++) {
        const p = mission.plannedPath[i];
        const px = (p.x / WORLD_SIZE) * W;
        const py = (p.y / WORLD_SIZE) * H;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      for (let i = 0; i < mission.plannedPath.length; i++) {
        const p = mission.plannedPath[i];
        const px = (p.x / WORLD_SIZE) * W;
        const py = (p.y / WORLD_SIZE) * H;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw trajectory
    if (mission.trajectory.length > 1) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < mission.trajectory.length; i++) {
        const p = mission.trajectory[i];
        const px = (p.x / WORLD_SIZE) * W;
        const py = (p.y / WORLD_SIZE) * H;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Draw obstacles
    for (const obs of obstacles) {
      const px = (obs.pos.x / WORLD_SIZE) * W;
      const py = (obs.pos.y / WORLD_SIZE) * H;
      const r = (obs.radius / WORLD_SIZE) * W;

      if (obs.detected) {
        const colors: Record<string, string> = {
          rock: '#f59e0b',
          tree: '#22c55e',
          ditch: '#a855f7',
          human: '#ef4444',
          vehicle: '#38bdf8',
          animal: '#fb923c',
        };
        const color = colors[obs.type] || '#888';

        // Moving obstacles get a pulsing danger ring
        if (obs.moving) {
          const pulse = 1 + Math.sin(time * 4) * 0.2;
          ctx.strokeStyle = color + '40';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, r * 1.5 * pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = color + '30';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        if (obs.type === 'tree') {
          ctx.beginPath();
          ctx.arc(px, py, r * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'human') {
          ctx.fillRect(px - r * 0.2, py - r * 0.4, r * 0.4, r * 0.8);
          ctx.beginPath();
          ctx.arc(px, py - r * 0.5, r * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'vehicle') {
          ctx.fillRect(px - r * 0.5, py - r * 0.3, r, r * 0.6);
        } else if (obs.type === 'rock') {
          ctx.beginPath();
          ctx.moveTo(px - r * 0.5, py + r * 0.3);
          ctx.lineTo(px - r * 0.3, py - r * 0.3);
          ctx.lineTo(px + r * 0.3, py - r * 0.2);
          ctx.lineTo(px + r * 0.5, py + r * 0.3);
          ctx.closePath();
          ctx.fill();
        } else if (obs.type === 'ditch') {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(px, py, r * 0.6, r * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (obs.type === 'animal') {
          ctx.beginPath();
          ctx.ellipse(px, py, r * 0.5, r * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          // Ears
          ctx.beginPath();
          ctx.arc(px - r * 0.3, py - r * 0.3, r * 0.15, 0, Math.PI * 2);
          ctx.arc(px + r * 0.3, py - r * 0.3, r * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }

        if (obs.spawnTime && time - obs.spawnTime < 3) {
          const pulseT = (time - obs.spawnTime) / 3;
          ctx.strokeStyle = color + Math.round((1 - pulseT) * 255).toString(16).padStart(2, '0');
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, r + pulseT * 20, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Draw Point A (current UGV position marker)
    if (mission.pointA) {
      const px = (mission.pointA.x / WORLD_SIZE) * W;
      const py = (mission.pointA.y / WORLD_SIZE) * H;
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText('UGV POS', px + 12, py + 4);
    }

    // Draw Destination (Point B)
    if (mission.pointB) {
      const px = (mission.pointB.x / WORLD_SIZE) * W;
      const py = (mission.pointB.y / WORLD_SIZE) * H;
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      const pulse = 1 + Math.sin(time * 3) * 0.2;
      ctx.beginPath();
      ctx.arc(px, py, 10 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText('DEST', px + 12, py + 4);
    }

    // Draw UGV
    const ugvPx = (ugv.pos.x / WORLD_SIZE) * W;
    const ugvPy = (ugv.pos.y / WORLD_SIZE) * H;
    const ugvAngle = ugv.heading;

    // Risk ring around UGV
    if (riskLevel > 30) {
      const riskColor = riskLevel > 70 ? '#ef4444' : riskLevel > 50 ? '#f59e0b' : '#f59e0b';
      ctx.strokeStyle = riskColor + '40';
      ctx.lineWidth = 2;
      const riskR = 15 + riskLevel * 0.2;
      ctx.beginPath();
      ctx.arc(ugvPx, ugvPy, riskR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Detection cone (FOV)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    const fovHalf = Math.PI / 3;
    const coneRange = 25 / WORLD_SIZE * W;
    ctx.beginPath();
    ctx.moveTo(ugvPx, ugvPy);
    ctx.arc(ugvPx, ugvPy, coneRange, ugvAngle - fovHalf, ugvAngle + fovHalf);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // UGV body
    ctx.save();
    ctx.translate(ugvPx, ugvPy);
    ctx.rotate(ugvAngle);

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(-10, -7, 20, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(10, -4);
    ctx.lineTo(14, 0);
    ctx.lineTo(10, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-8, -9, 5, 3);
    ctx.fillRect(3, -9, 5, 3);
    ctx.fillRect(-8, 6, 5, 3);
    ctx.fillRect(3, 6, 5, 3);

    ctx.restore();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillText('UGV-01', ugvPx + 14, ugvPy - 10);

    if (gpsMode === 'DENIED') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.font = 'bold 8px JetBrains Mono, monospace';
      ctx.fillText('NO-GPS', ugvPx + 14, ugvPy + 16);
    }

    if (selectingMode) {
      const cursorColor = '#f59e0b';
      ctx.strokeStyle = cursorColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -time * 10;
      ctx.strokeRect(0, 0, W, H);
      ctx.setLineDash([]);
    }
  }, [terrain, obstacles, ugv, mission, gpsMode, selectingMode, time, exploredRadius, landmarks, riskLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMapClick({ x, y });
  };

  const cursorClass = selectingMode ? 'cursor-crosshair' : 'cursor-default';

  return (
    <div ref={containerRef} className={`relative w-full h-full ${cursorClass}`}>
      <canvas ref={canvasRef} onClick={handleClick} className="w-full h-full" />
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono text-sky-400/80 pointer-events-none">
        X: {ugv.pos.x.toFixed(1)} Y: {ugv.pos.y.toFixed(1)}
      </div>
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-mono text-sky-400/80 pointer-events-none">
        GRID: {GRID_SIZE}x{GRID_SIZE} | 100m
      </div>
      {selectingMode && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 rounded-full text-xs font-mono animate-pulse pointer-events-none"
          style={{ color: '#f59e0b' }}>
          CLICK TO SET DESTINATION
        </div>
      )}
    </div>
  );
}
