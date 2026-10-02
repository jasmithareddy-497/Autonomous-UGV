import type {
  Obstacle,
  Detection,
  ObstacleType,
  UGVState,
  Vec2,
  TerrainType,
  EnvironmentMode,
  SurfaceType,
} from '@/types';
import { OBSTACLE_SAFETY_PRIORITY, OBSTACLE_IS_MOVING, ENVIRONMENT_CONFIGS, SURFACE_LABELS } from '@/types';
import { distance, angleTo, normalizeAngle } from './terrain';

// Simulated AI Perception Module
// In production, this would interface with YOLO/MobileNet via WebRTC camera feed

const OBSTACLE_LABELS: Record<ObstacleType, string> = {
  rock: 'Rock',
  tree: 'Tree',
  ditch: 'Ditch',
  human: 'Human',
  vehicle: 'Vehicle',
  animal: 'Animal',
};

const OBSTACLE_COLORS: Record<ObstacleType, string> = {
  rock: '#f59e0b',
  tree: '#22c55e',
  ditch: '#a855f7',
  human: '#ef4444',
  vehicle: '#38bdf8',
  animal: '#fb923c',
};

const TERRAIN_COLORS: Record<TerrainType, string> = {
  safe: '#22c55e',
  caution: '#f59e0b',
  danger: '#ef4444',
};

export interface PerceptionResult {
  detections: Detection[];
  terrainMap: { type: TerrainType; confidence: number }[];
  overallConfidence: number;
  surfaceAnalysis: { surface: SurfaceType; confidence: number }[];
}

// Simulate camera-based obstacle detection with environment effects
export function detectObstacles(
  ugv: UGVState,
  obstacles: Obstacle[],
  environment: EnvironmentMode = 'daylight',
  baseRange: number = 25
): Detection[] {
  const envConfig = ENVIRONMENT_CONFIGS[environment];
  const detectionRange = baseRange * envConfig.detectionRangeMultiplier;
  const detections: Detection[] = [];

  for (const obs of obstacles) {
    const dist = distance(ugv.pos, obs.pos);
    if (dist > detectionRange) continue;

    const angleToObs = angleTo(ugv.pos, obs.pos);
    const relAngle = normalizeAngle(angleToObs - ugv.heading);

    const fovHalf = Math.PI / 3;
    if (Math.abs(relAngle) > fovHalf) continue;

    const distFactor = 1 - dist / detectionRange;
    const angleFactor = 1 - Math.abs(relAngle) / fovHalf;
    const baseConfidence = 0.7 + 0.25 * distFactor * angleFactor;
    const confidence = Math.max(
      0.3,
      Math.min(0.99, baseConfidence * envConfig.confidenceMultiplier + (Math.random() - 0.5) * 0.05)
    );

    const camX = 0.5 + (relAngle / fovHalf) * 0.4;
    const camY = 0.3 + distFactor * 0.4;
    const sizeFactor = Math.max(0.05, (1 - distFactor) * 0.3 + 0.1);
    const bboxW = sizeFactor;
    const bboxH = sizeFactor * (obs.type === 'tree' ? 1.5 : obs.type === 'human' ? 1.8 : obs.type === 'animal' ? 1.3 : 1.0);

    const terrain: TerrainType = obs.type === 'ditch' || obs.type === 'rock' ? 'danger' : 'caution';
    const moving = OBSTACLE_IS_MOVING[obs.type];
    const safetyPriority = OBSTACLE_SAFETY_PRIORITY[obs.type];

    detections.push({
      id: obs.id,
      type: obs.type,
      label: OBSTACLE_LABELS[obs.type],
      confidence,
      distance: dist,
      bbox: {
        x: camX - bboxW / 2,
        y: camY - bboxH / 2,
        w: bboxW,
        h: bboxH,
      },
      terrain,
      moving,
      safetyPriority,
    });
  }

  return detections.sort((a, b) => a.distance - b.distance);
}

// Analyze terrain surface in front of UGV
export function analyzeTerrain(
  ugv: UGVState,
  terrain: { surface: SurfaceType; terrain: TerrainType; explored: boolean }[][],
  environment: EnvironmentMode = 'daylight'
): { surface: SurfaceType; confidence: number; terrainType: TerrainType }[] {
  const envConfig = ENVIRONMENT_CONFIGS[environment];
  const results: { surface: SurfaceType; confidence: number; terrainType: TerrainType }[] = [];
  const lookAhead = 5;

  for (let i = 1; i <= lookAhead; i++) {
    const fx = ugv.pos.x + Math.cos(ugv.heading) * i * 2;
    const fy = ugv.pos.y + Math.sin(ugv.heading) * i * 2;
    const gx = Math.floor(fx / 2);
    const gy = Math.floor(fy / 2);

    if (gx >= 0 && gx < terrain[0]?.length && gy >= 0 && gy < terrain.length) {
      const cell = terrain[gy][gx];
      const distFactor = 1 - i / lookAhead;
      const confidence = Math.max(0.4, Math.min(0.98, (0.6 + distFactor * 0.35) * envConfig.confidenceMultiplier));
      results.push({ surface: cell.surface, confidence, terrainType: cell.terrain });
    }
  }

  return results;
}

// Calculate overall perception confidence based on environment and detections
export function calculateConfidence(
  detections: Detection[],
  environment: EnvironmentMode,
  hasObstacles: boolean
): { obstacle: number; terrain: number; path: number; localization: number; overall: number } {
  const envConfig = ENVIRONMENT_CONFIGS[environment];

  const obstacleConf = hasObstacles
    ? Math.min(0.98, detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length)
    : 0.9 * envConfig.confidenceMultiplier;

  const terrainConf = 0.85 * envConfig.confidenceMultiplier + Math.random() * 0.05;
  const pathConf = 0.88 * envConfig.confidenceMultiplier + Math.random() * 0.05;
  const localizationConf = 0.82 * envConfig.confidenceMultiplier + Math.random() * 0.08;

  const overall = (obstacleConf + terrainConf + pathConf + localizationConf) / 4;

  return {
    obstacle: Math.min(0.99, obstacleConf),
    terrain: Math.min(0.99, terrainConf),
    path: Math.min(0.99, pathConf),
    localization: Math.min(0.99, localizationConf),
    overall: Math.min(0.99, overall),
  };
}

// Generate synthetic camera background objects (decorative for the camera view)
export function generateCameraScene(
  ugv: UGVState,
  detections: Detection[],
  time: number
): { type: string; x: number; y: number; w: number; h: number; color: string }[] {
  const scene: { type: string; x: number; y: number; w: number; h: number; color: string }[] = [];

  for (let i = 0; i < 8; i++) {
    const offset = (time * 0.02 + i * 0.15) % 1;
    scene.push({
      type: 'ground',
      x: 0.1 + (i % 4) * 0.22,
      y: 0.6 + offset * 0.3,
      w: 0.15,
      h: 0.04,
      color: 'rgba(34, 197, 94, 0.15)',
    });
  }

  for (let i = 0; i < 3; i++) {
    scene.push({
      type: 'horizon',
      x: i * 0.33,
      y: 0.25,
      w: 0.33,
      h: 0.02,
      color: 'rgba(56, 189, 248, 0.1)',
    });
  }

  return scene;
}

export { OBSTACLE_LABELS, OBSTACLE_COLORS, TERRAIN_COLORS, SURFACE_LABELS };
