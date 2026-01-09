
import { OrderStatus, UserRole, Product, User } from './types';

// Adding default businessId to initial products to satisfy TypeScript
export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', businessId: 'default', sku: 'SCP-500', name: '🌶️ মিষ্টি মরিচ (Sweet Chili Powder) - ৫০০ গ্রাম', price: 550, stock: 50 },
  { id: 'p2', businessId: 'default', sku: 'SCP-1KG', name: '🌶️ মিষ্টি মরিচ (Sweet Chili Powder) - ১ কেজি', price: 950, stock: 50 },
  { id: 'p3', businessId: 'default', sku: 'SGM-200', name: '👑 শাহী গরম মসলা (Shahi Garam Masala) - ২০০ গ্রাম', price: 650, stock: 50 },
  { id: 'p4', businessId: 'default', sku: 'SGM-500', name: '👑 শাহী গরম মসলা (Shahi Garam Masala) - ৫০০ গ্রাম', price: 1424, stock: 50 },
  { id: 'p5', businessId: 'default', sku: 'TUR-500', name: '💛 দেশি হলুদের গুঁড়া (Turmeric Powder) - ৫০০ গ্রাম', price: 290, stock: 50 },
  { id: 'p6', businessId: 'default', sku: 'COR-500', name: '🌿 দেশি ধনিয়া গুঁড়া (Coriander Powder) - ৫০০ গ্রাম', price: 250, stock: 50 },
  { id: 'p7', businessId: 'default', sku: 'CUM-500', name: '🌾 দেশি জিরা গুঁড়া (Cumin Powder) - ৫০০ গ্রাম', price: 780, stock: 50 },
  { id: 'p8', businessId: 'default', sku: 'MEZ-200', name: '🍖 চট্টগ্রামের অরিজিনাল মেবজানি মাংসের মসলা (Mezban Masala) - ২০০ গ্রাম', price: 680, stock: 50 },
  { id: 'p9', businessId: 'default', sku: 'MEZ-500', name: '🍖 চট্টগ্রামের অরিজিনাল মেবজানি মাংসের মসলা (Mezban Masala) - ৫০০ গ্রাম', price: 1480, stock: 50 },
];

export const STATUS_COLORS = {
  [OrderStatus.PENDING]: 'bg-slate-100 text-slate-600 border-slate-200',
  [OrderStatus.CONFIRMED]: 'bg-blue-50 text-blue-600 border-blue-100',
  [OrderStatus.PROCESSING]: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  [OrderStatus.SHIPPED]: 'bg-purple-50 text-purple-600 border-purple-100',
  [OrderStatus.DELIVERED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  [OrderStatus.CANCELLED]: 'bg-rose-50 text-rose-600 border-rose-100',
  [OrderStatus.RETURNED]: 'bg-orange-50 text-orange-600 border-orange-100',
  [OrderStatus.ON_HOLD]: 'bg-amber-50 text-amber-600 border-amber-100',
};

// Fix role to SUPER_ADMIN and add missing businessId
export const ADMIN_USER: User = {
  id: 'admin-root',
  businessId: 'system',
  name: 'Byabshik Admin',
  email: 'ubaidihasan510@gmail.com',
  role: UserRole.SUPER_ADMIN,
};
