import React from 'react';
import { ApiService } from '../../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback = null }) => {
  const isAuthed = !!ApiService.getToken();
  if (!isAuthed) return <>{fallback}</>;
  return <>{children}</>;
};

export default ProtectedRoute;
