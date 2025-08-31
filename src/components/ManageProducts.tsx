import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2, Plus, Upload, History, ArrowLeft, Package } from 'lucide-react';
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

  const categories = Array.from(new Set(products.map(product => product.category)));

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
      <div className="bg-surface border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {currentView !== 'list' && (
                <button
                  onClick={handleBackToList}
                  className="p-2 rounded-xl text-accent-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h1 className="font-display text-2xl font-semibold text-gray-900">{getTitle()}</h1>
                {currentView === 'list' && (
                  <p className="text-accent-400 text-sm mt-1">{filteredProducts.length} products</p>
                )}
              </div>
            </div>

            {currentView === 'list' && (
              <div className="flex items-center space-x-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
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
          
          <div className="relative">
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
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div key={product._id} className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-gray-900 text-xl mb-1">{product.name}</h3>
                        <div className="flex items-center space-x-3 text-sm text-accent-400 mb-2">
                          <span>{product.category}</span>
                          {product.brand && (
                            <>
                              <span>•</span>
                              <span>{product.brand}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-3 rounded-xl text-primary hover:bg-red-50 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          disabled={isLoading}
                          className="p-3 rounded-xl text-accent-400 hover:text-primary hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                      <div>
                        <p className="text-accent-400 text-sm mb-1">Retail Price</p>
                        <p className="font-display font-semibold text-primary text-lg">₹{product.retailPrice}</p>
                      </div>
                      <div>
                        <p className="text-accent-400 text-sm mb-1">Wholesale</p>
                        <p className="font-semibold text-accent-600">₹{product.wholesalePrice}</p>
                      </div>
                      <div>
                        <p className="text-accent-400 text-sm mb-1">Total Stock</p>
                        <p className={`font-semibold text-lg ${
                          product.quantity > 10 
                            ? 'text-green-600' 
                            : product.quantity > 0 
                              ? 'text-secondary/80' 
                              : 'text-primary'
                        }`}>
                          {product.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-accent-400 text-sm mb-1">Profit/Unit</p>
                        <p className="font-semibold text-green-600 text-lg">
                          ₹{product.retailPrice - product.wholesalePrice}
                        </p>
                      </div>
                    </div>

                    {/* Size Stock */}
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.sizes.map((size, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-2 rounded-xl text-sm font-medium border ${
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
                    )}

                    {product.description && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-accent-600">{product.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};