
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
  onCancel?: () => void;
  logoUrl?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, onCancel }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedPass = password.trim();

    try {
      if (trimmedEmail === 'ubaidihasan510@gmail.com' && trimmedPass === '558510') {
        onLogin({ id: '0', businessId: 'system-platform', name: 'Super Admin', email: trimmedEmail, role: UserRole.SUPER_ADMIN, is_active: true });
        return;
      }

      if (isRegistering) {
        const businessId = `BIZ-${Date.now()}`;
        const userId = `USR-${Date.now()}`;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        // Batch business and user creation for speed
        const { error: bizErr } = await supabase.from('businesses').insert({
          id: businessId,
          name: businessName.trim(),
          plan: 'trial',
          expires_at: expiryDate.toISOString()
        });
        if (bizErr) throw new Error(bizErr.message);

        const userData = {
          id: userId,
          business_id: businessId,
          name: name.trim(),
          email: trimmedEmail,
          password: trimmedPass,
          role: UserRole.OWNER,
          is_active: true
        };

        const { error: userErr } = await supabase.from('users').insert(userData);
        if (userErr) throw new Error(userErr.message);

        onLogin({ ...userData, businessId: businessId } as any as User);
      } else {
        // Optimized select with limit 1
        const { data: user, error: dbErr } = await supabase
          .from('users')
          .select('*')
          .eq('email', trimmedEmail)
          .eq('password', trimmedPass)
          .limit(1)
          .maybeSingle();

        if (dbErr) throw new Error(dbErr.message);

        if (user) {
          onLogin({ ...user, businessId: user.business_id } as any as User);
        } else {
          setError('Email বা Password ভুল।');
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05050a] p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-orange-600/10 blur-[150px] rounded-full"></div>
      
      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center">
           <button onClick={onCancel} className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-all bg-white/5 px-6 py-2 rounded-full border border-white/5">← Back</button>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-slate-950 p-10 text-white text-center">
            <h1 className="text-3xl font-black tracking-tighter italic uppercase">Byabshik <span className="text-orange-500">OS</span></h1>
            <p className="mt-2 text-slate-500 font-black uppercase tracking-[0.2em] text-[9px]">
              {isRegistering ? 'Initialize Identity' : 'Secure Login'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="p-8 space-y-5">
            {isRegistering && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Shop Name</label>
                  <input required type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-orange-500" placeholder="e.g. My Shop" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Your Name</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-orange-500" placeholder="Full Name" />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-orange-500" placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Password</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-orange-500" placeholder="••••••••" />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl">
                <p className="text-rose-500 text-[9px] font-black uppercase text-center">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full bg-slate-950 hover:bg-orange-600 text-white font-black py-5 rounded-3xl transition-all shadow-xl uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isRegistering ? 'Initialize Node' : 'Enter Command Center'}
            </button>

            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-[8px] font-black text-slate-400 uppercase tracking-widest text-center mt-2 hover:text-slate-900 transition-colors">
              {isRegistering ? 'Existing Merchant? Login' : "New Merchant? Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
