
import React, { useMemo } from 'react';
import { Order, OrderStatus, User, UserRole, Product, Lead } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { STATUS_COLORS } from '../constants';

interface DashboardProps {
  orders: Order[];
  products: Product[];
  leads: Lead[];
  currentUser: User;
  moderators?: User[];
}

const Dashboard: React.FC<DashboardProps> = ({ orders, products, leads, currentUser, moderators = [] }) => {
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.OWNER;
  
  const getBSTDate = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 6));
  };

  const bstToday = getBSTDate();
  const todayStr = bstToday.toISOString().split('T')[0];
  
  const yesterdayDate = new Date(bstToday);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const metrics = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr));
    const yesterdayOrders = orders.filter(o => o.createdAt.startsWith(yesterdayStr));
    
    const todayRev = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const yesterdayRev = yesterdayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const pendingLeadsCount = leads.filter(l => l.status === 'pending').length;
    const confirmedCount = orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CONFIRMED).length;
    const globalConversion = orders.length > 0 ? Math.round((confirmedCount / orders.length) * 100) : 0;
    const growth = yesterdayRev > 0 ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100) : 100;

    return {
      totalRev,
      todayRev,
      todayCount: todayOrders.length,
      pendingLeads: pendingLeadsCount,
      globalConversion,
      growth
    };
  }, [orders, leads, todayStr, yesterdayStr]);

  const funnelData = useMemo(() => {
    const totalLeads = leads.length;
    const commLeads = leads.filter(l => l.status === 'communication' || l.status === 'confirmed').length;
    const orderCount = orders.length;
    const deliveredCount = orders.filter(o => o.status === OrderStatus.DELIVERED).length;

    return [
      { name: 'Total Leads', count: totalLeads, color: '#6366f1' },
      { name: 'Communications', count: commLeads, color: '#8b5cf6' },
      { name: 'Order Placed', count: orderCount, color: '#ec4899' },
      { name: 'Successfully Closed', count: deliveredCount, color: '#10b981' }
    ];
  }, [leads, orders]);

  const weeklyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = getBSTDate();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      orders: orders.filter(o => o.createdAt.startsWith(date)).length,
      revenue: orders.filter(o => o.createdAt.startsWith(date)).reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    }));
  }, [orders]);

  const teamLeaderboard = useMemo(() => {
    return (moderators || []).map(mod => {
      const modLeads = leads.filter(l => String(l.moderatorId) === String(mod.id));
      const modOrders = orders.filter(o => String(o.moderatorId) === String(mod.id));
      const conversion = modLeads.length > 0 ? Math.round((modOrders.length / modLeads.length) * 100) : 0;
      return {
        name: mod.name,
        leads: modLeads.length,
        orders: modOrders.length,
        conversion
      };
    }).sort((a, b) => b.orders - a.orders).slice(0, 5);
  }, [moderators, leads, orders]);

  const recentMissions = useMemo(() => {
    return orders.slice(0, 6);
  }, [orders]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'];
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(OrderStatus).forEach(s => counts[s] = 0);
    orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [orders]);

  const lowStock = products.filter(p => p.stock < 15);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter italic">Command Center</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Unit Intelligence Protokol: BST Active</p>
          </div>
        </div>
        <div className="bg-slate-950 p-5 rounded-[2rem] shadow-2xl flex items-center gap-6 border border-white/10">
           <div className="text-right">
             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dhaka Time</p>
             <p className="text-xs font-black text-white">{getBSTDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
           </div>
           <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-orange-600/20">🛡️</div>
        </div>
      </div>

      {/* KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Network Revenue', val: `৳${(metrics.totalRev || 0).toLocaleString()}`, sub: 'Lifetime Volume', color: 'text-slate-900', icon: '💎', trend: '+12% vs last month' },
          { label: "Today's Intake", val: `${metrics.todayCount} Ops`, sub: `৳${(metrics.todayRev || 0).toLocaleString()} Generated`, color: 'text-indigo-600', icon: '🚀', trend: metrics.growth >= 0 ? `+${metrics.growth}% vs yesterday` : `${metrics.growth}% vs yesterday` },
          { label: 'Lead Pipeline', val: `${metrics.pendingLeads} Leads`, sub: 'Queue depth', color: 'text-orange-500', icon: '📡', trend: 'Priority: High' },
          { label: 'Success Score', val: `${metrics.globalConversion}%`, sub: 'Efficiency ratio', color: 'text-emerald-600', icon: '⚡', trend: 'Optimal Flow' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100 relative group overflow-hidden hover:shadow-2xl hover:border-indigo-100 transition-all duration-500">
             <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
             <div className="relative z-10">
               <span className="text-3xl mb-4 block group-hover:rotate-12 transition-transform">{kpi.icon}</span>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
               <p className={`text-4xl font-black ${kpi.color} tracking-tighter`}>{kpi.val}</p>
               <div className="flex items-center justify-between mt-4">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{kpi.sub}</p>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-lg ${kpi.trend.includes('+') ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-500'}`}>{kpi.trend}</span>
               </div>
             </div>
          </div>
        ))}
      </div>

      {/* Live Operational Log & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-center mb-10">
             <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center border border-slate-800 shadow-xl">
                 <span className="text-3xl">📝</span>
               </div>
               <div>
                 <h3 className="text-2xl font-black tracking-tight text-slate-900">Live Operational Log</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Recent Transactions Activity</p>
               </div>
             </div>
          </div>
          
          <div className="space-y-4">
             {recentMissions.length > 0 ? recentMissions.map((order) => (
               <div key={order.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-slate-900 hover:text-white transition-all duration-300 group/row">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-900 shadow-sm group-hover/row:bg-indigo-600 group-hover/row:text-white transition-colors">
                      {order.id.slice(-2)}
                    </div>
                    <div>
                      <p className="font-black text-sm">{order.customerName}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{order.customerPhone}</p>
                    </div>
                 </div>
                 <div className="hidden md:block">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${STATUS_COLORS[order.status]} group-hover/row:bg-white/10 group-hover/row:text-white group-hover/row:border-white/20`}>
                      {order.status}
                    </span>
                 </div>
                 <div className="text-right">
                    <p className="font-black text-sm">৳{(order.totalAmount || 0).toLocaleString()}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bill Total</p>
                 </div>
               </div>
             )) : (
               <div className="py-20 text-center opacity-20 italic">
                 <p className="text-xs font-black uppercase tracking-widest">No Recent Operations Recorded</p>
               </div>
             )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-slate-800 mb-10 border-b border-slate-50 pb-4 italic">Lead Funnel</h3>
          <div className="flex-1 flex flex-col justify-between py-2">
            {funnelData.map((stage, i) => {
              const prevStage = funnelData[i-1];
              const percent = prevStage ? Math.round((stage.count / prevStage.count) * 100) : 100;
              const barWidth = i === 0 ? 100 : Math.round((stage.count / funnelData[0].count) * 100);
              
              return (
                <div key={i} className="relative mb-6 last:mb-0">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stage.name}</p>
                    <p className="text-sm font-black text-slate-900">{stage.count}</p>
                  </div>
                  <div className="w-full h-8 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex">
                     <div 
                       className="h-full transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                       style={{ width: `${barWidth}%`, backgroundColor: stage.color }}
                     >
                       {i > 0 && isFinite(percent) && <span className="text-[8px] font-black text-white/40">{percent}%</span>}
                     </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Analytics & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-10">
               <div>
                 <h3 className="text-xl font-black text-slate-800">Operational Velocity</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaction flow (Dhaka Timeline)</p>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase">Ops</span>
                  </div>
               </div>
            </div>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorArea)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-10 border-b border-slate-50 pb-6 italic">Elite Rankings</h3>
            <div className="space-y-6">
              {teamLeaderboard.map((mod, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] group hover:bg-slate-900 hover:text-white transition-all duration-300">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {mod.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-sm">{mod.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-500">Ops: {mod.orders}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-base font-black group-hover:text-indigo-400">{mod.conversion}%</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-500">Efficiency</p>
                   </div>
                </div>
              ))}
              {teamLeaderboard.length === 0 && <p className="text-center py-20 text-[10px] font-black text-slate-300 uppercase italic">Awaiting unit activity data...</p>}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
