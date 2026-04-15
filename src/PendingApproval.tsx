import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db, logout } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Clock, MessageCircle, LogOut } from 'lucide-react';

export default function PendingApproval() {
  const { profile } = useAuth();
  const [adminPhone, setAdminPhone] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'general')).then(docSnap => {
      if (docSnap.exists() && docSnap.data().adminPhone) {
        setAdminPhone(docSnap.data().adminPhone);
      }
    });
  }, []);

  const handleWhatsApp = () => {
    const appUrl = window.location.origin;
    const acceptLink = `${appUrl}/approve?uid=${profile?.uid}&action=accept`;
    const rejectLink = `${appUrl}/approve?uid=${profile?.uid}&action=reject`;
    
    const text = `Hola, soy ${profile?.displayName} (${profile?.email}). Acabo de registrarme en LogiFlow y solicito aprobación para acceder al sistema.\n\nPara ACEPTAR la solicitud, haz clic aquí:\n${acceptLink}\n\nPara RECHAZAR la solicitud, haz clic aquí:\n${rejectLink}`;
    
    const phone = adminPhone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-xl max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-tertiary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-tertiary" />
        </div>
        <h2 className="text-2xl font-extrabold font-headline text-white">Cuenta Pendiente</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Tu cuenta ha sido creada exitosamente, pero requiere aprobación de un administrador para acceder al sistema.
        </p>
        
        {adminPhone ? (
          <button 
            onClick={handleWhatsApp}
            className="w-full bg-[#25D366] text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all flex justify-center items-center gap-3 shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle className="w-5 h-5" />
            Notificar por WhatsApp
          </button>
        ) : (
          <p className="text-xs text-tertiary bg-tertiary/10 p-3 rounded-lg">
            El administrador aún no ha configurado un número de contacto. Por favor, espera a ser aprobado.
          </p>
        )}

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
