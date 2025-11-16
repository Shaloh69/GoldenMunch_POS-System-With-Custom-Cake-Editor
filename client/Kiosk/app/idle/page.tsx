"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const messages = [
  "Welcome to Golden Munch",
  "Fresh Bakes Daily",
  "Sweet Treats Await",
  "Discover New Flavors",
  "Handcrafted with Love",
  "Click to Start Ordering"
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
  mode: 'random' | 'chase' | 'flee';
  modeTimer: number;
  stuckCounter: number;
}

interface Position {
  x: number;
  y: number;
}

interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function IdlePage() {
  const [score, setScore] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [lastMessageScore, setLastMessageScore] = useState(0);
  const [pacmanPosition, setPacmanPosition] = useState<Position>({ x: 50, y: 50 });
  const [pacmanDirection, setPacmanDirection] = useState<Position>({ x: 1, y: 0 });
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [isEating, setIsEating] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(true);
  const [powerMode, setPowerMode] = useState(false);
  const [powerTimeLeft, setPowerTimeLeft] = useState(0);
  const [pacmanStuckCounter, setPacmanStuckCounter] = useState(0);
  
  const cakeIdRef = useRef(0);
  const ghostIdRef = useRef(0);
  const lastPacmanPos = useRef<Position>({ x: 50, y: 50 });
  const cakeEmojis = ['🎂', '🧁', '🍰', '🍪', '🍩', '🥧'];
  const specialCakeEmoji = '🌟';
  const ghostColors = ['#FF69B4', '#00CED1', '#FF6347', '#98FB98'];

  // Define walls
  const walls: Wall[] = [
    // Horizontal walls
    // { x: 20, y: 20, width: 20, height: 3 },
    // { x: 60, y: 20, width: 20, height: 3 },
    // { x: 10, y: 40, width: 15, height: 3 },
    // { x: 75, y: 40, width: 15, height: 3 },
    // { x: 30, y: 60, width: 40, height: 3 },
    // { x: 20, y: 80, width: 20, height: 3 },
    // { x: 60, y: 80, width: 20, height: 3 },
    
    // // Vertical walls
    // { x: 25, y: 25, width: 3, height: 15 },
    // { x: 72, y: 25, width: 3, height: 15 },
    // { x: 45, y: 30, width: 3, height: 20 },
    // { x: 55, y: 30, width: 3, height: 20 },
    // { x: 35, y: 65, width: 3, height: 15 },
    // { x: 65, y: 65, width: 3, height: 15 },
  ];

  // Check if a position collides with walls
  const checkWallCollision = (x: number, y: number, size: number = 3): boolean => {
    for (const wall of walls) {
      if (
        x + size > wall.x &&
        x - size < wall.x + wall.width &&
        y + size > wall.y &&
        y - size < wall.y + wall.height
      ) {
        return true;
      }
    }
    return false;
  };

  // Get available directions from a position
  const getAvailableDirections = (x: number, y: number, size: number = 3): Position[] => {
    const directions: Position[] = [];
    const testDistance = 5;
    
    // Test 8 directions
    const tests = [
      { x: 1, y: 0 },   // right
      { x: -1, y: 0 },  // left
      { x: 0, y: 1 },   // down
      { x: 0, y: -1 },  // up
      { x: 0.7, y: 0.7 },   // down-right
      { x: -0.7, y: 0.7 },  // down-left
      { x: 0.7, y: -0.7 },  // up-right
      { x: -0.7, y: -0.7 }, // up-left
    ];
    
    for (const dir of tests) {
      const testX = x + dir.x * testDistance;
      const testY = y + dir.y * testDistance;
      
      if (!checkWallCollision(testX, testY, size) && 
          testX > 5 && testX < 95 && 
          testY > 5 && testY < 95) {
        directions.push(dir);
      }
    }
    
    return directions;
  };

  // Find a valid spawn position
  const findValidPosition = (): Position => {
    let attempts = 0;
    while (attempts < 100) {
      const x = Math.random() * 80 + 10;
      const y = Math.random() * 80 + 10;
      if (!checkWallCollision(x, y, 5)) {
        return { x, y };
      }
      attempts++;
    }
    return { x: 50, y: 10 }; // Fallback
  };

  // Initialize cakes and ghosts
  useEffect(() => {
    const initialCakes: Cake[] = [];
    for (let i = 0; i < 10; i++) {
      const pos = findValidPosition();
      initialCakes.push({
        id: cakeIdRef.current++,
        x: pos.x,
        y: pos.y,
        emoji: cakeEmojis[Math.floor(Math.random() * cakeEmojis.length)],
        isSpecial: false
      });
    }
    setCakes(initialCakes);

    // Initialize ghosts
    const initialGhosts: Ghost[] = [];
    const ghostStartPositions = [
      { x: 15, y: 15 },
      { x: 85, y: 15 },
      { x: 50, y: 85 }
    ];
    
    for (let i = 0; i < 3; i++) {
      const pos = ghostStartPositions[i] || findValidPosition();
      initialGhosts.push({
        id: ghostIdRef.current++,
        x: pos.x,
        y: pos.y,
        color: ghostColors[i],
        direction: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
        scared: false,
        mode: 'random',
        modeTimer: Math.floor(Math.random() * 100) + 50,
        stuckCounter: 0
      });
    }
    setGhosts(initialGhosts);
  }, []);

  // Pacman mouth animation
  useEffect(() => {
    const interval = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, isEating ? 100 : 200);
    return () => clearInterval(interval);
  }, [isEating]);

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

  // Spawn new cakes
  useEffect(() => {
    const spawnCake = () => {
      if (cakes.length < 10) {
        const isSpecial = Math.random() < 0.1;
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

    const interval = setInterval(spawnCake, 2000);
    return () => clearInterval(interval);
  }, [cakes.length]);

  // Ghost movement with improved AI
  useEffect(() => {
    const moveGhosts = () => {
      setGhosts(prev => prev.map(ghost => {
        let newX = ghost.x;
        let newY = ghost.y;
        let newDirection = { ...ghost.direction };
        let newMode = ghost.mode;
        let newModeTimer = ghost.modeTimer - 1;
        let newStuckCounter = ghost.stuckCounter;

        // Update mode based on timer
        if (newModeTimer <= 0) {
          if (ghost.scared) {
            newMode = 'flee';
            newModeTimer = 100;
          } else {
            // 25% chance to chase, 75% random
            newMode = Math.random() < 0.25 ? 'chase' : 'random';
            newModeTimer = newMode === 'chase' ? 80 + Math.random() * 60 : 100 + Math.random() * 100;
          }
        }

        // Get available directions
        const availableDirections = getAvailableDirections(ghost.x, ghost.y, 3);
        
        // If stuck or need new direction
        if (availableDirections.length > 0 && (newStuckCounter > 10 || Math.random() < 0.1)) {
          const randomDir = availableDirections[Math.floor(Math.random() * availableDirections.length)];
          newDirection = randomDir;
          newStuckCounter = 0;
        }

        // Calculate movement based on mode
        const baseSpeed = ghost.scared ? 0.3 : 0.6;
        
        if (newMode === 'chase' && !ghost.scared) {
          // Chase Pacman with pathfinding
          const dx = pacmanPosition.x - ghost.x;
          const dy = pacmanPosition.y - ghost.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 5 && distance < 40) {
            // Find best direction towards Pacman
            let bestDir = newDirection;
            let bestScore = Infinity;
            
            for (const dir of availableDirections) {
              const futureX = ghost.x + dir.x * 5;
              const futureY = ghost.y + dir.y * 5;
              const futureDist = Math.sqrt(
                Math.pow(pacmanPosition.x - futureX, 2) + 
                Math.pow(pacmanPosition.y - futureY, 2)
              );
              
              if (futureDist < bestScore) {
                bestScore = futureDist;
                bestDir = dir;
              }
            }
            
            newDirection = {
              x: newDirection.x * 0.7 + bestDir.x * 0.3,
              y: newDirection.y * 0.7 + bestDir.y * 0.3
            };
          }
        } else if (newMode === 'flee' || ghost.scared) {
          // Flee from Pacman
          const dx = ghost.x - pacmanPosition.x;
          const dy = ghost.y - pacmanPosition.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 30 && availableDirections.length > 0) {
            // Find direction away from Pacman
            let bestDir = newDirection;
            let bestScore = 0;
            
            for (const dir of availableDirections) {
              const futureX = ghost.x + dir.x * 5;
              const futureY = ghost.y + dir.y * 5;
              const futureDist = Math.sqrt(
                Math.pow(pacmanPosition.x - futureX, 2) + 
                Math.pow(pacmanPosition.y - futureY, 2)
              );
              
              if (futureDist > bestScore) {
                bestScore = futureDist;
                bestDir = dir;
              }
            }
            
            newDirection = bestDir;
          }
        }

        // Apply movement
        const speed = baseSpeed * (1 + Math.random() * 0.2);
        const testX = ghost.x + newDirection.x * speed;
        const testY = ghost.y + newDirection.y * speed;

        // Move if no collision
        const oldX = newX;
        const oldY = newY;
        
        if (!checkWallCollision(testX, testY, 2) && testX > 5 && testX < 95 && testY > 5 && testY < 95) {
          newX = testX;
          newY = testY;
        } else {
          // Hit a wall, pick a new direction
          newStuckCounter++;
          if (availableDirections.length > 0) {
            const randomDir = availableDirections[Math.floor(Math.random() * availableDirections.length)];
            newDirection = randomDir;
          }
        }

        // Check if ghost is stuck
        if (Math.abs(oldX - newX) < 0.1 && Math.abs(oldY - newY) < 0.1) {
          newStuckCounter++;
        } else {
          newStuckCounter = 0;
        }

        return {
          ...ghost,
          x: newX,
          y: newY,
          direction: newDirection,
          mode: newMode,
          modeTimer: newModeTimer,
          stuckCounter: newStuckCounter
        };
      }));
    };

    const interval = setInterval(moveGhosts, 50);
    return () => clearInterval(interval);
  }, [pacmanPosition]);

  // Improved Pacman movement with pathfinding
  useEffect(() => {
    const movePacman = () => {
      setPacmanPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        // Check if Pacman is stuck
        if (Math.abs(prev.x - lastPacmanPos.current.x) < 0.1 && 
            Math.abs(prev.y - lastPacmanPos.current.y) < 0.1) {
          setPacmanStuckCounter(c => c + 1);
        } else {
          setPacmanStuckCounter(0);
        }
        
        lastPacmanPos.current = { x: prev.x, y: prev.y };
        
        // Get available directions
        const availableDirections = getAvailableDirections(prev.x, prev.y, 3);
        
        // If stuck, pick a new random direction
        if (pacmanStuckCounter > 10 && availableDirections.length > 0) {
          const randomDir = availableDirections[Math.floor(Math.random() * availableDirections.length)];
          setPacmanDirection(randomDir);
          setPacmanStuckCounter(0);
        }
        
        // Find targets
        const targets: any[] = cakes.map(c => ({ ...c, type: 'cake' }));
        if (powerMode) {
          ghosts.filter(g => g.scared).forEach(g => {
            targets.push({ x: g.x, y: g.y, isGhost: true, type: 'ghost' });
          });
        }

        // Find nearest target
        let targetDir = null;
        if (targets.length > 0) {
          const nearest = targets.reduce((nearest, target) => {
            const distance = Math.sqrt(Math.pow(target.x - prev.x, 2) + Math.pow(target.y - prev.y, 2));
            const priority = target.isSpecial ? distance * 0.5 : target.isGhost ? distance * 0.7 : distance;
            return priority < nearest.distance ? { target, distance: priority } : nearest;
          }, { target: null, distance: Infinity });

          if (nearest.target && nearest.distance < 50) {
            // Use pathfinding to reach target
            let bestDir = pacmanDirection;
            let bestScore = Infinity;
            
            for (const dir of availableDirections) {
              const futureX = prev.x + dir.x * 5;
              const futureY = prev.y + dir.y * 5;
              const futureDist = Math.sqrt(
                Math.pow(nearest.target.x - futureX, 2) + 
                Math.pow(nearest.target.y - futureY, 2)
              );
              
              if (futureDist < bestScore) {
                bestScore = futureDist;
                bestDir = dir;
              }
            }
            
            targetDir = bestDir;
          }
        }

        // Avoid non-scared ghosts
        const dangerGhosts = ghosts.filter(g => !g.scared);
        let avoidDir = null;
        
        for (const ghost of dangerGhosts) {
          const distance = Math.sqrt(Math.pow(ghost.x - prev.x, 2) + Math.pow(ghost.y - prev.y, 2));
          
          if (distance < 20) {
            // Find direction away from ghost
            let bestDir = pacmanDirection;
            let bestScore = 0;
            
            for (const dir of availableDirections) {
              const futureX = prev.x + dir.x * 5;
              const futureY = prev.y + dir.y * 5;
              const futureDist = Math.sqrt(
                Math.pow(ghost.x - futureX, 2) + 
                Math.pow(ghost.y - futureY, 2)
              );
              
              if (futureDist > bestScore) {
                bestScore = futureDist;
                bestDir = dir;
              }
            }
            
            avoidDir = bestDir;
            break;
          }
        }

        // Choose direction priority: avoid danger > reach target > current direction
        let chosenDir = pacmanDirection;
        if (avoidDir && !powerMode) {
          chosenDir = avoidDir;
        } else if (targetDir) {
          chosenDir = targetDir;
        }
        
        // Smooth direction change
        setPacmanDirection(dir => ({
          x: dir.x * 0.6 + chosenDir.x * 0.4,
          y: dir.y * 0.6 + chosenDir.y * 0.4
        }));

        // Apply movement
        const speed = powerMode ? 1.5 : 1.2;
        const testX = prev.x + pacmanDirection.x * speed;
        const testY = prev.y + pacmanDirection.y * speed;

        // Check collision before moving
        if (!checkWallCollision(testX, testY, 3) && testX > 5 && testX < 95 && testY > 5 && testY < 95) {
          newX = testX;
          newY = testY;
        } else {
          // Hit a wall, try to slide along it
          if (!checkWallCollision(testX, prev.y, 3) && testX > 5 && testX < 95) {
            newX = testX;
          } else if (!checkWallCollision(prev.x, testY, 3) && testY > 5 && testY < 95) {
            newY = testY;
          } else {
            // Can't move, pick new direction
            if (availableDirections.length > 0) {
              const randomDir = availableDirections[Math.floor(Math.random() * availableDirections.length)];
              setPacmanDirection(randomDir);
            }
          }
        }

        return { x: newX, y: newY };
      });
    };

    const interval = setInterval(movePacman, 40);
    return () => clearInterval(interval);
  }, [pacmanDirection, cakes, ghosts, powerMode, pacmanStuckCounter]);

  // Collision detection for cakes
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
            setPowerTimeLeft(8);
            setGhosts(prev => prev.map(ghost => ({ ...ghost, scared: true, mode: 'flee', modeTimer: 100 })));
          } else {
            setScore(prev => prev + 10);
          }
          setIsEating(true);
          setTimeout(() => setIsEating(false), 200);
          return false;
        }
        return true;
      });
      
      return remainingCakes;
    });
  }, [pacmanPosition]);

  // Collision detection for ghosts
  useEffect(() => {
    if (powerMode) {
      setGhosts(prevGhosts => {
        const remainingGhosts = prevGhosts.filter(ghost => {
          const distance = Math.sqrt(
            Math.pow(ghost.x - pacmanPosition.x, 2) + 
            Math.pow(ghost.y - pacmanPosition.y, 2)
          );
          
          if (distance < 5 && ghost.scared) {
            setScore(prev => prev + 100);
            setIsEating(true);
            setTimeout(() => setIsEating(false), 200);
            
            // Respawn ghost
            setTimeout(() => {
              const pos = findValidPosition();
              setGhosts(prev => [...prev, {
                id: ghostIdRef.current++,
                x: pos.x,
                y: pos.y,
                color: ghost.color,
                direction: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
                scared: powerMode,
                mode: 'random',
                modeTimer: 100,
                stuckCounter: 0
              }]);
            }, 3000);
            
            return false;
          }
          return true;
        });
        
        return remainingGhosts;
      });
    }
  }, [pacmanPosition, powerMode]);

  // Auto-increment score
  useEffect(() => {
    const interval = setInterval(() => {
      setScore(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Messages every 200 points
  useEffect(() => {
    if (score > 0 && score % 200 === 0 && score !== lastMessageScore) {
      const randomIndex = Math.floor(Math.random() * messages.length);
      setCurrentMessage(messages[randomIndex]);
      setShowMessage(true);
      setLastMessageScore(score);
      
      const timeout = setTimeout(() => {
        setShowMessage(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [score, lastMessageScore]);

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
      className="min-h-screen w-full bg-gradient-to-br from-cream-white via-caramel-beige to-mint-green/20 relative overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-5" 
        style={{
          backgroundImage: 'radial-gradient(circle at 20px 20px, #D97706 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Power mode indicator */}
      {powerMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-5">
          <div className="text-6xl font-bold text-golden-orange opacity-20 animate-pulse">
            POWER MODE: {powerTimeLeft}s
          </div>
        </div>
      )}

      {/* Walls */}
      {walls.map((wall, index) => (
        <div
          key={index}
          className="absolute bg-chocolate-brown rounded shadow-lg"
          style={{
            left: `${wall.x}%`,
            top: `${wall.y}%`,
            width: `${wall.width}%`,
            height: `${wall.height}%`,
            opacity: 0.8,
            background: 'linear-gradient(135deg, #4B2E2E 0%, #3A2323 100%)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
          }}
        />
      ))}

      {/* Pacman */}
      <div
        className={`absolute transition-all duration-75 ${
          isEating ? 'scale-110' : 'scale-100'
        } ${powerMode ? 'drop-shadow-[0_0_20px_rgba(249,160,63,0.8)]' : ''}`}
        style={{
          left: `${pacmanPosition.x}%`,
          top: `${pacmanPosition.y}%`,
          transform: `translate(-50%, -50%) rotate(${getRotation()}deg)`,
          zIndex: 15
        }}
      >
        <div 
          className={`w-14 h-14 ${
            powerMode 
              ? 'bg-gradient-to-br from-golden-orange via-deep-amber to-golden-orange' 
              : 'bg-gradient-to-br from-golden-orange to-deep-amber'
          } rounded-full relative shadow-lg transition-all duration-300`}
          style={{
            clipPath: mouthOpen 
              ? 'polygon(100% 74%, 44% 48%, 100% 21%, 100% 0%, 0% 0%, 0% 100%, 100% 100%)'
              : 'circle(50%)',
            boxShadow: powerMode ? '0 0 30px rgba(249, 160, 63, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="absolute w-2.5 h-2.5 bg-chocolate-brown rounded-full top-3 left-3">
            <div className="absolute w-0.5 h-0.5 bg-cream-white rounded-full top-0.5 left-0.5"></div>
          </div>
        </div>
      </div>

      {/* Ghosts */}
      {ghosts.map((ghost) => (
        <div
          key={ghost.id}
          className={`absolute text-3xl transition-all duration-300 ${
            ghost.scared ? 'animate-pulse' : ''
          }`}
          style={{
            left: `${ghost.x}%`,
            top: `${ghost.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 12,
            filter: ghost.scared ? 'saturate(0.3) brightness(1.5)' : 'none',
            opacity: ghost.scared ? 0.7 : 1
          }}
        >
          <div className="relative">
            <div 
              className="text-4xl"
              style={{ 
                color: ghost.scared ? '#4A5568' : ghost.color,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              👻
            </div>
            {ghost.scared && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                😱
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Cakes */}
      {cakes.map((cake) => (
        <div
          key={cake.id}
          className={`absolute text-3xl transition-all duration-300 ${
            cake.isSpecial ? 'animate-pulse scale-125' : ''
          }`}
          style={{
            left: `${cake.x}%`,
            top: `${cake.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            animation: cake.isSpecial 
              ? 'pulse 1s ease-in-out infinite' 
              : 'gentle-float 3s ease-in-out infinite',
            filter: cake.isSpecial 
              ? 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))' 
              : 'drop-shadow(0 2px 8px rgba(217, 119, 6, 0.2))'
          }}
        >
          {cake.emoji}
        </div>
      ))}

      {/* Message */}
      {showMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-cream-white bg-opacity-95 rounded-2xl px-10 py-5 shadow-golden animate-fade-in border-2 border-golden-orange/20">
            <div className="text-2xl font-semibold text-chocolate-brown">
              {currentMessage}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes gentle-float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.8;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}