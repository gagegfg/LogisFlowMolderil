import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, Calendar, MapPin, DollarSign, Package, Navigation, Users, UserCheck, Shield, Truck, Filter, HelpCircle, X, Plus, MessageCircle } from 'lucide-react';
import { NewOrderForm } from './RequesterDashboard';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

export default function AdminDashboard({ activeTab }: { activeTab: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  
  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, snap => setUsers(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => {
      unsubscribe();
      unsubUsers();
    };
  }, []);

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        cancelReason: reason,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error cancelling order", error);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filterDate) {
      const orderDate = o.plannedDate || o.windowStart || o.date;
      if (!orderDate || !orderDate.startsWith(filterDate)) return false;
    }
    if (filterUser && o.requesterId !== filterUser) return false;
    if (filterPriority && o.priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    inTransit: filteredOrders.filter(o => o.status === 'in_transit').length,
    completed: filteredOrders.filter(o => o.status === 'completed').length,
  };

  if (activeTab === 'users') {
    return <AdminUsersManager />;
  }

  if (activeTab === 'settings') {
    return <AdminSettings />;
  }

  if (activeTab === 'planning') {
    return <AdminPlanning orders={orders} users={users} />;
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold font-headline text-white">Control Global de Flota</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-full bg-surface-variant text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-colors"
            title="Ayuda"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setIsCreatingOrder(true)}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all glow-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nuevo Pedido
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-on-surface-variant mb-1 w-full">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant block mb-1">Fecha</label>
          <input 
            type="date" 
            className="w-full px-3 py-2 glass-input text-white rounded-lg text-sm"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant block mb-1">Usuario Solicitante</label>
          <select 
            className="w-full px-3 py-2 glass-input text-white rounded-lg text-sm appearance-none"
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
          >
            <option value="">Todos los usuarios</option>
            {users.filter(u => u.role === 'requester').map(u => (
              <option key={u.id} value={u.id}>{u.displayName}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant block mb-1">Importancia</label>
          <select 
            className="w-full px-3 py-2 glass-input text-white rounded-lg text-sm appearance-none"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
        {(filterDate || filterUser || filterPriority) && (
          <button 
            onClick={() => { setFilterDate(''); setFilterUser(''); setFilterPriority(''); }}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-error border border-error/30 hover:bg-error/10 transition-all h-[38px]"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Stats / Bento highlight */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-xl p-6">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">Total Filtrados</p>
          <p className="text-3xl font-extrabold text-white">{stats.total}</p>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <p className="text-[10px] font-bold text-tertiary uppercase tracking-[0.2em] mb-2">Pendientes</p>
          <p className="text-3xl font-extrabold text-white">{stats.pending}</p>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">En Tránsito</p>
          <p className="text-3xl font-extrabold text-white">{stats.inTransit}</p>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <p className="text-[10px] font-bold text-[#4ade80] uppercase tracking-[0.2em] mb-2">Completados</p>
          <p className="text-3xl font-extrabold text-white">{stats.completed}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Envíos</h3>
        {loading ? (
          <div className="text-primary">Cargando pedidos...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-xl">
            <Package className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No se encontraron pedidos</h3>
            <p className="text-on-surface-variant">Prueba ajustando los filtros.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => (
              <AdminOrderCard key={order.id} order={order} onCancel={handleCancelOrder} />
            ))}
          </div>
        )}
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-8 rounded-xl max-w-2xl w-full relative">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-extrabold font-headline text-white mb-6 flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-primary" />
              Ayuda: Control Global de Flota
            </h2>
            <div className="space-y-4 text-on-surface-variant text-sm leading-relaxed">
              <p><strong>Filtros:</strong> Utiliza la barra superior para buscar pedidos específicos por fecha, usuario solicitante o nivel de importancia. Las estadísticas se actualizarán automáticamente.</p>
              <p><strong>Planificación:</strong> Revisa los pedidos "Pendientes". Los choferes verán estos pedidos en su panel y podrán aceptarlos. Una vez aceptados, pasarán a "En Tránsito".</p>
              <p><strong>Cancelación de Pedidos:</strong> Si necesitas anular o rechazar un pedido, haz clic en el botón "Cancelar". Se te pedirá que ingreses un motivo. Este motivo será visible inmediatamente para el usuario solicitante en su panel.</p>
              <p><strong>Geolocalización:</strong> Si el solicitante adjuntó coordenadas o un enlace de Google Maps, verás los botones correspondientes en la tarjeta del pedido para abrir la ubicación exacta.</p>
            </div>
          </div>
        </div>
      )}

      {isCreatingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-24 pb-12">
          <div className="w-full max-w-2xl relative">
            <button 
              onClick={() => setIsCreatingOrder(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <NewOrderForm onSuccess={() => setIsCreatingOrder(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

const AdminOrderCard: React.FC<{ order: any, onCancel: (id: string, reason: string) => void }> = ({ order, onCancel }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const statusColors: Record<string, string> = {
    pending: 'text-tertiary border-tertiary/30 bg-tertiary/10',
    pending_confirmation: 'text-warning border-warning/30 bg-warning/10',
    planned: 'text-primary border-primary/30 bg-primary/10',
    assigned: 'text-primary border-primary/30 bg-primary/10',
    in_transit: 'text-primary border-primary/30 bg-primary/10',
    completed: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10',
    cancelled: 'text-error border-error/30 bg-error/10',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    pending_confirmation: 'Requiere Confirmación',
    planned: 'Planificado',
    assigned: 'Asignado',
    in_transit: 'En tránsito',
    completed: 'Completado',
    cancelled: 'Cancelado',
  };

  const typeLabels: Record<string, string> = {
    pickup: 'Retiro',
    delivery: 'Envío'
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) return;
    onCancel(order.id, cancelReason);
    setShowCancelModal(false);
  };

  return (
    <>
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[order.status] || statusColors.pending}`}>
              {statusLabels[order.status] || order.status}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {typeLabels[order.type]}
            </span>
            {order.priority === 'urgent' && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-error flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Urgente
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-white">{order.location}</h3>
          
          <div className="flex flex-wrap gap-4 mt-2 mb-3">
            {order.mapsLink && (
              <a href={order.mapsLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-tertiary hover:underline">
                <Navigation className="w-3 h-3" /> Ver en Maps
              </a>
            )}
            {order.coordinates && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${order.coordinates.lat},${order.coordinates.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-tertiary hover:underline">
                <MapPin className="w-3 h-3" /> Coordenadas GPS
              </a>
            )}
            {order.contactPerson && (
              <a 
                href={`https://wa.me/${order.contactPerson.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-1 text-xs font-bold text-[#25D366] hover:underline"
              >
                <MessageCircle className="w-3 h-3" /> Contactar por WhatsApp
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-start gap-2 text-xs text-on-surface-variant">
              <Calendar className="w-3 h-3 text-primary/70 mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary/70 mb-0.5">Ventana Solicitada</p>
                <span>
                  {order.windowStart ? format(new Date(order.windowStart), "dd MMM, HH:mm", { locale: es }) : 'N/A'} 
                  {' - '}
                  {order.windowEnd ? format(new Date(order.windowEnd), "dd MMM, HH:mm", { locale: es }) : 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <MapPin className="w-3 h-3 text-primary/70" />
              <span>{order.contactPerson}</span>
            </div>
            {order.requiresCashPayment && (
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <DollarSign className="w-3 h-3 text-primary/70" />
                <span>{formatCurrency(order.cashAmount)}</span>
              </div>
            )}
            {order.observations && (
              <div className="flex items-start gap-2 text-xs text-on-surface-variant w-full mt-2">
                <Package className="w-3 h-3 text-primary/70 mt-0.5 shrink-0" />
                <p className="line-clamp-2">{order.observations}</p>
              </div>
            )}
          </div>
          
          {(order.plannedDate || order.driverId) && (
            <div className="mt-4 pt-3 border-t border-outline-variant flex flex-wrap gap-4 text-xs">
              {order.plannedDate && (
                <div className="flex items-center gap-1 text-primary">
                  <Calendar className="w-3 h-3" />
                  <span>Planificado: {format(new Date(order.plannedDate), "dd MMM, HH:mm", { locale: es })}</span>
                </div>
              )}
              {order.driverId && (
                <div className="flex items-center gap-1 text-tertiary">
                  <Truck className="w-3 h-3" />
                  <span>Chofer Asignado</span>
                </div>
              )}
            </div>
          )}

          {order.status === 'cancelled' && order.cancelReason && (
            <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
              <strong>Motivo de cancelación:</strong> {order.cancelReason}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <button 
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-error border border-error/30 hover:bg-error/10 transition-all"
            >
              Cancelar Pedido
            </button>
          )}
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Cancelar Pedido</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Por favor, indica el motivo de la cancelación. El solicitante será notificado.
            </p>
            <textarea 
              className="w-full px-4 py-3 glass-input text-white rounded-lg mb-4 resize-none h-24"
              placeholder="Ej. Falta de disponibilidad de vehículos, dirección incorrecta..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-white transition-colors"
              >
                Volver
              </button>
              <button 
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim()}
                className="bg-error text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AdminUsersManager() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => setUsers(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return unsub;
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      console.error("Error updating user role", error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold font-headline text-white">Gestión de Usuarios</h2>
      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="glass-panel p-6 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-white">{user.displayName}</h3>
                {user.role === 'pending' && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border text-tertiary border-tertiary/30 bg-tertiary/10">
                    Pendiente
                  </span>
                )}
                {user.role === 'admin' && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border text-primary border-primary/30 bg-primary/10">
                    Admin
                  </span>
                )}
                {user.role === 'rejected' && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border text-error border-error/30 bg-error/10">
                    Rechazado
                  </span>
                )}
              </div>
              <p className="text-sm text-on-surface-variant">{user.email}</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {user.role !== 'admin' && (
                <button 
                  onClick={() => updateUserRole(user.id, 'admin')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/30 hover:bg-primary/10 transition-all"
                >
                  <Shield className="w-3 h-3" /> Hacer Admin
                </button>
              )}
              {user.role !== 'driver' && (
                <button 
                  onClick={() => updateUserRole(user.id, 'driver')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white border border-outline-variant hover:bg-surface-container-highest transition-all"
                >
                  <Truck className="w-3 h-3" /> Hacer Chofer
                </button>
              )}
              {user.role !== 'requester' && (
                <button 
                  onClick={() => updateUserRole(user.id, 'requester')}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white border border-outline-variant hover:bg-surface-container-highest transition-all"
                >
                  <UserCheck className="w-3 h-3" /> Hacer Solicitante
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSettings() {
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'general')).then(d => {
      if (d.exists()) setPhone(d.data().adminPhone || '');
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'general'), { adminPhone: phone }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings", error);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-extrabold font-headline text-white">Configuración del Sistema</h2>
      
      <form onSubmit={handleSave} className="glass-panel p-8 rounded-xl space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            WhatsApp del Administrador / Planificador
          </label>
          <p className="text-xs text-on-surface-variant mb-2">
            Ingresa el número con código de país (ej. +5491123456789). Los usuarios nuevos usarán este número para solicitar acceso.
          </p>
          <input 
            type="text" 
            required
            placeholder="+54 9 11 1234-5678"
            className="w-full px-4 py-3 glass-input text-white rounded-lg"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <button 
          type="submit"
          className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all glow-primary"
        >
          {saved ? '¡Guardado!' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  );
}

function AdminPlanning({ orders, users }: { orders: any[], users: any[] }) {
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const drivers = users.filter(u => u.role === 'driver');

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [plannedDate, setPlannedDate] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');

  const handleProposeDate = async () => {
    if (!selectedOrder || !plannedDate) return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: 'pending_confirmation',
        plannedDate,
        driverId: selectedDriver || null,
        updatedAt: serverTimestamp()
      });
      setSelectedOrder(null);
      setPlannedDate('');
      setSelectedDriver('');
    } catch (error) {
      console.error("Error proposing date", error);
    }
  };

  const handleAssignDirectly = async () => {
    if (!selectedOrder || !plannedDate) return;
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: 'planned',
        plannedDate,
        driverId: selectedDriver || null,
        updatedAt: serverTimestamp()
      });
      setSelectedOrder(null);
      setPlannedDate('');
      setSelectedDriver('');
    } catch (error) {
      console.error("Error assigning directly", error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold font-headline text-white mb-6">Planificación de Pedidos</h2>
      
      {pendingOrders.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-xl">
          <Calendar className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No hay pedidos pendientes</h3>
          <p className="text-on-surface-variant">Todos los pedidos han sido planificados o asignados.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Pedidos por Planificar ({pendingOrders.length})</h3>
            <div className="space-y-3">
              {pendingOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className={`glass-panel p-4 rounded-xl cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'border-primary bg-primary/10' : 'hover:bg-surface-variant'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-white">{order.location}</span>
                    {order.priority === 'urgent' && <AlertCircle className="w-4 h-4 text-error" />}
                  </div>
                  <div className="text-xs text-on-surface-variant space-y-1">
                    <p>Ventana: {order.windowStart ? format(new Date(order.windowStart), "dd MMM HH:mm", { locale: es }) : 'N/A'} - {order.windowEnd ? format(new Date(order.windowEnd), "dd MMM HH:mm", { locale: es }) : 'N/A'}</p>
                    <p>Tipo: {order.type === 'pickup' ? 'Retiro' : 'Envío'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {selectedOrder ? (
              <div className="glass-panel p-6 rounded-xl sticky top-6">
                <h3 className="text-lg font-bold text-white mb-4">Planificar Pedido</h3>
                
                <div className="space-y-4">
                  <div className="p-3 bg-surface-container-highest rounded-lg text-sm text-on-surface-variant mb-4">
                    <p><strong>Ubicación:</strong> {selectedOrder.location}</p>
                    <p><strong>Ventana Solicitada:</strong><br/>Desde: {selectedOrder.windowStart ? format(new Date(selectedOrder.windowStart), "dd/MM/yyyy HH:mm") : 'N/A'}<br/>Hasta: {selectedOrder.windowEnd ? format(new Date(selectedOrder.windowEnd), "dd/MM/yyyy HH:mm") : 'N/A'}</p>
                    {selectedOrder.observations && <p className="mt-2 text-white"><strong>Obs:</strong> {selectedOrder.observations}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Fecha y Hora Planificada</label>
                    <input 
                      type="datetime-local" 
                      className="w-full px-4 py-3 glass-input text-white rounded-lg"
                      value={plannedDate}
                      onChange={e => setPlannedDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Asignar Chofer (Opcional)</label>
                    <select 
                      className="w-full px-4 py-3 glass-input text-white rounded-lg appearance-none"
                      value={selectedDriver}
                      onChange={e => setSelectedDriver(e.target.value)}
                    >
                      <option value="">Sin asignar (Choferes pueden tomarlo)</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.displayName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <button 
                      onClick={handleProposeDate}
                      disabled={!plannedDate}
                      className="w-full bg-warning text-warning-container py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      Proponer Fecha al Solicitante
                    </button>
                    <button 
                      onClick={handleAssignDirectly}
                      disabled={!plannedDate}
                      className="w-full border border-primary text-primary py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-primary/10 transition-all disabled:opacity-50"
                    >
                      Asignar Directamente
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center rounded-xl border-dashed border-2 border-outline-variant">
                <p className="text-on-surface-variant">Selecciona un pedido de la lista para planificarlo.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

