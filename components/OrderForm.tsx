
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Order, OrderStatus, User, OrderItem, Lead } from '../types';

interface OrderFormProps {
  products: Product[];
  currentUser: User;
  onOrderCreate: (order: Order) => Promise<void>;
  orders?: Order[];
  leads?: Lead[];
}

const OrderForm: React.FC<OrderFormProps> = ({ products, currentUser, onOrderCreate, orders = [], leads = [] }) => {
  const getBSTDate = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 6));
  };

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryRegion, setDeliveryRegion] = useState<'inside' | 'outside' | 'sub'>('inside');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryCharges = { inside: 70, sub: 100, outside: 130 };

  useEffect(() => {
    const phone = customerPhone.replace(/[^\d]/g, '');
    if (phone.length === 11) {
      const prevOrder = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .find(o => o.customerPhone.replace(/[^\d]/g, '') === phone);
      if (prevOrder) {
        setCustomerName(prevOrder.customerName);
        setCustomerAddress(prevOrder.customerAddress);
        return;
      }
      const prevLead = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .find(l => l.phoneNumber.replace(/[^\d]/g, '') === phone);
      if (prevLead) {
        if (prevLead.customerName) setCustomerName(prevLead.customerName);
        if (prevLead.address) setCustomerAddress(prevLead.address);
      }
    }
  }, [customerPhone, orders, leads]);

  const subtotal = useMemo(() => 
    items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0),
  [items]);

  const grandTotal = useMemo(() => 
    (subtotal + deliveryCharges[deliveryRegion]) - (Number(discount) || 0),
  [subtotal, deliveryRegion, discount]);

  const addNewAssetRow = () => {
    setItems([...items, {
      id: `oi-${Date.now()}-${Math.random()}`,
      productId: '',
      quantity: 1,
      price: 0
    }]);
  };

  const updateItemProduct = (id: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setItems(items.map(i => i.id === id ? { ...i, productId, price: product.price } : i));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.productId !== '');
    if (validItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const order: Order = {
        id: orderId,
        businessId: currentUser.businessId,
        moderatorId: currentUser.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        deliveryRegion,
        deliveryCharge: deliveryCharges[deliveryRegion],
        items: validItems,
        totalAmount: subtotal,
        discount: Number(discount) || 0,
        grandTotal: grandTotal,
        status: OrderStatus.PENDING,
        createdAt: getBSTDate().toISOString(),
        notes: notes.trim()
      };
      await onOrderCreate(order);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-24 animate-in fade-in duration-500">
      <div className="mb-8 flex items-end justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Advanced Order</h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Operational Terminal / Dhaka Time Node</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Phone Number</label>
                <input required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="01XXXXXXXXX" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg font-mono outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Customer Name</label>
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Full Delivery Address</label>
              <textarea required value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Village, Road, Thana, District..." className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all h-24 resize-none" />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {(['inside', 'sub', 'outside'] as const).map((reg) => (
                  <button key={reg} type="button" onClick={() => setDeliveryRegion(reg)} className={`py-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-1 ${deliveryRegion === reg ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <span className="text-[8px] font-black uppercase tracking-widest">{reg} Dhaka</span>
                    <span className="text-[10px] font-black">৳{deliveryCharges[reg]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <h3 className="text-sm font-black text-slate-900 uppercase">Inventory Selection</h3>
              <button type="button" onClick={addNewAssetRow} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">+ Add Asset</button>
            </div>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                  <div className="flex-1 w-full">
                    <select value={item.productId} onChange={(e) => updateItemProduct(item.id, e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                      <option value="">Select Asset...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} — ৳{p.price.toLocaleString()}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
                    <button type="button" onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 flex items-center justify-center text-indigo-600 rounded-full text-xl font-black">−</button>
                    <span className="w-10 text-center font-black text-base italic">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 flex items-center justify-center text-indigo-600 rounded-full text-xl font-black">+</button>
                  </div>
                  <button type="button" onClick={() => removeItem(item.id)} className="w-12 h-12 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-rose-500 transition-all">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 lg:sticky lg:top-8">
          <div className="bg-[#0f172a] text-white rounded-[2.5rem] p-8 space-y-10 relative overflow-hidden">
            <div className="space-y-8 relative z-10">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4 italic">Commercial Breakdown</p>
              <div className="space-y-5">
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Subtotal</span><span className="text-lg font-black italic">৳{(subtotal || 0).toLocaleString()}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Delivery</span><span className="text-lg font-black italic">৳{deliveryCharges[deliveryRegion]}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-orange-500 uppercase">Discount</span><input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-right text-sm font-black text-orange-400 outline-none" /></div>
              </div>
              <div className="pt-8 border-t border-white/10 space-y-2">
                <p className="text-[9px] font-black text-indigo-400 uppercase italic">Total Payable Amount</p>
                <p className="text-6xl font-black italic tracking-tighter leading-none">৳{(grandTotal || 0).toLocaleString()}</p>
              </div>
              <button onClick={handleSubmit} disabled={isSubmitting || items.length === 0} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3">
                {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Order Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
