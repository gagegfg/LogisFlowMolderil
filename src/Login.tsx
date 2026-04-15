import React, { useState } from 'react';
import { loginWithGoogle } from './firebase';
import { Shield, Truck, UserSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full max-w-[1200px] mx-auto mt-8 md:mt-16 grid md:grid-cols-2 glass-panel rounded-xl overflow-hidden shadow-2xl min-h-[750px] relative z-10">
      {/* Left Side: Login Form */}
      <section className="flex flex-col justify-center px-8 md:px-20 py-12 relative z-10">
        <div className="mb-12">
          <span className="text-2xl font-extrabold tracking-tighter text-primary font-headline glow-text">LogiFlow</span>
        </div>
        
        <div className="space-y-3 mb-10">
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-white">Bienvenido de nuevo</h1>
          <p className="text-on-surface-variant font-medium">Accede a tu centro de control de flota global.</p>
        </div>

        <div className="space-y-6">
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all glow-primary shadow-lg shadow-primary/10 flex justify-center items-center gap-3"
          >
            {loading ? 'Autorizando...' : 'Autorizar Acceso con Google'}
          </button>
        </div>

        {/* Role Identifiers */}
        <div className="mt-12 pt-8 border-t border-outline-variant">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-6 text-center">Perfiles de Acceso Autorizados</p>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant group-hover:border-primary/40 transition-colors">
                <Shield className="text-primary/70 group-hover:text-primary w-6 h-6" />
              </div>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Administrador</span>
            </div>
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant group-hover:border-primary/40 transition-colors">
                <Truck className="text-primary/70 group-hover:text-primary w-6 h-6" />
              </div>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Chofer</span>
            </div>
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant group-hover:border-primary/40 transition-colors">
                <UserSearch className="text-primary/70 group-hover:text-primary w-6 h-6" />
              </div>
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Solicitante</span>
            </div>
          </div>
          <p className="mt-8 text-center text-[10px] text-on-surface-variant leading-relaxed font-medium">
            Enrutamiento autónomo activado. La selección del espacio de trabajo será determinada por la identidad corporativa verificada.
          </p>
        </div>
      </section>

      {/* Right Side: Visual/Editorial Hero */}
      <section className="hidden md:block relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1586528116311-ad8ed7c50a63?q=80&w=2070&auto=format&fit=crop" 
            alt="Global Logistics Hub" 
            className="w-full h-full object-cover grayscale brightness-[0.4] contrast-[1.1]" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[#060e20]/60 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex flex-col justify-end p-12">
          <div className="glass-panel p-8 rounded-lg">
            <div className="mb-6 flex gap-3">
              <div className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-full">
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Ops en Vivo</span>
              </div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">v2.4.0</span>
              </div>
            </div>
            <h2 className="text-4xl font-extrabold font-headline leading-tight text-white mb-4">
              Seguimiento preciso en cada kilómetro.
            </h2>
            <p className="text-on-surface-variant font-medium leading-relaxed max-w-sm">
              Nuestro flujo orquestado asegura que tu flota siempre esté en movimiento, tu manifiesto siempre sea preciso y tus datos siempre sean accionables.
            </p>
            
            {/* Stats / Bento highlight */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="glass-input rounded-lg p-4">
                <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Envíos Globales</p>
                <p className="text-2xl font-extrabold text-white">1.2M+</p>
              </div>
              <div className="glass-input rounded-lg p-4">
                <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Tasa de Puntualidad</p>
                <p className="text-2xl font-extrabold text-white">99.8%</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract Decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-32 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
      </section>
    </main>
  );
}
