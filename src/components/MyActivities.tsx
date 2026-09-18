import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { MyEventAttendance, EventPaymentStatus } from '../lib/database.types';
import {
  ChevronLeft, Clock, Wallet, CheckCircle2, XCircle,
  Calendar, MapPin, Tag, Users, ChevronRight, Inbox,
} from 'lucide-react';

type StatusFilter = 'all' | EventPaymentStatus;

const STATUS_CONFIG: Record<EventPaymentStatus, {
  label: string;
  icon: React.FC<{ className?: string }>;
  badge: string;
  dot: string;
  accent: string;
}> = {
  pending_payment: {
    label: '待付款',
    icon: Wallet,
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    accent: 'text-amber-600',
  },
  paid: {
    label: '已付款',
    icon: CheckCircle2,
    badge: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-500',
    accent: 'text-sky-600',
  },
  not_attended: {
    label: '未参加',
    icon: XCircle,
    badge: 'bg-gray-100 text-gray-500',
    dot: 'bg-gray-400',
    accent: 'text-gray-400',
  },
  attended: {
    label: '已参加',
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    accent: 'text-emerald-600',
  },
};

const TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'pending_payment', label: '待付款' },
  { id: 'paid', label: '已付款' },
  { id: 'not_attended', label: '未参加' },
  { id: 'attended', label: '已参加' },
];

const CAT_COLORS: Record<string, string> = {
  social: 'bg-rose-100 text-rose-700',
  cultural: 'bg-amber-100 text-amber-700',
  outdoor: 'bg-emerald-100 text-emerald-700',
  food: 'bg-orange-100 text-orange-700',
  wellness: 'bg-teal-100 text-teal-700',
  tour: 'bg-sky-100 text-sky-700',
  workshop: 'bg-violet-100 text-violet-700',
};

const CAT_LABELS: Record<string, string> = {
  social: '订阅', cultural: '社交', outdoor: '户外',
  food: '美食', wellness: '健康', tour: '游览', workshop: '工作坊',
};

const EVENT_IMGS: Record<string, string> = {
  social: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?w=600',
  cultural: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?w=600',
  outdoor: 'https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg?w=600',
  food: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=600',
  wellness: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?w=600',
  tour: 'https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg?w=600',
  workshop: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?w=600',
};

function eventImage(category: string): string {
  return EVENT_IMGS[category] || EVENT_IMGS.social;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MyActivities({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<MyEventAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusFilter>('all');
  const [payingId, setPayingId] = useState<string | null>(null);

  const loadAttendances = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('event_attendees')
      .select('id, event_id, user_id, payment_status, created_at, events(*)')
      .eq('user_id', user?.id || '')
      .order('created_at', { ascending: false });
    if (data) setAttendances(data as unknown as MyEventAttendance[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAttendances();
  }, [loadAttendances]);

  const filtered = tab === 'all' ? attendances : attendances.filter((a) => a.payment_status === tab);

  const counts = {
    all: attendances.length,
    pending_payment: attendances.filter((a) => a.payment_status === 'pending_payment').length,
    paid: attendances.filter((a) => a.payment_status === 'paid').length,
    not_attended: attendances.filter((a) => a.payment_status === 'not_attended').length,
    attended: attendances.filter((a) => a.payment_status === 'attended').length,
  };

  const payForEvent = async (attendance: MyEventAttendance) => {
    setPayingId(attendance.id);
    const { data } = await supabase
      .from('event_attendees')
      .update({ payment_status: 'paid' })
      .eq('id', attendance.id)
      .select('id, event_id, user_id, payment_status, created_at, events(*)')
      .single();
    if (data) {
      setAttendances((prev) =>
        prev.map((a) => (a.id === attendance.id ? (data as unknown as MyEventAttendance) : a))
      );
    }
    setPayingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-5 pt-10 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">我的活动</h1>
            <p className="text-white/60 text-xs mt-0.5">查看我报名的所有活动</p>
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
                  ? 'bg-rose-500 text-white shadow-sm'
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

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-32 bg-gray-100 animate-pulse" />
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
              {tab === 'all' ? '暂无活动' : `暂无${STATUS_CONFIG[tab as EventPaymentStatus]?.label || ''}活动`}
            </p>
            <p className="text-xs text-gray-400 mt-1">去活动页面报名即可查看</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((att) => {
              const ev = att.events;
              if (!ev) return null;
              const conf = STATUS_CONFIG[att.payment_status] || STATUS_CONFIG.paid;
              const StatusIcon = conf.icon;
              const img = ev.image_url || eventImage(ev.category);
              const catColor = CAT_COLORS[ev.category] || 'bg-gray-100 text-gray-600';
              const catLabel = CAT_LABELS[ev.category] || ev.category;
              const isPast = new Date(ev.event_date) < new Date();
              return (
                <div
                  key={att.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Image header */}
                  <div className="relative h-32">
                    <img src={img} alt={ev.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
                    <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${conf.badge}`}>
                      <StatusIcon className="w-3 h-3" />
                      {conf.label}
                    </span>
                    <span className={`absolute top-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
                      <Tag className="w-3 h-3 inline mr-0.5" />{catLabel}
                    </span>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-base drop-shadow">{ev.title}</h3>
                      <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{ev.location}
                      </p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ev.event_date)}
                        {ev.event_time && <span className="ml-1 flex items-center gap-0.5"><Clock className="w-3 h-3" />{ev.event_time}</span>}
                      </p>
                      {ev.fee != null && ev.fee > 0 && (
                        <span className="text-xs font-semibold text-amber-600 flex items-center gap-0.5">
                          <Wallet className="w-3 h-3" />¥{ev.fee.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}/人
                        </span>
                      )}
                    </div>

                    {/* Action footer */}
                    {att.payment_status === 'pending_payment' && (
                      <div className="mt-2 pt-2 border-t border-amber-50 flex items-center justify-between">
                        <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" /> 请完成付款
                        </p>
                        <button
                          onClick={() => payForEvent(att)}
                          disabled={payingId === att.id}
                          className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 flex items-center gap-1"
                        >
                          {payingId === att.id ? (
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
                    {att.payment_status === 'paid' && (
                      <div className="mt-2 pt-2 border-t border-sky-50">
                        <p className="text-xs text-sky-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isPast ? '活动已结束，待确认参加' : '已付款，等待活动开始'}
                        </p>
                      </div>
                    )}
                    {att.payment_status === 'not_attended' && (
                      <div className="mt-2 pt-2 border-t border-gray-50">
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> 活动已结束，未参加
                        </p>
                      </div>
                    )}
                    {att.payment_status === 'attended' && (
                      <div className="mt-2 pt-2 border-t border-emerald-50">
                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已参加活动
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
