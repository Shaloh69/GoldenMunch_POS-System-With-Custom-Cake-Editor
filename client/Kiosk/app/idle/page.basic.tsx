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
  mode: 'random' | 'chase' | 'flee';
  modeTimer: number;
  stuckCounter: number;
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [showStartOverlay, setShowStartOverlay] = useState(true);

  const cakeIdRef = useRef(0);
  const ghostIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastPacmanPos = useRef<Position>({ x: 50, y: 50 });
  const cakeEmojis = ['🎂', '🧁', '🍰', '🍪', '🍩', '🥧'];
  const specialCakeEmoji = '⭐';
  const ghostColors = ['#FF69B4', '#00CED1', '#FF6347', '#98FB98'];

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
            vy: p.vy + 0.2, // gravity
            life: p.life - 0.02
          }))
          .filter(p => p.life > 0 && p.x > 0 && p.x < 100 && p.y > 0 && p.y < 100)
      );
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const findValidPosition = (): Position => {
    return {
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    };
  };

  const getAvailableDirections = (x: number, y: number): Position[] => {
    const directions: Position[] = [];
    const tests = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 0.7, y: 0.7 },
      { x: -0.7, y: 0.7 },
      { x: 0.7, y: -0.7 },
      { x: -0.7, y: -0.7 },
    ];

    for (const dir of tests) {
      const testX = x + dir.x * 5;
      const testY = y + dir.y * 5;

      if (testX > 5 && testX < 95 && testY > 5 && testY < 95) {
        directions.push(dir);
      }
    }

    return directions;
  };

  // Initialize
  useEffect(() => {
    const initialCakes: Cake[] = [];
    for (let i = 0; i < 12; i++) {
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

    const initialGhosts: Ghost[] = [];
    const ghostStartPositions = [
      { x: 15, y: 15 },
      { x: 85, y: 15 },
      { x: 85, y: 85 },
      { x: 15, y: 85 }
    ];

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
        stuckCounter: 0
      });
    }
    setGhosts(initialGhosts);

    // Load high score
    const savedHighScore = localStorage.getItem('pacman_high_score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Mouth animation
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
  }, [cakes.length]);

  // Ghost movement
  useEffect(() => {
    const moveGhosts = () => {
      setGhosts(prev => prev.map(ghost => {
        let newX = ghost.x;
        let newY = ghost.y;
        let newDirection = { ...ghost.direction };
        let newMode = ghost.mode;
        let newModeTimer = ghost.modeTimer - 1;

        if (newModeTimer <= 0) {
          if (ghost.scared) {
            newMode = 'flee';
            newModeTimer = 100;
          } else {
            newMode = Math.random() < 0.3 ? 'chase' : 'random';
            newModeTimer = newMode === 'chase' ? 80 + Math.random() * 60 : 100 + Math.random() * 100;
          }
        }

        const availableDirections = getAvailableDirections(ghost.x, ghost.y);

        if (availableDirections.length > 0 && Math.random() < 0.05) {
          const randomDir = availableDirections[Math.floor(Math.random() * availableDirections.length)];
          newDirection = randomDir;
        }

        const baseSpeed = ghost.scared ? 0.4 : 0.7;

        if (newMode === 'chase' && !ghost.scared) {
          const dx = pacmanPosition.x - ghost.x;
          const dy = pacmanPosition.y - ghost.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 5 && distance < 45) {
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
              x: newDirection.x * 0.6 + bestDir.x * 0.4,
              y: newDirection.y * 0.6 + bestDir.y * 0.4
            };
          }
        } else if (newMode === 'flee' || ghost.scared) {
          const dx = ghost.x - pacmanPosition.x;
          const dy = ghost.y - pacmanPosition.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 35) {
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

        const speed = baseSpeed * (1 + Math.random() * 0.2);
        const testX = ghost.x + newDirection.x * speed;
        const testY = ghost.y + newDirection.y * speed;

        if (testX > 5 && testX < 95 && testY > 5 && testY < 95) {
          newX = testX;
          newY = testY;
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
  }, [pacmanPosition]);

  // Pacman movement
  useEffect(() => {
    const movePacman = () => {
      setPacmanPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (Math.abs(prev.x - lastPacmanPos.current.x) < 0.1 &&
            Math.abs(prev.y - lastPacmanPos.current.y) < 0.1) {
          setPacmanStuckCounter(c => c + 1);
        } else {
          setPacmanStuckCounter(0);
        }

        lastPacmanPos.current = { x: prev.x, y: prev.y };

        const availableDirections = getAvailableDirections(prev.x, prev.y);

        if (pacmanStuckCounter > 10 && availableDirections.length > 0) {
          const randomDir = availableDirections[Math.floor(Math.random() * availableDirections.length)];
          setPacmanDirection(randomDir);
          setPacmanStuckCounter(0);
        }

        const targets: any[] = cakes.map(c => ({ ...c, type: 'cake' }));
        if (powerMode) {
          ghosts.filter(g => g.scared).forEach(g => {
            targets.push({ x: g.x, y: g.y, isGhost: true, type: 'ghost' });
          });
        }

        let targetDir = null;
        if (targets.length > 0) {
          const nearest = targets.reduce((nearest, target) => {
            const distance = Math.sqrt(Math.pow(target.x - prev.x, 2) + Math.pow(target.y - prev.y, 2));
            const priority = target.isSpecial ? distance * 0.4 : target.isGhost ? distance * 0.6 : distance;
            return priority < nearest.distance ? { target, distance: priority } : nearest;
          }, { target: null, distance: Infinity });

          if (nearest.target && nearest.distance < 50) {
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

        const dangerGhosts = ghosts.filter(g => !g.scared);
        let avoidDir = null;

        for (const ghost of dangerGhosts) {
          const distance = Math.sqrt(Math.pow(ghost.x - prev.x, 2) + Math.pow(ghost.y - prev.y, 2));

          if (distance < 25) {
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

        let chosenDir = pacmanDirection;
        if (avoidDir && !powerMode) {
          chosenDir = avoidDir;
        } else if (targetDir) {
          chosenDir = targetDir;
        }

        setPacmanDirection(dir => ({
          x: dir.x * 0.6 + chosenDir.x * 0.4,
          y: dir.y * 0.6 + chosenDir.y * 0.4
        }));

        const speed = powerMode ? 1.6 : 1.3;
        const testX = prev.x + pacmanDirection.x * speed;
        const testY = prev.y + pacmanDirection.y * speed;

        if (testX > 5 && testX < 95 && testY > 5 && testY < 95) {
          newX = testX;
          newY = testY;
        } else {
          if (testX > 5 && testX < 95) {
            newX = testX;
          }
          if (testY > 5 && testY < 95) {
            newY = testY;
          }
        }

        return { x: newX, y: newY };
      });
    };

    const interval = setInterval(movePacman, 35);
    return () => clearInterval(interval);
  }, [pacmanDirection, cakes, ghosts, powerMode, pacmanStuckCounter]);

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

            setTimeout(() => {
              const pos = findValidPosition();
              setGhosts(prev => [...prev, {
                id: ghostIdRef.current++,
                x: pos.x,
                y: pos.y,
                color: ghost.color,
                direction: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
                scared: powerMode,
                mode: 'flee',
                modeTimer: 100,
                stuckCounter: 0
              }]);
            }, 4000);

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
                Kiosk Idle Mode
              </p>
              <div className="text-xl text-chocolate-brown/80 mb-8 space-y-2">
                <p>🎮 Watch Pacman collect delicious treats!</p>
                <p>⭐ Special items activate power mode</p>
                <p>👻 Eat ghosts during power mode for bonus points</p>
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
            {powerMode && (
              <Chip size="lg" variant="shadow" className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold animate-glow">
                ⚡ POWERED UP!
              </Chip>
            )}
          </div>
        </Card>
      </div>

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
          {/* Eye */}
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
