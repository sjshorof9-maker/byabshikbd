
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus } from '../types';

interface ModeratorLeadsProps {
  leads: Lead[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
}

const ModeratorLeads: React.FC<ModeratorLeadsProps> = ({ leads = [], onUpdateStatus }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all'>('today');

  const getBSTDate = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 6));
  };

  const todayStr = getBSTDate().toISOString().split('T')[0];
  const tomorrowDate = getBSTDate();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const handleCopy = (num: string, id: string) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Safe Stats Calculation
  const stats = useMemo(() => {
    return {
      pendingToday: (leads || []).filter(l => l && l.assignedDate === todayStr && l.status === 'pending').length,
      tomorrow: (leads || []).filter(l => l && l.assignedDate === tomorrowStr).length,
      total: (leads || []).length,
      confirmedToday: (leads || []).filter(l => l && l.assignedDate === todayStr && l.status === 'confirmed').length
    };
  }, [leads, todayStr, tomorrowStr]);

  // Robust Filtering and Sorting
  const filteredAndSortedLeads = useMemo(() => {
    let result = Array.isArray(leads) ? [...leads] : [];
    
    if (dateFilter === 'today') {
      result = result.filter(l => l && l.assignedDate === todayStr);
    } else if (dateFilter === 'tomorrow') {
      result = result.filter(l => l && l.assignedDate === tomorrowStr);
    }
    
    return result.sort((a, b) => {
      const dateA = a.assignedDate || '';
      const dateB = b.assignedDate || '';
      // Reverse chronological order
      return dateB.localeCompare(dateA) || (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [leads, dateFilter, todayStr, tomorrowStr]);

  const getStatusDisplay = (status: LeadStatus) => {
    const base = "text-[10px] font-black uppercase tracking-widest flex items-center gap-2";
    switch (status) {
      case 'confirmed': return <span className={`${base} text-emerald-500`}><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>Sale Confirmed</span>;
      case 'communication': return <span className={`${base} text-blue-500 animate-pulse`}><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>In Talk</span>;
      case 'no-response': return <span className={`${base} text-rose-500`}><span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>No Answer</span>;
      default: return <span className={`${base} text-slate-400`}><span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>Pending</span>;
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Calling Queue</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-slate-400 font-black uppercase text-[9px] tracking-[0.3em]">Operational Lead Protocol</p>
          </div>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto overflow-x-auto">
          {['today', 'tomorrow', 'all'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setDateFilter(tab as any)}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                dateFilter === tab 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'today' ? `Today (${stats.pendingToday})` : tab === 'tomorrow' ? `Tomorrow (${stats.tomorrow})` : `Lifetime (${stats.total})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Sidebar Stats */}
         <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest relative z-10">Queue Target</p>
               <p className="text-5xl font-black mt-2 italic relative z-10">{stats.pendingToday}</p>
               <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
                 <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-relaxed">System Recommendation: Finish current queue before logging out.</p>
               </div>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Today</p>
                  <p className="text-3xl font-black text-emerald-500 italic">{stats.confirmedToday}</p>
               </div>
               <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl">🏆</div>
            </div>
         </div>

         {/* Leads List */}
         <div className="lg:col-span-3">
           {filteredAndSortedLeads.length === 0 ? (
             <div className="py-24 bg-white rounded-[2.5rem] border border-slate-100 text-center flex flex-col items-center justify-center opacity-40 italic">
               <div className="text-6xl mb-4">📂</div>
               <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">No Leads In Current Protocol</p>
               <p className="text-[9px] font-bold text-slate-300 mt-2">Filter set to: {dateFilter.toUpperCase()}</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
               {filteredAndSortedLeads.map((lead) => (
                 <div key={lead.id} className={`group relative bg-white p-6 rounded-[2.5rem] border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${lead.status !== 'pending' ? 'border-slate-100 opacity-80' : 'border-indigo-100'}`}>
                   
                   <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-50">
                      <div>
                        {getStatusDisplay(lead.status)}
                        <p className={`text-[8px] font-black px-2.5 py-1 rounded-full border mt-2 inline-block ${lead.assignedDate === todayStr ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          {lead.assignedDate === todayStr ? '● Active Today' : lead.assignedDate || 'Unassigned'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCopy(lead.phoneNumber, lead.id)} 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${copiedId === lead.id ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                          title="Copy Number"
                        >
                          <span className="text-base">{copiedId === lead.id ? '✓' : '📋'}</span>
                        </button>
                        <a 
                          href={`tel:${lead.phoneNumber}`} 
                          className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-90 transition-all"
                          title="Call Now"
                        >
                          <span className="text-base">📞</span>
                        </a>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform italic">
                        {lead.customerName ? lead.customerName.charAt(0) : 'P'}
                      </div>
                      <div className="overflow-hidden">
                         <p className="text-xl font-black text-slate-900 font-mono tracking-tighter leading-none truncate">{lead.phoneNumber}</p>
                         <p className="text-[11px] font-black text-indigo-500 uppercase mt-2 tracking-widest truncate leading-none">{lead.customerName || 'Prospect Client'}</p>
                         <p className="text-[9px] text-slate-400 font-bold mt-1.5 truncate italic">{lead.address || 'Address not listed'}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => onUpdateStatus(lead.id, 'confirmed')}
                        className={`py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${lead.status === 'confirmed' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 text-emerald-600 border border-emerald-50 hover:bg-emerald-50'}`}
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => onUpdateStatus(lead.id, 'communication')}
                        className={`py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${lead.status === 'communication' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-blue-600 border border-blue-50 hover:bg-blue-50'}`}
                      >
                        Talking
                      </button>
                      <button 
                        onClick={() => onUpdateStatus(lead.id, 'no-response')}
                        className={`py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${lead.status === 'no-response' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-50 text-rose-500 border border-rose-50 hover:bg-rose-50'}`}
                      >
                        Reject
                      </button>
                   </div>

                </div>
               ))}
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default ModeratorLeads;
