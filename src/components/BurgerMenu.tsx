import React, { useState } from 'react';
import { Menu, X, Settings, Package, LogOut } from 'lucide-react';
import { ActiveTab } from '../types';

interface BurgerMenuProps {
  onNavigate: (tab: ActiveTab) => void;
  onLogout: () => void;
}

export const BurgerMenu: React.FC<BurgerMenuProps> = ({ onNavigate, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'manage-products' as ActiveTab, label: 'Manage Products', icon: Package },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (tab: ActiveTab) => {
    onNavigate(tab);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="p-3 rounded-xl text-accent-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 h-[100vh] z-50 flex justify-end">
          {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
          {/* Panel */}
          <div className="relative h-full w-80 bg-white shadow-strong flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-xl text-accent-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <nav className="space-y-2">
                {menuItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleItemClick(id)}
                    className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-accent-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </nav>
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => { onLogout(); setIsOpen(false); }}
                  className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-primary hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};