import React from 'react';
import { OrderItemPayload } from '../types';
import { Button } from './Button';

interface CartSidebarProps {
  items: OrderItemPayload[];
  totalPrice: number;
  table: string;
  onPlaceOrder: () => void;
  isOrdering: boolean;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onClose?: () => void;
  className?: string;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  items,
  totalPrice,
  table,
  onPlaceOrder,
  isOrdering,
  paymentMethod,
  onPaymentMethodChange,
  onClose,
  className = ''
}) => {
  const deliveryFee = 0;
  const savings = Math.round(totalPrice * 0.1); // Simulated savings
  const finalTotal = totalPrice; // Assuming price includes GST for display simplicity

  return (
    <div className={`bg-white rounded-2xl shadow-card border border-brand-border/50 overflow-hidden flex flex-col h-full ${className}`}>
      <div className="p-4 md:p-6 bg-brand-background/50 backdrop-blur-sm border-b border-brand-border flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-lg md:text-xl font-bold font-serif text-brand-text">My Cart</h2>
          <p className="text-xs md:text-sm text-brand-muted mt-0.5">
            {table ? (
              <span className="font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                Table {table}
              </span>
            ) : (
              <span className="text-orange-500 animate-pulse">Select a table to order</span>
            )}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 bg-white rounded-full text-brand-muted hover:text-brand-text shadow-sm border border-brand-border hover:bg-gray-50 transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-brand-muted/50">
            <div className="text-6xl mb-4 opacity-50 grayscale">🛒</div>
            <p className="font-medium">Your cart is empty</p>
            <p className="text-sm mt-1">Add items to get started</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {items.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="flex items-start gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-brand-background flex items-center justify-center text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  🍽️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-brand-text text-sm line-clamp-2 leading-tight">{item.name}</p>
                    <p className="font-bold text-brand-primary text-sm whitespace-nowrap ml-2">₹{item.price * item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-brand-muted">
                    <span className="bg-white border border-brand-border px-1.5 py-0.5 rounded text-xs font-mono">x{item.qty}</span>
                    <span>@ ₹{item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-brand-muted uppercase mb-3 tracking-wider">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onPaymentMethodChange('cash')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 ${paymentMethod === 'cash'
                  ? 'bg-brand-primary/10 border-brand-primary text-brand-primary ring-1 ring-brand-primary shadows-sm'
                  : 'bg-white border-brand-border text-brand-muted hover:bg-brand-background hover:border-brand-primary/30'
                }`}
            >
              <span className="text-xl">💵</span>
              <span className="text-sm font-bold">Cash</span>
            </button>
            <button
              onClick={() => onPaymentMethodChange('upi')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 ${paymentMethod === 'upi'
                  ? 'bg-brand-primary/10 border-brand-primary text-brand-primary ring-1 ring-brand-primary shadow-sm'
                  : 'bg-white border-brand-border text-brand-muted hover:bg-brand-background hover:border-brand-primary/30'
                }`}
            >
              <span className="text-xl">📱</span>
              <span className="text-sm font-bold">UPI</span>
            </button>
          </div>
        </div>

        {/* Bill Details */}
        <div className="space-y-3 bg-brand-background/50 p-4 rounded-xl border border-brand-border/50 mb-6">
          <div className="flex justify-between text-sm text-brand-muted">
            <span>Subtotal</span>
            <span>₹{totalPrice + savings}</span>
          </div>
          <div className="flex justify-between text-sm text-brand-secondary font-medium">
            <span>Discount (10%)</span>
            <span>- ₹{savings}</span>
          </div>
          <div className="flex justify-between text-sm text-brand-muted">
            <span>Delivery Fee</span>
            <span className="text-brand-primary font-bold">{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-brand-text pt-3 border-t border-brand-border/50 mt-1">
            <span>Total Payable</span>
            <span className="text-brand-primary">₹{finalTotal}</span>
          </div>
        </div>

        <Button
          onClick={onPlaceOrder}
          disabled={isOrdering || items.length === 0 || !table}
          className="w-full py-3.5 text-base shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all rounded-xl"
          size="lg"
        >
          {isOrdering ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : 'Place Order'}
        </Button>
      </div>
    </div>
  );
};