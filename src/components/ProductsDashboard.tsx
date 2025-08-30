import React, { useState } from 'react';
import { Search, ShoppingCart, Package, Filter, Menu } from 'lucide-react';
import { Product } from '../types';
import { BurgerMenu } from './BurgerMenu';
import { ActiveTab } from '../types';

interface ProductsDashboardProps {
  products: Product[];
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

  // Get unique categories
  const categories = Array.from(new Set(products.map(product => product.category)));

  // Normalize products (fix id, add total quantity)
  const normalizedProducts = products.map(product => ({
    ...product,
    id: product._id,
    quantity: product.sizes.reduce((sum, s) => sum + s.quantity, 0)
  }));

  const filteredProducts = normalizedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <BurgerMenu onNavigate={onNavigate} onLogout={onLogout} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg truncate pr-2">
                    {product.name}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowSizeModal(true);
                    }}
                    disabled={product.quantity === 0}
                    className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                      product.quantity === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    }`}
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="text-sm text-gray-500 mb-1">{product.category}</div>
                <div className="text-xs text-gray-400 mb-2">{product.brand}</div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600 block">Retail</span>
                    <span className="font-semibold text-blue-600">₹{product.retailPrice}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Wholesale</span>
                    <span className="text-gray-700">₹{product.wholesalePrice}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      Stock
                    </span>
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
                </div>

                {/* 🔹 Size-wise stock */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {product.sizes.map((s, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded-lg border ${
                        s.quantity > 5
                          ? 'border-green-500 text-green-600'
                          : s.quantity > 0
                            ? 'border-amber-500 text-amber-600'
                            : 'border-red-500 text-red-600'
                      }`}
                    >
                      {s.size}: {s.quantity}
                    </span>
                  ))}
                </div>

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

      {/* Size Selection Modal */}
      {showSizeModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Select Size</h3>
            <p className="text-gray-600 mb-4">{selectedProduct.name}</p>
            <div className="space-y-2">
              {selectedProduct.sizes.filter(s => s.quantity > 0).map((size, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onAddToCart(selectedProduct, size.size);
                    setShowSizeModal(false);
                    setSelectedProduct(null);
                  }}
                  className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="font-medium">{size.size}</span>
                  <span className="text-gray-500">{size.quantity} available</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowSizeModal(false);
                setSelectedProduct(null);
              }}
              className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
