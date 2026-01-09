
import React, { useState } from 'react';
import { Product, User } from '../types';

interface ProductManagerProps {
  products: Product[];
  currentUser: User;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({ products, currentUser, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [isAdding, setIsAdding] = useState(false);
  
  // States for Editing and Deleting
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !sku || !stock) return;

    const newProduct: Product = {
      id: `p-${Date.now()}`,
      businessId: currentUser.businessId,
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      price: parseFloat(price),
      stock: parseInt(stock)
    };

    onAddProduct(newProduct);
    setName('');
    setSku('');
    setPrice('');
    setStock('50');
    setIsAdding(false);
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditSku(product.sku);
    setEditPrice(product.price.toString());
    setEditStock(product.stock.toString());
    setConfirmDeleteId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    if (!editName || !editPrice || !editSku || !editStock) return;
    onUpdateProduct({
      id,
      businessId: currentUser.businessId,
      sku: editSku.toUpperCase().trim(),
      name: editName.trim(),
      price: parseFloat(editPrice),
      stock: parseInt(editStock)
    });
    setEditingId(null);
  };

  const quickAdjustStock = (product: Product, amount: number) => {
    const newStock = Math.max(0, product.stock + amount);
    onUpdateProduct({
      ...product,
      stock: newStock
    });
  };

  const triggerDelete = (id: string) => {
    setConfirmDeleteId(id);
    setEditingId(null);
  };

  const finalDelete = (id: string) => {
    onDeleteProduct(id);
    setConfirmDeleteId(null);
  };

  const getStockStatus = (count: number) => {
    if (count <= 0) return { label: 'Out of Stock', color: 'bg-rose-50 text-rose-600 border-rose-100', dot: 'bg-rose-500' };
    if (count < 10) return { label: 'Critical Low', color: 'bg-orange-50 text-orange-600 border-orange-100', dot: 'bg-orange-500' };
    if (count < 25) return { label: 'Low Stock', color: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500' };
    return { label: 'In Stock', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' };
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic">Advanced Inventory</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{products.length} Professional SKUs Registered</p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`${isAdding ? 'bg-slate-900' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-3`}
        >
          {isAdding ? '✕ Close Portal' : '＋ Add New Asset'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center text-2xl shadow-lg font-black">📦</div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight italic">Inventory Registration</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Deploy new product into global stock</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Code (SKU)</label>
                <input
                  required
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black font-mono text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all uppercase"
                  placeholder="E.G. CHILI-500"
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Identity (Name)</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                  placeholder="Describe product..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (৳)</label>
                  <input
                    required
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Stock</label>
                  <input
                    required
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                    placeholder="50"
                  />
                </div>
              </div>
              <div className="md:col-span-4 flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-slate-950 hover:bg-black text-white px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-2xl active:scale-95"
                >
                  Verify & Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 border-b border-white/5">
              <tr>
                <th className="px-10 py-7 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Asset Details & SKU</th>
                <th className="px-10 py-7 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Commercial Value</th>
                <th className="px-10 py-7 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Live Availability</th>
                <th className="px-10 py-7 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">System Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center opacity-20 italic">
                    <span className="text-6xl block mb-6">🛰️</span>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em]">No Inventory Records Found In System</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const status = getStockStatus(product.stock);
                  const isEditing = editingId === product.id;
                  const isConfirming = confirmDeleteId === product.id;

                  return (
                    <tr key={product.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                      <td className="px-10 py-8">
                        {isEditing ? (
                          <div className="space-y-3 max-w-xs">
                            <input
                              type="text"
                              value={editSku}
                              onChange={(e) => setEditSku(e.target.value)}
                              className="w-full px-4 py-2 border-2 border-indigo-100 rounded-xl text-[10px] font-black font-mono uppercase bg-white focus:border-indigo-500 outline-none"
                            />
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-xs font-bold bg-white focus:border-indigo-500 outline-none"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <p className="font-black text-slate-900 text-base leading-tight tracking-tight italic">{product.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 tracking-widest uppercase">
                                SKU: {product.sku}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-8">
                        {isEditing ? (
                          <div className="relative max-w-[120px]">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">৳</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full pl-9 pr-4 py-3 border-2 border-indigo-100 rounded-xl text-xs font-black bg-white focus:border-indigo-500 outline-none"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg tracking-tighter">
                              ৳{(product.price || 0).toLocaleString()}
                            </span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Base Unit Cost</span>
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-8">
                        {isEditing ? (
                          <div className="flex flex-col gap-2 max-w-[120px]">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Adjust Stock</label>
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-xs font-black bg-white focus:border-indigo-500 outline-none"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-8">
                             <div className="flex flex-col">
                               <div className="flex items-center gap-2 mb-1.5">
                                 <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                                 <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${status.color}`}>
                                   {status.label}
                                 </span>
                               </div>
                               <span className="text-2xl font-black text-slate-900 tracking-tighter">
                                 {product.stock} <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Units</span>
                               </span>
                             </div>

                             {/* Quick Adjustment Controls */}
                             <div className="hidden group-hover:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-right-2 duration-300">
                                <button 
                                  onClick={() => quickAdjustStock(product, -1)}
                                  className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-black text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-90"
                                >
                                  −
                                </button>
                                <button 
                                  onClick={() => quickAdjustStock(product, 1)}
                                  className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-black text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-90"
                                >
                                  +
                                </button>
                             </div>
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-8 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => saveEdit(product.id)}
                              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                            >
                              Sync Data
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-slate-100 text-slate-400 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                              Abort
                            </button>
                          </div>
                        ) : isConfirming ? (
                          <div className="flex justify-end items-center gap-3 animate-in zoom-in-95 duration-200">
                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest italic">Confirm Purge?</span>
                            <button
                              onClick={() => finalDelete(product.id)}
                              className="bg-rose-600 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20"
                            >
                              EXECUTE
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-slate-100 text-slate-600 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
                            >
                              DENY
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3 items-center">
                            <button
                              onClick={() => startEditing(product)}
                              className="w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:rotate-6"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => triggerDelete(product.id)}
                              className="w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 rounded-2xl flex items-center justify-center transition-all shadow-sm group-hover:-rotate-6"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductManager;
