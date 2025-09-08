import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, TrendingUp, ShoppingBag, Phone, CreditCard, Banknote, Edit, X, Search, FileText } from 'lucide-react';
import { Order } from '../types';
import { ApiService } from '../services/api';
import { EditOrder } from './EditOrder';
import { Loader } from './ui/Loader';
import { ErrorBanner } from './ui/ErrorBanner';
import { useToast } from './ui/Toast';
import { InvoiceGenerator } from '../utils/invoiceGenerator';

export const SalesHistory: React.FC = () => {
  const { show } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgOrderPrice: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState(() => {
    const sp = new URLSearchParams(window.location.search);
    return {
      paymentStatus: (sp.get('paymentStatus') as '' | 'PENDING' | 'PAID' | 'CANCELLED') || '',
      from: sp.get('from') || '',
      to: sp.get('to') || ''
    };
  });
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [page, setPage] = useState(() => parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10) || 1);
  const [pageSize, setPageSize] = useState(() => parseInt(new URLSearchParams(window.location.search).get('pageSize') || '10', 10) || 10);
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'profit'>(() => (new URLSearchParams(window.location.search).get('sortBy') as any) || 'date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => (new URLSearchParams(window.location.search).get('sortDir') as any) || 'desc');
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get('ordersQ') || '');
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  // Push state -> URL and fetch (with abort on change)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    sp.set('sortBy', sortBy);
    sp.set('sortDir', sortDir);
  // Use a dedicated query param for history search and clear global 'q'
  sp.delete('q');
  if (q) sp.set('ordersQ', q); else sp.delete('ordersQ');
    if (filters.paymentStatus) sp.set('paymentStatus', filters.paymentStatus); else sp.delete('paymentStatus');
    if (filters.from) sp.set('from', filters.from); else sp.delete('from');
    if (filters.to) sp.set('to', filters.to); else sp.delete('to');
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);

    const controller = new AbortController();
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await ApiService.getAllOrders({
          paymentStatus: (filters.paymentStatus || undefined) as 'PENDING' | 'PAID' | 'CANCELLED' | undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          page,
          pageSize,
          sortBy,
          sortDir,
        }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response?.orders) {
          setOrders(response.orders);
          setAnalytics(response.analytics || {
            totalOrders: response.orders.length,
            totalProfit: response.orders.reduce((s: number, o: Order) => s + (o.profit || 0), 0),
            totalRevenue: response.orders.reduce((s: number, o: Order) => s + (o.total || 0), 0),
            avgOrderPrice: response.orders.length ? response.orders.reduce((s: number, o: Order) => s + (o.total || 0), 0) / response.orders.length : 0,
          });
          setTotalCount(response.pagination?.totalCount || response.orders.length);
        } else if (Array.isArray(response)) {
          setOrders(response as Order[]);
          setTotalCount((response as Order[]).length);
        } else {
          setOrders([]);
          setTotalCount(0);
        }
      } catch (error: any) {
        if (controller.signal.aborted) return;
        console.error('Failed to load orders:', error);
        setError((error && (error as any).message) || 'Failed to load orders');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [filters, page, pageSize, sortBy, sortDir, q]);

  // loadOrders retained for EditOrder callbacks
  const loadOrders = async () => {
    // Nudge state to trigger the main effect without changing values
    setPage(p => p);
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

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingInvoice(orderId);
    try {
      const invoiceData = await ApiService.getInvoiceData(orderId);
      await InvoiceGenerator.downloadInvoice(orderId, invoiceData);
      show('Invoice generated successfully', { type: 'success' });
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      show('Failed to generate invoice', { type: 'error' });
    } finally {
      setDownloadingInvoice(null);
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

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const filteredOrders = orders.filter((o) => {
    if (!q) return true;
    const ql = q.toLowerCase();
    const idMatch = o._id?.toLowerCase().includes(ql);
    const phoneMatch = (o.customerPhone || '').toLowerCase().includes(ql);
    const itemMatch = o.items?.some((it) => {
      const name = typeof it.product === 'object' ? it.product.name : '';
      return (name || '').toLowerCase().includes(ql);
    });
    return idMatch || phoneMatch || itemMatch;
  });

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
        {isLoading && (
          <div className="mb-4"><Loader label="Loading orders..." /></div>
        )}
        {error && (
          <div className="mb-4"><ErrorBanner message={error} onRetry={() => loadOrders()} /></div>
        )}
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

        {/* Filters – single-line toolbar (scrollable on small screens) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-surface border border-gray-100 rounded-2xl px-3 py-3 overflow-x-auto flex-nowrap whitespace-nowrap">
            {/* Search */}
            <div className="relative flex-1 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400 h-4 w-4" />
              <input
                type="text"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search orders..."
                className="input-fieldIcon pl-10"
                aria-label="Search orders"
              />
            </div>

            {/* Status segmented tabs */}
            <div className="flex items-center gap-1 shrink-0">
              {[
                { label: 'All', value: '' },
                { label: 'Paid', value: 'PAID' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ].map(tab => (
                <button
                  key={tab.label}
                  onClick={() => { setFilters(prev => ({ ...prev, paymentStatus: tab.value as any })); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    filters.paymentStatus === tab.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-surface text-accent-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="date"
                value={filters.from}
                onChange={(e) => { setFilters(prev => ({ ...prev, from: e.target.value })); setPage(1); }}
                className="input-compact"
                aria-label="From date"
              />
              <span className="text-accent-300">–</span>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => { setFilters(prev => ({ ...prev, to: e.target.value })); setPage(1); }}
                className="input-compact"
                aria-label="To date"
              />
            </div>

            {/* Sort */}
            <select
              className="input-compact shrink-0"
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split(':');
                setSortBy(sb as any);
                setSortDir(sd as any);
              }}
              aria-label="Sort orders"
            >
              <option value="date:desc">Newest</option>
              <option value="date:asc">Oldest</option>
              <option value="total:desc">Amount ↓</option>
              <option value="total:asc">Amount ↑</option>
              <option value="profit:desc">Profit ↓</option>
              <option value="profit:asc">Profit ↑</option>
            </select>

            {/* Page size */}
            <select
              className="input-compact shrink-0"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            {/* Reset */}
            {(q || filters.paymentStatus || filters.from || filters.to) && (
              <button
                onClick={() => { setQ(''); setFilters({ paymentStatus: '', from: '', to: '' }); setPage(1); }}
                className="ml-auto px-3 py-2 text-sm rounded-lg border border-gray-200 text-accent-600 hover:bg-gray-50 shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

    {/* Orders List */}
    {!isLoading && filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 rounded-3xl mb-6">
              <ShoppingBag className="h-8 w-8 text-accent-400" />
            </div>
            <h3 className="font-display text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-accent-400">Start selling to see your history here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredOrders.map((order) => (
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
                        onClick={() => handleDownloadInvoice(order._id)}
                        disabled={downloadingInvoice === order._id}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {downloadingInvoice === order._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            <span>Invoice</span>
                          </>
                        )}
                      </button>
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

        {/* Pagination */}
        {totalCount > 0 && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              className="px-4 py-2 rounded-lg border border-gray-200 text-accent-600 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <div className="text-sm text-accent-500">
              Page {page} of {totalPages}
              <span className="ml-2 text-accent-400">• Showing {Math.min((page - 1) * pageSize + 1, totalCount)}–{Math.min(page * pageSize, totalCount)} of {totalCount}</span>
            </div>
            <button
              className="px-4 py-2 rounded-lg border border-gray-200 text-accent-600 disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};