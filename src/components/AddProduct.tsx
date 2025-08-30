import React, { useState } from 'react';
import { Plus, Package, DollarSign, Hash, Tag } from 'lucide-react';
import { Product } from '../types';

interface AddProductProps {
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  existingCategories: string[];
}

export const AddProduct: React.FC<AddProductProps> = ({
  onAddProduct,
  existingCategories
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    wholesalePrice: '',
    retailPrice: '',
    quantity: ''
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.wholesalePrice || !formData.retailPrice || !formData.quantity) {
      alert('Please fill in all fields');
      return;
    }

    const wholesalePrice = parseFloat(formData.wholesalePrice);
    const retailPrice = parseFloat(formData.retailPrice);
    const quantity = parseInt(formData.quantity);

    if (wholesalePrice <= 0 || retailPrice <= 0 || quantity < 0) {
      alert('Please enter valid positive numbers');
      return;
    }

    if (retailPrice <= wholesalePrice) {
      alert('Retail price must be higher than wholesale price');
      return;
    }

    onAddProduct({
      name: formData.name.trim(),
      category: formData.category.trim(),
      wholesalePrice,
      retailPrice,
      quantity
    });

    // Reset form
    setFormData({
      name: '',
      category: '',
      wholesalePrice: '',
      retailPrice: '',
      quantity: ''
    });
    setIsCustomCategory(false);

    alert('Product added successfully!');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setIsCustomCategory(false);
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  return (
    <div className="p-4 pb-20 lg:pb-4 lg:pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h1>
      
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="inline h-4 w-4 mr-1" />
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter product name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Category
            </label>
            
            {!isCustomCategory ? (
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                required
              >
                <option value="">Select a category</option>
                {existingCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
                <option value="custom">+ Add New Category</option>
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Enter new category name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setFormData(prev => ({ ...prev, category: '' }));
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ← Back to existing categories
                </button>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Wholesale Price (₹)
              </label>
              <input
                type="number"
                value={formData.wholesalePrice}
                onChange={(e) => handleInputChange('wholesalePrice', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Retail Price (₹)
              </label>
              <input
                type="number"
                value={formData.retailPrice}
                onChange={(e) => handleInputChange('retailPrice', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Quantity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="inline h-4 w-4 mr-1" />
              Initial Stock Quantity
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Profit Preview */}
          {formData.wholesalePrice && formData.retailPrice && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <h3 className="font-medium text-green-800 mb-2">Profit Preview</h3>
              <div className="text-sm text-green-700">
                <p>Profit per unit: ₹{(parseFloat(formData.retailPrice) - parseFloat(formData.wholesalePrice)).toFixed(2)}</p>
                <p>Profit margin: {(((parseFloat(formData.retailPrice) - parseFloat(formData.wholesalePrice)) / parseFloat(formData.retailPrice)) * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        </form>
      </div>
    </div>
  );
};