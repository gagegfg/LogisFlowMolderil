import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, MapPin, Calendar, AlertCircle, FileText, DollarSign, XCircle, Navigation, HelpCircle, X } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

export default function RequesterDashboard({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'orders'),
      where('requesterId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        cancelReason: 'Cancelado por el solicitante',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error cancelling order", error);
    }
  };

  if (activeTab === 'new-order') {
    return <NewOrderForm onSuccess={() => setActiveTab('orders')} />;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold font-headline text-white">Mis Solicitudes</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-full bg-surface-variant text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-colors"
            title="Ayuda"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('new-order')}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all glow-primary"
          >
            Nueva Solicitud
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-primary">Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-xl">
          <Package className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No hay solicitudes activas</h3>
          <p className="text-on-surface-variant">Aún no has creado ninguna solicitud de logística.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onCancel={() => handleCancelOrder(order.id)} />
          ))}
        </div>
      )}

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
              Ayuda: Panel de Solicitante
            </h2>
            <div className="space-y-4 text-on-surface-variant text-sm leading-relaxed">
              <p><strong>Crear Solicitud:</strong> Usa el botón "Nueva Solicitud" para pedir un retiro o envío. Puedes especificar si es urgente, la dirección (texto, link de Maps o GPS) y si requiere pago en efectivo.</p>
              <p><strong>Seguimiento:</strong> En esta pantalla verás tus solicitudes. El estado cambiará automáticamente cuando un chofer acepte el viaje ("Asignado") y cuando esté en camino ("En tránsito").</p>
              <p><strong>Cancelaciones:</strong> Puedes cancelar un pedido siempre y cuando siga en estado "Pendiente". Si un administrador cancela tu pedido, verás el motivo resaltado en rojo en la tarjeta del pedido.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const OrderCard: React.FC<{ order: any, onCancel: () => void }> = ({ order, onCancel }) => {
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

  const handleConfirmDate = async (accept: boolean) => {
    try {
      if (accept) {
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'planned',
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'orders', order.id), {
          status: 'cancelled',
          cancelReason: 'El solicitante rechazó la fecha propuesta',
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error updating order", error);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
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
          <h3 className="text-lg font-bold text-white">{order.location}</h3>
        </div>
        {order.status === 'pending' && (
          <button 
            onClick={onCancel}
            className="text-error/70 hover:text-error transition-colors"
            title="Cancelar Pedido"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="space-y-3">
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
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
            <span className="truncate">{order.contactPerson}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {order.requiresCashPayment && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <DollarSign className="w-4 h-4 text-primary/70 shrink-0" />
              <span>{formatCurrency(order.cashAmount)}</span>
            </div>
          )}
          {order.documents && order.documents.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <FileText className="w-4 h-4 text-primary/70 shrink-0" />
              <span>{order.documents.length} Docs</span>
            </div>
          )}
          {order.observations && (
            <div className="flex items-start gap-2 text-sm text-on-surface-variant">
              <FileText className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
              <p className="line-clamp-2">{order.observations}</p>
            </div>
          )}
        </div>
      </div>

      {order.status === 'pending_confirmation' && order.plannedDate && (
        <div className="mt-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <h4 className="text-sm font-bold text-warning mb-2">Nueva fecha propuesta por el planificador</h4>
          <p className="text-white text-sm mb-4">
            {format(new Date(order.plannedDate), "EEEE dd 'de' MMMM, HH:mm 'hs'", { locale: es })}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => handleConfirmDate(true)}
              className="bg-warning text-warning-container px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Aceptar Fecha
            </button>
            <button 
              onClick={() => handleConfirmDate(false)}
              className="border border-error/50 text-error px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-error/10 transition-all"
            >
              Rechazar y Cancelar
            </button>
          </div>
        </div>
      )}

      {order.status === 'planned' && order.plannedDate && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm text-white">
            Planificado para: {format(new Date(order.plannedDate), "dd MMM, HH:mm", { locale: es })}
          </span>
        </div>
      )}

      {order.status === 'cancelled' && order.cancelReason && (
        <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
          <strong>Motivo de cancelación:</strong> {order.cancelReason}
        </div>
      )}
    </div>
  );
}

export function NewOrderForm({ onSuccess }: { onSuccess: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [formData, setFormData] = useState({
    type: 'pickup',
    priority: 'medium',
    windowStart: '',
    windowEnd: '',
    location: '',
    mapsLink: '',
    coordinates: null as { lat: number, lng: number } | null,
    contactPerson: '',
    observations: '',
    requiresCashPayment: false,
    cashAmount: ''
  });

  const handleGetLocation = () => {
    setLocationStatus('Obteniendo ubicación...');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        setLocationStatus('✅ Ubicación obtenida');
      }, (error) => {
        console.error('Error getting location:', error);
        setLocationStatus('❌ Error al obtener ubicación (revisa los permisos)');
      });
    } else {
      setLocationStatus('❌ Navegador no soportado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      const orderData: any = {
        requesterId: profile.uid,
        type: formData.type,
        status: 'pending',
        priority: formData.priority,
        windowStart: formData.windowStart,
        windowEnd: formData.windowEnd,
        location: formData.location,
        contactPerson: formData.contactPerson,
        observations: formData.observations,
        requiresCashPayment: formData.requiresCashPayment,
        cashAmount: formData.requiresCashPayment ? Number(formData.cashAmount) : 0,
        documents: [], // Mocking documents for now
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (formData.mapsLink) orderData.mapsLink = formData.mapsLink;
      if (formData.coordinates) orderData.coordinates = formData.coordinates;

      await addDoc(collection(db, 'orders'), orderData);
      onSuccess();
    } catch (error) {
      console.error("Error creating order", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-extrabold font-headline text-white mb-6">Nueva Solicitud</h2>
      <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-xl space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Tipo</label>
            <select 
              className="w-full px-4 py-3 glass-input text-white rounded-lg appearance-none"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="pickup">Retiro</option>
              <option value="delivery">Envío</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Prioridad</label>
            <select 
              className="w-full px-4 py-3 glass-input text-white rounded-lg appearance-none"
              value={formData.priority}
              onChange={e => setFormData({...formData, priority: e.target.value})}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Fecha Inicio (Desde)</label>
            <input 
              type="datetime-local" 
              required
              className="w-full px-4 py-3 glass-input text-white rounded-lg"
              value={formData.windowStart}
              onChange={e => setFormData({...formData, windowStart: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Fecha Límite (Hasta)</label>
            <input 
              type="datetime-local" 
              required
              className="w-full px-4 py-3 glass-input text-white rounded-lg"
              value={formData.windowEnd}
              onChange={e => setFormData({...formData, windowEnd: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-outline-variant">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Ubicación</h3>
            <a 
              href="https://www.google.com/maps" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-tertiary hover:underline"
            >
              <MapPin className="w-3 h-3" /> Buscar en Google Maps
            </a>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Dirección Exacta (Texto)</label>
            <input 
              type="text" 
              required
              placeholder="Av. Corrientes 1234, Depósito B"
              className="w-full px-4 py-3 glass-input text-white rounded-lg"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Enlace de Google Maps (Opcional)</label>
            <input 
              type="url" 
              placeholder="https://maps.app.goo.gl/..."
              className="w-full px-4 py-3 glass-input text-white rounded-lg"
              value={formData.mapsLink}
              onChange={e => setFormData({...formData, mapsLink: e.target.value})}
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={handleGetLocation}
              className="flex items-center gap-2 bg-surface-variant border border-outline-variant text-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-all"
            >
              <Navigation className="w-4 h-4" />
              Usar mi ubicación actual
            </button>
            {locationStatus && <span className="text-xs text-on-surface-variant">{locationStatus}</span>}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-outline-variant">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Persona de Contacto</label>
            <input 
              type="text" 
              required
              placeholder="Juan Pérez (+54 11 1234-5678)"
              className="w-full px-4 py-3 glass-input text-white rounded-lg"
              value={formData.contactPerson}
              onChange={e => setFormData({...formData, contactPerson: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Observaciones / Detalles</label>
            <textarea 
              placeholder="Detalles sobre la carga, horarios específicos, etc."
              className="w-full px-4 py-3 glass-input text-white rounded-lg resize-none h-24"
              value={formData.observations}
              onChange={e => setFormData({...formData, observations: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Documentos (PDFs/Imágenes)</label>
          <input 
            type="file" 
            multiple
            accept=".pdf,image/*"
            className="w-full px-4 py-3 glass-input text-white rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
          />
          <p className="text-xs text-on-surface-variant mt-1">Los archivos se organizarán por ID de pedido automáticamente.</p>
        </div>

        <div className="pt-4 border-t border-outline-variant">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-outline-variant bg-surface-container-highest text-primary focus:ring-primary/50"
              checked={formData.requiresCashPayment}
              onChange={e => setFormData({...formData, requiresCashPayment: e.target.checked})}
            />
            <span className="text-sm font-medium text-white">Requiere Pago en Efectivo</span>
          </label>
          
          {formData.requiresCashPayment && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Monto (ARS)</label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 glass-input text-white rounded-lg"
                value={formData.cashAmount}
                onChange={e => setFormData({...formData, cashAmount: e.target.value})}
              />
            </div>
          )}
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all glow-primary mt-8"
        >
          {loading ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </form>
    </div>
  );
}
