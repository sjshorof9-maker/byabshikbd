
import React, { useMemo, useState } from 'react';
import { Order, Lead } from '../types';

interface CustomerManagerProps {
  orders: Order[];
  leads: Lead[];
}

interface CustomerStats {
  phone: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastActivityAt: string;
  address: string;
  type: 'lead' | 'customer';
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ orders, leads }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const combinedRegistry = useMemo(() => {
    const map: Record<string, CustomerStats> = {};
    
    // Sort sources to process oldest to newest, ensuring newest data wins
    const sortedLeads = [...leads].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // 1. First, process leads
    sortedLeads.forEach(lead => {
      const phone = lead.phoneNumber.trim();
      if (phone.length < 10) return;
      
      if (!map[phone]) {
        map[phone] = {
          phone,
          name: lead.customerName || 'Prospect User',
          totalOrders: 0,
          totalSpent: 0,
          lastActivityAt: lead.createdAt,
          address: lead.address || '',
          type: 'lead'
        };
      } else {
        // Update information if newer
        if (new Date(lead.createdAt) >= new Date(map[phone].lastActivityAt)) {
           map[phone].lastActivityAt = lead.createdAt;
           if (lead.customerName) map[phone].name = lead.customerName;
           if (lead.address) map[phone].address = lead.address;
        }
      }
    });

    // 2. Then, process orders (Orders take priority for status and info)
    sortedOrders.forEach(order => {
      const phone = order.customerPhone.trim();
      if (phone.length < 10) return;

      if (!map[phone]) {
        map[phone] = {
          phone,
          name: order.customerName,
          totalOrders: 0,
          totalSpent: 0,
          lastActivityAt: order.createdAt,
          address: order.customerAddress,
          type: 'customer'
        };
      } else {
        map[phone].type = 'customer'; // Mark as converted
      }

      map[phone].totalOrders += 1;
      map[phone].totalSpent += (order.totalAmount || 0);
      
      // Update info if order is newer or lead had missing info
      if (new Date(order.createdAt) >= new Date(map[phone].lastActivityAt) || map[phone].name === 'Prospect User') {
        map[phone].lastActivityAt = order.createdAt;
        map[phone].name = order.customerName; 
        map[phone].address = order.customerAddress; 
      }
    });

    return Object.values(map).sort((a, b) => 
      new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );
  }, [orders, leads]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return combinedRegistry;
    const s = searchTerm.toLowerCase();
    return combinedRegistry.filter(c => 
      c.phone.includes(s) || 
      c.name.toLowerCase().includes(s)
    );
  }, [combinedRegistry, searchTerm]);

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Customer Intelligence</h2>
          <p className="text-sm text-slate-500 font-medium">Unified 360° view of unique contacts.</p>
        </div>
        
        <div className="w-full md:w-64">
           <input 
             type="text" 
             placeholder="Search unique client..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm shadow-sm transition-all"
           />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">S.N.</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unified Identity</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">LTV (Lifetime)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.map((customer, idx) => {
                const isLoyal = customer.totalOrders > 2;
                const isLeadOnly = customer.type === 'lead';

                return (
                  <tr key={customer.phone} className={`hover:bg-slate-50/50 transition-colors ${isLeadOnly ? 'bg-slate-50/10' : ''}`}>
                    <td className="px-8 py-6 font-black text-slate-300 text-[10px]">{idx + 1}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                          isLeadOnly ? 'bg-slate-100 text-slate-400' : isLoyal ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm flex items-center gap-2">
                            {customer.name}
                            {isLoyal && <span className="text-[7px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-tighter font-black">Elite</span>}
                          </p>
                          <p className="text-xs font-mono font-bold text-slate-400">{customer.phone}</p>
                          <p className="text-[9px] text-slate-400 truncate max-w-[150px]">{customer.address || 'Location Unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border self-start ${
                          isLeadOnly 
                          ? 'bg-slate-50 text-slate-500 border-slate-200' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {isLeadOnly ? 'Lead' : 'Customer'}
                        </span>
                        <p className="text-[10px] font-black text-slate-700 mt-1.5">{customer.totalOrders} Purchases</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <p className={`text-sm font-black ${isLeadOnly ? 'text-slate-400' : 'text-slate-800'}`}>
                          {getTimeAgo(customer.lastActivityAt)}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(customer.lastActivityAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-lg font-black text-slate-900">৳{(customer.totalSpent || 0).toLocaleString()}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue Impact</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerManager;
