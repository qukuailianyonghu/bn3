import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Event } from '../lib/database.types';
import { ChevronLeft, Calendar, Clock, MapPin, Users, Tag, CheckCircle, Share2, Trash2, CircleUser as UserCircle, Wallet } from 'lucide-react';

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

interface AttendeeProfile {
  full_name: string;
  avatar_url: string | null;
}

interface Props {
  event: Event;
  attending: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function EventDetail({ event, attending, onToggle, onClose }: Props) {
  const { user } = useAuth();
  const isOwner = event.user_id === user?.id;
  const isPast = new Date(event.event_date) < new Date();

  const [attendees, setAttendees] = useState<AttendeeProfile[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadAttendees();
  }, [event.id]);

  const loadAttendees = async () => {
    setLoadingAttendees(true);
    const { data } = await supabase
      .from('event_attendees')
      .select('profiles(full_name, avatar_url)')
      .eq('event_id', event.id);
    if (data) {
      setAttendees(data.map((r: { profiles: AttendeeProfile }) => r.profiles));
    }
    setLoadingAttendees(false);
  };

  const handleToggle = async () => {
    setToggling(true);
    await onToggle();
    await loadAttendees();
    setToggling(false);
  };

  const imgUrl = event.image_url || EVENT_IMGS[event.category] || EVENT_IMGS.social;
  const attendeeCount = attendees.length;
  const isFull = event.max_attendees !== null && attendeeCount >= event.max_attendees;
  const catLabel = CATEGORY_LABELS[event.category] || event.category;
  const catColor = CAT_COLORS[event.category] || 'bg-gray-100 text-gray-600';

  const eventDate = new Date(event.event_date);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up">
      {/* Hero image */}
      <div className="relative h-60 flex-shrink-0">
        <img src={imgUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <span className={`absolute top-4 right-4 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${catColor}`}>
          <Tag className="w-3 h-3" />{catLabel}
        </span>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg leading-tight">{event.title}</h1>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-32">
        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-50 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" />日期
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {eventDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            </p>
          </div>
          {event.event_time && (
            <div className="bg-gray-50 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                <Clock className="w-3.5 h-3.5" />时间
              </div>
              <p className="text-sm font-semibold text-gray-800">{event.event_time}</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <MapPin className="w-3.5 h-3.5" />地点
            </div>
            <p className="text-sm font-semibold text-gray-800 line-clamp-2">{event.location}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5" />参与
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {attendeeCount}{event.max_attendees ? ` / ${event.max_attendees}` : ' 人'} 人
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <Wallet className="w-3.5 h-3.5" />每人费用
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {event.fee != null ? `¥${event.fee.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '免费'}
            </p>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-800 mb-2">活动详情</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Organizer */}
        {(event.profiles as { full_name: string; avatar_url: string | null } | undefined) && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5 mb-6">
            {(event.profiles as { avatar_url: string | null }).avatar_url ? (
              <img
                src={(event.profiles as { avatar_url: string | null }).avatar_url}
                alt="organizer"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-rose-400" />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">主办方</p>
              <p className="text-sm font-semibold text-gray-800">{(event.profiles as { full_name: string }).full_name}</p>
            </div>
            {isOwner && (
              <span className="ml-auto text-xs text-rose-500 font-medium bg-rose-50 px-2.5 py-1 rounded-full">我的活动</span>
            )}
          </div>
        )}

        {/* Attendees list */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-800 mb-3">报名列表 ({attendeeCount})</h2>
          {loadingAttendees ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : attendees.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">暂无报名，快来成为第一个！</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {attendees.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt={a.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-5 h-5 text-rose-400" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-700 truncate">{a.full_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      {!isPast && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3.5 flex items-center gap-3">
          <button className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition flex-shrink-0">
            <Share2 className="w-5 h-5" />
          </button>
          {!isOwner ? (
            <button
              onClick={handleToggle}
              disabled={toggling || (isFull && !attending)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                attending
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                  : isFull
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-rose-500 text-white hover:bg-rose-600'
              } disabled:opacity-50`}
            >
              {toggling ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : attending ? (
                <><CheckCircle className="w-5 h-5" />已报名 — 点击取消</>
              ) : isFull ? '名额已满' : '立即报名'}
            </button>
          ) : (
            <div className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 bg-gray-50 text-center">
              您是本活动的主办方
            </div>
          )}
        </div>
      )}
    </div>
  );
}
