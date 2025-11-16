"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from '@heroui/card';
import { Chip } from '@heroui/chip';

const messages = [
  "Welcome to Golden Munch! 🍰",
  "Fresh Bakes Daily ✨",
  "Sweet Treats Await 🎂",
  "Discover New Flavors 🧁",
  "Handcrafted with Love ❤️",
  "Tap Anywhere to Start Ordering! 🛒"
];

interface Cake {
  id: number;
  x: number;
  y: number;
  emoji: string;
  isSpecial: boolean;
}

interface Ghost {
  id: number;
  x: number;
  y: number;
  color: string;
  direction: Position;
  scared: boolean;
  mode: 'random' | 'chase' | 'flee' | 'ambush';
  modeTimer: number;
  stuckCounter: number;
  personality: 'aggressive' | 'smart' | 'random' | 'ambusher';
}

interface Position {
  x: number;
  y: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  emoji?: string;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface PathNode {
  x: number;
  y: number;
  g: number; // cost from start
  h: number; // heuristic to goal
  f: number; // total cost
  parent: PathNode | null;
}

export default function IdlePage() {
  const [score, setScore] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [lastMessageScore, setLastMessageScore] = useState(0);
  const [pacmanPosition, setPacmanPosition] = useState<Position>({ x: 50, y: 50 });
  const [pacmanDirection, setPacmanDirection] = useState<Position>({ x: 1, y: 0 });
  const [pacmanPath, setPacmanPath] = useState<Position[]>([]);
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [isEating, setIsEating] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(true);
  const [powerMode, setPowerMode] = useState(false);
  const [powerTimeLeft, setPowerTimeLeft] = useState(0);
  const [pacmanStuckCounter, setPacmanStuckCounter] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [showStartOverlay, setShowStartOverlay] = useState(true);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const cakeIdRef = useRef(0);
  const ghostIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const lastPacmanPos = useRef<Position>({ x: 50, y: 50 });
  const pathfindingCache = useRef<Map<string, Position[]>>(new Map());
  const powerModeRef = useRef(false);
  const cakeEmojis = ['🎂', '🧁', '🍰', '🍪', '🍩', '🥧'];
  const specialCakeEmoji = '⭐';
  const ghostColors = ['#FF69B4', '#00CED1', '#FF6347', '#98FB98'];

  // Helper function to check if a position collides with any obstacle
  const isInsideObstacle = useCallback((x: number, y: number, margin: number = 2): boolean => {
    return obstacles.some(obstacle => {
      const obstacleLeft = obstacle.x - margin;
      const obstacleRight = obstacle.x + obstacle.width + margin;
      const obstacleTop = obstacle.y - margin;
      const obstacleBottom = obstacle.y + obstacle.height + margin;

      return x >= obstacleLeft && x <= obstacleRight &&
             y >= obstacleTop && y <= obstacleBottom;
    });
  }, [obstacles]);

  // A* Pathfinding Algorithm
  const findPath = useCallback((start: Position, goal: Position, avoidPoints: Position[] = []): Position[] => {
    const cacheKey = `${Math.round(start.x)},${Math.round(start.y)}-${Math.round(goal.x)},${Math.round(goal.y)}`;
    const cached = pathfindingCache.current.get(cacheKey);
    if (cached && Math.random() > 0.3) return cached; // 70% cache hit for performance

    const gridSize = 5; // Grid resolution
    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();

    const heuristic = (a: Position, b: Position) => {
      return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    };

    const getKey = (pos: Position) => `${Math.round(pos.x / gridSize)},${Math.round(pos.y / gridSize)}`;

    const startNode: PathNode = {
      x: start.x,
      y: start.y,
      g: 0,
      h: heuristic(start, goal),
      f: heuristic(start, goal),
      parent: null
    };

    openSet.push(startNode);

    const directions = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
      { x: 0.7, y: 0.7 }, { x: -0.7, y: 0.7 }, { x: 0.7, y: -0.7 }, { x: -0.7, y: -0.7 }
    ];

    let iterations = 0;
    const maxIterations = 50; // Limit for performance

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;

      // Find node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      const currentKey = getKey(current);
      if (closedSet.has(currentKey)) continue;
      closedSet.add(currentKey);

      // Check if reached goal
      if (heuristic(current, goal) < gridSize * 2) {
        const path: Position[] = [];
        let node: PathNode | null = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }

        // Smooth the path
        const smoothedPath = smoothPath(path);
        pathfindingCache.current.set(cacheKey, smoothedPath);

        // Clear old cache entries
        if (pathfindingCache.current.size > 100) {
          const firstKey = pathfindingCache.current.keys().next().value;
          pathfindingCache.current.delete(firstKey);
        }

        return smoothedPath;
      }

      // Explore neighbors
      for (const dir of directions) {
        const newX = current.x + dir.x * gridSize;
        const newY = current.y + dir.y * gridSize;

        // Bounds check
        if (newX < 5 || newX > 95 || newY < 5 || newY > 95) continue;

        // Check if position is inside an obstacle
        if (isInsideObstacle(newX, newY)) continue;

        // Check if too close to avoid points (like dangerous ghosts)
        const tooCloseToAvoid = avoidPoints.some(avoid =>
          Math.sqrt(Math.pow(newX - avoid.x, 2) + Math.pow(newY - avoid.y, 2)) < 15
        );
        if (tooCloseToAvoid) continue;

        const neighborKey = getKey({ x: newX, y: newY });
        if (closedSet.has(neighborKey)) continue;

        const g = current.g + gridSize;
        const h = heuristic({ x: newX, y: newY }, goal);
        const f = g + h;

        const existing = openSet.find(n => getKey(n) === neighborKey);
        if (!existing || g < existing.g) {
          const neighbor: PathNode = {
            x: newX,
            y: newY,
            g,
            h,
            f,
            parent: current
          };

          if (!existing) {
            openSet.push(neighbor);
          } else {
            existing.g = g;
            existing.f = f;
            existing.parent = current;
          }
        }
      }
    }

    // No path found, return direct path
    return [start, goal];
  }, [isInsideObstacle]);

  // Smooth path by removing unnecessary waypoints
  const smoothPath = (path: Position[]): Position[] => {
    if (path.length <= 2) return path;

    const smoothed: Position[] = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      let farthest = current + 1;

      // Try to skip as many waypoints as possible
      for (let i = current + 2; i < Math.min(current + 5, path.length); i++) {
        farthest = i;
      }

      smoothed.push(path[farthest]);
      current = farthest;
    }

    return smoothed;
  };

  // Create particles
  const createParticles = (x: number, y: number, color: string, count: number = 8, emoji?: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * (2 + Math.random()),
        vy: Math.sin(angle) * (2 + Math.random()),
        life: 1,
        color,
        emoji
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Update particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2,
            life: p.life - 0.02
          }))
          .filter(p => p.life > 0 && p.x > 0 && p.x < 100 && p.y > 0 && p.y < 100)
      );
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Clear pathfinding cache when obstacles change
  useEffect(() => {
    pathfindingCache.current.clear();
  }, [obstacles]);

  const findValidPosition = useCallback((): Position => {
    let attempts = 0;
    while (attempts < 50) {
      const pos = {
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      };

      // Check if position is not inside any obstacle
      if (!isInsideObstacle(pos.x, pos.y, 3)) {
        return pos;
      }
      attempts++;
    }
    // Fallback if no valid position found
    return { x: 50, y: 50 };
  }, [isInsideObstacle]);

  // Initialize - Only runs once on mount
  useEffect(() => {
    // Generate random obstacles first
    const initialObstacles: Obstacle[] = [];
    const obstacleCount = Math.floor(Math.random() * 8) + 8; // 8-15 obstacles
    const obstacleColors = ['#8B4513', '#A0522D', '#6B4423', '#8B7355', '#654321'];

    // Reserved areas (don't spawn obstacles here)
    const reservedAreas = [
      { x: 50, y: 50, radius: 15 }, // Center area for Pacman start
      { x: 15, y: 15, radius: 10 }, // Ghost corners
      { x: 85, y: 15, radius: 10 },
      { x: 85, y: 85, radius: 10 },
      { x: 15, y: 85, radius: 10 }
    ];

    for (let i = 0; i < obstacleCount; i++) {
      let validPosition = false;
      let obstacle: Obstacle | null = null;
      let attempts = 0;

      while (!validPosition && attempts < 100) {
        const width = Math.random() * 5 + 3; // 3-8 units
        const height = Math.random() * 5 + 3; // 3-8 units
        const x = Math.random() * 75 + 10; // Keep away from edges
        const y = Math.random() * 75 + 10;

        // Check if obstacle overlaps with reserved areas
        const overlapsReserved = reservedAreas.some(area => {
          const obstacleCenter = { x: x + width / 2, y: y + height / 2 };
          const distance = Math.sqrt(
            Math.pow(obstacleCenter.x - area.x, 2) +
            Math.pow(obstacleCenter.y - area.y, 2)
          );
          return distance < area.radius + Math.max(width, height) / 2;
        });

        // Check if obstacle overlaps with existing obstacles
        const overlapsObstacle = initialObstacles.some(existing => {
          return !(
            x > existing.x + existing.width + 3 ||
            x + width < existing.x - 3 ||
            y > existing.y + existing.height + 3 ||
            y + height < existing.y - 3
          );
        });

        if (!overlapsReserved && !overlapsObstacle) {
          obstacle = {
            id: obstacleIdRef.current++,
            x,
            y,
            width,
            height,
            color: obstacleColors[Math.floor(Math.random() * obstacleColors.length)]
          };
          validPosition = true;
        }
        attempts++;
      }

      if (obstacle) {
        initialObstacles.push(obstacle);
      }
    }

    setObstacles(initialObstacles);

    // Helper function for this initialization only
    const getValidPos = (): Position => {
      let attempts = 0;
      while (attempts < 50) {
        const pos = {
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10
        };

        // Check if position is not inside any obstacle
        const isInside = initialObstacles.some(obstacle => {
          const obstacleLeft = obstacle.x - 3;
          const obstacleRight = obstacle.x + obstacle.width + 3;
          const obstacleTop = obstacle.y - 3;
          const obstacleBottom = obstacle.y + obstacle.height + 3;

          return pos.x >= obstacleLeft && pos.x <= obstacleRight &&
                 pos.y >= obstacleTop && pos.y <= obstacleBottom;
        });

        if (!isInside) {
          return pos;
        }
        attempts++;
      }
      return { x: 50, y: 50 };
    };

    const initialCakes: Cake[] = [];
    for (let i = 0; i < 12; i++) {
      const pos = getValidPos();
      initialCakes.push({
        id: cakeIdRef.current++,
        x: pos.x,
        y: pos.y,
        emoji: cakeEmojis[Math.floor(Math.random() * cakeEmojis.length)],
        isSpecial: false
      });
    }
    setCakes(initialCakes);

    const initialGhosts: Ghost[] = [];
    const ghostStartPositions = [
      { x: 15, y: 15 },
      { x: 85, y: 15 },
      { x: 85, y: 85 },
      { x: 15, y: 85 }
    ];
    const personalities: Ghost['personality'][] = ['aggressive', 'smart', 'random', 'ambusher'];

    for (let i = 0; i < 4; i++) {
      const pos = ghostStartPositions[i];
      initialGhosts.push({
        id: ghostIdRef.current++,
        x: pos.x,
        y: pos.y,
        color: ghostColors[i],
        direction: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
        scared: false,
        mode: 'random',
        modeTimer: Math.floor(Math.random() * 100) + 50,
        stuckCounter: 0,
        personality: personalities[i]
      });
    }
    setGhosts(initialGhosts);

    const savedHighScore = localStorage.getItem('pacman_high_score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []); // Empty deps - only run once on mount

  // Mouth animation
  useEffect(() => {
    const interval = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, isEating ? 100 : 200);
    return () => clearInterval(interval);
  }, [isEating]);

  // Sync powerMode with ref
  useEffect(() => {
    powerModeRef.current = powerMode;
  }, [powerMode]);

  // Power mode countdown
  useEffect(() => {
    if (powerMode && powerTimeLeft > 0) {
      const timer = setTimeout(() => {
        setPowerTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (powerTimeLeft === 0) {
      setPowerMode(false);
      setGhosts(prev => prev.map(ghost => ({ ...ghost, scared: false, mode: 'random' })));
    }
  }, [powerMode, powerTimeLeft]);

  // Spawn cakes
  useEffect(() => {
    const spawnCake = () => {
      if (cakes.length < 15) {
        const isSpecial = Math.random() < 0.15;
        const pos = findValidPosition();
        const newCake: Cake = {
          id: cakeIdRef.current++,
          x: pos.x,
          y: pos.y,
          emoji: isSpecial ? specialCakeEmoji : cakeEmojis[Math.floor(Math.random() * cakeEmojis.length)],
          isSpecial
        };
        setCakes(prev => [...prev, newCake]);
      }
    };

    const interval = setInterval(spawnCake, 1500);
    return () => clearInterval(interval);
  }, [cakes.length, findValidPosition]);

  // Advanced Ghost AI with different personalities
  useEffect(() => {
    const moveGhosts = () => {
      setGhosts(prev => prev.map(ghost => {
        let newX = ghost.x;
        let newY = ghost.y;
        let newDirection = { ...ghost.direction };
        let newMode = ghost.mode;
        let newModeTimer = ghost.modeTimer - 1;

        // Update mode based on personality and timer
        if (newModeTimer <= 0) {
          if (ghost.scared) {
            newMode = 'flee';
            newModeTimer = 100;
          } else {
            switch (ghost.personality) {
              case 'aggressive':
                newMode = Math.random() < 0.7 ? 'chase' : 'random';
                newModeTimer = newMode === 'chase' ? 120 : 80;
                break;
              case 'smart':
                newMode = Math.random() < 0.5 ? 'chase' : 'ambush';
                newModeTimer = 100;
                break;
              case 'ambusher':
                newMode = Math.random() < 0.6 ? 'ambush' : 'random';
                newModeTimer = 150;
                break;
              default:
                newMode = 'random';
                newModeTimer = 100;
            }
          }
        }

        const distance = Math.sqrt(
          Math.pow(ghost.x - pacmanPosition.x, 2) +
          Math.pow(ghost.y - pacmanPosition.y, 2)
        );

        // Use A* pathfinding for chase mode
        if (newMode === 'chase' && !ghost.scared && distance < 50) {
          const path = findPath({ x: ghost.x, y: ghost.y }, pacmanPosition);
          if (path.length > 1) {
            const nextPos = path[1];
            const dx = nextPos.x - ghost.x;
            const dy = nextPos.y - ghost.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              newDirection = { x: dx / dist, y: dy / dist };
            }
          }
        } else if (newMode === 'ambush' && !ghost.scared) {
          // Predict Pacman's future position and head there
          const predictedX = pacmanPosition.x + pacmanDirection.x * 20;
          const predictedY = pacmanPosition.y + pacmanDirection.y * 20;
          const clampedX = Math.max(10, Math.min(90, predictedX));
          const clampedY = Math.max(10, Math.min(90, predictedY));

          if (distance < 60) {
            const path = findPath(
              { x: ghost.x, y: ghost.y },
              { x: clampedX, y: clampedY }
            );
            if (path.length > 1) {
              const nextPos = path[1];
              const dx = nextPos.x - ghost.x;
              const dy = nextPos.y - ghost.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 0) {
                newDirection = { x: dx / dist, y: dy / dist };
              }
            }
          }
        } else if (newMode === 'flee' || ghost.scared) {
          // Flee using A* away from Pacman
          if (distance < 35) {
            const fleeX = ghost.x + (ghost.x - pacmanPosition.x) * 2;
            const fleeY = ghost.y + (ghost.y - pacmanPosition.y) * 2;
            const clampedFleeX = Math.max(10, Math.min(90, fleeX));
            const clampedFleeY = Math.max(10, Math.min(90, fleeY));

            const path = findPath(
              { x: ghost.x, y: ghost.y },
              { x: clampedFleeX, y: clampedFleeY }
            );
            if (path.length > 1) {
              const nextPos = path[1];
              const dx = nextPos.x - ghost.x;
              const dy = nextPos.y - ghost.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 0) {
                newDirection = { x: dx / dist, y: dy / dist };
              }
            }
          }
        } else {
          // Random movement - occasionally change direction
          if (Math.random() < 0.03) {
            const angle = Math.random() * Math.PI * 2;
            newDirection = {
              x: Math.cos(angle),
              y: Math.sin(angle)
            };
          }
        }

        // Apply movement with personality-based speed
        const baseSpeed = ghost.scared ? 0.4 :
                         ghost.personality === 'aggressive' ? 0.8 :
                         ghost.personality === 'smart' ? 0.7 : 0.6;

        const speed = baseSpeed * (0.9 + Math.random() * 0.2);
        const testX = ghost.x + newDirection.x * speed;
        const testY = ghost.y + newDirection.y * speed;

        // Check obstacle collision
        const wouldHitObstacle = isInsideObstacle(testX, testY, 1);

        if (testX > 5 && testX < 95 && testY > 5 && testY < 95 && !wouldHitObstacle) {
          newX = testX;
          newY = testY;
        } else if (wouldHitObstacle) {
          // Hit obstacle, change direction
          const angle = Math.random() * Math.PI * 2;
          newDirection = {
            x: Math.cos(angle),
            y: Math.sin(angle)
          };
        }

        return {
          ...ghost,
          x: newX,
          y: newY,
          direction: newDirection,
          mode: newMode,
          modeTimer: newModeTimer
        };
      }));
    };

    const interval = setInterval(moveGhosts, 50);
    return () => clearInterval(interval);
  }, [pacmanPosition, pacmanDirection, findPath, isInsideObstacle]);

  // Improved Pacman AI with A* pathfinding
  useEffect(() => {
    const movePacman = () => {
      // Track updates to apply after position change
      let shouldIncrementStuck = false;
      let shouldResetStuck = false;
      let newPathToSet: Position[] | null = null;
      let newDirectionToSet: Position | null = null;
      let shouldClearPath = false;

      const newPosition = (() => {
        setPacmanPosition(prev => {
          let newX = prev.x;
          let newY = prev.y;

          // Stuck detection
          if (Math.abs(prev.x - lastPacmanPos.current.x) < 0.1 &&
              Math.abs(prev.y - lastPacmanPos.current.y) < 0.1) {
            shouldIncrementStuck = true;
          } else {
            shouldResetStuck = true;
          }

          lastPacmanPos.current = { x: prev.x, y: prev.y };

          // Build target list with priorities
          const targets: any[] = cakes.map(c => ({
            ...c,
            type: 'cake',
            priority: c.isSpecial ? 3 : 1
          }));

          if (powerMode) {
            ghosts.filter(g => g.scared).forEach(g => {
              targets.push({
                x: g.x,
                y: g.y,
                isGhost: true,
                type: 'ghost',
                priority: 2
              });
            });
          }

          // Find dangerous ghosts to avoid
          const dangerGhosts = ghosts.filter(g => !g.scared);
          const avoidPoints: Position[] = dangerGhosts
            .filter(g => {
              const dist = Math.sqrt(Math.pow(g.x - prev.x, 2) + Math.pow(g.y - prev.y, 2));
              return dist < 30;
            })
            .map(g => ({ x: g.x, y: g.y }));

          // Recalculate path if needed
          if (pacmanPath.length === 0 || pacmanStuckCounter > 15 || Math.random() < 0.1) {
            if (targets.length > 0) {
              // Find best target considering priority and distance
              const bestTarget = targets.reduce((best, target) => {
                const distance = Math.sqrt(
                  Math.pow(target.x - prev.x, 2) + Math.pow(target.y - prev.y, 2)
                );
                const score = distance / target.priority;
                return score < best.score ? { target, score } : best;
              }, { target: null, score: Infinity });

              if (bestTarget.target && bestTarget.score < 100) {
                const calculatedPath = findPath(
                  prev,
                  { x: bestTarget.target.x, y: bestTarget.target.y },
                  avoidPoints
                );
                newPathToSet = calculatedPath.slice(1); // Remove current position
                shouldResetStuck = true;
              }
            }
          }

          // Follow the calculated path
          if (pacmanPath.length > 0) {
            const nextWaypoint = pacmanPath[0];
            const dx = nextWaypoint.x - prev.x;
            const dy = nextWaypoint.y - prev.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 3) {
              // Reached waypoint, remove it
              newPathToSet = pacmanPath.slice(1);
            }

            if (dist > 0) {
              newDirectionToSet = {
                x: dx / dist,
                y: dy / dist
              };
            }
          } else if (avoidPoints.length > 0) {
            // Emergency avoidance if no path
            const nearestDanger = avoidPoints[0];
            const dx = prev.x - nearestDanger.x;
            const dy = prev.y - nearestDanger.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              newDirectionToSet = {
                x: dx / dist,
                y: dy / dist
              };
            }
          }

          // Apply movement
          const speed = powerMode ? 1.8 : 1.4;
          const testX = prev.x + pacmanDirection.x * speed;
          const testY = prev.y + pacmanDirection.y * speed;

          // Check obstacle collision
          const wouldHitObstacle = isInsideObstacle(testX, testY, 1);

          if (testX > 5 && testX < 95 && testY > 5 && testY < 95 && !wouldHitObstacle) {
            newX = testX;
            newY = testY;
          } else if (!wouldHitObstacle) {
            if (testX > 5 && testX < 95 && !isInsideObstacle(testX, prev.y, 1)) {
              newX = testX;
            }
            if (testY > 5 && testY < 95 && !isInsideObstacle(prev.x, testY, 1)) {
              newY = testY;
            }
          } else {
            // Hit obstacle, clear path to recalculate
            shouldClearPath = true;
          }

          return { x: newX, y: newY };
        });
      })();

      // Apply deferred state updates
      if (shouldIncrementStuck) {
        setPacmanStuckCounter(c => c + 1);
      } else if (shouldResetStuck) {
        setPacmanStuckCounter(0);
      }

      if (newPathToSet !== null) {
        setPacmanPath(newPathToSet);
      } else if (shouldClearPath) {
        setPacmanPath([]);
      }

      if (newDirectionToSet !== null) {
        setPacmanDirection(newDirectionToSet);
      }
    };

    const interval = setInterval(movePacman, 30);
    return () => clearInterval(interval);
  }, [pacmanDirection, cakes, ghosts, powerMode, pacmanStuckCounter, pacmanPath, findPath, isInsideObstacle]);

  // Collision detection - cakes
  useEffect(() => {
    setCakes(prevCakes => {
      const remainingCakes = prevCakes.filter(cake => {
        const distance = Math.sqrt(
          Math.pow(cake.x - pacmanPosition.x, 2) +
          Math.pow(cake.y - pacmanPosition.y, 2)
        );

        if (distance < 5) {
          if (cake.isSpecial) {
            setScore(prev => prev + 50);
            setPowerMode(true);
            setPowerTimeLeft(10);
            setGhosts(prev => prev.map(ghost => ({ ...ghost, scared: true, mode: 'flee', modeTimer: 120 })));
            createParticles(cake.x, cake.y, '#FFD700', 12, '✨');
          } else {
            setScore(prev => prev + 10);
            createParticles(cake.x, cake.y, '#F9A03F', 6);
          }
          setIsEating(true);
          setTimeout(() => setIsEating(false), 200);
          setPacmanPath([]); // Clear path when eating
          return false;
        }
        return true;
      });

      return remainingCakes;
    });
  }, [pacmanPosition]);

  // Collision detection - ghosts
  useEffect(() => {
    if (powerMode) {
      setGhosts(prevGhosts => {
        const remainingGhosts = prevGhosts.filter(ghost => {
          const distance = Math.sqrt(
            Math.pow(ghost.x - pacmanPosition.x, 2) +
            Math.pow(ghost.y - pacmanPosition.y, 2)
          );

          if (distance < 6 && ghost.scared) {
            setScore(prev => prev + 200);
            createParticles(ghost.x, ghost.y, ghost.color, 10, '💯');
            setIsEating(true);
            setTimeout(() => setIsEating(false), 200);
            setPacmanPath([]); // Clear path when eating ghost

            // Store ghost data for respawn
            const ghostData = {
              color: ghost.color,
              personality: ghost.personality
            };

            setTimeout(() => {
              const pos = findValidPosition();
              setGhosts(prev => [...prev, {
                id: ghostIdRef.current++,
                x: pos.x,
                y: pos.y,
                color: ghostData.color,
                direction: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
                scared: powerModeRef.current, // Use ref to get current value
                mode: 'flee',
                modeTimer: 100,
                stuckCounter: 0,
                personality: ghostData.personality
              }]);
            }, 4000);

            return false;
          }
          return true;
        });

        return remainingGhosts;
      });
    }
  }, [pacmanPosition, powerMode, findValidPosition]);

  // Auto-increment score
  useEffect(() => {
    const interval = setInterval(() => {
      setScore(prev => {
        const newScore = prev + 1;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('pacman_high_score', newScore.toString());
        }
        return newScore;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [highScore]);

  // Messages
  useEffect(() => {
    if (score > 0 && score % 300 === 0 && score !== lastMessageScore) {
      const randomIndex = Math.floor(Math.random() * messages.length);
      setCurrentMessage(messages[randomIndex]);
      setShowMessage(true);
      setLastMessageScore(score);

      const timeout = setTimeout(() => {
        setShowMessage(false);
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [score, lastMessageScore]);

  const handleClick = useCallback(() => {
    if (showStartOverlay) {
      setShowStartOverlay(false);
    } else {
      window.location.href = '/';
    }
  }, [showStartOverlay]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      handleClick();
    }
  }, [handleClick]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const getRotation = () => {
    const angle = Math.atan2(pacmanDirection.y, pacmanDirection.x) * (180 / Math.PI);
    return angle;
  };

  return (
    <div
      className="min-h-screen w-full bg-mesh-gradient relative overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#D97706 1px, transparent 1px), linear-gradient(90deg, #D97706 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Start Overlay */}
      {showStartOverlay && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center animate-scale-in">
          <Card className="card-modern max-w-2xl mx-6">
            <div className="p-12 text-center">
              <div className="text-8xl mb-6 animate-bounce-slow">🍰</div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent mb-4">
                Golden Munch
              </h1>
              <p className="text-2xl text-chocolate-brown mb-8">
                Kiosk Idle Mode - AI Enhanced
              </p>
              <div className="text-xl text-chocolate-brown/80 mb-8 space-y-2">
                <p>🎮 Watch Smart Pacman collect treats with A* pathfinding!</p>
                <p>⭐ Special items activate power mode</p>
                <p>👻 Ghosts have unique AI personalities</p>
                <p>🧱 Random obstacles change every reload</p>
                <p>🧠 Advanced pathfinding & prediction</p>
              </div>
              <div className="bg-golden-orange/10 rounded-2xl p-6 mb-8">
                <p className="text-4xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                  Tap Anywhere to Start
                </p>
              </div>
              <p className="text-chocolate-brown/60">
                Tap the screen to begin ordering delicious treats!
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Score Display */}
      <div className="absolute top-6 left-6 z-30">
        <Card className="card-glass">
          <div className="p-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-chocolate-brown/70 font-semibold">SCORE</p>
                <p className="text-3xl font-black bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
                  {score.toLocaleString()}
                </p>
              </div>
              {highScore > 0 && (
                <div className="border-l-2 border-golden-orange/30 pl-4">
                  <p className="text-xs text-chocolate-brown/60 font-semibold">BEST</p>
                  <p className="text-xl font-bold text-chocolate-brown">
                    {highScore.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Power Mode Indicator */}
      {powerMode && (
        <div className="absolute top-6 right-6 z-30 animate-scale-in">
          <Card className="card-modern bg-gradient-to-r from-golden-orange to-deep-amber border-0">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl animate-pulse-slow">⚡</div>
                <div>
                  <p className="text-sm text-white/90 font-bold">POWER MODE</p>
                  <p className="text-2xl font-black text-white">{powerTimeLeft}s</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <Card className="card-glass">
          <div className="px-6 py-3 flex items-center gap-6">
            <Chip size="lg" variant="flat" color="warning">
              🎂 {cakes.length} Treats
            </Chip>
            <Chip size="lg" variant="flat" color="primary">
              👻 {ghosts.length} Ghosts
            </Chip>
            <Chip size="lg" variant="flat" color="default">
              🧱 {obstacles.length} Obstacles
            </Chip>
            {powerMode && (
              <Chip size="lg" variant="shadow" className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold animate-glow">
                ⚡ POWERED UP!
              </Chip>
            )}
            <Chip size="sm" variant="flat" color="success">
              🧠 A* AI
            </Chip>
          </div>
        </Card>
      </div>

      {/* Obstacles */}
      {obstacles.map((obstacle) => (
        <div
          key={obstacle.id}
          className="absolute rounded-xl shadow-lg"
          style={{
            left: `${obstacle.x}%`,
            top: `${obstacle.y}%`,
            width: `${obstacle.width}%`,
            height: `${obstacle.height}%`,
            background: `linear-gradient(135deg, ${obstacle.color} 0%, ${obstacle.color}CC 100%)`,
            border: '2px solid rgba(139, 69, 19, 0.3)',
            boxShadow: `
              inset 0 2px 4px rgba(255, 255, 255, 0.2),
              inset 0 -2px 4px rgba(0, 0, 0, 0.3),
              0 4px 12px rgba(139, 69, 19, 0.4)
            `,
            zIndex: 5,
          }}
        >
          {/* Wood grain texture effect */}
          <div className="absolute inset-0 rounded-xl opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.1) 2px,
                rgba(0, 0, 0, 0.1) 4px
              )`
            }}
          />
        </div>
      ))}

      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute text-2xl pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: particle.life,
            zIndex: 20,
            color: particle.color,
            filter: `drop-shadow(0 0 10px ${particle.color})`
          }}
        >
          {particle.emoji || '✨'}
        </div>
      ))}

      {/* Debug: Show Pacman's path (optional - can be removed) */}
      {pacmanPath.slice(0, 5).map((waypoint, idx) => (
        <div
          key={idx}
          className="absolute w-2 h-2 bg-green-500/30 rounded-full pointer-events-none"
          style={{
            left: `${waypoint.x}%`,
            top: `${waypoint.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 8
          }}
        />
      ))}

      {/* Pacman */}
      <div
        className={`absolute transition-all duration-75 ${
          isEating ? 'scale-125' : 'scale-100'
        }`}
        style={{
          left: `${pacmanPosition.x}%`,
          top: `${pacmanPosition.y}%`,
          transform: `translate(-50%, -50%) rotate(${getRotation()}deg)`,
          zIndex: 15
        }}
      >
        <div
          className={`w-16 h-16 relative transition-all duration-300`}
          style={{
            background: powerMode
              ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)'
              : 'linear-gradient(135deg, #F9A03F 0%, #D97706 100%)',
            borderRadius: '50%',
            clipPath: mouthOpen
              ? 'polygon(100% 70%, 40% 50%, 100% 30%, 100% 0%, 0% 0%, 0% 100%, 100% 100%)'
              : 'circle(50%)',
            boxShadow: powerMode
              ? '0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.4)'
              : '0 8px 20px rgba(249, 160, 63, 0.4)',
            filter: powerMode ? 'brightness(1.3)' : 'none'
          }}
        >
          <div className="absolute w-3 h-3 bg-chocolate-brown rounded-full top-4 left-4 shadow-inner">
            <div className="absolute w-1 h-1 bg-white rounded-full top-0.5 left-0.5"></div>
          </div>
          {powerMode && (
            <div className="absolute inset-0 rounded-full bg-golden-orange/30 animate-pulse-slow"></div>
          )}
        </div>
      </div>

      {/* Ghosts */}
      {ghosts.map((ghost) => (
        <div
          key={ghost.id}
          className={`absolute transition-all duration-200`}
          style={{
            left: `${ghost.x}%`,
            top: `${ghost.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 12
          }}
        >
          <div
            className={`relative ${ghost.scared ? 'animate-pulse' : ''}`}
            style={{
              filter: ghost.scared
                ? 'saturate(0.3) brightness(1.8) drop-shadow(0 0 15px rgba(138, 43, 226, 0.6))'
                : `drop-shadow(0 4px 12px ${ghost.color}40)`,
            }}
          >
            <div
              className="text-5xl"
              style={{
                color: ghost.scared ? '#9CA3AF' : ghost.color,
              }}
            >
              👻
            </div>
            {ghost.scared && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl">😱</div>
              </div>
            )}
            {/* Personality indicator */}
            {!ghost.scared && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <div className="text-xs bg-black/50 text-white px-1 rounded">
                  {ghost.personality === 'aggressive' && '⚔️'}
                  {ghost.personality === 'smart' && '🧠'}
                  {ghost.personality === 'ambusher' && '🎯'}
                  {ghost.personality === 'random' && '🎲'}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Cakes */}
      {cakes.map((cake) => (
        <div
          key={cake.id}
          className="absolute transition-all duration-300"
          style={{
            left: `${cake.x}%`,
            top: `${cake.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            animation: cake.isSpecial
              ? 'specialFloat 2s ease-in-out infinite'
              : 'gentleFloat 3s ease-in-out infinite',
            filter: cake.isSpecial
              ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 1)) drop-shadow(0 0 40px rgba(255, 215, 0, 0.5))'
              : 'drop-shadow(0 4px 10px rgba(217, 119, 6, 0.3))'
          }}
        >
          <div className={`text-4xl ${cake.isSpecial ? 'scale-125' : ''}`}>
            {cake.emoji}
          </div>
        </div>
      ))}

      {/* Message Toast */}
      {showMessage && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-scale-in">
          <Card className="card-modern shadow-2xl border-4 border-golden-orange">
            <div className="px-10 py-6">
              <p className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent text-center">
                {currentMessage}
              </p>
            </div>
          </Card>
        </div>
      )}

      <style jsx>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-12px) rotate(5deg); }
        }

        @keyframes specialFloat {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0px) scale(1.25) rotate(0deg);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-15px) scale(1.35) rotate(15deg);
          }
        }
      `}</style>
    </div>
  );
}
