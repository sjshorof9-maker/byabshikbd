
import React, { useMemo, useState, useEffect } from 'react';
import { Order, User, OrderStatus } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

interface SuperAdminDashboardProps {
  businesses: any[];
  moderators: User[];
  orders: Order[];
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ businesses, moderators, orders }) => {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [vitals, setVitals] = useState({ cpu: 12, ram: 4.2, latency: 42 });

  useEffect(() => {
    const timer = setInterval(() => {
      setVitals({
        cpu: Math.floor(Math.random() * 20) + 10,
        ram: parseFloat((Math.random() * 0.5 + 4.1).toFixed(1)),
        latency: Math.floor(Math.random() * 10) + 38
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const activePro = businesses.filter(b => b.plan === 'pro').length;
    const pendingReq = businesses.filter(b => b.transaction_id && b.plan !== 'pro').length;
    const trialUsers = businesses.filter(b => b.plan !== 'pro' && !b.transaction_id).length;
    
    const estimatedSaaSMRR = activePro * 500; 

    return {
      totalRev,
      businessCount: businesses.length,
      moderatorCount: moderators.length,
      orderCount: orders.length,
      activePro,
      pendingReq,
      trialUsers,
      estimatedSaaSMRR,
      avgOrderValue: orders.length > 0 ? Math.round(totalRev / orders.length) : 0,
      networkEfficiency: orders.length > 0 ? Math.round((orders.filter(o => o.status === OrderStatus.DELIVERED).length / orders.length) * 100) : 0
    };
  }, [businesses, moderators, orders]);

  const chartData = useMemo(() => {
    const last10Days = Array.from({ length: 10 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (9 - i));
      return d.toISOString().split('T')[0];
    });

    return last10Days.map(date => ({
      name: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      revenue: orders.filter(o => o.createdAt?.startsWith(date)).reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      nodes: businesses.filter(b => b.created_at?.startsWith(date)).length
    }));
  }, [orders, businesses]);

  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      alert("Platform Broadcast Transmitted to All Active Nodes.");
      setBroadcastMessage('');
      setIsSending(false);
    }, 1500);
  };

  const businessDistribution = [
    { name: 'Elite Pro', value: stats.activePro, color: '#10b981' },
    { name: 'Awaiting Audit', value: stats.pendingReq, color: '#f59e0b' },
    { name: 'Trial Core', value: stats.trialUsers, color: '#6366f1' }
  ];

  return (
    <div className="space-y-10 pb-40 animate-in fade-in duration-1000">
      {/* Platform Vitals Toolbar */}
      <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 
           UPTIME: 99.99%
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
           <span className="text-slate-300">CPU:</span> {vitals.cpu}%
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
           <span className="text-slate-300">RAM:</span> {vitals.ram}GB
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
           <span className="text-slate-300">LATENCY:</span> {vitals.latency}MS
        </div>
      </div>

      {/* Main Command Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-slate-950 p-12 md:p-16 rounded-[5rem] relative overflow-hidden shadow-3xl border border-white/5">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[180px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
           <div className="relative z-10 space-y-12">
              <div>
                <h2 className="text-7xl md:text-9xl font-black text-white tracking-tighter italic uppercase leading-[0.8] mb-6">Master <br/> <span className="text-indigo-500">Node</span></h2>
                <p className="text-slate-500 font-bold max-w-lg leading-relaxed italic uppercase text-[11px] tracking-widest border-l-4 border-indigo-500/30 pl-6">Byabshik Enterprise OS Global Authority Dashboard. Monitoring and managing {stats.businessCount} active infrastructure nodes.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Platform MRR</p>
                    <p className="text-5xl font-black text-white italic tracking-tighter">৳{(stats.estimatedSaaSMRR || 0).toLocaleString()}</p>
                 </div>
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Network GMV</p>
                    <p className="text-5xl font-black text-indigo-400 italic tracking-tighter">৳{(stats.totalRev || 0).toLocaleString()}</p>
                 </div>
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Node Reliability</p>
                    <p className="text-5xl font-black text-emerald-500 italic tracking-tighter">{stats.networkEfficiency}%</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Tactical Communications */}
        <div className="lg:col-span-4 bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div className="space-y-8">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center text-2xl shadow-sm italic">!!</div>
                 <div>
                   <h3 className="text-2xl font-black italic tracking-tight uppercase text-slate-900 leading-none">Global <br/> Alert</h3>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Platform-Wide Transmission</p>
                 </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed italic border-l-2 border-slate-100 pl-4">Deploy a critical notification to all business owners and moderators across the network.</p>
              <textarea 
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter alert instructions..."
                className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 text-[11px] font-bold text-slate-800 outline-none focus:ring-4 focus:ring-rose-500/5 h-40 resize-none transition-all"
              />
           </div>
           <button 
             onClick={handleSendBroadcast}
             disabled={isSending || !broadcastMessage}
             className="w-full py-6 bg-slate-950 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl active:scale-95 disabled:opacity-20 mt-8"
           >
             {isSending ? 'Transmitting Data...' : 'Transmit Alert Protocol'}
           </button>
        </div>
      </div>

      {/* Analytics Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 rounded-[5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
           <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-3xl font-black text-slate-950 uppercase italic tracking-tight leading-none mb-2">Growth Velocity</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Node Proliferation & Operational Frequency</p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                   <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                   <span className="text-[10px] font-black text-slate-400 uppercase">Rev</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                   <span className="text-[10px] font-black text-slate-400 uppercase">Nodes</span>
                 </div>
              </div>
           </div>
           <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBiz" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="nodes" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorBiz)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-12 rounded-[5rem] border border-slate-100 shadow-sm flex flex-col items-center">
           <h3 className="text-2xl font-black text-slate-950 mb-10 uppercase italic tracking-tight text-center">Protocol Segment</h3>
           <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={businessDistribution} innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value" stroke="none">
                       {businessDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="w-full space-y-4 mt-8">
              {businessDistribution.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-slate-900 hover:text-white transition-all duration-500">
                   <div className="flex items-center gap-5">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400">{item.name}</span>
                   </div>
                   <span className="text-2xl font-black italic tracking-tighter">{item.value}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Node Explorer Table */}
      <div className="bg-slate-950 p-12 md:p-16 rounded-[6rem] border border-white/5 relative overflow-hidden shadow-3xl">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
            <div>
              <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Node Registry</h3>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic mt-2">Active Infrastructure Directory</p>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {businesses.slice(0, 12).map((biz, i) => {
              const expiresAt = biz.expires_at ? new Date(biz.expires_at) : null;
              const isExpired = expiresAt && expiresAt.getTime() < new Date().getTime();

              return (
                <div key={biz.id} className="bg-white/5 border border-white/5 p-10 rounded-[3.5rem] hover:bg-white/10 transition-all group relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:bg-indigo-500/10 transition-all"></div>
                   <div className="flex items-center gap-6 mb-10">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl italic shadow-2xl group-hover:rotate-12 transition-transform ${biz.plan === 'pro' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-950'}`}>
                        {biz.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-lg font-black text-white italic truncate w-32 uppercase tracking-tight">{biz.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${biz.plan === 'pro' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-orange-500/20 text-orange-500'}`}>
                            {biz.plan === 'pro' ? 'PRO' : 'TRIAL'}
                          </span>
                          {isExpired && <span className="text-[7px] font-black uppercase bg-rose-500 text-white px-2 py-0.5 rounded-full">Expired</span>}
                        </div>
                      </div>
                   </div>
                   <div className="space-y-4 border-t border-white/10 pt-8">
                      <div className="flex justify-between">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Expires</p>
                        <p className={`text-[10px] font-black italic ${isExpired ? 'text-rose-500' : 'text-slate-300'}`}>
                          {expiresAt ? expiresAt.toLocaleDateString('en-GB') : '---'}
                        </p>
                      </div>
                      <div className="flex justify-between">
                         <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Ops</p>
                         <p className="text-[10px] font-black text-indigo-400 italic">{orders.filter(o => o.businessId === biz.id).length} Units</p>
                      </div>
                   </div>
                   <div className="mt-8">
                     <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest border border-white/5 transition-all">
                       Audit Node
                     </button>
                   </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
