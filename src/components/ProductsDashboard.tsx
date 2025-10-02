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

  // URL param sync removed: state is now purely in-memory (no page/sort/search params in the address bar)
  useMemo(() => { /* intentionally empty - previous URL hydration removed */ }, []);

  // Debounced search term to avoid hitting API on every keystroke
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const h = setTimeout(() => setDebouncedQ(listState.q || ''), 500);
    return () => clearTimeout(h);
  }, [listState.q]);

  // Fetch from server when listState changes (with debounced q)
  useEffect(() => {
  // Removed URL syncing of pagination / sorting / search

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
      {/* Header / Toolbar */}
      <div className="bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-gray-100 sticky top-0 z-30">
        <div className="px-5 lg:px-8 py-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900">Products</h1>
              <p className="text-accent-400 text-sm mt-1">{filteredProducts.length} visible {filteredProducts.length !== total && total > 0 && (<span className="text-accent-300">· of {total}</span>)} </p>
            </div>
            <BurgerMenu onNavigate={onNavigate} onLogout={onLogout} />
          </div>

          {/* Unified filter bar */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            {/* Search */}
            <div className="relative flex-grow min-w-[240px]" id="mobile-category-filter">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  setListState(prev => ({ ...prev, q: val.length >= 2 ? val : '', page: 1 }));
                }}
                className="input-fieldIcon pl-12 text-sm"
                aria-label="Search products"
              />
              <button
                type="button"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-50 md:hidden ${!hasCategoryFilter ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => hasCategoryFilter && setShowCategoryMenu(v => !v)}
                aria-label="Toggle category filter"
              >
                <Filter className="h-5 w-5 text-accent-400" />
              </button>
              {showCategoryMenu && (
                <div className="absolute z-40 right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg p-2 md:hidden">
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCategory === '' ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                    onClick={() => { setSelectedCategory(''); setShowCategoryMenu(false); }}
                  >All Categories</button>
                  <div className="max-h-60 overflow-y-auto">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCategory === cat ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                        onClick={() => { setSelectedCategory(cat); setShowCategoryMenu(false); }}
                      >{cat}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Desktop category */}
            <div className="hidden md:block relative w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-400 h-5 w-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!hasCategoryFilter}
                className={`input-fieldIcon pl-12 text-sm appearance-none ${!hasCategoryFilter ? 'opacity-60 cursor-not-allowed' : ''}`}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={`${listState.sortBy}:${listState.sortDir}`}
                onChange={(e) => { const [sb, sd] = e.target.value.split(':'); setListState(prev => ({ ...prev, sortBy: sb, sortDir: sd as 'asc' | 'desc' })); }}
                className="input-compact text-sm"
                aria-label="Sort by"
              >
                <option value="name:asc">Name ↑</option>
                <option value="name:desc">Name ↓</option>
                <option value="retailPrice:asc">Price ↑</option>
                <option value="retailPrice:desc">Price ↓</option>
                <option value="quantity:desc">Stock ↓</option>
                <option value="quantity:asc">Stock ↑</option>
              </select>
              <select
                value={listState.pageSize}
                onChange={(e) => setListState(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
                className="input-compact text-sm"
                aria-label="Items per page"
              >
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-5 lg:px-8 py-6 pb-32">
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {pagedProducts.map((product) => (
              <div key={product.id} className="relative group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium font-display text-gray-900 text-base leading-snug line-clamp-2 group-hover:underline underline-offset-2 decoration-gray-200">{product.name}</h3>
                    <p className="text-accent-400 text-xs mt-1">{product.category}</p>
                    {product.brand && <p className="text-accent-300 text-[11px] mt-0.5">{product.brand}</p>}
                  </div>
                  <button
                    onClick={() => { setSelectedProduct(product); setShowSizeModal(true); }}
                    disabled={product.quantity === 0}
                    className={`flex-shrink-0 rounded-xl px-3 py-3 transition-all ${product.quantity === 0 ? 'bg-accent-100 text-accent-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow'} `}
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-accent-400 font-medium mb-1">Retail</p>
                    <p className="font-semibold text-gray-900">₹{product.retailPrice}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-accent-400 font-medium mb-1">Stock</p>
                    <p className={`font-semibold tabular-nums ${product.quantity > 15 ? 'text-green-600' : product.quantity > 0 ? 'text-secondary' : 'text-primary'}`}>{product.quantity}</p>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {product.sizes.map((size, idx) => (
                    <span key={idx} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${size.quantity > 5 ? 'border-green-200 text-green-700 bg-green-50' : size.quantity > 0 ? 'border-secondary/30 text-secondary/80 bg-secondary/10' : 'border-red-200 text-red-600 bg-red-50'}`}>{size.size}: {size.quantity}</span>
                  ))}
                </div>
                {product.quantity === 0 && (
                  <span
                    className="absolute -top-2 -left-2 rounded-full bg-primary/90 text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 shadow-sm ring-2 ring-white"
                  >
                    OUT
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && totalPages > 1 && (
        <div className="sticky bottom-16 md:bottom-20 z-20 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-lg border border-gray-100 rounded-full px-4 py-2 flex items-center gap-4 text-xs font-medium">
            <button
              className="px-3 py-1.5 rounded-full border border-gray-200 text-accent-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              disabled={!canPrev}
              onClick={() => setListState(prev => ({ ...prev, page: prev.page - 1 }))}
            >Prev</button>
            <span className="text-accent-500">Page {listState.page} / {totalPages}</span>
            <button
              className="px-3 py-1.5 rounded-full border border-gray-200 text-accent-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              disabled={!canNext}
              onClick={() => setListState(prev => ({ ...prev, page: prev.page + 1 }))}
            >Next</button>
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