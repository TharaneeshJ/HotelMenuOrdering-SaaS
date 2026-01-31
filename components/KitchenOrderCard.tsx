import React, { useMemo } from 'react';
import { KitchenOrder, OrderStatus } from '../types';
import { parseKitchenItems } from '../services/orderService';

interface KitchenOrderCardProps {
  order: KitchenOrder;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
  isUpdating?: boolean;
}

export const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
  order,
  onStatusUpdate,
  isUpdating = false,
}) => {
  // Calculate elapsed time
  const elapsedMinutes = useMemo(() => {
    const createdTime = new Date(order.created_at);
    return Math.floor((Date.now() - createdTime.getTime()) / 60000);
  }, [order.created_at]);

  // Parse items from string format
  const items = useMemo(() => {
    return parseKitchenItems(order.items);
  }, [order.items]);

  // Check if order is taking too long (> 25 minutes)
  const isLate = elapsedMinutes > 25 && order.status !== 'SERVED';

  // Status badge styling
  const getStatusBadgeStyle = (): string => {
    switch (order.status) {
      case 'PENDING':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'COOKING':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'READY':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'SERVED':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get next action button config
  const getActionButtonConfig = (): {
    label: string;
    nextStatus: OrderStatus;
    className: string;
  } | null => {
    if (isUpdating) {
      return {
        label: 'Updating...',
        nextStatus: order.status,
        className: 'bg-gray-200 text-gray-500 cursor-wait',
      };
    }

    switch (order.status) {
      case 'PENDING':
        return {
          label: 'Start Cooking',
          nextStatus: 'COOKING',
          className:
            'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 active:scale-95',
        };
      case 'COOKING':
        return {
          label: 'Mark Ready',
          nextStatus: 'READY',
          className:
            'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 active:scale-95',
        };
      case 'READY':
        return {
          label: 'Completed',
          nextStatus: 'SERVED',
          className:
            'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30 active:scale-95',
        };
      case 'SERVED':
        return null; // No action for served orders
      default:
        return null;
    }
  };

  const actionConfig = getActionButtonConfig();

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden ${
        isUpdating ? 'opacity-75 pointer-events-none' : ''
      } ${isLate ? 'ring-2 ring-red-300' : ''}`}
    >
      {/* Header: Order ID & Timer */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          #{order.order_id.slice(-5)}
        </span>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
            isLate
              ? 'bg-red-100 text-red-600 animate-pulse'
              : 'bg-blue-50 text-blue-600'
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{elapsedMinutes}m</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Table Number - Large */}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Table
            </p>
            <p className="text-4xl font-black text-gray-900 leading-none">{order.table}</p>
          </div>

          {/* Status Badge */}
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide ${getStatusBadgeStyle()}`}
          >
            {order.status}
          </div>
        </div>

        {/* Items List */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Items
          </p>
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0"></span>
                  {item.name}
                </span>
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-bold border border-gray-200">
                  x{item.qty}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Order Total */}
        <div className="mb-4 p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Total
          </span>
          <span className="text-lg font-bold text-gray-900">₹{order.total}</span>
        </div>

        {/* Action Button */}
        {actionConfig && (
          <button
            onClick={() => onStatusUpdate(order.order_id, actionConfig.nextStatus)}
            disabled={isUpdating}
            className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${actionConfig.className}`}
          >
            {actionConfig.label}
          </button>
        )}

        {/* Served - No more actions */}
        {order.status === 'SERVED' && (
          <div className="w-full py-3 px-4 rounded-lg font-bold text-sm bg-gray-100 text-gray-500 text-center cursor-default">
            Order Completed
          </div>
        )}
      </div>
    </div>
  );
};