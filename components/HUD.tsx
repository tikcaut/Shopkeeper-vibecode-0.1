
import React from 'react';
import { GameState } from '../types';
import { Menu, Star, DollarSign, Clock, Pause, Play, ShoppingCart, Truck } from 'lucide-react';

interface HUDProps {
  state: GameState;
  onToggleMenu: () => void;
  onTogglePause: () => void;
}

const HUD: React.FC<HUDProps> = ({ state, onToggleMenu, onTogglePause }) => {
  // Time Calculation (8:00 AM start, 1.0 = 8:00 PM is old logic)
  // New: 0 = 8am, 1.0 = 8am next day (24h)
  // Actually simpler: 0=6am -> 1=6am next day. 
  // Let's assume 0.0 is 6:00 AM.
  const totalMinutes = 6 * 60 + (state.timeOfDay * 24 * 60);
  const hours = Math.floor((totalMinutes / 60) % 24);
  const minutes = Math.floor(totalMinutes % 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const timeString = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none">
      
      {/* --- TOP BAR --- */}
      <div className="flex justify-between items-start pointer-events-auto">
        
        {/* Money & Rep */}
        <div className="flex flex-col gap-2">
            <div className="bg-black border-l-4 border-yellow-400 p-3 min-w-[180px] shadow-lg">
                <div className="flex items-center gap-3">
                    <DollarSign size={24} className="text-yellow-400" />
                    <div>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Balance</p>
                        <p className="text-2xl font-mono text-white font-bold leading-none">${state.money.toFixed(0)}</p>
                    </div>
                </div>
            </div>
            
            <div className="bg-black border-l-4 border-zinc-700 p-3 min-w-[180px] shadow-lg">
                <div className="flex items-center gap-3">
                    <Star size={20} className="text-zinc-400" />
                    <div>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Reputation</p>
                        <p className="text-xl font-mono text-white font-bold leading-none">{state.reputation.toFixed(0)}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Center Notifications */}
        <div className="flex flex-col items-center gap-2">
            {state.player.holding && (
                <div className="bg-yellow-500 text-black px-4 py-1 rounded font-bold text-sm shadow animate-bounce">
                    CARRYING {state.player.holding.type} x{state.player.holding.count}
                </div>
            )}
            {state.truck.state === 'ARRIVING' && (
                <div className="bg-blue-600 text-white px-4 py-1 rounded font-bold text-sm shadow flex gap-2 items-center">
                    <Truck size={16} /> DELIVERY TRUCK ARRIVING
                </div>
            )}
        </div>

        {/* Time & Controls */}
        <div className="flex flex-col items-end gap-3">
            <div className="bg-black p-3 border-r-4 border-yellow-400 shadow-lg text-right">
                 <div className="flex items-center gap-3 justify-end">
                    <div>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Day {state.day}</p>
                        <p className="text-3xl font-mono text-white font-bold leading-none tracking-widest">{timeString}</p>
                    </div>
                    <Clock size={32} className="text-yellow-400" />
                 </div>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={onTogglePause} 
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded shadow-lg border border-zinc-600 active:translate-y-1"
                >
                    {state.isPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
                <button 
                    onClick={onToggleMenu} 
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded shadow-lg active:translate-y-1"
                >
                    <ShoppingCart size={18} />
                    MANAGEMENT
                </button>
            </div>
        </div>
      </div>

      {/* --- BOTTOM BAR --- */}
      <div className="pointer-events-auto flex justify-center pb-2 opacity-70">
           <div className="flex gap-8 text-xs font-mono bg-black/80 text-white px-6 py-2 rounded-full border border-zinc-800">
               <span>[WASD] MOVE</span>
               <span>[SHIFT] RUN</span>
               <span>[E] INTERACT</span>
               <span>[ESC] MENU</span>
           </div>
      </div>
    </div>
  );
};

export default HUD;
