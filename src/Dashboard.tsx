import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { logout } from './firebase';
import { LogOut, LayoutDashboard, PlusCircle, List, Users, Settings, XCircle, Calendar } from 'lucide-react';
import RequesterDashboard from './RequesterDashboard';
import DriverDashboard from './DriverDashboard';
import AdminDashboard from './AdminDashboard';
import PendingApproval from './PendingApproval';

export default function Dashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!profile) return null;

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    driver: 'Chofer',
    requester: 'Solicitante',
    pending: 'Pendiente',
    rejected: 'Rechazado'
  };

  if (profile.role === 'pending') {
    return <PendingApproval />;
  }

  if (profile.role === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-xl max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-2xl font-extrabold font-headline text-white">Acceso Denegado</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Tu solicitud de acceso ha sido rechazada por un administrador.
          </p>
          <button 
            onClick={logout}
            className="w-full flex justify-center items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-white transition-colors mt-4"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-surface-container-low border-b md:border-b-0 md:border-r border-outline-variant flex flex-col">
        <div className="p-6 border-b border-outline-variant">
          <span className="text-2xl font-extrabold tracking-tighter text-primary font-headline glow-text">LogiFlow</span>
          <div className="mt-4">
            <p className="text-sm font-bold text-white">{profile.displayName}</p>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">{roleLabels[profile.role]}</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant hover:bg-surface-variant hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Resumen
          </button>
          
          {profile.role === 'requester' && (
            <button 
              onClick={() => setActiveTab('new-order')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'new-order' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant hover:bg-surface-variant hover:text-white'}`}
            >
              <PlusCircle className="w-5 h-5" />
              Nueva Solicitud
            </button>
          )}
          
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant hover:bg-surface-variant hover:text-white'}`}
          >
            <List className="w-5 h-5" />
            {profile.role === 'driver' ? 'Mis Entregas' : 'Todos los Pedidos'}
          </button>

          {profile.role === 'admin' && (
            <>
              <button 
                onClick={() => setActiveTab('planning')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'planning' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant hover:bg-surface-variant hover:text-white'}`}
              >
                <Calendar className="w-5 h-5" />
                Planificación
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant hover:bg-surface-variant hover:text-white'}`}
              >
                <Users className="w-5 h-5" />
                Usuarios
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant hover:bg-surface-variant hover:text-white'}`}
              >
                <Settings className="w-5 h-5" />
                Configuración
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-outline-variant">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {profile.role === 'requester' && <RequesterDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
        {profile.role === 'driver' && <DriverDashboard activeTab={activeTab} />}
        {profile.role === 'admin' && <AdminDashboard activeTab={activeTab} />}
      </main>
    </div>
  );
}
