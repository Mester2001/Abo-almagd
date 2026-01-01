
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Car, Phone, MapPin, Calendar, CheckCircle, Clock, 
  Settings, Home, Search, Lock, LogOut, Send, Globe, Trash2, MessageSquare, Loader2, AlertTriangle, X, Bot, Sparkles, Wrench, Shield, Zap, Award, ThumbsUp,
  Facebook, Instagram, ChevronRight, User, Hash, Info, ExternalLink, Download, Database, HardDrive, Eye, Save, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from './LanguageContext';
import { SERVICES, FEATURES, TRANSLATIONS, getTrackingSteps, MAPS_URL } from './constants';
import { Booking } from './types';
import { db, isConfigPlaceholder } from './firebase';
import { GoogleGenAI } from "@google/genai";
import { getWhatsAppLink, getStatusUpdateWhatsAppLink } from './services/whatsapp';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  deleteDoc
} from 'firebase/firestore';

// --- Local Storage Helper ---
const LOCAL_STORAGE_KEY = 'abu_almagd_persistent_bookings';

const getLocalBookings = (): Booking[] => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

const saveLocalBooking = (booking: Booking) => {
  const current = getLocalBookings();
  const updated = [booking, ...current];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// --- Components ---

const Logo = ({ onClick }: { onClick: () => void }) => {
  const { lang } = useLanguage();
  return (
    <div className="flex items-center gap-3 cursor-pointer group" onClick={onClick}>
      <div className="w-12 h-12 orange-gradient rounded-xl flex items-center justify-center neon-glow group-hover:rotate-12 transition-all duration-500">
        <Wrench className="text-black" size={28} />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-xl font-black tracking-tighter neon-text uppercase italic">
          {lang === 'ar' ? 'أبو المجد' : 'Abu-Almagd'}
        </span>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
          {lang === 'ar' ? 'لصيانة السيارات' : 'Engineering Center'}
        </span>
      </div>
    </div>
  );
};

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const { toggleLang, lang, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: t('navHome'), icon: <Home size={18} /> },
    { id: 'book', label: t('navBook'), icon: <Calendar size={18} /> },
    { id: 'track', label: t('navTrack'), icon: <Search size={18} /> },
    { id: 'admin', label: t('navAdmin'), icon: <Lock size={18} /> },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-xl py-4 border-b border-white/5' : 'bg-transparent py-8'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Logo onClick={() => setActiveTab('home')} />
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${activeTab === item.id ? 'bg-[#ff9900] text-black font-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {item.icon}
                <span className="text-xs font-bold uppercase">{item.label}</span>
              </button>
            ))}
          </div>
          <button onClick={toggleLang} className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-[#ff9900]/10 transition-all group">
            <Globe size={18} className="text-[#ff9900] group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-xs font-black uppercase tracking-tighter">{t('langName')}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const AIAssistant = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      if (!chatInstance.current) {
        chatInstance.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: { systemInstruction: t('aiSystemPrompt') },
        });
      }
      const response = await chatInstance.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text || '...' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Error connecting to AI assistant.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-8 right-8 z-50 w-16 h-16 orange-gradient rounded-2xl flex items-center justify-center shadow-2xl neon-glow animate-float hover:scale-110 transition-transform text-black">
        <Bot size={32} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="fixed bottom-28 right-8 z-50 w-[350px] md:w-[450px] h-[600px] glass-card rounded-[2.5rem] flex flex-col shadow-3xl overflow-hidden border border-white/10">
            <div className="p-6 orange-gradient flex justify-between items-center text-black">
              <div className="flex items-center gap-3 font-black uppercase tracking-tight"><Sparkles size={20} /> {t('aiAssistantTitle')}</div>
              <button onClick={() => setIsOpen(false)}><X size={24} /></button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/40">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <Bot size={48} className="mx-auto text-[#ff9900] mb-4 opacity-50" />
                  <p className="text-gray-400 text-sm px-6">{t('aiAssistantSubtitle')}</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-[#ff9900] text-black font-bold' : 'bg-white/10 text-white'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="bg-white/10 p-4 rounded-2xl"><Loader2 className="animate-spin text-[#ff9900]" /></div></div>}
            </div>
            <div className="p-4 bg-black/60 border-t border-white/5 flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={t('aiPlaceholder')} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#ff9900] outline-none" />
              <button onClick={handleSend} className="p-3 orange-gradient rounded-xl text-black"><Send size={20} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const HomePage = ({ setActiveTab }: { setActiveTab: (t: string) => void }) => {
  const { t, lang } = useLanguage();
  return (
    <div className="space-y-40 pb-40">
      <section className="relative min-h-screen flex items-center pt-20 px-6 overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-[#ff9900]/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="max-w-7xl mx-auto relative z-10 w-full grid lg:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: lang === 'ar' ? 100 : -100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="h-px w-12 bg-[#ff9900]"></span>
              <span className="text-[#ff9900] font-black uppercase tracking-[0.2em] text-sm italic">{lang === 'ar' ? 'الجودة الألمانية بخبرة سودانية' : 'German Quality, Sudanese Expertise'}</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-10 leading-[0.9] tracking-tighter">
              {t('heroTitle').split(' ').map((word, i) => (
                <span key={i} className={i >= 2 ? 'text-[#ff9900] block mt-2 drop-shadow-[0_0_20px_rgba(255,153,0,0.4)]' : ''}>{word} </span>
              ))}
            </h1>
            <p className="text-xl text-gray-400 mb-16 max-w-xl leading-relaxed">{t('heroSubtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-6">
              <button onClick={() => setActiveTab('book')} className="px-12 py-6 orange-gradient rounded-2xl text-black font-black text-xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                <Calendar size={24} /> {t('btnBookNow')}
              </button>
              <button onClick={() => setActiveTab('track')} className="px-12 py-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                <Search size={24} /> {t('btnTrackCar')}
              </button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="relative hidden lg:block">
            <div className="absolute -inset-10 bg-[#ff9900]/20 rounded-full blur-[100px]"></div>
            <img src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1000" alt="Engine Diagnostic" className="rounded-[3rem] shadow-2xl relative z-10 border border-white/10 grayscale hover:grayscale-0 transition-all duration-700" />
            <div className="absolute -bottom-10 -left-10 glass-card p-8 rounded-3xl z-20 border border-white/10 flex items-center gap-4">
              <div className="w-16 h-16 bg-[#ff9900] rounded-2xl flex items-center justify-center text-black font-black text-2xl">10+</div>
              <div>
                <p className="font-black text-white">{t('stats3')}</p>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{lang === 'ar' ? 'سنوات من الخبرة' : 'Years Experience'}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-black mb-6">{t('servicesTitle')}</h2>
          <div className="h-1.5 w-32 orange-gradient mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {SERVICES.map((s) => (
            <motion.div key={s.id} whileHover={{ y: -10 }} className="glass-card p-12 rounded-[3rem] border border-white/5 hover:border-[#ff9900]/30 transition-all group">
              <div className="mb-8 w-20 h-20 bg-black rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <h3 className="text-2xl font-black mb-6">{lang === 'ar' ? s.titleAr : s.titleEn}</h3>
              <p className="text-gray-400 leading-relaxed mb-8">{lang === 'ar' ? s.descAr : s.descEn}</p>
              <button onClick={() => setActiveTab('book')} className="text-[#ff9900] font-black uppercase text-xs flex items-center gap-2 tracking-widest group-hover:gap-4 transition-all">
                {t('btnBookNow')} <ChevronRight size={16} className="rtl-mirror" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-white/5 py-40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-black mb-12">{t('featuresTitle')}</h2>
            <div className="space-y-10">
              {FEATURES.map((f) => (
                <div key={f.id} className="flex gap-8">
                  <div className="flex-shrink-0 w-16 h-16 glass-card rounded-2xl flex items-center justify-center border border-white/10 text-[#ff9900]">
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-black mb-2">{lang === 'ar' ? f.titleAr : f.titleEn}</h4>
                    <p className="text-gray-400 leading-relaxed">{lang === 'ar' ? f.descAr : f.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-10 rounded-[2.5rem] text-center border border-white/10">
              <p className="text-5xl font-black text-[#ff9900] mb-2">5000+</p>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{t('stats1')}</p>
            </div>
            <div className="glass-card p-10 rounded-[2.5rem] text-center border border-white/10 mt-12">
              <p className="text-5xl font-black text-[#ff9900] mb-2">100%</p>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{t('stats2')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const BookingPage = () => {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '', phone: '', carModel: '', licensePlate: '', serviceType: '', dateTime: '', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const bookingId = `ABU-${Math.floor(1000 + Math.random() * 9000)}`;
      const newBooking: Booking = {
        id: bookingId,
        ...formData,
        status: 0,
        createdAt: new Date().toISOString()
      };

      if (!isConfigPlaceholder && db) {
        await addDoc(collection(db, 'bookings'), newBooking);
      } else {
        saveLocalBooking(newBooking);
      }

      const waLink = getWhatsAppLink(formData.phone, bookingId, formData.fullName, formData.carModel, formData.serviceType, formData.dateTime, lang);
      window.open(waLink, '_blank');

      setSuccess(true);
      setFormData({ fullName: '', phone: '', carModel: '', licensePlate: '', serviceType: '', dateTime: '', notes: '' });
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-40 pb-40 px-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black mb-6">{t('bookingTitle')}</h2>
          <p className="text-xl text-gray-400">{t('bookingSubtitle')}</p>
        </div>

        {success ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card p-12 rounded-[3rem] text-center border border-[#ff9900]/30">
            <div className="w-24 h-24 bg-[#ff9900]/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle size={48} className="text-[#ff9900]" />
            </div>
            <h3 className="text-3xl font-black mb-4">{t('bookingSuccess')}</h3>
            <button onClick={() => setSuccess(false)} className="mt-8 px-10 py-4 orange-gradient rounded-xl text-black font-black uppercase text-sm">{t('navHome')}</button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card p-10 md:p-16 rounded-[3rem] border border-white/10 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><User size={14}/> {t('formName')}</label>
                <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-[#ff9900] outline-none transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Phone size={14}/> {t('formPhone')}</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-[#ff9900] outline-none transition-all" placeholder="01xxxxxxx" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Car size={14}/> {t('formCar')}</label>
                <input required value={formData.carModel} onChange={e => setFormData({...formData, carModel: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-[#ff9900] outline-none transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Hash size={14}/> {t('formPlate')}</label>
                <input required value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-[#ff9900] outline-none transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Wrench size={14}/> {t('formService')}</label>
                <select required value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-[#ff9900] outline-none transition-all appearance-none">
                  <option value="" className="bg-black">Select Service</option>
                  {SERVICES.map(s => <option key={s.id} value={lang === 'ar' ? s.titleAr : s.titleEn} className="bg-black">{lang === 'ar' ? s.titleAr : s.titleEn}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Calendar size={14}/> {t('formDate')}</label>
                <input required type="datetime-local" value={formData.dateTime} onChange={e => setFormData({...formData, dateTime: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-[#ff9900] outline-none transition-all" />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-6 orange-gradient rounded-2xl text-black font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={24} /> {t('btnConfirmBooking')}</>}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const TrackingPage = () => {
  const { t, lang } = useLanguage();
  const [bookingId, setBookingId] = useState('');
  const [result, setResult] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    if (!bookingId) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const local = getLocalBookings();
      const found = local.find(b => b.id.toUpperCase() === bookingId.toUpperCase());
      
      if (found) {
        setResult(found);
      } else if (!isConfigPlaceholder && db) {
        // Simple mock search if Firestore is available but ID not in local
        // In a real scenario, we would use a proper query
        setError(t('noBookingFound'));
      } else {
        setError(t('noBookingFound'));
      }
    } catch (e) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const steps = getTrackingSteps(lang);

  return (
    <div className="pt-40 pb-40 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-black mb-6">{t('trackingTitle')}</h2>
        <p className="text-xl text-gray-400">{t('trackingSubtitle')}</p>
      </div>

      <div className="glass-card p-4 rounded-[2.5rem] border border-white/10 max-w-2xl mx-auto flex gap-4 mb-20">
        <input 
          value={bookingId} 
          onChange={e => setBookingId(e.target.value)} 
          placeholder={t('trackingPlaceholder')}
          className="flex-1 bg-transparent border-none outline-none px-6 py-4 font-black text-xl placeholder:text-gray-600"
        />
        <button onClick={handleTrack} disabled={loading} className="px-10 py-4 orange-gradient rounded-[1.5rem] text-black font-black flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <Search size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-card p-8 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-14 h-14 bg-[#ff9900]/10 rounded-2xl flex items-center justify-center text-[#ff9900]"><User size={24}/></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold tracking-tighter mb-1">{t('formName')}</p><p className="font-black">{result.fullName}</p></div>
              </div>
              <div className="glass-card p-8 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-14 h-14 bg-[#ff9900]/10 rounded-2xl flex items-center justify-center text-[#ff9900]"><Car size={24}/></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold tracking-tighter mb-1">{t('formCar')}</p><p className="font-black">{result.carModel}</p></div>
              </div>
              <div className="glass-card p-8 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-14 h-14 bg-[#ff9900]/10 rounded-2xl flex items-center justify-center text-[#ff9900]"><Clock size={24}/></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold tracking-tighter mb-1">{t('adminStatus')}</p><p className="font-black text-[#ff9900]">{steps[result.status]}</p></div>
              </div>
            </div>

            <div className="glass-card p-12 rounded-[3rem] border border-white/10">
              <div className="relative">
                <div className="absolute top-8 left-0 right-0 h-1 bg-white/5 rounded-full hidden md:block"></div>
                <div 
                  className="absolute top-8 left-0 right-0 h-1 bg-[#ff9900] rounded-full hidden md:block transition-all duration-1000"
                  style={{ width: `${(result.status / (steps.length - 1)) * 100}%` }}
                ></div>
                
                <div className="grid grid-cols-1 md:grid-cols-7 gap-10 relative z-10">
                  {steps.map((step, i) => (
                    <div key={i} className="flex flex-col items-center text-center group">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 mb-6 ${i <= result.status ? 'orange-gradient text-black neon-glow scale-110 shadow-lg' : 'bg-white/5 text-gray-600 border border-white/10'}`}>
                        {i < result.status ? <CheckCircle size={24} /> : i === result.status ? <Loader2 className="animate-spin" size={24} /> : <div className="text-xl font-black">{i + 1}</div>}
                      </div>
                      <p className={`text-[10px] uppercase font-black tracking-tight leading-tight ${i <= result.status ? 'text-white' : 'text-gray-600'}`}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <div className="text-center text-red-500 font-bold bg-red-500/10 p-6 rounded-3xl border border-red-500/20 max-w-md mx-auto">{error}</div>}
    </div>
  );
};

const AdminPortal = () => {
  const { t, lang } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = getTrackingSteps(lang);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@abu-almagd.com' && password === 'Atbara2024') {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError(t('loginError'));
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      setLoading(true);
      if (!isConfigPlaceholder && db) {
        const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Booking[];
          setBookings(docs);
          setLoading(false);
        });
        return unsubscribe;
      } else {
        setBookings(getLocalBookings());
        setLoading(false);
      }
    }
  }, [isLoggedIn]);

  const updateStatus = async (id: string, currentStatus: number) => {
    const nextStatus = Math.min(6, currentStatus + 1);
    try {
      if (!isConfigPlaceholder && db) {
        await updateDoc(doc(db, 'bookings', id), { status: nextStatus });
      } else {
        const updated = getLocalBookings().map(b => b.id === id ? { ...b, status: nextStatus } : b);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        setBookings(updated);
      }
      // Notify customer via WhatsApp
      const b = bookings.find(x => x.id === id);
      if (b) {
        const link = getStatusUpdateWhatsAppLink(b.phone, b.fullName, b.carModel, steps[currentStatus], steps[nextStatus], lang);
        window.open(link, '_blank');
      }
    } catch (e) {
      alert('Update failed');
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      if (!isConfigPlaceholder && db) {
        await deleteDoc(doc(db, 'bookings', id));
      } else {
        const filtered = getLocalBookings().filter(b => b.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        setBookings(filtered);
      }
    } catch (e) {
      alert('Delete failed');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 rounded-[3rem] border border-white/10 w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[#ff9900]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#ff9900]"><Lock size={40} /></div>
            <h2 className="text-3xl font-black">{t('loginTitle')}</h2>
            <p className="text-gray-500 text-sm mt-2">{t('loginSubtitle')}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{t('loginUser')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-[#ff9900]" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{t('loginPass')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-[#ff9900]" required />
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button type="submit" className="w-full py-4 orange-gradient rounded-2xl text-black font-black uppercase tracking-widest">{t('btnLogin')}</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-40 px-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-16">
        <div>
          <h2 className="text-4xl font-black">{t('adminTitle')}</h2>
          <p className="text-gray-500">{t('adminSubtitle')}</p>
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold hover:bg-red-500/20 transition-all">
          <LogOut size={20} /> {t('adminLogout')}
        </button>
      </div>

      <div className="glass-card rounded-[2.5rem] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 border-b border-white/5">
              <tr>
                <th className="px-8 py-6 text-left">{t('adminName')}</th>
                <th className="px-8 py-6 text-left">{t('formCar')}</th>
                <th className="px-8 py-6 text-left">{t('adminStatus')}</th>
                <th className="px-8 py-6 text-center">{t('adminActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#ff9900]" /></td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-gray-500">No bookings yet.</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#ff9900]/10 rounded-xl flex items-center justify-center text-[#ff9900] font-black">{b.fullName.charAt(0)}</div>
                        <div>
                          <p className="font-bold">{b.fullName}</p>
                          <p className="text-xs text-gray-500">{b.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold">{b.carModel}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-widest">{b.licensePlate}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[100px]">
                          <div className="h-full orange-gradient transition-all duration-700" style={{ width: `${(b.status / 6) * 100}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-[#ff9900] whitespace-nowrap">{steps[b.status]}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => updateStatus(b.id, b.status)}
                          className={`p-3 rounded-xl transition-all ${b.status < 6 ? 'bg-[#ff9900]/10 text-[#ff9900] hover:bg-[#ff9900]' : 'bg-green-500/10 text-green-500'}`}
                          title={t('adminUpdate')}
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => deleteBooking(b.id)}
                          className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Footer = ({ setActiveTab }: { setActiveTab: (t: string) => void }) => {
  const { t, lang } = useLanguage();
  return (
    <footer className="bg-black border-t border-white/5 pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-20 mb-24">
          <div className="col-span-2">
            <Logo onClick={() => setActiveTab('home')} />
            <p className="text-gray-500 mt-8 max-w-sm leading-relaxed">{t('heroSubtitle')}</p>
            <div className="flex gap-4 mt-10">
              <a href="#" className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-gray-400 hover:text-[#ff9900] hover:border-[#ff9900]/30 transition-all"><Facebook size={20} /></a>
              <a href="#" className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-gray-400 hover:text-[#ff9900] hover:border-[#ff9900]/30 transition-all"><Instagram size={20} /></a>
              <a href={MAPS_URL} target="_blank" className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-gray-400 hover:text-[#ff9900] hover:border-[#ff9900]/30 transition-all"><MapPin size={20} /></a>
            </div>
          </div>
          <div>
            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-[#ff9900] mb-8">{lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h5>
            <ul className="space-y-4">
              {['home', 'book', 'track', 'admin'].map((id) => (
                <li key={id}>
                  <button onClick={() => setActiveTab(id)} className="text-gray-400 hover:text-white font-bold transition-all text-sm">{t(`nav${id.charAt(0).toUpperCase() + id.slice(1)}`)}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-black uppercase tracking-[0.2em] text-[#ff9900] mb-8">{lang === 'ar' ? 'معلومات التواصل' : 'Contact Info'}</h5>
            <div className="space-y-6">
              <div className="flex gap-4">
                <MapPin className="text-[#ff9900] flex-shrink-0" size={18} />
                <p className="text-sm text-gray-400 leading-tight">{t('fullAddress')}</p>
              </div>
              <div className="flex gap-4">
                <Phone className="text-[#ff9900] flex-shrink-0" size={18} />
                <p className="text-sm text-gray-400 font-black tracking-widest">0124255855</p>
              </div>
              <div className="flex gap-4">
                <Clock className="text-[#ff9900] flex-shrink-0" size={18} />
                <p className="text-sm text-gray-400">{lang === 'ar' ? 'السبت - الخميس: 8ص - 8م' : 'Sat - Thu: 8AM - 8PM'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          <p>{t('copyright')}</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-all">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-all">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#ff9900] selection:text-black">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {activeTab === 'home' && <HomePage setActiveTab={setActiveTab} />}
            {activeTab === 'book' && <BookingPage />}
            {activeTab === 'track' && <TrackingPage />}
            {activeTab === 'admin' && <AdminPortal />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AIAssistant />
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
