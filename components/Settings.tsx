
import React, { useState, useEffect, useRef } from 'react';
import { CourierConfig, UserRole } from '../types';
import { testSteadfastConnection } from '../services/courierService';
import { supabase, stringifyError } from '../services/supabase';

interface SettingsProps {
  config: CourierConfig;
  onSave: (config: CourierConfig) => void;
  logoUrl?: string | null;
  onUpdateLogo: (url: string | null) => void;
  currentUser?: any;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave, logoUrl, onUpdateLogo, currentUser }) => {
  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const logoInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const courierLogoInputRef = useRef<HTMLInputElement>(null);

  const [localLogo, setLocalLogo] = useState<string | null>(logoUrl || null);
  const [formData, setFormData] = useState<any>({
    apiKey: config.apiKey || '',
    secretKey: config.secretKey || '',
    baseUrl: config.baseUrl || 'https://portal.steadfast.com.bd/api/v1',
    webhookUrl: config.webhookUrl || '',
    accountEmail: config.accountEmail || '',
    accountPassword: config.accountPassword || '',
    bkash: '',
    nagad: '',
    rocket: '',
    systemIcon: '',
    steadfastLogo: '',
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync prop changes to local state
  useEffect(() => {
    if (logoUrl) setLocalLogo(logoUrl);
  }, [logoUrl]);

  // Load existing settings from cloud on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const targetId = isSuperAdmin ? 'system-platform' : currentUser.businessId;
        const { data, error } = await supabase.from('settings').select('*').eq('business_id', targetId).maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          const cloudConfig = data.courier_config || {};
          setFormData((prev: any) => ({ 
            ...prev, 
            ...cloudConfig,
            apiKey: cloudConfig.apiKey || prev.apiKey,
            secretKey: cloudConfig.secretKey || prev.secretKey
          }));
          
          if (data.logo_url) {
            setLocalLogo(data.logo_url);
          }
        }
      } catch (err) {
        console.error("Settings Load Error:", err);
      }
    };
    fetchSettings();
  }, [isSuperAdmin, currentUser.businessId]);

  const triggerCloudSync = async (updatedConfig: any) => {
    setAutoSaveStatus('saving');
    setErrorMessage(null);
    try {
      await onSave(updatedConfig);
      setAutoSaveStatus('success');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (err: any) {
      setErrorMessage(stringifyError(err));
      setAutoSaveStatus('error');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleBlurSave = () => {
    triggerCloudSync(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon' | 'courierLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        alert("File too large. Max 800KB allowed.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setAutoSaveStatus('saving');
        
        try {
          if (type === 'logo') {
            setLocalLogo(base64);
            await onUpdateLogo(base64);
          } else {
            const nextData = { ...formData };
            if (type === 'icon') nextData.systemIcon = base64;
            if (type === 'courierLogo') nextData.steadfastLogo = base64;
            setFormData(nextData);
            await onSave(nextData);
          }
          setAutoSaveStatus('success');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (err) {
          setErrorMessage(stringifyError(err));
          setAutoSaveStatus('error');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="bg-slate-950 text-white p-4 rounded-3xl shadow-xl italic font-black text-xl">⚙️</div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Infrastructure Config</h2>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-2 h-2 rounded-full ${autoSaveStatus === 'saving' ? 'bg-indigo-500 animate-ping' : autoSaveStatus === 'success' ? 'bg-emerald-500' : autoSaveStatus === 'error' ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
               <p className={`text-[11px] font-black uppercase tracking-widest ${autoSaveStatus === 'error' ? 'text-rose-500' : 'text-slate-400'}`}>
                 {autoSaveStatus === 'saving' ? 'Synchronizing Assets...' : autoSaveStatus === 'success' ? 'Cloud Sync Successful' : autoSaveStatus === 'error' ? 'Sync Failed' : 'System Ready'}
               </p>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-rose-600 font-bold text-xs animate-in slide-in-from-top-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">⚠️</span>
            <span className="uppercase tracking-widest">Protocol Sync Error</span>
          </div>
          <p className="opacity-90 leading-relaxed font-mono">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-12">
        {isSuperAdmin && (
          <div className="bg-slate-950 rounded-[4rem] shadow-2xl border border-white/10 p-12 md:p-16 border-l-[1rem] border-indigo-600 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full"></div>
            <div className="relative z-10 space-y-12">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] italic">Byabshik OS Global Branding</h3>
                {autoSaveStatus === 'saving' && <span className="text-[8px] font-black text-indigo-400 animate-pulse uppercase tracking-widest">Updating Cloud Assets...</span>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-4">
                   <label className="text-[10px] font-black text-pink-500 uppercase tracking-widest ml-2">Subscription bKash</label>
                   <input 
                    type="text" 
                    value={formData.bkash} 
                    onChange={(e) => handleInputChange('bkash', e.target.value)}
                    onBlur={handleBlurSave}
                    className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[2rem] text-white font-mono font-black outline-none focus:border-pink-500 transition-all text-xl tracking-widest" 
                    placeholder="01XXXXXXXXX" 
                   />
                 </div>
                 <div className="space-y-4">
                   <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-2">Subscription Nagad</label>
                   <input 
                    type="text" 
                    value={formData.nagad} 
                    onChange={(e) => handleInputChange('nagad', e.target.value)}
                    onBlur={handleBlurSave}
                    className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[2rem] text-white font-mono font-black outline-none focus:border-orange-500 transition-all text-xl tracking-widest" 
                    placeholder="01XXXXXXXXX" 
                   />
                 </div>
                 <div className="space-y-4">
                   <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Subscription Rocket</label>
                   <input 
                    type="text" 
                    value={formData.rocket} 
                    onChange={(e) => handleInputChange('rocket', e.target.value)}
                    onBlur={handleBlurSave}
                    className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[2rem] text-white font-mono font-black outline-none focus:border-indigo-500 transition-all text-xl tracking-widest" 
                    placeholder="01XXXXXXXXX" 
                   />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-8 border-t border-white/5">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Platform Logo (Sidebar)</label>
                  <div className="flex flex-col items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/10 group">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 p-2 transition-transform group-hover:scale-105">
                      {localLogo ? <img src={localLogo} className="w-full h-full object-contain" alt="Logo" /> : <div className="text-[10px] font-black text-indigo-500 italic uppercase">BY</div>}
                    </div>
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="w-full px-6 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">Change Logo</button>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">System Icon (Header)</label>
                  <div className="flex flex-col items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/10 group">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 p-4 transition-transform group-hover:scale-105">
                      {formData.systemIcon ? <img src={formData.systemIcon} className="w-full h-full object-contain" alt="Icon" /> : <div className="text-[10px] font-black text-orange-500 italic uppercase">SA</div>}
                    </div>
                    <button type="button" onClick={() => iconInputRef.current?.click()} className="w-full px-6 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">Change Icon</button>
                    <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'icon')} />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Global Courier Icon</label>
                  <div className="flex flex-col items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/10 group">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 p-2 transition-transform group-hover:scale-105">
                      {formData.steadfastLogo ? <img src={formData.steadfastLogo} className="w-full h-full object-contain" alt="Courier Logo" /> : <img src="https://portal.steadfast.com.bd/assets/img/logo.png" className="w-full h-full object-contain opacity-20" alt="Courier Placeholder" />}
                    </div>
                    <button type="button" onClick={() => courierLogoInputRef.current?.click()} className="w-full px-6 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">Change Icon</button>
                    <input type="file" ref={courierLogoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'courierLogo')} />
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/5 text-center">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.5em] italic">Platform Identity Node — Managed by System Administrator</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[4rem] shadow-3xl border border-slate-100 overflow-hidden group">
          <div className="bg-[#0e1628] p-12 text-white relative flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-20 h-20 bg-white rounded-3xl p-3 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
                <img src={formData.steadfastLogo || "https://portal.steadfast.com.bd/assets/img/logo.png"} alt="Steadfast" className="w-full object-contain" />
              </div>
              <div>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Steadfast API</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">Merchant Core Integration</p>
              </div>
            </div>
            {!isSuperAdmin && (
              <button type="button" onClick={async () => {
                const res = await testSteadfastConnection(formData);
                alert(res.message);
              }} className="relative z-10 bg-white/10 hover:bg-white text-white hover:text-slate-950 text-[11px] font-black py-5 px-10 rounded-[1.5rem] border border-white/10 uppercase tracking-widest transition-all active:scale-95">⚡ TEST CONNECTION</button>
            )}
          </div>

          <div className="p-12 md:p-16 space-y-12 bg-slate-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Merchant Email</label>
                  <input type="email" value={formData.accountEmail} onChange={(e) => handleInputChange('accountEmail', e.target.value)} onBlur={handleBlurSave} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">API Key</label>
                  <input type="text" value={formData.apiKey} onChange={(e) => handleInputChange('apiKey', e.target.value)} onBlur={handleBlurSave} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-[11px] font-mono font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Secret Key</label>
                  <input type="password" value={formData.secretKey} onChange={(e) => handleInputChange('secretKey', e.target.value)} onBlur={handleBlurSave} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-[11px] font-mono font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-2 italic">Webhook URL</label>
                  <input type="text" value={formData.webhookUrl} onChange={(e) => handleInputChange('webhookUrl', e.target.value)} onBlur={handleBlurSave} className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm" />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
