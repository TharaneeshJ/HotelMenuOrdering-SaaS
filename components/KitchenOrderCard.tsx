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
  const elapsedMinutes = useMemo(() => {
    const createdTime = new Date(order.created_at);
    return Math.floor((Date.now() - createdTime.getTime()) / 60000);
  }, [order.created_at]);

  const items = useMemo(() => {
    return parseKitchenItems(order.items);
  }, [order.items]);

  const isLate = elapsedMinutes > 25 && order.status !== 'SERVED';

  const getStatusColor = () => {
    switch (order.status) {
      case 'PENDING': return 'border-l-4 border-red-500';
      case 'COOKING': return 'border-l-4 border-amber-500';
      case 'READY': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const getActionButtonConfig = () => {
    if (isUpdating) {
      return { label: 'Updating...', nextStatus: order.status, className: 'bg-brand-muted/20 text-brand-muted cursor-wait' };
    }
    switch (order.status) {
      case 'PENDING':
        return { label: 'Start', nextStatus: 'COOKING' as OrderStatus, className: 'bg-brand-primary text-white hover:bg-brand-text' };
      case 'COOKING':
        return { label: 'Ready', nextStatus: 'READY' as OrderStatus, className: 'bg-brand-text text-white hover:bg-black' };
      case 'READY':
        return { label: 'Serve', nextStatus: 'SERVED' as OrderStatus, className: 'bg-brand-muted/10 text-brand-text hover:bg-brand-muted/20 border border-brand-border' };
      default: return null;
    }
  };

  const actionConfig = getActionButtonConfig();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-brand-border hover:shadow-md transition-all p-4 ${getStatusColor()} ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Table</span>
          <p className="text-2xl font-serif font-bold text-brand-text leading-none mt-0.5">{order.table}</p>
        </div>
        <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${isLate ? 'bg-red-50 text-red-600' : 'bg-brand-background text-brand-muted'}`}>
          {elapsedMinutes}m
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm items-start">
            <span className="text-brand-text font-medium leading-tight">{item.name}</span>
            <span className="text-xs font-bold bg-brand-background px-1.5 py-0.5 rounded border border-brand-border ml-2">x{item.qty}</span>
          </div>
        ))}
      </div>

      {actionConfig && (
        <button
          onClick={() => onStatusUpdate(order.order_id, actionConfig.nextStatus)}
          disabled={isUpdating}
          className={`w-full py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-colors ${actionConfig.className}`}
        >
          {actionConfig.label}
        </button>
      )}
    </div>
  );
};