import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { CompanionMemo } from '../lib/database.types';
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudSun, CloudFog, Wind, Droplets,
  Thermometer, Eye, Compass, Plus, Check, Trash2, X, Pill, Moon,
  HeartPulse, Sunrise, Sunset, Calendar, MapPin, RefreshCw, ChevronDown,
  Heart, Sparkles,
} from 'lucide-react';

/* ---------- Weather types & helpers ---------- */

interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  code: number;
  windMax: number;
  precipitation: number;
  sunrise: string;
  sunset: string;
  uvMax: number;
}

interface CurrentWeather {
  temp: number;
  apparentTemp: number;
  code: number;
  windSpeed: number;
  humidity: number;
  pressure: number;
  visibility: number;
  windDir: number;
  uvIndex: number;
  isDay: boolean;
}

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

const WEATHER_CODE_MAP: Record<number, { label: string; icon: React.FC<{ className?: string }>; gradient: string }> = {
  0:  { label: '晴朗', icon: Sun,       gradient: 'from-amber-400 to-orange-500' },
  1:  { label: '大致晴朗', icon: Sun,    gradient: 'from-amber-400 to-orange-400' },
  2:  { label: '局部多云', icon: CloudSun, gradient: 'from-sky-400 to-blue-500' },
  3:  { label: '阴天', icon: Cloud,      gradient: 'from-gray-400 to-gray-500' },
  45: { label: '雾', icon: CloudFog,     gradient: 'from-gray-300 to-gray-400' },
  48: { label: '冻雾', icon: CloudFog,   gradient: 'from-gray-300 to-gray-400' },
  51: { label: '小毛毛雨', icon: CloudRain, gradient: 'from-sky-400 to-slate-500' },
  53: { label: '毛毛雨', icon: CloudRain, gradient: 'from-sky-500 to-slate-500' },
  55: { label: '大毛毛雨', icon: CloudRain, gradient: 'from-sky-600 to-slate-600' },
  61: { label: '小雨', icon: CloudRain,  gradient: 'from-sky-500 to-slate-600' },
  63: { label: '中雨', icon: CloudRain,  gradient: 'from-sky-600 to-slate-700' },
  65: { label: '大雨', icon: CloudRain,  gradient: 'from-sky-700 to-slate-800' },
  66: { label: '冻雨', icon: CloudRain,  gradient: 'from-cyan-500 to-slate-600' },
  67: { label: '强冻雨', icon: CloudRain, gradient: 'from-cyan-600 to-slate-700' },
  71: { label: '小雪', icon: CloudSnow,  gradient: 'from-sky-300 to-blue-400' },
  73: { label: '中雪', icon: CloudSnow,  gradient: 'from-sky-400 to-blue-500' },
  75: { label: '大雪', icon: CloudSnow,  gradient: 'from-sky-500 to-blue-600' },
  77: { label: '冰粒', icon: CloudSnow,  gradient: 'from-sky-400 to-blue-500' },
  80: { label: '阵雨', icon: CloudRain,  gradient: 'from-sky-500 to-slate-600' },
  81: { label: '强阵雨', icon: CloudRain, gradient: 'from-sky-600 to-slate-700' },
  82: { label: '暴雨', icon: CloudRain,  gradient: 'from-sky-700 to-slate-800' },
  85: { label: '阵雪', icon: CloudSnow,  gradient: 'from-sky-400 to-blue-500' },
  86: { label: '强阵雪', icon: CloudSnow, gradient: 'from-sky-500 to-blue-600' },
  95: { label: '雷暴', icon: CloudRain,  gradient: 'from-slate-600 to-gray-800' },
  96: { label: '雷暴伴冰雹', icon: CloudRain, gradient: 'from-slate-700 to-gray-900' },
  99: { label: '强雷暴伴冰雹', icon: CloudRain, gradient: 'from-slate-800 to-gray-900' },
};

function getWeatherInfo(code: number, isDay = true) {
  const base = WEATHER_CODE_MAP[code] || { label: '未知', icon: Cloud, gradient: 'from-gray-400 to-gray-500' };
  if (code === 0 || code === 1) {
    return { ...base, icon: isDay ? Sun : Moon, gradient: isDay ? 'from-amber-400 to-orange-500' : 'from-indigo-600 to-slate-800' };
  }
  return base;
}

function windDirLabel(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  return dirs[Math.round(deg / 45) % 8];
}

function uvLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: '低', color: 'text-emerald-600' };
  if (uv <= 5) return { label: '中等', color: 'text-amber-600' };
  if (uv <= 7) return { label: '高', color: 'text-orange-600' };
  if (uv <= 10) return { label: '很高', color: 'text-rose-600' };
  return { label: '极高', color: 'text-red-700' };
}

/* ---------- Memo types ---------- */

const MEMO_TYPES = [
  { id: 'medication' as const, label: '服药提醒', icon: Pill, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', accent: 'bg-rose-500', defaults: { title: '降压药', time: '08:00' } },
  { id: 'bedtime' as const, label: '就寝提醒', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'bg-indigo-500', defaults: { title: '就寝', time: '22:00' } },
  { id: 'blood_pressure' as const, label: '血压测量', icon: HeartPulse, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200', accent: 'bg-teal-500', defaults: { title: '测量血压', time: '07:30' } },
];

function getMemoTypeInfo(type: string) {
  return MEMO_TYPES.find(m => m.id === type) || MEMO_TYPES[0];
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? '上午' : '下午';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour12}:${String(m).padStart(2, '0')}`;
}

function getNextOccurrence(scheduledTime: string): Date {
  const [h, m] = scheduledTime.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

function timeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours <= 0 && mins <= 0) return '已到时间';
  if (hours === 0) return `${mins} 分钟后`;
  if (hours < 24) return `${hours} 小时 ${mins} 分后`;
  const days = Math.floor(hours / 24);
  return `${days} 天后`;
}

/* ---------- Main component ---------- */

export default function CompanionCare() {
  const { user, profile } = useAuth();
  const [memos, setMemos] = useState<CompanionMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingMemo, setEditingMemo] = useState<CompanionMemo | null>(null);

  // Weather state
  const [city, setCity] = useState<GeoResult | null>(null);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [cityResults, setCityResults] = useState<GeoResult[]>([]);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadMemos();
    loadDefaultWeather();
  }, [user]);

  const loadMemos = async () => {
    setLoading(true);
    const { data } = await supabase
        .from('companion_memos')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('scheduled_time', { ascending: true });
    if (data) setMemos(data as CompanionMemo[]);
    setLoading(false);
  };

  /* ---- Weather ---- */

  const loadDefaultWeather = async () => {
    const loc = profile?.location;
    if (loc) {
      await searchCity(loc, true);
    } else {
      await searchCity('北京', true);
    }
  };

  const searchCity = async (query: string, autoSelect = false) => {
    setSearching(true);
    setWeatherError(null);
    try {
      const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=zh&format=json`
      );
      if (!res.ok) throw new Error('搜索失败');
      const json = await res.json();
      const results: GeoResult[] = (json.results || []).map((r: GeoResult) => ({
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        country: r.country,
        admin1: r.admin1,
      }));
      setCityResults(results);
      if (autoSelect && results.length > 0) {
        selectCity(results[0]);
      } else if (results.length === 0 && !autoSelect) {
        setWeatherError('未找到该城市');
      }
    } catch {
      setWeatherError('城市搜索失败，请重试');
    }
    setSearching(false);
  };

  const selectCity = async (geo: GeoResult) => {
    setCity(geo);
    setShowCitySearch(false);
    setCitySearch('');
    setCityResults([]);
    await loadWeather(geo);
  };

  const loadWeather = async (geo: GeoResult) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const params = new URLSearchParams({
        latitude: String(geo.latitude),
        longitude: String(geo.longitude),
        current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,surface_pressure,visibility,wind_direction_10m,uv_index,is_day',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum,sunrise,sunset,uv_index_max',
        timezone: 'auto',
        forecast_days: '7',
      });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!res.ok) throw new Error('天气获取失败');
      const json = await res.json();

      const c = json.current;
      setCurrent({
        temp: c.temperature_2m,
        apparentTemp: c.apparent_temperature,
        code: c.weather_code,
        windSpeed: c.wind_speed_10m,
        humidity: c.relative_humidity_2m,
        pressure: c.surface_pressure,
        visibility: c.visibility,
        windDir: c.wind_direction_10m,
        uvIndex: c.uv_index,
        isDay: c.is_day === 1,
      });

      const d = json.daily;
      const forecasts: DailyForecast[] = [];
      for (let i = 0; i < d.time.length; i++) {
        forecasts.push({
          date: d.time[i],
          tempMax: d.temperature_2m_max[i],
          tempMin: d.temperature_2m_min[i],
          code: d.weather_code[i],
          windMax: d.wind_speed_10m_max[i],
          precipitation: d.precipitation_sum[i],
          sunrise: d.sunrise[i],
          sunset: d.sunset[i],
          uvMax: d.uv_index_max[i],
        });
      }
      setForecast(forecasts);
    } catch {
      setWeatherError('天气数据加载失败，请重试');
    }
    setWeatherLoading(false);
  };

  /* ---- Humanistic care reminder ---- */

  const careReminder = (() => {
    if (!current) return null;
    const temp = current.temp;
    const code = current.code;
    const isDay = current.isDay;
    const isClear = [0, 1].includes(code);
    const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
    const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
    const isFog = [45, 48].includes(code);

    let title = '';
    let body = '';
    let icon: typeof Sun = Sun;
    let gradient = 'from-rose-400 to-pink-500';

    if (isSnow) {
      title = '今天下雪啦，注意保暖';
      body = '路面可能湿滑，出门记得穿防滑鞋，多喝热水暖暖身子。';
      icon = CloudSnow;
      gradient = 'from-sky-400 to-blue-500';
    } else if (isRain) {
      title = '今天有雨，记得带伞';
      body = '出门别忘带伞，雨天路滑，慢慢走，平安到家最重要。';
      icon = CloudRain;
      gradient = 'from-slate-400 to-slate-600';
    } else if (isFog) {
      title = '今天有雾，出行小心';
      body = '能见度较低，外出请放慢脚步，开车的话请打开雾灯。';
      icon = CloudFog;
      gradient = 'from-gray-400 to-slate-500';
    } else if (temp <= 5) {
      title = '今天有点冷，注意保暖';
      body = '天冷了，多穿点衣服，喝杯热水，别让自己着凉了。';
      icon = Thermometer;
      gradient = 'from-cyan-400 to-sky-500';
    } else if (temp > 5 && temp <= 15) {
      title = '天气微凉，添件外套';
      body = '早晚温差大，出门带件薄外套，照顾好自己。';
      icon = CloudSun;
      gradient = 'from-teal-400 to-cyan-500';
    } else if (isClear && isDay && temp > 15 && temp <= 28) {
      title = '今天天气不错，适合散步';
      body = '阳光正好，微风不燥，出去走走吧，让心情也晒晒太阳。';
      icon = Sun;
      gradient = 'from-amber-400 to-orange-500';
    } else if (temp > 28) {
      title = '今天天气炎热，注意防暑';
      body = '气温较高，多喝水，尽量待在阴凉处，出门记得防晒。';
      icon = Sun;
      gradient = 'from-orange-400 to-red-500';
    } else {
      title = '今天天气宜人，好好享受';
      body = '适合出门走走，也可以在家泡杯茶，享受一段悠闲时光。';
      icon = CloudSun;
      gradient = 'from-emerald-400 to-teal-500';
    }

    return { title, body, icon, gradient };
  })();

  /* ---- Memo CRUD ---- */

  const toggleDone = async (memo: CompanionMemo) => {
    const newVal = !memo.done;
    setMemos(prev => prev.map(m => m.id === memo.id ? { ...m, done: newVal } : m));
    await supabase.from('companion_memos').update({ done: newVal }).eq('id', memo.id);
  };

  const deleteMemo = async (id: string) => {
    setMemos(prev => prev.filter(m => m.id !== id));
    await supabase.from('companion_memos').delete().eq('id', id);
    setEditingMemo(null);
  };

  const saveMemo = async (data: { memo_type: CompanionMemo['memo_type']; title: string; scheduled_time: string; note: string }, id?: string) => {
    if (id) {
      const { data: updated } = await supabase
          .from('companion_memos')
          .update({ memo_type: data.memo_type, title: data.title, scheduled_time: data.scheduled_time, note: data.note })
          .eq('id', id)
          .select('*')
          .single();
      if (updated) {
        setMemos(prev => prev.map(m => m.id === id ? { ...(updated as CompanionMemo) } : m));
      }
    } else {
      const { data: created } = await supabase
          .from('companion_memos')
          .insert({ user_id: user?.id, memo_type: data.memo_type, title: data.title, scheduled_time: data.scheduled_time, note: data.note })
          .select('*')
          .single();
      if (created) {
        setMemos(prev => [...prev, created as CompanionMemo].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)));
      }
    }
    setShowAdd(false);
    setEditingMemo(null);
  };

  const groupedMemos = MEMO_TYPES.map(type => ({
    type,
    items: memos.filter(m => m.memo_type === type.id),
  })).filter(g => g.items.length > 0);

  return (
      <div className="space-y-6">

        {/* Health memo section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500" /> 健康备忘
            </h2>
            <button
                onClick={() => { setEditingMemo(null); setShowAdd(true); }}
                className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 添加
            </button>
          </div>

          {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
          ) : memos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <HeartPulse className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">暂无备忘</p>
                <p className="text-xs text-gray-400">添加服药、就寝或血压测量提醒</p>
                <button
                    onClick={() => { setEditingMemo(null); setShowAdd(true); }}
                    className="mt-4 text-emerald-600 font-semibold text-sm bg-emerald-50 px-5 py-2.5 rounded-full hover:bg-emerald-100 transition inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 添加备忘
                </button>
              </div>
          ) : (
              <div className="space-y-4">
                {groupedMemos.map(({ type, items }) => (
                    <div key={type.id}>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <type.icon className={`w-3.5 h-3.5 ${type.color}`} /> {type.label}
                        <span className="text-gray-300 normal-case">({items.length})</span>
                      </h3>
                      <div className="space-y-2">
                        {items.map(memo => {
                          const next = getNextOccurrence(memo.scheduled_time);
                          return (
                              <div
                                  key={memo.id}
                                  className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 transition-all ${memo.done ? `${type.bg} ${type.border} opacity-75` : 'border-gray-100'}`}
                              >
                                <button
                                    onClick={() => toggleDone(memo)}
                                    className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${memo.done ? `${type.accent} border-transparent` : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                  {memo.done && <Check className="w-4 h-4 text-white" />}
                                </button>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingMemo(memo); setShowAdd(true); }}>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <p className={`font-semibold text-sm ${memo.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{memo.title}</p>
                                    {!memo.done && (
                                        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {timeUntil(next)}
                              </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" />{formatTime12h(memo.scheduled_time)}
                            </span>
                                    {memo.note && <span className="truncate text-gray-400">· {memo.note}</span>}
                                  </div>
                                </div>
                                <button
                                    onClick={() => deleteMemo(memo.id)}
                                    className="flex-shrink-0 text-gray-300 hover:text-rose-400 p-1 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                          );
                        })}
                      </div>
                    </div>
                ))}
              </div>
          )}
        </div>

        {/* Heartwarming tips for seniors */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> 暖心小贴士
            </h2>
          </div>
          <div className="space-y-3">
            {/* Weather tips */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-sky-50 to-cyan-50 px-4 py-2.5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center">
                <CloudRain className="w-4 h-4 text-sky-500" />
              </span>
                <h3 className="text-sm font-bold text-gray-800">天气相关</h3>
              </div>
              <ul className="px-4 py-3 space-y-2 text-sm text-gray-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                  <span>大风天气减少在湖边散步，避免被风吹倒或受凉。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                  <span>大雨天出门带上防滑雨伞，路面湿滑请放慢脚步。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                  <span>高温天气随身携带温水，及时补充水分防止中暑。</span>
                </li>
              </ul>
            </div>

            {/* Health tips */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-2.5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-rose-500" />
              </span>
                <h3 className="text-sm font-bold text-gray-800">健康相关</h3>
              </div>
              <ul className="px-4 py-3 space-y-2 text-sm text-gray-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span>换季时节早晚温差大，出门记得戴上护膝保暖。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span>早晨醒来不要猛然起身，先在床上活动片刻再慢慢坐起。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span>饮食宜清淡，减少油腻和过咸的食物，保护心血管健康。</span>
                </li>
              </ul>
            </div>

            {/* Emotional tips */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                <Heart className="w-4 h-4 text-amber-500" fill="currentColor" />
              </span>
                <h3 className="text-sm font-bold text-gray-800">情感相关</h3>
              </div>
              <ul className="px-4 py-3 space-y-2 text-sm text-gray-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span>闲暇时翻翻老照片，回忆美好往事，让心情更加舒畅。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span>约上老友一起喝个下午茶，聊聊家常，放松身心。</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Weather forecast section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-sky-500" /> 天气预报
            </h2>
            <button
                onClick={() => city && loadWeather(city)}
                className="text-xs text-sky-600 font-medium flex items-center gap-1 hover:text-sky-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 刷新
            </button>
          </div>

          {weatherLoading ? (
              <div className="h-64 rounded-3xl bg-gray-100 animate-pulse" />
          ) : weatherError && !current ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{weatherError}</p>
                <button onClick={() => setShowCitySearch(true)} className="mt-3 text-sky-600 font-medium text-sm">选择城市</button>
              </div>
          ) : current ? (
              <>
                {/* Current weather hero card */}
                <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${getWeatherInfo(current.code, current.isDay).gradient} shadow-lg`}>
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
                  <div className="relative p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-white/90 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>{city?.name}{city?.admin1 ? `, ${city.admin1}` : ''}</span>
                          <button onClick={() => setShowCitySearch(true)} className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-white text-5xl font-extrabold tracking-tight">{Math.round(current.temp)}</span>
                          <span className="text-white/80 text-xl font-bold">°C</span>
                        </div>
                        <p className="text-white/90 text-sm mt-1">{getWeatherInfo(current.code, current.isDay).label}</p>
                        <p className="text-white/70 text-xs mt-0.5">体感 {Math.round(current.apparentTemp)}°</p>
                      </div>
                      {(() => {
                        const WIcon = getWeatherInfo(current.code, current.isDay).icon;
                        return <WIcon className="w-20 h-20 text-white/90 drop-shadow-lg" />;
                      })()}
                    </div>

                    {/* Current details grid */}
                    <div className="grid grid-cols-4 gap-2 mt-5">
                      {[
                        { icon: Wind, label: '风速', value: `${Math.round(current.windSpeed)} km/h` },
                        { icon: Droplets, label: '湿度', value: `${current.humidity}%` },
                        { icon: Compass, label: '风向', value: windDirLabel(current.windDir) },
                        { icon: Eye, label: '能见度', value: `${Math.round(current.visibility / 1000)} km` },
                      ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-2.5 text-center">
                            <Icon className="w-4 h-4 text-white/80 mx-auto mb-1" />
                            <p className="text-white text-xs font-bold leading-tight">{value}</p>
                            <p className="text-white/60 text-[10px] mt-0.5">{label}</p>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Humanistic care card */}
                {careReminder && (
                    <div className={`mt-3 relative rounded-3xl overflow-hidden bg-gradient-to-br ${careReminder.gradient} shadow-md`}>
                      <div className="absolute -right-6 -bottom-6 opacity-20">
                        <careReminder.icon className="w-32 h-32 text-white" />
                      </div>
                      <div className="relative p-5">
                        <div className="flex items-center gap-2 text-white/95">
                    <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" fill="currentColor" />
                    </span>
                          <h3 className="text-sm font-bold tracking-wide">伴伴关怀</h3>
                        </div>
                        <p className="mt-3 text-white font-bold text-lg leading-snug">{careReminder.title}</p>
                        <p className="mt-1.5 text-white/85 text-sm leading-relaxed">{careReminder.body}</p>
                      </div>
                    </div>
                )}

                {/* 7-day forecast */}
                {forecast.length > 0 && (
                    <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-sky-500" /> 7 日预报
                      </h3>
                      <div className="space-y-2">
                        {forecast.map((day, i) => {
                          const info = getWeatherInfo(day.code);
                          const WIcon = info.icon;
                          const isToday = i === 0;
                          const dayLabel = isToday ? '今天' : new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' });
                          const dayDate = new Date(day.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
                          return (
                              <div key={day.date} className={`flex items-center gap-3 py-2 ${i < forecast.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <div className="w-14 flex-shrink-0">
                                  <p className={`text-sm font-semibold ${isToday ? 'text-sky-600' : 'text-gray-700'}`}>{dayLabel}</p>
                                  <p className="text-xs text-gray-400">{dayDate}</p>
                                </div>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${info.gradient} bg-opacity-10`}>
                                  <WIcon className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-xs text-gray-500 flex-shrink-0 w-16 truncate">{info.label}</p>
                                <div className="flex-1 flex items-center justify-end gap-2">
                                  {day.precipitation > 0 && (
                                      <span className="text-xs text-sky-500 flex items-center gap-0.5">
                              <Droplets className="w-3 h-3" />{day.precipitation.toFixed(1)}mm
                            </span>
                                  )}
                                  <span className="text-xs text-gray-400">{Math.round(day.tempMin)}°</span>
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                                    <div
                                        className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                                        style={{
                                          left: `${((day.tempMin - forecast[0].tempMin) / (Math.max(...forecast.map(f => f.tempMax)) - forecast[0].tempMin + 1)) * 100}%`,
                                          width: `${((day.tempMax - day.tempMin) / (Math.max(...forecast.map(f => f.tempMax)) - forecast[0].tempMin + 1)) * 100}%`,
                                        }}
                                    />
                                  </div>
                                  <span className="text-sm font-bold text-gray-800 w-8 text-right">{Math.round(day.tempMax)}°</span>
                                </div>
                              </div>
                          );
                        })}
                      </div>

                      {/* Sunrise / Sunset / UV */}
                      {forecast[0] && (
                          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-50">
                            <div className="flex flex-col items-center gap-1">
                              <Sunrise className="w-5 h-5 text-amber-400" />
                              <p className="text-xs font-semibold text-gray-700">{forecast[0].sunrise.slice(0, 5)}</p>
                              <p className="text-[10px] text-gray-400">日出</p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <Sunset className="w-5 h-5 text-orange-400" />
                              <p className="text-xs font-semibold text-gray-700">{forecast[0].sunset.slice(0, 5)}</p>
                              <p className="text-[10px] text-gray-400">日落</p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <Sun className={`w-5 h-5 ${uvLabel(forecast[0].uvMax).color}`} />
                              <p className={`text-xs font-semibold ${uvLabel(forecast[0].uvMax).color}`}>{forecast[0].uvMax}</p>
                              <p className="text-[10px] text-gray-400">紫外线 {uvLabel(forecast[0].uvMax).label}</p>
                            </div>
                          </div>
                      )}
                    </div>
                )}
              </>
          ) : null}
        </div>



        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Health memo section */}
        {/*<div>*/}
        {/*  <div className="flex items-center justify-between mb-3">*/}
        {/*    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">*/}
        {/*      <HeartPulse className="w-5 h-5 text-rose-500" /> 健康备忘*/}
        {/*    </h2>*/}
        {/*    <button*/}
        {/*      onClick={() => { setEditingMemo(null); setShowAdd(true); }}*/}
        {/*      className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition flex items-center gap-1"*/}
        {/*    >*/}
        {/*      <Plus className="w-3.5 h-3.5" /> 添加*/}
        {/*    </button>*/}
        {/*  </div>*/}

        {/*  {loading ? (*/}
        {/*    <div className="space-y-3">*/}
        {/*      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}*/}
        {/*    </div>*/}
        {/*  ) : memos.length === 0 ? (*/}
        {/*    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">*/}
        {/*      <HeartPulse className="w-12 h-12 text-gray-200 mx-auto mb-2" />*/}
        {/*      <p className="text-sm text-gray-500 mb-1">暂无备忘</p>*/}
        {/*      <p className="text-xs text-gray-400">添加服药、就寝或血压测量提醒</p>*/}
        {/*      <button*/}
        {/*        onClick={() => { setEditingMemo(null); setShowAdd(true); }}*/}
        {/*        className="mt-4 text-emerald-600 font-semibold text-sm bg-emerald-50 px-5 py-2.5 rounded-full hover:bg-emerald-100 transition inline-flex items-center gap-1"*/}
        {/*      >*/}
        {/*        <Plus className="w-4 h-4" /> 添加备忘*/}
        {/*      </button>*/}
        {/*    </div>*/}
        {/*  ) : (*/}
        {/*    <div className="space-y-4">*/}
        {/*      {groupedMemos.map(({ type, items }) => (*/}
        {/*        <div key={type.id}>*/}
        {/*          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">*/}
        {/*            <type.icon className={`w-3.5 h-3.5 ${type.color}`} /> {type.label}*/}
        {/*            <span className="text-gray-300 normal-case">({items.length})</span>*/}
        {/*          </h3>*/}
        {/*          <div className="space-y-2">*/}
        {/*            {items.map(memo => {*/}
        {/*              const next = getNextOccurrence(memo.scheduled_time);*/}
        {/*              return (*/}
        {/*                <div*/}
        {/*                  key={memo.id}*/}
        {/*                  className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 transition-all ${memo.done ? `${type.bg} ${type.border} opacity-75` : 'border-gray-100'}`}*/}
        {/*                >*/}
        {/*                  <button*/}
        {/*                    onClick={() => toggleDone(memo)}*/}
        {/*                    className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${memo.done ? `${type.accent} border-transparent` : 'border-gray-300 hover:border-gray-400'}`}*/}
        {/*                  >*/}
        {/*                    {memo.done && <Check className="w-4 h-4 text-white" />}*/}
        {/*                  </button>*/}
        {/*                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingMemo(memo); setShowAdd(true); }}>*/}
        {/*                    <div className="flex items-center gap-2 mb-0.5">*/}
        {/*                      <p className={`font-semibold text-sm ${memo.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{memo.title}</p>*/}
        {/*                      {!memo.done && (*/}
        {/*                        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full flex-shrink-0">*/}
        {/*                          {timeUntil(next)}*/}
        {/*                        </span>*/}
        {/*                      )}*/}
        {/*                    </div>*/}
        {/*                    <div className="flex items-center gap-2 text-xs text-gray-500">*/}
        {/*                      <span className="flex items-center gap-0.5">*/}
        {/*                        <Calendar className="w-3 h-3" />{formatTime12h(memo.scheduled_time)}*/}
        {/*                      </span>*/}
        {/*                      {memo.note && <span className="truncate text-gray-400">· {memo.note}</span>}*/}
        {/*                    </div>*/}
        {/*                  </div>*/}
        {/*                  <button*/}
        {/*                    onClick={() => deleteMemo(memo.id)}*/}
        {/*                    className="flex-shrink-0 text-gray-300 hover:text-rose-400 p-1 rounded-lg transition"*/}
        {/*                  >*/}
        {/*                    <Trash2 className="w-4 h-4" />*/}
        {/*                  </button>*/}
        {/*                </div>*/}
        {/*              );*/}
        {/*            })}*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*      ))}*/}
        {/*    </div>*/}
        {/*  )}*/}
        {/*</div>*/}

        {/* City search modal */}
        {showCitySearch && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCitySearch(false)}>
              <div className="bg-white w-full rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">选择城市</h3>
                  <button onClick={() => setShowCitySearch(false)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 mb-3">
                  <Compass className="w-4 h-4 text-gray-400" />
                  <input
                      value={citySearch}
                      onChange={e => setCitySearch(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && citySearch.trim()) searchCity(citySearch); }}
                      placeholder="搜索城市名称…"
                      className="flex-1 outline-none text-sm bg-transparent"
                      autoFocus
                  />
                  <button
                      onClick={() => citySearch.trim() && searchCity(citySearch)}
                      disabled={!citySearch.trim() || searching}
                      className="text-sm text-sky-600 font-semibold disabled:opacity-40"
                  >
                    搜索
                  </button>
                </div>
                {searching ? (
                    <div className="py-8 text-center">
                      <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : cityResults.length > 0 ? (
                    <div className="space-y-1">
                      {cityResults.map((r, i) => (
                          <button
                              key={`${r.latitude}-${r.longitude}-${i}`}
                              onClick={() => selectCity(r)}
                              className="w-full text-left px-4 py-3 rounded-xl hover:bg-sky-50 transition flex items-center gap-3"
                          >
                            <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{r.name}</p>
                              <p className="text-xs text-gray-400">{r.admin1 ? `${r.admin1}, ` : ''}{r.country}</p>
                            </div>
                          </button>
                      ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-gray-400 py-6">输入城市名开始搜索</p>
                )}
              </div>
            </div>
        )}

        {/* Add/Edit memo modal */}
        {showAdd && (
            <MemoForm
                editing={editingMemo}
                onClose={() => { setShowAdd(false); setEditingMemo(null); }}
                onSave={saveMemo}
            />
        )}
      </div>
  );
}

/* ---------- Memo form ---------- */

function MemoForm({
                    editing,
                    onClose,
                    onSave,
                  }: {
  editing: CompanionMemo | null;
  onClose: () => void;
  onSave: (data: { memo_type: CompanionMemo['memo_type']; title: string; scheduled_time: string; note: string }, id?: string) => void;
}) {
  const [memoType, setMemoType] = useState<CompanionMemo['memo_type']>(editing?.memo_type || 'medication');
  const [title, setTitle] = useState(editing?.title || '');
  const [scheduledTime, setScheduledTime] = useState(editing?.scheduled_time || '08:00');
  const [note, setNote] = useState(editing?.note || '');

  const handleTypeChange = (type: CompanionMemo['memo_type']) => {
    setMemoType(type);
    if (!editing) {
      const def = getMemoTypeInfo(type).defaults;
      setTitle(def.title);
      setScheduledTime(def.time);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ memo_type: memoType, title: title.trim(), scheduled_time: scheduledTime, note: note.trim() }, editing?.id);
  };

  return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
        <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900">{editing ? '编辑备忘' : '添加健康备忘'}</h3>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
              <div className="grid grid-cols-3 gap-2">
                {MEMO_TYPES.map(type => (
                    <button
                        key={type.id}
                        type="button"
                        onClick={() => handleTypeChange(type.id)}
                        className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${memoType === type.id ? `${type.border} ${type.bg}` : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <type.icon className={`w-5 h-5 ${memoType === type.id ? type.color : 'text-gray-400'}`} />
                      <span className={`text-xs font-semibold ${memoType === type.id ? type.color : 'text-gray-500'}`}>{type.label}</span>
                    </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">名称</label>
              <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="例如：降压药"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 outline-none text-sm"
                  required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">提醒时间</label>
              <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 outline-none text-sm"
                  required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">备注（选填）</label>
              <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="例如：饭后服用，一次一片"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 outline-none text-sm resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm">
                取消
              </button>
              <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition">
                {editing ? '保存' : '添加'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
