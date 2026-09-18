import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Trip } from '../lib/database.types';
import { ChevronLeft, MapPin, Calendar, Clock, Plane, CheckCircle2, Trash2, Save, Lock, Globe } from 'lucide-react';

interface TripDetailProps {
  trip: Trip;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

const STATUS_OPTIONS: { value: Trip['status']; label: string; icon: typeof Clock }[] = [
  { value: 'planning', label: '待管家联系', icon: Clock },
  { value: 'active', label: '进行中', icon: Plane },
  { value: 'completed', label: '已完成', icon: CheckCircle2 },
];

const STATUS_STYLE: Record<Trip['status'], string> = {
  planning: 'bg-amber-100 text-amber-700',
  active: 'bg-teal-100 text-teal-700',
  completed: 'bg-gray-100 text-gray-600',
};

export default function TripDetail({ trip, onClose, onUpdated, onDeleted }: TripDetailProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    title: trip.title,
    destination: trip.destination,
    description: trip.description,
    start_date: trip.start_date ?? '',
    end_date: trip.end_date ?? '',
    status: trip.status,
    is_public: trip.is_public,
  });

  useEffect(() => {
    setForm({
      title: trip.title,
      destination: trip.destination,
      description: trip.description,
      start_date: trip.start_date ?? '',
      end_date: trip.end_date ?? '',
      status: trip.status,
      is_public: trip.is_public,
    });
  }, [trip]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from('trips').update({
      title: form.title,
      destination: form.destination,
      description: form.description,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      is_public: form.is_public,
    }).eq('id', trip.id);
    setSaving(false);
    setEditing(false);
    onUpdated();
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    await supabase.from('trips').delete().eq('id', trip.id);
    setDeleting(false);
    onDeleted();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      {/* Hero */}
      <div className="relative h-56">
        <img
          src="https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg"
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${STATUS_STYLE[trip.status]}`}>
              {(() => { const Opt = STATUS_OPTIONS.find(o => o.value === trip.status)?.icon ?? Clock; return <Opt className="w-3 h-3" />; })()}
              {STATUS_OPTIONS.find(o => o.value === trip.status)?.label}
            </span>
            <span className="text-xs bg-black/40 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              {trip.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {trip.is_public ? '公开' : '仅自己可见'}
            </span>
          </div>
          <h1 className="text-white font-extrabold text-xl drop-shadow">{trip.title}</h1>
          <p className="text-white/85 text-sm flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />{trip.destination}
          </p>
        </div>
      </div>

      <div className="p-5 pb-28">
        {!editing ? (
          <>
            {/* Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <h2 className="text-sm font-bold text-gray-800 mb-3">行程详情</h2>
              {trip.description ? (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{trip.description}</p>
              ) : (
                <p className="text-sm text-gray-400">暂无行程描述</p>
              )}
              {(trip.start_date || trip.end_date) && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  {trip.start_date && formatDate(trip.start_date)}
                  {trip.start_date && trip.end_date && ' — '}
                  {trip.end_date && formatDate(trip.end_date)}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-sky-700 transition shadow-sm"
              >
                <Save className="w-4 h-4" /> 编辑行程
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 py-3 rounded-xl border border-rose-200 text-rose-600 font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-rose-50 transition"
              >
                <Trash2 className="w-4 h-4" /> 取消行程
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 mb-4">编辑行程</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">行程标题 *</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">目的地 *</label>
                <input
                  value={form.destination}
                  onChange={e => setForm({ ...form, destination: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 outline-none text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">出发日期</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">返回日期</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">行程简介</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 outline-none text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">状态</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as Trip['status'] })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 outline-none text-sm bg-white"
                >
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 py-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_public: !form.is_public })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${form.is_public ? 'bg-sky-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_public ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-gray-700">分享至社区</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-sky-600 text-white font-medium text-sm disabled:opacity-60"
                >
                  {saving ? '保存中…' : '保存修改'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-1.5">确认取消该行程？</h3>
            <p className="text-center text-sm text-gray-500 mb-6">取消后将永久删除此行程，此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm"
              >
                再想想
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-semibold text-sm disabled:opacity-60"
              >
                {deleting ? '删除中…' : '确认取消'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
