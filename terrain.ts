import type { Vec2, TerrainType, GridCell, Obstacle, ObstacleType, SurfaceType, Landmark } from '@/types';
import { SURFACE_COSTS, SURFACE_TERRAIN, OBSTACLE_SAFETY_PRIORITY, OBSTACLE_IS_MOVING } from '@/types';

export const GRID_SIZE = 50; // 50x50 grid
export const WORLD_SIZE = 100; // 100x100 meters
export const CELL_SIZE = WORLD_SIZE / GRID_SIZE;

// Seeded random for reproducible terrain
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

function surfaceForNoise(combined: number, rng: SeededRandom): SurfaceType {
  if (combined > 0.35) return rng.pick<SurfaceType>(['rocks', 'mud', 'vegetation']);
  if (combined > 0.1) return rng.pick<SurfaceType>(['gravel', 'vegetation', 'mud']);
  if (combined > -0.1) return rng.pick<SurfaceType>(['grass', 'gravel']);
  return rng.pick<SurfaceType>(['road', 'grass']);
}

// Generate terrain grid with surface types and safe/caution/danger zones
export function generateTerrain(seed: number = 42): GridCell[][] {
  const rng = new SeededRandom(seed);
  const grid: GridCell[][] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const nx = x / GRID_SIZE;
      const ny = y / GRID_SIZE;
      const noise1 = Math.sin(nx * 12 + rng.next() * 3) * Math.cos(ny * 10 + rng.next() * 3);
      const noise2 = Math.sin(nx * 25 + 2) * Math.cos(ny * 20 + 1) * 0.5;
      const combined = (noise1 + noise2) / 1.5;

      const surface = surfaceForNoise(combined, rng);
      const terrain = SURFACE_TERRAIN[surface];
      const cost = SURFACE_COSTS[surface];

      row.push({ terrain, surface, cost, explored: false });
    }
    grid.push(row);
  }

  // Clear starting area (top-left) as road
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      grid[y][x] = { terrain: 'safe', surface: 'road', cost: 1, explored: true };
    }
  }

  // Carve a road corridor to ensure reachability
  for (let i = 0; i < GRID_SIZE; i++) {
    if (grid[3][i].terrain === 'danger') {
      grid[3][i] = { terrain: 'caution', surface: 'gravel', cost: 3, explored: false };
    }
    // Also carve a vertical road
    if (grid[i][3].terrain === 'danger') {
      grid[i][3] = { terrain: 'caution', surface: 'gravel', cost: 3, explored: false };
    }
  }

  // Add a diagonal road for better connectivity
  for (let i = 0; i < GRID_SIZE; i++) {
    if (grid[i][i].terrain === 'danger') {
      grid[i][i] = { terrain: 'caution', surface: 'gravel', cost: 3, explored: false };
    }
  }

  return grid;
}

// Generate static obstacles including animals
export function generateObstacles(seed: number = 42): Obstacle[] {
  const rng = new SeededRandom(seed + 100);
  const obstacles: Obstacle[] = [];
  const types: ObstacleType[] = ['rock', 'tree', 'ditch', 'human', 'vehicle', 'animal'];

  for (let i = 0; i < 18; i++) {
    const type = types[Math.floor(rng.next() * types.length)];
    const x = rng.range(10, 90);
    const y = rng.range(10, 90);
    const radius = type === 'tree' ? 3 : type === 'vehicle' ? 4 : type === 'animal' ? 2 : 2;
    obstacles.push({
      id: `obs-${i}`,
      type,
      pos: { x, y },
      radius,
      detected: false,
      confidence: 0,
      distance: 0,
      moving: OBSTACLE_IS_MOVING[type],
      safetyPriority: OBSTACLE_SAFETY_PRIORITY[type],
    });
  }

  return obstacles;
}

// Generate SLAM landmarks for visual localization
export function generateLandmarks(seed: number = 42): Landmark[] {
  const rng = new SeededRandom(seed + 200);
  const landmarks: Landmark[] = [];
  for (let i = 0; i < 30; i++) {
    landmarks.push({
      id: `lm-${i}`,
      pos: { x: rng.range(5, 95), y: rng.range(5, 95) },
      type: rng.next() > 0.7 ? 'loop' : 'feature',
      observed: false,
    });
  }
  return landmarks;
}

// Convert grid coords to world coords
export function gridToWorld(gx: number, gy: number): Vec2 {
  return {
    x: gx * CELL_SIZE + CELL_SIZE / 2,
    y: gy * CELL_SIZE + CELL_SIZE / 2,
  };
}

// Convert world coords to grid coords
export function worldToGrid(wx: number, wy: number): { x: number; y: number } {
  return {
    x: Math.floor(wx / CELL_SIZE),
    y: Math.floor(wy / CELL_SIZE),
  };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function angleTo(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

export function radToDeg(r: number): number {
  return (r * 180) / Math.PI;
}

export function formatTime(): string {
  const d = new Date();
  return d.toLocaleTimeString('en-US', { hour12: false });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
