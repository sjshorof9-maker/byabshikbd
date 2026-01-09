
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, User, Product, CourierConfig, UserRole } from '../types';
import { STATUS_COLORS } from '../constants';
import { syncOrderWithCourier } from '../services/courierService';
import html2canvas from 'html2canvas';

interface OrderListProps {
  orders: Order[];
  currentUser: User;
  products: Product[];
  moderators: User[];
  courierConfig: CourierConfig;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, courierData?: { id: string, status: string }) => void;
  onBulkUpdateStatus: (orderIds: string[], newStatus: OrderStatus) => void;
  logoUrl?: string | null;
  globalSteadfastLogo?: string;
}

const OrderList: React.FC<OrderListProps> = ({ orders, currentUser, products, moderators, courierConfig, onUpdateStatus, onBulkUpdateStatus, logoUrl, globalSteadfastLogo }) => {
  const isAdmin = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.OWNER;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    let list = isAdmin ? [...orders] : orders.filter(o => String(o.moderatorId) === String(currentUser.id));
    
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(o => 
        o.customerPhone.includes(s) || 
        o.customerName.toLowerCase().includes(s) || 
        o.id.toLowerCase().includes(s)
      );
    }
    
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
    if (regionFilter !== 'all') list = list.filter(o => o.deliveryRegion === regionFilter);

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, isAdmin, currentUser.id, searchTerm, statusFilter, regionFilter]);

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedOrders.length === filteredOrders.length) setSelectedOrders([]);
    else setSelectedOrders(filteredOrders.map(o => o.id));
  };

  const handleBulkStatusChange = (status: OrderStatus) => {
    if (selectedOrders.length === 0) return;
    onBulkUpdateStatus(selectedOrders, status);
    setSelectedOrders([]);
  };

  const handleManualSync = async (order: Order) => {
    if (!isAdmin || order.steadfastId) return;
    setSyncingId(order.id);
    try {
      const res = await syncOrderWithCourier(order, courierConfig);
      onUpdateStatus(order.id, OrderStatus.CONFIRMED, { id: res.consignmentId, status: res.status });
    } catch (err: any) {
      alert("Sync Failed: " + err.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleBulkSync = async () => {
    if (selectedOrders.length === 0 || isBulkSyncing) return;
    if (!confirm(`Confirm dispatch of ${selectedOrders.length} orders to courier?`)) return;

    setIsBulkSyncing(true);
    let successCount = 0;
    
    for (const orderId of selectedOrders) {
      const order = orders.find(o => o.id === orderId);
      if (order && !order.steadfastId && order.status !== OrderStatus.CANCELLED) {
        try {
          const res = await syncOrderWithCourier(order, courierConfig);
          onUpdateStatus(order.id, OrderStatus.CONFIRMED, { id: res.consignmentId, status: res.status });
          successCount++;
        } catch (err) {
          console.error(`Failed to sync ${orderId}`);
        }
      }
    }
    
    alert(`Successfully dispatched ${successCount} orders.`);
    setIsBulkSyncing(false);
    setSelectedOrders([]);
  };

  const handleDownloadInvoice = async () => {
    const element = document.getElementById('printable-invoice');
    if (!element || !activeInvoice) return;
    
    setIsDownloading(true);
    try {
      // Set to A4 width in pixels (approx 794px for 96 DPI)
      const originalWidth = element.style.width;
      element.style.width = '794px';

      const canvas = await html2canvas(element, {
        scale: 3, // High quality 3x resolution for crisp text
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794
      });
      
      element.style.width = originalWidth; // Restore
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Byabshik_Invoice_${activeInvoice.id.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download Error:", err);
      alert("ইনভয়েস ডাউনলোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderInvoice = () => {
    if (!activeInvoice) return null;
    const inv = activeInvoice;
    const date = new Date(inv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
      <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 modal-overlay no-print">
         <div className="bg-white w-full max-w-[850px] rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col h-full max-h-[95vh]">
            <button onClick={() => setActiveInvoice(null)} className="absolute top-6 right-6 z-10 w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all font-black text-xl no-print">✕</button>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
               {/* Fixed A4 dimensions for capture */}
               <div className="mx-auto bg-white p-12 md:p-16 shadow-lg min-h-[1123px]" id="printable-invoice" style={{ width: '794px' }}>
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10">
                     <div>
                       {logoUrl ? <img src={logoUrl} className="h-16 mb-4 object-contain" alt="Business Logo"/> : <div className="w-16 h-16 bg-slate-900 rounded-2xl mb-4 flex items-center justify-center text-white font-black text-xl italic">BY</div>}
                       <h1 className="text-4xl font-black tracking-tighter text-slate-950 uppercase italic leading-none">Invoice</h1>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">Commercial Receipt Node</p>
                     </div>
                     <div className="text-right space-y-3">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Hash</p>
                          <p className="text-xl font-black text-slate-950 font-mono">#{inv.id.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fulfillment Date</p>
                          <p className="text-sm font-black text-slate-950">{date}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-16 mb-12">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-2">Billing Information</p>
                        <div className="space-y-1">
                           <p className="text-xl font-black text-slate-950">{inv.customerName}</p>
                           <p className="text-sm font-black text-slate-400 font-mono">{inv.customerPhone}</p>
                           <p className="text-sm font-medium text-slate-600 mt-2 italic leading-relaxed">{inv.customerAddress}</p>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Logistics Routing</p>
                        <div className="space-y-2">
                           <div className="flex justify-between text-sm">
                             <span className="font-bold text-slate-400 uppercase text-[10px]">Region:</span>
                             <span className="font-black text-slate-900 uppercase italic">{inv.deliveryRegion} Dhaka</span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span className="font-bold text-slate-400 uppercase text-[10px]">Status:</span>
                             <span className="font-black text-slate-900 uppercase italic">{inv.status}</span>
                           </div>
                           {inv.steadfastId && (
                             <div className="flex justify-between text-sm pt-2 border-t border-slate-50">
                               <span className="font-bold text-slate-400 uppercase text-[10px]">Tracking ID:</span>
                               <span className="font-mono font-black text-slate-900">{inv.steadfastId}</span>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <table className="w-full text-left mb-16">
                     <thead className="bg-slate-50">
                       <tr>
                         <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Inventory Description</th>
                         <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Qty</th>
                         <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Unit Rate</th>
                         <th className="px-4 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Line Total</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {inv.items.map((item, idx) => {
                         const p = products.find(prod => prod.id === item.productId);
                         return (
                           <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                             <td className="px-4 py-6">
                                <p className="text-sm font-black text-slate-900 italic">{p?.name || 'Asset Protocol'}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 font-mono">SKU: {p?.sku || '---'}</p>
                             </td>
                             <td className="px-4 py-6 text-center text-sm font-black text-slate-900">{item.quantity}</td>
                             <td className="px-4 py-6 text-right text-sm font-black text-slate-900">৳{(item.price || 0).toLocaleString()}</td>
                             <td className="px-4 py-6 text-right text-sm font-black text-slate-900">৳{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</td>
                           </tr>
                         );
                       })}
                     </tbody>
                  </table>

                  <div className="flex justify-end pt-8 border-t-2 border-slate-100">
                     <div className="w-80 space-y-4">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <span>Subtotal Val</span>
                           <span className="text-slate-950 font-mono">৳{(inv.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <span>Logistics Fee</span>
                           <span className="text-slate-950 font-mono">৳{(inv.deliveryCharge || 0).toLocaleString()}</span>
                        </div>
                        {inv.discount && inv.discount > 0 && (
                           <div className="flex justify-between text-[10px] font-black text-orange-600 uppercase tracking-widest">
                              <span>Promo Rebate</span>
                              <span className="font-mono">-৳{(inv.discount || 0).toLocaleString()}</span>
                           </div>
                        )}
                        <div className="pt-6 mt-4 border-t-2 border-slate-900 flex justify-between items-end">
                           <p className="text-[11px] font-black text-slate-950 uppercase tracking-[0.2em] italic">Grand Total</p>
                           <p className="text-4xl font-black text-slate-950 tracking-tighter italic leading-none">৳{(inv.grandTotal || 0).toLocaleString()}</p>
                        </div>
                        <div className="pt-2 text-right">
                           <p className="text-[8px] font-black text-slate-400 uppercase italic">Cash on Delivery Authorized</p>
                        </div>
                     </div>
                  </div>

                  <div className="mt-32 pt-12 border-t border-slate-50 text-center space-y-3 opacity-40">
                     <div className="flex justify-center gap-6 mb-4">
                        <div className="text-[8px] font-black text-slate-950 uppercase tracking-[0.3em]">Integrity</div>
                        <div className="text-[8px] font-black text-slate-950 uppercase tracking-[0.3em]">Speed</div>
                        <div className="text-[8px] font-black text-slate-950 uppercase tracking-[0.3em]">Scale</div>
                     </div>
                     <p className="text-[9px] font-black text-slate-950 uppercase tracking-[0.5em] italic">Thank you for your business</p>
                     <p className="text-[7px] font-bold text-slate-400 uppercase italic">Generated by Byabshik Cloud Infrastructure — No physical signature required</p>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 flex gap-4 print-button-container no-print shadow-2xl">
               <button 
                onClick={handleDownloadInvoice} 
                disabled={isDownloading}
                className={`flex-1 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 {isDownloading ? (
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 ) : (
                   <span className="text-lg">📥</span>
                 )} 
                 {isDownloading ? 'Processing A4 File...' : 'Download A4 Invoice'}
               </button>
               <button 
                onClick={() => setActiveInvoice(null)} 
                className="px-10 bg-slate-100 text-slate-500 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
               >
                 Close
               </button>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      {renderInvoice()}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Operation Hub</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Found {filteredOrders.length} Intelligence Records</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72 group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input 
              type="text" 
              placeholder="Phone or Name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-orange-500/5 font-bold text-xs shadow-sm transition-all" 
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-5 py-4 bg-white border border-slate-200 rounded-[1.5rem] font-black text-[10px] uppercase outline-none shadow-sm cursor-pointer hover:bg-slate-50">
            <option value="all">All Operations</option>
            {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {/* Floating Tactical Bar */}
      {selectedOrders.length > 0 && isAdmin && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-950 p-4 rounded-[2.5rem] shadow-3xl flex items-center gap-5 border border-white/10 animate-in slide-in-from-bottom-12 duration-500 no-print">
          <div className="px-6 border-r border-white/10">
             <p className="text-[11px] font-black text-orange-500 italic uppercase">{selectedOrders.length} Selected</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              onChange={(e) => e.target.value && handleBulkStatusChange(e.target.value as OrderStatus)} 
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-[10px] font-black uppercase text-white outline-none cursor-pointer"
            >
              <option value="" className="text-slate-900">Change Status...</option>
              {Object.values(OrderStatus).map(s => <option key={s} value={s} className="text-slate-900">{s.toUpperCase()}</option>)}
            </select>
            <button 
              onClick={handleBulkSync}
              disabled={isBulkSyncing}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-orange-600/20 disabled:opacity-30 transition-all active:scale-95"
            >
              {isBulkSyncing ? 'Synchronizing...' : '🚚 Dispatch Logistics'}
            </button>
            <button onClick={() => setSelectedOrders([])} className="text-[10px] font-black uppercase text-slate-500 px-4 hover:text-white transition-colors">Abort</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-950 border-b border-white/5">
              <tr>
                <th className="px-8 py-6">
                  <input 
                    type="checkbox" 
                    checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length} 
                    onChange={selectAll} 
                    className="w-5 h-5 rounded-lg border-slate-600 text-orange-600 bg-slate-800 cursor-pointer" 
                  />
                </th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operation Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Recipient Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Commercial Total</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map(order => {
                const isSelected = selectedOrders.includes(order.id);
                return (
                  <tr key={order.id} className={`group hover:bg-slate-50/80 transition-all duration-300 ${isSelected ? 'bg-orange-50/40' : ''}`}>
                    <td className="px-8 py-8">
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => toggleSelect(order.id)} 
                        className="w-5 h-5 rounded-lg border-slate-300 text-orange-600 cursor-pointer" 
                      />
                    </td>
                    <td className="px-6 py-8">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-tighter font-mono italic">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs italic">{order.customerName.charAt(0)}</div>
                         <div>
                            <p className="text-sm font-black text-slate-900 italic leading-none mb-1">{order.customerName}</p>
                            <p className="text-[10px] font-bold text-slate-500 font-mono tracking-widest">{order.customerPhone}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex flex-col">
                         <p className="text-lg font-black text-slate-950 tracking-tighter">৳{(order.grandTotal || 0).toLocaleString()}</p>
                         {order.discount && order.discount > 0 ? (
                           <p className="text-[9px] font-black text-orange-600 uppercase italic mt-1">Discount: ৳{(order.discount || 0).toLocaleString()}</p>
                         ) : <p className="text-[9px] font-black text-slate-300 uppercase mt-1">Full Value</p>}
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-right">
                       <div className="flex justify-end gap-3 items-center">
                          <button 
                            onClick={() => setActiveInvoice(order)}
                            className="w-11 h-11 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                            title="Generate Invoice"
                          >
                             📄
                          </button>
                          {isAdmin && (
                            <>
                              <select 
                                value={order.status} 
                                onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                                className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-[9px] font-black uppercase outline-none focus:border-orange-500 transition-colors"
                              >
                                {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                              </select>
                              <button 
                                onClick={() => handleManualSync(order)}
                                disabled={!!order.steadfastId || syncingId === order.id}
                                className={`w-11 h-11 rounded-xl transition-all shadow-sm active:scale-90 flex items-center justify-center ${order.steadfastId ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-slate-950 text-white hover:bg-orange-600 border border-slate-900'}`}
                                title={order.steadfastId ? `Steadfast ID: ${order.steadfastId}` : "Sync Courier"}
                              >
                                {order.steadfastId ? '✓' : '🚚'}
                              </button>
                            </>
                          )}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="py-40 text-center opacity-20 italic bg-white flex flex-col items-center">
               <span className="text-7xl mb-6">📂</span>
               <p className="text-xs font-black uppercase tracking-[0.5em]">No Records Found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
