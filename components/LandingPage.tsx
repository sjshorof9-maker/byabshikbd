
import React, { useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  logoUrl?: string | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, logoUrl }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const problems = [
    { title: "একাধিক Moderator থাকলেও নিয়ন্ত্রণ নেই", icon: "🕵️‍♂️", desc: "কারো কাজের কোনো সঠিক ট্র্যাকিং বা জবাবদিহিতা থাকে না।" },
    { title: "Order ম্যানুয়ালি নেওয়ায় ভুল হয়", icon: "📝", desc: "মেসেঞ্জারে বা খাতায় অর্ডার নিতে গিয়ে প্রায়ই তথ্য মিস হয়ে যায়।" },
    { title: "Delivery আপডেট ট্র্যাক করা কঠিন", icon: "🚚", desc: "পার্সেল কোথায় আছে তা জানতে কুরিয়ার প্যানেলে বারবার লগইন করতে হয়।" },
    { title: "Stock ও হিসাব মিলছে না", icon: "📉", desc: "দিনশেষে কত লাভ হলো আর কত স্টক বাকি তা বোঝা অসম্ভব।" }
  ];

  const features = [
    { title: "Moderator Management", icon: "👥", desc: "রোল ও পারমিশন কন্ট্রোল সিস্টেম।" },
    { title: "Call Lead Management", icon: "📞", desc: "পেন্ডিং কল ও কাস্টমার ফলো-আপ।" },
    { title: "Order Hub", icon: "📦", desc: "সেন্ট্রাল অর্ডার প্রসেসিং ও লিস্ট।" },
    { title: "Steadfast Sync", icon: "⚡", desc: "এক ক্লিকে স্ট্যাডফাস্টে পার্সেল বুকিং।" },
    { title: "Account & Sales Report", icon: "📊", desc: "ডেইলি সেলস ও প্রফিট রিপোর্ট।" },
    { title: "Stock Inventory", icon: "🛒", desc: "অটোমেটেড ইনভেন্টরি ট্র্যাকিং।" }
  ];

  const faqs = [
    { q: "এটি কি বাংলাদেশে ব্যবহার করা যাবে?", a: "হ্যাঁ, এটি সম্পূর্ণ বাংলাদেশি ই-কমার্স ও এফ-কমার্স ব্যবসার প্রয়োজনের কথা মাথায় রেখে ডিজাইন করা হয়েছে।" },
    { q: "মোবাইল থেকে কি কাজ করবে?", a: "অবশ্যই! আমাদের প্ল্যাটফর্মটি ১০০% মোবাইল রেসপন্সিভ, ফলে আপনি যেকোনো ডিভাইস থেকে কন্ট্রোল করতে পারবেন।" },
    { q: "Steadfast Delivery কিভাবে যুক্ত?", a: "সিস্টেমের সেটিংসে আপনার স্ট্যাডফাস্ট এপিআই কি সেট করলেই এটি সরাসরি যুক্ত হয়ে যাবে এবং এক ক্লিকে অর্ডার সাবমিট হবে।" },
    { q: "তথ্য কি সুরক্ষিত থাকবে?", a: "আপনার সব তথ্য এন্ড-টু-এন্ড এনক্রিপ্টেড এবং সুরক্ষিত সার্ভারে সেভ থাকে।" }
  ];

  const plans = [
    { id: 'starter', name: "Starter", price: "৳২৫০", duration: "প্রতি মাস", desc: "ছোট পেজের জন্য সেরা", features: ["Lead Tracking", "Order Management", "Staff Audit", "Financial Reports"], popular: false },
    { id: 'business', name: "Business", price: "৳৯৯৯", duration: "৬ মাস", desc: "Growing online shops", features: ["Lead Tracking", "Order Management", "Staff Audit", "Financial Reports"], popular: true },
    { id: 'enterprise', name: "Enterprise", price: "৳২৯৯৯", duration: "১ বছর", desc: "Custom solution", features: ["Lead Tracking", "Order Management", "Staff Audit", "Financial Reports"], popular: false }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-orange-500/30 overflow-x-hidden">
      {/* Dynamic Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[1200px] h-[1200px] bg-orange-600/10 blur-[250px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[1200px] h-[1200px] bg-indigo-600/10 blur-[250px] rounded-full pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-slate-950/40 backdrop-blur-3xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-600/20 overflow-hidden">
              {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" alt="Platform Logo" /> : <span className="text-2xl font-black italic">BY</span>}
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic hidden sm:block">Byabshik <span className="text-orange-500 font-light">OS</span></span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onGetStarted} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all hidden md:block">লগইন</button>
            <button onClick={onGetStarted} className="bg-white text-slate-950 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-xl active:scale-95">গেট স্টার্টেড</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12 animate-in slide-in-from-left-12 duration-1000">
            <div className="inline-flex items-center gap-4 px-5 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-3xl">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400">বাংলাদেশি ব্যবসার জন্য সেরা OS</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1] tracking-tighter uppercase">
              Order হ্যান্ডেল করুন <span className="text-orange-500 italic">স্মার্টভাবে,</span> <br/>
              Moderator রাখুন <span className="text-indigo-400 italic">নিয়ন্ত্রণে</span>
            </h1>
            
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl leading-relaxed italic border-l-4 border-orange-600/30 pl-8">
              বাংলাদেশি অনলাইন ব্যবসার জন্য এক ড্যাশবোর্ডে অর্ডার, মোডারেটর, ডেলিভারি ও স্টক ম্যানেজমেন্ট। আপনার ম্যানুয়াল ব্যবসাকে দিন ডিজিটাল রূপ।
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <button onClick={onGetStarted} className="px-12 py-6 bg-orange-600 hover:bg-white text-white hover:text-slate-950 rounded-[2rem] text-[13px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-orange-600/20 active:scale-95">ফ্রি ট্রায়াল শুরু করুন 🚀</button>
              <button className="px-12 py-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-[2rem] text-[13px] font-black uppercase tracking-widest transition-all backdrop-blur-3xl">লাইভ ডেমো দেখুন</button>
            </div>
          </div>

          {/* Dashboard-Style Visual */}
          <div className="relative group animate-in zoom-in-95 duration-1000">
            <div className="absolute inset-0 bg-indigo-600/20 blur-[150px] rounded-full group-hover:bg-indigo-600/30 transition-all"></div>
            <div className="relative bg-slate-900/60 border border-white/10 rounded-[4rem] p-8 shadow-3xl backdrop-blur-3xl overflow-hidden -rotate-3 group-hover:rotate-0 transition-all duration-1000">
               <div className="bg-slate-950/80 rounded-[3rem] p-8 border border-white/5 space-y-8 h-[550px] flex flex-col font-mono">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2.5">
                       <div className="w-3.5 h-3.5 rounded-full bg-rose-500/50"></div>
                       <div className="w-3.5 h-3.5 rounded-full bg-amber-500/50"></div>
                       <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/50"></div>
                    </div>
                    <div className="px-4 py-1 bg-white/5 rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest border border-white/5">Operational Live</div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Daily Intake</p>
                        <p className="text-3xl font-black text-orange-500 italic">৳৪৮,৫০০</p>
                     </div>
                     <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Staff Efficiency</p>
                        <p className="text-3xl font-black text-white italic">৯৮%</p>
                     </div>
                  </div>
                  <div className="space-y-4 flex-1">
                     <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] border-b border-white/5 pb-2">Active Moderator Monitoring</p>
                     {[
                       { name: 'Arif H.', status: 'On Call', color: 'bg-emerald-500' },
                       { name: 'Sara M.', status: 'Processing', color: 'bg-orange-500' },
                       { name: 'Rony K.', status: 'Idle', color: 'bg-slate-700' }
                     ].map((mod, i) => (
                       <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/5">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-black">M</div>
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{mod.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${mod.color}`}></span>
                             <span className="text-[8px] font-black text-slate-500 uppercase">{mod.status}</span>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-600 rounded-full blur-[100px] opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">আপনার কি এই <span className="text-rose-500">সমস্যাগুলো</span> হচ্ছে?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto italic">অফলাইনে বা খাতা-কলমে ব্যবসা করতে গিয়ে আপনি কি প্রতিদিন এই বাধার সম্মুখীন হচ্ছেন?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {problems.map((p, i) => (
              <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-white/10 transition-all group">
                <div className="text-5xl mb-6 group-hover:scale-125 transition-transform duration-300">{p.icon}</div>
                <h3 className="text-xl font-black uppercase mb-4 text-white leading-tight">{p.title}</h3>
                <p className="text-slate-400 text-sm italic font-medium">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-40 px-6 bg-slate-950/30 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-6">
            <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-6 uppercase">পাওয়ারফুল <span className="text-indigo-400">ফিচারস</span></h2>
            <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto italic">একটি আধুনিক ই-কমার্স টিমের যা যা প্রয়োজন, তার সবকিছুই রয়েছে একটি সেন্ট্রাল ড্যাশবোর্ডে।</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-12 bg-white/5 border border-white/10 rounded-[4rem] backdrop-blur-3xl hover:border-indigo-500/50 transition-all duration-500 group overflow-hidden relative">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/5 blur-[50px] group-hover:bg-indigo-600/20 transition-all"></div>
                <div className="text-5xl mb-10 group-hover:rotate-12 transition-transform duration-500 inline-block">{f.icon}</div>
                <h3 className="text-2xl font-black italic mb-6 uppercase tracking-tight text-white">{f.title}</h3>
                <p className="text-slate-400 text-lg font-medium leading-relaxed italic">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-40 px-6 bg-slate-950/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32 space-y-6">
            <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-6 uppercase">বাজেট অনুযায়ী <span className="text-emerald-500 italic">প্ল্যান</span></h2>
            <p className="text-slate-400 text-xl font-medium max-w-xl mx-auto italic">আপনার ব্যবসার প্রয়োজন অনুযায়ী সেরা সাবস্ক্রিপশনটি বেছে নিন।</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {plans.map((plan, i) => (
              <div key={i} className={`p-16 rounded-[5rem] border transition-all duration-700 relative flex flex-col group ${plan.popular ? 'bg-indigo-600 border-indigo-500 shadow-3xl scale-105 z-10' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                {plan.popular && <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-indigo-600 px-10 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl">Most Popular</span>}
                <div className="mb-12">
                   <p className={`text-[13px] font-black uppercase tracking-[0.3em] mb-6 italic ${plan.popular ? 'text-white/60' : 'text-slate-500'}`}>{plan.name}</p>
                   <div className="flex items-end gap-3">
                      <span className="text-7xl font-black tracking-tighter italic text-white">{plan.price}</span>
                      <span className={`text-xs font-bold uppercase mb-4 ${plan.popular ? 'text-white/50' : 'text-slate-500'}`}>/ {plan.duration}</span>
                   </div>
                   <p className={`mt-6 text-lg font-medium italic ${plan.popular ? 'text-white/80' : 'text-slate-400'}`}>{plan.desc}</p>
                </div>
                <ul className="space-y-6 mb-16 flex-1">
                   {plan.features.map((f, j) => (
                     <li key={j} className={`flex items-center gap-5 text-[11px] font-black uppercase tracking-widest ${plan.popular ? 'text-white/90' : 'text-slate-400'}`}>
                       <span className={`w-6 h-6 flex items-center justify-center rounded-xl ${plan.popular ? 'bg-white/20' : 'bg-white/10'}`}>✓</span> {f}
                     </li>
                   ))}
                </ul>
                <button onClick={onGetStarted} className={`w-full py-6 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl ${plan.popular ? 'bg-white text-indigo-600' : 'bg-orange-600 text-white group-hover:bg-white group-hover:text-slate-950'}`}>কিনুন এখনই</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-40 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter">সচরাচর <span className="text-orange-500">জিজ্ঞাসা</span></h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/10 rounded-3xl overflow-hidden bg-white/5 transition-all">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-8 text-left hover:bg-white/5"
                >
                  <span className="text-lg font-black italic uppercase tracking-tight">{faq.q}</span>
                  <span className={`text-2xl transition-transform ${activeFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {activeFaq === i && (
                  <div className="p-8 pt-0 text-slate-400 italic font-medium border-t border-white/5 animate-in slide-in-from-top-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 border-t border-white/5 bg-slate-950 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-20">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden">
               {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" alt="Platform Logo" /> : <span className="text-3xl font-black italic text-orange-600">BY</span>}
            </div>
            <div>
              <p className="text-2xl font-black text-white uppercase italic leading-none">Byabshik OS</p>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mt-3 italic">Unified E-commerce Intelligence Architecture</p>
            </div>
          </div>
          <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] font-mono italic">© 2025 BYABSHIK. BD PRIDE. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
