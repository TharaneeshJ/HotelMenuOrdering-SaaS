import React, { useState, useMemo, useCallback } from 'react';
import { MENU_ITEMS, CATEGORIES } from './constants';
import { MenuItem, OrderPayload, OrderResponse } from './types';
import { submitOrder } from './services/orderService';
import { TableSelector } from './components/TableSelector';
import { MenuItemCard } from './components/MenuItemCard';
import { CartSidebar } from './components/CartSidebar';
import { CategoryFilter } from './components/CategoryFilter';
import { KitchenDashboard } from './components/KitchenDashboard';

// Success Modal
const SuccessModal: React.FC<{ response: OrderResponse; onClose: () => void }> = ({ response, onClose }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-brand-primary"></div>
      
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
      <p className="text-gray-500 mb-8">Your food is being prepared. <br/>Order ID: <span className="font-mono font-bold text-gray-800">{response.order_id}</span></p>
      
      <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left text-sm border border-gray-100">
         <div className="flex justify-between mb-2">
            <span className="text-gray-500">Table</span>
            <span className="font-bold text-gray-800">{response.table}</span>
         </div>
         <div className="flex justify-between">
            <span className="text-gray-500">Amount to Pay</span>
            <span className="font-bold text-brand-accent text-lg">₹{response.total}</span>
         </div>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors shadow-lg shadow-green-900/20"
      >
        Order More Items
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [showKitchen, setShowKitchen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMobileCart, setShowMobileCart] = useState<boolean>(false);
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  
  // Navigation State
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Derived State
  const { totalItems, totalPrice, orderItems } = useMemo(() => {
    let count = 0;
    let price = 0;
    const items = [];

    for (const [id, qty] of Object.entries(cart)) {
      if (qty > 0) {
        const item = MENU_ITEMS.find((i) => i.id === id);
        if (item) {
          count += qty;
          price += item.price * qty;
          items.push({ name: item.name, price: item.price, qty });
        }
      }
    }
    return { totalItems: count, totalPrice: price, orderItems: items };
  }, [cart]);

  // Handlers
  const handleIncrement = useCallback((item: MenuItem) => {
    setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
  }, []);

  const handleDecrement = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const currentQty = prev[item.id] || 0;
      if (currentQty <= 0) return prev;
      const newCart = { ...prev, [item.id]: currentQty - 1 };
      if (newCart[item.id] === 0) delete newCart[item.id];
      return newCart;
    });
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      setError('Please select a table number first.');
      setShowMobileCart(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (totalItems === 0) {
      setError('Your cart is empty.');
      return;
    }

    setIsPlacingOrder(true);
    setError(null);

    const payload: OrderPayload = { 
      table: selectedTable, 
      items: orderItems,
      payment_method: paymentMethod 
    };

    try {
      const response = await submitOrder(payload);
      setOrderResult(response);
      setShowMobileCart(false); // Close mobile cart on success
    } catch (err) {
      setError('Failed to place order. Try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleReset = () => {
    setCart({});
    setOrderResult(null);
    setError(null);
    setShowMobileCart(false);
  };

  // Filter Items
  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  if (showKitchen) {
    return (
      <div className="min-h-screen bg-gray-50">
        <button 
          onClick={() => setShowKitchen(false)}
          className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl font-bold hover:bg-black transition-all border border-gray-700 flex items-center gap-2"
          title="Exit Kitchen Mode"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Menu
        </button>
        <KitchenDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          
          {/* Logo & Table Select */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-2" onClick={() => setShowKitchen(true)} style={{ cursor: 'pointer' }}>
               <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center text-xl font-bold text-white shrink-0">AH</div>
               <div className="shrink-0">
                 <h1 className="text-lg font-bold leading-none">Amman</h1>
                 <span className="text-xs text-brand-accent font-medium">Hotel</span>
               </div>
            </div>
            <div className="md:hidden flex-1 flex justify-end">
              <TableSelector selectedTable={selectedTable} onSelect={(t) => { setSelectedTable(t); setError(null); }} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 w-full md:max-w-xl relative">
            <input 
              type="text" 
              placeholder="Search for biryani, parotta..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-xl py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 md:left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          {/* Desktop Table Select & Kitchen Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <TableSelector selectedTable={selectedTable} onSelect={(t) => { setSelectedTable(t); setError(null); }} />
            <button 
              onClick={() => setShowKitchen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-brand-primary to-green-700 text-white rounded-lg hover:shadow-lg hover:shadow-green-900/30 text-xs font-bold border border-green-700 transition-all flex items-center gap-2"
              title="Switch to Kitchen View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              KITCHEN
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            
            {/* Hero Banner */}
            <div className="bg-brand-secondary rounded-3xl p-6 md:p-10 mb-6 md:mb-8 flex items-center justify-between relative overflow-hidden shadow-sm">
               <div className="relative z-10 max-w-xl">
                 <span className="inline-block bg-brand-dark text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full mb-3">Authentic Flavors</span>
                 <h2 className="text-4xl md:text-6xl font-bold text-brand-dark mb-2 md:mb-4 leading-tight font-handwritten tracking-wide">
                   Tasty Deals <br/> <span className="text-white">Up to 20% Off!</span>
                 </h2>
                 <p className="text-brand-dark/80 mb-4 md:mb-6 text-sm md:text-base font-medium">Enjoy our special Parottas and Spicy Curries.</p>
                 <button onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })} className="bg-brand-dark text-white px-6 py-2 md:px-8 md:py-3 rounded-xl text-sm md:text-base font-bold hover:bg-black transition-colors">
                   Order Now
                 </button>
               </div>
               
               {/* Decorative Circles */}
               <div className="absolute -right-10 -bottom-20 w-48 h-48 md:w-64 md:h-64 bg-white/20 rounded-full blur-2xl"></div>
               <div className="absolute right-10 md:right-20 top-10 w-20 h-20 md:w-32 md:h-32 bg-brand-primary/20 rounded-full blur-xl"></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 animate-pulse">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Category Filter Component */}
            <CategoryFilter 
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />

            {/* Products Grid */}
            <div className="mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                {activeCategory === 'All' ? 'Popular Dishes' : activeCategory}
                <span className="text-xs md:text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredItems.length}</span>
              </h3>
              
              {filteredItems.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-lg">No items found matching your search.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                  {filteredItems.map(item => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantity={cart[item.id] || 0}
                      onIncrement={handleIncrement}
                      onDecrement={handleDecrement}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar (Cart) - Desktop */}
          <div className="hidden lg:block w-96 shrink-0">
            <CartSidebar 
              className="sticky top-24"
              items={orderItems} 
              totalPrice={totalPrice}
              table={selectedTable}
              onPlaceOrder={handlePlaceOrder}
              isOrdering={isPlacingOrder}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
            />
          </div>

        </div>
      </div>

      {/* Mobile Sticky Cart Summary */}
      {totalItems > 0 && !showMobileCart && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="bg-brand-dark text-white rounded-xl shadow-2xl p-4 flex items-center justify-between border border-gray-700 cursor-pointer" onClick={() => setShowMobileCart(true)}>
             <div className="flex flex-col">
               <span className="text-xs text-gray-400">{totalItems} items</span>
               <span className="font-bold text-xl">₹{totalPrice}</span>
             </div>
             <button 
               onClick={(e) => { e.stopPropagation(); setShowMobileCart(true); }}
               className="bg-brand-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-green-800 active:scale-95 transition-all"
             >
               View Cart
             </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Modal/Sheet */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileCart(false)}
          ></div>
          
          {/* Slide-up Content */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
             <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col h-full">
                <CartSidebar 
                  items={orderItems} 
                  totalPrice={totalPrice}
                  table={selectedTable}
                  onPlaceOrder={handlePlaceOrder}
                  isOrdering={isPlacingOrder}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                  onClose={() => setShowMobileCart(false)}
                  className="border-none shadow-none rounded-none h-full"
                />
             </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {orderResult && (
        <SuccessModal response={orderResult} onClose={handleReset} />
      )}
    </div>
  );
};

export default App;