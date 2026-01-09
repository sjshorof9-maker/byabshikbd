
import React, { useState, useMemo } from 'react';
import { User, UserRole, Lead, Order } from '../types';

interface ModeratorManagerProps {
  moderators: User[];
  leads: Lead[];
  orders: Order[];
  onAddModerator: (moderator: User & { password?: string }) => Promise<boolean | undefined>;
  onDeleteModerator: (modId: string) => Promise<void>;
  onToggleStatus: (modId: string, isActive: boolean) => Promise<void>;
  currentUser: User;
}

const ModeratorManager: React.FC<ModeratorManagerProps> = ({ moderators, leads, orders, onAddModerator, onDeleteModerator, onToggleStatus, currentUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || isVerifying) return;

    setIsVerifying(true);
    const newModId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
    
    const newModerator = {
      id: String(newModId), 
      businessId: currentUser.businessId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: UserRole.MODERATOR,
      password: password.trim(),
      is_active: true
    };

    const success = await onAddModerator(newModerator);
    
    if (success) {
      setName('');
      setEmail('');
      setPassword('');
      setIsAdding(false);
    }
    setIsVerifying(false);
  };

  const isOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff < 120000; 
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    const idStr = String(id);
    setActionId(idStr);
    try {
      await onToggleStatus(idStr, !currentState);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (mod: User) => {
    const idStr = String(mod.id);
    if (confirm(`⚠️ TERMINATE ACCESS: ${mod.name}?\nএই মেম্বারকে ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হবে। আপনি কি নিশ্চিত?`)) {
      setActionId(idStr);
      try {
        await onDeleteModerator(idStr);
      } catch (err) {
        console.error("Delete Action Failed:", err);
      } finally {
        setActionId(null);
      }
    }
  };

  const filteredModerators = moderators.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const teamStats = useMemo(() => {
    const todayLeads = leads.filter(l => l.assignedDate === todayStr);
    const todayCalled = todayLeads.filter(l => l.status !== 'pending');
    const todayOrders = orders.filter(o => o.createdAt.split('T')[0] === todayStr);
    
    return {
      totalLeads: todayLeads.length,
      totalCalled: todayCalled.length,
      totalOrders: todayOrders.length,
      efficiency: todayLeads.length > 0 ? Math.round((todayCalled.length / todayLeads.length) * 100) : 0
    };
  }, [leads, orders, todayStr]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">Team Intelligence</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></span>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Operational Unit Control Panel</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search member..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 md:w-64 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          />
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
              isAdding ? 'bg-slate-950 text-white' : 'bg-indigo-600 text-white shadow-indigo-500/20'
            }`}
          >
            {isAdding ? 'Close Enrollment' : '+ Recruit Member'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Team Today Leads</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{teamStats.totalLeads}</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Calls Made</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{teamStats.totalCalled}</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confirmed Orders</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{teamStats.totalOrders}</p>
         </div>
         <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Team Efficiency</p>
            <p className="text-2xl font-black text-orange-500 mt-1">{teamStats.efficiency}%</p>
         </div>
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg font-black">?</div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Identity Token Generation</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assign new operational clearance</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="e.g. Arif Hossain" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="name@byabshik.com" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                <input required type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="Min 6 characters" />
              </div>
              <div className="md:col-span-3 flex justify-end pt-4">
                <button 
                  type="submit" 
                  disabled={isVerifying}
                  className={`bg-slate-950 text-white px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all hover:bg-black active:scale-95 flex items-center gap-3 ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isVerifying ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enrolling...
                    </>
                  ) : 'Verify & Enroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredModerators.filter(m => m.id !== 'admin-root' && m.id !== '0').length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <div className="text-6xl mb-6 opacity-20">👥</div>
             <p className="font-black text-slate-400 italic uppercase tracking-[0.2em]">No unit members found.</p>
          </div>
        ) : (
          filteredModerators.filter(m => m.id !== 'admin-root' && m.id !== '0').map((mod: any) => {
            const modIdStr = String(mod.id);
            const online = isOnline(mod.lastSeen);
            const isActive = mod.is_active !== false;
            
            const todayLeads = leads.filter(l => String(l.moderatorId) === modIdStr && l.assignedDate === todayStr);
            const todayCalled = todayLeads.filter(l => l.status !== 'pending').length;
            const todayOrdersCount = orders.filter(o => String(o.moderatorId) === modIdStr && o.createdAt.split('T')[0] === todayStr).length;
            const callCompletionRate = todayLeads.length > 0 ? Math.round((todayCalled / todayLeads.length) * 100) : 0;

            const isProcessing = actionId === modIdStr;

            return (
              <div key={modIdStr} className={`group relative bg-white p-8 rounded-[3rem] border transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 ${!isActive ? 'border-rose-100 bg-rose-50/10' : 'border-slate-100'} ${isProcessing ? 'opacity-40' : ''}`}>
                <div className="flex justify-between items-center mb-8">
                   <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${online ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                     {online ? '● Online Now' : '○ Offline'}
                   </div>
                   <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isActive ? 'Active Access' : 'Access Blocked'}
                      </span>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleToggle(modIdStr, isActive)}
                        className={`w-12 h-6 rounded-full p-1 transition-all relative flex items-center ${isActive ? 'bg-indigo-600' : 'bg-rose-500'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                   </div>
                </div>

                <div className="flex items-center gap-6 mb-8">
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-2xl shadow-xl transition-transform group-hover:scale-110 ${isActive ? 'bg-slate-950 text-white shadow-indigo-500/20' : 'bg-slate-200 text-slate-400'}`}>
                    {mod.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-xl font-black text-slate-900 leading-none truncate">{mod.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 truncate">{mod.email}</p>
                    <div className="flex items-center gap-1 mt-3">
                       <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">ID: {modIdStr}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today's Pulse</p>
                    <span className="text-[10px] font-black text-indigo-600">{callCompletionRate}% Done</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                       <p className="text-xs font-black text-slate-900 leading-none">{todayLeads.length}</p>
                       <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Assigned</p>
                    </div>
                    <div className="text-center border-x border-slate-200">
                       <p className="text-xs font-black text-blue-600 leading-none">{todayCalled}</p>
                       <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Called</p>
                    </div>
                    <div className="text-center">
                       <p className="text-xs font-black text-emerald-600 leading-none">{todayOrdersCount}</p>
                       <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Orders</p>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                      style={{ width: `${callCompletionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => handleDelete(mod)}
                     disabled={isProcessing}
                     className={`flex-1 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 ${isProcessing ? 'cursor-not-allowed' : ''}`}
                   >
                     {isProcessing ? (
                       <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                     ) : '🗑️ Delete Member'}
                   </button>
                   <button className="w-14 h-14 rounded-2xl bg-slate-950 text-white hover:bg-indigo-600 transition-all flex items-center justify-center text-xl shadow-lg shadow-indigo-500/10">
                     👁️
                   </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ModeratorManager;
