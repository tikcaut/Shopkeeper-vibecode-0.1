
import React from 'react';
import { GameState, ProductType, EmployeeType } from '../types';
import { PRODUCTS, STAFF_COSTS } from '../constants';
import { X, Package, Users, BarChart3, Lock, Truck, UserPlus, Clock } from 'lucide-react';

interface ManagementPanelProps {
  state: GameState;
  onClose: () => void;
  onOrderSupply: (type: ProductType) => void;
  onHireStaff: (type: EmployeeType) => void;
  onMarketing: () => void;
  onChangeTab: (tab: 'SUPPLY' | 'STAFF' | 'STATS') => void;
}

const ManagementPanel: React.FC<ManagementPanelProps> = ({ 
    state, onClose, onOrderSupply, onHireStaff, onMarketing, onChangeTab 
}) => {
  if (!state.isMenuOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-5xl h-[85vh] border border-zinc-700 shadow-2xl flex flex-col relative">
        
        {/* Header */}
        <div className="p-6 bg-black border-b-2 border-yellow-500 flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter">SHOP<span className="text-yellow-500">MANAGER</span> OS</h2>
                <p className="text-zinc-500 text-xs font-mono uppercase">System v2.0 // Connected</p>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-2 rounded transition-colors">
                <X size={32} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-950 border-b border-zinc-800">
            <TabButton 
                active={state.activeTab === 'SUPPLY'} 
                onClick={() => onChangeTab('SUPPLY')} 
                icon={<Package size={18} />} 
                label="LOGISTICS" 
            />
            <TabButton 
                active={state.activeTab === 'STAFF'} 
                onClick={() => onChangeTab('STAFF')} 
                icon={<Users size={18} />} 
                label="PERSONNEL" 
            />
            <TabButton 
                active={state.activeTab === 'STATS'} 
                onClick={() => onChangeTab('STATS')} 
                icon={<BarChart3 size={18} />} 
                label="ANALYTICS" 
            />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-900">
            
            {state.activeTab === 'SUPPLY' && (
                <div>
                    <div className="bg-zinc-800 p-4 mb-6 rounded border border-zinc-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Truck className="text-yellow-500" size={32} />
                            <div>
                                <h3 className="text-white font-bold">Delivery Status</h3>
                                <p className="text-zinc-400 text-sm">
                                    {state.truck.state === 'GONE' 
                                        ? `Next truck arrives around ${state.timeOfDay > 0.5 ? 'tomorrow morning' : '2:00 PM'}` 
                                        : 'TRUCK IS HERE'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-zinc-500 uppercase">Pending Orders</p>
                             <p className="text-2xl text-white font-mono">{state.pendingOrders.length} crates</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.values(PRODUCTS).map((product) => {
                            const isLocked = state.reputation < product.unlockReputation;
                            const pendingCount = state.pendingOrders.filter(o => o.type === product.id).length;
                            
                            if (isLocked) {
                                return (
                                    <div key={product.id} className="bg-black/50 p-6 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center gap-3 opacity-50">
                                        <Lock size={24} className="text-zinc-600" />
                                        <p className="text-zinc-500 font-bold text-xs">REP {product.unlockReputation}+</p>
                                    </div>
                                );
                            }
                            return (
                                <div key={product.id} className="bg-black p-5 border border-zinc-800 hover:border-yellow-500 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-white">{product.name}</h3>
                                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: product.color}}></div>
                                    </div>
                                    <div className="space-y-1 text-sm text-zinc-400 mb-6 font-mono">
                                        <div className="flex justify-between"><span>COST</span> <span className="text-white">${product.cost}</span></div>
                                        <div className="flex justify-between"><span>RETAIL</span> <span className="text-emerald-500">${product.price}</span></div>
                                        <div className="flex justify-between"><span>UNITS</span> <span>{product.itemsPerCrate}</span></div>
                                    </div>
                                    <button 
                                        onClick={() => onOrderSupply(product.id)}
                                        disabled={state.money < product.cost}
                                        className="w-full py-2 bg-zinc-800 hover:bg-yellow-500 hover:text-black disabled:opacity-50 disabled:hover:bg-zinc-800 disabled:hover:text-white text-white font-bold text-sm border border-zinc-700 transition-colors"
                                    >
                                        ORDER CRATE
                                    </button>
                                    {pendingCount > 0 && (
                                        <div className="mt-2 text-center text-xs text-yellow-500 font-bold">
                                            {pendingCount} PENDING DELIVERY
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {state.activeTab === 'STAFF' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Hiring Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <StaffCard 
                                type="Cashier" 
                                desc="Auto-checkout customers" 
                                wage={STAFF_COSTS.CASHIER} 
                                cost={100}
                                color="text-green-500"
                                onHire={() => onHireStaff(EmployeeType.CASHIER)}
                                money={state.money}
                            />
                            <StaffCard 
                                type="Stocker" 
                                desc="Moves boxes to shelves" 
                                wage={STAFF_COSTS.STOCKER} 
                                cost={150}
                                color="text-orange-500"
                                onHire={() => onHireStaff(EmployeeType.STOCKER)}
                                money={state.money}
                            />
                        </div>
                    </div>

                    {/* Roster */}
                    <div className="bg-black border border-zinc-800 p-6 h-full">
                        <h3 className="text-zinc-400 font-bold uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Active Roster</h3>
                        <div className="space-y-3">
                            {state.employees.length === 0 ? (
                                <p className="text-zinc-600 italic text-sm">No employees active.</p>
                            ) : (
                                state.employees.map((emp) => (
                                    <div key={emp.id} className="flex items-center gap-3 text-sm p-2 bg-zinc-900 border border-zinc-800">
                                        <div className={`w-2 h-2 rounded-full ${emp.type === 'CASHIER' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                        <div className="flex-1">
                                            <p className="text-white font-bold">{emp.type}</p>
                                            <p className="text-zinc-500 text-xs">{emp.state}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {state.activeTab === 'STATS' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="LIFETIME SALES" value={`$${state.totalSales.toLocaleString()}`} />
                        <StatCard label="DAYS OPERATIONAL" value={state.day.toString()} />
                        <StatCard label="STORE REP" value={state.reputation.toFixed(0)} />
                        <StatCard label="TOTAL STAFF" value={state.employees.length.toString()} />
                    </div>

                    <div className="mt-8 p-8 bg-gradient-to-r from-zinc-900 to-black border border-zinc-800">
                        <h3 className="text-2xl font-black text-white mb-2">MARKETING CAMPAIGNS</h3>
                        <p className="text-zinc-400 mb-6 max-w-lg">Increase your store's visibility to attract more customers. Higher levels increase foot traffic significantly.</p>
                        
                        <div className="flex items-center gap-4">
                            <div className="bg-zinc-800 px-4 py-2 rounded text-zinc-400 font-mono">
                                CURRENT LEVEL: <span className="text-white font-bold">{state.marketingLevel}</span>
                            </div>
                            <button 
                                 onClick={onMarketing}
                                 disabled={state.money < 200 * state.marketingLevel}
                                 className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                            >
                                UPGRADE (${200 * state.marketingLevel})
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-5 flex items-center justify-center gap-2 font-bold text-sm tracking-wider transition-colors border-b-4 ${active ? 'bg-zinc-900 text-white border-yellow-500' : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-zinc-900'}`}
    >
        {icon}
        {label}
    </button>
);

const StaffCard = ({ type, desc, wage, cost, color, onHire, money }: any) => (
    <div className="bg-zinc-900 p-6 border border-zinc-800 flex flex-col gap-4">
        <div>
            <h3 className={`text-xl font-bold ${color}`}>{type}</h3>
            <p className="text-zinc-400 text-sm">{desc}</p>
        </div>
        <div className="text-sm font-mono text-zinc-300">
            <div>Daily Wage: <span className="text-white">${wage}</span></div>
            <div>Sign-on Fee: <span className="text-white">${cost}</span></div>
        </div>
        <button 
            onClick={onHire}
            disabled={money < cost}
            className="mt-auto w-full py-2 bg-white text-black font-bold hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600"
        >
            HIRE STAFF
        </button>
    </div>
);

const StatCard = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-zinc-950 p-6 border border-zinc-800">
        <p className="text-xs text-zinc-600 font-black tracking-widest mb-2">{label}</p>
        <p className="text-3xl font-mono text-white">{value}</p>
    </div>
);

export default ManagementPanel;
