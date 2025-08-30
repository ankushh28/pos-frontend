import React from 'react';
import { Package, ShoppingCart, BarChart3, Plus, LogOut } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  cartItemsCount: number;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  cartItemsCount,
  onLogout
}) => {
  const tabs = [
    { id: 'products' as ActiveTab, label: 'Products', icon: Package },
    { id: 'cart' as ActiveTab, label: 'Cart', icon: ShoppingCart },
    { id: 'history' as ActiveTab, label: 'History', icon: BarChart3 }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:static lg:border-t-0 lg:border-b lg:top-0 bg-white border-t lg:border-b border-gray-200 px-2 py-2 lg:px-6 lg:py-4 safe-area-bottom">
      <div className="flex justify-around lg:justify-center lg:space-x-8 items-center max-w-md lg:max-w-6xl mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col lg:flex-row items-center py-2 px-2 lg:px-4 rounded-lg transition-colors relative ${
              activeTab === id
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-6 w-6 mb-1 lg:mb-0 lg:mr-2" />
            <span className="text-xs lg:text-sm font-medium">{label}</span>
            
            {id === 'cart' && cartItemsCount > 0 && (
              <div className="absolute -top-1 -right-1 lg:top-0 lg:-right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemsCount > 9 ? '9+' : cartItemsCount}
              </div>
            )}
          </button>
        ))}
        
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex flex-col lg:flex-row items-center py-2 px-2 lg:px-4 rounded-lg transition-colors text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-6 w-6 mb-1 lg:mb-0 lg:mr-2" />
            <span className="text-xs lg:text-sm font-medium">Logout</span>
          </button>
        )}
      </div>
    </div>
  );
};