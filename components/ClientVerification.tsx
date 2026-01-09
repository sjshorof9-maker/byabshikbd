
import React, { useState, useMemo } from 'react';
import { supabase, stringifyError } from '../services/supabase';

interface ClientVerificationProps {
  businesses: any[];
  onUpdate: () => void;
}

const ClientVerification: React.FC<ClientVerificationProps> = ({ businesses, onUpdate }) => {
  const [filter, setFilter] = useState<'pending' | 'active'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  
  const [confirmingAction, setConfirmingAction] = useState<{
    biz: any;
    type: 'approve' | 'reject';
  } | null>(null);

  const pendingRequests = useMemo(() => 
    businesses.filter(b => b.transaction_id && b.plan !== 'pro'), 
  [businesses]);

  const activeClients = useMemo(() => 
    businesses.filter(b => b.plan === 'pro'), 
  [businesses]);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const executeApprove = async () => {
    if (!confirmingAction) return;
    const { biz } = confirmingAction;
    setIsProcessing(true);

    try {
      const planDays = biz.selected_plan_days || 30;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + planDays);

      // Real Supabase Update
      const { error } = await supabase
        .from('businesses')
        .update({
          plan: 'pro',
          expires_at: expiryDate.toISOString(),
          transaction_id: null,
          payment_phone: null
        })
        .eq('id', biz.id);

      if (error) throw error;
      
      onUpdate(); 
      triggerToast(`✅ Node Activated: ${biz.name} is now PRO.`);
    } catch (err: any) {
      console.error("Activation Error:", err);
      alert(`অ্যাক্টিভেশন ফেইল হয়েছে: ${stringifyError(err)}`);
    } finally {
      setIsProcessing(false);
      setConfirmingAction(null);
    }
  };

  const executeReject = async () => {
    if (!confirmingAction) return;
    const { biz } = confirmingAction;
    setIsProcessing(true);

    try {
      // Real Supabase Update to clear the request
      const { error } = await supabase
        .from('businesses')
        .update({
          transaction_id: null,
          payment_phone: null
        })
        .eq('id', biz.id);

      if (error) throw error;
      
      onUpdate(); 
      triggerToast(`⚠️ Request for ${biz.name} Rejected.`);
    } catch (err: any) {
      console.error("Rejection Error:", err);
      alert(`অপারেশন ফেইল হয়েছে: ${stringifyError(err)}`);
    } finally {
      setIsProcessing(false);
      setConfirmingAction(null);
    }
  };

  const list = filter === 'pending' ? pendingRequests : activeClients;

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-500 relative">
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl border border-white/10 font-black uppercase text-[10px] tracking-widest animate-in slide-in-from-top-10">
          {showToast}
        </div>
      )}

      {confirmingAction && (
        <div className="fixed inset-0 z-[900] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-3xl border border-slate-100 text-center space-y-8">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-xl ${confirmingAction.type === 'approve' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {confirmingAction.type === 'approve' ? '🎯' : '⚠️'}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">
                  {confirmingAction.type === 'approve' ? 'Authorize Activation' : 'Execute Rejection'}
                </h3>
                <p className="text-slate-400 font-bold mt-2 italic">Node: {confirmingAction.biz.name}</p>
                {confirmingAction.type === 'approve' && (
                  <p className="text-[10px] font-black text-indigo-600 uppercase mt-4 bg-indigo-50 py-2 rounded-xl border border-indigo-100">
                    Plan: {confirmingAction.biz.selected_plan_name || 'Business'}
                  </p>
                )}
              </div>
              <div className="flex gap-4 pt-4">
                 <button 
                   onClick={() => setConfirmingAction(null)}
                   className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                 >
                   Abort
                 </button>
                 <button 
                   onClick={confirmingAction.type === 'approve' ? executeApprove : executeReject}
                   disabled={isProcessing}
                   className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${confirmingAction.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'}`}
                 >
                   {isProcessing ? 'Processing...' : 'Confirm Protocol'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900">Audit Terminal</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Protocol Access Control</p>
        </div>
        <div className="flex bg-white p-2 rounded-3xl border border-slate-100 shadow-2xl">
           <button 
             onClick={() => setFilter('pending')} 
             className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Pending Requests ({pendingRequests.length})
           </button>
           <button 
             onClick={() => setFilter('active')} 
             className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'active' ? 'bg-slate-950 text-white shadow-lg shadow-black/20' : 'text-slate-400 hover:text-slate-600'}`}
           >
             Active Nodes ({activeClients.length})
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-white/5">
              <tr>
                <th className="px-12 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Infrastructure Node</th>
                {filter === 'pending' && <th className="px-12 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Plan Intelligence</th>}
                <th className="px-12 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Vector</th>
                <th className="px-12 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.map(biz => (
                <tr key={biz.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                  <td className="px-12 py-10">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-slate-950 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl italic shadow-xl group-hover:rotate-6 transition-transform">
                         {biz.name ? biz.name.charAt(0) : 'B'}
                       </div>
                       <div>
                         <p className="font-black text-slate-900 text-2xl italic uppercase tracking-tighter leading-none mb-2">{biz.name}</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network ID: {biz.id}</p>
                       </div>
                    </div>
                  </td>
                  
                  {filter === 'pending' && (
                    <td className="px-12 py-10 text-center">
                       <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 inline-block">
                         <p className="text-sm font-black text-indigo-600 uppercase italic tracking-tight">{biz.selected_plan_name || 'Starter'}</p>
                         <p className="text-xl font-black text-slate-900 tracking-tighter mt-1">৳{biz.selected_plan_price || 0}</p>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Validity: {biz.selected_plan_days || 30} days</p>
                       </div>
                    </td>
                  )}

                  <td className="px-12 py-10">
                    {biz.transaction_id ? (
                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                        <p className="text-orange-600 font-mono font-black text-lg tracking-widest uppercase">{biz.transaction_id}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">From: {biz.payment_phone}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Node Verified Active</span>
                      </div>
                    )}
                  </td>

                  <td className="px-12 py-10 text-right">
                    {filter === 'pending' ? (
                      <div className="flex justify-end gap-4">
                        <button 
                          onClick={() => setConfirmingAction({ biz, type: 'approve' })} 
                          className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          Verify & Activate
                        </button>
                        <button 
                          onClick={() => setConfirmingAction({ biz, type: 'reject' })} 
                          className="px-8 py-4 bg-white border border-rose-200 text-rose-500 hover:bg-rose-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-slate-950 text-white px-6 py-2 rounded-full border border-white/10 shadow-xl flex items-center gap-3">
                           <span className="text-[10px] font-black uppercase tracking-widest italic">{biz.active_plan_name || 'Active Pro'}</span>
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        </div>
                        {biz.expires_at && (
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             Node Expiry: {new Date(biz.expires_at).toLocaleDateString('en-GB')}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={filter === 'pending' ? 4 : 3} className="py-40 text-center opacity-20 italic font-black uppercase tracking-[0.5em] bg-white">
                    <span className="text-8xl block mb-6">🛰️</span>
                    No {filter} data in buffer
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientVerification;
