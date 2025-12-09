
import React, { useEffect, useRef } from 'react';
import { GameState, EmployeeType } from '../types';
import { CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, DELIVERY_ZONE_RECT, PRODUCTS, REGISTER_RECT, WALLS, DOOR_MAIN, LIGHT_SOURCES, TRUCK_DIMENSIONS } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // --- LAYER 1: FLOOR & ENVIRONMENT ---
      
      // Background (Void)
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Street
      ctx.fillStyle = COLORS.floorOutside;
      ctx.fillRect(0, 0, 200, CANVAS_HEIGHT);
      
      // Sidewalk
      ctx.fillStyle = COLORS.floorSidewalk;
      ctx.fillRect(130, 0, 70, CANVAS_HEIGHT); // Sidewalk area
      ctx.strokeStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(130, 0); ctx.lineTo(130, CANVAS_HEIGHT); // Curb
      ctx.stroke();

      // Road Markings
      ctx.strokeStyle = '#333';
      ctx.setLineDash([20, 30]);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Shop Floor
      ctx.fillStyle = COLORS.floorInside;
      ctx.fillRect(200, 0, 1000, 800);
      
      // Storage Floor Area
      ctx.fillStyle = COLORS.floorStorage;
      ctx.fillRect(200, 0, 300, 300);

      // Tile Grid (Shop only)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      for(let x=200; x<=1200; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x,800); }
      for(let y=0; y<=800; y+=40) { ctx.moveTo(200,y); ctx.lineTo(1200,y); }
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Delivery Zone Markings
      ctx.fillStyle = 'rgba(250, 204, 21, 0.1)';
      ctx.fillRect(DELIVERY_ZONE_RECT.x, DELIVERY_ZONE_RECT.y, DELIVERY_ZONE_RECT.w, DELIVERY_ZONE_RECT.h);
      ctx.strokeStyle = COLORS.accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(DELIVERY_ZONE_RECT.x, DELIVERY_ZONE_RECT.y, DELIVERY_ZONE_RECT.w, DELIVERY_ZONE_RECT.h);

      // Walls
      ctx.fillStyle = COLORS.wall;
      WALLS.forEach(w => {
          ctx.fillRect(w.x, w.y, w.w, w.h);
          // 3D Top effect
          ctx.fillStyle = '#262626';
          ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
          ctx.fillStyle = COLORS.wall;
      });

      // Doors (Visual)
      ctx.fillStyle = '#475569';
      ctx.fillRect(DOOR_MAIN.x, DOOR_MAIN.y, DOOR_MAIN.w, DOOR_MAIN.h);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; // Open look
      ctx.fillRect(DOOR_MAIN.x + 5, DOOR_MAIN.y, DOOR_MAIN.w - 10, DOOR_MAIN.h);

      // Register
      ctx.fillStyle = '#333'; 
      ctx.fillRect(REGISTER_RECT.x, REGISTER_RECT.y, REGISTER_RECT.w, REGISTER_RECT.h);
      ctx.fillStyle = '#111'; // Top surface
      ctx.fillRect(REGISTER_RECT.x + 5, REGISTER_RECT.y + 5, REGISTER_RECT.w - 10, REGISTER_RECT.h - 10);
      
      // Shelves
      gameState.shelves.forEach(shelf => {
          ctx.fillStyle = '#525252'; // Shelf body
          ctx.fillRect(shelf.pos.x, shelf.pos.y, shelf.pos.w, shelf.pos.h);
          
          if (shelf.stock > 0) {
              const prod = PRODUCTS[shelf.type];
              ctx.fillStyle = prod ? prod.color : '#fff';
              const rows = 2; 
              // Simple stock rendering
              for(let i=0; i<shelf.stock; i++) {
                   const x = shelf.pos.x + 10 + (i % 8) * 12;
                   const y = shelf.pos.y + 10 + Math.floor(i/8) * 12;
                   ctx.beginPath();
                   ctx.arc(x, y, 4, 0, Math.PI * 2);
                   ctx.fill();
              }
          }
      });

      // --- LAYER 2: ENTITIES ---

      // Truck (Detailed)
      const t = gameState.truck;
      if (t.state !== 'GONE') {
          // Truck Body
          ctx.fillStyle = '#f8fafc'; // White Van/Truck
          ctx.fillRect(t.pos.x, t.pos.y, TRUCK_DIMENSIONS.w, TRUCK_DIMENSIONS.h);
          
          // Windshield (Cab)
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(t.pos.x + 10, t.pos.y + 20, TRUCK_DIMENSIONS.w - 20, 50);

          // Roof detail
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(t.pos.x + 20, t.pos.y + 100, TRUCK_DIMENSIONS.w - 40, 200);

          // Wheels
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(t.pos.x - 10, t.pos.y + 60, 10, 40); // Front Left
          ctx.fillRect(t.pos.x + TRUCK_DIMENSIONS.w, t.pos.y + 60, 10, 40); // Front Right
          ctx.fillRect(t.pos.x - 10, t.pos.y + 300, 10, 40); // Rear Left
          ctx.fillRect(t.pos.x + TRUCK_DIMENSIONS.w, t.pos.y + 300, 10, 40); // Rear Right

          // Logo
          ctx.fillStyle = '#d97706';
          ctx.font = 'bold 16px sans-serif';
          ctx.save();
          ctx.translate(t.pos.x + 60, t.pos.y + 200);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.fillText('FRESH LOGISTICS', 0, 0);
          ctx.restore();
      }

      // Pedestrians
      gameState.pedestrians.forEach(ped => {
          ctx.fillStyle = ped.color;
          ctx.beginPath(); ctx.arc(ped.pos.x, ped.pos.y, 12, 0, Math.PI*2); ctx.fill();
          // Walking effect
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath(); ctx.arc(ped.pos.x, ped.pos.y, 12, 0, Math.PI*2); ctx.stroke();
      });

      // Delivery Boxes
      gameState.deliveryBoxes.forEach(box => {
          ctx.fillStyle = '#d97706';
          ctx.fillRect(box.pos.x - 12, box.pos.y - 12, 24, 24);
          ctx.strokeStyle = '#000';
          ctx.strokeRect(box.pos.x - 12, box.pos.y - 12, 24, 24);
          ctx.fillStyle = PRODUCTS[box.type].color;
          ctx.beginPath(); ctx.arc(box.pos.x, box.pos.y, 5, 0, Math.PI * 2); ctx.fill();
      });

      // Employees
      gameState.employees.forEach(emp => {
          ctx.fillStyle = emp.type === EmployeeType.CASHIER ? COLORS.success : '#f97316';
          ctx.beginPath(); ctx.arc(emp.pos.x, emp.pos.y, 16, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth=2; ctx.stroke();
          
          if (emp.holding) {
              ctx.fillStyle = '#d97706';
              ctx.fillRect(emp.pos.x + 8, emp.pos.y - 8, 10, 10);
          }
      });

      // Customers
      gameState.customers.forEach(cust => {
          ctx.fillStyle = cust.state === 'ANGRY' ? COLORS.danger : '#3b82f6';
          ctx.beginPath(); ctx.arc(cust.pos.x, cust.pos.y, 14, 0, Math.PI * 2); ctx.fill();
          
          // Shoulders/Body indicator
          ctx.fillStyle = '#1e293b';
          ctx.beginPath(); ctx.arc(cust.pos.x, cust.pos.y, 8, 0, Math.PI * 2); ctx.fill();
          
          if (cust.cart.length > 0) {
              ctx.fillStyle = '#fff';
              ctx.fillRect(cust.pos.x + 8, cust.pos.y, 6, 6);
          }
      });

      // Player
      const p = gameState.player;
      ctx.save();
      ctx.translate(p.pos.x, p.pos.y);
      // Player Base
      ctx.fillStyle = COLORS.accent; 
      ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth=2; ctx.stroke();
      // Cap
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
      
      // Holding Box Visual
      if (p.holding) {
          ctx.fillStyle = '#d97706';
          ctx.fillRect(-14, -28, 28, 24);
          ctx.strokeRect(-14, -28, 28, 24);
          ctx.fillStyle = PRODUCTS[p.holding.type].color;
          ctx.beginPath(); ctx.arc(0, -16, 6, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();

      // --- LAYER 3: LIGHTING & ATMOSPHERE ---
      
      let darkness = 0;
      if (gameState.timeOfDay < 0.2) darkness = 0.8 - (gameState.timeOfDay * 4); // Morning Fade
      else if (gameState.timeOfDay > 0.7) darkness = (gameState.timeOfDay - 0.7) * 2.5; // Evening Fade
      
      darkness = Math.max(0, Math.min(0.85, darkness));

      if (darkness > 0.1) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          // Draw full darkness
          ctx.fillStyle = `rgba(10, 10, 20, ${darkness})`;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          // Cut out lights
          ctx.globalCompositeOperation = 'destination-out';
          
          LIGHT_SOURCES.forEach(light => {
              const g = ctx.createRadialGradient(light.x, light.y, 10, light.x, light.y, light.radius);
              g.addColorStop(0, `rgba(0,0,0, ${light.intensity})`);
              g.addColorStop(1, 'rgba(0,0,0, 0)');
              ctx.fillStyle = g;
              ctx.beginPath();
              ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
              ctx.fill();
          });
          
          ctx.restore();
      }

      // --- LAYER 4: UI PROMPTS ---
      
      // Floating Key Prompts
      const drawPrompt = (key: string, x: number, y: number) => {
          ctx.fillStyle = '#fff';
          ctx.fillRect(x - 10, y - 30, 20, 20);
          ctx.strokeStyle = '#000';
          ctx.strokeRect(x - 10, y - 30, 20, 20);
          ctx.fillStyle = '#000';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(key, x, y - 20);
      };

      // Prompt Logic (Simplified check)
      if (p.holding) {
          // If near shelf
          gameState.shelves.forEach(s => {
              const dx = p.pos.x - (s.pos.x + s.pos.w/2);
              const dy = p.pos.y - (s.pos.y + s.pos.h/2);
              if (Math.sqrt(dx*dx + dy*dy) < 60) drawPrompt('E', s.pos.x + s.pos.w/2, s.pos.y);
          });
      } else {
          // If near delivery
          if (Math.abs(p.pos.x - (DELIVERY_ZONE_RECT.x + 50)) < 100 && Math.abs(p.pos.y - (DELIVERY_ZONE_RECT.y + 150)) < 100) {
               if (gameState.deliveryBoxes.length > 0) drawPrompt('E', DELIVERY_ZONE_RECT.x + 50, DELIVERY_ZONE_RECT.y);
          }
      }

      // Register Prompt
      if (Math.abs(p.pos.x - 350) < 60 && Math.abs(p.pos.y - 580) < 60) {
          drawPrompt('E', 360, 550);
      }

      // Floating Texts
      gameState.floatingTexts.forEach(ft => {
          ctx.fillStyle = ft.color;
          ctx.font = 'bold 16px sans-serif';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.strokeText(ft.text, ft.pos.x, ft.pos.y);
          ctx.fillText(ft.text, ft.pos.x, ft.pos.y);
      });
    };

    render();
  }, [gameState]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden shadow-2xl">
        <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="max-w-full max-h-full object-contain"
        style={{ imageRendering: 'pixelated' }} 
        />
    </div>
  );
};

export default GameCanvas;
