
import React, { useMemo, useState, useEffect } from 'react';
import { User, UserRole, ChatMessage } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  logoUrl?: string | null;
  systemIcon?: string;
  businessData?: any;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeTab, setActiveTab, logoUrl, systemIcon, businessData }) => {
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  const isOwner = user.role === UserRole.OWNER;
  const [unreadTrigger, setUnreadTrigger] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUnreadTrigger(prev => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const hasUnreadMessages = useMemo(() => {
    const saved = localStorage.getItem('byabshik_messages');
    if (!saved) return false;
    const msgs: ChatMessage[] = JSON.parse(saved);
    return msgs.some(m => m.receiverId === user.id && m.isRead === false);
  }, [activeTab, unreadTrigger, user.id]);

  let navItems = [];
  
  if (isSuperAdmin) {
    navItems = [
      { id: 'dashboard', name: 'Dashboard', icon: '📊', mobile: true },
      { id: 'verification', name: 'Verification', icon: '🛡️', mobile: true },
      { id: 'settings', name: 'Global Settings', icon: '⚙️', mobile: true }
    ];
  } else if (isOwner) {
    navItems = [
      { id: 'dashboard', name: 'Dashboard', icon: '📊', mobile: true },
      { id: 'orders', name: 'Orders', icon: '📦', mobile: true },
      { id: 'create', name: 'New', icon: '➕', mobile: true },
      { id: 'leads', name: 'Leads', icon: '📞', mobile: true },
      { id: 'messages', name: 'Messages', icon: '💬', mobile: true, notification: hasUnreadMessages },
      { id: 'billing', name: 'Subscription', icon: '💳', mobile: false },
      { id: 'products', name: 'Stock', icon: '🛒', mobile: false },
      { id: 'moderators', name: 'Team', icon: '👥', mobile: false },
      { id: 'settings', name: 'Settings', icon: '⚙️', mobile: true }
    ];
  } else {
    navItems = [
      { id: 'myleads', name: 'Calls', icon: '📞', mobile: true },
      { id: 'orders', name: 'Orders', icon: '📦', mobile: true },
      { id: 'create', name: 'New', icon: '➕', mobile: true },
      { id: 'messages', name: 'Messages', icon: '💬', mobile: true, notification: hasUnreadMessages }
    ];
  }

  const getDaysLeft = () => {
    if (!businessData?.expires_at) return null;
    const expiry = new Date(businessData.expires_at).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const daysLeft = getDaysLeft();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      <header className="md:hidden sticky top-0 z-50 bg-slate-950 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
           <div className={`${isSuperAdmin ? 'bg-indigo-600' : 'bg-orange-600'} w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden`}>
               {systemIcon ? <img src={systemIcon} className="w-full h-full object-cover" /> : <span className="text-xs font-black">{isSuperAdmin ? 'SA' : 'BY'}</span>}
           </div>
           <span className="font-black tracking-tighter text-sm uppercase truncate w-32">{businessData?.name || 'Byabshik'}</span>
        </div>
        <div className="flex items-center gap-3">
          {!isSuperAdmin && (
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${businessData?.plan === 'pro' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-400'}`}>
              {businessData?.plan === 'pro' ? 'PRO' : 'TRIAL'}
            </span>
          )}
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
        </div>
      </header>

      <aside className="hidden md:flex w-64 bg-slate-950 text-white flex-shrink-0 flex-col border-r border-slate-900 shadow-xl overflow-y-auto h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className={`${isSuperAdmin ? 'bg-indigo-600' : 'bg-orange-600'} w-12 h-12 rounded-xl shadow-lg flex items-center justify-center overflow-hidden`}>
                {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : <span className="text-xl font-black">{isSuperAdmin ? 'SA' : 'BY'}</span>}
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg font-black tracking-tighter leading-none truncate w-32">{businessData?.name || (isSuperAdmin ? 'System Admin' : 'Byabshik')}</h1>
              <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest truncate">Enterprise Hub</p>
            </div>
          </div>

          {!isSuperAdmin && (
            <div className={`mt-6 p-4 rounded-2xl border ${businessData?.plan === 'pro' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
               <div className="flex justify-between items-center mb-1">
                 <span className={`text-[8px] font-black uppercase tracking-widest ${businessData?.plan === 'pro' ? 'text-indigo-400' : 'text-orange-400'}`}>
                   Status: {businessData?.plan?.toUpperCase()}
                 </span>
               </div>
               {daysLeft !== null && (
                 <p className="text-xs font-black text-white italic">
                   {daysLeft} days left
                 </p>
               )}
            </div>
          )}
        </div>

        <nav className="mt-2 px-4 space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all relative ${
                activeTab === item.id
                  ? `${isSuperAdmin ? 'bg-indigo-600' : 'bg-orange-600'} text-white shadow-lg translate-x-1`
                  : 'text-slate-500 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
              {item.notification && (
                <span className="absolute right-4 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]"></span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900 bg-black/20 mt-auto">
          <button onClick={onLogout} className="w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-900 rounded-xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 flex justify-around items-center z-50 pb-safe shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)]">
        {navItems.filter(item => item.mobile).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all px-3 py-1 rounded-xl relative ${
              activeTab === item.id ? (isSuperAdmin ? 'text-indigo-600' : 'text-orange-600') : 'text-slate-400'
            }`}
          >
            <span className={`text-xl ${activeTab === item.id ? 'scale-125' : ''}`}>{item.icon}</span>
            <span className={`text-[9px] font-black uppercase tracking-tighter ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.name}</span>
            {item.notification && (
              <span className="absolute top-1 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
