import React, { useState, useEffect } from 'react';
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

  // Get unique categories
  const categories = Array.from(new Set(products.map(product => product.category)));

  // Normalize products for display
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {currentView !== 'list' && (
            <button
              onClick={handleBackToList}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
        </div>

        {currentView === 'list' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('upload-history')}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Upload History"
            >
              <History className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentView('bulk-upload')}
              className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
              title="Bulk Upload"
            >
              <Upload className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentView('add')}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Add Product"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  if (currentView === 'edit' && editingProduct) {
    return (
      <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
        {renderHeader()}
        <EditProduct
          product={editingProduct}
          onProductUpdated={handleProductUpdated}
          onCancel={handleBackToList}
        />
      </div>
    );
  }

  if (currentView === 'add') {
    return (
      <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
        {renderHeader()}
        <EditProduct
          onProductUpdated={handleProductUpdated}
          onCancel={handleBackToList}
        />
      </div>
    );
  }

  if (currentView === 'bulk-upload') {
    return (
      <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
        {renderHeader()}
        <BulkUpload
          onUploadComplete={() => {
            onProductsChange();
            handleBackToList();
          }}
        />
      </div>
    );
  }

  if (currentView === 'upload-history') {
    return (
      <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
        {renderHeader()}
        <UploadHistory onRollbackComplete={onProductsChange} />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
      {renderHeader()}
      
      {/* Search and Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                    <div className="text-sm text-gray-500 mb-1">{product.category}</div>
                    {product.brand && (
                      <div className="text-xs text-gray-400 mb-2">{product.brand}</div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit Product"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={isLoading}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600 block">Retail Price</span>
                    <span className="font-semibold text-blue-600">₹{product.retailPrice}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Wholesale</span>
                    <span className="text-gray-700">₹{product.wholesalePrice}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Total Stock</span>
                    <span className={`font-medium ${
                      product.quantity > 5 
                        ? 'text-green-600' 
                        : product.quantity > 0 
                          ? 'text-amber-600' 
                          : 'text-red-600'
                    }`}>
                      {product.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Profit/Unit</span>
                    <span className="font-medium text-green-600">
                      ₹{product.retailPrice - product.wholesalePrice}
                    </span>
                  </div>
                </div>

                {/* Size-wise stock */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {product.sizes.map((size, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-lg border ${
                          size.quantity > 5
                            ? 'border-green-500 text-green-600 bg-green-50'
                            : size.quantity > 0
                              ? 'border-amber-500 text-amber-600 bg-amber-50'
                              : 'border-red-500 text-red-600 bg-red-50'
                        }`}
                      >
                        {size.size}: {size.quantity}
                      </span>
                    ))}
                  </div>
                )}

                {product.description && (
                  <div className="mt-2 text-sm text-gray-600">
                    {product.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No products found</p>
        </div>
      )}
    </div>
  );
};