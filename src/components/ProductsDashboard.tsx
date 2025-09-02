import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingCart, Package, Filter } from 'lucide-react';
import { Product, ListParams } from '../types';
import { BurgerMenu } from './BurgerMenu';
import { ActiveTab } from '../types';
import { ApiService } from '../services/api';
import { Loader } from './ui/Loader';
import { ErrorBanner } from './ui/ErrorBanner';

interface ProductsDashboardProps {
  products: Product[]; // still accepted for backward compatibility
  onAddToCart: (product: Product, size: string) => void;
  onNavigate: (tab: ActiveTab) => void;
  onLogout: () => void;
}

export const ProductsDashboard: React.FC<ProductsDashboardProps> = ({
  products,
  onAddToCart,
  onNavigate,
  onLogout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [listState, setListState] = useState<Required<Pick<ListParams, 'page' | 'pageSize' | 'sortDir'>> & Pick<ListParams, 'q' | 'sortBy'>>({
    page: 1,
    pageSize: 12,
    q: '',
    sortBy: 'name',
    sortDir: 'asc',
  });
  const [serverProducts, setServerProducts] = useState<Product[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from URL immediately (avoid extra mount->effect churn)
  useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    const page = parseInt(sp.get('page') || '1', 10);
    const pageSize = parseInt(sp.get('pageSize') || '12', 10);
    const q = sp.get('q') || '';
    const sortBy = sp.get('sortBy') || 'name';
    const sortDir = (sp.get('sortDir') as 'asc' | 'desc') || 'asc';
    setListState(prev => ({ ...prev, page: Number.isNaN(page) ? 1 : page, pageSize: Number.isNaN(pageSize) ? 12 : pageSize, q, sortBy, sortDir }));
    setSearchTerm(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search term to avoid hitting API on every keystroke
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const h = setTimeout(() => setDebouncedQ(listState.q || ''), 500);
    return () => clearTimeout(h);
  }, [listState.q]);

  // Fetch from server when listState changes (with debounced q)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    sp.set('page', String(listState.page));
    sp.set('pageSize', String(listState.pageSize));
  if (listState.q) sp.set('q', listState.q); else sp.delete('q');
  // Clear orders-specific query when on products page
  sp.delete('ordersQ');
    if (listState.sortBy) sp.set('sortBy', listState.sortBy); else sp.delete('sortBy');
    if (listState.sortDir) sp.set('sortDir', listState.sortDir); else sp.delete('sortDir');
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);

  const controller = new AbortController();
    setIsLoading(true);
    setError(null);
  const fetcher = debouncedQ
      ? ApiService.searchProducts({ q: debouncedQ, page: listState.page, limit: listState.pageSize }, { signal: controller.signal })
      : ApiService.getAllProducts({
          page: listState.page,
          pageSize: listState.pageSize,
          sortBy: listState.sortBy,
          sortDir: listState.sortDir,
        }, { signal: controller.signal });

    Promise.resolve(fetcher).then((res: any) => {
      // Support both old and paginated shapes
      if (Array.isArray(res?.data)) {
        setServerProducts(res.data as Product[]);
        setTotalCount(res.totalCount || res.pagination?.totalCount || res.data.length);
      } else if (Array.isArray(res)) {
        setServerProducts(res as Product[]);
        setTotalCount((res as Product[]).length);
      } else if (Array.isArray(res?.products)) {
        setServerProducts(res.products as Product[]);
        setTotalCount(res.pagination?.totalCount || res.products.length);
      } else {
        setServerProducts([]);
        setTotalCount(0);
      }
    }).catch((err: any) => {
      // Ignore intentionally aborted requests during fast typing
      if (err?.code === 'ABORTED' || err?.aborted) return;
      setError(err?.message || 'Failed to load products');
    }).finally(() => setIsLoading(false));

  return () => controller.abort();
  }, [listState.page, listState.pageSize, debouncedQ, listState.sortBy, listState.sortDir]);

  const dataSource: Product[] = serverProducts ?? products ?? [];

  const categories = useMemo(
    () => Array.from(new Set((dataSource || []).map(p => p.category).filter(Boolean))).sort(),
    [dataSource]
  );
  const hasCategoryFilter = categories.length > 1;

  // close category popup when clicking outside
  useEffect(() => {
    if (!showCategoryMenu) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.('#mobile-category-filter')) {
        setShowCategoryMenu(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [showCategoryMenu]);

  const normalizedProducts = dataSource.map(product => ({
    ...product,
    id: product._id,
    quantity: product.sizes.reduce((sum, s) => sum + s.quantity, 0)
  }));

  const filteredProducts = normalizedProducts.filter(product => {
    // If server searching is active (debouncedQ), don't filter by name again client-side
    const matchesSearch = debouncedQ
      ? true
      : product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sorting client-side as a fallback if API didn't do it
  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    const { sortBy, sortDir } = listState;
    arr.sort((a, b) => {
      let av: any = (a as any)[sortBy as keyof Product];
      let bv: any = (b as any)[sortBy as keyof Product];
      if (sortBy === 'quantity') {
        av = a.quantity;
        bv = b.quantity;
      }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredProducts, listState]);

  const pagedProducts = useMemo(() => {
    // If server paginated, assume full page already; else paginate locally
    if (serverProducts) return sortedProducts;
    const start = (listState.page - 1) * listState.pageSize;
    return sortedProducts.slice(start, start + listState.pageSize);
  }, [sortedProducts, listState, serverProducts]);

  const total = serverProducts ? totalCount : sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / listState.pageSize));
  const canPrev = listState.page > 1;
  const canNext = listState.page < totalPages;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-semibold text-gray-900">Products</h1>
              <p className="text-accent-400 text-sm mt-1">
                {filteredProducts.length} items available
                {filteredProducts.length !== total && total > 0 ? (
                  <span className="text-accent-300"> · out of {total}</span>
                ) : null}
              </p>
            </div>
            <BurgerMenu onNavigate={onNavigate} onLogout={onLogout} />
          </div>
          
          {/* Search and Filter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div id="mobile-category-filter" className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-accent-400 h-5 w-5" />
              <input
                style={{
                  width: '100%',
                  padding: '10px 45px',
                }}
                type="text"
                placeholder="Search products..."
                className="input-fieldIcon pl-12"
                value={searchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  // Only trigger server search when 2+ chars; otherwise clear q and use full list
                  setListState(prev => ({ ...prev, q: val.length >= 2 ? val : '', page: 1 }));
                }}
              />
              {/* Category icon + dropdown on small screens */}
              <button
                type="button"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-50 lg:hidden ${!hasCategoryFilter ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => hasCategoryFilter && setShowCategoryMenu(v => !v)}
                aria-label="Filter categories"
              >
                <Filter className="h-5 w-5 text-accent-400" />
              </button>
              {showCategoryMenu && (
                <div className="absolute z-20 right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-strong p-2 lg:hidden">
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCategory === '' ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                    onClick={() => { setSelectedCategory(''); setShowCategoryMenu(false); }}
                  >
                    All Categories
                  </button>
                  <div className="max-h-64 overflow-y-auto">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCategory === cat ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                        onClick={() => { setSelectedCategory(cat); setShowCategoryMenu(false); }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Full category select on large screens */}
            <div className="relative hidden lg:block">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-accent-400 h-5 w-5" />
              <select
              style={{
                  width: '100%',
                  padding: '10px 45px',
                }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!hasCategoryFilter}
                className={`input-fieldIcon pl-12 appearance-none ${!hasCategoryFilter ? 'opacity-60 cursor-not-allowed' : ''}`}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort and page size */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="sr-only">Sort by</label>
              <select
                value={`${listState.sortBy}:${listState.sortDir}`}
                onChange={(e) => {
                  const [sb, sd] = e.target.value.split(':');
                  setListState(prev => ({ ...prev, sortBy: sb, sortDir: sd as 'asc' | 'desc' }));
                }}
                className="input-fieldIcon h-10"
                aria-label="Sort by"
              >
                <option value="name:asc">Name ↑</option>
                <option value="name:desc">Name ↓</option>
                <option value="retailPrice:asc">Price ↑</option>
                <option value="retailPrice:desc">Price ↓</option>
                <option value="quantity:desc">Stock ↓</option>
                <option value="quantity:asc">Stock ↑</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only">Items per page</label>
              <select
                value={listState.pageSize}
                onChange={(e) => setListState(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
                className="input-fieldIcon h-10"
                aria-label="Items per page"
              >
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-6 pb-24">
        {isLoading ? (
          <Loader label="Loading products..." />
        ) : error ? (
          <ErrorBanner message={error} onRetry={() => setListState(prev => ({ ...prev }))} />
        ) : pagedProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 rounded-2xl mb-4">
              <Package className="h-8 w-8 text-accent-400" />
            </div>
            <h3 className="font-display text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-accent-400 mb-6">Try adjusting your search or filters</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setListState(prev => ({ ...prev, q: '', page: 1 }));
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-accent-600 hover:bg-gray-50"
              >
                Clear search
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pagedProducts.map((product) => (
              <div
                key={product.id}
                className="card-interactive p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-medium text-gray-900 text-lg mb-1 truncate">
                      {product.name}
                    </h3>
                    <p className="text-accent-400 text-sm mb-1">{product.category}</p>
                    {product.brand && (
                      <p className="text-accent-300 text-xs">{product.brand}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowSizeModal(true);
                    }}
                    disabled={product.quantity === 0}
                    className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 ${
                      product.quantity === 0
                        ? 'bg-accent-100 text-accent-400 cursor-not-allowed'
                        : 'btn-primary shadow-soft hover:shadow-medium group-hover:scale-105'
                    }`}
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-accent-400 text-xs mb-1">Retail Price</p>
                    <p className="font-semibold text-gray-900">₹{product.retailPrice}</p>
                  </div>
                  <div>
                    <p className="text-accent-400 text-xs mb-1">Stock</p>
                    <p className={`font-semibold ${
                      product.quantity > 10 
                        ? 'text-green-600' 
                        : product.quantity > 0 
                          ? 'text-secondary' 
                          : 'text-primary'
                    }`}>
                      {product.quantity}
                    </p>
                  </div>
                </div>

                {/* Size Stock */}
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                        size.quantity > 5
                          ? 'border-green-200 text-green-700 bg-green-50'
                          : size.quantity > 0
                            ? 'border-secondary/30 text-secondary/80 bg-secondary/10'
                            : 'border-red-200 text-red-700 bg-red-50'
                      }`}
                    >
                      {size.size}: {size.quantity}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && totalPages > 1 && (
        <div className="px-6 pb-28">
          <div className="flex items-center justify-between">
            <button
              className="px-4 py-2 rounded-lg border border-gray-200 text-accent-600 disabled:opacity-50"
              disabled={!canPrev}
              onClick={() => setListState(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </button>
            <div className="text-sm text-accent-500">
              Page {listState.page} of {totalPages}
              <span className="ml-2 text-accent-400">• Showing {Math.min((listState.page - 1) * listState.pageSize + 1, total)}–{Math.min(listState.page * listState.pageSize, total)} of {total}</span>
            </div>
            <button
              className="px-4 py-2 rounded-lg border border-gray-200 text-accent-600 disabled:opacity-50"
              disabled={!canNext}
              onClick={() => setListState(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Size Selection Modal */}
      {showSizeModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-surface rounded-3xl p-8 w-full max-w-sm shadow-strong animate-slide-in">
            <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">Select Size</h3>
            <p className="text-accent-400 mb-6">{selectedProduct.name}</p>
            
            <div className="space-y-3 mb-6">
              {selectedProduct.sizes.filter(s => s.quantity > 0).map((size, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onAddToCart(selectedProduct, size.size);
                    setShowSizeModal(false);
                    setSelectedProduct(null);
                  }}
                  className="w-full flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all duration-200"
                >
                  <span className="font-medium text-gray-900">{size.size}</span>
                  <span className="text-accent-400 text-sm">{size.quantity} available</span>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowSizeModal(false);
                setSelectedProduct(null);
              }}
              className="w-full py-3 border border-gray-200 rounded-xl text-accent-600 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};