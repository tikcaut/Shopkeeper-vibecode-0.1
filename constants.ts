
import { ProductDef, ProductType, Rect, Direction, Shelf } from './types';

// Logical Resolution
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const TILE_SIZE = 40;

// Physics & Time
export const PLAYER_SPEED = 5;
export const PLAYER_RUN_SPEED = 8;
export const EMPLOYEE_SPEED = 3.5;
export const CUSTOMER_SPEED = 2.5;

// TIME: 1 Game Day = 10 Minutes Real Time
// 600 seconds = 1.0 day
// 60 fps * 600 = 36000 frames
// 1 / 36000 = ~0.000028
export const TIME_SPEED = 0.00003; 

// Pedestrians
export const PEDESTRIAN_SPEED = 2;
export const PEDESTRIAN_SPAWN_RATE = 0.01; // Chance per frame

// Colors (Theme: Industrial High Contrast)
export const COLORS = {
  background: '#0a0a0a', // Almost black
  floorInside: '#262626', // Neutral Grey
  floorOutside: '#171717', // Darker Asphalt
  floorSidewalk: '#404040', // Pavement
  floorStorage: '#3f3f46', // Lighter grey for storage
  wall: '#000000', // Pure Black
  accent: '#facc15', // Yellow 400
  accentDark: '#ca8a04', // Yellow 600
  success: '#22c55e', // Green
  danger: '#ef4444', // Red
  text: '#ffffff',
  glass: 'rgba(148, 163, 184, 0.3)',
};

// --- MAP LAYOUT ---
// Street: x=0 to x=200
// Shop: x=200 to x=1200
// Storage Room: Top Left of Shop (x=200-500, y=0-300)

export const WALLS: Rect[] = [
  // Outer Shop Walls
  { x: 200, y: 0, w: 1000, h: 40 }, // Top
  { x: 200, y: 0, w: 40, h: 800 }, // Left (Front)
  { x: 1160, y: 0, w: 40, h: 800 }, // Right
  { x: 200, y: 760, w: 1000, h: 40 }, // Bottom

  // Storage Room Walls (Interior)
  { x: 240, y: 250, w: 260, h: 20 }, // Storage Bottom Wall
  { x: 500, y: 0, w: 20, h: 270 }, // Storage Right Wall
];

// Doors
export const DOOR_MAIN: Rect = { x: 200, y: 400, w: 40, h: 100 }; // Main Entrance
export const DOOR_STORAGE: Rect = { x: 500, y: 100, w: 20, h: 80 }; // Storage Door

// Zones
export const DELIVERY_ZONE_RECT: Rect = { x: 80, y: 300, w: 100, h: 300 }; // On street
export const REGISTER_RECT: Rect = { x: 300, y: 550, w: 120, h: 80 };
export const STORAGE_ZONE_RECT: Rect = { x: 240, y: 40, w: 250, h: 200 };

// Truck
export const TRUCK_STOP_POS = { x: 50, y: 250 };
export const TRUCK_DIMENSIONS = { w: 120, h: 400 };

export const SPAWN_POINT = { x: 180, y: 450 };

// Navigation Waypoints (for AI)
export const WAYPOINTS = {
  STREET_SPAWN_TOP: { x: 50, y: -50 },
  STREET_SPAWN_BOTTOM: { x: 50, y: 850 },
  STREET_EXIT: { x: 50, y: -100 }, // Generic exit
  DOOR_OUTSIDE: { x: 160, y: 450 },
  DOOR_INSIDE: { x: 280, y: 450 },
  REGISTER_QUEUE: { x: 280, y: 600 },
};

// Initial Shelf Layout
export const INITIAL_SHELVES: Shelf[] = [
  // Main Floor
  { id: 'shelf_apple', type: ProductType.APPLE, pos: { x: 600, y: 150, w: 160, h: 40 }, stock: 0, maxStock: 20, direction: Direction.DOWN },
  { id: 'shelf_bread', type: ProductType.BREAD, pos: { x: 600, y: 350, w: 160, h: 40 }, stock: 0, maxStock: 20, direction: Direction.DOWN },
  { id: 'shelf_milk', type: ProductType.MILK, pos: { x: 850, y: 150, w: 160, h: 40 }, stock: 0, maxStock: 20, direction: Direction.DOWN },
  { id: 'shelf_water', type: ProductType.WATER, pos: { x: 850, y: 350, w: 160, h: 40 }, stock: 0, maxStock: 20, direction: Direction.DOWN },
  { id: 'shelf_chips', type: ProductType.CHIPS, pos: { x: 600, y: 550, w: 160, h: 40 }, stock: 0, maxStock: 20, direction: Direction.DOWN },
  // Storage Racks
  { id: 'storage_rack_1', type: ProductType.APPLE, pos: { x: 260, y: 50, w: 40, h: 100 }, stock: 0, maxStock: 50, direction: Direction.RIGHT },
];

export const PRODUCTS: Record<ProductType, ProductDef> = {
  [ProductType.APPLE]: {
    id: ProductType.APPLE,
    name: 'Red Apples',
    cost: 20, 
    price: 5, 
    color: '#ef4444',
    itemsPerCrate: 10,
    unlockReputation: 0,
  },
  [ProductType.BREAD]: {
    id: ProductType.BREAD,
    name: 'Bakery Bread',
    cost: 40,
    price: 9,
    color: '#d97706',
    itemsPerCrate: 8,
    unlockReputation: 5,
  },
  [ProductType.MILK]: {
    id: ProductType.MILK,
    name: 'Fresh Milk',
    cost: 60,
    price: 14,
    color: '#f8fafc',
    itemsPerCrate: 6,
    unlockReputation: 15,
  },
  [ProductType.WATER]: {
    id: ProductType.WATER,
    name: 'Spring Water',
    cost: 25,
    price: 6,
    color: '#3b82f6',
    itemsPerCrate: 12,
    unlockReputation: 0,
  },
  [ProductType.CHIPS]: {
    id: ProductType.CHIPS,
    name: 'Potato Chips',
    cost: 45,
    price: 11,
    color: '#facc15',
    itemsPerCrate: 10,
    unlockReputation: 25,
  },
  [ProductType.COFFEE]: {
    id: ProductType.COFFEE,
    name: 'Ground Coffee',
    cost: 150,
    price: 35,
    color: '#78350f',
    itemsPerCrate: 5,
    unlockReputation: 40,
  },
  [ProductType.EGGS]: {
    id: ProductType.EGGS,
    name: 'Farm Eggs',
    cost: 30,
    price: 8,
    color: '#fef3c7',
    itemsPerCrate: 12,
    unlockReputation: 10,
  },
  [ProductType.PASTA]: {
    id: ProductType.PASTA,
    name: 'Italian Pasta',
    cost: 35,
    price: 8,
    color: '#fdba74',
    itemsPerCrate: 10,
    unlockReputation: 20,
  },
};

export const STAFF_COSTS = {
    CASHIER: 40, 
    STOCKER: 50, 
};

// Lighting
export const LIGHT_SOURCES = [
    { x: 350, y: 450, radius: 250, intensity: 0.6 }, // Register
    { x: 700, y: 250, radius: 300, intensity: 0.5 }, // Center Aisle
    { x: 950, y: 250, radius: 300, intensity: 0.5 }, // Right Aisle
    { x: 100, y: 400, radius: 150, intensity: 0.4 }, // Street Lamp
    { x: 350, y: 150, radius: 200, intensity: 0.5 }, // Storage Room
];
