import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Event, ThemeRegistration } from '../lib/database.types';
import EventDetail from './EventDetail';
import { createOrder } from '../lib/createOrder';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  Tag,
  X,
  CheckCircle,
  ChevronRight,
  Wallet,
  BookOpen
} from 'lucide-react';



const CATEGORIES = ['social', 'cultural', 'outdoor', 'food', 'wellness', 'tour', 'workshop'];
const CATEGORY_LABELS: Record<string, string> = {
  all: '全部', social: '订阅', cultural: '社交', outdoor: '户外',
  food: '美食', wellness: '健康', tour: '游览', workshop: '工作坊',
};

const CAT_COLORS: Record<string, string> = {
  social: 'bg-rose-100 text-rose-700',
  cultural: 'bg-amber-100 text-amber-700',
  outdoor: 'bg-emerald-100 text-emerald-700',
  food: 'bg-orange-100 text-orange-700',
  wellness: 'bg-teal-100 text-teal-700',
  tour: 'bg-sky-100 text-sky-700',
  workshop: 'bg-violet-100 text-violet-700',
};

const EVENT_IMGS: Record<string, string> = {
  social: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg',
  cultural: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg',
  outdoor: 'https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg',
  food: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
  wellness: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg',
  tour: 'https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg',
  workshop: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
};

const THEME_META: Record<string, { icon: string; tagline: string; description: string; accent: string; lightAccent: string; border: string; badgeBg: string; regBtn: string; regBtnActive: string; barColor: string }> = {
  social: {
    icon: '🎉', tagline: '结交新朋友，共享欢乐时光',
    description: '参加聚会、联谊沙龙和社区聚集活动，在轻松愉快的氛围中拓展社交圈，建立真诚的友谊。',
    accent: 'from-rose-500 to-pink-600', lightAccent: 'from-rose-50 to-pink-50',
    border: 'border-rose-200', badgeBg: 'bg-rose-500',
    regBtn: 'bg-rose-500 hover:bg-rose-600', regBtnActive: 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100', barColor: 'bg-rose-500',
  },
  cultural: {
    icon: '🏛️', tagline: '探索艺术、历史与文化遗产',
    description: '走进博物馆、画廊、历史古迹和传统节庆，感受人类文明的智慧与创造力。',
    accent: 'from-amber-500 to-yellow-600', lightAccent: 'from-amber-50 to-yellow-50',
    border: 'border-amber-200', badgeBg: 'bg-amber-500',
    regBtn: 'bg-amber-500 hover:bg-amber-600', regBtnActive: 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100', barColor: 'bg-amber-500',
  },
  outdoor: {
    icon: '🌿', tagline: '亲近自然，感受户外的魅力',
    description: '徒步、骑行、赏花观鸟……每一次户外活动都是与大自然的亲密对话，在山水间找回内心的宁静。',
    accent: 'from-emerald-500 to-green-600', lightAccent: 'from-emerald-50 to-green-50',
    border: 'border-emerald-200', badgeBg: 'bg-emerald-500',
    regBtn: 'bg-emerald-600 hover:bg-emerald-700', regBtnActive: 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100', barColor: 'bg-emerald-500',
  },
  food: {
    icon: '🍜', tagline: '品味美食，发现舌尖上的惊喜',
    description: '从地道街边小吃到精致料理，一起探访餐厅、参加美食节、学习厨艺，用味觉丈量城市的温度。',
    accent: 'from-orange-500 to-red-500', lightAccent: 'from-orange-50 to-red-50',
    border: 'border-orange-200', badgeBg: 'bg-orange-500',
    regBtn: 'bg-orange-500 hover:bg-orange-600', regBtnActive: 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100', barColor: 'bg-orange-500',
  },
  wellness: {
    icon: '🧘', tagline: '关注身心，活出健康好状态',
    description: '瑜伽、冥想、太极、健康讲座……以温和的节奏照顾身体与心灵，在社群支持中找到平衡与活力。',
    accent: 'from-teal-500 to-cyan-600', lightAccent: 'from-teal-50 to-cyan-50',
    border: 'border-teal-200', badgeBg: 'bg-teal-500',
    regBtn: 'bg-teal-600 hover:bg-teal-700', regBtnActive: 'bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-100', barColor: 'bg-teal-500',
  },
  tour: {
    icon: '🗺️', tagline: '跟着导游，发现城市的秘密',
    description: '有人文底蕴的城市徒步、景区深度游、主题参观……每一次游览都是一堂生动有趣的课。',
    accent: 'from-sky-500 to-blue-600', lightAccent: 'from-sky-50 to-blue-50',
    border: 'border-sky-200', badgeBg: 'bg-sky-500',
    regBtn: 'bg-sky-600 hover:bg-sky-700', regBtnActive: 'bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100', barColor: 'bg-sky-500',
  },
  workshop: {
    icon: '🎨', tagline: '动手学习，激发创造力',
    description: '手工艺、绘画、书法、摄影……在工作坊中用双手创造美好，结识志同道合的伙伴，让每天都充实而有趣。',
    accent: 'from-violet-500 to-purple-600', lightAccent: 'from-violet-50 to-purple-50',
    border: 'border-violet-200', badgeBg: 'bg-violet-500',
    regBtn: 'bg-violet-600 hover:bg-violet-700', regBtnActive: 'bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100', barColor: 'bg-violet-500',
  },
};

const toThemeId = (cat: string) => `event-cat:${cat}`;

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myAttendance, setMyAttendance] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState('all');
  const [tab, setTab] = useState<'themes' | 'events'>('themes');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', event_date: '', event_time: '', max_attendees: '', category: 'social', image_url: '', fee: '' });
  const [submitting, setSubmitting] = useState(false);

  // Theme registration state
  const [registrations, setRegistrations] = useState<ThemeRegistration[]>([]);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [regLoading, setRegLoading] = useState<Record<string, boolean>>({});
  const [showRegModal, setShowRegModal] = useState(false);
  const [regCat, setRegCat] = useState<string | null>(null);
  const [regNote, setRegNote] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => { loadEvents(); loadRegistrations(); }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    const [evRes, attRes] = await Promise.all([
      supabase.from('events').select('*, profiles(full_name, avatar_url), event_attendees(id, user_id)').order('event_date', { ascending: true }),
      user ? supabase.from('event_attendees').select('event_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ]);
    if (evRes.data) setEvents(evRes.data as Event[]);
    if (attRes.data) setMyAttendance(new Set(attRes.data.map((a: { event_id: string }) => a.event_id)));
    setLoading(false);
  };

  const loadRegistrations = async () => {
    const themeIds = CATEGORIES.map(toThemeId);
    const [myRegs, counts] = await Promise.all([
      user
        ? supabase.from('theme_registrations').select('*').eq('user_id', user.id).in('theme_id', themeIds)
        : Promise.resolve({ data: [] }),
      supabase.from('theme_registrations').select('theme_id').in('theme_id', themeIds),
    ]);
    if (myRegs.data) setRegistrations(myRegs.data as ThemeRegistration[]);
    if (counts.data) {
      const map: Record<string, number> = {};
      (counts.data as { theme_id: string }[]).forEach(r => { map[r.theme_id] = (map[r.theme_id] || 0) + 1; });
      setRegCounts(map);
    }
  };

  const isRegistered = (cat: string) => registrations.some(r => r.theme_id === toThemeId(cat));

  const handleRegister = async () => {
    if (!user || !regCat) return;
    setRegLoading(l => ({ ...l, [regCat]: true }));
    await supabase.from('theme_registrations').insert({ user_id: user.id, theme_id: toThemeId(regCat), note: regNote });
    await loadRegistrations();
    setRegLoading(l => ({ ...l, [regCat]: false }));
    setShowRegModal(false);
  };

  const handleUnregister = async (cat: string) => {
    if (!user) return;
    setRegLoading(l => ({ ...l, [cat]: true }));
    await supabase.from('theme_registrations').delete().eq('user_id', user.id).eq('theme_id', toThemeId(cat));
    await loadRegistrations();
    setRegLoading(l => ({ ...l, [cat]: false }));
  };

  const toggleAttend = async (event: Event) => {
    if (!user) return;
    const attending = myAttendance.has(event.id);
    if (attending) {
      await supabase.from('event_attendees').delete().eq('event_id', event.id).eq('user_id', user.id);
      setMyAttendance(prev => { const s = new Set(prev); s.delete(event.id); return s; });
    } else {
      await supabase.from('event_attendees').insert({
        event_id: event.id, user_id: user.id,
        payment_status: event.fee != null && event.fee > 0 ? 'pending_payment' : 'paid',
      });
      if (event.fee != null && event.fee > 0) {
        await createOrder({
          userId: user.id,
          title: event.title,
          amount: event.fee,
          description: `活动报名 · ${event.location} · ${event.event_date}`,
          image_url: event.image_url,
        });
      }
      setMyAttendance(prev => new Set([...prev, event.id]));
    }
    await loadEvents();
  };

  const submitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    await supabase.from('events').insert({
      user_id: user.id, title: form.title, description: form.description,
      location: form.location, event_date: form.event_date, event_time: form.event_time,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      category: form.category, image_url: form.image_url || null,
      fee: form.fee ? parseFloat(form.fee) : null,
    });
    setForm({ title: '', description: '', location: '', event_date: '', event_time: '', max_attendees: '', category: 'social', image_url: '', fee: '' });
    setShowForm(false);
    await loadEvents();
    setSubmitting(false);
  };

  const filtered = activeCategory === 'all' ? events : events.filter(e => e.category === activeCategory);
  const upcoming = filtered.filter(e => new Date(e.event_date) >= new Date());
  const past = filtered.filter(e => new Date(e.event_date) < new Date());

  // const HERO_IMAGE = 'src/images/event_top.jpg';
  // 封装一个动态获取本地图片的函数
  const getImageUrl = (name: string) => {
    return new URL(`../images/${name}`, import.meta.url).href;
  };

  return (
    <div className="pb-24">

      {/* Hero — warm sunset image with brown overlay */}
      <section className="relative h-[260px] overflow-hidden">
        <img src={getImageUrl('event_top.jpg')} alt="人生记忆" className="absolute inset-0 h-full w-full object-cover" />
        {/*<div className="absolute inset-0 bg-gradient-to-b from-[#3b2b25]/60 via-[#5e4030]/35 to-[#4c3327]/85" />*/}
        <div className="relative z-10 px-6 pt-9 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/15 backdrop-blur-sm">
              <BookOpen className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <div>
              <p className="font-serif text-xl font-bold tracking-[0.16em]">伴龄</p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/80">BANLING</p>
            </div>
          </div>
          <h1 className="mt-7 font-serif text-[27px] font-bold leading-tight tracking-wide">同城活动</h1>
          <p className="mt-2 text-sm tracking-wide text-white/90">参与有趣的活动，遇见更好的自己</p>
          <div className="mt-5 h-0.5 w-10 bg-[#f5d6a1]" />
        </div>
      </section>

      {/* Floating cream card overlapping hero */}
      <section className="relative z-20 -mt-6 px-4">
        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          <button onClick={() => setTab('themes')} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === 'themes' ? 'bg-white text-rose-600 shadow-sm' : 'text-oshiruco-400 hover:text-oshiruco-600'}`}>
            活动主题
          </button>
          <button onClick={() => setTab('events')} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === 'events' ? 'bg-white text-rose-600 shadow-sm' : 'text-oshiruco-400 hover:text-oshiruco-600'}`}>
            全部活动
          </button>
        </div>

      </section>

      {/*<div className="relative px-6 pt-8 pb-6 overflow-hidden">*/}
      {/*  <img*/}
      {/*    src="https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?w=800"*/}
      {/*    alt=""*/}
      {/*    className="absolute inset-0 w-full h-full object-cover"*/}
      {/*  />*/}
      {/*  <div className="absolute inset-0 bg-gradient-to-r from-rose-800/80 via-rose-700/60 to-pink-700/50" />*/}
      {/*  <div className="relative">*/}
      {/*    <h1 className="text-2xl font-bold text-white mb-1">活动</h1>*/}
      {/*    <p className="text-white/90 text-sm">参加聚会，留下美好回忆</p>*/}
      {/*  </div>*/}
      {/*</div>*/}

      <div className="px-4 mt-4">
        {/* Tab switcher */}
        {/*<div className="flex bg-gray-100 rounded-xl p-1 mb-5">*/}
        {/*  <button onClick={() => setTab('themes')} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === 'themes' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>*/}
        {/*    活动主题*/}
        {/*  </button>*/}
        {/*  <button onClick={() => setTab('events')} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === 'events' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>*/}
        {/*    全部活动*/}
        {/*  </button>*/}
        {/*</div>*/}

        {/* ── THEMES TAB ── */}
        {tab === 'themes' && (
          <div className="space-y-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">选择感兴趣的活动主题</p>

            {CATEGORIES.map(cat => {
              const meta = THEME_META[cat];
              const registered = isRegistered(cat);
              const count = regCounts[toThemeId(cat)] || 0;
              const busy = regLoading[cat];
              const catEvents = events.filter(e => e.category === cat && new Date(e.event_date) >= new Date());

              return (
                <div key={cat} className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${meta.border}`}>
                  <div className="relative h-40">
                    <img src={EVENT_IMGS[cat]} alt={CATEGORY_LABELS[cat]} className="w-full h-full object-cover" />
                    {/*<div className={`absolute inset-0 bg-gradient-to-br ${meta.accent} opacity-55`} />*/}
                    {/*<div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />*/}
                    <div className={`absolute top-4 left-4 w-11 h-11 rounded-2xl ${meta.badgeBg} flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/30`}>
                      {meta.icon}
                    </div>
                    <div className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full ${CAT_COLORS[cat]}`}>
                      {catEvents.length} 场即将举行
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-extrabold text-xl drop-shadow">{CATEGORY_LABELS[cat]}</h3>
                      <p className="text-white/85 text-xs mt-0.5 font-medium">{meta.tagline}</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{meta.description}</p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        <span><span className="font-semibold text-gray-700">{count}</span> 人已订阅</span>
                      </div>
                      {registered && (
                        <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />已订阅
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/*{registered ? (*/}
                      {/*  <button*/}
                      {/*    onClick={() => handleUnregister(cat)}*/}
                      {/*    disabled={busy}*/}
                      {/*    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${meta.regBtnActive} disabled:opacity-50`}*/}
                      {/*  >*/}
                      {/*    {busy ? '处理中…' : '取消订阅'}*/}
                      {/*  </button>*/}
                      {/*) : (*/}
                      {/*  <button*/}
                      {/*    onClick={() => openRegModal(cat)}*/}
                      {/*    disabled={busy}*/}
                      {/*    className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity ${meta.regBtn} disabled:opacity-50`}*/}
                      {/*  >*/}
                      {/*    {busy ? '处理中…' : '订阅主题'}*/}
                      {/*  </button>*/}
                      {/*)}*/}
                      <button
                        onClick={() => { setActiveCategory(cat); setTab('events'); }}
                        className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r ${meta.accent} flex items-center justify-center gap-1.5 shadow hover:opacity-90 transition-opacity`}
                      >
                        <Calendar className="w-4 h-4" />
                        查看活动
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Popularity chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-2">
              <p className="text-sm font-bold text-gray-800 mb-4">主题热度排行</p>
              <div className="space-y-4">
                {CATEGORIES.map((cat, i) => {
                  const count = regCounts[toThemeId(cat)] || 0;
                  const maxCount = Math.max(...CATEGORIES.map(c => regCounts[toThemeId(c)] || 0), 1);
                  const pct = Math.round((count / maxCount) * 100) || 8;
                  const catEventCount = events.filter(e => e.category === cat).length;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-base w-7 text-center">{THEME_META[cat].icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{CATEGORY_LABELS[cat]}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 flex items-center gap-0.5"><Users className="w-3 h-3" />{count}</span>
                            <span className="text-xs text-gray-400 flex items-center gap-0.5"><Calendar className="w-3 h-3" />{catEventCount} 场</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${THEME_META[cat].barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── EVENTS TAB ── */}
        {tab === 'events' && (
          <>
            <button onClick={() => setShowForm(true)} className="w-full mb-5 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-sm">
              <Plus className="w-5 h-5" /> 发布活动
            </button>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              {['all', ...CATEGORIES].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-rose-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-300'}`}>
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <>
                    <h2 className="text-base font-bold text-gray-900 mb-3">即将举行的活动</h2>
                    <div className="space-y-4 mb-6">
                      {upcoming.map(event => <EventCard key={event.id} event={event} attending={myAttendance.has(event.id)} onToggle={() => toggleAttend(event)} onOpen={() => setSelectedEvent(event)} isOwner={event.user_id === user?.id} />)}
                    </div>
                  </>
                )}
                {past.length > 0 && (
                  <>
                    <h2 className="text-base font-bold text-gray-500 mb-3">往期活动</h2>
                    <div className="space-y-4 mb-6 opacity-70">
                      {past.map(event => <EventCard key={event.id} event={event} attending={myAttendance.has(event.id)} onToggle={() => {}} onOpen={() => setSelectedEvent(event)} isOwner={event.user_id === user?.id} isPast />)}
                    </div>
                  </>
                )}
                {upcoming.length === 0 && past.length === 0 && (
                  <div className="text-center py-16 text-gray-400">
                    <Calendar className="w-14 h-14 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-gray-600">暂无活动</p>
                    <p className="text-sm mt-1">发布第一个社区活动吧！</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Registration modal */}
      {showRegModal && regCat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">订阅活动主题</h3>
              <button onClick={() => setShowRegModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className={`flex items-center gap-3 mb-5 px-3 py-3 rounded-xl border ${THEME_META[regCat].border} bg-gradient-to-r ${THEME_META[regCat].lightAccent}`}>
              <span className="text-2xl">{THEME_META[regCat].icon}</span>
              <div>
                <p className="font-semibold text-gray-800">{CATEGORY_LABELS[regCat]}</p>
                <p className="text-xs text-gray-500">{THEME_META[regCat].tagline}</p>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">备注（选填）</label>
            <textarea
              value={regNote}
              onChange={e => setRegNote(e.target.value)}
              placeholder="例如：偏好周末下午的活动，希望有中文讲解…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm resize-none mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRegModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm">取消</button>
              <button
                onClick={handleRegister}
                disabled={regLoading[regCat]}
                className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm ${THEME_META[regCat].regBtn} disabled:opacity-60`}
              >
                {regLoading[regCat] ? '提交中…' : '确认订阅'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create event modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">发布活动</h3>
              <button onClick={() => setShowForm(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={submitEvent} className="space-y-4">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="活动标题 *" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm" required />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="活动简介..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm resize-none" />
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="活动地点 *" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm" required />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">日期 *</label>
                  <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">时间</label>
                  <input type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">活动类别</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">最多参与人数</label>
                  <input type="number" value={form.max_attendees} onChange={e => setForm({ ...form, max_attendees: e.target.value })} placeholder="不限" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">每人费用（元）</label>
                <input type="number" step="0.01" min="0" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} placeholder="免费则不填" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm" />
              </div>
              <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="图片链接（可选）" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 outline-none text-sm" />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm">取消</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-medium text-sm disabled:opacity-60">发布活动</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          attending={myAttendance.has(selectedEvent.id)}
          onToggle={() => toggleAttend(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

function EventCard({ event, attending, onToggle, onOpen, isOwner, isPast }: { event: Event; attending: boolean; onToggle: () => void; onOpen: () => void; isOwner: boolean; isPast?: boolean }) {
  const imgUrl = event.image_url || EVENT_IMGS[event.category] || EVENT_IMGS.social;
  const attendeeCount = event.event_attendees?.length || 0;
  const isFull = event.max_attendees !== null && attendeeCount >= event.max_attendees;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="relative h-36 cursor-pointer" onClick={onOpen}>
        <img src={imgUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${CAT_COLORS[event.category] || 'bg-gray-100 text-gray-600'}`}>
          <Tag className="w-3 h-3 inline mr-1" />{CATEGORY_LABELS[event.category] || event.category}
        </span>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-base drop-shadow">{event.title}</h3>
        </div>
        <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="p-4">
        <button className="text-left w-full" onClick={onOpen}>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(event.event_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
            {event.event_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{event.event_time}</span>}
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{attendeeCount}{event.max_attendees ? `/${event.max_attendees}` : ''} 人参加</span>
            {event.fee != null && <span className="flex items-center gap-1 text-amber-600 font-medium"><Wallet className="w-3.5 h-3.5" />¥{event.fee.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}/人</span>}
          </div>
          {event.description && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{event.description}</p>}
          {(event.profiles as Profile | undefined) && <p className="text-xs text-gray-400 mb-3">主办方：{(event.profiles as Profile | undefined)!.full_name}</p>}
        </button>
        {!isPast && !isOwner && (
          <button onClick={onToggle} disabled={isFull && !attending} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${attending ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : isFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-rose-500 text-white hover:bg-rose-600'}`}>
            {attending ? (<span className="flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" />已报名 — 点击取消</span>) : isFull ? '名额已满' : '立即报名'}
          </button>
        )}
        {isOwner && <p className="text-xs text-center text-gray-400 font-medium">您是本活动的主办方</p>}
      </div>
    </div>
  );
}

interface Profile { full_name: string; avatar_url: string | null; }
