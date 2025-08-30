import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, ShoppingBag, Phone, Filter, Search, CreditCard, Banknote, Edit, X } from 'lucide-react';
import { Order, OrderResponse } from '../types';
import { ApiService } from '../services/api';
import { EditOrder } from './EditOrder';

interface SalesHistoryProps {}

export const SalesHistory: React.FC<SalesHistoryProps> = () => {
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
    from: '',
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-50 border-green-200';
      case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const handleOrderUpdated = () => {
    loadOrders();
  };

  const handleOrderDeleted = () => {
    loadOrders();
  };

  if (editingOrderId) {
    return (
      <EditOrder
        orderId={editingOrderId}
        onBack={() => setEditingOrderId(null)}
        onOrderUpdated={handleOrderUpdated}
        onOrderDeleted={handleOrderDeleted}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sales History</h1>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sales History</h1>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            >
              <option value="">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-600">₹{analytics.totalRevenue.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Profit</p>
              <p className="text-2xl font-bold text-green-600">₹{analytics.totalProfit.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.totalOrders}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Order</p>
              <p className="text-2xl font-bold text-orange-600">₹{analytics.avgOrderPrice.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-2">No orders found</p>
          <p className="text-gray-400">Start selling to see your history here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{formatDate(order.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                  <div className="flex items-center space-x-1">
                    {order.paymentMethod === 'UPI' ? (
                      <CreditCard className="h-3 w-3 text-blue-600" />
                    ) : (
                      <Banknote className="h-3 w-3 text-green-600" />
                    )}
                    <span className="text-xs text-gray-500">{order.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {order.customerPhone && (
                <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                  <Phone className="h-3 w-3" />
                  <span>{order.customerPhone}</span>
                </div>
              )}
              
              <div className="mb-3">
                <h3 className="font-medium text-gray-900 mb-2">Items:</h3>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {typeof item.product === 'object' ? item.product.name : 'Product'} × {item.qty}
                      </span>
                      <span className="text-gray-600">₹{item.subtotal || (item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.notes && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
              
              <div className="border-t pt-3 space-y-2">
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-red-600">-₹{order.discount}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-gray-900">₹{order.total}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Profit:</span>
                  <span className="font-semibold text-green-600">₹{order.profit}</span>
                </div>
                
                {order.paymentStatus !== 'CANCELLED' && (
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => setEditingOrderId(order._id)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <X className="h-3 w-3" />
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
  );
};