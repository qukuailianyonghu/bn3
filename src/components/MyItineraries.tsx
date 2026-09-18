import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Trip } from '../lib/database.types';
import {
  ChevronLeft, Clock, Plane, CheckCircle2, Wallet,
  Calendar, MapPin, Lock, ChevronRight, Inbox,
} from 'lucide-react';

type StatusFilter = 'all' | 'pending_payment' | 'planning' | 'active' | 'completed';

interface StatusConfig {
  label: string;
  icon: React.FC<{ className?: string }>;
  badge: string;
  dot: string;
  accent: string;
  gradient: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending_payment: {
    label: '待付款',
    icon: Wallet,
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    accent: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-500',
  },
  planning: {
    label: '未出行',
    icon: Clock,
    badge: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-500',
    accent: 'text-sky-600',
    gradient: 'from-sky-500 to-blue-500',
  },
  active: {
    label: '进行中',
    icon: Plane,
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    accent: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-500',
  },
  completed: {
    label: '已完成',
    icon: CheckCircle2,
    badge: 'bg-gray-100 text-gray-500',
    dot: 'bg-gray-400',
    accent: 'text-gray-400',
    gradient: 'from-gray-400 to-gray-500',
  },
};

const TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'pending_payment', label: '待付款' },
  { id: 'planning', label: '未出行' },
  { id: 'active', label: '进行中' },
  { id: 'completed', label: '已完成' },
];

const TRIP_IMAGES = [
  'https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg?w=600',
  'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?w=600',
  'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?w=600',
  'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?w=600',
  'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?w=600',
];

function tripImage(trip: Trip): string {
  if (trip.image_url) return trip.image_url;
  const hash = trip.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return TRIP_IMAGES[hash % TRIP_IMAGES.length];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MyItineraries({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusFilter>('all');
  const [payingId, setPayingId] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user?.id || '')
      .order('created_at', { ascending: false });
    if (data) setTrips(data as Trip[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const filtered = tab === 'all' ? trips : trips.filter((t) => t.status === tab);

  const counts = {
    all: trips.length,
    pending_payment: trips.filter((t) => t.status === 'pending_payment').length,
    planning: trips.filter((t) => t.status === 'planning').length,
    active: trips.filter((t) => t.status === 'active').length,
    completed: trips.filter((t) => t.status === 'completed').length,
  };

  const payTrip = async (trip: Trip) => {
    setPayingId(trip.id);
    const { data } = await supabase
      .from('trips')
      .update({ status: 'planning', updated_at: new Date().toISOString() })
      .eq('id', trip.id)
      .select('*')
      .single();
    if (data) {
      setTrips((prev) => prev.map((t) => (t.id === trip.id ? (data as Trip) : t)));
    }
    setPayingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 pt-10 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">我的行程</h1>
            <p className="text-white/60 text-xs mt-0.5">查看所有计划中的旅行</p>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                tab === id
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {label}
              {counts[id] > 0 && (
                <span className={`ml-1 text-[10px] ${tab === id ? 'text-white/70' : 'text-gray-400'}`}>
                  ({counts[id]})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-36 bg-gray-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Inbox className="w-16 h-16 text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-600">
              {tab === 'all' ? '暂无行程' : `暂无${STATUS_CONFIG[tab as string]?.label || ''}行程`}
            </p>
            <p className="text-xs text-gray-400 mt-1">去旅行主题页面报名即可生成行程</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((trip) => {
              const conf = STATUS_CONFIG[trip.status] || STATUS_CONFIG.planning;
              const StatusIcon = conf.icon;
              const img = tripImage(trip);
              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Trip image header */}
                  <div className="relative h-36">
                    <img src={img} alt={trip.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
                    <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${conf.badge}`}>
                      <StatusIcon className="w-3 h-3" />
                      {conf.label}
                    </span>
                    {!trip.is_public && (
                      <span className="absolute top-3 left-3 text-xs bg-slate-900/40 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />仅自己可见
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-base drop-shadow">{trip.title}</h3>
                      <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{trip.destination}
                      </p>
                    </div>
                  </div>

                  {/* Trip body */}
                  <div className="px-4 py-3">
                    {trip.description && (
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2">{trip.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {(trip.start_date || trip.end_date) ? (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {trip.start_date && formatDate(trip.start_date)}
                          {trip.start_date && trip.end_date && ' — '}
                          {trip.end_date && formatDate(trip.end_date)}
                        </p>
                      ) : (
                        <span className="text-xs text-gray-300">日期待定</span>
                      )}
                      <span className="text-xs text-slate-600 font-semibold flex items-center gap-0.5">
                        查看详情 <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Action footer */}
                  {trip.status === 'pending_payment' && (
                    <div className="px-4 py-3 bg-amber-50/50 border-t border-amber-50 flex items-center justify-between">
                      <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" /> 待付款后行程生效
                      </p>
                      <button
                        onClick={() => payTrip(trip)}
                        disabled={payingId === trip.id}
                        className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 flex items-center gap-1"
                      >
                        {payingId === trip.id ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            支付中
                          </>
                        ) : (
                          <>
                            <Wallet className="w-3.5 h-3.5" /> 立即付款
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {trip.status === 'active' && (
                    <div className="px-4 py-3 bg-emerald-50/50 border-t border-emerald-50">
                      <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <Plane className="w-3.5 h-3.5" /> 旅行进行中，祝您旅途愉快！
                      </p>
                    </div>
                  )}
                  {trip.status === 'completed' && (
                    <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-50">
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 行程已完成
                      </p>
                    </div>
                  )}
                  {trip.status === 'planning' && (
                    <div className="px-4 py-3 bg-sky-50/50 border-t border-sky-50">
                      <p className="text-xs text-sky-600 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 等待出行，管家将尽快联系您
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
