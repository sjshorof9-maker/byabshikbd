
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Order, OrderStatus, CourierConfig, Product, Lead, UserRole } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ClientVerification from './components/ClientVerification';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import Login from './components/Login';
import ModeratorManager from './components/ModeratorManager';
import Settings from './components/Settings';
import ProductManager from './components/ProductManager';
import LeadManager from './components/LeadManager';
import ModeratorLeads from './components/ModeratorLeads';
import CustomerManager from './components/CustomerManager';
import LandingPage from './components/LandingPage';
import SubscriptionManager from './components/SubscriptionManager';
import Messages from './components/Messages';
import { db, supabase, stringifyError } from './services/supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [moderators, setModerators] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [systemIcon, setSystemIcon] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitialBoot, setIsInitialBoot] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [courierConfig, setCourierConfig] = useState<CourierConfig>({
    apiKey: '', secretKey: '', baseUrl: 'https://portal.steadfast.com.bd/api/v1', accountEmail: ''
  });

  const lastFetchRef = useRef<number>(0);

  const loadGlobalBranding = useCallback(async () => {
    try {
      const globalSettings = await db.getSettings('system-platform');
      if (globalSettings) {
        if (globalSettings.logo_url) setLogoUrl(globalSettings.logo_url);
        if (globalSettings.courier_config?.systemIcon) setSystemIcon(globalSettings.courier_config.systemIcon);
      }
    } catch (e) {
      console.warn("Global branding failed to load", e);
    }
  }, []);

  const loadAllData = useCallback(async (user: User, silent = false) => {
    if (!db || !db.getOrders) return;
    
    // Prevent excessive fetching (debounce 2s)
    if (Date.now() - lastFetchRef.current < 2000 && !isInitialBoot) return;
    lastFetchRef.current = Date.now();

    if (!silent) setIsRefreshing(true);

    try {
      const bizId = user.businessId;
      const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

      if (isSuperAdmin) {
        const [bizRes, orderRes, modRes] = await Promise.all([
          supabase.from('businesses').select('*'),
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('users').select('*')
        ]);

        if (bizRes.data) setBusinesses(bizRes.data);
        if (orderRes.data) {
          setOrders(orderRes.data.map((o: any) => ({
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
          })));
        }
        if (modRes.data) {
          setModerators(modRes.data.map((u: any) => ({ ...u, businessId: u.business_id })));
        }
      } else {
        // Business-Specific Fetch - Faster initial promise for critical path
        const bizPromise = supabase.from('businesses').select('*').eq('id', bizId).maybeSingle();
        const settingsPromise = db.getSettings(bizId);
        
        // Execute background data loading
        const [bizResult, settingsData] = await Promise.all([bizPromise, settingsPromise]);
        
        if (bizResult.data) setBusinessData(bizResult.data);
        if (settingsData) {
          if (settingsData.logo_url) setLogoUrl(settingsData.logo_url);
          if (settingsData.courier_config) setCourierConfig(settingsData.courier_config);
        }

        // Parallel load of functional data
        const [ordersData, productsData, leadsData, moderatorsData] = await Promise.all([
          db.getOrders(bizId),
          db.getProducts(bizId),
          db.getLeads(bizId),
          db.getModerators(bizId)
        ]);

        setOrders(ordersData);
        setProducts(productsData);
        setLeads(leadsData);
        setModerators(moderatorsData);
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
    } finally {
      setIsRefreshing(false);
      setIsInitialBoot(false);
    }
  }, [isInitialBoot]);

  useEffect(() => {
    loadGlobalBranding();
    const session = localStorage.getItem('byabshik_session');
    if (session) {
      try {
        const user = JSON.parse(session);
        setCurrentUser(user);
        // Load data in background, set initial boot to false immediately for cached feel
        loadAllData(user, true).finally(() => setIsInitialBoot(false));
      } catch (e) {
        setIsInitialBoot(false);
      }
    } else {
      setIsInitialBoot(false);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setShowLogin(false);
    // Don't set initial boot to true if we want to skip the loading spinner
    localStorage.setItem('byabshik_session', JSON.stringify(user));
    loadAllData(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('byabshik_session');
    setActiveTab('dashboard');
    setBusinesses([]);
    setOrders([]);
    setProducts([]);
    setLeads([]);
    loadGlobalBranding();
  };

  if (isInitialBoot && currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white font-black uppercase text-[10px] tracking-widest opacity-50 italic">Syncing Protocol...</p>
      </div>
    );
  }

  if (!currentUser) {
    if (showLogin) return <Login onLogin={handleLogin} onCancel={() => setShowLogin(false)} logoUrl={logoUrl} />;
    return <LandingPage onGetStarted={() => setShowLogin(true)} logoUrl={logoUrl} />;
  }

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      logoUrl={logoUrl} 
      systemIcon={systemIcon || undefined}
      businessData={businessData}
    >
      {isRefreshing && (
        <div className="fixed top-20 right-8 z-[100] flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
          <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">Updating...</span>
        </div>
      )}

      {activeTab === 'dashboard' && (
        isSuperAdmin 
          ? <SuperAdminDashboard businesses={businesses} moderators={moderators} orders={orders} />
          : <Dashboard orders={orders} products={products} leads={leads} currentUser={currentUser} moderators={moderators} />
      )}

      {activeTab === 'verification' && isSuperAdmin && (
        <ClientVerification businesses={businesses} onUpdate={() => loadAllData(currentUser, true)} />
      )}

      {activeTab === 'orders' && (
        <OrderList 
          orders={orders} currentUser={currentUser} products={products} moderators={moderators} courierConfig={courierConfig} 
          onUpdateStatus={(id, s, c) => { 
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: s, steadfastId: c?.id || o.steadfastId, courierStatus: c?.status || o.courierStatus } : o));
            db.updateOrderStatus(id, s, c).catch(e => loadAllData(currentUser, true));
          }}
          onBulkUpdateStatus={(ids, s) => {
            setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status: s } : o));
            Promise.all(ids.map(id => db.updateOrderStatus(id, s))).catch(() => loadAllData(currentUser, true));
          }}
          logoUrl={logoUrl}
        />
      )}

      {activeTab === 'create' && <OrderForm products={products} currentUser={currentUser} orders={orders} leads={leads} onOrderCreate={async (o) => { 
        setOrders(prev => [o, ...prev]);
        setActiveTab('orders');
        try {
          await db.saveOrder(o); 
          o.items.forEach(item => {
             const p = products.find(prod => prod.id === item.productId);
             if (p) db.saveProduct({ ...p, stock: Math.max(0, p.stock - item.quantity) });
          });
          loadAllData(currentUser, true);
        } catch (e) { loadAllData(currentUser, true); }
      }} />}

      {activeTab === 'leads' && (
        <LeadManager 
          currentUser={currentUser} moderators={moderators} leads={leads} orders={orders}
          onAssignLeads={async (newLeads) => { 
            setLeads(prev => [...newLeads, ...prev]);
            db.saveLeads(newLeads).then(() => loadAllData(currentUser, true));
          }}
          onBulkUpdateLeads={async (ids, modId, date) => { 
            setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, moderatorId: modId, assignedDate: date } : l));
            Promise.all(ids.map(id => db.updateLead(id, { moderatorId: modId, assignedDate: date }))).then(() => loadAllData(currentUser, true));
          }}
          onDeleteLead={async (id) => { 
            setLeads(prev => prev.filter(l => l.id !== id));
            db.deleteLead(id).then(() => loadAllData(currentUser, true));
          }}
        />
      )}

      {activeTab === 'myleads' && (
        <ModeratorLeads 
          leads={leads.filter(l => l.moderatorId === currentUser.id)} 
          onUpdateStatus={(id, s) => { 
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status: s } : l));
            db.updateLead(id, { status: s }).then(() => loadAllData(currentUser, true));
          }} 
        />
      )}

      {activeTab === 'products' && (
        <ProductManager 
          products={products} currentUser={currentUser} 
          onAddProduct={async (p) => { setProducts(prev => [p, ...prev]); db.saveProduct(p).then(() => loadAllData(currentUser, true)); }}
          onUpdateProduct={async (p) => { setProducts(prev => prev.map(old => old.id === p.id ? p : old)); db.saveProduct(p).then(() => loadAllData(currentUser, true)); }}
          onDeleteProduct={async (id) => { setProducts(prev => prev.filter(p => p.id !== id)); db.deleteProduct(id).then(() => loadAllData(currentUser, true)); }}
        />
      )}

      {activeTab === 'moderators' && (
        <ModeratorManager 
          moderators={moderators} leads={leads} orders={orders} currentUser={currentUser}
          onAddModerator={async (m: any) => { 
            const dbMod = { id: m.id, business_id: m.businessId, name: m.name, email: m.email, password: m.password, role: m.role, is_active: m.is_active };
            const { error } = await supabase.from('users').insert(dbMod);
            if (!error) { setModerators(prev => [...prev, m]); return true; }
            return false;
          }}
          onDeleteModerator={async (id) => { setModerators(prev => prev.filter(m => m.id !== id)); supabase.from('users').delete().eq('id', id).then(() => loadAllData(currentUser, true)); }}
          onToggleStatus={async (id, active) => { setModerators(prev => prev.map(m => m.id === id ? { ...m, is_active: active } : m)); supabase.from('users').update({ is_active: active }).eq('id', id).then(() => loadAllData(currentUser, true)); }}
        />
      )}

      {activeTab === 'settings' && (
        <Settings 
          config={courierConfig} logoUrl={logoUrl} currentUser={currentUser}
          onSave={async (cfg) => { 
            setCourierConfig(cfg); 
            if(cfg.systemIcon) setSystemIcon(cfg.systemIcon);
            if(db.saveSettings) await db.saveSettings(isSuperAdmin ? 'system-platform' : currentUser.businessId, { courier_config: cfg }); 
          }}
          onUpdateLogo={async (url) => { setLogoUrl(url); if(db.saveSettings) await db.saveSettings(isSuperAdmin ? 'system-platform' : currentUser.businessId, { logo_url: url }); }}
        />
      )}

      {activeTab === 'messages' && <Messages currentUser={currentUser} moderators={moderators} />}
      {activeTab === 'billing' && <SubscriptionManager businessData={businessData} onRefresh={() => loadAllData(currentUser, true)} />}
      {activeTab === 'customers' && <CustomerManager orders={orders} leads={leads} />}
    </Layout>
  );
};

export default App;
