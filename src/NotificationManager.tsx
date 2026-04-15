import React, { useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export default function NotificationManager() {
  const { profile } = useAuth();
  const previousOrders = useRef<Record<string, any>>({});
  const initialLoad = useRef(true);

  useEffect(() => {
    if (!profile) return;

    // Intentar solicitar permisos para notificaciones del navegador (puede ser bloqueado en iframes)
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (e) {
      console.warn("No se pudieron solicitar permisos de notificación del navegador:", e);
    }

    let q;
    if (profile.role === 'requester') {
      q = query(collection(db, 'orders'), where('requesterId', '==', profile.uid));
    } else if (profile.role === 'driver') {
      q = query(collection(db, 'orders')); 
    } else if (profile.role === 'admin') {
      q = query(collection(db, 'orders'));
    } else {
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (initialLoad.current) {
        snapshot.docs.forEach(doc => {
          previousOrders.current[doc.id] = doc.data();
        });
        initialLoad.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;

        if (change.type === 'added') {
          if (profile.role === 'admin') {
            notify(`Nuevo pedido creado: ${data.location}`, '📦');
          } else if (profile.role === 'driver' && data.status === 'pending') {
            notify(`Nuevo pedido disponible para retiro`, '🚚');
          }
        }

        if (change.type === 'modified') {
          const prevData = previousOrders.current[id];
          if (prevData && prevData.status !== data.status) {
            handleStatusChange(data.status, data, profile.role);
          }
        }

        // Actualizar la referencia local
        previousOrders.current[id] = data;
      });
    });

    return () => unsubscribe();
  }, [profile]);

  const notify = (message: string, icon: string) => {
    // Notificación en la app (Toast)
    toast(message, { icon });
    
    // Notificación del navegador (Push) si está permitida
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('LogiFlow', { body: message });
      }
    } catch (e) {
      // Ignorar errores en iframe
    }
  };

  const handleStatusChange = (newStatus: string, order: any, role: string) => {
    if (role === 'requester') {
      switch (newStatus) {
        case 'assigned': notify('Tu pedido ha sido asignado a un chofer.', '👨‍✈️'); break;
        case 'in_transit': notify('Tu pedido está en camino.', '🚚'); break;
        case 'completed': notify('Tu pedido ha sido completado.', '✅'); break;
        case 'cancelled': notify('Tu pedido ha sido cancelado.', '❌'); break;
      }
    } else if (role === 'admin') {
      switch (newStatus) {
        case 'completed': notify(`Pedido completado: ${order.location}`, '✅'); break;
        case 'cancelled': notify(`Pedido cancelado: ${order.location}`, '❌'); break;
      }
    } else if (role === 'driver') {
      if (newStatus === 'cancelled' && order.driverId === profile?.uid) {
        notify('Un pedido asignado a ti ha sido cancelado.', '❌');
      }
    }
  };

  return null; // Este componente no renderiza UI, solo maneja la lógica
}
