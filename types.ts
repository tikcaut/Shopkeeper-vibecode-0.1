
export type Vector2 = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export enum ProductType {
  APPLE = 'APPLE',
  BREAD = 'BREAD',
  MILK = 'MILK',
  WATER = 'WATER',
  CHIPS = 'CHIPS',
  COFFEE = 'COFFEE',
  EGGS = 'EGGS',
  PASTA = 'PASTA',
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum EntityType {
  PLAYER = 'PLAYER',
  CUSTOMER = 'CUSTOMER',
  SHELF = 'SHELF',
  REGISTER = 'REGISTER',
  DELIVERY_ZONE = 'DELIVERY_ZONE',
  WALL = 'WALL',
}

export enum EmployeeType {
  CASHIER = 'CASHIER',
  STOCKER = 'STOCKER',
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  action: boolean; // E
  secondary: boolean; // F / Space
  run: boolean; // Shift
}

export interface Player {
  pos: Vector2;
  velocity: Vector2;
  size: number;
  direction: Direction;
  holding: {
    type: ProductType;
    count: number;
  } | null;
  speed: number;
}

export interface Employee {
  id: string;
  type: EmployeeType;
  pos: Vector2;
  state: 'IDLE' | 'MOVING' | 'WORKING' | 'CARRYING';
  target: Vector2 | null;
  holding: {
    type: ProductType;
    count: number;
  } | null;
  targetId: string | null;
}

export interface Shelf {
  id: string;
  type: ProductType;
  pos: Rect;
  stock: number;
  maxStock: number;
  direction: Direction;
}

export interface DeliveryBox {
  id: string;
  type: ProductType;
  count: number;
  pos: Vector2;
}

export interface Customer {
  id: string;
  pos: Vector2;
  target: Vector2 | null;
  waypoints: Vector2[]; // List of points to visit (Pathfinding)
  state: 'ENTERING' | 'BROWSING' | 'MOVING_TO_SHELF' | 'MOVING_TO_REGISTER' | 'QUEUEING' | 'PAYING' | 'LEAVING' | 'ANGRY';
  targetProduct: ProductType;
  patience: number;
  maxPatience: number;
  cart: ProductType[];
  browseTimer: number;
  stuckTimer: number; // To detect if stuck
}

export interface Pedestrian {
  id: string;
  pos: Vector2;
  direction: number; // 1 (right) or -1 (left)
  speed: number;
  color: string;
}

export interface FloatingText {
  id: string;
  text: string;
  pos: Vector2;
  life: number;
  color: string;
  velocity: Vector2;
}

export interface Truck {
    pos: Vector2;
    state: 'ARRIVING' | 'UNLOADING' | 'LEAVING' | 'GONE';
    inventory: DeliveryBox[];
    timer: number;
}

export interface PendingOrder {
    id: string;
    type: ProductType;
    count: number;
}

export interface GameState {
  player: Player;
  customers: Customer[];
  pedestrians: Pedestrian[];
  employees: Employee[];
  shelves: Shelf[];
  deliveryBoxes: DeliveryBox[];
  floatingTexts: FloatingText[];
  truck: Truck;
  pendingOrders: PendingOrder[];
  
  // Economy & Stats
  money: number;
  reputation: number;
  day: number;
  timeOfDay: number; // 0 to 1
  
  // Systems
  isPaused: boolean;
  marketingLevel: number;
  totalSales: number;
  isMenuOpen: boolean;
  activeTab: 'SUPPLY' | 'STAFF' | 'STATS';
}

export interface ProductDef {
  id: ProductType;
  name: string;
  cost: number;
  price: number;
  color: string;
  itemsPerCrate: number;
  unlockReputation: number;
}
