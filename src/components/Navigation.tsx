import React from 'react';
import { Package, ShoppingCart, BarChart3, LogOut } from 'lucide-react';
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
    <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-gray-100 px-6 py-4 safe-area-bottom">
      <div className="flex justify-center items-center max-w-md mx-auto">
        <div className="flex bg-gray-50 rounded-2xl p-2 space-x-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center justify-center px-6 py-3 rounded-xl transition-all duration-200 relative ${
                activeTab === id
                  ? 'bg-surface text-primary shadow-soft'
                  : 'text-accent-500 hover:text-accent-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="ml-2 text-sm font-medium">{label}</span>
              
              {id === 'cart' && cartItemsCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};