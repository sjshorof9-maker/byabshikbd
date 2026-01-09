
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';

interface SubscriptionManagerProps {
  businessData: any;
  onRefresh: () => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ businessData, onRefresh }) => {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [txnId, setTxnId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  
  // Pre-load default or cached wallets to prevent empty UI
  const [adminWallets, setAdminWallets] = useState({ 
    bkash: 'Loading...', 
    nagad: 'Loading...', 
    rocket: 'Loading...' 
  });

  // Fetch admin wallets immediately on mount so they are ready when plan is selected
  useEffect(() => {
    let isMounted = true;
    const fetchAdminWallets = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('courier_config')
          .eq('business_id', 'system-platform')
          .maybeSingle();
        
        if (isMounted && data?.courier_config) {
          setAdminWallets({
            bkash: data.courier_config.bkash || '01XXXXXXXXX',
            nagad: data.courier_config.nagad || '01XXXXXXXXX',
            rocket: data.courier_config.rocket || '01XXXXXXXXX'
          });
        }
      } catch (e) {
        console.error("Wallet fetch error", e);
      }
    };
    fetchAdminWallets();
    return () => { isMounted = false; };
  }, []);

  const plans = [
    { id: 'starter', name: "Starter", price: 250, duration: "প্রতি মাস", durationDays: 30, features: ["Lead Tracking", "Order Management", "Staff Audit", "Financial Reports"] },
    { id: 'business', name: "Business", price: 999, duration: "৬ মাস", durationDays: 180, features: ["Lead Tracking", "Order Management", "Staff Audit", "Financial Reports"], recommended: true },
    { id: 'enterprise', name: "Enterprise", price: 2999, duration: "১ বছর", durationDays: 365, features: ["Lead Tracking", "Order Management", "Staff Audit", "Financial Reports"] }
  ];

  const handleSubmitPayment = async () => {
    if (!paymentPhone || !txnId || !selectedPlan) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('businesses').update({
        transaction_id: txnId.trim().toUpperCase(),
        payment_phone: paymentPhone.trim(),
        selected_plan: String(selectedPlan.id),
        selected_plan_name: String(selectedPlan.name),
        selected_plan_price: Number(selectedPlan.price),
        selected_plan_days: Number(selectedPlan.durationDays)
      }).eq('id', businessData.id);

      if (!error) {
        onRefresh();
        alert("পেমেন্ট তথ্য সাবমিট হয়েছে! অ্যাডমিন ভেরিফাই করলে আপনার একাউন্ট আপডেট হবে।");
        setSelectedPlan(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = businessData?.transaction_id && businessData?.plan !== 'pro';
  const isPro = businessData?.plan === 'pro';
  const isExpired = businessData?.expires_at && new Date(businessData.expires_at) < new Date();

  const handlePlanClick = (plan: any) => {
    setSelectedPlan(plan);
    // Execute scroll instantly after state update
    requestAnimationFrame(() => {
      const terminal = document.getElementById('payment-terminal');
      if (terminal) {
        terminal.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  return (
    <div className="space-y-12 pb-40 animate-in fade-in duration-700">
      {/* Dynamic Status Header */}
      <div className="bg-slate-950 p-10 md:p-14 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
           <div>
              <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">Subscription <br/> <span className="text-orange-500">Node</span></h2>
              <div className="flex flex-wrap items-center gap-4 mt-6">
                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                   isExpired ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                   isPending ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse' :
                   isPro ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                   'bg-slate-500/10 text-slate-400'
                 }`}>
                   {isExpired ? '⚠️ Expired' : isPending ? '⏳ Pending' : isPro ? '🛡️ Pro Active' : '📋 Trial Access'}
                 </span>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Business ID: {businessData.id}</p>
              </div>
           </div>
           <div className="text-center md:text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Service Valid Until</p>
              <p className="text-4xl font-black tracking-tighter text-orange-500 italic">
                {new Date(businessData.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
           </div>
        </div>
      </div>

      {/* Plan Selection Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-10 ${isPending ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
        {plans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const isActive = isPro && businessData.selected_plan === plan.id;
          return (
            <div 
              key={plan.id} 
              onClick={() => handlePlanClick(plan)} 
              className={`p-12 rounded-[4.5rem] border-4 transition-all flex flex-col relative group cursor-pointer ${
                isSelected ? 'border-orange-600 bg-white shadow-3xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl'
              }`}
            >
              <h3 className="text-2xl font-black uppercase mb-4 italic tracking-tight">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                 <span className="text-6xl font-black italic tracking-tighter text-slate-950">৳{plan.price}</span>
                 <span className="text-slate-400 font-bold text-xs uppercase">/ {plan.duration}</span>
              </div>
              <ul className="space-y-4 mb-12 flex-1 pt-6 border-t border-slate-50">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 italic">
                    <span className="w-5 h-5 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center text-[10px]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button 
                type="button" 
                className={`w-full py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest transition-all ${
                  isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                  isSelected ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 
                  'bg-slate-100 text-slate-400 group-hover:bg-slate-950 group-hover:text-white'
                }`}
              >
                {isActive ? 'Current Plan' : isSelected ? 'Selected' : 'Choose Package'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment Terminal - Loads instantly with pre-fetched data */}
      {selectedPlan && (
        <div id="payment-terminal" className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/2 space-y-10">
               <div className="pb-6 border-b border-slate-100">
                  <h3 className="text-3xl font-black italic tracking-tighter text-slate-950 uppercase">Payment Terminal</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Select method for <span className="text-orange-600">{selectedPlan.name} Node</span></p>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                 {[
                   { id: 'bkash', name: 'bKash', color: 'bg-pink-50 border-pink-200 text-pink-600', activeBg: 'bg-pink-600' },
                   { id: 'nagad', name: 'Nagad', color: 'bg-orange-50 border-orange-200 text-orange-600', activeBg: 'bg-orange-600' },
                   { id: 'rocket', name: 'Rocket', color: 'bg-indigo-50 border-indigo-200 text-indigo-600', activeBg: 'bg-indigo-600' }
                 ].map(method => (
                   <div 
                     key={method.id} 
                     onClick={() => setPaymentMethod(method.id as any)} 
                     className={`flex items-center justify-between p-6 rounded-[2.5rem] border transition-all cursor-pointer ${
                       paymentMethod === method.id ? method.color : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                     }`}
                   >
                     <div>
                       <span className={`text-[9px] font-black uppercase tracking-widest ${paymentMethod === method.id ? '' : 'text-slate-400'}`}>{method.name} (Personal)</span>
                       <p className="text-2xl font-mono font-black text-slate-950 mt-1">{adminWallets[method.id as keyof typeof adminWallets]}</p>
                     </div>
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${paymentMethod === method.id ? method.activeBg + ' text-white' : 'bg-white text-slate-200 border border-slate-100'}`}>
                        {paymentMethod === method.id ? '✓' : ''}
                     </div>
                   </div>
                 ))}
               </div>

               <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 italic">
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                    ⚠️ Instruction: Send Money (৳{selectedPlan.price}) to the number above. Then enter Sender Number and Transaction ID in the form to your right.
                  </p>
               </div>
            </div>

            <div className="lg:w-1/2 p-12 bg-slate-950 rounded-[3.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-[60px] rounded-full"></div>
               
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Sender Number</label>
                  <input 
                    type="text" 
                    value={paymentPhone} 
                    onChange={(e) => setPaymentPhone(e.target.value)} 
                    placeholder="01XXXXXXXXX" 
                    className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[2rem] text-xl font-black font-mono outline-none focus:border-orange-500 transition-all text-white" 
                  />
               </div>
               
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Transaction ID (TnxID)</label>
                  <input 
                    type="text" 
                    value={txnId} 
                    onChange={(e) => setTxnId(e.target.value)} 
                    placeholder="ABC123XYZ" 
                    className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-[2rem] text-xl font-black font-mono outline-none focus:border-orange-500 transition-all text-white uppercase" 
                  />
               </div>

               <div className="pt-4">
                 <button 
                   onClick={handleSubmitPayment} 
                   disabled={isSubmitting || !paymentPhone || !txnId} 
                   className="w-full py-6 bg-orange-600 hover:bg-orange-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-orange-600/20 active:scale-95 disabled:opacity-30 transition-all"
                 >
                   {isSubmitting ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Verifying Node...
                      </div>
                   ) : 'Submit Verification 🚀'}
                 </button>
                 <button 
                  onClick={() => setSelectedPlan(null)}
                  className="w-full text-[9px] font-black text-slate-500 uppercase tracking-widest mt-6 hover:text-white transition-colors"
                 >
                  Cancel Selection
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
