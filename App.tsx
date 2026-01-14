
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Utensils, 
  ChefHat, 
  Receipt, 
  Settings, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Clock, 
  ChevronRight,
  Search,
  Sparkles,
  CheckCircle2,
  X,
  Edit2,
  LayoutGrid
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { AppTab, MenuItem, Order, OrderItem, ItemStatus } from './types';
import { TABLES, CATEGORIES, TAX_RATE, COLLECTIONS } from './constants';
import { Button, Badge, Card } from './components/UI';
import { geminiService } from './services/geminiService';

declare var __firebase_config: string;
declare var __app_id: string;

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "invalid-key", 
      authDomain: "invalid",
      projectId: "invalid",
      storageBucket: "invalid",
      messagingSenderId: "invalid",
      appId: "invalid"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'resto-pro-v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('orders');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Menu Manager State (inside Kitchen)
  const [showMenuManager, setShowMenuManager] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'main', description: '' });

  useEffect(() => {
    if (firebaseConfig.apiKey !== "invalid-key") {
      signInAnonymously(auth).catch(console.error);
    }
    
    const menuRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTIONS.MENU);
    const ordersRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTIONS.ORDERS);

    const unsubMenu = onSnapshot(menuRef, (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as MenuItem));
      if (items.length === 0 && !snapshot.metadata.fromCache) seedMenu();
      else setMenu(items);
    });

    const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
      const ords: Order[] = [];
      snapshot.forEach(doc => ords.push({ id: doc.id, ...doc.data() } as Order));
      setOrders(ords);
      setLoading(false);
    });

    return () => {
      unsubMenu();
      unsubOrders();
    };
  }, []);

  const seedMenu = async () => {
    const defaults = [
      { name: "Truffle Mushroom Risotto", price: 450, category: "main", available: true, description: "Creamy arborio rice with black truffle oil." },
      { name: "Crispy Calamari", price: 320, category: "starters", available: true, description: "Golden fried squid with lime aioli." },
      { name: "Spiced Chai Latte", price: 180, category: "drinks", available: true, description: "House-made spice blend with oat milk." },
      { name: "Lava Cake", price: 250, category: "desserts", available: true, description: "Warm chocolate cake with molten center." },
    ];
    const menuRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTIONS.MENU);
    for (const item of defaults) {
      await addDoc(menuRef, item);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) return;
    const menuRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTIONS.MENU);
    await addDoc(menuRef, {
      ...newItem,
      price: parseFloat(newItem.price),
      available: true
    });
    setNewItem({ name: '', price: '', category: 'main', description: '' });
  };

  const getTableStatus = (num: number) => {
    const active = orders.find(o => o.tableNumber === num && o.status === 'OPEN');
    if (!active) return 'AVAILABLE';
    if (active.items.every(i => i.status === 'FINISHED')) return 'READY';
    return 'OCCUPIED';
  };

  const currentOrder = useMemo(() => 
    orders.find(o => o.tableNumber === selectedTable && o.status === 'OPEN')
  , [orders, selectedTable]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(i => i.itemId === item.id);
      if (exists) return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        status: 'ORDERED',
        timestamp: Date.now()
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const exists = prev.find(i => i.itemId === id);
      if (exists && exists.quantity > 1) return prev.map(i => i.itemId === id ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter(i => i.itemId !== id);
    });
  };

  const placeOrder = async () => {
    if (!selectedTable || cart.length === 0) return;
    const orderRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTIONS.ORDERS);
    const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const tax = subtotal * TAX_RATE;

    if (currentOrder) {
      const updatedItems = [...currentOrder.items, ...cart];
      const newSub = updatedItems.reduce((s, i) => s + (i.price * i.quantity), 0);
      await updateDoc(doc(orderRef, currentOrder.id), {
        items: updatedItems,
        subtotal: newSub,
        tax: newSub * TAX_RATE,
        total: newSub * (1 + TAX_RATE)
      });
    } else {
      await addDoc(orderRef, {
        tableNumber: selectedTable,
        status: 'OPEN',
        items: cart,
        createdAt: serverTimestamp(),
        subtotal,
        tax,
        total: subtotal + tax
      });
    }
    setCart([]);
  };

  const updateStatus = async (orderId: string, idx: number, status: ItemStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const items = [...order.items];
    items[idx].status = status;
    const orderDoc = doc(db, 'artifacts', appId, 'public', 'data', COLLECTIONS.ORDERS, orderId);
    await updateDoc(orderDoc, { items });
  };

  const collectPayment = async (orderId: string) => {
    setIsPrinting(true);
    // Simulate payment processing
    setTimeout(async () => {
      const orderDoc = doc(db, 'artifacts', appId, 'public', 'data', COLLECTIONS.ORDERS, orderId);
      await updateDoc(orderDoc, { status: 'CLOSED' });
      setIsPrinting(false);
      setPaymentSuccess(true);
      
      // Clear success animation after 3 seconds
      setTimeout(() => {
        setPaymentSuccess(false);
        setSelectedTable(null);
      }, 3000);
    }, 2000);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-indigo-900 text-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold tracking-tight">RestoKitchen</h1>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      
      {/* Sidebar - Dashboard Removed */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col no-print transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="text-white" size={24} />
          </div>
          <span className="hidden lg:block font-bold text-xl tracking-tight">Resto<span className="text-indigo-400">Kitchen</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<Utensils size={20} />} label="Order Desk" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <NavItem icon={<ChefHat size={20} />} label="Kitchen" active={activeTab === 'kitchen'} onClick={() => setActiveTab('kitchen')} />
          <NavItem icon={<Receipt size={20} />} label="Billing" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
          <NavItem icon={<Settings size={20} />} label="Menu Settings" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Payment Success Animation Overlay */}
        {paymentSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-600/90 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="text-center text-white scale-in-center">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                <CheckCircle2 size={80} className="text-emerald-600" />
              </div>
              <h1 className="text-5xl font-black mb-2 tracking-tighter">PAYMENT SUCCESSFUL</h1>
              <p className="text-emerald-100 text-xl font-medium">Table has been cleared. Bill printed.</p>
            </div>
          </div>
        )}

        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-sm text-slate-500 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 border rounded-xl text-sm transition-all w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          
          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="h-full flex flex-col lg:flex-row p-6 gap-6">
              <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                <section>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" /> Seating Area
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {TABLES.map(t => {
                      const status = getTableStatus(t);
                      const isSelected = selectedTable === t;
                      return (
                        <button 
                          key={t}
                          onClick={() => { setSelectedTable(t); setCart([]); }}
                          className={`relative h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${isSelected ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-500/10' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                        >
                          <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>T-{t}</span>
                          <div className={`w-2 h-2 rounded-full ${status === 'AVAILABLE' ? 'bg-emerald-500' : status === 'READY' ? 'bg-indigo-500 animate-pulse' : 'bg-rose-500'}`} />
                        </button>
                      );
                    })}
                  </div>
                </section>

                {selectedTable ? (
                  <section className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full" /> Menu Selection
                      </h3>
                      <div className="flex gap-2">
                        {CATEGORIES.map(cat => (
                          <button 
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border ${activeCategory === cat.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                          >
                            {cat.icon} {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {menu
                        .filter(m => activeCategory === 'all' || m.category === activeCategory)
                        .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(item => (
                        <Card key={item.id} className="group hover:border-indigo-300 transition-colors">
                          <div className="p-4 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.name}</h4>
                              <span className="text-emerald-600 font-bold">₹{item.price}</span>
                            </div>
                            <p className="text-xs text-slate-400 mb-4 line-clamp-2 italic">{item.description}</p>
                            <Button variant="secondary" size="sm" className="mt-auto w-full group-hover:bg-indigo-600 group-hover:text-white" onClick={() => addToCart(item)}>
                              <Plus size={14} /> Add
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-white/50">
                    <Utensils size={48} className="mb-4 opacity-20" />
                    <p className="font-medium">Select a table to start</p>
                  </div>
                )}
              </div>

              <aside className="w-full lg:w-96 bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-lg">{selectedTable ? `Table ${selectedTable}` : 'No Selection'}</h3>
                  {currentOrder && <Badge status="OPEN" />}
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {cart.length > 0 && (
                    <div className="animate-in slide-in-from-right-4">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">New Selection</p>
                      <div className="space-y-4">
                        {cart.map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                                <button onClick={() => removeFromCart(item.itemId)} className="p-1 hover:text-rose-500"><Minus size={12} /></button>
                                <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                                <button onClick={() => addToCart({ id: item.itemId, name: item.name, price: item.price } as MenuItem)} className="p-1 hover:text-indigo-500"><Plus size={12} /></button>
                              </div>
                              <p className="text-sm font-bold text-slate-800">{item.name}</p>
                            </div>
                            <span className="text-sm font-bold text-slate-700">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                  <Button className="w-full h-14 text-lg" disabled={cart.length === 0} onClick={placeOrder}>Confirm Order</Button>
                </div>
              </aside>
            </div>
          )}

          {/* TAB: KITCHEN (With Integrated Menu Manager) */}
          {activeTab === 'kitchen' && (
            <div className="h-full p-8 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black tracking-tighter">KITCHEN BOARD</h1>
                <Button variant={showMenuManager ? 'secondary' : 'primary'} onClick={() => setShowMenuManager(!showMenuManager)}>
                  <LayoutGrid size={18} /> {showMenuManager ? 'View Orders' : 'Manage Food Items'}
                </Button>
              </div>

              {!showMenuManager ? (
                <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
                  {orders.filter(o => o.status === 'OPEN').map(order => (
                    <div key={order.id} className="w-80 shrink-0 flex flex-col bg-white rounded-3xl shadow-lg border overflow-hidden">
                      <div className="p-4 bg-indigo-600 text-white flex justify-between">
                        <h4 className="font-black text-xl">Table {order.tableNumber}</h4>
                        <span className="text-[10px] font-mono opacity-60 pt-2">#{order.id.slice(-4)}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between group">
                            <span className={`font-bold ${item.status === 'FINISHED' ? 'line-through text-slate-300' : ''}`}>{item.quantity}x {item.name}</span>
                            <div className="flex gap-1">
                              {item.status !== 'FINISHED' && (
                                <button onClick={() => updateStatus(order.id, idx, item.status === 'ORDERED' ? 'PREPARING' : 'FINISHED')} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                  {item.status === 'ORDERED' ? <ChefHat size={16} /> : <CheckCircle2 size={16} />}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 bg-white rounded-3xl p-8 border shadow-sm flex flex-col overflow-hidden">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Sparkles className="text-indigo-500" /> Menu Management</h2>
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <input className="p-3 border rounded-xl" placeholder="Food Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    <input className="p-3 border rounded-xl" placeholder="Price (₹)" type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                    <select className="p-3 border rounded-xl" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Button onClick={handleAddItem}>Add Item to Menu</Button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b">
                        <tr><th className="p-4">Item</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4 text-right">Action</th></tr>
                      </thead>
                      <tbody>
                        {menu.map(item => (
                          <tr key={item.id} className="border-b hover:bg-slate-50">
                            <td className="p-4 font-bold">{item.name}</td>
                            <td className="p-4 uppercase text-xs font-black text-slate-400">{item.category}</td>
                            <td className="p-4">₹{item.price}</td>
                            <td className="p-4 text-right"><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', COLLECTIONS.MENU, item.id))} className="text-rose-500 p-2"><Trash2 size={18} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: BILLING */}
          {activeTab === 'billing' && (
            <div className="h-full flex flex-col md:flex-row bg-slate-100 overflow-hidden">
               <div className="w-full md:w-80 bg-white border-r overflow-y-auto">
                  <div className="p-6 border-b">
                    <h3 className="font-bold text-lg text-slate-800">Ready for Billing</h3>
                  </div>
                  {orders.filter(o => o.status === 'OPEN').map(o => (
                    <button key={o.id} onClick={() => setSelectedTable(o.tableNumber)} className={`w-full p-6 text-left border-b transition-all ${selectedTable === o.tableNumber ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}>
                      <div className="flex justify-between font-black">
                        <span>Table {o.tableNumber}</span>
                        <span className="text-indigo-600">₹{o.total.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
               </div>
               <div className="flex-1 p-12 flex flex-col items-center overflow-y-auto">
                  {currentOrder ? (
                    <div className="w-full max-w-lg space-y-6">
                       <Button className="w-full h-16 text-xl shadow-2xl" loading={isPrinting} onClick={() => collectPayment(currentOrder.id)}>
                         <Printer size={24} /> Collect Payment & Print
                       </Button>
                       <Card className="p-10 font-mono shadow-2xl">
                          <div className="text-center mb-8"><h1 className="text-4xl font-black tracking-tighter">RestoKitchen</h1></div>
                          <div className="border-y border-dashed py-4 mb-4 flex justify-between text-xs">
                             <span>T-{currentOrder.tableNumber}</span><span>{new Date().toLocaleString()}</span>
                          </div>
                          <table className="w-full mb-8">
                            {currentOrder.items.map((it, i) => (
                              <tr key={i}><td className="py-2">{it.name} x{it.quantity}</td><td className="text-right">₹{it.price * it.quantity}</td></tr>
                            ))}
                          </table>
                          <div className="border-t-2 pt-4 font-black text-2xl flex justify-between">
                            <span>TOTAL</span><span>₹{currentOrder.total.toFixed(2)}</span>
                          </div>
                       </Card>
                    </div>
                  ) : (
                    <div className="mt-20 text-slate-300 text-center"><Receipt size={100} className="opacity-10 mx-auto mb-4" /><p className="text-2xl font-black">Select an active table</p></div>
                  )}
               </div>
            </div>
          )}

          {/* TAB: MENU SETTINGS (Redirected or shared with Kitchen Manager) */}
          {activeTab === 'menu' && (
            <div className="p-12 h-full flex items-center justify-center">
              <div className="text-center">
                <ChefHat size={80} className="mx-auto text-indigo-200 mb-6" />
                <h1 className="text-3xl font-black mb-4">Master Menu Settings</h1>
                <p className="text-slate-500 mb-8">Menu items are now managed directly from the Kitchen section for faster workflow.</p>
                <Button onClick={() => setActiveTab('kitchen')}>Go to Kitchen Manager</Button>
              </div>
            </div>
          )}

        </div>
      </main>
      
      <style>{`
        .scale-in-center { animation: scale-in-center 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
        @keyframes scale-in-center {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 group ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
  >
    <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className="hidden lg:block font-semibold text-sm">{label}</span>
  </button>
);
