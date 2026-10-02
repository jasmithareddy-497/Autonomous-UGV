import type { Vec2, GridCell } from '@/types';
import { GRID_SIZE, clamp } from './terrain';

// A* Path Planning Algorithm
// Finds the safest (lowest cost) path from start to goal, avoiding danger zones

interface AStarNode {
  x: number;
  y: number;
  g: number; // cost from start
  h: number; // heuristic to goal
  f: number; // g + h
  parent: AStarNode | null;
}

function heuristic(a: { x: number; y: number }, b: { x: number; y: number }): number {
  // Octile distance for 8-directional movement
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

const DIRS = [
  { dx: 0, dy: -1, cost: 1 },
  { dx: 1, dy: 0, cost: 1 },
  { dx: 0, dy: 1, cost: 1 },
  { dx: -1, dy: 0, cost: 1 },
  { dx: 1, dy: -1, cost: Math.SQRT2 },
  { dx: 1, dy: 1, cost: Math.SQRT2 },
  { dx: -1, dy: 1, cost: Math.SQRT2 },
  { dx: -1, dy: -1, cost: Math.SQRT2 },
];

export function aStarPath(
  grid: GridCell[][],
  start: { x: number; y: number },
  goal: { x: number; y: number },
  extraObstacles: { x: number; y: number; radius: number }[] = []
): { x: number; y: number }[] | null {
  const sx = clamp(start.x, 0, GRID_SIZE - 1);
  const sy = clamp(start.y, 0, GRID_SIZE - 1);
  const gx = clamp(goal.x, 0, GRID_SIZE - 1);
  const gy = clamp(goal.y, 0, GRID_SIZE - 1);

  if (grid[gy][gx].terrain === 'danger' && extraObstacles.length === 0) {
    // If goal is on danger, try to find nearest safe cell
    let found = false;
    for (let r = 1; r < 5 && !found; r++) {
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            if (grid[ny][nx].terrain !== 'danger') {
              return aStarPath(grid, { x: sx, y: sy }, { x: nx, y: ny }, extraObstacles);
            }
          }
        }
      }
    }
  }

  const openList: AStarNode[] = [];
  const closedSet = new Set<string>();
  const nodeMap = new Map<string, AStarNode>();

  const startNode: AStarNode = {
    x: sx,
    y: sy,
    g: 0,
    h: heuristic({ x: sx, y: sy }, { x: gx, y: gy }),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;
  openList.push(startNode);
  nodeMap.set(`${sx},${sy}`, startNode);

  const isBlocked = (x: number, y: number): boolean => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return true;
    if (grid[y][x].terrain === 'danger') return true;

    // Check extra obstacles (dynamic)
    for (const obs of extraObstacles) {
      const cellDist = Math.sqrt((x - obs.x) ** 2 + (y - obs.y) ** 2);
      if (cellDist < obs.radius) return true;
    }
    return false;
  };

  let iterations = 0;
  const maxIter = GRID_SIZE * GRID_SIZE * 2;

  while (openList.length > 0 && iterations < maxIter) {
    iterations++;

    // Find node with lowest f
    let bestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[bestIdx].f) bestIdx = i;
    }

    const current = openList[bestIdx];

    // Goal reached
    if (current.x === gx && current.y === gy) {
      const path: { x: number; y: number }[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    openList.splice(bestIdx, 1);
    closedSet.add(`${current.x},${current.y}`);

    for (const dir of DIRS) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      if (isBlocked(nx, ny)) continue;
      if (closedSet.has(`${nx},${ny}`)) continue;

      // Penalize caution terrain
      const terrainCost = grid[ny][nx].cost;
      const moveCost = dir.cost * terrainCost;
      const g = current.g + moveCost;
      const key = `${nx},${ny}`;
      const existing = nodeMap.get(key);

      if (!existing || g < existing.g) {
        const node: AStarNode = {
          x: nx,
          y: ny,
          g,
          h: heuristic({ x: nx, y: ny }, { x: gx, y: gy }),
          f: 0,
          parent: current,
        };
        node.f = node.g + node.h;

        if (!existing) {
          openList.push(node);
          nodeMap.set(key, node);
        } else {
          existing.g = g;
          existing.f = g + existing.h;
          existing.parent = current;
          if (!openList.includes(existing)) {
            openList.push(existing);
          }
        }
      }
    }
  }

  return null; // No path found
}

// Simplify path by removing intermediate collinear points
export function simplifyPath(path: { x: number; y: number }[]): { x: number; y: number }[] {
  if (path.length < 3) return path;
  const simplified: { x: number; y: number }[] = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    if (dx1 !== dx2 || dy1 !== dy2) {
      simplified.push(curr);
    }
  }

  simplified.push(path[path.length - 1]);
  return simplified;
}

// Calculate total path length in grid cells
export function pathLength(path: Vec2[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    len += Math.sqrt(
      (path[i].x - path[i - 1].x) ** 2 + (path[i].y - path[i - 1].y) ** 2
    );
  }
  return len;
}
