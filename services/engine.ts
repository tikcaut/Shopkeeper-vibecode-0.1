
import {
  Customer,
  DeliveryBox,
  Direction,
  Employee,
  EmployeeType,
  GameState,
  InputState,
  Player,
  ProductType,
  Rect,
  Shelf,
  Truck,
  Vector2,
  Pedestrian,
} from '../types';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CUSTOMER_SPEED,
  DELIVERY_ZONE_RECT,
  DOOR_MAIN,
  EMPLOYEE_SPEED,
  INITIAL_SHELVES,
  PLAYER_SPEED,
  PLAYER_RUN_SPEED,
  PRODUCTS,
  REGISTER_RECT,
  STAFF_COSTS,
  TIME_SPEED,
  TRUCK_DIMENSIONS,
  TRUCK_STOP_POS,
  WALLS,
  WAYPOINTS,
  PEDESTRIAN_SPEED,
  PEDESTRIAN_SPAWN_RATE,
} from '../constants';

// --- Utility Functions ---

const checkCollision = (rect1: Rect, rect2: Rect) => {
  return (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.y + rect1.h > rect2.y
  );
};

const getDistance = (v1: Vector2, v2: Vector2) => {
  return Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
};

const moveTowards = (current: Vector2, target: Vector2, speed: number): Vector2 => {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < speed) return target;

  return {
    x: current.x + (dx / dist) * speed,
    y: current.y + (dy / dist) * speed,
  };
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Core Engine Logic ---

export const createInitialState = (): GameState => ({
  player: {
    pos: { x: 400, y: 500 },
    velocity: { x: 0, y: 0 },
    size: 18,
    direction: Direction.DOWN,
    holding: null,
    speed: PLAYER_SPEED,
  },
  customers: [],
  pedestrians: [],
  employees: [],
  shelves: [...INITIAL_SHELVES.map(s => ({...s}))], 
  deliveryBoxes: [],
  floatingTexts: [],
  truck: {
      pos: { x: TRUCK_STOP_POS.x, y: -400 }, // Start off screen
      state: 'GONE',
      inventory: [],
      timer: 0
  },
  pendingOrders: [],
  money: 500, // Slightly higher starting money for new products
  reputation: 10,
  day: 1,
  timeOfDay: 0, // 0 = 8:00 AM
  isPaused: true,
  marketingLevel: 1,
  totalSales: 0,
  isMenuOpen: false,
  activeTab: 'STATS'
});

export const updateGame = (state: GameState, input: InputState): GameState => {
  const newState = { ...state };
  
  if (newState.isPaused || newState.isMenuOpen) return newState;

  // --- Time System ---
  newState.timeOfDay += TIME_SPEED; 

  if (newState.timeOfDay >= 1.0) {
      // End of Day / Reset
      newState.day++;
      newState.timeOfDay = 0;
      
      // Wages
      let wages = 0;
      newState.employees.forEach(e => wages += STAFF_COSTS[e.type]);
      newState.money -= wages;
      if (wages > 0) {
          newState.floatingTexts.push({
              id: generateId(),
              text: `-$${wages} Staff Wages`,
              pos: { x: 600, y: 400 },
              color: '#ef4444',
              life: 180,
              velocity: { x: 0, y: -0.5 }
          });
      }
  }

  // --- Truck Logistics ---
  updateTruck(newState);

  // --- Pedestrians & Customers ---
  updatePedestrians(newState);

  // --- Player Physics ---
  newState.player.speed = input.run ? PLAYER_RUN_SPEED : PLAYER_SPEED;
  updateEntityPosition(newState.player, input, newState);

  // --- Interaction ---
  if (input.action) handlePlayerInteraction(newState);

  // --- Employee AI ---
  newState.employees.forEach(emp => updateEmployee(emp, newState));

  // --- Customer Logic ---
  newState.customers = newState.customers
    .map(cust => updateCustomer(cust, newState))
    .filter(c => c.state !== 'LEAVING' || c.pos.y > -100);

  // --- Floating Text ---
  newState.floatingTexts = newState.floatingTexts
    .map(ft => ({
        ...ft,
        pos: { x: ft.pos.x + ft.velocity.x, y: ft.pos.y + ft.velocity.y },
        life: ft.life - 1
    }))
    .filter(ft => ft.life > 0);

  return newState;
};

const updatePedestrians = (state: GameState) => {
    // 1. Spawning
    if (Math.random() < PEDESTRIAN_SPAWN_RATE && state.pedestrians.length < 15) {
        const fromTop = Math.random() < 0.5;
        const spawnY = fromTop ? -50 : CANVAS_HEIGHT + 50;
        const dir = fromTop ? 1 : -1; // 1 = down, -1 = up (roughly)
        
        state.pedestrians.push({
            id: generateId(),
            pos: { x: 40 + Math.random() * 80, y: spawnY }, // Sidewalk area
            direction: dir,
            speed: PEDESTRIAN_SPEED * (0.8 + Math.random() * 0.4),
            color: `hsl(${Math.random() * 360}, 50%, 60%)`
        });
    }

    // 2. Movement & Conversion
    state.pedestrians = state.pedestrians.filter(p => {
        p.pos.y += p.direction * p.speed;

        // Check if near Door
        const distToDoor = getDistance(p.pos, WAYPOINTS.DOOR_OUTSIDE);
        if (distToDoor < 40) {
            // Chance to enter store
            // Modifiers: Reputation, Time of Day, Marketing
            let enterChance = 0.05 + (state.reputation * 0.002) + (state.marketingLevel * 0.02);
            
            // Lunch break dip
            if (state.timeOfDay > 0.33 && state.timeOfDay < 0.42) enterChance *= 0.2;
            
            // Only convert if store open (time < 0.9) and not too crowded
            if (state.timeOfDay < 0.9 && state.customers.length < 20 && Math.random() < enterChance) {
                spawnCustomerFromPedestrian(state, p);
                return false; // Remove pedestrian
            }
        }

        // Remove if off screen
        if (p.pos.y < -100 || p.pos.y > CANVAS_HEIGHT + 100) return false;
        return true;
    });
};

const spawnCustomerFromPedestrian = (state: GameState, p: Pedestrian) => {
    const availableProducts = state.shelves.filter(s => s.stock > 0).map(s => s.type);
    const targetType = availableProducts.length > 0 
        ? availableProducts[Math.floor(Math.random() * availableProducts.length)]
        : ProductType.APPLE; // Fallback

    const newCust: Customer = {
        id: generateId(),
        pos: { ...p.pos },
        target: null,
        waypoints: [{ ...WAYPOINTS.DOOR_OUTSIDE }, { ...WAYPOINTS.DOOR_INSIDE }],
        state: 'ENTERING',
        targetProduct: targetType,
        patience: 100,
        maxPatience: 100,
        cart: [],
        browseTimer: 0,
        stuckTimer: 0
    };
    state.customers.push(newCust);
};

const updateTruck = (state: GameState) => {
    const t = state.truck;
    
    // Arrival Logic
    if (t.state === 'GONE' && state.pendingOrders.length > 0) {
        // Truck comes if there are orders, delayed slightly
        t.state = 'ARRIVING';
        // Load orders into truck inventory
        state.pendingOrders.forEach(order => {
            t.inventory.push({
                id: generateId(),
                type: order.type,
                count: order.count,
                pos: { x: 0, y: 0 } // dummy pos until unloaded
            });
        });
        state.pendingOrders = [];
    }

    if (t.state === 'ARRIVING') {
        t.pos = moveTowards(t.pos, TRUCK_STOP_POS, 2);
        if (getDistance(t.pos, TRUCK_STOP_POS) < 2) {
            t.state = 'UNLOADING';
            t.timer = 60; 
        }
    }
    else if (t.state === 'UNLOADING') {
        t.timer--;
        if (t.timer <= 0) {
            if (t.inventory.length > 0) {
                const box = t.inventory.shift();
                if (box) {
                    box.pos = {
                        x: DELIVERY_ZONE_RECT.x + 10 + Math.random() * (DELIVERY_ZONE_RECT.w - 40),
                        y: DELIVERY_ZONE_RECT.y + 10 + Math.random() * (DELIVERY_ZONE_RECT.h - 40)
                    };
                    state.deliveryBoxes.push(box);
                    t.timer = 30; // Unload speed
                }
            } else {
                t.state = 'LEAVING';
            }
        }
    }
    else if (t.state === 'LEAVING') {
        t.pos = moveTowards(t.pos, { x: TRUCK_STOP_POS.x, y: -450 }, 3);
        if (t.pos.y < -400) {
            t.state = 'GONE';
        }
    }
};

const updateCustomer = (c: Customer, state: GameState): Customer => {
    // 1. Stuck Detection
    const prevPos = { ...c.pos };
    
    // 2. Navigation
    if (c.target === null && c.waypoints.length > 0) {
        c.target = c.waypoints.shift()!;
    }

    if (c.target) {
        c.pos = moveTowards(c.pos, c.target, CUSTOMER_SPEED);
        if (getDistance(c.pos, c.target) < 10) {
            c.target = null;
        }
    }

    // Anti-stuck Check
    if (c.state !== 'BROWSING' && c.state !== 'QUEUEING' && c.state !== 'PAYING') {
        if (getDistance(prevPos, c.pos) < 0.5) {
            c.stuckTimer++;
            if (c.stuckTimer > 100) {
                // If stuck too long, leave
                c.state = 'LEAVING';
                c.waypoints = [{ ...WAYPOINTS.DOOR_OUTSIDE }, { ...WAYPOINTS.STREET_EXIT }];
                c.target = null;
                c.stuckTimer = 0;
            }
        } else {
            c.stuckTimer = 0;
        }
    }

    // 3. State Machine
    if (!c.target && c.waypoints.length === 0) {
        switch (c.state) {
            case 'ENTERING':
                const shelf = state.shelves.find(s => s.type === c.targetProduct && s.stock > 0);
                if (shelf) {
                    c.state = 'MOVING_TO_SHELF';
                    c.waypoints = [{ x: shelf.pos.x + shelf.pos.w/2, y: shelf.pos.y + shelf.pos.h + 20 }];
                } else {
                    c.state = 'LEAVING';
                    c.waypoints = [{ ...WAYPOINTS.DOOR_INSIDE }, { ...WAYPOINTS.DOOR_OUTSIDE }, { ...WAYPOINTS.STREET_EXIT }];
                }
                break;
            
            case 'MOVING_TO_SHELF':
                c.state = 'BROWSING';
                c.browseTimer = 60;
                break;

            case 'BROWSING':
                c.browseTimer--;
                if (c.browseTimer <= 0) {
                    const shelf = state.shelves.find(s => s.type === c.targetProduct && getDistance(c.pos, {x:s.pos.x + s.pos.w/2, y:s.pos.y+s.pos.h+20}) < 50);
                    if (shelf && shelf.stock > 0) {
                        shelf.stock--;
                        c.cart.push(c.targetProduct);
                        c.state = 'MOVING_TO_REGISTER';
                        c.waypoints = [{ ...WAYPOINTS.REGISTER_QUEUE }];
                    } else {
                        c.state = 'LEAVING';
                        c.waypoints = [{ ...WAYPOINTS.DOOR_INSIDE }, { ...WAYPOINTS.DOOR_OUTSIDE }, { ...WAYPOINTS.STREET_EXIT }];
                    }
                }
                break;

            case 'MOVING_TO_REGISTER':
                c.state = 'QUEUEING';
                break;

            case 'QUEUEING':
                const queueIndex = state.customers.filter(cu => cu.state === 'QUEUEING').indexOf(c);
                const qTarget = { 
                    x: WAYPOINTS.REGISTER_QUEUE.x - (queueIndex * 25), 
                    y: WAYPOINTS.REGISTER_QUEUE.y 
                };
                if (getDistance(c.pos, qTarget) > 5) {
                    c.pos = moveTowards(c.pos, qTarget, 1);
                }
                
                c.patience -= 0.03; // Slower patience drain
                if (c.patience <= 0) {
                    c.state = 'ANGRY';
                    state.reputation = Math.max(0, state.reputation - 2);
                    state.floatingTexts.push({ id: generateId(), text: 'Too Slow!', pos: { ...c.pos }, color: '#ef4444', life: 60, velocity: { x: 0, y: -1 } });
                    c.waypoints = [{ ...WAYPOINTS.DOOR_INSIDE }, { ...WAYPOINTS.DOOR_OUTSIDE }, { ...WAYPOINTS.STREET_EXIT }];
                }
                break;
            
            case 'LEAVING':
            case 'ANGRY':
                if (c.pos.y < -50 || c.pos.y > CANVAS_HEIGHT + 50) {
                     // Filtered out in main loop
                } else if (c.waypoints.length === 0) {
                    c.waypoints = [{ ...WAYPOINTS.STREET_EXIT }];
                }
                break;
        }
    }

    return c;
};

// Generic Movement with Wall Collision
const updateEntityPosition = (entity: Player, input: InputState, state: GameState) => {
  let dx = 0;
  let dy = 0;

  if (input.up) dy -= entity.speed;
  if (input.down) dy += entity.speed;
  if (input.left) dx -= entity.speed;
  if (input.right) dx += entity.speed;

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  const nextPos = { x: entity.pos.x + dx, y: entity.pos.y + dy };
  const rect: Rect = { x: nextPos.x - 8, y: nextPos.y - 8, w: 16, h: 16 };

  // Collision
  let collides = false;
  // Special handling: Doors allow passage
  const inDoorMain = checkCollision(rect, DOOR_MAIN);
  
  if (!inDoorMain) {
      for (const wall of WALLS) {
        if (checkCollision(rect, wall)) collides = true;
      }
  }
  
  for (const shelf of state.shelves) {
    if (checkCollision(rect, shelf.pos)) collides = true;
  }
  if (checkCollision(rect, REGISTER_RECT)) collides = true;

  if (!collides) {
    entity.pos = nextPos;
  }

  if (dy < 0) entity.direction = Direction.UP;
  else if (dy > 0) entity.direction = Direction.DOWN;
  else if (dx < 0) entity.direction = Direction.LEFT;
  else if (dx > 0) entity.direction = Direction.RIGHT;
};

const handlePlayerInteraction = (state: GameState) => {
    const p = state.player;
    const interactionRadius = 60;

    // 1. Delivery Zone (Pick up box)
    if (state.player.holding === null) {
        // Only if near delivery zone
        if (checkCollision({x: p.pos.x-20, y: p.pos.y-20, w:40, h:40}, DELIVERY_ZONE_RECT)) {
             const boxIndex = state.deliveryBoxes.findIndex(b => getDistance(p.pos, b.pos) < interactionRadius);
             if (boxIndex >= 0) {
                 const box = state.deliveryBoxes[boxIndex];
                 p.holding = { type: box.type, count: box.count };
                 state.deliveryBoxes.splice(boxIndex, 1);
                 return;
             }
        }
    }

    // 2. Shelves (Restock)
    const shelfIndex = state.shelves.findIndex(s => {
        const center = { x: s.pos.x + s.pos.w/2, y: s.pos.y + s.pos.h/2 };
        return getDistance(p.pos, center) < interactionRadius;
    });

    if (shelfIndex >= 0) {
        const shelf = state.shelves[shelfIndex];
        // If holding correct item -> Add
        if (p.holding && p.holding.type === shelf.type) {
            const space = shelf.maxStock - shelf.stock;
            const amountToAdd = Math.min(space, p.holding.count);
            
            if (amountToAdd > 0) {
                shelf.stock += amountToAdd;
                p.holding.count -= amountToAdd;
                state.floatingTexts.push({ id: generateId(), text: `+${amountToAdd}`, pos: { x: shelf.pos.x, y: shelf.pos.y }, color: '#10b981', life: 30, velocity: { x: 0, y: -1 } });
                if (p.holding.count <= 0) p.holding = null;
            }
            return;
        }
    }

    // 3. Register (Checkout)
    const distToRegister = getDistance(p.pos, { x: REGISTER_RECT.x + REGISTER_RECT.w/2, y: REGISTER_RECT.y + REGISTER_RECT.h/2 });
    if (distToRegister < 80) {
        processCheckout(state, REGISTER_RECT.x, REGISTER_RECT.y);
    }
};

const processCheckout = (state: GameState, x: number, y: number) => {
    const queuedCustomer = state.customers.find(c => c.state === 'QUEUEING');
    if (queuedCustomer) {
        let total = 0;
        queuedCustomer.cart.forEach(itemType => {
            total += PRODUCTS[itemType].price;
        });
        state.money += total;
        state.totalSales += total;
        state.reputation = Math.min(100, state.reputation + 1);
        
        queuedCustomer.state = 'LEAVING';
        queuedCustomer.waypoints = [{ ...WAYPOINTS.DOOR_INSIDE }, { ...WAYPOINTS.DOOR_OUTSIDE }, { ...WAYPOINTS.STREET_EXIT }];
        queuedCustomer.target = null; 

        state.floatingTexts.push({
            id: generateId(), text: `+$${total}`, pos: { x, y: y - 20 }, color: '#fbbf24', life: 60, velocity: { x: 0, y: -1 }
        });
    }
};

const updateEmployee = (emp: Employee, state: GameState) => {
    if (emp.type === EmployeeType.CASHIER) {
        const regPos = { x: REGISTER_RECT.x + 60, y: REGISTER_RECT.y - 30 }; 
        if (getDistance(emp.pos, regPos) > 5) {
            emp.pos = moveTowards(emp.pos, regPos, EMPLOYEE_SPEED);
            emp.state = 'MOVING';
        } else {
            emp.state = 'IDLE';
            if (Math.random() < 0.05) { 
                 processCheckout(state, REGISTER_RECT.x, REGISTER_RECT.y);
            }
        }
    } 
    else if (emp.type === EmployeeType.STOCKER) {
        if (!emp.holding) {
            const box = state.deliveryBoxes[0];
            if (box) {
                if (getDistance(emp.pos, box.pos) < 10) {
                    emp.holding = { type: box.type, count: box.count };
                    state.deliveryBoxes.shift();
                } else {
                    emp.pos = moveTowards(emp.pos, box.pos, EMPLOYEE_SPEED);
                }
            } else {
                emp.pos = moveTowards(emp.pos, { x: 350, y: 150 }, EMPLOYEE_SPEED);
            }
        } else {
            const shelf = state.shelves.find(s => s.type === emp.holding!.type && s.stock < s.maxStock);
            if (shelf) {
                const target = { x: shelf.pos.x + 20, y: shelf.pos.y + 20 };
                if (getDistance(emp.pos, target) < 20) {
                     const space = shelf.maxStock - shelf.stock;
                     const amt = Math.min(space, emp.holding.count);
                     shelf.stock += amt;
                     emp.holding.count -= amt;
                     if (emp.holding.count <= 0) emp.holding = null;
                } else {
                    emp.pos = moveTowards(emp.pos, target, EMPLOYEE_SPEED);
                }
            }
        }
    }
};
