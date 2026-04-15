import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Calendar, DollarSign, Navigation, AlertCircle, HelpCircle, X } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

export default function DriverDashboard({ activeTab }: { activeTab: string }) {
  const { profile } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!profile) return;

    // Listen to available orders (planned but no driver, or pending if you want drivers to take them directly)
    // Let's show 'planned' orders that don't have a driver assigned yet.
    const qAvailable = query(
      collection(db, 'orders'),
      where('status', '==', 'planned'),
      orderBy('createdAt', 'desc')
    );

    const unsubAvailable = onSnapshot(qAvailable, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter out those that already have a driver assigned
      setAvailableOrders(docs.filter((d: any) => !d.driverId));
    });

    // Listen to driver's assigned orders
    const qAssigned = query(
      collection(db, 'orders'),
      where('driverId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubAssigned = onSnapshot(qAssigned, (snapshot) => {
      setMyOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubAvailable();
      unsubAssigned();
    };
  }, [profile]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'assigned',
        driverId: profile.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error accepting order", error);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  if (activeTab === 'orders') {
    return (
      <div className="space-y-6 relative">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold font-headline text-white">Mis Entregas</h2>
          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-full bg-surface-variant text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-colors"
            title="Ayuda"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
        {myOrders.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-xl">
            <h3 className="text-xl font-bold text-white mb-2">No hay entregas activas</h3>
            <p className="text-on-surface-variant">Acepta un pedido desde el resumen para comenzar.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {myOrders.map(order => (
              <DriverOrderCard 
                key={order.id} 
                order={order} 
                onUpdateStatus={(status) => handleUpdateStatus(order.id, status)} 
                isAssigned={true}
              />
            ))}
          </div>
        )}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold font-headline text-white">Pedidos Disponibles</h2>
        <button 
          onClick={() => setShowHelp(true)}
          className="p-2 rounded-full bg-surface-variant text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-colors"
          title="Ayuda"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>
      {loading ? (
        <div className="text-primary">Cargando pedidos...</div>
      ) : availableOrders.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-xl">
          <h3 className="text-xl font-bold text-white mb-2">No hay pedidos pendientes</h3>
          <p className="text-on-surface-variant">Vuelve a revisar más tarde.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {availableOrders.map(order => (
            <DriverOrderCard 
              key={order.id} 
              order={order} 
              onAccept={() => handleAcceptOrder(order.id)} 
              isAssigned={false}
            />
          ))}
        </div>
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="glass-panel p-8 rounded-xl max-w-2xl w-full relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-on-surface-variant hover:text-white"
      >
        <X className="w-6 h-6" />
      </button>
      <h2 className="text-2xl font-extrabold font-headline text-white mb-6 flex items-center gap-3">
        <HelpCircle className="w-8 h-8 text-primary" />
        Ayuda: Panel de Chofer
      </h2>
      <div className="space-y-4 text-on-surface-variant text-sm leading-relaxed">
        <p><strong>Pedidos Disponibles (Resumen):</strong> Aquí verás todos los pedidos que están pendientes de ser tomados por un chofer. Puedes revisar la dirección, fecha y si requiere cobrar en efectivo. Haz clic en "Aceptar Pedido" para asignártelo.</p>
        <p><strong>Mis Entregas:</strong> Una vez que aceptas un pedido, aparecerá aquí. Desde esta pestaña debes actualizar el estado del viaje.</p>
        <p><strong>Estados del Viaje:</strong> Cuando estés en camino al destino, haz clic en "Iniciar Viaje" (En Tránsito). Una vez que hayas entregado/retirado el paquete, haz clic en "Marcar Completado".</p>
        <p><strong>Navegación:</strong> Usa los botones "Ver en Maps" o "Coordenadas GPS" para abrir la ubicación directamente en Google Maps en tu celular.</p>
      </div>
    </div>
  </div>
);

const DriverOrderCard: React.FC<{ order: any, onAccept?: () => void, onUpdateStatus?: (status: string) => void, isAssigned: boolean }> = ({ order, onAccept, onUpdateStatus, isAssigned }) => {
  const statusColors: Record<string, string> = {
    pending: 'text-tertiary border-tertiary/30 bg-tertiary/10',
    planned: 'text-primary border-primary/30 bg-primary/10',
    assigned: 'text-primary border-primary/30 bg-primary/10',
    in_transit: 'text-primary border-primary/30 bg-primary/10',
    completed: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    planned: 'Planificado',
    assigned: 'Asignado',
    in_transit: 'En tránsito',
    completed: 'Completado',
  };

  const typeLabels: Record<string, string> = {
    pickup: 'Retiro',
    delivery: 'Envío'
  };

  return (
    <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div>
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
          <h3 className="text-lg font-bold text-white mb-2">{order.location}</h3>
          
          <div className="flex flex-wrap gap-4 mt-2">
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-6">
        <div className="space-y-3">
          {order.plannedDate && (
            <div className="flex items-center gap-2 text-sm text-primary font-bold">
              <Calendar className="w-4 h-4" />
              <span>Planificado: {format(new Date(order.plannedDate), "dd MMM, HH:mm", { locale: es })}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-sm text-on-surface-variant">
            <Calendar className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-0.5">Ventana Solicitada</p>
              <span>
                {order.windowStart ? format(new Date(order.windowStart), "dd MMM, HH:mm", { locale: es }) : 'N/A'} 
                {' - '}
                {order.windowEnd ? format(new Date(order.windowEnd), "dd MMM, HH:mm", { locale: es }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
            <span className="truncate">{order.contactPerson}</span>
          </div>
          {order.requiresCashPayment && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <DollarSign className="w-4 h-4 text-primary/70 shrink-0" />
              <span>{formatCurrency(order.cashAmount)}</span>
            </div>
          )}
          {order.observations && (
            <div className="flex items-start gap-2 text-sm text-on-surface-variant">
              <AlertCircle className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
              <p className="line-clamp-3">{order.observations}</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
        {!isAssigned && onAccept && (
          <button 
            onClick={onAccept}
            className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all glow-primary"
          >
            Aceptar Pedido
          </button>
        )}
        
        {isAssigned && onUpdateStatus && order.status !== 'completed' && (
          <>
            {order.status === 'assigned' && (
              <button 
                onClick={() => onUpdateStatus('in_transit')}
                className="bg-tertiary text-on-primary px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Iniciar Viaje
              </button>
            )}
            {order.status === 'in_transit' && (
              <button 
                onClick={() => onUpdateStatus('completed')}
                className="bg-[#4ade80] text-on-primary px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Marcar Completado
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
