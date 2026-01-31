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
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col ${className}`}>
      <div className="p-4 md:p-6 bg-brand-light border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800">My Cart</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {table ? `Order for ${table}` : 'Select a table to order'}
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-2 bg-white rounded-full text-gray-500 hover:text-gray-800 shadow-sm border border-gray-200"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 md:p-6 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-3">🛒</div>
            <p>Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6 pr-2 custom-scrollbar">
            {items.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
                     🍽️
                   </div>
                   <div>
                     <p className="font-medium text-gray-800 text-sm line-clamp-2">{item.name}</p>
                     <p className="text-xs text-gray-500">₹{item.price} x {item.qty}</p>
                   </div>
                </div>
                <p className="font-bold text-gray-800 text-sm whitespace-nowrap">₹{item.price * item.qty}</p>
              </div>
            ))}
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onPaymentMethodChange('cash')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-green-50 border-brand-primary text-brand-primary ring-1 ring-brand-primary'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>💵</span>
              <span className="text-sm font-medium">Cash</span>
            </button>
            <button
              onClick={() => onPaymentMethodChange('upi')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${
                paymentMethod === 'upi'
                  ? 'bg-green-50 border-brand-primary text-brand-primary ring-1 ring-brand-primary'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>📱</span>
              <span className="text-sm font-medium">UPI</span>
            </button>
          </div>
        </div>

        {/* Bill Details */}
        <div className="space-y-2 border-t border-gray-100 pt-4 mb-6">
          <div className="flex justify-between text-sm text-gray-600">
            <span>MRP Total</span>
            <span>₹{totalPrice + savings}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Savings</span>
            <span>- ₹{savings}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-100 mt-2">
            <span>Total</span>
            <span>₹{finalTotal}</span>
          </div>
        </div>

        <Button 
          onClick={onPlaceOrder} 
          disabled={isOrdering || items.length === 0 || !table}
          className="w-full py-3"
          size="lg"
        >
          {isOrdering ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
    </div>
  );
};