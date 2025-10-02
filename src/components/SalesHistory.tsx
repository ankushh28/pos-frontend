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
  const [filters, setFilters] = useState({
    paymentStatus: '' as '' | 'PENDING' | 'PAID' | 'CANCELLED',
    from: '',
    to: ''
  });
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'profit'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  // Local-only search (no URL param sync)
  const [q, setQ] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  // Push state -> URL and fetch (with abort on change)
  useEffect(() => {
    // Removed all URL syncing (page, filters, search) – state is internal only now

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
      {/* Sticky top area */}
      <div className="bg-surface border-b border-gray-100 sticky top-0 z-30">
        <div className="px-5 lg:px-8 py-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-gray-900 tracking-tight">Sales History</h1>
              <p className="text-accent-400 text-sm mt-1">{analytics.totalOrders} total orders • Updated in real time</p>
            </div>
          </div>

          {/* Compact scrollable stats on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-accent-400 font-medium">Revenue</p>
                <p className="font-display text-xl md:text-2xl font-semibold text-gray-900 mt-1">₹{analytics.totalRevenue.toFixed(0)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-accent-400 font-medium">Profit</p>
                <p className="font-display text-xl md:text-2xl font-semibold text-green-600 mt-1">₹{analytics.totalProfit.toFixed(0)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-accent-400 font-medium">Orders</p>
                <p className="font-display text-xl md:text-2xl font-semibold text-gray-900 mt-1">{analytics.totalOrders}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/20">
                <ShoppingBag className="h-5 w-5 text-secondary/80" />
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-accent-400 font-medium">Avg Order</p>
                <p className="font-display text-xl md:text-2xl font-semibold text-gray-900 mt-1">₹{analytics.avgOrderPrice.toFixed(0)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-accent-100">
                <Calendar className="h-5 w-5 text-accent-600" />
              </div>
            </div>
          </div>

          {/* Filters (responsive layout) */}
          <div className="bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 border border-gray-100 rounded-2xl px-3 py-3 flex flex-col gap-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              {/* Search */}
              <div className="relative flex-grow min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400 h-4 w-4" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder="Search orders, phone, item..."
                  className="input-fieldIcon pl-9 text-sm w-full"
                  aria-label="Search orders"
                />
              </div>
              {/* Status tabs */}
              <div className="flex items-center rounded-xl bg-gray-50 p-1 overflow-hidden md:order-none order-2">
                {[
                  { label: 'All', value: '' },
                  { label: 'Paid', value: 'PAID' },
                  { label: 'Pending', value: 'PENDING' },
                  { label: 'Cancelled', value: 'CANCELLED' },
                ].map(tab => {
                  const active = filters.paymentStatus === tab.value;
                  return (
                    <button
                      key={tab.label}
                      onClick={() => { setFilters(prev => ({ ...prev, paymentStatus: tab.value as any })); setPage(1); }}
                      className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${active ? 'bg-white shadow-sm text-gray-900' : 'text-accent-500 hover:text-accent-700'}`}
                      aria-pressed={active}
                    >{tab.label}</button>
                  );
                })}
              </div>
              {/* Date Range */}
              <div className="flex items-center gap-2 md:ml-2">
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => { setFilters(prev => ({ ...prev, from: e.target.value })); setPage(1); }}
                  className="input-compact text-sm w-full md:w-auto"
                  aria-label="From date"
                />
                <span className="text-accent-300 hidden md:inline">–</span>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => { setFilters(prev => ({ ...prev, to: e.target.value })); setPage(1); }}
                  className="input-compact text-sm w-full md:w-auto"
                  aria-label="To date"
                />
              </div>
              {/* Right aligned controls */}
              <div className="flex flex-col sm:flex-row gap-2 md:ml-auto w-full md:w-auto">
                <select
                  className="input-compact text-sm w-full sm:w-auto"
                  value={`${sortBy}:${sortDir}`}
                  onChange={(e) => { const [sb, sd] = e.target.value.split(':'); setSortBy(sb as any); setSortDir(sd as any); }}
                  aria-label="Sort orders"
                >
                  <option value="date:desc">Newest</option>
                  <option value="date:asc">Oldest</option>
                  <option value="total:desc">Amount ↓</option>
                  <option value="total:asc">Amount ↑</option>
                  <option value="profit:desc">Profit ↓</option>
                  <option value="profit:asc">Profit ↑</option>
                </select>
                <select
                  className="input-compact text-sm w-full sm:w-auto"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  aria-label="Items per page"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                {(q || filters.paymentStatus || filters.from || filters.to) && (
                  <button
                    onClick={() => { setQ(''); setFilters({ paymentStatus: '', from: '', to: '' }); setPage(1); }}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs md:text-sm font-medium text-accent-600 tracking-wide w-full sm:w-auto"
                  >Reset</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 lg:p-8 pb-28">
        {isLoading && <div className="mb-6"><Loader label="Loading orders..." /></div>}
        {error && <div className="mb-6"><ErrorBanner message={error} onRetry={() => loadOrders()} /></div>}

        {/* Empty state */}
        {!isLoading && filteredOrders.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-100 rounded-3xl mb-6">
              <ShoppingBag className="h-10 w-10 text-accent-400" />
            </div>
            <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-accent-500 text-sm max-w-sm mx-auto">When you start making sales, they will appear here with detailed performance insights.</p>
          </div>
        )}

        {/* Orders grid */}
        {filteredOrders.length > 0 && (
          <div className="grid gap-6 md:gap-7 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map(order => {
              const isPending = order.paymentStatus === 'PENDING';
              return (
                <div key={order._id} className="group rounded-3xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-accent-500 font-medium">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(order.date)}</span>
                      </div>
                      {order.customerPhone && (
                        <div className="flex items-center gap-1 text-[13px] text-accent-600">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{order.customerPhone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${getPaymentStatusStyle(order.paymentStatus)}`}>{order.paymentStatus}</span>
                      {order.paymentMethod === 'UPI' ? <CreditCard className="h-4 w-4 text-primary" /> : <Banknote className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>

                  <div className="flex-1 mb-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm uppercase tracking-wide">Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-accent-600 truncate pr-2">
                            {item.product && typeof item.product === 'object' ? item.product.name : 'Product'} × {item.qty}
                          </span>
                          <span className="font-medium tabular-nums">₹{item.subtotal || (item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-accent-600 leading-relaxed">{order.notes}</div>
                    )}
                  </div>

                  <div className="mt-auto border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                      <div className="bg-gray-50 rounded-xl py-2">
                        <p className="text-[11px] uppercase tracking-wide text-accent-400 font-medium mb-1">Total</p>
                        <p className="font-display font-semibold text-gray-900 text-sm md:text-base">₹{order.total}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl py-2">
                        <p className="text-[11px] uppercase tracking-wide text-accent-400 font-medium mb-1">Profit</p>
                        <p className="font-display font-semibold text-green-600 text-sm md:text-base">₹{order.profit}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl py-2">
                        <p className="text-[11px] uppercase tracking-wide text-accent-400 font-medium mb-1">Discount</p>
                        <p className="font-display font-semibold text-primary text-sm md:text-base">₹{order.discount || 0}</p>
                      </div>
                    </div>
                    {order.paymentStatus !== 'CANCELLED' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(order._id)}
                          disabled={downloadingInvoice === order._id}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadingInvoice === order._id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Generating…</span>
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
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isPending ? 'bg-gray-100 text-accent-600 hover:bg-gray-200' : 'bg-gray-50 text-accent-500 hover:bg-gray-100'}`}
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalCount > 0 && totalPages > 1 && (
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <button
                className="px-4 py-2 rounded-xl border border-gray-200 text-accent-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >Prev</button>
              <button
                className="px-4 py-2 rounded-xl border border-gray-200 text-accent-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >Next</button>
            </div>
            <div className="text-xs md:text-sm text-accent-500 text-center sm:text-right">
              Page <span className="font-semibold text-gray-900">{page}</span> of {totalPages}
              <span className="ml-2 text-accent-400">Showing {Math.min((page - 1) * pageSize + 1, totalCount)}–{Math.min(page * pageSize, totalCount)} of {totalCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};