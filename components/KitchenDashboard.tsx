import React, { useState, useEffect } from 'react';
import { KitchenOrder, OrderStatus } from '../types';
import { KitchenOrderCard } from './KitchenOrderCard';
import { getKitchenOrders, updateOrderStatus } from '../services/orderService';
import { API_CONFIG } from '../config';

interface StatusColumn {
  status: OrderStatus;
  title: string;
  color: string;
}

const STATUS_COLUMNS: StatusColumn[] = [
  { status: 'PENDING', title: 'New Orders', color: 'from-red-50 to-red-50' },
  { status: 'COOKING', title: 'In Kitchen', color: 'from-amber-50 to-amber-50' },
  { status: 'READY', title: 'Ready to Serve', color: 'from-green-50 to-green-50' },
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

  const Column: React.FC<{ col: StatusColumn }> = ({ col }) => {
    const columnOrders = getOrdersByStatus(col.status);
    const count = columnOrders.length;

    return (
      <div className="flex flex-col h-full">
        {/* Column Header */}
        <div className="mb-4 px-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800">{col.title}</h2>
            <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full font-bold">
              {count}
            </span>
          </div>
          <div className="h-1 bg-gradient-to-r from-current to-transparent opacity-20"></div>
        </div>

        {/* Column Body */}
        <div className={`flex-1 bg-gradient-to-b ${col.color} rounded-xl p-3 overflow-y-auto custom-scrollbar border border-gray-200 shadow-sm`}>
          {loading && orders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                <p className="text-xs text-gray-400">Loading...</p>
              </div>
            </div>
          ) : columnOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-300">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-xs font-medium">No {col.title.toLowerCase()}</p>
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">
      {/* Header */}
      <header className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-primary to-green-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Kitchen Monitor</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Live Feed</p>
              </div>
            </div>
          </div>

            <div className="flex flex-col md:items-end">
              <div className="flex items-center gap-3">
                <button 
                  onClick={fetchOrders}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-brand-primary transition-colors disabled:opacity-50"
                  title="Refresh Orders"
                >
                  <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div className="text-3xl font-bold text-gray-800 tabular-nums">
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Last Updated</p>
            </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 5v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5a1 1 0 011-1h2a1 1 0 00-.894.553H7a9 9 0 018 0h.894A1 1 0 0117 4h2a1 1 0 011 1zm-5-1H7v1h6V4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">Check if n8n webhook is running at http://localhost:5678</p>
            </div>
          </div>
        )}
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[calc(100vh-250px)]">
        {STATUS_COLUMNS.map(col => (
          <Column key={col.status} col={col} />
        ))}
      </div>
    </div>
  );
};