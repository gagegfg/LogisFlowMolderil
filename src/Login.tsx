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
      <section className="hidden md:block relative overflow-hidden bg-[#060e20]">
        {/* Background Image - Portal/Logistics Theme */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop" 
            alt="Logistics Portal" 
            className="w-full h-full object-cover grayscale-[0.2] brightness-[0.8] contrast-[1.1] hover:scale-105 transition-transform duration-[10000ms] ease-out" 
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060e20] via-transparent to-transparent opacity-90"></div>
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#060e20] via-transparent to-transparent opacity-60"></div>
        </div>
        
        {/* Abstract Decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-32 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      </section>
    </main>
  );
}
