"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export default function IdlePage() {
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
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const cakeIdRef = useRef(0);
  const ghostIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const lastPacmanPos = useRef<Position>({ x: 50, y: 50 });
  const powerModeRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const pacmanPosRef = useRef<Position>({ x: 50, y: 50 });
  const pacmanDirRef = useRef<Position>({ x: 1, y: 0 });
  const cakesRef = useRef<Cake[]>([]);
  const ghostsRef = useRef<Ghost[]>([]);
  const pacmanPathRef = useRef<Position[]>([]);
  const pacmanStuckCounterRef = useRef(0);

  const cakeEmojis = ['🎂', '🧁', '🍰', '🍪', '🍩', '🥧'];
  const specialCakeEmoji = '⭐';
  const ghostColors = ['#FF69B4', '#00CED1', '#FF6347', '#98FB98'];

  // Sync refs with state
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    pacmanPosRef.current = pacmanPosition;
  }, [pacmanPosition]);

  useEffect(() => {
    pacmanDirRef.current = pacmanDirection;
  }, [pacmanDirection]);

  useEffect(() => {
    cakesRef.current = cakes;
  }, [cakes]);

  useEffect(() => {
    ghostsRef.current = ghosts;
  }, [ghosts]);

  useEffect(() => {
    pacmanPathRef.current = pacmanPath;
  }, [pacmanPath]);

  useEffect(() => {
    pacmanStuckCounterRef.current = pacmanStuckCounter;
  }, [pacmanStuckCounter]);

  // Helper function to check if a position collides with any obstacle
  const isInsideObstacle = useCallback((x: number, y: number, margin: number = 2): boolean => {
    return obstaclesRef.current.some(obstacle => {
      const obstacleLeft = obstacle.x - margin;
      const obstacleRight = obstacle.x + obstacle.width + margin;
      const obstacleTop = obstacle.y - margin;
      const obstacleBottom = obstacle.y + obstacle.height + margin;

      return x >= obstacleLeft && x <= obstacleRight &&
             y >= obstacleTop && y <= obstacleBottom;
    });
  }, []);

  // A* Pathfinding Algorithm - Simplified and working
  const findPath = useCallback((start: Position, goal: Position, avoidPoints: Position[] = []): Position[] => {
    // Validate inputs
    if (!start || !goal) {
      return [start || { x: 50, y: 50 }];
    }

    const distance = Math.sqrt(Math.pow(goal.x - start.x, 2) + Math.pow(goal.y - start.y, 2));
    if (distance < 3) {
      return [start];
    }

    const GRID_SIZE = 5;
    const MAX_ITERATIONS = 100;
    const BOUNDS = { min: 2, max: 98 };

    // Helper: Check if position is walkable
    const isWalkable = (x: number, y: number): boolean => {
      if (x < BOUNDS.min || x > BOUNDS.max || y < BOUNDS.min || y > BOUNDS.max) {
        return false;
      }

      // Check obstacles
      const obstacles = obstaclesRef.current;
      for (const obstacle of obstacles) {
        const obstacleLeft = obstacle.x - 2;
        const obstacleRight = obstacle.x + obstacle.width + 2;
        const obstacleTop = obstacle.y - 2;
        const obstacleBottom = obstacle.y + obstacle.height + 2;

        if (x >= obstacleLeft && x <= obstacleRight && y >= obstacleTop && y <= obstacleBottom) {
          return false;
        }
      }

      // Check danger zones
      for (const avoid of avoidPoints) {
        const dist = Math.sqrt(Math.pow(x - avoid.x, 2) + Math.pow(y - avoid.y, 2));
        if (dist < 10) return false;
      }

      return true;
    };

    // Helper: Calculate heuristic
    const heuristic = (a: Position, b: Position): number => {
      return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    };

    // Helper: Get key for position
    const getKey = (pos: Position): string => {
      return `${Math.floor(pos.x / GRID_SIZE)},${Math.floor(pos.y / GRID_SIZE)}`;
    };

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();

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

    while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;

      // Find node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      const currentKey = getKey(current);
      if (closedSet.has(currentKey)) continue;
      closedSet.add(currentKey);

      // Check if reached goal
      if (heuristic(current, goal) < GRID_SIZE * 2) {
        const path: Position[] = [];
        let node: PathNode | null = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        return path.length > 2 ? [path[0], path[Math.floor(path.length / 2)], path[path.length - 1]] : path;
      }

      // Explore neighbors
      for (const dir of directions) {
        const newX = current.x + dir.x * GRID_SIZE;
        const newY = current.y + dir.y * GRID_SIZE;

        if (!isWalkable(newX, newY)) continue;

        const neighborKey = getKey({ x: newX, y: newY });
        if (closedSet.has(neighborKey)) continue;

        const g = current.g + GRID_SIZE;
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

    // No path found - return direct line
    return [start, goal];
  }, []);

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

  const findValidPosition = useCallback((): Position => {
    let attempts = 0;
    while (attempts < 50) {
      const pos = {
        x: Math.random() * 96 + 2,
        y: Math.random() * 96 + 2
      };

      if (!isInsideObstacle(pos.x, pos.y, 3)) {
        return pos;
      }
      attempts++;
    }
    return { x: 50, y: 50 };
  }, [isInsideObstacle]);

  // Initialize - Only runs once on mount
  useEffect(() => {
    // Generate random obstacles first
    const initialObstacles: Obstacle[] = [];
    const obstacleCount = Math.floor(Math.random() * 6) + 6; // 6-11 obstacles
    const obstacleColors = ['#8B4513', '#A0522D', '#6B4423', '#8B7355', '#654321'];

    // Reserved areas (don't spawn obstacles here)
    const reservedAreas = [
      { x: 50, y: 50, radius: 15 }, // Center area for Pacman start
      { x: 10, y: 10, radius: 8 },
      { x: 90, y: 10, radius: 8 },
      { x: 90, y: 90, radius: 8 },
      { x: 10, y: 90, radius: 8 }
    ];

    for (let i = 0; i < obstacleCount; i++) {
      let validPosition = false;
      let obstacle: Obstacle | null = null;
      let attempts = 0;

      while (!validPosition && attempts < 100) {
        const width = Math.random() * 4 + 2.5; // 2.5-6.5 units
        const height = Math.random() * 4 + 2.5;
        const x = Math.random() * 90 + 5;
        const y = Math.random() * 90 + 5;

        const overlapsReserved = reservedAreas.some(area => {
          const obstacleCenter = { x: x + width / 2, y: y + height / 2 };
          const distance = Math.sqrt(
            Math.pow(obstacleCenter.x - area.x, 2) +
            Math.pow(obstacleCenter.y - area.y, 2)
          );
          return distance < area.radius + Math.max(width, height) / 2;
        });

        const overlapsObstacle = initialObstacles.some(existing => {
          return !(
            x > existing.x + existing.width + 4 ||
            x + width < existing.x - 4 ||
            y > existing.y + existing.height + 4 ||
            y + height < existing.y - 4
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
    obstaclesRef.current = initialObstacles;

    // Helper function for this initialization only
    const getValidPos = (): Position => {
      let attempts = 0;
      while (attempts < 50) {
        const pos = {
          x: Math.random() * 96 + 2,
          y: Math.random() * 96 + 2
        };

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
    cakesRef.current = initialCakes; // Sync ref immediately to prevent race condition

    const initialGhosts: Ghost[] = [];
    const ghostStartPositions = [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 }
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
        personality: personalities[i]
      });
    }
    setGhosts(initialGhosts);
    ghostsRef.current = initialGhosts; // Sync ref immediately to prevent race condition
  }, []); // Only run once on mount

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
    } else if (powerTimeLeft === 0 && powerMode) {
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

  // Advanced Ghost AI
  useEffect(() => {
    const interval = setInterval(() => {
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

        const pacPos = pacmanPosRef.current;
        const pacDir = pacmanDirRef.current;

        const distance = Math.sqrt(
          Math.pow(ghost.x - pacPos.x, 2) +
          Math.pow(ghost.y - pacPos.y, 2)
        );

        // Use pathfinding for chase mode
        if (newMode === 'chase' && !ghost.scared && distance < 50) {
          const path = findPath({ x: ghost.x, y: ghost.y }, pacPos);
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
          const predictedX = pacPos.x + pacDir.x * 20;
          const predictedY = pacPos.y + pacDir.y * 20;
          const clampedX = Math.max(10, Math.min(90, predictedX));
          const clampedY = Math.max(10, Math.min(90, predictedY));

          if (distance < 60) {
            const path = findPath({ x: ghost.x, y: ghost.y }, { x: clampedX, y: clampedY });
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
          if (distance < 35) {
            const fleeX = ghost.x + (ghost.x - pacPos.x) * 2;
            const fleeY = ghost.y + (ghost.y - pacPos.y) * 2;
            const clampedFleeX = Math.max(10, Math.min(90, fleeX));
            const clampedFleeY = Math.max(10, Math.min(90, fleeY));

            const path = findPath({ x: ghost.x, y: ghost.y }, { x: clampedFleeX, y: clampedFleeY });
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
          // Random movement
          if (Math.random() < 0.03) {
            const angle = Math.random() * Math.PI * 2;
            newDirection = { x: Math.cos(angle), y: Math.sin(angle) };
          }
        }

        const baseSpeed = ghost.scared ? 0.4 : ghost.personality === 'aggressive' ? 0.8 : 0.6;
        const speed = baseSpeed * (0.9 + Math.random() * 0.2);
        const testX = ghost.x + newDirection.x * speed;
        const testY = ghost.y + newDirection.y * speed;

        const wouldHitObstacle = isInsideObstacle(testX, testY, 1);

        if (testX > 2 && testX < 98 && testY > 2 && testY < 98 && !wouldHitObstacle) {
          newX = testX;
          newY = testY;
        } else if (wouldHitObstacle) {
          const angle = Math.random() * Math.PI * 2;
          newDirection = { x: Math.cos(angle), y: Math.sin(angle) };
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
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Improved Pacman AI with A* pathfinding
  useEffect(() => {
    const movePacman = () => {
      let shouldIncrementStuck = false;
      let shouldResetStuck = false;
      let newPathToSet: Position[] | null = null;
      let newDirectionToSet: Position | null = null;
      let shouldClearPath = false;

      setPacmanPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        // Get current values from refs
        const currentCakes = cakesRef.current;
        const currentGhosts = ghostsRef.current;
        const currentPowerMode = powerModeRef.current;
        const currentPath = pacmanPathRef.current;
        const currentStuckCounter = pacmanStuckCounterRef.current;
        const currentDirection = pacmanDirRef.current;

        console.log('🎮 PACMAN MOVEMENT DEBUG:', {
          position: prev,
          cakesCount: currentCakes.length,
          ghostsCount: currentGhosts.length,
          currentPathLength: currentPath.length,
          stuckCounter: currentStuckCounter,
          direction: currentDirection
        });

        // Stuck detection
        if (Math.abs(prev.x - lastPacmanPos.current.x) < 0.1 &&
            Math.abs(prev.y - lastPacmanPos.current.y) < 0.1) {
          shouldIncrementStuck = true;
        } else {
          shouldResetStuck = true;
        }

        lastPacmanPos.current = { x: prev.x, y: prev.y };

        // Build target list
        const targets: any[] = currentCakes.map(c => ({
          ...c,
          type: 'cake',
          priority: c.isSpecial ? 3 : 1
        }));

        if (currentPowerMode) {
          currentGhosts.filter(g => g.scared).forEach(g => {
            targets.push({
              x: g.x,
              y: g.y,
              type: 'ghost',
              priority: 2
            });
          });
        }

        console.log('🎯 TARGETS:', {
          count: targets.length,
          firstThree: targets.slice(0, 3).map(t => ({ x: t.x, y: t.y, type: t.type }))
        });

        // Find dangerous ghosts to avoid
        const dangerGhosts = currentGhosts.filter(g => !g.scared);
        const avoidPoints: Position[] = dangerGhosts
          .filter(g => {
            const dist = Math.sqrt(Math.pow(g.x - prev.x, 2) + Math.pow(g.y - prev.y, 2));
            return dist < 30;
          })
          .map(g => ({ x: g.x, y: g.y }));

        // Recalculate path if needed
        const shouldRecalculate = currentPath.length === 0 || currentStuckCounter > 15 || Math.random() < 0.1;
        console.log('🔄 PATH RECALCULATION CHECK:', {
          shouldRecalculate,
          reason: currentPath.length === 0 ? 'no path' : currentStuckCounter > 15 ? 'stuck' : 'random',
          pathLength: currentPath.length,
          stuckCounter: currentStuckCounter
        });

        if (shouldRecalculate) {
          if (targets.length > 0) {
            const bestTarget = targets.reduce((best, target) => {
              const distance = Math.sqrt(
                Math.pow(target.x - prev.x, 2) + Math.pow(target.y - prev.y, 2)
              );
              const score = distance / target.priority;
              return score < best.score ? { target, score } : best;
            }, { target: null, score: Infinity });

            console.log('🎯 BEST TARGET:', {
              target: bestTarget.target ? { x: bestTarget.target.x, y: bestTarget.target.y, type: bestTarget.target.type } : null,
              score: bestTarget.score
            });

            if (bestTarget.target && bestTarget.score < 100) {
              const calculatedPath = findPath(prev, { x: bestTarget.target.x, y: bestTarget.target.y }, avoidPoints);
              console.log('📍 CALCULATED PATH:', {
                from: prev,
                to: { x: bestTarget.target.x, y: bestTarget.target.y },
                pathLength: calculatedPath.length,
                path: calculatedPath
              });
              newPathToSet = calculatedPath.slice(1);
              shouldResetStuck = true;
            } else {
              console.log('❌ NO VALID TARGET (score too high or no target)');
            }
          } else if (currentStuckCounter > 10) {
            // No targets available and stuck - move to random position
            const randomTarget = {
              x: Math.random() * 80 + 10,
              y: Math.random() * 80 + 10
            };
            console.log('🎲 MOVING TO RANDOM TARGET:', randomTarget);
            const calculatedPath = findPath(prev, randomTarget, avoidPoints);
            newPathToSet = calculatedPath.slice(1);
            shouldResetStuck = true;
          }
        }

        // Follow the calculated path
        if (currentPath.length > 0) {
          const nextWaypoint = currentPath[0];
          const dx = nextWaypoint.x - prev.x;
          const dy = nextWaypoint.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          console.log('🚶 FOLLOWING PATH:', {
            currentWaypoint: nextWaypoint,
            distance: dist,
            willAdvance: dist < 3
          });

          if (dist < 3) {
            newPathToSet = currentPath.slice(1);
            console.log('✅ REACHED WAYPOINT, advancing to next');
          }

          if (dist > 0) {
            newDirectionToSet = { x: dx / dist, y: dy / dist };
            console.log('➡️ NEW DIRECTION SET:', newDirectionToSet);
          }
        } else if (avoidPoints.length > 0) {
          const nearestDanger = avoidPoints[0];
          const dx = prev.x - nearestDanger.x;
          const dy = prev.y - nearestDanger.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          console.log('⚠️ FLEEING FROM DANGER:', { danger: nearestDanger, distance: dist });
          if (dist > 0) {
            newDirectionToSet = { x: dx / dist, y: dy / dist };
          }
        } else {
          console.log('🤷 NO PATH AND NO DANGER - continuing current direction');
        }

        // Apply movement
        const speed = currentPowerMode ? 1.8 : 1.4;
        const testX = prev.x + currentDirection.x * speed;
        const testY = prev.y + currentDirection.y * speed;

        const wouldHitObstacle = isInsideObstacle(testX, testY, 1);

        console.log('🏃 MOVEMENT:', {
          currentPos: prev,
          currentDirection,
          speed,
          testPos: { x: testX, y: testY },
          wouldHitObstacle,
          willMove: testX > 2 && testX < 98 && testY > 2 && testY < 98 && !wouldHitObstacle
        });

        if (testX > 2 && testX < 98 && testY > 2 && testY < 98 && !wouldHitObstacle) {
          newX = testX;
          newY = testY;
        } else if (!wouldHitObstacle) {
          if (testX > 2 && testX < 98 && !isInsideObstacle(testX, prev.y, 1)) {
            newX = testX;
          }
          if (testY > 2 && testY < 98 && !isInsideObstacle(prev.x, testY, 1)) {
            newY = testY;
          }
        } else {
          shouldClearPath = true;
          console.log('🚧 HIT OBSTACLE - clearing path');
        }

        return { x: newX, y: newY };
      });

      // Apply deferred state updates
      console.log('📝 DEFERRED STATE UPDATES:', {
        shouldIncrementStuck,
        shouldResetStuck,
        newPathLength: newPathToSet ? newPathToSet.length : 'null',
        shouldClearPath,
        newDirection: newDirectionToSet
      });

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

      console.log('─────────────────────────────────────────────');
    };

    const interval = setInterval(movePacman, 30);
    return () => clearInterval(interval);
  }, [findPath, isInsideObstacle]);

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
            setPowerMode(true);
            setPowerTimeLeft(10);
            setGhosts(prev => prev.map(ghost => ({ ...ghost, scared: true, mode: 'flee', modeTimer: 120 })));
            createParticles(cake.x, cake.y, '#FFD700', 12, '✨');
          } else {
            createParticles(cake.x, cake.y, '#F9A03F', 6);
          }
          setIsEating(true);
          setTimeout(() => setIsEating(false), 200);
          setPacmanPath([]);
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
            createParticles(ghost.x, ghost.y, ghost.color, 10, '💯');
            setIsEating(true);
            setTimeout(() => setIsEating(false), 200);
            setPacmanPath([]);

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
                scared: powerModeRef.current,
                mode: 'flee',
                modeTimer: 100,
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

  const handleClick = useCallback(() => {
    window.location.href = '/';
  }, []);

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
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen bg-mesh-gradient overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#D97706 1px, transparent 1px), linear-gradient(90deg, #D97706 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

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
          className="absolute text-xl pointer-events-none"
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
          className={`w-10 h-10 relative transition-all duration-300`}
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
          <div className="absolute w-2 h-2 bg-chocolate-brown rounded-full top-2.5 left-2.5 shadow-inner">
            <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-0.5 left-0.5"></div>
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
              className="text-3xl"
              style={{
                color: ghost.scared ? '#9CA3AF' : ghost.color,
              }}
            >
              👻
            </div>
            {ghost.scared && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-lg">😱</div>
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
          <div className={`text-2xl ${cake.isSpecial ? 'scale-125' : ''}`}>
            {cake.emoji}
          </div>
        </div>
      ))}

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
