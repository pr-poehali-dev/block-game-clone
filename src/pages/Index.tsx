import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

type BlockType = 'dirt' | 'stone' | 'grass' | 'water' | 'wood' | 'air';

interface Block {
  type: BlockType;
  x: number;
  y: number;
}

interface GameState {
  currentScreen: 'menu' | 'game' | 'inventory' | 'settings' | 'multiplayer' | 'profile';
  selectedBlockType: BlockType;
  world: Block[][];
  inventory: { [key in BlockType]: number };
  playerHealth: number;
  playerHunger: number;
}

const WORLD_WIDTH = 16;
const WORLD_HEIGHT = 12;

const blockColors: Record<BlockType, string> = {
  dirt: '#8B4513',
  stone: '#808080',
  grass: '#228B22',
  water: '#1E90FF',
  wood: '#8B4513',
  air: 'transparent'
};

const blockEmojis: Record<BlockType, string> = {
  dirt: '🟫',
  stone: '⬜',
  grass: '🟩',
  water: '🟦',
  wood: '🟤',
  air: ''
};

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentScreen: 'menu',
    selectedBlockType: 'dirt',
    world: Array(WORLD_HEIGHT).fill(null).map(() => 
      Array(WORLD_WIDTH).fill(null).map((_, x) => ({
        type: 'air' as BlockType,
        x,
        y: 0
      }))
    ),
    inventory: {
      dirt: 64,
      stone: 32,
      grass: 48,
      water: 16,
      wood: 24,
      air: 0
    },
    playerHealth: 20,
    playerHunger: 20
  });

  // Initialize world with some blocks
  useEffect(() => {
    const newWorld = Array(WORLD_HEIGHT).fill(null).map((_, y) => 
      Array(WORLD_WIDTH).fill(null).map((_, x) => {
        if (y >= WORLD_HEIGHT - 3) return { type: 'dirt' as BlockType, x, y };
        if (y >= WORLD_HEIGHT - 1) return { type: 'grass' as BlockType, x, y };
        return { type: 'air' as BlockType, x, y };
      })
    );
    setGameState(prev => ({ ...prev, world: newWorld }));
  }, []);

  const playSound = (soundType: 'place' | 'break' | 'click') => {
    // Simple audio feedback using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (soundType === 'place') {
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    } else if (soundType === 'break') {
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    } else {
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const placeBlock = (x: number, y: number) => {
    if (gameState.inventory[gameState.selectedBlockType] <= 0) return;
    
    const newWorld = [...gameState.world];
    newWorld[y][x] = { type: gameState.selectedBlockType, x, y };
    
    setGameState(prev => ({
      ...prev,
      world: newWorld,
      inventory: {
        ...prev.inventory,
        [prev.selectedBlockType]: prev.inventory[prev.selectedBlockType] - 1
      }
    }));
    
    playSound('place');
  };

  const removeBlock = (x: number, y: number) => {
    const blockType = gameState.world[y][x].type;
    if (blockType === 'air') return;
    
    const newWorld = [...gameState.world];
    newWorld[y][x] = { type: 'air', x, y };
    
    setGameState(prev => ({
      ...prev,
      world: newWorld,
      inventory: {
        ...prev.inventory,
        [blockType]: prev.inventory[blockType] + 1
      }
    }));
    
    playSound('break');
  };

  const handleBlockClick = (x: number, y: number, event: React.MouseEvent) => {
    event.preventDefault();
    if (event.button === 0) { // Left click - place
      placeBlock(x, y);
    } else if (event.button === 2) { // Right click - remove
      removeBlock(x, y);
    }
  };

  const MenuScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-green-400 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-8xl font-bold text-white mb-4 shadow-lg" style={{ 
          fontFamily: 'monospace',
          textShadow: '4px 4px 0px #000',
          letterSpacing: '4px'
        }}>
          MINECRAFT
        </h1>
        <p className="text-2xl text-white/90 font-bold" style={{ textShadow: '2px 2px 0px #000' }}>
          Пиксельный мир приключений
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        {[
          { key: 'game', label: 'Играть', icon: 'Play' },
          { key: 'inventory', label: 'Инвентарь', icon: 'Package' },
          { key: 'settings', label: 'Настройки', icon: 'Settings' },
          { key: 'multiplayer', label: 'Мультиплеер', icon: 'Users' },
          { key: 'profile', label: 'Профиль', icon: 'User' }
        ].map(item => (
          <Button
            key={item.key}
            onClick={() => {
              playSound('click');
              setGameState(prev => ({ ...prev, currentScreen: item.key as any }));
            }}
            className="w-full h-16 text-xl font-bold bg-minecraft-brown hover:bg-minecraft-brown/80 border-4 border-minecraft-black text-white shadow-lg transform hover:scale-105 transition-all duration-200"
            style={{ 
              fontFamily: 'monospace',
              textShadow: '2px 2px 0px #000'
            }}
          >
            <Icon name={item.icon as any} size={24} className="mr-3" />
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );

  const GameScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-blue-500 flex flex-col">
      {/* Game Header */}
      <div className="bg-minecraft-black/80 text-white p-4 flex justify-between items-center">
        <Button 
          onClick={() => setGameState(prev => ({ ...prev, currentScreen: 'menu' }))}
          className="bg-minecraft-brown hover:bg-minecraft-brown/80"
        >
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          Меню
        </Button>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Icon name="Heart" size={20} className="text-red-500" />
            <span>{gameState.playerHealth}/20</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Utensils" size={20} className="text-yellow-500" />
            <span>{gameState.playerHunger}/20</span>
          </div>
        </div>
      </div>

      {/* Game World */}
      <div className="flex-1 p-4 flex justify-center items-center">
        <div 
          className="grid gap-1 bg-minecraft-black/20 p-4 rounded-lg shadow-xl"
          style={{ 
            gridTemplateColumns: `repeat(${WORLD_WIDTH}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${WORLD_HEIGHT}, minmax(0, 1fr))`
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {gameState.world.map((row, y) =>
            row.map((block, x) => (
              <div
                key={`${x}-${y}`}
                className="w-8 h-8 border border-gray-400/50 cursor-pointer hover:ring-2 hover:ring-white/50 transition-all duration-100 animate-block-place"
                style={{ 
                  backgroundColor: blockColors[block.type],
                  backgroundImage: block.type !== 'air' ? 'url("data:image/svg+xml,%3Csvg width=\'32\' height=\'32\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'pixel\' patternUnits=\'userSpaceOnUse\' width=\'2\' height=\'2\'%3E%3Crect width=\'1\' height=\'1\' fill=\'%23000\' opacity=\'0.1\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23pixel)\'/%3E%3C/svg%3E")' : undefined
                }}
                onMouseDown={(e) => handleBlockClick(x, y, e)}
                onContextMenu={(e) => e.preventDefault()}
                title={`${block.type} (${x}, ${y})`}
              >
                {block.type !== 'air' && (
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    {blockEmojis[block.type]}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hotbar/Inventory */}
      <div className="bg-minecraft-black/80 p-4">
        <div className="flex justify-center space-x-2 mb-4">
          {(Object.keys(gameState.inventory) as BlockType[]).filter(type => type !== 'air').map(blockType => (
            <Button
              key={blockType}
              onClick={() => setGameState(prev => ({ ...prev, selectedBlockType: blockType }))}
              className={`w-16 h-16 border-2 ${
                gameState.selectedBlockType === blockType 
                  ? 'border-white bg-white/20' 
                  : 'border-gray-400 bg-minecraft-black/40'
              } hover:bg-white/10 transition-all duration-200`}
              style={{ backgroundColor: blockColors[blockType] }}
            >
              <div className="text-center">
                <div className="text-lg mb-1">{blockEmojis[blockType]}</div>
                <div className="text-xs text-white">{gameState.inventory[blockType]}</div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="text-center text-white/80 text-sm">
          <p>ЛКМ - поставить блок | ПКМ - убрать блок | Выбран: {gameState.selectedBlockType}</p>
        </div>
      </div>
    </div>
  );

  const InventoryScreen = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-600 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
            ИНВЕНТАРЬ
          </h1>
          <Button 
            onClick={() => setGameState(prev => ({ ...prev, currentScreen: 'menu' }))}
            className="bg-minecraft-brown hover:bg-minecraft-brown/80"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>
        </div>
        
        <div className="grid grid-cols-5 gap-4">
          {(Object.entries(gameState.inventory) as [BlockType, number][]).map(([blockType, count]) => (
            <Card key={blockType} className="p-4 bg-minecraft-black/40 border-2 border-gray-400">
              <div className="text-center">
                <div 
                  className="w-16 h-16 mx-auto mb-2 border-2 border-gray-400 rounded"
                  style={{ backgroundColor: blockColors[blockType] }}
                >
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {blockEmojis[blockType]}
                  </div>
                </div>
                <h3 className="text-white font-bold capitalize">{blockType}</h3>
                <p className="text-white/80">x{count}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const OtherScreens = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-600 to-gray-800 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'monospace' }}>
          {gameState.currentScreen === 'settings' && 'НАСТРОЙКИ'}
          {gameState.currentScreen === 'multiplayer' && 'МУЛЬТИПЛЕЕР'}
          {gameState.currentScreen === 'profile' && 'ПРОФИЛЬ'}
        </h1>
        <p className="text-white/80 text-xl">Раздел в разработке...</p>
      </div>
      
      <Button 
        onClick={() => setGameState(prev => ({ ...prev, currentScreen: 'menu' }))}
        className="bg-minecraft-brown hover:bg-minecraft-brown/80 text-xl px-8 py-4"
      >
        <Icon name="ArrowLeft" size={20} className="mr-2" />
        Вернуться в меню
      </Button>
    </div>
  );

  return (
    <div className="select-none">
      {gameState.currentScreen === 'menu' && <MenuScreen />}
      {gameState.currentScreen === 'game' && <GameScreen />}
      {gameState.currentScreen === 'inventory' && <InventoryScreen />}
      {['settings', 'multiplayer', 'profile'].includes(gameState.currentScreen) && <OtherScreens />}
    </div>
  );
};

export default Index;