
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  ON_HOLD = 'on_hold'
}

export type LeadStatus = 'pending' | 'confirmed' | 'communication' | 'no-response';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner',
  MODERATOR = 'moderator'
}

export interface ChatMessage {
  id: string;
  businessId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead?: boolean;
}

export interface Business {
  id: string;
  name: string;
  ownerId?: string;
  logoUrl?: string;
  created_at: string;
  plan?: 'trial' | 'pro' | 'expired';
  expires_at?: string;
  payment_phone?: string;
  transaction_id?: string;
  selected_plan?: string;
}

export interface User {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: UserRole;
  lastSeen?: string;
  is_active?: boolean;
}

export interface Product {
  id: string;
  businessId: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  businessId: string;
  moderatorId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryRegion: 'inside' | 'outside' | 'sub';
  deliveryCharge: number;
  items: OrderItem[];
  totalAmount: number;
  discount?: number;
  grandTotal: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
  steadfastId?: string;
  courierStatus?: string;
}

export interface Lead {
  id: string;
  businessId: string;
  phoneNumber: string;
  customerName?: string;
  address?: string;
  moderatorId: string;
  status: LeadStatus;
  assignedDate: string;
  createdAt: string;
}

export interface CourierConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  webhookUrl?: string;
  accountEmail: string;
  accountPassword?: string;
  // Added properties used for platform branding and payments
  systemIcon?: string;
  steadfastLogo?: string;
  bkash?: string;
  nagad?: string;
  rocket?: string;
}
