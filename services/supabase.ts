
import { createClient } from '@supabase/supabase-js';
import { Order, Product, Lead, User, ChatMessage } from '../types';

const supabaseUrl = 'https://dvzyimegrsoaddkluxqz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2enlpbWVncnNvYWRka2x1eHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTQ5MTAsImV4cCI6MjA4MzUzMDkxMH0.EFiwP5TzK_WGwNd-nbnM0fcWavInArnmxvw82tF9b4o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const stringifyError = (err: any): string => {
  if (!err) return "Unknown Error";
  if (typeof err === 'string') return err;
  if (err.message && typeof err.message === 'string') {
    let msg = err.message;
    if (err.details && err.details !== 'null') msg += ` - ${err.details}`;
    if (err.code) msg += ` [Code: ${err.code}]`;
    return msg;
  }
  if (err instanceof Error) return err.message;
  return JSON.stringify(err);
};

const safeFetch = async (query: any) => {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn("Database Fetch Warning:", error);
      if (error.code === '42P01') return []; 
      throw new Error(stringifyError(error));
    }
    return data || [];
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch')) {
      return []; 
    }
    throw err;
  }
};

const getProducts = async (bizId: string): Promise<Product[]> => {
  const data = await safeFetch(supabase.from('products').select('*').eq('business_id', bizId));
  return data.map((p: any) => ({ ...p, businessId: p.business_id }));
};

const getOrders = async (bizId: string): Promise<Order[]> => {
  const data = await safeFetch(supabase.from('orders').select('*').eq('business_id', bizId).order('created_at', { ascending: false }));
  return data.map((o: any) => ({
    ...o,
    businessId: o.business_id,
    moderatorId: o.moderator_id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerAddress: o.customer_address,
    deliveryRegion: o.delivery_region,
    deliveryCharge: o.delivery_charge,
    items: o.items || [],
    totalAmount: o.total_amount || 0,
    discount: o.discount || 0,
    grandTotal: o.grand_total || 0,
    createdAt: o.created_at,
    steadfastId: o.steadfast_id,
    courierStatus: o.courier_status
  }));
};

const getLeads = async (bizId: string): Promise<Lead[]> => {
  const data = await safeFetch(supabase.from('leads').select('*').eq('business_id', bizId));
  return data.map((l: any) => ({
    ...l,
    businessId: l.business_id,
    phoneNumber: l.phone_number,
    customerName: l.customer_name,
    address: l.address,
    moderatorId: l.moderator_id,
    status: l.status,
    assignedDate: l.assigned_date,
    createdAt: l.created_at
  }));
};

const getSettings = async (bizId: string) => {
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('business_id', bizId).maybeSingle();
    if (error) {
      if (error.code === '42P01') return null;
      throw error;
    }
    return data || null;
  } catch (err) {
    console.error("getSettings Error:", err);
    return null;
  }
};

const saveSettings = async (bizId: string, updates: any) => {
  const { error } = await supabase.from('settings').upsert({ 
    business_id: bizId, 
    ...updates,
    updated_at: new Date().toISOString()
  }, { onConflict: 'business_id' });
  if (error) throw new Error(stringifyError(error));
};

const getModerators = async (bizId: string): Promise<User[]> => {
  const data = await safeFetch(supabase.from('users').select('*').eq('business_id', bizId));
  return data.map((u: any) => ({ ...u, businessId: u.business_id }));
};

const getMessages = async (bizId: string): Promise<ChatMessage[]> => {
  try {
    const data = await safeFetch(supabase.from('messages').select('*').eq('business_id', bizId));
    return data.map((m: any) => ({
      ...m,
      businessId: m.business_id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      isRead: m.is_read
    }));
  } catch (e) {
    return [];
  }
};

const sendMessage = async (msg: ChatMessage) => {
  const dbMsg = {
    id: msg.id,
    business_id: msg.businessId,
    sender_id: msg.senderId,
    receiver_id: msg.receiverId,
    text: msg.text,
    timestamp: msg.timestamp,
    is_read: msg.isRead || false
  };
  const { error } = await supabase.from('messages').insert(dbMsg);
  if (error) throw new Error(stringifyError(error));
};

const markRead = async (receiverId: string, senderId: string) => {
  const { error } = await supabase.from('messages').update({ is_read: true }).eq('receiver_id', receiverId).eq('sender_id', senderId);
  if (error) throw new Error(stringifyError(error));
};

const updateOrderStatus = async (id: string, status: string, courierData?: any) => {
  const updates: any = { status };
  if (courierData) {
    updates.steadfast_id = courierData.id;
    updates.courier_status = courierData.status;
  }
  const { error } = await supabase.from('orders').update(updates).eq('id', id);
  if (error) throw new Error(stringifyError(error));
};

const saveOrder = async (order: Order) => {
  const dbOrder = {
    id: order.id,
    business_id: order.businessId,
    moderator_id: order.moderatorId,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_address: order.customerAddress,
    delivery_region: order.deliveryRegion,
    delivery_charge: order.deliveryCharge,
    items: order.items,
    total_amount: order.totalAmount,
    discount: order.discount,
    grand_total: order.grandTotal,
    status: order.status,
    created_at: order.createdAt,
    notes: order.notes
  };
  const { error } = await supabase.from('orders').insert(dbOrder);
  if (error) throw new Error(stringifyError(error));
};

const deleteProduct = async (id: string) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(stringifyError(error));
};

const saveProduct = async (product: Product) => {
  const dbData = {
    id: product.id,
    business_id: product.businessId,
    sku: product.sku,
    name: product.name,
    price: product.price,
    stock: product.stock
  };
  const { error } = await supabase.from('products').upsert(dbData);
  if (error) throw new Error(stringifyError(error));
};

const saveLeads = async (leads: Lead[]) => {
  const dbLeads = leads.map(l => ({
    id: l.id,
    business_id: l.businessId,
    phone_number: l.phoneNumber,
    customer_name: l.customerName,
    address: l.address,
    moderator_id: l.moderatorId,
    status: l.status,
    assigned_date: l.assignedDate,
    created_at: l.createdAt
  }));
  const { error } = await supabase.from('leads').upsert(dbLeads);
  if (error) throw new Error(stringifyError(error));
};

const updateLead = async (id: string, updates: any) => {
  const dbUpdates: any = {};
  if (updates.moderatorId !== undefined) dbUpdates.moderator_id = updates.moderatorId;
  if (updates.assignedDate !== undefined) dbUpdates.assigned_date = updates.assignedDate;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName;
  if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;

  const { error } = await supabase.from('leads').update(dbUpdates).eq('id', id);
  if (error) throw new Error(stringifyError(error));
};

const deleteLead = async (id: string) => {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw new Error(stringifyError(error));
};

export const db = {
  getProducts,
  saveProduct,
  deleteProduct,
  getLeads,
  saveLeads,
  updateLead,
  deleteLead,
  getOrders,
  saveOrder,
  updateOrderStatus,
  getMessages,
  sendMessage,
  markRead,
  getModerators,
  getSettings,
  saveSettings
};
