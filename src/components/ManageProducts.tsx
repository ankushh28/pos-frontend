import React, { useState, useMemo } from 'react';
import { Search, Filter, Edit, Trash2, Plus, Upload, History, ArrowLeft, Package, BarChart3, Layers, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { ApiService } from '../services/api';
import { EditProduct } from './EditProduct';
import { BulkUpload } from './BulkUpload';
import { UploadHistory } from './UploadHistory';

interface ManageProductsProps {
  products: Product[];
  onProductsChange: () => void;
}

type ManageView = 'list' | 'edit' | 'add' | 'bulk-upload' | 'upload-history';

export const ManageProducts: React.FC<ManageProductsProps> = ({
  products,
  onProductsChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentView, setCurrentView] = useState<ManageView>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectedIds(new Set());
      setSelectMode(false);
    } else {
      setSelectMode(true);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // selection helpers will be defined after filteredProducts
  let allVisibleSelected = false;
  let toggleSelectAllVisible: () => void = () => {};

  const handleBulkDelete = async () => {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} selected product(s)? This cannot be undone.`)) return;
    setIsLoading(true);
    try {
      const resp = await ApiService.bulkDeleteProducts(Array.from(selectedIds));
      if ((resp as any).success) {
        alert(`Deleted ${(resp as any).deleted} products`);
        setSelectedIds(new Set());
        onProductsChange();
      } else {
        alert('Bulk delete failed');
      }
    } catch (e: any) {
      alert(e?.message || 'Error during bulk delete');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const exportProducts = selectMode && selectedIds.size ? filteredProducts.filter(p => selectedIds.has(p._id)) : filteredProducts;
    if (!exportProducts.length) {
      alert('No products to export');
      return;
    }
    const header = ['Name','Category','Brand','WholesalePrice','RetailPrice','TotalQty','Sizes'];
    const rows = exportProducts.map(p => {
      const sizeStr = (p.sizes || []).map(s => `${s.size}:${s.quantity}`).join('|');
      const safe = (val: any) => typeof val === 'string' && (val.includes(',') || val.includes('"')) ? `"${val.replace(/"/g,'""')}"` : val;
      return [p.name, p.category, p.brand || '', p.wholesalePrice, p.retailPrice, p.quantity, sizeStr].map(safe).join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    link.download = `products-export-${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const categories = useMemo(() => Array.from(new Set(products.map(product => product.category))).sort(), [products]);

  const normalizedProducts = products.map(product => ({
    ...product,
    id: product._id,
    quantity: product.sizes?.reduce((sum, s) => sum + s.quantity, 0) || 0
  }));

  const filteredProducts = normalizedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p._id));
  toggleSelectAllVisible = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredProducts.forEach(p => next.delete(p._id));
      } else {
        filteredProducts.forEach(p => next.add(p._id));
      }
      return next;
    });
  };

  // Simple derived analytics for header cards
  const totalStock = filteredProducts.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockCount = filteredProducts.filter(p => p.quantity > 0 && p.quantity < 5).length;
  const outOfStockCount = filteredProducts.filter(p => p.quantity === 0).length;
  const avgProfit = filteredProducts.length
    ? Math.round(filteredProducts.reduce((sum, p) => sum + (p.retailPrice - p.wholesalePrice), 0) / filteredProducts.length)
    : 0;

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setCurrentView('edit');
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.deleteProduct(product._id);
      if (response.success) {
        onProductsChange();
        alert('Product deleted successfully!');
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingProduct(null);
  };

  const handleProductUpdated = () => {
    onProductsChange();
    handleBackToList();
  };

  const renderHeader = () => {
    const getTitle = () => {
      switch (currentView) {
        case 'edit': return 'Edit Product';
        case 'add': return 'Add Product';
        case 'bulk-upload': return 'Bulk Upload';
        case 'upload-history': return 'Upload History';
        default: return 'Manage Products';
      }
    };

    return (
      <div className="bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-gray-100 sticky top-0 z-20">
        <div className="px-5 lg:px-8 py-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentView !== 'list' && (
                <button
                  onClick={handleBackToList}
                  className="p-2 rounded-xl text-accent-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900">{getTitle()}</h1>
                {currentView === 'list' && (
                  <p className="text-accent-400 text-sm mt-1">{filteredProducts.length} <span className="text-accent-300">products</span></p>
                )}
              </div>
            </div>

            {currentView === 'list' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('upload-history')}
                  className="p-3 rounded-xl text-accent-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  title="Upload History"
                >
                  <History className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentView('bulk-upload')}
                  className="p-3 rounded-xl text-primary hover:bg-red-50 transition-colors"
                  title="Bulk Upload"
                >
                  <Upload className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentView('add')}
                  className="btn-primary p-3 rounded-xl shadow-soft hover:shadow-medium transition-all duration-200"
                  title="Add Product"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {currentView === 'list' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl border border-gray-100 bg-white flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-accent-400" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-accent-400">Total Stock</p>
                  <p className="font-semibold text-gray-900 text-sm tabular-nums">{totalStock}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-white flex items-center gap-3">
                <Layers className="h-5 w-5 text-accent-400" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-accent-400">Low (&lt;5)</p>
                  <p className="font-semibold text-amber-600 text-sm tabular-nums">{lowStockCount}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-white flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-accent-400" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-accent-400">Out</p>
                  <p className="font-semibold text-primary text-sm tabular-nums">{outOfStockCount}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-white flex items-center gap-3">
                <Package className="h-5 w-5 text-accent-400" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-accent-400">Avg Profit</p>
                  <p className="font-semibold text-green-600 text-sm tabular-nums">₹{avgProfit}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-white flex items-center gap-3 sm:col-span-2 lg:col-span-2">
                <div className="text-xs text-accent-500 leading-snug">Track low & out-of-stock products instantly with dynamic color coding.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (currentView === 'edit' && editingProduct) {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <div className="p-6 pb-24">
          <EditProduct
            product={editingProduct}
            onProductUpdated={handleProductUpdated}
            onCancel={handleBackToList}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'add') {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <div className="p-6 pb-24">
          <EditProduct
            onProductUpdated={handleProductUpdated}
            onCancel={handleBackToList}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'bulk-upload') {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <div className="p-6 pb-24">
          <BulkUpload
            onUploadComplete={() => {
              onProductsChange();
              handleBackToList();
            }}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'upload-history') {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        <div className="p-6 pb-24">
          <UploadHistory onRollbackComplete={onProductsChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      
      <div className="p-6 pb-24">
        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-accent-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products..."
              className="input-fieldIcon pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative md:col-span-1">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-accent-400 h-5 w-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-fieldIcon pl-12 appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 md:col-span-1 xl:col-span-2">
            <button
              onClick={toggleSelectMode}
              className={`px-4 py-3 rounded-xl text-sm w-full border transition-all ${selectMode ? 'bg-red-50 border-red-200 text-primary' : 'border-gray-200 text-accent-500 hover:border-gray-300 hover:text-accent-700'}`}
              title={selectMode ? 'Exit selection mode' : 'Enable multi-select'}
            >{selectMode ? `Cancel (${selectedIds.size})` : 'Multi-select'}</button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-3 rounded-xl text-sm w-full border border-gray-200 text-accent-500 hover:border-gray-300 hover:text-accent-700"
              title="Export current list or selected items as CSV"
            >Export</button>
          </div>
          {selectMode && (
            <div className="md:col-span-3 xl:col-span-4 flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                />
                <span className="text-xs text-accent-500">Select all visible ({filteredProducts.length})</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleBulkDelete}
                  disabled={!selectedIds.size || isLoading}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-red-200 bg-red-50 text-primary disabled:opacity-40"
                >Delete Selected ({selectedIds.size})</button>
                <button
                  onClick={() => { setSelectedIds(new Set()); }}
                  disabled={!selectedIds.size}
                  className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-accent-500 disabled:opacity-40"
                >Clear</button>
              </div>
            </div>
          )}
        </div>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 rounded-3xl mb-6">
              <Package className="h-8 w-8 text-accent-400" />
            </div>
            <h3 className="font-display text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-accent-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const profit = product.retailPrice - product.wholesalePrice;
              const stockColor = product.quantity === 0
                ? 'text-primary'
                : product.quantity < 5
                  ? 'text-amber-600'
                  : 'text-green-600';
              return (
                <div key={product._id} className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group ${selectMode && selectedIds.has(product._id) ? 'ring-2 ring-primary/40' : ''}`}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {selectMode && (
                      <div className="flex items-start pt-1">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                          checked={selectedIds.has(product._id)}
                          onChange={() => toggleSelectOne(product._id)}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                        <h3 className="font-display font-semibold text-gray-900 text-lg leading-snug">{product.name}</h3>
                        {product.brand && <span className="text-accent-300 text-sm">{product.brand}</span>}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-accent-500 text-xs font-medium">{product.category}</span>
                        {product.quantity === 0 && <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">OUT</span>}
                        {product.quantity > 0 && product.quantity < 5 && <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium">LOW</span>}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3 text-sm">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-accent-400">Retail</p>
                          <p className="font-semibold text-gray-900">₹{product.retailPrice}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-accent-400">Wholesale</p>
                          <p className="font-semibold text-accent-600">₹{product.wholesalePrice}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-accent-400">Stock</p>
                          <p className={`font-semibold tabular-nums ${stockColor}`}>{product.quantity}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-accent-400">Profit</p>
                          <p className="font-semibold text-green-600 tabular-nums">₹{profit}</p>
                        </div>
                      </div>
                      {product.sizes?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {product.sizes.map((s, idx) => (
                            <span key={idx} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                              s.quantity > 5
                                ? 'border-green-200 text-green-700 bg-green-50'
                                : s.quantity > 0
                                  ? 'border-secondary/30 text-secondary/80 bg-secondary/10'
                                  : 'border-red-200 text-red-600 bg-red-50'
                            }`}>{s.size}: {s.quantity}</span>
                          ))}
                        </div>
                      )}
                      {product.description && (
                        <p className="text-accent-500 text-sm leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">{product.description}</p>
                      )}
                    </div>
                    <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 self-start">
                      <button
                        onClick={() => handleEdit(product)}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-primary hover:bg-red-50 hover:border-red-200 text-sm font-medium"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-accent-400 hover:text-primary hover:bg-red-50 hover:border-red-200 text-sm font-medium disabled:opacity-50"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};