import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ApproveUser() {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando solicitud...');

  const uid = searchParams.get('uid');
  const action = searchParams.get('action');

  useEffect(() => {
    const processApproval = async () => {
      if (!profile) return; // Wait for auth to load

      if (profile.role !== 'admin') {
        setStatus('error');
        setMessage('No tienes permisos de administrador para realizar esta acción.');
        return;
      }

      if (!uid || !action) {
        setStatus('error');
        setMessage('Enlace inválido o incompleto.');
        return;
      }

      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setStatus('error');
          setMessage('El usuario no existe.');
          return;
        }

        const newRole = action === 'accept' ? 'requester' : 'rejected';
        await updateDoc(userRef, { role: newRole });

        setStatus('success');
        setMessage(`Usuario ${action === 'accept' ? 'aprobado' : 'rechazado'} exitosamente.`);
        
        setTimeout(() => {
          navigate('/');
        }, 3000);

      } catch (error) {
        console.error("Error updating user:", error);
        setStatus('error');
        setMessage('Ocurrió un error al procesar la solicitud.');
      }
    };

    processApproval();
  }, [profile, uid, action, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-xl max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        )}
        {status === 'success' && (
          <CheckCircle className="w-16 h-16 text-[#4ade80] mx-auto" />
        )}
        {status === 'error' && (
          <XCircle className="w-16 h-16 text-error mx-auto" />
        )}
        
        <h2 className="text-2xl font-extrabold font-headline text-white">
          {status === 'loading' ? 'Procesando...' : status === 'success' ? '¡Éxito!' : 'Error'}
        </h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          {message}
        </p>
        
        {status !== 'loading' && (
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-surface-variant text-white py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-surface-container-highest transition-all mt-4"
          >
            Volver al Inicio
          </button>
        )}
      </div>
    </div>
  );
}
