import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: User | null;
  requiredRole?: 'admin';
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  user, 
  requiredRole,
  redirectTo = '/' 
}) => {
  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If a specific role is required, check if user has the required role
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // If user has access, render the protected component
  return <>{children}</>;
}; 