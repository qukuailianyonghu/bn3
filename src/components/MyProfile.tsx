import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Album,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  ClipboardList,
  Heart,
  History,
  Image as ImageIcon,
  LogOut,
  MapPin,
  Pencil,
  Plane,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRoundPlus,
  X,
} from 'lucide-react';
import MyOrders from './MyOrders';
import LifeMemoir from './LifeMemoir';
import WishList from './WishList';
import MyItineraries from './MyItineraries';
import MyActivities from './MyActivities';
import Membership from './Membership';
import { useTheme, type ThemeMode } from '../context/ThemeContext';

const AVATAR_PEXELS = [
  'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?w=200',
  'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?w=200',
  'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?w=200',
  'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=200',
  'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?w=200',
  'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?w=200',
];

const HERO_IMAGE = 'https://images.pexels.com/photos/33851769/pexels-photo-33851769.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

interface ProfileAction {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  tone: 'sand' | 'peach' | 'clay';
}

const TONE_STYLES: Record<ProfileAction['tone'], string> = {
  sand: 'from-[#f3eee3] to-[#e4d8c2] text-[#68452d]',
  peach: 'from-[#f4e2d0] to-[#e7c6ae] text-[#77412c]',
  clay: 'from-[#b3947c] to-[#6e4633] text-white',
};

export default function MyProfile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    age: profile?.age?.toString() || '',
    travel_style: profile?.travel_style || 'relaxed',
    interests: profile?.interests || [],
    avatar_url: profile?.avatar_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showMemoir, setShowMemoir] = useState(false);
  const [showWishList, setShowWishList] = useState(false);
  const [showItineraries, setShowItineraries] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [showMembership, setShowMembership] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        age: profile.age?.toString() || '',
        travel_style: profile.travel_style || 'relaxed',
        interests: profile.interests || [],
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name,
      bio: form.bio,
      location: form.location,
      age: form.age ? parseInt(form.age, 10) : null,
      travel_style: form.travel_style,
      interests: form.interests,
      avatar_url: form.avatar_url || null,
      updated_at: new Date().toISOString(),
    });
    await refreshProfile();
    setEditing(false);
    setSaving(false);
  };

  const initials = (profile?.full_name || user?.email || '?')[0].toUpperCase();
  const actionItems: ProfileAction[] = [
    { label: '订单', icon: ClipboardList, onClick: () => setShowOrders(true), tone: 'sand' },
    // { label: '行程', icon: Plane, onClick: () => setShowItineraries(true), tone: 'sand' },
    { label: '活动', icon: CalendarDays, onClick: () => setShowActivities(true), tone: 'peach' },
    // { label: '心愿清单', icon: Heart, onClick: () => setShowWishList(true), tone: 'sand' },
    // { label: '老照片高清修复', icon: ImageIcon, onClick: () => undefined, tone: 'clay' },
    // { label: '生成旅行纪念册', icon: Album, onClick: () => undefined, tone: 'clay' },
    // { label: '人生回忆录', icon: History, onClick: () => setShowMemoir(true), tone: 'sand' },
    { label: '成为会员', icon: UserRoundPlus, onClick: () => setShowMembership(true), tone: 'peach' },
  ];

  const getImageUrl = (name: string) => {
    return new URL(`../images/${name}`, import.meta.url).href;
  };

  return (
    <div className="min-h-screen bg-[#fbf7ef] pb-28 text-[#493323]">
      <section className="relative h-[268px] overflow-hidden">
        <img src={getImageUrl('my_top2.jpg')} alt="圣托里尼海边风景" className="absolute inset-0 h-full w-full object-cover" />
        {/*<div className="absolute inset-0 bg-gradient-to-b from-[#3b2b25]/55 via-[#76503b]/20 to-[#4c3327]/80" />*/}
        <div className="relative z-10 px-6 pt-8 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/15 backdrop-blur-sm">
              <Heart className="h-6 w-6" fill="currentColor" strokeWidth={1.6} />
            </div>
            <div>
              <p className="font-serif text-xl font-bold tracking-[0.16em]">伴龄</p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/80">BANLING</p>
            </div>
          </div>
          <h1 className="mt-7 font-serif text-[28px] font-bold leading-tight tracking-wide">遇见更好的自己</h1>
          <p className="mt-2 text-sm tracking-wide text-white/90">让每一份参与，都有价值</p>
          <div className="mt-5 h-0.5 w-10 bg-[#f5d6a1]" />
        </div>
      </section>

      <section className="relative z-20 -mt-5 px-4">
        <div className="rounded-[24px] border border-white/70 bg-[#f8f0e2]/95 px-4 py-4 shadow-[0_14px_35px_rgba(111,66,29,0.14)] backdrop-blur-sm sm:px-5">
          <div className="flex items-center gap-4">
            <div className="relative -mt-12 h-[92px] w-[92px] shrink-0 rounded-[22px] border-4 border-[#fffaf1] bg-gradient-to-br from-[#b99576] to-[#68452f] p-0.5 shadow-lg">
              <div className="h-full w-full overflow-hidden rounded-[17px]">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="头像" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">{initials}</div>
                )}
              </div>
              {editing && (
                <button onClick={() => setShowAvatarPicker(true)} className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#8f5524] text-white shadow-md" aria-label="更换头像">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-serif text-[25px] font-bold text-[#493323]">{profile?.full_name || '您的姓名'}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-[#775d47]"><MapPin className="h-4 w-4" />{profile?.location || '北京'}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#d9bc8c] bg-[#f8ecd4] px-3 py-1 text-xs font-semibold text-[#76502c]">
                <Sparkles className="h-3 w-3" />{profile?.travel_style === 'adventure' ? '探险旅行者' : '休闲旅行者'}
              </span>
            </div>
            <div className="self-start">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-full bg-[#fffaf1] px-4 py-2.5 text-sm font-semibold text-[#79583d] shadow-sm transition hover:bg-white">
                  <Pencil className="h-3.5 w-3.5" />编辑
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <button onClick={() => setEditing(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#79583d] shadow-sm" aria-label="取消编辑"><X className="h-4 w-4" /></button>
                  <button onClick={save} disabled={saving} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8f5524] text-white shadow-sm disabled:opacity-60" aria-label="保存资料"><Check className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-end bg-[#38271f]/55" onClick={() => setShowAvatarPicker(false)}>
          <div className="w-full rounded-t-[28px] bg-[#fffaf1] p-6" onClick={event => event.stopPropagation()}>
            <h3 className="mb-4 font-serif text-xl font-bold text-[#493323]">选择头像</h3>
            <div className="mb-4 grid grid-cols-3 gap-3">
              {AVATAR_PEXELS.map(url => (
                <button key={url} onClick={() => { setForm(current => ({ ...current, avatar_url: url })); setShowAvatarPicker(false); }} className={`aspect-square overflow-hidden rounded-2xl border-4 transition ${form.avatar_url === url ? 'border-[#8f5524]' : 'border-transparent'}`}>
                  <img src={url} alt="头像选项" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <input value={form.avatar_url} onChange={event => setForm(current => ({ ...current, avatar_url: event.target.value }))} placeholder="或粘贴图片链接..." className="mb-3 w-full rounded-xl border border-[#e0cfb5] bg-white px-4 py-3 text-sm outline-none focus:border-[#b0702e]" />
            <button onClick={() => setShowAvatarPicker(false)} className="w-full rounded-xl border border-[#dcc7a8] py-3 text-sm font-semibold text-[#6f421d]">完成</button>
          </div>
        </div>
      )}

      <main className="px-4 pt-5">
        {editing ? (
          <div className="rounded-3xl border border-[#eadcc6] bg-white/80 p-5 shadow-sm">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-[#654831]">姓名<input value={form.full_name} onChange={event => setForm({ ...form, full_name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[#e0cfb5] bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-[#b0702e]" /></label>
              <label className="block text-sm font-semibold text-[#654831]">所在地<input value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} placeholder="城市，国家" className="mt-1.5 w-full rounded-xl border border-[#e0cfb5] bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-[#b0702e]" /></label>
              <label className="block text-sm font-semibold text-[#654831]">个人简介<textarea value={form.bio} onChange={event => setForm({ ...form, bio: event.target.value })} rows={3} placeholder="分享一些关于您自己的故事..." className="mt-1.5 w-full resize-none rounded-xl border border-[#e0cfb5] bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-[#b0702e]" /></label>
            </div>
          </div>
        ) : (
          <>
            <p className="px-1 text-[15px] leading-relaxed text-[#806c58]">{profile?.bio || '暂无简介——点击编辑添加。'}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {actionItems.map(({ label, icon: Icon, onClick, tone }) => (
                <button key={label} onClick={onClick} className={`group relative flex min-h-[116px] flex-col items-center justify-center overflow-hidden rounded-[21px] bg-gradient-to-br ${TONE_STYLES[tone]} px-2 py-4 shadow-[0_7px_18px_rgba(111,66,29,0.09)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(111,66,29,0.16)] active:scale-95`}>
                  <span className="absolute -bottom-8 -right-5 h-20 w-20 rounded-full bg-white/20 transition group-hover:scale-125" />
                  <Icon className="relative h-8 w-8" strokeWidth={1.7} />
                  <span className="relative mt-3 text-center text-[13px] font-semibold leading-tight">{label}</span>
                  <ChevronRight className="absolute bottom-3 right-3 h-3.5 w-3.5 opacity-55" />
                </button>
              ))}
            </div>

            <section className="mt-8 pb-3">
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-2">
                  <Sun className="h-7 w-7 text-[#c8893e]" strokeWidth={1.7} />
                  <h3 className="font-serif text-[22px] font-bold text-[#493323]">主题设置</h3>
                </div>
                <div className="mb-2 h-px flex-1 bg-[#decfb9]" />
                <span className="mb-1 text-xs text-[#9b846b]">查看更多 <ChevronRight className="inline h-3 w-3" /></span>
              </div>
              <p className="mt-2 pl-9 text-sm text-[#8a745e]">选择适合您的界面风格，随时可切换</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ThemeOption id="youth" label="青年版" desc="标准字号 · 紧凑布局" active={theme === 'youth'} onClick={() => setTheme('youth')} />
                <ThemeOption id="senior" label="长辈版" desc="大字号 · 宽松排版" active={theme === 'senior'} onClick={() => setTheme('senior')} />
              </div>
            </section>

            <div className="mt-6 flex items-center gap-2 border-t border-[#eadcc6] pt-4 text-xs text-[#a28d77]">
              <ShieldCheck className="h-4 w-4 text-[#c8893e]" />{user?.email}
              <button onClick={signOut} className="ml-auto flex items-center gap-1.5 font-semibold text-[#a15d42] transition hover:text-[#7b3c2d]"><LogOut className="h-3.5 w-3.5" />退出登录</button>
            </div>
          </>
        )}
      </main>

      {showOrders && <MyOrders onClose={() => setShowOrders(false)} />}
      {showMemoir && <LifeMemoir onClose={() => setShowMemoir(false)} />}
      {showWishList && <WishList onClose={() => setShowWishList(false)} />}
      {showItineraries && <MyItineraries onClose={() => setShowItineraries(false)} />}
      {showActivities && <MyActivities onClose={() => setShowActivities(false)} />}
      {showMembership && <Membership onClose={() => setShowMembership(false)} />}
    </div>
  );
}

function ThemeOption({ id, label, desc, active, onClick }: { id: ThemeMode; label: string; desc: string; active: boolean; onClick: () => void }) {
  const isSenior = id === 'senior';
  return (
    <button onClick={onClick} className={`rounded-2xl border-2 p-3.5 text-left transition ${active ? isSenior ? 'border-[#c8893e] bg-[#fbf0dc] ring-2 ring-[#f0d9b5]' : 'border-[#7d9c8d] bg-[#eef5f0] ring-2 ring-[#d5e6dc]' : 'border-[#e6dac8] bg-white hover:border-[#d1b991]'}`}>
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${isSenior ? 'bg-[#c8893e]' : 'bg-[#719487]'}`} />
        <span className={`font-bold ${active ? 'text-[#654831]' : 'text-[#806c58]'}`}>{label}</span>
        {active && <Check className="ml-auto h-4 w-4 text-[#8f5524]" />}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-[#9a8771]">{desc}</p>
      <div className="mt-3 rounded-lg bg-[#fffaf1] px-2 py-1.5 text-center"><span className={`font-bold text-[#493323] ${isSenior ? 'text-base' : 'text-sm'}`}>示例文字</span></div>
    </button>
  );
}
