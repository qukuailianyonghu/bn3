import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Trip, ThemeRegistration } from '../lib/database.types';
import {
  Plane,
  Plus,
  Calendar,
  MapPin,
  Globe,
  Lock,
  Clock,
  CheckCircle2,
  X,
  Star,
  ChevronRight,
  Users,
  ArrowRight,
  Wallet,
  BookOpen
} from 'lucide-react';
import ThemeDetail, { type TravelTheme } from './ThemeDetail';
import TripDetail from './TripDetail';
import { createOrder } from '../lib/createOrder';

const STATUS_CONFIG = {
  pending_payment: { label: '待付款', icon: Wallet, color: 'bg-amber-100 text-amber-700' },
  planning: { label: '等管家联系', icon: Clock, color: 'bg-oshiruco-100 text-oshiruco-700' },
  active: { label: '进行中', icon: Plane, color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: '已完成', icon: CheckCircle2, color: 'bg-gray-100 text-gray-500' },
};

const TRAVEL_THEMES = [
  {
    id: 'red',
    name: '红色旅游',
    tagline: '爱国之旅与历史文化遗产',
    description: '追寻历史的足迹，参观革命圣地、国家纪念碑和塑造现代世界的历史地标——从壮观的战争纪念馆到历史名城。',
    image: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg',
    images: [
      'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg',
      'https://images.pexels.com/photos/14615853/pexels-photo-14615853.jpeg',
      'https://images.pexels.com/photos/34648628/pexels-photo-34648628.jpeg',
      'https://images.pexels.com/photos/34648631/pexels-photo-34648631.jpeg',
    ],
    price: 3999,
    accent: 'from-red-700 to-rose-800',
    lightAccent: 'from-red-50 to-rose-50',
    border: 'border-oshiruco-200',
    badgeBg: 'bg-red-600',
    badge: 'bg-red-100 text-red-700',
    barColor: 'bg-red-500',
    regBtn: 'bg-red-600 hover:bg-red-700',
    regBtnActive: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    destinations: ['北京', '莫斯科', '华盛顿特区', '诺曼底', '葛底斯堡'],
    icon: '🏛️',
    rating: 4.9,
    reviewCount: 3241,
  },
  {
    id: 'euro-america',
    name: '欧美旅游',
    tagline: '横跨两大洲的经典地标之旅',
    description: '标志性城市、世界级博物馆，以及从旧世界的鹅卵石街道到新世界璀璨天际线的数百年文化积淀。',
    image: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
    images: [
      'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
      'https://images.pexels.com/photos/33072396/pexels-photo-33072396.jpeg',
      'https://images.pexels.com/photos/30379456/pexels-photo-30379456.jpeg',
      'https://images.pexels.com/photos/29731407/pexels-photo-29731407.jpeg',
    ],
    price: 12800,
    accent: 'from-sky-600 to-blue-700',
    lightAccent: 'from-sky-50 to-blue-50',
    border: 'border-oshiruco-200',
    badgeBg: 'bg-sky-600',
    badge: 'bg-sky-100 text-sky-700',
    barColor: 'bg-sky-500',
    regBtn: 'bg-sky-600 hover:bg-sky-700',
    regBtnActive: 'bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100',
    destinations: ['巴黎', '罗马', '伦敦', '纽约', '巴塞罗那'],
    icon: '🗼',
    rating: 4.8,
    reviewCount: 5102,
  },
  {
    id: 'romantic',
    name: '浪漫旅游',
    tagline: '在美丽之地共度珍贵时光',
    description: '阳光明媚的露台、烛光晚餐和令人心醉的美景——为情侣、纪念日旅行以及所有相信旅行应该共同分享的人而设。',
    image: 'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg',
    images: [
      'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg',
      'https://images.pexels.com/photos/30747571/pexels-photo-30747571.jpeg',
      'https://images.pexels.com/photos/34260949/pexels-photo-34260949.jpeg',
      'https://images.pexels.com/photos/5785062/pexels-photo-5785062.jpeg',
    ],
    price: 8688,
    accent: 'from-pink-500 to-rose-600',
    lightAccent: 'from-pink-50 to-rose-50',
    border: 'border-oshiruco-200',
    badgeBg: 'bg-pink-500',
    badge: 'bg-pink-100 text-pink-700',
    barColor: 'bg-pink-500',
    regBtn: 'bg-pink-500 hover:bg-pink-600',
    regBtnActive: 'bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100',
    destinations: ['圣托里尼', '威尼斯', '京都', '马尔代夫', '阿马尔菲海岸'],
    icon: '🌹',
    rating: 4.8,
    reviewCount: 4876,
  },
  {
    id: 'sweet',
    name: '休闲美食游',
    tagline: '惬意的美食与悠闲度假之旅',
    description: "品味当地风味、漫步温柔乡村、探访迷人集市，享受一个完全不慌不忙的悠然时光。生命中最甜蜜的时刻，往往在慢下来的时候出现。",
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    images: [
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      'https://images.pexels.com/photos/11168313/pexels-photo-11168313.jpeg',
      'https://images.pexels.com/photos/19126505/pexels-photo-19126505.jpeg',
      'https://images.pexels.com/photos/35573664/pexels-photo-35573664.jpeg',
    ],
    price: 5280,
    accent: 'from-oshiruco-500 to-oshiruco-600',
    lightAccent: 'from-oshiruco-50 to-oshiruco-100',
    border: 'border-oshiruco-200',
    badgeBg: 'bg-oshiruco-500',
    badge: 'bg-oshiruco-100 text-oshiruco-700',
    barColor: 'bg-oshiruco-500',
    regBtn: 'bg-oshiruco-500 hover:bg-oshiruco-600',
    regBtnActive: 'bg-oshiruco-50 text-oshiruco-600 border border-oshiruco-200 hover:bg-oshiruco-100',
    destinations: ['托斯卡纳', '普罗旺斯', '哥本哈根', '维也纳', '里斯本'],
    icon: '🍰',
    rating: 4.7,
    reviewCount: 2934,
  },
];

export default function Travel() {
  const { user } = useAuth();
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [communityTrips, setCommunityTrips] = useState<Trip[]>([]);
  const [tab, setTab] = useState<'themes' | 'my' | 'community'>('themes');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<typeof TRAVEL_THEMES[0] | null>(null);
  const [form, setForm] = useState({ title: '', destination: '', description: '', start_date: '', end_date: '', status: 'planning', is_public: true });
  const [submitting, setSubmitting] = useState(false);

  const [registrations, setRegistrations] = useState<ThemeRegistration[]>([]);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [regLoading, setRegLoading] = useState<Record<string, boolean>>({});
  const [showRegModal, setShowRegModal] = useState(false);
  const [regTheme, setRegTheme] = useState<typeof TRAVEL_THEMES[0] | null>(null);
  const [regNote, setRegNote] = useState('');
  const [detailTheme, setDetailTheme] = useState<TravelTheme | null>(null);
  const [detailTrip, setDetailTrip] = useState<Trip | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { loadTrips(); loadRegistrations(); }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadTrips = async (): Promise<Trip[]> => {
    setLoading(true);
    const [mine, community] = await Promise.all([
      user ? supabase.from('trips').select('*, profiles(full_name, avatar_url)').eq('user_id', user.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
      supabase.from('trips').select('*, profiles(full_name, avatar_url)').eq('is_public', true).order('created_at', { ascending: false }).limit(30),
    ]);
    const myTripList = (mine.data as Trip[]) ?? [];
    if (mine.data) setMyTrips(myTripList);
    if (community.data) setCommunityTrips((community.data as Trip[]).filter(t => t.user_id !== user?.id));
    setLoading(false);
    return myTripList;
  };

  const loadRegistrations = async () => {
    const [myRegs, counts] = await Promise.all([
      user ? supabase.from('theme_registrations').select('*').eq('user_id', user.id) : Promise.resolve({ data: [] }),
      supabase.from('theme_registrations').select('theme_id'),
    ]);
    if (myRegs.data) setRegistrations(myRegs.data as ThemeRegistration[]);
    if (counts.data) {
      const countMap: Record<string, number> = {};
      (counts.data as { theme_id: string }[]).forEach(r => { countMap[r.theme_id] = (countMap[r.theme_id] || 0) + 1; });
      setRegCounts(countMap);
    }
  };

  const isRegistered = (themeId: string) => registrations.some(r => r.theme_id === themeId);
  const openRegModal = (theme: typeof TRAVEL_THEMES[0]) => { setRegTheme(theme); setRegNote(''); setShowRegModal(true); };

  const handleRegister = async () => {
    if (!user || !regTheme) return;
    setRegLoading(l => ({ ...l, [regTheme.id]: true }));
    await supabase.from('theme_registrations').insert({ user_id: user.id, theme_id: regTheme.id, note: regNote });
    await supabase.from('trips').insert({
      user_id: user.id, title: `${regTheme.name}之旅`, destination: regTheme.destinations[0] || regTheme.name,
      description: regNote ? `${regTheme.tagline}（${regNote}）` : `${regTheme.tagline} —— 报名主题后自动生成的行程，可在「我的行程」中编辑详情。`,
      status: 'planning', is_public: false,
    });
    await createOrder({
      userId: user.id,
      title: `${regTheme.name}之旅`,
      amount: regTheme.price,
      description: `${regTheme.tagline} —— ${regNote || '主题旅游报名'}`,
      image_url: regTheme.image,
    });
    await loadRegistrations(); await loadTrips();
    setRegLoading(l => ({ ...l, [regTheme.id]: false }));
    setShowRegModal(false); setTab('my');
    setToast(`已报名「${regTheme.name}」，已为您生成行程`);
  };

  const handleUnregister = async (themeId: string) => {
    if (!user) return;
    setRegLoading(l => ({ ...l, [themeId]: true }));
    await supabase.from('theme_registrations').delete().eq('user_id', user.id).eq('theme_id', themeId);
    await loadRegistrations();
    setRegLoading(l => ({ ...l, [themeId]: false }));
  };

  const openThemeForm = (theme: typeof TRAVEL_THEMES[0]) => {
    setSelectedTheme(theme);
    setForm(f => ({ ...f, description: `${theme.name} — ${theme.tagline}` }));
    setShowForm(true); setTab('my');
  };

  const submitTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    await supabase.from('trips').insert({
      user_id: user.id, title: form.title, destination: form.destination, description: form.description,
      start_date: form.start_date || null, end_date: form.end_date || null, status: form.status as Trip['status'], is_public: form.is_public,
    });
    setForm({ title: '', destination: '', description: '', start_date: '', end_date: '', status: 'planning', is_public: true });
    setShowForm(false); setSelectedTheme(null); await loadTrips(); setSubmitting(false);
  };

  const trips = tab === 'my' ? myTrips : myTrips;

  const getImageUrl = (name: string) => {
    return new URL(`../images/${name}`, import.meta.url).href;
  };

  return (
    <div className="pb-24">
      {/* Hero — warm sunset image with brown overlay */}
      <section className="relative h-[260px] overflow-hidden">
        <img src={getImageUrl('travel_top2.jpg')} alt="人生记忆" className="absolute inset-0 h-full w-full object-cover" />
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
          <h1 className="mt-7 font-serif text-[27px] font-bold leading-tight tracking-wide">与更好的风景相遇</h1>
          <p className="mt-2 text-sm tracking-wide text-white/90">人生下半场，让旅行更有意义</p>
          <div className="mt-5 h-0.5 w-10 bg-[#f5d6a1]" />
        </div>
      </section>

      {/* Floating cream card overlapping hero */}
      <section className="relative z-20 -mt-6 px-4">
        {/* Tab switcher */}
        {/* Tab switcher */}
        <div className="flex bg-oshiruco-100 rounded-xl p-1 mb-5">
          {(['themes', 'my'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === t ? 'bg-white text-oshiruco-700 shadow-sm' : 'text-oshiruco-400 hover:text-oshiruco-600'}`}>
                {t === 'themes' ? '旅行主题' : '我的行程' }
              </button>
          ))}
        </div>

      </section>



      <div className="px-4 mt-4">
        {tab === 'themes' && (
          <div className="space-y-5">
            {/*<p className="text-xs font-semibold text-oshiruco-500 uppercase tracking-widest">おすすめ旅行テーマ</p>*/}

            {TRAVEL_THEMES.map(theme => {
              const registered = isRegistered(theme.id);
              const count = regCounts[theme.id] || 0;
              const busy = regLoading[theme.id];
              return (
                <div key={theme.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${theme.border} active:scale-[0.99] transition-transform`}>
                  <div className="relative h-48">
                    <img src={theme.image} alt={theme.name} className="w-full h-full object-cover" />
                    {/*<div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} opacity-55`} />*/}
                    {/*<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />*/}
                    {/*<div className={`absolute top-4 left-4 w-12 h-12 rounded-2xl ${theme.badgeBg} flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/30`}>{theme.icon}</div>*/}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow">
                        <Star className="w-3 h-3 text-amber-400 fill-current" />
                        <span className="text-xs font-bold text-gray-800">{theme.rating}</span>
                        <span className="text-xs text-gray-500">({theme.reviewCount.toLocaleString()})</span>
                      </div>
                      <div className="bg-amber-500/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow">
                        <Wallet className="w-3 h-3 text-white" />
                        <span className="text-xs font-bold text-white">¥{theme.price.toLocaleString('zh-CN')}</span>
                        <span className="text-[10px] text-white/80">/人起</span>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-serif font-extrabold text-xl leading-tight drop-shadow">{theme.name}</h3>
                      <p className="text-white/85 text-xs mt-0.5 font-medium">{theme.tagline}</p>
                      {/*<button onClick={() => setDetailTheme(theme)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white/30 transition">*/}
                      {/*  查看主题详情 <ArrowRight className="w-3 h-3" />*/}
                      {/*</button>*/}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-oshiruco-700 leading-relaxed mb-4">{theme.description}</p>
                    <button onClick={() => setDetailTheme(theme)} className={`w-full mb-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 bg-gradient-to-r ${theme.lightAccent} ${theme.badge} hover:opacity-80 transition`}>
                      查看主题详情 <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-xs font-semibold text-oshiruco-500 uppercase tracking-wide mb-2">热门目的地</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {theme.destinations.map(dest => (
                        <span key={dest} className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 ${theme.badge}`}>
                          <MapPin className="w-3 h-3 flex-shrink-0" />{dest}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-oshiruco-500">
                        <Users className="w-3.5 h-3.5" />
                        <span><span className="font-semibold text-oshiruco-700">{count}</span> 人已报名</span>
                      </div>
                      {registered && (
                        <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />已报名
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {registered ? (
                        <button onClick={() => handleUnregister(theme.id)} disabled={busy}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${theme.regBtnActive} disabled:opacity-50`}>
                          {busy ? '处理中…' : '取消报名'}
                        </button>
                      ) : (
                        <button onClick={() => openRegModal(theme)} disabled={busy}
                          className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity ${theme.regBtn} disabled:opacity-50`}>
                          {busy ? '处理中…' : '立即报名'}
                        </button>
                      )}
                      {/*<button onClick={() => openThemeForm(theme)}*/}
                      {/*  className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r ${theme.accent} flex items-center justify-center gap-1.5 shadow hover:opacity-90 transition-opacity`}>*/}
                      {/*  <Plane className="w-4 h-4" /> 规划行程 <ChevronRight className="w-4 h-4" />*/}
                      {/*</button>*/}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Popularity chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-oshiruco-100 mt-2">
              {/*<p className="font-serif text-sm font-bold text-oshiruco-800 mb-4">テーマ人気ランキング</p>*/}
              <div className="space-y-4">
                {TRAVEL_THEMES.map(theme => {
                  const pct = Math.round((theme.reviewCount / TRAVEL_THEMES[1].reviewCount) * 100);
                  return (
                    <div key={theme.id} className="flex items-center gap-3">
                      <span className="text-base w-7 text-center">{theme.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-oshiruco-700">{theme.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-oshiruco-400 flex items-center gap-0.5"><Users className="w-3 h-3" />{regCounts[theme.id] || 0}</span>
                            <div className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-current" /><span className="text-xs font-semibold text-oshiruco-600">{theme.rating}</span></div>
                          </div>
                        </div>
                        <div className="h-2 bg-oshiruco-100 rounded-full overflow-hidden">
                          <div className={`h-full ${theme.barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-oshiruco-400 mt-0.5">{theme.reviewCount.toLocaleString()} 位旅行者</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(tab === 'my' || tab === 'community') && (
          <>
            {/*{tab === 'my' && (*/}
            {/*  <button onClick={() => setShowForm(true)} className="w-full mb-5 bg-gradient-to-r from-oshiruco-500 to-oshiruco-600 hover:from-oshiruco-600 hover:to-oshiruco-700 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-oshiruco-500/20">*/}
            {/*    <Plus className="w-5 h-5" /> 规划新行程*/}
            {/*  </button>*/}
            {/*)}*/}

            {loading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-oshiruco-100 rounded-2xl animate-pulse" />)}</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-16 text-oshiruco-400">
                <Plane className="w-14 h-14 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-oshiruco-600">{tab === 'my' ? '暂无行程计划' : '暂无社区行程'}</p>
                <p className="text-sm mt-1">{tab === 'my' ? '浏览主题获取灵感！' : '成为第一个分享行程的人！'}</p>
                {tab === 'my' && (
                  <button onClick={() => setTab('themes')} className="mt-4 text-oshiruco-600 font-semibold text-sm bg-oshiruco-100 px-5 py-2.5 rounded-full hover:bg-oshiruco-200 transition">探索主题</button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {trips.map(trip => {
                  const statusConf = STATUS_CONFIG[trip.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planning;
                  const StatusIcon = statusConf.icon;
                  const clickable = tab === 'my';
                  return (
                    <div key={trip.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-oshiruco-100 ${clickable ? 'cursor-pointer hover:shadow-md hover:border-oshiruco-200 active:scale-[0.98] transition' : 'hover:shadow-md transition-shadow'}`} onClick={clickable ? () => setDetailTrip(trip) : undefined}>
                      <div className="relative h-36">
                        <img src="https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg" alt={trip.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-oshiruco-900/60 via-oshiruco-900/20 to-transparent" />
                        <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${statusConf.color}`}>
                          <StatusIcon className="w-3 h-3" />{statusConf.label}
                        </span>
                        {!trip.is_public && (
                          <span className="absolute top-3 left-3 text-xs bg-oshiruco-900/40 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" />仅自己可见
                          </span>
                        )}
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-white font-serif font-bold text-base">{trip.title}</h3>
                          <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{trip.destination}</p>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        {tab === 'community' && (trip.profiles as TripProfile | undefined) && (
                          <p className="text-xs text-oshiruco-500 mb-2 flex items-center gap-1"><Globe className="w-3 h-3" /> 发布者：{(trip.profiles as TripProfile).full_name}</p>
                        )}
                        {trip.description && <p className="text-sm text-oshiruco-700 leading-relaxed line-clamp-2">{trip.description}</p>}
                        <div className="flex items-center justify-between mt-2">
                          {(trip.start_date || trip.end_date) ? (
                            <p className="text-xs text-oshiruco-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {trip.start_date && new Date(trip.start_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
                              {trip.start_date && trip.end_date && ' — '}
                              {trip.end_date && new Date(trip.end_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          ) : <span />}
                          {clickable && (
                            <span className="text-xs text-oshiruco-600 font-semibold flex items-center gap-0.5">查看详情 <ChevronRight className="w-3.5 h-3.5" /></span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {detailTheme && (
        <ThemeDetail theme={detailTheme} onClose={() => { setDetailTheme(null); loadTrips(); }} onPlanTrip={(t) => { setDetailTheme(null); openThemeForm(t); }} />
      )}

      {detailTrip && (
        <TripDetail trip={detailTrip} onClose={() => setDetailTrip(null)}
          onUpdated={async () => { const fresh = await loadTrips(); setDetailTrip(fresh.find(t => t.id === detailTrip.id) ?? null); setToast('行程已更新'); }}
          onDeleted={() => { setDetailTrip(null); loadTrips(); setToast('行程已取消'); }}
        />
      )}

      {showRegModal && regTheme && (
        <div className="fixed inset-0 bg-oshiruco-900/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-oshiruco-900">报名参加主题旅游</h3>
              <button onClick={() => setShowRegModal(false)}><X className="w-6 h-6 text-oshiruco-400" /></button>
            </div>
            <div className={`flex items-center gap-3 mb-5 px-3 py-3 rounded-xl border ${regTheme.border} bg-gradient-to-r ${regTheme.lightAccent}`}>
              <span className="text-2xl">{regTheme.icon}</span>
              <div><p className="font-semibold text-oshiruco-800">{regTheme.name}</p><p className="text-xs text-oshiruco-500">{regTheme.tagline}</p></div>
            </div>
            <label className="block text-sm font-medium text-oshiruco-800 mb-1.5">备注（选填）</label>
            <textarea value={regNote} onChange={e => setRegNote(e.target.value)} placeholder="例如：希望报名秋季出发的团期，偏好小团…" rows={3}
              className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm resize-none mb-5 bg-oshiruco-50/50" />
            <div className="flex gap-3">
              <button onClick={() => setShowRegModal(false)} className="flex-1 py-3 rounded-xl border border-oshiruco-200 text-oshiruco-600 font-medium text-sm">取消</button>
              <button onClick={handleRegister} disabled={regLoading[regTheme.id]} className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm ${regTheme.regBtn} disabled:opacity-60`}>
                {regLoading[regTheme.id] ? '提交中…' : '确认报名'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-oshiruco-900/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            {/*<div className="flex items-center justify-between mb-2">*/}
            {/*  <h3 className="font-serif text-lg font-bold text-oshiruco-900">规划行程</h3>*/}
            {/*  <button onClick={() => { setShowForm(false); setSelectedTheme(null); }}><X className="w-6 h-6 text-oshiruco-400" /></button>*/}
            {/*</div>*/}
            {selectedTheme && (
              <div className={`flex items-center gap-3 mb-4 px-3 py-2.5 rounded-xl border ${selectedTheme.border} bg-gradient-to-r ${selectedTheme.lightAccent}`}>
                <span className="text-xl">{selectedTheme.icon}</span>
                <div><p className="text-sm font-semibold text-oshiruco-800">{selectedTheme.name}</p><p className="text-xs text-oshiruco-500">{selectedTheme.tagline}</p></div>
              </div>
            )}
            <form onSubmit={submitTrip} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-oshiruco-800 mb-1.5">行程标题 *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例如：2025地中海邮轮之旅" className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm bg-oshiruco-50/50" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-oshiruco-800 mb-1.5">目的地 *</label>
                <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder={selectedTheme ? selectedTheme.destinations[0] : '例如：意大利、希腊'} className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm bg-oshiruco-50/50" required />
                {selectedTheme && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedTheme.destinations.map(d => (
                      <button key={d} type="button" onClick={() => setForm(f => ({ ...f, destination: d }))} className={`text-xs px-2.5 py-1 rounded-full border transition ${form.destination === d ? `${selectedTheme.badge} border-current font-semibold` : 'border-oshiruco-200 text-oshiruco-500 hover:border-oshiruco-300'}`}>{d}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-oshiruco-800 mb-1.5">出发日期</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium text-oshiruco-800 mb-1.5">返回日期</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-oshiruco-800 mb-1.5">行程简介</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="您计划做些什么？" rows={3} className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm resize-none bg-oshiruco-50/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-oshiruco-800 mb-1.5">状态</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm bg-white">
                  <option value="planning">待管家联系</option><option value="active">进行中（出发啦！）</option><option value="completed">已完成</option>
                </select>
              </div>
              <div className="flex items-center gap-3 py-1">
                <button type="button" onClick={() => setForm({ ...form, is_public: !form.is_public })} className={`w-12 h-6 rounded-full transition-colors relative ${form.is_public ? 'bg-oshiruco-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_public ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-oshiruco-700">分享至社区</span>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setSelectedTheme(null); }} className="flex-1 py-3 rounded-xl border border-oshiruco-200 text-oshiruco-600 font-medium text-sm">取消</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-oshiruco-600 text-white font-medium text-sm disabled:opacity-60">保存行程</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-oshiruco-800/95 text-white text-sm px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-up max-w-[90%]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />{toast}
        </div>
      )}
    </div>
  );
}

interface TripProfile { full_name: string; avatar_url: string | null; }
