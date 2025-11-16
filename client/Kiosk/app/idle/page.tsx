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
  behavior: 'wander' | 'scared' | 'aggression';
  aggressionTimer: number; // Countdown when in aggression mode (5 seconds)
  aggressionCooldown: number; // Cooldown period before can aggro again
  onCooldown: boolean;
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
  // Start Pacman in a safe position away from walls (15, 15 is in top-left area)
  const [pacmanPosition, setPacmanPosition] = useState<Position>({ x: 15, y: 15 });
  const [pacmanDirection, setPacmanDirection] = useState<Position>({ x: 1, y: 0 });
  const [pacmanPath, setPacmanPath] = useState<Position[]>([]);
  const [pacmanBehavior, setPacmanBehavior] = useState<'cake_hunting' | 'run' | 'hunting_ghosts'>('cake_hunting');
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
  const lastPacmanPos = useRef<Position>({ x: 15, y: 15 });
  const powerModeRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const pacmanPosRef = useRef<Position>({ x: 15, y: 15 });
  const pacmanDirRef = useRef<Position>({ x: 1, y: 0 });
  const pacmanBehaviorRef = useRef<'cake_hunting' | 'run' | 'hunting_ghosts'>('cake_hunting');
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

  useEffect(() => {
    pacmanBehaviorRef.current = pacmanBehavior;
  }, [pacmanBehavior]);

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

  // Line-of-sight check: Can point A see point B without obstacles in between?
  const hasLineOfSight = useCallback((from: Position, to: Position): boolean => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Sample points along the line
    const steps = Math.ceil(distance / 2); // Check every 2 units

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const checkX = from.x + dx * t;
      const checkY = from.y + dy * t;

      // If any point along the line hits an obstacle, no line of sight
      if (isInsideObstacle(checkX, checkY, 0)) {
        return false;
      }
    }

    return true;
  }, [isInsideObstacle]);

  // A* Pathfinding Algorithm - Simplified and working
  const findPath = useCallback((start: Position, goal: Position, avoidPoints: Position[] = []): Position[] => {
    console.log('\n🔍 FINDPATH CALLED:');
    console.log('  Start:', { x: start?.x?.toFixed(1), y: start?.y?.toFixed(1) });
    console.log('  Goal:', { x: goal?.x?.toFixed(1), y: goal?.y?.toFixed(1) });
    console.log('  Avoid Points:', avoidPoints.length);

    // Validate inputs
    if (!start || !goal) {
      console.log('  ❌ INVALID INPUT - Returning default position');
      return [start || { x: 15, y: 15 }];
    }

    const distance = Math.sqrt(Math.pow(goal.x - start.x, 2) + Math.pow(goal.y - start.y, 2));
    console.log('  Direct Distance:', distance.toFixed(2));

    if (distance < 3) {
      console.log('  ✅ ALREADY AT GOAL - Returning start position');
      return [start];
    }

    const GRID_SIZE = 5;
    const MAX_ITERATIONS = 100;
    const BOUNDS = { min: 5, max: 95 }; // Account for wall thickness

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
        const simplifiedPath = path.length > 2 ? [path[0], path[Math.floor(path.length / 2)], path[path.length - 1]] : path;
        console.log('  ✅ PATH FOUND!');
        console.log('    Full path length:', path.length);
        console.log('    Simplified path length:', simplifiedPath.length);
        console.log('    Iterations used:', iterations);
        return simplifiedPath;
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
    console.log('  ⚠️  NO PATH FOUND - Returning direct line');
    console.log('    Iterations used:', iterations);
    console.log('    Open set size:', openSet.length);
    console.log('    Closed set size:', closedSet.size);
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
        x: Math.random() * 90 + 5,
        y: Math.random() * 90 + 5
      };

      if (!isInsideObstacle(pos.x, pos.y, 3)) {
        return pos;
      }
      attempts++;
    }
    // Fallback to safe position in top-left area (away from walls at 25, 50, 75)
    return { x: 15, y: 15 };
  }, [isInsideObstacle]);

  // Initialize - Only runs once on mount
  useEffect(() => {
    // Generate maze-like structure with corridors
    const initialObstacles: Obstacle[] = [];
    const obstacleColors = ['#8B4513', '#A0522D', '#6B4423', '#8B7355', '#654321'];
    const wallColor = obstacleColors[0];

    // Outer walls (border)
    const wallThickness = 2;

    // Top wall
    initialObstacles.push({
      id: obstacleIdRef.current++,
      x: 0,
      y: 0,
      width: 100,
      height: wallThickness,
      color: wallColor
    });

    // Bottom wall
    initialObstacles.push({
      id: obstacleIdRef.current++,
      x: 0,
      y: 98,
      width: 100,
      height: wallThickness,
      color: wallColor
    });

    // Left wall
    initialObstacles.push({
      id: obstacleIdRef.current++,
      x: 0,
      y: 0,
      width: wallThickness,
      height: 100,
      color: wallColor
    });

    // Right wall
    initialObstacles.push({
      id: obstacleIdRef.current++,
      x: 98,
      y: 0,
      width: wallThickness,
      height: 100,
      color: wallColor
    });

    // Create maze corridors - vertical and horizontal walls with gaps
    const corridorWidth = 2;
    const gapSize = 20; // Size of openings in walls - increased for easier navigation

    // Vertical walls creating corridors
    const verticalWalls = [25, 50, 75];
    verticalWalls.forEach((xPos, index) => {
      // Each vertical wall has gaps at different heights
      const gapPositions = [
        { start: 20, end: 20 + gapSize },
        { start: 50, end: 50 + gapSize },
        { start: 80, end: 80 + gapSize }
      ];

      // Shuffle gaps for variety
      const selectedGap = gapPositions[(index * 2) % gapPositions.length];
      const selectedGap2 = gapPositions[(index * 2 + 1) % gapPositions.length];

      let currentY = wallThickness + 2;

      // First segment (before first gap)
      if (currentY < selectedGap.start) {
        initialObstacles.push({
          id: obstacleIdRef.current++,
          x: xPos,
          y: currentY,
          width: corridorWidth,
          height: selectedGap.start - currentY,
          color: obstacleColors[Math.floor(Math.random() * obstacleColors.length)]
        });
      }
      currentY = selectedGap.end;

      // Second segment (between gaps)
      if (selectedGap2.start > selectedGap.end && currentY < selectedGap2.start) {
        initialObstacles.push({
          id: obstacleIdRef.current++,
          x: xPos,
          y: currentY,
          width: corridorWidth,
          height: selectedGap2.start - currentY,
          color: obstacleColors[Math.floor(Math.random() * obstacleColors.length)]
        });
      }
      currentY = selectedGap2.end;

      // Third segment (after second gap to bottom)
      if (currentY < 98 - wallThickness - 2) {
        initialObstacles.push({
          id: obstacleIdRef.current++,
          x: xPos,
          y: currentY,
          width: corridorWidth,
          height: 98 - wallThickness - 2 - currentY,
          color: obstacleColors[Math.floor(Math.random() * obstacleColors.length)]
        });
      }
    });

    // Horizontal walls creating corridors
    const horizontalWalls = [25, 50, 75];
    horizontalWalls.forEach((yPos, index) => {
      // Each horizontal wall has gaps at different positions
      const gapPositions = [
        { start: 15, end: 15 + gapSize },
        { start: 45, end: 45 + gapSize },
        { start: 75, end: 75 + gapSize }
      ];

      const selectedGap = gapPositions[(index * 2 + 1) % gapPositions.length];
      const selectedGap2 = gapPositions[(index * 2) % gapPositions.length];

      let currentX = wallThickness + 2;

      // First segment
      if (currentX < selectedGap.start) {
        initialObstacles.push({
          id: obstacleIdRef.current++,
          x: currentX,
          y: yPos,
          width: selectedGap.start - currentX,
          height: corridorWidth,
          color: obstacleColors[Math.floor(Math.random() * obstacleColors.length)]
        });
      }
      currentX = selectedGap.end;

      // Second segment
      if (selectedGap2.start > selectedGap.end && currentX < selectedGap2.start) {
        initialObstacles.push({
          id: obstacleIdRef.current++,
          x: currentX,
          y: yPos,
          width: selectedGap2.start - currentX,
          height: corridorWidth,
          color: obstacleColors[Math.floor(Math.random() * obstacleColors.length)]
        });
      }
      currentX = selectedGap2.end;

      // Third segment
      if (currentX < 98 - wallThickness - 2) {
        initialObstacles.push({
          id: obstacleIdRef.current++,
          x: currentX,
          y: yPos,
          width: 98 - wallThickness - 2 - currentX,
          height: corridorWidth,
          color: obstacleColors[Math.floor(Math.random() * obstacleColors.length)]
        });
      }
    });

    setObstacles(initialObstacles);
    obstaclesRef.current = initialObstacles;

    // Helper function for this initialization only
    const getValidPos = (): Position => {
      let attempts = 0;
      while (attempts < 50) {
        const pos = {
          x: Math.random() * 90 + 5,
          y: Math.random() * 90 + 5
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
      // Fallback to safe position in top-left area (away from walls at 25, 50, 75)
      return { x: 15, y: 15 };
    };

    const initialCakes: Cake[] = [];
    for (let i = 0; i < 5; i++) { // Reduced from 12 to 5
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

    for (let i = 0; i < 4; i++) {
      const pos = ghostStartPositions[i];
      initialGhosts.push({
        id: ghostIdRef.current++,
        x: pos.x,
        y: pos.y,
        color: ghostColors[i],
        direction: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
        behavior: 'wander',
        aggressionTimer: 0,
        aggressionCooldown: 0,
        onCooldown: false
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
      setPacmanBehavior('cake_hunting');
      setGhosts(prev => prev.map(ghost => ({ ...ghost, behavior: 'wander' })));
    }
  }, [powerMode, powerTimeLeft]);

  // Spawn cakes
  useEffect(() => {
    const spawnCake = () => {
      if (cakes.length < 8) { // Reduced from 15 to 8
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

    const interval = setInterval(spawnCake, 2000); // Increased from 1500ms to 2000ms
    return () => clearInterval(interval);
  }, [cakes.length, findValidPosition]);

  // New Ghost AI - 3 Behaviors: Wander, Scared, Aggression
  useEffect(() => {
    const interval = setInterval(() => {
      setGhosts(prev => prev.map(ghost => {
        let newX = ghost.x;
        let newY = ghost.y;
        let newDirection = { ...ghost.direction };
        let newBehavior = ghost.behavior;
        let newAggressionTimer = ghost.aggressionTimer;
        let newAggressionCooldown = ghost.aggressionCooldown;
        let newOnCooldown = ghost.onCooldown;

        const pacPos = pacmanPosRef.current;
        const currentPowerMode = powerModeRef.current;

        const distance = Math.sqrt(
          Math.pow(ghost.x - pacPos.x, 2) +
          Math.pow(ghost.y - pacPos.y, 2)
        );

        // Update cooldown timer
        if (newAggressionCooldown > 0) {
          newAggressionCooldown = Math.max(0, newAggressionCooldown - 0.05); // Decrease by 50ms
          if (newAggressionCooldown === 0) {
            newOnCooldown = false;
          }
        }

        // Behavior transitions
        if (currentPowerMode) {
          // When Pacman has star, all ghosts become scared
          newBehavior = 'scared';
          newAggressionTimer = 0;
        } else if (newBehavior === 'scared') {
          // Power mode ended, return to wander
          newBehavior = 'wander';
          newAggressionTimer = 0;
        } else if (newBehavior === 'aggression') {
          // In aggression mode, count down timer
          newAggressionTimer = Math.max(0, newAggressionTimer - 0.05); // Decrease by 50ms
          if (newAggressionTimer <= 0) {
            // Aggression timer expired, go on cooldown
            newBehavior = 'wander';
            newOnCooldown = true;
            newAggressionCooldown = 10; // 10 second cooldown
          }
        } else if (newBehavior === 'wander' && !newOnCooldown) {
          // Enter aggression mode if ghost can see Pacman (line of sight)
          if (distance < 40 && hasLineOfSight({ x: ghost.x, y: ghost.y }, pacPos) && Math.random() < 0.05) {
            newBehavior = 'aggression';
            newAggressionTimer = 5; // 5 second aggression
          }
        }

        // Execute behavior
        if (newBehavior === 'scared') {
          // SCARED BEHAVIOR: Flee from Pacman
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
        } else if (newBehavior === 'aggression') {
          // AGGRESSION BEHAVIOR: Actively pursue Pacman
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
        } else {
          // WANDER BEHAVIOR: Random wandering
          if (Math.random() < 0.03) {
            const angle = Math.random() * Math.PI * 2;
            newDirection = { x: Math.cos(angle), y: Math.sin(angle) };
          }
        }

        // Movement speed based on behavior
        const baseSpeed = newBehavior === 'scared' ? 0.5 : newBehavior === 'aggression' ? 1.0 : 0.6;
        const speed = baseSpeed * (0.9 + Math.random() * 0.2);
        const testX = ghost.x + newDirection.x * speed;
        const testY = ghost.y + newDirection.y * speed;

        const wouldHitObstacle = isInsideObstacle(testX, testY, 1);

        if (testX > 5 && testX < 95 && testY > 5 && testY < 95 && !wouldHitObstacle) {
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
          behavior: newBehavior,
          aggressionTimer: newAggressionTimer,
          aggressionCooldown: newAggressionCooldown,
          onCooldown: newOnCooldown
        };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [findPath, isInsideObstacle, hasLineOfSight]);

  // New Pacman AI - 3 Behaviors: Cake Hunting, Run, Hunting Ghosts
  useEffect(() => {
    const movePacman = () => {
      let shouldIncrementStuck = false;
      let shouldResetStuck = false;
      let newPathToSet: Position[] | null = null;
      let newDirectionToSet: Position | null = null;
      let shouldClearPath = false;
      let newBehaviorToSet: 'cake_hunting' | 'run' | 'hunting_ghosts' | null = null;

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
        const currentBehavior = pacmanBehaviorRef.current;

        // Stuck detection
        if (Math.abs(prev.x - lastPacmanPos.current.x) < 0.1 &&
            Math.abs(prev.y - lastPacmanPos.current.y) < 0.1) {
          shouldIncrementStuck = true;
        } else {
          shouldResetStuck = true;
        }

        lastPacmanPos.current = { x: prev.x, y: prev.y };

        // Check for aggressive ghosts pursuing Pacman
        const aggressiveGhosts = currentGhosts.filter(g => g.behavior === 'aggression');
        const isBeingPursued = aggressiveGhosts.some(g => {
          const dist = Math.sqrt(Math.pow(g.x - prev.x, 2) + Math.pow(g.y - prev.y, 2));
          return dist < 25;
        });

        // Determine behavior based on game state
        let desiredBehavior: 'cake_hunting' | 'run' | 'hunting_ghosts';
        if (currentPowerMode) {
          // HUNTING GHOSTS: Prioritize eating ghosts when powered up
          desiredBehavior = 'hunting_ghosts';
        } else if (isBeingPursued) {
          // RUN: Flee from aggressive ghosts
          desiredBehavior = 'run';
        } else {
          // CAKE HUNTING: Default behavior
          desiredBehavior = 'cake_hunting';
        }

        if (desiredBehavior !== currentBehavior) {
          newBehaviorToSet = desiredBehavior;
          shouldClearPath = true; // Clear path when behavior changes
        }

        // Build target list based on behavior
        const targets: any[] = [];
        let avoidPoints: Position[] = [];

        if (desiredBehavior === 'hunting_ghosts') {
          // Prioritize scared ghosts
          const scaredGhosts = currentGhosts.filter(g => g.behavior === 'scared');
          scaredGhosts.forEach(g => {
            targets.push({
              x: g.x,
              y: g.y,
              type: 'ghost',
              priority: 5 // Highest priority
            });
          });

          // Add cakes as secondary targets
          currentCakes.forEach(c => {
            targets.push({
              ...c,
              type: 'cake',
              priority: c.isSpecial ? 3 : 1
            });
          });
        } else if (desiredBehavior === 'run') {
          // When running, find safe positions away from aggressive ghosts
          // Don't target anything, just flee
          avoidPoints = aggressiveGhosts.map(g => ({ x: g.x, y: g.y }));
        } else {
          // CAKE HUNTING: Target cakes, avoid aggressive ghosts
          currentCakes.forEach(c => {
            targets.push({
              ...c,
              type: 'cake',
              priority: c.isSpecial ? 4 : 1 // Prioritize special cakes
            });
          });

          // Avoid aggressive ghosts
          const dangerGhosts = currentGhosts.filter(g => g.behavior === 'aggression' || g.behavior === 'wander');
          avoidPoints = dangerGhosts
            .filter(g => {
              const dist = Math.sqrt(Math.pow(g.x - prev.x, 2) + Math.pow(g.y - prev.y, 2));
              return dist < 25;
            })
            .map(g => ({ x: g.x, y: g.y }));
        }

        // Find dangerous ghosts to avoid
        console.log('\n⚠️  DANGER ANALYSIS:');
        console.log('  Dangerous Ghosts:', avoidPoints.length);
        avoidPoints.forEach((pt, i) => {
          const dist = Math.sqrt(Math.pow(pt.x - prev.x, 2) + Math.pow(pt.y - prev.y, 2));
          console.log(`    Danger ${i + 1}: Ghost at (${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) - Distance: ${dist.toFixed(1)}`);
        });

        // Recalculate path if needed
        const shouldRecalculate = currentPath.length === 0 || currentStuckCounter > 15 || shouldClearPath || Math.random() < 0.1;

        if (shouldRecalculate) {
          if (desiredBehavior === 'run') {
            // Run away from aggressive ghosts
            if (aggressiveGhosts.length > 0) {
              // Find average position of aggressive ghosts
              const avgX = aggressiveGhosts.reduce((sum, g) => sum + g.x, 0) / aggressiveGhosts.length;
              const avgY = aggressiveGhosts.reduce((sum, g) => sum + g.y, 0) / aggressiveGhosts.length;

              // Run in opposite direction
              const fleeX = prev.x + (prev.x - avgX) * 2;
              const fleeY = prev.y + (prev.y - avgY) * 2;
              const clampedFleeX = Math.max(10, Math.min(90, fleeX));
              const clampedFleeY = Math.max(10, Math.min(90, fleeY));

              const calculatedPath = findPath(prev, { x: clampedFleeX, y: clampedFleeY }, avoidPoints);
              newPathToSet = calculatedPath.length > 1 ? calculatedPath.slice(1) : calculatedPath;
              shouldResetStuck = true;
            }
          } else if (targets.length > 0) {
            // Find best target based on priority
            const bestTarget = targets.reduce((best, target) => {
              const distance = Math.sqrt(
                Math.pow(target.x - prev.x, 2) + Math.pow(target.y - prev.y, 2)
              );
              const score = distance / target.priority;
              return score < best.score ? { target, score } : best;
            }, { target: null, score: Infinity });

            if (bestTarget.target && bestTarget.score < 100) {
              console.log('\n📍 CALCULATING PATH TO TARGET...');
              console.log('  From:', { x: prev.x.toFixed(1), y: prev.y.toFixed(1) });
              console.log('  To:', { x: bestTarget.target.x.toFixed(1), y: bestTarget.target.y.toFixed(1) });
              console.log('  Avoid Points:', avoidPoints.length);

              const calculatedPath = findPath(prev, { x: bestTarget.target.x, y: bestTarget.target.y }, avoidPoints);
              newPathToSet = calculatedPath.length > 1 ? calculatedPath.slice(1) : calculatedPath;
              shouldResetStuck = true;
            }
          } else if (currentStuckCounter > 10) {
            // No targets available and stuck - move to random position
            const randomTarget = {
              x: Math.random() * 80 + 10,
              y: Math.random() * 80 + 10
            };
            const calculatedPath = findPath(prev, randomTarget, avoidPoints);
            console.log('  Random Path Length:', calculatedPath.length);
            newPathToSet = calculatedPath.length > 1 ? calculatedPath.slice(1) : calculatedPath;
            shouldResetStuck = true;
          } else {
            console.log('\n⏸️  NO RECALCULATION NEEDED - Using existing path');
          }
        } else {
          console.log('\n⏸️  SKIPPING PATH RECALCULATION');
        }

        // Follow the calculated path (use newly calculated path if available)
        console.log('\n🚶 PATH FOLLOWING:');
        const pathToFollow = newPathToSet !== null ? newPathToSet : currentPath;
        console.log('  Using path:', newPathToSet !== null ? 'NEWLY CALCULATED' : 'EXISTING');
        console.log('  Path length:', pathToFollow.length);

        if (pathToFollow.length > 0) {
          const nextWaypoint = pathToFollow[0];
          const dx = nextWaypoint.x - prev.x;
          const dy = nextWaypoint.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 3) {
            newPathToSet = currentPath.slice(1);
          }

          if (dist > 0) {
            newDirectionToSet = { x: dx / dist, y: dy / dist };
          }
        } else if (desiredBehavior === 'run' && aggressiveGhosts.length > 0) {
          // Emergency flee if no path
          const nearestAggro = aggressiveGhosts[0];
          const dx = prev.x - nearestAggro.x;
          const dy = prev.y - nearestAggro.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            newDirectionToSet = { x: dx / dist, y: dy / dist };
            console.log('  ➡️  Flee Direction:', { x: newDirectionToSet.x.toFixed(2), y: newDirectionToSet.y.toFixed(2) });
          }
        }

        // Apply movement with speed based on behavior
        let speed = 1.4; // Default
        if (desiredBehavior === 'hunting_ghosts') {
          speed = 1.8; // Fast when powered up
        } else if (desiredBehavior === 'run') {
          speed = 1.6; // Fast when fleeing
        }

        // Use newly calculated direction if available, otherwise use current direction
        const directionToUse = newDirectionToSet !== null ? newDirectionToSet : currentDirection;
        const testX = prev.x + directionToUse.x * speed;
        const testY = prev.y + directionToUse.y * speed;

        const wouldHitObstacle = isInsideObstacle(testX, testY, 1);

        if (testX > 5 && testX < 95 && testY > 5 && testY < 95 && !wouldHitObstacle) {
          newX = testX;
          newY = testY;
          console.log('  ✅ MOVEMENT ALLOWED - Moving to:', { x: newX.toFixed(2), y: newY.toFixed(2) });
        } else if (!wouldHitObstacle) {
          if (testX > 5 && testX < 95 && !isInsideObstacle(testX, prev.y, 1)) {
            newX = testX;
            console.log('  ➡️  Partial X movement allowed');
          }
          if (testY > 5 && testY < 95 && !isInsideObstacle(prev.x, testY, 1)) {
            newY = testY;
            console.log('  ⬆️  Partial Y movement allowed');
          }
          console.log('  ⚠️  PARTIAL MOVEMENT - New pos:', { x: newX.toFixed(2), y: newY.toFixed(2) });
        } else {
          shouldClearPath = true;
        }

        // Update position ref immediately
        pacmanPosRef.current = { x: newX, y: newY };
        console.log('  ✅ POSITION REF UPDATED:', { x: pacmanPosRef.current.x.toFixed(2), y: pacmanPosRef.current.y.toFixed(2) });

        return { x: newX, y: newY };
      });

      // Apply deferred state updates
      if (shouldIncrementStuck) {
        setPacmanStuckCounter(c => c + 1);
        pacmanStuckCounterRef.current += 1;
      } else if (shouldResetStuck) {
        setPacmanStuckCounter(0);
        pacmanStuckCounterRef.current = 0;
      }

      if (newPathToSet !== null) {
        setPacmanPath(newPathToSet);
        pacmanPathRef.current = newPathToSet; // Update ref immediately
        console.log('  ✅ REF UPDATED - pacmanPathRef length:', pacmanPathRef.current.length);
      } else if (shouldClearPath) {
        setPacmanPath([]);
        pacmanPathRef.current = [];
        console.log('  🗑️  REF CLEARED - pacmanPathRef');
      }

      if (newDirectionToSet !== null) {
        setPacmanDirection(newDirectionToSet);
        pacmanDirRef.current = newDirectionToSet; // Update ref immediately
        console.log('  ✅ REF UPDATED - pacmanDirRef:', { x: pacmanDirRef.current.x.toFixed(2), y: pacmanDirRef.current.y.toFixed(2) });
      }

      if (newBehaviorToSet !== null) {
        setPacmanBehavior(newBehaviorToSet);
      }
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

        if (distance < 3) {
          if (cake.isSpecial) {
            setPowerMode(true);
            setPowerTimeLeft(10);
            setPacmanBehavior('hunting_ghosts');
            setGhosts(prev => prev.map(ghost => ({ ...ghost, behavior: 'scared' })));
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

          if (distance < 6 && ghost.behavior === 'scared') {
            createParticles(ghost.x, ghost.y, ghost.color, 10, '💯');
            setIsEating(true);
            setTimeout(() => setIsEating(false), 200);
            setPacmanPath([]);

            const ghostData = {
              color: ghost.color
            };

            setTimeout(() => {
              const pos = findValidPosition();
              setGhosts(prev => [...prev, {
                id: ghostIdRef.current++,
                x: pos.x,
                y: pos.y,
                color: ghostData.color,
                direction: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
                behavior: powerModeRef.current ? 'scared' : 'wander',
                aggressionTimer: 0,
                aggressionCooldown: 0,
                onCooldown: false
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
    // Use ref for immediate direction updates (not lagging state)
    const angle = Math.atan2(pacmanDirRef.current.y, pacmanDirRef.current.x) * (180 / Math.PI);
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
          backgroundSize: '40px 40px'
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
          className="absolute text-base pointer-events-none"
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
          className={`w-6 h-6 relative transition-all duration-300`}
          style={{
            background: powerMode
              ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)'
              : 'linear-gradient(135deg, #F9A03F 0%, #D97706 100%)',
            borderRadius: '50%',
            clipPath: mouthOpen
              ? 'polygon(100% 70%, 40% 50%, 100% 30%, 100% 0%, 0% 0%, 0% 100%, 100% 100%)'
              : 'circle(50%)',
            boxShadow: powerMode
              ? '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)'
              : '0 6px 15px rgba(249, 160, 63, 0.4)',
            filter: powerMode ? 'brightness(1.3)' : 'none'
          }}
        >
          <div className="absolute w-1.5 h-1.5 bg-chocolate-brown rounded-full top-1.5 left-1.5 shadow-inner">
            <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-0 left-0"></div>
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
            className={`relative ${ghost.behavior === 'scared' ? 'animate-pulse' : ''}`}
            style={{
              filter: ghost.behavior === 'scared'
                ? 'saturate(0.3) brightness(1.8) drop-shadow(0 0 15px rgba(138, 43, 226, 0.6))'
                : ghost.behavior === 'aggression'
                ? `drop-shadow(0 0 20px ${ghost.color}) brightness(1.3)`
                : `drop-shadow(0 4px 12px ${ghost.color}40)`,
            }}
          >
            <div
              className="text-xl"
              style={{
                color: ghost.behavior === 'scared' ? '#9CA3AF' : ghost.color,
              }}
            >
              👻
            </div>
            {ghost.behavior === 'scared' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-sm">😱</div>
              </div>
            )}
            {ghost.onCooldown && ghost.behavior === 'wander' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-lg">😢</div>
              </div>
            )}
            {ghost.behavior === 'aggression' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-lg">😡</div>
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
          <div className={`text-lg ${cake.isSpecial ? 'scale-125' : ''}`}>
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
