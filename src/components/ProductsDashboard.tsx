import React, { useState } from 'react';
import { Search, ShoppingCart, Package, Filter, Plus } from 'lucide-react';
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

  const categories = Array.from(new Set(products.map(product => product.category)));

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-semibold text-gray-900">Products</h1>
              <p className="text-accent-400 text-sm mt-1">{filteredProducts.length} items available</p>
            </div>
            <BurgerMenu onNavigate={onNavigate} onLogout={onLogout} />
          </div>
          
          {/* Search and Filter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-6 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 rounded-2xl mb-4">
              <Package className="h-8 w-8 text-accent-400" />
            </div>
            <h3 className="font-display text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-accent-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
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