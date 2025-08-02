import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface GameState {
  currentScreen: 'menu' | 'game' | 'gameOver' | 'win';
  night: number;
  time: string;
  timeMinutes: number; // 0-360 (6 hours * 60 minutes)
  power: number; // 0-100
  cameraActive: boolean;
  currentCamera: string;
  leftDoorClosed: boolean;
  rightDoorClosed: boolean;
  leftLightOn: boolean;
  rightLightOn: boolean;
  isGameRunning: boolean;
}

interface Animatronic {
  name: string;
  location: string;
  moveTimer: number;
  aggressiveness: number;
  isMoving: boolean;
  lastMoveTime: number;
}

interface CameraLocation {
  id: string;
  name: string;
  description: string;
  hasAnimatronic: boolean;
  animatronicName?: string;
}

const CAMERAS: CameraLocation[] = [
  { id: 'show-stage', name: 'Show Stage', description: 'Главная сцена', hasAnimatronic: false },
  { id: 'dining-area', name: 'Dining Area', description: 'Обеденная зона', hasAnimatronic: false },
  { id: 'pirate-cove', name: 'Pirate Cove', description: 'Пиратская бухта', hasAnimatronic: false },
  { id: 'backstage', name: 'Backstage', description: 'За кулисами', hasAnimatronic: false },
  { id: 'supply-closet', name: 'Supply Closet', description: 'Кладовка', hasAnimatronic: false },
  { id: 'east-hall', name: 'East Hall', description: 'Восточный коридор', hasAnimatronic: false },
  { id: 'west-hall', name: 'West Hall', description: 'Западный коридор', hasAnimatronic: false },
  { id: 'east-hall-corner', name: 'East Hall Corner', description: 'Угол восточного коридора', hasAnimatronic: false },
  { id: 'west-hall-corner', name: 'West Hall Corner', description: 'Угол западного коридора', hasAnimatronic: false },
];

const ANIMATRONICS_NAMES = ['Freddy', 'Bonnie', 'Chica', 'Foxy'];

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentScreen: 'menu',
    night: 1,
    time: '12:00 AM',
    timeMinutes: 0,
    power: 100,
    cameraActive: false,
    currentCamera: 'show-stage',
    leftDoorClosed: false,
    rightDoorClosed: false,
    leftLightOn: false,
    rightLightOn: false,
    isGameRunning: false
  });

  const [cameras, setCameras] = useState<CameraLocation[]>(CAMERAS);
  const [animatronics, setAnimatronics] = useState<Animatronic[]>([
    { name: 'Freddy', location: 'show-stage', moveTimer: 0, aggressiveness: 1, isMoving: false, lastMoveTime: 0 },
    { name: 'Bonnie', location: 'show-stage', moveTimer: 0, aggressiveness: 2, isMoving: false, lastMoveTime: 0 },
    { name: 'Chica', location: 'show-stage', moveTimer: 0, aggressiveness: 1.5, isMoving: false, lastMoveTime: 0 },
    { name: 'Foxy', location: 'pirate-cove', moveTimer: 0, aggressiveness: 3, isMoving: false, lastMoveTime: 0 }
  ]);

  const gameLoopRef = useRef<NodeJS.Timeout>();
  const powerDrainRef = useRef<NodeJS.Timeout>();

  const playSound = useCallback((type: 'click' | 'door' | 'camera' | 'light' | 'footstep' | 'jumpscare' | 'static') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const soundConfig = {
      click: { freq: 800, duration: 0.1, volume: 0.1 },
      door: { freq: 200, duration: 0.3, volume: 0.15 },
      camera: { freq: 600, duration: 0.2, volume: 0.1 },
      light: { freq: 1000, duration: 0.15, volume: 0.08 },
      footstep: { freq: 150, duration: 0.2, volume: 0.12 },
      jumpscare: { freq: 100, duration: 1, volume: 0.3 },
      static: { freq: 400, duration: 0.5, volume: 0.05 }
    };
    
    const config = soundConfig[type];
    oscillator.frequency.setValueAtTime(config.freq, audioContext.currentTime);
    gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration);
  }, []);

  const formatTime = (minutes: number): string => {
    const totalMinutes = minutes + 0; // Start at 12:00 AM
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${displayHour}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const moveAnimatronic = useCallback((animatronic: Animatronic) => {
    const possibleMoves = ['show-stage', 'dining-area', 'backstage', 'supply-closet', 'east-hall', 'west-hall', 'east-hall-corner', 'west-hall-corner'];
    const currentIndex = possibleMoves.indexOf(animatronic.location);
    
    // Special movement patterns
    if (animatronic.name === 'Foxy') {
      const foxyMoves = ['pirate-cove', 'west-hall', 'west-hall-corner'];
      const newLocation = foxyMoves[Math.floor(Math.random() * foxyMoves.length)];
      return newLocation;
    }
    
    // Random movement for others
    const availableMoves = possibleMoves.filter(loc => loc !== animatronic.location);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }, []);

  const checkGameOver = useCallback(() => {
    // Check if any animatronic reached the office doors
    const leftThreat = animatronics.some(a => a.location === 'west-hall-corner' && !gameState.leftDoorClosed);
    const rightThreat = animatronics.some(a => a.location === 'east-hall-corner' && !gameState.rightDoorClosed);
    
    if ((leftThreat || rightThreat) && Math.random() < 0.3) {
      playSound('jumpscare');
      setGameState(prev => ({ ...prev, currentScreen: 'gameOver', isGameRunning: false }));
      return true;
    }
    return false;
  }, [animatronics, gameState.leftDoorClosed, gameState.rightDoorClosed, playSound]);

  const updateAnimatronics = useCallback(() => {
    if (!gameState.isGameRunning) return;
    
    setAnimatronics(prev => prev.map(animatronic => {
      const currentTime = Date.now();
      const timeSinceLastMove = currentTime - animatronic.lastMoveTime;
      
      // Calculate move probability based on aggressiveness and night
      const moveChance = (animatronic.aggressiveness * gameState.night * 0.001) + (gameState.timeMinutes * 0.0001);
      
      if (timeSinceLastMove > 5000 && Math.random() < moveChance) {
        const newLocation = moveAnimatronic(animatronic);
        playSound('footstep');
        
        return {
          ...animatronic,
          location: newLocation,
          lastMoveTime: currentTime,
          isMoving: true
        };
      }
      
      return { ...animatronic, isMoving: false };
    }));
  }, [gameState.isGameRunning, gameState.night, gameState.timeMinutes, moveAnimatronic, playSound]);

  const updateCameras = useCallback(() => {
    setCameras(prev => prev.map(camera => {
      const animatronicsHere = animatronics.filter(a => a.location === camera.id);
      return {
        ...camera,
        hasAnimatronic: animatronicsHere.length > 0,
        animatronicName: animatronicsHere[0]?.name
      };
    }));
  }, [animatronics]);

  const drainPower = useCallback(() => {
    if (!gameState.isGameRunning) return;
    
    let powerUsage = 1; // Base usage
    if (gameState.cameraActive) powerUsage += 1;
    if (gameState.leftDoorClosed) powerUsage += 2;
    if (gameState.rightDoorClosed) powerUsage += 2;
    if (gameState.leftLightOn) powerUsage += 1;
    if (gameState.rightLightOn) powerUsage += 1;
    
    setGameState(prev => {
      const newPower = Math.max(0, prev.power - powerUsage);
      if (newPower === 0) {
        // Power out - all systems shut down
        return {
          ...prev,
          power: 0,
          cameraActive: false,
          leftDoorClosed: false,
          rightDoorClosed: false,
          leftLightOn: false,
          rightLightOn: false
        };
      }
      return { ...prev, power: newPower };
    });
  }, [gameState.isGameRunning, gameState.cameraActive, gameState.leftDoorClosed, gameState.rightDoorClosed, gameState.leftLightOn, gameState.rightLightOn]);

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      currentScreen: 'game',
      isGameRunning: true,
      time: '12:00 AM',
      timeMinutes: 0,
      power: 100,
      cameraActive: false,
      leftDoorClosed: false,
      rightDoorClosed: false,
      leftLightOn: false,
      rightLightOn: false
    }));
    
    setAnimatronics([
      { name: 'Freddy', location: 'show-stage', moveTimer: 0, aggressiveness: 1, isMoving: false, lastMoveTime: Date.now() },
      { name: 'Bonnie', location: 'show-stage', moveTimer: 0, aggressiveness: 2, isMoving: false, lastMoveTime: Date.now() },
      { name: 'Chica', location: 'show-stage', moveTimer: 0, aggressiveness: 1.5, isMoving: false, lastMoveTime: Date.now() },
      { name: 'Foxy', location: 'pirate-cove', moveTimer: 0, aggressiveness: 3, isMoving: false, lastMoveTime: Date.now() }
    ]);
  };

  // Game loop
  useEffect(() => {
    if (gameState.isGameRunning) {
      gameLoopRef.current = setInterval(() => {
        setGameState(prev => {
          const newTimeMinutes = prev.timeMinutes + 1;
          const newTime = formatTime(newTimeMinutes);
          
          // Check if night is over (6:00 AM = 360 minutes)
          if (newTimeMinutes >= 360) {
            return {
              ...prev,
              currentScreen: 'win',
              isGameRunning: false,
              time: '6:00 AM',
              timeMinutes: 360
            };
          }
          
          return {
            ...prev,
            timeMinutes: newTimeMinutes,
            time: newTime
          };
        });
      }, 100); // Fast time progression for demo

      powerDrainRef.current = setInterval(drainPower, 1000);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (powerDrainRef.current) clearInterval(powerDrainRef.current);
    };
  }, [gameState.isGameRunning, drainPower]);

  // Update animatronics
  useEffect(() => {
    const animatronicUpdate = setInterval(updateAnimatronics, 1000);
    return () => clearInterval(animatronicUpdate);
  }, [updateAnimatronics]);

  // Update cameras
  useEffect(() => {
    updateCameras();
  }, [updateCameras]);

  // Check game over
  useEffect(() => {
    if (gameState.isGameRunning) {
      const checkInterval = setInterval(checkGameOver, 1000);
      return () => clearInterval(checkInterval);
    }
  }, [checkGameOver, gameState.isGameRunning]);

  const MenuScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-fnaf-dark to-fnaf-office flex flex-col items-center justify-center p-8" style={{ perspective: '1000px' }}>
      <div className="text-center mb-12 animate-fade-in transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
        <h1 className="text-6xl font-bold text-fnaf-danger mb-4 animate-float-3d" style={{ 
          fontFamily: 'monospace',
          textShadow: '3px 3px 0px #000',
          letterSpacing: '2px',
          transform: 'translateZ(50px)'
        }}>
          FIVE NIGHTS
        </h1>
        <h2 className="text-4xl font-bold text-fnaf-warning mb-4 animate-rotate-3d" style={{ 
          fontFamily: 'monospace',
          textShadow: '2px 2px 0px #000',
          transform: 'translateZ(30px)'
        }}>
          AT FREDDY'S
        </h2>
        <p className="text-xl text-white/90 font-bold" style={{ textShadow: '1px 1px 0px #000' }}>
          Ночь {gameState.night}
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        <Button
          onClick={() => {
            playSound('click');
            startGame();
          }}
          className="w-full h-16 text-xl font-bold bg-fnaf-danger hover:bg-fnaf-danger/80 border-2 border-red-800 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
          style={{ 
            fontFamily: 'monospace',
            textShadow: '2px 2px 0px #000'
          }}
        >
          <Icon name="Play" size={24} className="mr-3" />
          НАЧАТЬ НОЧЬ
        </Button>
        
        <Button
          onClick={() => playSound('click')}
          className="w-full h-12 text-lg font-bold bg-fnaf-camera hover:bg-fnaf-camera/80 border-2 border-gray-600 text-white"
          style={{ fontFamily: 'monospace' }}
        >
          <Icon name="Settings" size={20} className="mr-2" />
          Настройки
        </Button>
      </div>
    </div>
  );

  const GameScreen = () => (
    <div className="min-h-screen bg-fnaf-office flex flex-col relative overflow-hidden" style={{ perspective: '1500px' }}>
      {/* Status Bar */}
      <div className="bg-fnaf-dark/90 text-white p-3 flex justify-between items-center border-b border-gray-600">
        <div className="flex items-center space-x-6">
          <div className="text-lg font-bold text-fnaf-warning">{gameState.time}</div>
          <div className="text-lg font-bold">Ночь {gameState.night}</div>
          <div className={`text-lg font-bold ${gameState.power < 20 ? 'text-fnaf-danger animate-pulse' : 'text-fnaf-safe'}`}>
            Энергия: {gameState.power}%
          </div>
        </div>
        
        <Button 
          onClick={() => setGameState(prev => ({ ...prev, currentScreen: 'menu', isGameRunning: false }))}
          className="bg-fnaf-danger hover:bg-fnaf-danger/80 text-sm"
        >
          <Icon name="X" size={16} className="mr-1" />
          Выход
        </Button>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex">
        {/* Office View / Camera System */}
        <div className="flex-1 relative">
          {!gameState.cameraActive ? (
            // Office View
            <div className="h-full bg-gradient-to-b from-fnaf-office to-fnaf-dark flex items-center justify-center relative transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4 animate-float-3d" style={{ fontFamily: 'monospace', transform: 'translateZ(50px)' }}>
                  ОФИС ОХРАННИКА
                </h2>
                <p className="text-white/70 mb-8">Используйте камеры для наблюдения</p>
                
                {/* Door Controls */}
                <div className="flex justify-center space-x-8 mt-8" style={{ transform: 'translateZ(30px)' }}>
                  <div className="text-center transform transition-all duration-300 hover:scale-110" style={{ transform: 'rotateY(-10deg) translateZ(20px)' }}>
                    <h3 className="text-white font-bold mb-2">ЛЕВАЯ ДВЕРЬ</h3>
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          if (gameState.power > 0) {
                            playSound('light');
                            setGameState(prev => ({ ...prev, leftLightOn: !prev.leftLightOn }));
                          }
                        }}
                        className={`w-20 h-12 ${gameState.leftLightOn ? 'bg-fnaf-warning' : 'bg-fnaf-camera'} hover:opacity-80 transform transition-all duration-200 hover:scale-110 hover:-rotate-3`}
                        style={{ boxShadow: gameState.leftLightOn ? '0 0 20px rgba(255, 255, 136, 0.5)' : 'none' }}
                        disabled={gameState.power === 0}
                      >
                        <Icon name="Lightbulb" size={16} />
                      </Button>
                      <Button
                        onClick={() => {
                          if (gameState.power > 0) {
                            playSound('door');
                            setGameState(prev => ({ ...prev, leftDoorClosed: !prev.leftDoorClosed }));
                          }
                        }}
                        className={`w-20 h-12 ${gameState.leftDoorClosed ? 'bg-fnaf-danger' : 'bg-fnaf-safe'} hover:opacity-80`}
                        disabled={gameState.power === 0}
                      >
                        <Icon name="DoorClosed" size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-white font-bold mb-2">ПРАВАЯ ДВЕРЬ</h3>
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          if (gameState.power > 0) {
                            playSound('light');
                            setGameState(prev => ({ ...prev, rightLightOn: !prev.rightLightOn }));
                          }
                        }}
                        className={`w-20 h-12 ${gameState.rightLightOn ? 'bg-fnaf-warning' : 'bg-fnaf-camera'} hover:opacity-80`}
                        disabled={gameState.power === 0}
                      >
                        <Icon name="Lightbulb" size={16} />
                      </Button>
                      <Button
                        onClick={() => {
                          if (gameState.power > 0) {
                            playSound('door');
                            setGameState(prev => ({ ...prev, rightDoorClosed: !prev.rightDoorClosed }));
                          }
                        }}
                        className={`w-20 h-12 ${gameState.rightDoorClosed ? 'bg-fnaf-danger' : 'bg-fnaf-safe'} hover:opacity-80`}
                        disabled={gameState.power === 0}
                      >
                        <Icon name="DoorClosed" size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Light Effects */}
                {gameState.leftLightOn && (
                  <div className="absolute left-0 top-1/2 w-32 h-32 bg-fnaf-light/30 rounded-full blur-xl"></div>
                )}
                {gameState.rightLightOn && (
                  <div className="absolute right-0 top-1/2 w-32 h-32 bg-fnaf-light/30 rounded-full blur-xl"></div>
                )}
              </div>
            </div>
          ) : (
            // Camera View
            <div className="h-full bg-fnaf-camera relative transform-gpu animate-zoom-3d" style={{ transformStyle: 'preserve-3d' }}>
              <div className="p-4">
                <div className="bg-fnaf-dark/80 p-4 rounded border border-fnaf-static transform" style={{ transform: 'translateZ(20px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-fnaf-safe font-bold text-xl animate-float-3d" style={{ fontFamily: 'monospace', transform: 'translateZ(10px)' }}>
                      CAM - {cameras.find(c => c.id === gameState.currentCamera)?.name}
                    </h2>
                    <div className="text-fnaf-static text-sm animate-pulse transform" style={{ transform: 'translateZ(5px)' }}>●REC</div>
                  </div>
                  
                  {/* Camera Feed */}
                  <div className="bg-fnaf-dark h-64 flex items-center justify-center border border-fnaf-static relative overflow-hidden transform" style={{ transform: 'translateZ(10px)', perspective: '500px' }}>
                    {/* Static effect */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="w-full h-full bg-gradient-to-r from-transparent via-fnaf-static to-transparent animate-pulse"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fnaf-static/10 to-transparent animate-float-3d"></div>
                    </div>
                    
                    <div className="text-center z-10">
                      <h3 className="text-white text-lg mb-2">
                        {cameras.find(c => c.id === gameState.currentCamera)?.description}
                      </h3>
                      
                      {cameras.find(c => c.id === gameState.currentCamera)?.hasAnimatronic ? (
                        <div className="text-fnaf-danger text-2xl font-bold animate-pulse">
                          ⚠️ {cameras.find(c => c.id === gameState.currentCamera)?.animatronicName} ОБНАРУЖЕН ⚠️
                        </div>
                      ) : (
                        <div className="text-fnaf-safe">Зона чиста</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Camera Panel */}
        <div className="w-80 bg-fnaf-dark border-l border-gray-600 p-4">
          <div className="mb-4">
            <Button
              onClick={() => {
                if (gameState.power > 0) {
                  playSound('camera');
                  setGameState(prev => ({ ...prev, cameraActive: !prev.cameraActive }));
                }
              }}
              className={`w-full h-12 ${gameState.cameraActive ? 'bg-fnaf-safe' : 'bg-fnaf-camera'} hover:opacity-80 font-bold`}
              disabled={gameState.power === 0}
            >
              <Icon name="Camera" size={20} className="mr-2" />
              {gameState.cameraActive ? 'ЗАКРЫТЬ КАМЕРЫ' : 'ОТКРЫТЬ КАМЕРЫ'}
            </Button>
          </div>
          
          {gameState.cameraActive && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cameras.map(camera => (
                <Button
                  key={camera.id}
                  onClick={() => {
                    playSound('static');
                    setGameState(prev => ({ ...prev, currentCamera: camera.id }));
                  }}
                  className={`w-full text-left p-3 ${
                    gameState.currentCamera === camera.id 
                      ? 'bg-fnaf-safe text-black' 
                      : camera.hasAnimatronic
                        ? 'bg-fnaf-danger/80 text-white'
                        : 'bg-fnaf-camera text-white'
                  } hover:opacity-80 transition-all duration-200`}
                  style={{ fontFamily: 'monospace' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">{camera.name}</span>
                    {camera.hasAnimatronic && (
                      <Icon name="AlertTriangle" size={16} className="text-fnaf-warning" />
                    )}
                  </div>
                  <div className="text-xs opacity-70">{camera.description}</div>
                </Button>
              ))}
            </div>
          )}
          
          {/* Animatronic Status */}
          <div className="mt-6 p-3 bg-fnaf-office rounded border border-gray-600">
            <h3 className="text-white font-bold mb-2">СТАТУС УГРОЗ</h3>
            <div className="space-y-1 text-sm">
              {animatronics.map(animatronic => (
                <div key={animatronic.name} className="flex justify-between">
                  <span className="text-white">{animatronic.name}:</span>
                  <span className={animatronic.location.includes('corner') ? 'text-fnaf-danger' : 'text-fnaf-safe'}>
                    {animatronic.location}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const GameOverScreen = () => (
    <div className="min-h-screen bg-fnaf-danger/20 flex flex-col items-center justify-center p-8">
      <div className="text-center animate-fade-in">
        <h1 className="text-8xl font-bold text-fnaf-danger mb-8 animate-pulse" style={{ 
          fontFamily: 'monospace',
          textShadow: '4px 4px 0px #000'
        }}>
          GAME OVER
        </h1>
        <p className="text-3xl text-white mb-8" style={{ textShadow: '2px 2px 0px #000' }}>
          Аниматроник добрался до вас...
        </p>
        <Button
          onClick={() => setGameState(prev => ({ ...prev, currentScreen: 'menu' }))}
          className="bg-fnaf-danger hover:bg-fnaf-danger/80 text-xl px-8 py-4"
        >
          <Icon name="RotateCcw" size={24} className="mr-2" />
          Попробовать снова
        </Button>
      </div>
    </div>
  );

  const WinScreen = () => (
    <div className="min-h-screen bg-fnaf-safe/20 flex flex-col items-center justify-center p-8">
      <div className="text-center animate-fade-in">
        <h1 className="text-8xl font-bold text-fnaf-safe mb-8" style={{ 
          fontFamily: 'monospace',
          textShadow: '4px 4px 0px #000'
        }}>
          6:00 AM
        </h1>
        <p className="text-3xl text-white mb-8" style={{ textShadow: '2px 2px 0px #000' }}>
          Вы выжили ночь {gameState.night}!
        </p>
        <Button
          onClick={() => setGameState(prev => ({ 
            ...prev, 
            currentScreen: 'menu',
            night: prev.night + 1
          }))}
          className="bg-fnaf-safe hover:bg-fnaf-safe/80 text-xl px-8 py-4 text-black"
        >
          <Icon name="ArrowRight" size={24} className="mr-2" />
          Следующая ночь
        </Button>
      </div>
    </div>
  );

  return (
    <div className="select-none">
      {gameState.currentScreen === 'menu' && <MenuScreen />}
      {gameState.currentScreen === 'game' && <GameScreen />}
      {gameState.currentScreen === 'gameOver' && <GameOverScreen />}
      {gameState.currentScreen === 'win' && <WinScreen />}
    </div>
  );
};

export default Index;