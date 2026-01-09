
import React, { useState, useMemo, useRef } from 'react';
import { User, Lead, Order, LeadStatus } from '../types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface LeadManagerProps {
  currentUser: User;
  moderators: User[];
  leads: Lead[];
  orders: Order[];
  onAssignLeads: (leads: Lead[]) => void;
  onBulkUpdateLeads: (leadIds: string[], modId: string, date: string) => void;
  onDeleteLead: (id: string) => void;
  onDeduplicateLeads?: () => void;
}

interface EnrichedContact {
  phone: string;
  name: string;
  address: string;
  leadId: string | null;
  lastOrderDate: string | null;
  lastCallDate: string | null;
  daysSinceCall: number | null;
  daysSinceOrder: number | null;
  totalOrders: number;
  currentStatus: LeadStatus | 'unassigned';
  moderatorId: string | null;
}

const LeadManager: React.FC<LeadManagerProps> = ({ 
  currentUser, 
  moderators, 
  leads, 
  orders, 
  onAssignLeads, 
  onBulkUpdateLeads, 
  onDeleteLead,
}) => {
  const getBSTDate = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 6));
  };

  const [selectedModId, setSelectedModId] = useState('');
  const [assignedDate, setAssignedDate] = useState(getBSTDate().toISOString().split('T')[0]);
  
  // Intelligence Filters
  const [minDaysSinceCall, setMinDaysSinceCall] = useState<string>('');
  const [minDaysSinceOrder, setMinDaysSinceOrder] = useState<string>('');
  const [strategicSelectedPhones, setStrategicSelectedPhones] = useState<string[]>([]);
  
  // Range Selection
  const [rangeFrom, setRangeFrom] = useState<string>('1');
  const [rangeTo, setRangeTo] = useState<string>('50');

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all' | 'unassigned'>('all');
  const [searchPhone, setSearchPhone] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanPhoneNumber = (raw: any) => {
    if (!raw) return "";
    let cleaned = String(raw).replace(/[^\d]/g, '');
    if (cleaned.startsWith('880')) cleaned = cleaned.substring(3);
    else if (cleaned.startsWith('88')) cleaned = cleaned.substring(2);
    if (cleaned.length === 10) cleaned = '0' + cleaned;
    return cleaned;
  };

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processDataArray(results.data)
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        processDataArray(data);
      };
      reader.readAsBinaryString(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processDataArray = (data: any[]) => {
    setIsProcessing(true);
    const existingPhones = new Set(leads.map(l => cleanPhoneNumber(l.phoneNumber)));
    const batchPhones = new Set<string>();
    const newLeads: Lead[] = [];

    data.forEach((row, idx) => {
      const findValue = (possibleKeys: string[]) => {
        const rowKeys = Object.keys(row);
        const foundKey = rowKeys.find(rk => 
          possibleKeys.some(pk => rk.toLowerCase().includes(pk.toLowerCase()))
        );
        return foundKey ? String(row[foundKey]).trim() : "";
      };

      const phone = cleanPhoneNumber(findValue(['phone', 'mobile', 'number', 'contact', 'মোবাইল']));
      if (phone.length >= 10) {
        if (existingPhones.has(phone) || batchPhones.has(phone)) return;
        batchPhones.add(phone);
        const name = findValue(['name', 'customer', 'নাম']);
        const addr = findValue(['address', 'location', 'ঠিকানা']);
        
        newLeads.push({
          id: `lead-${Date.now()}-${idx}`,
          businessId: currentUser.businessId,
          phoneNumber: phone,
          customerName: name || 'Prospect',
          address: addr || '',
          moderatorId: '',
          status: 'pending',
          assignedDate: '',
          createdAt: getBSTDate().toISOString()
        });
      }
    });

    if (newLeads.length > 0) {
      onAssignLeads(newLeads);
      showToast(`✅ ${newLeads.length} Leads Added!`);
    } else {
      alert("No new unique numbers found.");
    }
    setIsProcessing(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumbers.trim()) return;
    const lines = phoneNumbers.split(/[\n,]/).map(p => ({ phone: p.trim() }));
    processDataArray(lines);
    setPhoneNumbers('');
  };

  const contacts = useMemo(() => {
    const contactMap: Record<string, EnrichedContact> = {};
    const now = getBSTDate();

    leads.forEach(l => {
      const phone = cleanPhoneNumber(l.phoneNumber);
      if (phone.length < 10) return;
      let callDate = (l.status !== 'pending' && l.createdAt) ? new Date(l.createdAt) : null;
      if (!contactMap[phone]) {
        contactMap[phone] = {
          phone, name: l.customerName || 'Prospect', address: l.address || '',
          leadId: l.id, lastCallDate: callDate ? callDate.toISOString() : null,
          daysSinceCall: callDate ? Math.floor((now.getTime() - callDate.getTime()) / 86400000) : null,
          lastOrderDate: null, daysSinceOrder: null, totalOrders: 0,
          currentStatus: l.status, moderatorId: l.moderatorId
        };
      }
    });

    orders.forEach(o => {
      const phone = cleanPhoneNumber(o.customerPhone);
      if (phone.length < 10) return;
      const orderDate = o.createdAt ? new Date(o.createdAt) : null;
      if (!contactMap[phone]) {
        contactMap[phone] = {
          phone, name: o.customerName, address: o.customerAddress,
          leadId: null, lastCallDate: null, daysSinceCall: null,
          lastOrderDate: orderDate ? orderDate.toISOString() : null,
          daysSinceOrder: orderDate ? Math.floor((now.getTime() - orderDate.getTime()) / 86400000) : null,
          totalOrders: 1, currentStatus: 'unassigned', moderatorId: null
        };
      } else {
        contactMap[phone].totalOrders += 1;
        if (orderDate && (!contactMap[phone].lastOrderDate || orderDate > new Date(contactMap[phone].lastOrderDate!))) {
          contactMap[phone].lastOrderDate = orderDate.toISOString();
          contactMap[phone].daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / 86400000);
        }
      }
    });
    return Object.values(contactMap);
  }, [leads, orders]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      if (searchPhone && !c.phone.includes(searchPhone)) return false;
      if (statusFilter === 'unassigned') {
        if (c.moderatorId && c.moderatorId !== '') return false;
      } else if (statusFilter !== 'all') {
        if (c.currentStatus !== statusFilter) return false;
      }
      if (minDaysSinceCall !== '' && (c.daysSinceCall === null || c.daysSinceCall < parseInt(minDaysSinceCall))) return false;
      if (minDaysSinceOrder !== '' && (c.daysSinceOrder === null || c.daysSinceOrder < parseInt(minDaysSinceOrder))) return false;
      return true;
    }).sort((a, b) => (b.daysSinceOrder || 999) - (a.daysSinceOrder || 999));
  }, [contacts, statusFilter, searchPhone, minDaysSinceCall, minDaysSinceOrder]);

  const applyRangeSelection = () => {
    const from = parseInt(rangeFrom) - 1;
    const to = parseInt(rangeTo);
    const slice = filteredContacts.slice(Math.max(0, from), Math.min(filteredContacts.length, to));
    setStrategicSelectedPhones(prev => Array.from(new Set([...prev, ...slice.map(c => c.phone)])));
    showToast(`Added ${slice.length} to queue.`);
  };

  const handleStrategicDeployment = async () => {
    if (strategicSelectedPhones.length === 0 || !selectedModId) return;
    setIsProcessing(true);
    const selectedFull = contacts.filter(c => strategicSelectedPhones.includes(c.phone));
    const existingIds = selectedFull.filter(c => c.leadId).map(c => c.leadId!);
    const newOnes: Lead[] = selectedFull.filter(c => !c.leadId).map((c, i) => ({
      id: `rev-${Date.now()}-${i}`, businessId: currentUser.businessId,
      phoneNumber: c.phone, customerName: c.name, address: c.address,
      moderatorId: selectedModId, status: 'pending', assignedDate, createdAt: getBSTDate().toISOString()
    }));
    if (existingIds.length > 0) await onBulkUpdateLeads(existingIds, selectedModId, assignedDate);
    if (newOnes.length > 0) await onAssignLeads(newOnes);
    setStrategicSelectedPhones([]);
    showToast("🎯 Deployment Successful!");
    setIsProcessing(false);
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      {successMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-10 py-5 rounded-2xl shadow-2xl border border-white/10 font-black uppercase text-[10px] tracking-widest">
          🚀 {successMsg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Lead Terminal</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Tactical Injection Hub</p>
        </div>
        
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-6">
           <div className="flex items-center gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-950 transition-all shadow-lg active:scale-95">📁 Import XLSX/CSV</button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
           </div>
           <div className="w-px h-8 bg-slate-100"></div>
           <div className="flex gap-3">
              <div className="space-y-1">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Call Age (Min Days)</p>
                <input type="number" value={minDaysSinceCall} onChange={(e) => setMinDaysSinceCall(e.target.value)} className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-black outline-none" />
              </div>
              <div className="space-y-1">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Order Age (Min Days)</p>
                <input type="number" value={minDaysSinceOrder} onChange={(e) => setMinDaysSinceOrder(e.target.value)} className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-black outline-none" />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-950 p-8 rounded-[3.5rem] text-white shadow-2xl border border-white/5 space-y-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4 italic">Quick Assignment</h3>
            
            <div className="space-y-6">
               <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                 <p className="text-[9px] font-black text-slate-500 uppercase">Selected</p>
                 <div className="flex justify-between items-baseline">
                    <p className="text-4xl font-black text-indigo-400 italic">{strategicSelectedPhones.length}</p>
                    <button onClick={() => setStrategicSelectedPhones([])} className="text-[8px] font-black text-rose-400 uppercase">Clear</button>
                 </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Select By Range (S.N.)</p>
                  <div className="grid grid-cols-2 gap-3">
                     <input type="number" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-black text-white outline-none" placeholder="From" />
                     <input type="number" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-black text-white outline-none" placeholder="To" />
                  </div>
                  <button onClick={applyRangeSelection} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Select {parseInt(rangeTo) - parseInt(rangeFrom) + 1} Leads</button>
               </div>

               <div className="space-y-4">
                  <select value={selectedModId} onChange={(e) => setSelectedModId(e.target.value)} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black text-white outline-none">
                    <option value="" className="bg-slate-900">Select Moderator</option>
                    {moderators.filter(m => m.is_active).map(m => <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>)}
                  </select>
                  <input type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black text-white outline-none" />
               </div>

               <button onClick={handleStrategicDeployment} disabled={isProcessing || strategicSelectedPhones.length === 0 || !selectedModId} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-20 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all">Deploy Now</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white p-6 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
              <input type="text" placeholder="Search Phone/Name..." value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} className="flex-1 px-8 py-5 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"/>
              <div className="flex bg-slate-100 p-1.5 rounded-full border border-slate-200">
                {['all', 'unassigned', 'pending', 'confirmed'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s as any)} className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusFilter === s ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400'}`}>{s}</button>
                ))}
              </div>
           </div>

           <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-950">
                    <tr>
                      <th className="px-8 py-8 text-[9px] font-black text-slate-500 uppercase">S.N.</th>
                      <th className="px-6 py-8 text-[9px] font-black text-slate-500 uppercase text-center">Duty</th>
                      <th className="px-10 py-8 text-[9px] font-black text-slate-500 uppercase">Identity</th>
                      <th className="px-10 py-8 text-[9px] font-black text-slate-500 uppercase">Last Activity</th>
                      <th className="px-10 py-8 text-[9px] font-black text-slate-500 uppercase text-right">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredContacts.map((c, idx) => {
                      const isSelected = strategicSelectedPhones.includes(c.phone);
                      return (
                        <tr key={c.phone} className={`group hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                          <td className="px-8 py-10 text-[10px] font-black text-slate-300 italic">#{idx + 1}</td>
                          <td className="px-6 py-10 text-center">
                             <input type="checkbox" checked={isSelected} onChange={() => setStrategicSelectedPhones(prev => prev.includes(c.phone) ? prev.filter(p => p !== c.phone) : [...prev, c.phone])} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600" />
                          </td>
                          <td className="px-10 py-10">
                             <p className="font-black text-slate-950 text-base font-mono leading-none">{c.phone}</p>
                             <p className="text-[10px] font-black text-indigo-500 uppercase mt-2">{c.name}</p>
                          </td>
                          <td className="px-10 py-10">
                             <div className="flex gap-10">
                                <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Last Call</p><p className="text-sm font-black">{c.daysSinceCall !== null ? `${c.daysSinceCall}d ago` : '--'}</p></div>
                                <div><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Last Order</p><p className="text-sm font-black text-orange-600">{c.daysSinceOrder !== null ? `${c.daysSinceOrder}d ago` : '--'}</p></div>
                             </div>
                          </td>
                          <td className="px-10 py-10 text-right">
                             <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border italic ${c.currentStatus === 'unassigned' ? 'bg-rose-50 text-rose-400 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{c.currentStatus}</span>
                             <p className="text-[8px] font-bold text-slate-400 mt-2">Unit: {moderators.find(m => m.id === c.moderatorId)?.name || 'Unassigned'}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LeadManager;
