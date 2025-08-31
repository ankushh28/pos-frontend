import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, ShoppingBag, Phone, Filter, CreditCard, Banknote, Edit, X } from 'lucide-react';
import { Order } from '../types';
import { ApiService } from '../services/api';
import { EditOrder } from './EditOrder';

export const SalesHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgOrderPrice: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    paymentStatus: '' as '' | 'PENDING' | 'PAID' | 'CANCELLED',
    from: new Date().toISOString().split('T')[0],
    to: ''
  });
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const response = await ApiService.getAllOrders(params);
      if (response.orders) {
        setOrders(response.orders);
        setAnalytics(response.analytics);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID': return 'status-paid';
      case 'PENDING': return 'status-pending';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Inventory will be restored.')) {
      return;
    }

    try {
      await ApiService.cancelOrder(orderId);
      alert('Order cancelled successfully');
      loadOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order');
    }
  };

  if (editingOrderId) {
    return (
      <EditOrder
        orderId={editingOrderId}
        onBack={() => setEditingOrderId(null)}
        onOrderUpdated={loadOrders}
        onOrderDeleted={loadOrders}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="font-display text-2xl font-semibold text-gray-900">Sales History</h1>
          <p className="text-accent-400 text-sm mt-1">{analytics.totalOrders} total orders</p>
        </div>
      </div>

      <div className="p-6 pb-24">
        {/* Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent-400 text-sm mb-1">Revenue</p>
                <p className="font-display text-2xl font-semibold text-gray-900">₹{analytics.totalRevenue.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-2xl">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent-400 text-sm mb-1">Profit</p>
                <p className="font-display text-2xl font-semibold text-green-600">₹{analytics.totalProfit.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent-400 text-sm mb-1">Orders</p>
                <p className="font-display text-2xl font-semibold text-gray-900">{analytics.totalOrders}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-2xl">
                <ShoppingBag className="h-6 w-6 text-secondary/80" />
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent-400 text-sm mb-1">Avg Order</p>
                <p className="font-display text-2xl font-semibold text-gray-900">₹{analytics.avgOrderPrice.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-accent-100 rounded-2xl">
                <Calendar className="h-6 w-6 text-accent-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-accent-400 mr-2" />
            <h3 className="font-display font-medium text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
              className="input-fieldIcon"
            >
              <option value="">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
              className="input-fieldIcon"
              placeholder="From date"
            />
            
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
              className="input-fieldIcon"
              placeholder="To date"
            />
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 rounded-3xl mb-6">
              <ShoppingBag className="h-8 w-8 text-accent-400" />
            </div>
            <h3 className="font-display text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-accent-400">Start selling to see your history here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div key={order._id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-accent-400" />
                    <span className="text-sm text-accent-600">{formatDate(order.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusStyle(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                    {order.paymentMethod === 'UPI' ? (
                      <CreditCard className="h-4 w-4 text-primary" />
                    ) : (
                      <Banknote className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>

                {order.customerPhone && (
                  <div className="flex items-center space-x-2 text-sm text-accent-600 mb-4">
                    <Phone className="h-4 w-4" />
                    <span>{order.customerPhone}</span>
                  </div>
                )}
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-accent-600">
                          {item.product && typeof item.product === 'object'
                            ? item.product.name
                            : 'Product'} × {item.qty}
                        </span>
                        <span className="font-medium">
                          ₹{item.subtotal || (item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-accent-600">{order.notes}</p>
                  </div>
                )}
                
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-accent-600">Discount</span>
                      <span className="text-primary font-medium">-₹{order.discount}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-accent-600">Total</span>
                    <span className="font-display font-semibold text-xl text-gray-900">₹{order.total}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-accent-600">Profit</span>
                    <span className="font-semibold text-green-600">₹{order.profit}</span>
                  </div>
                  
                  {order.paymentStatus !== 'CANCELLED' && (
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={() => setEditingOrderId(order._id)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-accent-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};