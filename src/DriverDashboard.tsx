import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Calendar, DollarSign, Navigation, AlertCircle } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

export default function DriverDashboard({ activeTab }: { activeTab: string }) {
  const { profile } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    // Listen to pending orders
    const qPending = query(
      collection(db, 'orders'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setAvailableOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      unsubPending();
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
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold font-headline text-white">Mis Entregas</h2>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold font-headline text-white">Pedidos Disponibles</h2>
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
    </div>
  );
}

const DriverOrderCard: React.FC<{ order: any, onAccept?: () => void, onUpdateStatus?: (status: string) => void, isAssigned: boolean }> = ({ order, onAccept, onUpdateStatus, isAssigned }) => {
  const statusColors: Record<string, string> = {
    pending: 'text-tertiary border-tertiary/30 bg-tertiary/10',
    assigned: 'text-primary border-primary/30 bg-primary/10',
    in_transit: 'text-primary border-primary/30 bg-primary/10',
    completed: 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
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
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 mb-6">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <Calendar className="w-4 h-4 text-primary/70" />
          <span>{order.date ? format(new Date(order.date), "dd 'de' MMM, HH:mm 'hs'", { locale: es }) : 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <MapPin className="w-4 h-4 text-primary/70" />
          <span className="truncate">{order.contactPerson}</span>
        </div>
        {order.requiresCashPayment && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <DollarSign className="w-4 h-4 text-primary/70" />
            <span>{formatCurrency(order.cashAmount)}</span>
          </div>
        )}
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
