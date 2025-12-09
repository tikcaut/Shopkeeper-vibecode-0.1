
import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import ManagementPanel from './components/ManagementPanel';
import { createInitialState, updateGame } from './services/engine';
import { GameState, InputState, ProductType, EmployeeType } from './types';
import { PRODUCTS, SPAWN_POINT } from './constants';

const App: React.FC = () => {
  const gameStateRef = useRef<GameState>(createInitialState());
  const [uiState, setUiState] = useState<GameState>(gameStateRef.current);
  
  // Input Refs
  const inputRef = useRef<InputState>({ 
      up: false, down: false, left: false, right: false, 
      action: false, secondary: false, run: false 
  });
  const requestRef = useRef<number>(0);

  const togglePause = () => {
      gameStateRef.current.isPaused = !gameStateRef.current.isPaused;
      setUiState({ ...gameStateRef.current });
  };

  const toggleMenu = () => {
      gameStateRef.current.isMenuOpen = !gameStateRef.current.isMenuOpen;
      gameStateRef.current.isPaused = gameStateRef.current.isMenuOpen;
      setUiState({ ...gameStateRef.current });
  };
  
  const handleChangeTab = (tab: 'SUPPLY' | 'STAFF' | 'STATS') => {
      gameStateRef.current.activeTab = tab;
      setUiState({ ...gameStateRef.current });
  };

  const handleOrderSupply = (type: ProductType) => {
      const state = gameStateRef.current;
      const product = PRODUCTS[type];

      if (state.money >= product.cost) {
          state.money -= product.cost;
          
          // Add to pending orders for the truck
          state.pendingOrders.push({
              id: Math.random().toString(),
              type,
              count: product.itemsPerCrate
          });

          state.floatingTexts.push({
             id: Math.random().toString(), text: `-$${product.cost}`, pos: { x: 200, y: 100 }, color: '#ef4444', life: 60, velocity: { x: 0, y: -1 }
          });
      }
  };

  const handleHireStaff = (type: EmployeeType) => {
      const state = gameStateRef.current;
      const cost = type === EmployeeType.CASHIER ? 100 : 150;
      
      if (state.money >= cost) {
          state.money -= cost;
          state.employees.push({
              id: Math.random().toString(),
              type,
              pos: { x: SPAWN_POINT.x, y: SPAWN_POINT.y }, 
              state: 'IDLE',
              target: null,
              holding: null,
              targetId: null
          });
          state.floatingTexts.push({
             id: Math.random().toString(), text: `Hired!`, pos: { x: SPAWN_POINT.x, y: SPAWN_POINT.y - 50 }, color: '#fff', life: 60, velocity: { x: 0, y: -1 }
          });
      }
  };

  const handleMarketing = () => {
      const state = gameStateRef.current;
      const cost = 200 * state.marketingLevel;
      if (state.money >= cost) {
          state.money -= cost;
          state.marketingLevel++;
          state.reputation += 10;
          state.floatingTexts.push({ id: Math.random().toString(), text: "Marketing UP!", pos: { x: 600, y: 400 }, color: '#facc15', life: 120, velocity: { x: 0, y: -1 } });
      }
  };

  const gameLoop = useCallback(() => {
    gameStateRef.current = updateGame(gameStateRef.current, inputRef.current);
    // Reset triggers
    if (inputRef.current.action) inputRef.current.action = false; 
    setUiState({ ...gameStateRef.current });
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return;
        
        // Use e.code to work regardless of keyboard layout (English, Russian, etc.)
        switch(e.code) {
            case 'KeyW': case 'ArrowUp': inputRef.current.up = true; break;
            case 'KeyS': case 'ArrowDown': inputRef.current.down = true; break;
            case 'KeyA': case 'ArrowLeft': inputRef.current.left = true; break;
            case 'KeyD': case 'ArrowRight': inputRef.current.right = true; break;
            case 'KeyE': inputRef.current.action = true; break;
            case 'ShiftLeft': case 'ShiftRight': inputRef.current.run = true; break;
            case 'Escape': toggleMenu(); break;
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        switch(e.code) {
            case 'KeyW': case 'ArrowUp': inputRef.current.up = false; break;
            case 'KeyS': case 'ArrowDown': inputRef.current.down = false; break;
            case 'KeyA': case 'ArrowLeft': inputRef.current.left = false; break;
            case 'KeyD': case 'ArrowRight': inputRef.current.right = false; break;
            case 'KeyE': inputRef.current.action = false; break;
            case 'ShiftLeft': case 'ShiftRight': inputRef.current.run = false; break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        cancelAnimationFrame(requestRef.current!);
    };
  }, [gameLoop]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative font-sans">
      <GameCanvas gameState={uiState} />
      
      <HUD 
        state={uiState} 
        onToggleMenu={toggleMenu} 
        onTogglePause={togglePause}
      />
      
      <ManagementPanel 
        state={uiState}
        onClose={toggleMenu}
        onOrderSupply={handleOrderSupply}
        onHireStaff={handleHireStaff}
        onMarketing={handleMarketing}
        onChangeTab={handleChangeTab}
      />
    </div>
  );
};

export default App;
