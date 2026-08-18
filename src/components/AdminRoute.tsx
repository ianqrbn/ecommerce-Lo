import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function AdminRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-vinho-600" />
      </div>
    );
  }

  // Verifica se o usuário está logado e tem a flag de admin no perfil
  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
