import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { ThemeRegistration, Trip } from '../lib/database.types';
import {
  ChevronLeft, Star, Users, MapPin, Calendar, Plane, CheckCircle2,
  Heart, ArrowRight, MessageCircle, Globe, Wallet,
} from 'lucide-react';

export interface TravelTheme {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  images: string[];
  price: number;
  accent: string;
  lightAccent: string;
  border: string;
  badgeBg: string;
  badge: string;
  barColor: string;
  regBtn: string;
  regBtnActive: string;
  destinations: string[];
  icon: string;
  rating: number;
  reviewCount: number;
}

interface Props {
  theme: TravelTheme;
  onClose: () => void;
  onPlanTrip: (theme: TravelTheme) => void;
}

interface TripProfile { full_name: string; avatar_url: string | null; }

const THEME_TIPS: Record<string, string[]> = {
  red: ['参观革命纪念馆时请保持肃静', '提前了解历史背景收获更多', '携带身份证以享受部分景点免票'],
  'euro-america': ['提前办理签证并确认有效期', '留意当地小费文化', '保管好护照与重要证件'],
  romantic: ['提前预订景观餐厅位', '黄昏时段适合拍摄情侣照', '选择带阳台的房间享受日落'],
  sweet: ['提前预约热门餐厅', '留出充裕时间漫步集市', '尝试当地当季食材'],
};

const SEASONAL: Record<string, { months: string; note: string }[]> = {
  red: [
    { months: '春季 3-5月', note: '气候温和，适合户外瞻仰与参观' },
    { months: '秋季 9-11月', note: '天高气爽，适合重走长征路' },
  ],
  'euro-america': [
    { months: '夏季 6-8月', note: '欧洲日照长，适合城市漫步' },
    { months: '冬季 12-2月', note: '圣诞集市与北欧极光季' },
  ],
  romantic: [
    { months: '春季 4-6月', note: '花季浪漫，适合海岛与小镇' },
    { months: '秋季 9-10月', note: '光线柔和，适合拍摄纪念照' },
  ],
  sweet: [
    { months: '夏秋 6-10月', note: '食材最丰富，集市最热闹' },
    { months: '春季 3-5月', note: '乡村花海与户外露台季' },
  ],
};

export default function ThemeDetail({ theme, onClose, onPlanTrip }: Props) {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<ThemeRegistration[]>([]);
  const [regCount, setRegCount] = useState(0);
  const [communityTrips, setCommunityTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0 });
    loadData();
  }, [theme.id]);

  const loadData = async () => {
    setLoading(true);
    const [myRegs, countRes, tripsRes] = await Promise.all([
      user
        ? supabase.from('theme_registrations').select('*').eq('user_id', user.id).eq('theme_id', theme.id)
        : Promise.resolve({ data: [] }),
      supabase.from('theme_registrations').select('theme_id').eq('theme_id', theme.id),
      supabase
        .from('trips')
        .select('*, profiles(full_name, avatar_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    if (myRegs.data) setRegistrations(myRegs.data as ThemeRegistration[]);
    setRegCount(countRes.data?.length || 0);
    if (tripsRes.data) {
      const matched = (tripsRes.data as Trip[]).filter(t =>
        theme.destinations.some(d => t.destination?.includes(d)) ||
        t.description?.includes(theme.name)
      );
      setCommunityTrips(matched);
    }
    setLoading(false);
  };

  const isRegistered = registrations.some(r => r.theme_id === theme.id);

  const handleRegister = async () => {
    if (!user) return;
    setRegistering(true);
    if (isRegistered) {
      await supabase.from('theme_registrations').delete().eq('user_id', user.id).eq('theme_id', theme.id);
    } else {
      await supabase.from('theme_registrations').insert({ user_id: user.id, theme_id: theme.id });
      await supabase.from('trips').insert({
        user_id: user.id,
        title: `${theme.name}之旅`,
        destination: theme.destinations[0] || theme.name,
        description: `${theme.tagline} —— 报名主题后自动生成的行程，可在「我的行程」中编辑详情。`,
        status: 'planning',
        is_public: false,
      });
    }
    await loadData();
    setRegistering(false);
  };

  const tips = THEME_TIPS[theme.id] || ['提前规划行程', '尊重当地文化', '保管好随身物品'];
  const seasonal = SEASONAL[theme.id] || [];

  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const carouselImages = theme.images?.length ? theme.images : [theme.image];

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % carouselImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: carouselIdx * carouselRef.current.clientWidth, behavior: 'smooth' });
    }
  }, [carouselIdx]);

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto animate-slide-up">
      {/* Hero carousel */}
      <div className="relative h-80">
        <div ref={carouselRef} className="w-full h-full overflow-hidden flex snap-x snap-mandatory">
          {carouselImages.map((img, i) => (
            <div key={i} className="w-full h-full flex-shrink-0 snap-center">
              <img src={img} alt={`${theme.name} ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        {/*<div className={`absolute inset-0 bg-gradient-to-br ${theme.accent} opacity-40`} />*/}
        {/*<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />*/}

        {/* Carousel dots */}
        {carouselImages.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
            {carouselImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === carouselIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="absolute top-12 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1 shadow">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
          <span className="text-xs font-bold text-gray-800">{theme.rating}</span>
          <span className="text-xs text-gray-500">({theme.reviewCount.toLocaleString()})</span>
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <div className={`w-14 h-14 rounded-2xl ${theme.badgeBg} flex items-center justify-center text-3xl shadow-lg ring-2 ring-white/30 mb-3`}>
            {theme.icon}
          </div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">{theme.name}</h1>
          <p className="text-white/85 text-sm mt-1 font-medium">{theme.tagline}</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4 text-gray-400" />
          <span><span className="font-bold text-gray-900">{regCount}</span> 人已报名</span>
        </div>
        {theme.price != null && (
          <div className="flex items-center gap-1 text-amber-600 font-bold">
            <Wallet className="w-4 h-4" />
            <span className="text-lg">¥{theme.price.toLocaleString('zh-CN')}</span>
            <span className="text-xs text-gray-400 font-normal">/人起</span>
          </div>
        )}
        {isRegistered ? (
          <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />已报名
          </span>
        ) : (
          <span className="text-xs text-gray-400">未报名</span>
        )}
      </div>

      <div className="px-5 pt-5 pb-28 space-y-6">
        {/* Description */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">主题介绍</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{theme.description}</p>
        </section>

        {/* Destinations */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">热门目的地</h2>
          <div className="flex flex-wrap gap-2">
            {theme.destinations.map(dest => (
              <span key={dest} className={`text-sm font-medium px-3.5 py-2 rounded-full flex items-center gap-1.5 ${theme.badge}`}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />{dest}
              </span>
            ))}
          </div>
        </section>

        {/* Seasonal recommendations */}
        {seasonal.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />最佳出行季节
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {seasonal.map((s, i) => (
                <div key={i} className={`bg-gradient-to-r ${theme.lightAccent} border ${theme.border} rounded-2xl p-4`}>
                  <p className="text-sm font-bold text-gray-800 mb-1">{s.months}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.note}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tips */}
        <section className={`bg-gradient-to-r ${theme.lightAccent} border ${theme.border} rounded-2xl p-4`}>
          <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500 fill-current" /> 主题小贴士
          </h2>
          <ul className="space-y-1.5 text-xs text-gray-700 leading-relaxed">
            {tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">·</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Community trips */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" /> 社区相关行程
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : communityTrips.length > 0 ? (
            <div className="space-y-3">
              {communityTrips.map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="relative h-32">
                    <img src="https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg" alt={trip.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-sm">{trip.title}</h3>
                      <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{trip.destination}</p>
                    </div>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Users className="w-3 h-3" />{(trip.profiles as TripProfile | undefined)?.full_name || '旅行者'}
                    </p>
                    {trip.description && <p className="text-xs text-gray-600 line-clamp-2">{trip.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无相关行程</p>
              <p className="text-xs mt-1">成为第一个分享该主题行程的人！</p>
            </div>
          )}
        </section>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-4 py-3 flex gap-3 z-50">
        <button
          onClick={handleRegister}
          disabled={registering}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition ${isRegistered ? theme.regBtnActive : `${theme.regBtn} text-white`} disabled:opacity-50`}
        >
          {registering ? '处理中…' : isRegistered ? '取消报名' : '立即报名'}
        </button>
        <button
          onClick={() => onPlanTrip(theme)}
          className={`flex-1 py-3 rounded-xl text-white text-sm font-semibold bg-gradient-to-r ${theme.accent} flex items-center justify-center gap-1.5 shadow hover:opacity-90 transition-opacity`}
        >
          <Plane className="w-4 h-4" />
          规划行程
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
