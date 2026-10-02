import type { Vec2, UGVState, NavigationCommand, TerrainType, EnvironmentMode } from '@/types';
import { distance, angleTo, normalizeAngle, radToDeg, clamp, lerp } from './terrain';
import { ENVIRONMENT_CONFIGS } from '@/types';

// Vehicle Control Simulation
// Converts navigation decisions into UGV commands and animates movement
// Includes adaptive speed based on terrain, risk, and environment

export interface ControlState {
  command: NavigationCommand;
  targetSpeed: number;
  actualSpeed: number;
  turnRate: number;
}

const MAX_SPEED = 3.0; // m/s
const SLOW_SPEED = 1.0; // m/s
const ACCEL = 2.0; // m/s^2
const TURN_SPEED = 1.5; // rad/s
const ARRIVAL_THRESHOLD = 1.5; // meters

// Determine navigation command based on current state and next waypoint
export function determineCommand(
  ugv: UGVState,
  target: Vec2,
  obstacleAhead: boolean,
  riskLevel: number
): NavigationCommand {
  if (obstacleAhead || riskLevel > 95) return 'STOP';

  const dist = distance(ugv.pos, target);
  if (dist < ARRIVAL_THRESHOLD) return 'STOP';

  const angleToTarget = angleTo(ugv.pos, target);
  const angleDiff = normalizeAngle(angleToTarget - ugv.heading);

  // Slow down in high risk or near target
  if (riskLevel > 50 || dist < 5) return 'SLOW_DOWN';

  if (Math.abs(angleDiff) > 0.3) {
    return angleDiff > 0 ? 'LEFT' : 'RIGHT';
  }

  return 'FORWARD';
}

// Calculate adaptive speed limit based on terrain, risk, and environment
export function calculateAdaptiveSpeed(
  terrainType: TerrainType,
  riskLevel: number,
  environment: EnvironmentMode = 'daylight'
): number {
  const envConfig = ENVIRONMENT_CONFIGS[environment];
  const baseMax = MAX_SPEED * envConfig.confidenceMultiplier;

  let limit = baseMax;

  switch (terrainType) {
    case 'safe':
      limit = baseMax;
      break;
    case 'caution':
      limit = baseMax * 0.6;
      break;
    case 'danger':
      limit = baseMax * 0.2;
      break;
  }

  // Reduce speed with risk
  if (riskLevel > 80) limit *= 0.2;
  else if (riskLevel > 60) limit *= 0.4;
  else if (riskLevel > 40) limit *= 0.65;
  else if (riskLevel > 20) limit *= 0.85;

  return Math.max(0.3, limit);
}

// Update UGV position based on command and adaptive speed
export function updateUGV(
  ugv: UGVState,
  target: Vec2,
  command: NavigationCommand,
  dt: number,
  speedLimit: number = MAX_SPEED
): UGVState {
  let { pos, heading, speed } = ugv;

  switch (command) {
    case 'STOP':
      speed = lerp(speed, 0, ACCEL * dt * 3);
      break;
    case 'SLOW_DOWN':
      speed = lerp(speed, Math.min(SLOW_SPEED, speedLimit), ACCEL * dt);
      break;
    case 'FORWARD':
      speed = lerp(speed, Math.min(MAX_SPEED, speedLimit), ACCEL * dt);
      break;
    case 'REVERSE':
      speed = lerp(speed, -MAX_SPEED * 0.5, ACCEL * dt);
      break;
    case 'LEFT': {
      speed = lerp(speed, Math.min(MAX_SPEED * 0.5, speedLimit), ACCEL * dt);
      heading += TURN_SPEED * dt;
      break;
    }
    case 'RIGHT': {
      speed = lerp(speed, Math.min(MAX_SPEED * 0.5, speedLimit), ACCEL * dt);
      heading -= TURN_SPEED * dt;
      break;
    }
  }

  const moveDist = speed * dt;
  pos = {
    x: pos.x + Math.cos(heading) * moveDist,
    y: pos.y + Math.sin(heading) * moveDist,
  };

  pos.x = clamp(pos.x, 1, 99);
  pos.y = clamp(pos.y, 1, 99);
  heading = normalizeAngle(heading);

  return { pos, heading, speed, command };
}

// Check if UGV has reached the target
export function reachedTarget(ugv: UGVState, target: Vec2): boolean {
  return distance(ugv.pos, target) < ARRIVAL_THRESHOLD;
}

// Check for obstacles ahead on the path
export function obstacleAhead(
  ugv: UGVState,
  obstacles: { pos: Vec2; radius: number; detected: boolean }[],
  lookAhead: number = 5
): boolean {
  const forward = {
    x: ugv.pos.x + Math.cos(ugv.heading) * lookAhead,
    y: ugv.pos.y + Math.sin(ugv.heading) * lookAhead,
  };

  for (const obs of obstacles) {
    if (!obs.detected) continue;
    const distToPath = pointToLineDistance(ugv.pos, forward, obs.pos);
    if (distToPath < obs.radius + 1.5) {
      const distToObs = distance(ugv.pos, obs.pos);
      if (distToObs < lookAhead + obs.radius) return true;
    }
  }
  return false;
}

// Calculate risk level (0-100) based on nearby obstacles and terrain
export function calculateRisk(
  ugv: UGVState,
  obstacles: { pos: Vec2; radius: number; detected: boolean; safetyPriority?: number; moving?: boolean }[],
  terrainAhead: TerrainType
): { level: number; collisionImminent: boolean } {
  let risk = 0;
  let collisionImminent = false;

  for (const obs of obstacles) {
    if (!obs.detected) continue;
    const dist = distance(ugv.pos, obs.pos);
    if (dist > 15) continue;

    const proximityRisk = (1 - dist / 15) * 60;
    const priorityMultiplier = obs.safetyPriority ?? 1;
    const movingBonus = obs.moving ? 1.3 : 1.0;
    risk += proximityRisk * priorityMultiplier * movingBonus / 2;

    // Collision only when extremely close — should rarely trigger in a clean demo
    if (dist < obs.radius + 0.5) {
      collisionImminent = true;
      risk += 40;
    }
  }

  // Terrain risk
  if (terrainAhead === 'danger') risk += 20;
  else if (terrainAhead === 'caution') risk += 8;

  risk = Math.min(100, risk);
  return { level: risk, collisionImminent };
}

function pointToLineDistance(p1: Vec2, p2: Vec2, p: Vec2): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return distance(p1, p);
  const t = Math.max(0, Math.min(1, ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (len * len)));
  const proj = { x: p1.x + t * dx, y: p1.y + t * dy };
  return distance(proj, p);
}

export function getHeadingDeg(heading: number): number {
  let deg = radToDeg(heading);
  deg = (deg + 360) % 360;
  return Math.round(deg);
}

export function getCompassDirection(heading: number): string {
  const deg = getHeadingDeg(heading);
  const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  const idx = Math.round(deg / 45) % 8;
  return dirs[idx];
}

// Manual UGV control — operator drives directly with directional commands
// speedScale is 0..1 multiplier applied to MAX_SPEED
export function updateUGVManual(
  ugv: UGVState,
  command: 'FORWARD' | 'BACKWARD' | 'TURN_LEFT' | 'TURN_RIGHT' | 'ROTATE' | 'STOP',
  dt: number,
  speedScale: number
): UGVState {
  let { pos, heading, speed } = ugv;
  const targetSpeed = MAX_SPEED * Math.max(0.1, Math.min(1, speedScale));

  switch (command) {
    case 'STOP':
      speed = lerp(speed, 0, ACCEL * dt * 4);
      break;
    case 'FORWARD':
      speed = lerp(speed, targetSpeed, ACCEL * dt);
      break;
    case 'BACKWARD':
      speed = lerp(speed, -targetSpeed * 0.5, ACCEL * dt);
      break;
    case 'TURN_LEFT':
      speed = lerp(speed, targetSpeed * 0.4, ACCEL * dt);
      heading += TURN_SPEED * dt;
      break;
    case 'TURN_RIGHT':
      speed = lerp(speed, targetSpeed * 0.4, ACCEL * dt);
      heading -= TURN_SPEED * dt;
      break;
    case 'ROTATE':
      speed = lerp(speed, 0, ACCEL * dt * 3);
      heading += TURN_SPEED * 1.5 * dt;
      break;
  }

  const moveDist = speed * dt;
  pos = {
    x: pos.x + Math.cos(heading) * moveDist,
    y: pos.y + Math.sin(heading) * moveDist,
  };
  pos.x = clamp(pos.x, 1, 99);
  pos.y = clamp(pos.y, 1, 99);
  heading = normalizeAngle(heading);
  return { pos, heading, speed, command: 'FORWARD' };
}
