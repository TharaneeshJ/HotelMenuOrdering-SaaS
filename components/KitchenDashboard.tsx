import React, { useState, useEffect } from 'react';
import { KitchenOrder, OrderStatus } from '../types';
import { KitchenOrderCard } from './KitchenOrderCard';
import { getKitchenOrders, updateOrderStatus } from '../services/orderService';
import { API_CONFIG, API_ENDPOINTS } from '../config';

interface StatusColumn {
  status: OrderStatus;
  title: string;
}

const STATUS_COLUMNS: StatusColumn[] = [
  { status: 'PENDING', title: 'New Orders' },
  { status: 'COOKING', title: 'Preparation' },
  { status: 'READY', title: 'Ready to Serve' },
];

export const KitchenDashboard: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const fetchOrders = async () => {
    try {
      const data = await getKitchenOrders();
      setOrders(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(message);
      console.error('[KitchenDashboard] Error:', message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(fetchOrders, API_CONFIG.POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    if (updatingIds.has(orderId)) return;

    setUpdatingIds(prev => new Set(prev).add(orderId));
    const previousOrders = [...orders];

    // Optimistic update
    setOrders(prev =>
      prev.map(order =>
        order.order_id === orderId ? { ...order, status: newStatus } : order
      )
    );

    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (!success) {
        // Revert on failure
        setOrders(previousOrders);
        setError(`Failed to update order ${orderId}`);
      } else {
        // Refresh to sync with server
        await fetchOrders();
      }
    } catch (err) {
      // Revert on error
      setOrders(previousOrders);
      const message = err instanceof Error ? err.message : 'Update failed';
      setError(message);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const getOrdersByStatus = (status: OrderStatus) =>
    orders.filter(o => o.status === status);

  const servedOrders = getOrdersByStatus('SERVED');

  const Column: React.FC<{ col: StatusColumn }> = ({ col }) => {
    const columnOrders = getOrdersByStatus(col.status);
    const count = columnOrders.length;

    return (
      <div className="flex flex-col h-full bg-brand-surface rounded-xl border border-brand-border/50 overflow-hidden shadow-soft">
        {/* Column Header */}
        <div className="p-4 border-b border-brand-border bg-brand-surface">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-brand-muted">{col.title}</h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${count > 0 ? 'bg-brand-primary text-white border-brand-primary' : 'bg-brand-background text-brand-muted border-brand-border'}`}>
              {count}
            </span>
          </div>
        </div>

        {/* Column Body */}
        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar bg-brand-background/30">
          {loading && orders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-muted mx-auto mb-2"></div>
                <p className="text-xs text-brand-muted uppercase tracking-wide">Loading...</p>
              </div>
            </div>
          ) : columnOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center text-brand-muted/30">
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-widest">No orders</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {columnOrders.map(order => (
                <KitchenOrderCard
                  key={order.order_id}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                  isUpdating={updatingIds.has(order.order_id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-background p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-border pb-6">
        <div className="flex items-start gap-4">
          <div className="bg-brand-primary text-white p-3 rounded-lg shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-brand-text leading-none mb-1">Kitchen Display System</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-xs text-brand-muted uppercase tracking-widest font-medium">System Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-text font-mono tracking-tight">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="text-xs text-brand-muted hover:text-brand-primary uppercase tracking-widest font-bold transition-colors flex items-center gap-1 justify-end ml-auto"
            >
              {loading ? 'Syncing...' : 'Sync Now'}
              <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <div>
            <p className="text-sm font-bold text-red-900">Connection Error</p>
            <p className="text-xs text-red-600 font-mono mt-0.5">{error} - Check API Endpoints</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {STATUS_COLUMNS.map(col => (
          <Column key={col.status} col={col} />
        ))}
      </div>
    </div>
  );
};