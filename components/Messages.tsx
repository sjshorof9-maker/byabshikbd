
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, UserRole } from '../types';
import { db } from '../services/supabase';

interface MessagesProps {
  currentUser: User;
  moderators: User[];
}

const Messages: React.FC<MessagesProps> = ({ currentUser, moderators }) => {
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const msgs = await db.getMessages(currentUser.businessId);
      setAllMessages(msgs || []);
      setDbError(null);
    } catch (err: any) {
      // Graceful error handling for failed fetches
      if (!err.message?.includes('Failed to fetch')) {
         console.error("Fetch Messages Error:", err);
      }
      if (err.message?.includes('relation "messages" does not exist')) {
        setDbError("মেসেজ টেবিল পাওয়া যায়নি।");
      }
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); 
    return () => clearInterval(interval);
  }, [currentUser.businessId]);

  useEffect(() => {
    if (selectedContact) {
      db.markRead(currentUser.id, selectedContact.id).then(fetchMessages).catch(() => {});
    }
  }, [selectedContact, currentUser.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages, selectedContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact || isSending) return;

    const currentText = messageText;
    setMessageText('');
    setIsSending(true);
    
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      businessId: currentUser.businessId,
      senderId: String(currentUser.id),
      receiverId: String(selectedContact.id),
      text: currentText,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    try {
      await db.sendMessage(newMessage);
      setAllMessages(prev => [...prev, newMessage]);
    } catch (err: any) {
      alert("মেসেজ পাঠানো সম্ভব হয়নি।");
      setMessageText(currentText); 
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = allMessages.filter(m => 
    (String(m.senderId) === String(currentUser.id) && String(m.receiverId) === String(selectedContact?.id)) ||
    (String(m.senderId) === String(selectedContact?.id) && String(m.receiverId) === String(currentUser.id))
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const contacts = moderators.filter(m => String(m.id) !== String(currentUser.id));

  return (
    <div className="flex flex-col md:flex-row bg-white h-[calc(100vh-160px)] md:h-[calc(100vh-160px)] rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      
      {/* Sidebar - Contacts List */}
      <div className={`${selectedContact ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-slate-50 flex-col bg-white overflow-hidden`}>
        <div className="p-5 border-b border-slate-50 flex-shrink-0">
          <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-4 uppercase italic">Inbox</h3>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-10 pr-4 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {dbError ? (
            <div className="p-6 text-center">
               <p className="text-[10px] font-black text-rose-500 uppercase bg-rose-50 p-4 rounded-xl leading-relaxed">{dbError}</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-10 text-center opacity-30 italic font-black uppercase text-[10px] tracking-widest">No Unit Members</div>
          ) : (
            contacts.map(c => {
              const lastMsg = allMessages
                .filter(m => (String(m.senderId) === String(c.id) && String(m.receiverId) === String(currentUser.id)) || (String(m.senderId) === String(currentUser.id) && String(m.receiverId) === String(c.id)))
                .pop();
              const unread = allMessages.filter(m => String(m.senderId) === String(c.id) && String(m.receiverId) === String(currentUser.id) && !m.isRead).length;
              
              return (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedContact(c)} 
                  className={`w-full flex items-center gap-4 px-6 py-5 transition-all hover:bg-slate-50 active:bg-slate-100 border-b border-slate-50 last:border-none ${selectedContact?.id === c.id ? 'bg-slate-50' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm ${selectedContact?.id === c.id ? 'bg-slate-900' : 'bg-indigo-600'}`}>
                      {c.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="text-left flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className={`text-xs font-black truncate uppercase tracking-tight ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>{c.name}</p>
                      {lastMsg && <p className="text-[8px] font-black text-slate-400">{new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-[10px] truncate max-w-[140px] ${unread > 0 ? 'font-black text-slate-900' : 'text-slate-400 font-medium italic'}`}>
                        {lastMsg ? (String(lastMsg.senderId) === String(currentUser.id) ? `You: ${lastMsg.text}` : lastMsg.text) : 'Tap to start...'}
                      </p>
                      {unread > 0 && <div className="w-4 h-4 bg-indigo-600 rounded-lg flex items-center justify-center text-[8px] font-black text-white ml-2">{unread}</div>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Box */}
      <div className={`${!selectedContact ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white overflow-hidden relative`}>
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-4 bg-white flex-shrink-0 shadow-sm sticky top-0 z-20">
              <button 
                onClick={() => setSelectedContact(null)} 
                className="md:hidden w-10 h-10 flex items-center justify-center text-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors"
              >
                ←
              </button>
              <div className="relative flex-shrink-0">
                 <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm italic">{selectedContact.name.charAt(0)}</div>
                 <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="font-black text-slate-900 text-sm leading-none truncate uppercase tracking-tight">{selectedContact.name}</h4>
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Active Now
                </p>
              </div>
            </div>

            {/* Chat Content */}
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto px-5 py-8 space-y-6 bg-slate-50/10 custom-scrollbar"
            >
               {filteredMessages.map((msg, idx) => {
                 const isMe = String(msg.senderId) === String(currentUser.id);
                 const nextMsg = filteredMessages[idx + 1];
                 const isSameSenderAsNext = nextMsg && String(nextMsg.senderId) === String(msg.senderId);
                 
                 return (
                   <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSameSenderAsNext ? 'mb-1' : 'mb-4'}`}>
                      <div className={`max-w-[88%] md:max-w-[75%] px-5 py-3 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm transition-all ${
                        isMe 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      {!isSameSenderAsNext && (
                        <p className="text-[7px] font-black text-slate-400 mt-2 px-1 uppercase italic tracking-widest">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      )}
                   </div>
                 );
               })}
               {filteredMessages.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center py-10 text-center space-y-4 opacity-50">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-slate-100">💬</div>
                    <div>
                       <p className="font-black text-slate-900 text-sm italic uppercase tracking-widest">Start a secure team talk</p>
                    </div>
                 </div>
               )}
            </div>

            {/* Input Form - Optimized for Mobile Typing */}
            <div className="p-4 md:p-6 bg-white border-t border-slate-50 flex-shrink-0 pb-safe z-30">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-5xl mx-auto">
                <input 
                  type="text" 
                  autoFocus
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  placeholder="Type your message..." 
                  className="flex-1 bg-slate-100 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                />
                <button 
                  type="submit" 
                  disabled={isSending || !messageText.trim()}
                  className={`w-14 h-14 flex items-center justify-center rounded-[1.5rem] transition-all shadow-xl active:scale-90 flex-shrink-0 ${
                    messageText.trim() ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-xl">➔</span>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/20">
             <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-5xl mb-8 border border-slate-100 italic font-black text-indigo-600 animate-pulse">BY</div>
             <div className="text-center space-y-4">
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Secure Operational Sync</h3>
               <p className="text-slate-400 font-bold max-w-[280px] mx-auto leading-relaxed italic text-[11px] uppercase tracking-widest">Select a unit member from the left panel to initiate high-speed synchronization.</p>
             </div>
             <div className="mt-16 grid grid-cols-2 gap-4">
                <div className="px-6 py-4 bg-white rounded-2xl border border-slate-100 text-center shadow-sm">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                   <p className="text-[10px] font-black text-emerald-500 uppercase">Encrypted</p>
                </div>
                <div className="px-6 py-4 bg-white rounded-2xl border border-slate-100 text-center shadow-sm">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Uptime</p>
                   <p className="text-[10px] font-black text-indigo-500 uppercase">Active</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
