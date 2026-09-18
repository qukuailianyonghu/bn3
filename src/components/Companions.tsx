import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Profile, CompanionRequest } from '../lib/database.types';
import CompanionCare from './CompanionCare';
import LifeMemoir from './LifeMemoir';
import OldPhotoRestoration from './OldPhotoRestoration';
import TravelSouvenirAlbum from './TravelSouvenirAlbum';
import WishList from './WishList';
import {
  Users, MapPin, Send, Heart, MessageSquare, UserCheck,
  Sparkles, Phone,
  BookOpen, Wand2, Plane, Heart as HeartIcon, ArrowRight, ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import SendMessage from './SendMessage';

const STYLE_LABELS: Record<string, string> = {
  relaxed: '休闲', adventure: '探险', cultural: '文化',
  luxury: '奢华', budget: '经济', eco: '生态',
};

const STYLE_COLORS: Record<string, string> = {
  relaxed: 'bg-sky-100 text-sky-700',
  adventure: 'bg-orange-100 text-orange-700',
  cultural: 'bg-amber-100 text-amber-700',
  luxury: 'bg-violet-100 text-violet-700',
  budget: 'bg-emerald-100 text-emerald-700',
  eco: 'bg-teal-100 text-teal-700',
};

const INTEREST_COLORS = [
  'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700', 'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700',
];

const AVATAR_GRADIENT = [
  'from-emerald-400 to-teal-500', 'from-sky-400 to-blue-500',
  'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500',
  'from-violet-400 to-purple-500', 'from-teal-400 to-cyan-500',
];

const HERO_IMAGE = 'https://images.pexels.com/photos/4080388/pexels-photo-4080388.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

function interestColor(interest: string) {
  let h = 0;
  for (let i = 0; i < interest.length; i++) h = (h * 31 + interest.charCodeAt(i)) % INTEREST_COLORS.length;
  return INTEREST_COLORS[h];
}

function avatarGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_GRADIENT.length;
  return AVATAR_GRADIENT[h];
}

function scoreCompatibility(me: Profile | null, other: Profile): number {
  if (!me) return 0;
  let score = 0;
  if (me.travel_style === other.travel_style) score += 3;
  if (me.location === other.location) score += 2;
  const sharedInterests = (me.interests || []).filter(i => (other.interests || []).includes(i));
  score += sharedInterests.length;
  return score;
}

type ModuleKey = 'memory' | 'photo' | 'souvenir' | 'wish' | 'care' | 'friends';

const MODULES: { key: ModuleKey; label: string; desc: string; icon: LucideIcon; iconColor: string }[] = [
  { key: 'memory', label: '人生记忆银行', desc: '珍藏人生珍贵时刻', icon: BookOpen, iconColor: 'text-[#8f5524]' },
  { key: 'photo', label: '老照片高清修复', desc: 'AI修复 · 让回忆焕新', icon: Wand2, iconColor: 'text-[#a6713e]' },
  { key: 'souvenir', label: '旅行纪念册', desc: '收藏每一段旅途', icon: Plane, iconColor: 'text-[#6f421d]' },
  { key: 'wish', label: '心愿清单', desc: '记录想做的事与梦想', icon: HeartIcon, iconColor: 'text-[#b0702e]' },
];

export default function Companions() {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<CompanionRequest[]>([]);
  const [tab, setTab] = useState<'modules' | 'care' | 'friends'>('modules');
  const [search] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState<Profile | null>(null);
  const [messageTo, setMessageTo] = useState<Profile | null>(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(null);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [membersRes, requestsRes] = await Promise.all([
      supabase.from('profiles').select('*').neq('id', user?.id || '').order('created_at', { ascending: false }),
      user
          ? supabase.from('companion_requests')
              .select('*, from_profile:profiles!from_user_id(full_name, avatar_url, location, travel_style, age, interests), to_profile:profiles!to_user_id(full_name, avatar_url, location, travel_style, age, interests)')
              .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
    ]);
    if (membersRes.data) setMembers(membersRes.data as Profile[]);
    if (requestsRes.data) setRequests(requestsRes.data as CompanionRequest[]);
    setLoading(false);
  };

  const sendRequest = async () => {
    if (!user || !showRequest) return;
    setSubmitting(true);
    await supabase.from('companion_requests').insert({
      from_user_id: user.id,
      to_user_id: showRequest.id,
      message: requestMsg,
      status: 'pending',
      trip_id: null,
    } as never);
    setShowRequest(null);
    setRequestMsg('');
    await loadData();
    setSubmitting(false);
  };

  const sentRequests = new Set(requests.filter(r => r.from_user_id === user?.id).map(r => r.to_user_id));
  const myConnections = requests.filter(r => (r.from_user_id === user?.id || r.to_user_id === user?.id) && r.status === 'accepted');
  const connectedIds = new Set(myConnections.flatMap(r => [r.from_user_id, r.to_user_id]));

  const filtered = members.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
        m.full_name.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q) ||
        (m.interests || []).some(i => i.toLowerCase().includes(q))
    );
  });

  const recommended = [...filtered]
      .filter(m => !connectedIds.has(m.id) && !sentRequests.has(m.id))
      .sort((a, b) => scoreCompatibility(profile, b) - scoreCompatibility(profile, a))
      .slice(0, 5);

  const allOthers = filtered.filter(m => !recommended.find(r => r.id === m.id));

  const renderModule = () => {
    switch (activeModule) {
      case 'memory': return <LifeMemoir onClose={() => setActiveModule(null)} />;
      case 'photo': return <OldPhotoRestoration onClose={() => setActiveModule(null)} />;
      case 'souvenir': return <TravelSouvenirAlbum onClose={() => setActiveModule(null)} />;
      case 'wish': return <WishList onClose={() => setActiveModule(null)} />;
      default: return null;
    }
  };

  const getImageUrl = (name: string) => {
    return new URL(`../images/${name}`, import.meta.url).href;
  };

  return (
      <div className="min-h-screen bg-[#fbf7ef] pb-24 text-[#493323]">
        {/* Hero — warm sunset image with brown overlay */}
        <section className="relative h-[260px] overflow-hidden">
          <img src={getImageUrl('jiyi_top.jpg')} alt="人生记忆" className="absolute inset-0 h-full w-full object-cover" />
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
            <h1 className="mt-7 font-serif text-[27px] font-bold leading-tight tracking-wide">人生记忆银行</h1>
            <p className="mt-2 text-sm tracking-wide text-white/90">多年后我们希望这个世界还记得，我们曾经来过</p>
            <div className="mt-5 h-0.5 w-10 bg-[#f5d6a1]" />
          </div>
        </section>

        {/* Floating cream card overlapping hero */}
        <section className="relative z-20 -mt-6 px-4">
          <div className="rounded-[24px] border border-white/70 bg-[#f8f0e2]/95 px-4 py-4 shadow-[0_14px_35px_rgba(111,66,29,0.14)] backdrop-blur-sm sm:px-5">
            <p className="text-[15px] leading-relaxed text-[#806c58]">
              在这里，珍藏你的故事与回忆。人生每一段时光都值得被记住——无论是旅途的风景、岁月的照片，还是心中的梦想。
            </p>
            {/*<div className="mt-3 flex items-center gap-2 text-xs text-[#a28d77]">*/}
            {/*  <ShieldCheck className="h-4 w-4 text-[#c8893e]" />*/}
            {/*  <span>本人確認制 · 安心安全のコミュニティ</span>*/}
            {/*</div>*/}
          </div>
        </section>

        {/* Tab switcher */}
        <div className="px-4 mt-5">
          <div className="flex rounded-2xl bg-[#f0e6d3] p-1">
            {(['modules', 'care'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setActiveModule(null); }}
                        className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 ${tab === t ? 'bg-white text-[#7d5430] shadow-sm' : 'text-[#a08868] hover:text-[#7d5430]'}`}>
                  {t === 'modules' ? '记忆珍藏' : '伴伴关怀' }
                </button>
            ))}
          </div>
        </div>

        {/* ── MODULES TAB ── */}
        {tab === 'modules' && (
            <div className="px-4 mt-5 space-y-3">
              <p className="text-xs font-semibold text-[#a08868] tracking-widest">珍藏美好回忆</p>
              {MODULES.map(mod => (
                  <button
                      key={mod.key}
                      onClick={() => setActiveModule(mod.key)}
                      className="group w-full overflow-hidden rounded-[20px] border border-[#eadcc6] bg-white/80 text-left shadow-[0_4px_14px_rgba(111,66,29,0.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(111,66,29,0.13)] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f3eee3] to-[#e4d8c2] shadow-inner">
                        <mod.icon className={`h-7 w-7 ${mod.iconColor}`} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-base font-bold text-[#493323]">{mod.label}</h3>
                        <p className="mt-0.5 text-xs text-[#9a8771]">{mod.desc}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[#c4ad8b] transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
              ))}
            </div>
        )}

        {/* ── CARE TAB ── */}
        {tab === 'care' && (
          <div className="px-4 mt-5">
            <CompanionCare />
          </div>
        )}

        {/* ── FRIENDS TAB ── */}
        {tab === 'friends' && (
            <div className="px-4 mt-5">
              {loading ? (
                    <div className="space-y-4">
                      <div className="h-6 w-40 bg-[#f0e6d3] rounded-full animate-pulse mb-3" />
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {[...Array(3)].map((_, i) => <div key={i} className="w-52 h-64 flex-shrink-0 bg-[#f0e6d3] rounded-3xl animate-pulse" />)}
                      </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-[#a08868]">
                      <Users className="mx-auto mb-3 h-14 w-14 opacity-30" />
                      <p className="font-semibold text-[#7d5430]">未找到会员</p>
                      <p className="mt-1 text-sm">请尝试其他搜索词</p>
                    </div>
                ) : (
                    <>
                      {recommended.length > 0 && !search && (
                          <div className="mb-6">
                            <div className="mb-3 flex items-center justify-between">
                              <h2 className="flex items-center gap-2 text-base font-bold text-[#493323]">
                                <Sparkles className="h-4 w-4 text-[#c8893e]" />
                                为您推荐
                              </h2>
                              <span className="text-xs text-[#a08868]">{recommended.length} 个匹配</span>
                            </div>
                            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3 scrollbar-hide">
                              {recommended.map(member => {
                                const sharedInterests = profile ? (profile.interests || []).filter(i => (member.interests || []).includes(i)) : [];
                                return <RecommendedCard key={member.id} member={member} sharedInterests={sharedInterests} onConnect={() => setShowRequest(member)} onMessage={() => setMessageTo(member)} />;
                              })}
                            </div>
                          </div>
                      )}

                      {(search || allOthers.length > 0) && (
                          <>
                            <h2 className="mb-3 text-base font-bold text-[#493323]">
                              {search ? `搜索结果（${filtered.length}）` : '我的好友'}
                            </h2>
                            <div className="space-y-3">
                              {(search ? filtered : allOthers).map(member => {
                                const alreadySent = sentRequests.has(member.id);
                                const connected = connectedIds.has(member.id);
                                return <MemberRow key={member.id} member={member} connected={connected} alreadySent={alreadySent} onConnect={() => setShowRequest(member)} onMessage={() => setMessageTo(member)} />;
                              })}
                            </div>
                          </>
                      )}
                    </>
                )}
            </div>
        )}

        {/* Module overlays */}
        {activeModule && renderModule()}

        {messageTo && (
            <SendMessage recipient={messageTo} onClose={() => setMessageTo(null)} />
        )}

        {showRequest && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
              <div className="bg-[#fffaf1] w-full rounded-t-3xl p-6 animate-slide-up">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient(showRequest.full_name)} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                    {showRequest.avatar_url ? <img src={showRequest.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-2xl">{showRequest.full_name[0]}</span>}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#493323]">{showRequest.full_name}</h3>
                    <p className="text-sm text-[#9a8771]">{[showRequest.age && `${showRequest.age} 岁`, showRequest.location].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
                {showRequest.interests && showRequest.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {showRequest.interests.slice(0, 5).map(i => <span key={i} className={`text-xs px-2.5 py-1 rounded-full ${interestColor(i)}`}>{i}</span>)}
                    </div>
                )}
                <p className="text-sm text-[#9a8771] mb-3">添加一条个人留言</p>
                <textarea value={requestMsg} onChange={e => setRequestMsg(e.target.value)} placeholder={`你好 ${showRequest.full_name.split(' ')[0]}，很想和您一起探索世界！`} rows={3} className="w-full px-4 py-3 rounded-xl border border-[#e0cfb5] focus:border-[#b0702e] outline-none text-sm resize-none mb-4 bg-[#fffdf9]" />
                <div className="flex gap-3">
                  <button onClick={() => setShowRequest(null)} className="flex-1 py-3 rounded-xl border border-[#dcc7a8] text-[#7d5430] font-medium text-sm">取消</button>
                  <button onClick={sendRequest} disabled={submitting} className="flex-1 py-3 rounded-xl bg-[#8f5524] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#6f421d] transition disabled:opacity-60">
                    <Send className="w-4 h-4" /> 发送请求
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Floating contact button */}
        <a
            href="tel:12349"
            className="fixed bottom-24 right-4 z-40 flex items-center gap-2 bg-gradient-to-r from-[#b0702e] to-[#6f421d] text-white pl-4 pr-5 py-3.5 rounded-full shadow-xl shadow-[#6f421d]/30 hover:shadow-[#6f421d]/50 hover:scale-105 active:scale-95 transition-all duration-200 group"
        >
          <span className="absolute inset-0 rounded-full bg-[#c8893e] animate-ping opacity-20" />
          <span className="relative w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition">
          <Phone className="w-3.5 h-3.5 text-white" />
        </span>
          <span className="relative font-bold text-sm tracking-wide">联系客服</span>
        </a>
      </div>
  );
}

function RecommendedCard({ member, sharedInterests, onConnect, onMessage }: { member: Profile; sharedInterests: string[]; onConnect: () => void; onMessage: () => void }) {
  return (
      <div className="flex-shrink-0 w-52 bg-white rounded-3xl shadow-sm border border-[#eadcc6] overflow-hidden hover:shadow-md transition-shadow">
        <div className={`h-28 bg-gradient-to-br ${avatarGradient(member.full_name)} relative flex items-center justify-center`}>
          {member.avatar_url ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-extrabold text-5xl opacity-80">{member.full_name[0]}</span>}
          {member.travel_style && (
              <span className={`absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${STYLE_COLORS[member.travel_style] || 'bg-[#f3eee3] text-[#7d5430]'} shadow-sm`}>
            {STYLE_LABELS[member.travel_style] || member.travel_style}
          </span>
          )}
        </div>
        <div className="p-3">
          <p className="font-bold text-[#493323] text-sm truncate">{member.full_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 mb-2">
            {member.age && <span className="text-xs text-[#9a8771] font-medium">{member.age} 岁</span>}
            {member.age && member.location && <span className="text-[#c4ad8b]">·</span>}
            {member.location && <span className="text-xs text-[#a08868] flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{member.location}</span>}
          </div>
          {member.interests && member.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {member.interests.slice(0, 3).map(interest => (
                    <span key={interest} className={`text-xs px-2 py-0.5 rounded-full font-medium ${interestColor(interest)} ${sharedInterests.includes(interest) ? 'ring-1 ring-offset-0 ring-current' : ''}`}>{interest}</span>
                ))}
                {member.interests.length > 3 && <span className="text-xs text-[#a08868]">+{member.interests.length - 3}</span>}
              </div>
          )}
          {sharedInterests.length > 0 && <p className="text-xs text-[#8f5524] font-medium mb-2">{sharedInterests.length} 个共同兴趣</p>}
          <div className="flex gap-2">
            <button onClick={onConnect} className="flex-1 py-2 rounded-xl bg-[#8f5524] hover:bg-[#6f421d] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition">
              <Heart className="w-3.5 h-3.5" /> 结交好友
            </button>
            <button onClick={onMessage} className="flex-1 py-2 rounded-xl bg-[#f3eee3] hover:bg-[#e4d8c2] text-[#7d5430] text-xs font-semibold flex items-center justify-center gap-1.5 transition">
              <MessageSquare className="w-3.5 h-3.5" /> 发消息
            </button>
          </div>
        </div>
      </div>
  );
}

function MemberRow({ member, connected, alreadySent, onConnect, onMessage }: { member: Profile; connected: boolean; alreadySent: boolean; onConnect: () => void; onMessage: () => void }) {
  return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#eadcc6]">
        <div className="flex items-start gap-3">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient(member.full_name)} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
            {member.avatar_url ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xl">{member.full_name[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-[#493323]">{member.full_name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {member.age && <span className="text-xs text-[#9a8771]">{member.age} 岁</span>}
                  {member.location && <span className="text-xs text-[#a08868] flex items-center gap-0.5"><MapPin className="w-3 h-3" />{member.location}</span>}
                </div>
              </div>
              {connected ? (
                  <span className="flex-shrink-0 flex items-center gap-1 text-xs text-[#8f5524] font-semibold bg-[#f3eee3] px-2.5 py-1 rounded-full"><UserCheck className="w-3.5 h-3.5" />好友</span>
              ) : alreadySent ? (
                  <span className="flex-shrink-0 text-xs text-[#a08868] font-medium bg-[#f3eee3] px-2.5 py-1 rounded-full">已发送</span>
              ) : (
                  <button onClick={onConnect} className="flex-shrink-0 bg-[#8f5524] hover:bg-[#6f421d] text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition">
                    <Heart className="w-3.5 h-3.5" /> 结交
                  </button>
              )}
            </div>
            {member.travel_style && (
                <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${STYLE_COLORS[member.travel_style] || 'bg-[#f3eee3] text-[#7d5430]'}`}>
              {STYLE_LABELS[member.travel_style] || member.travel_style}旅行者
            </span>
            )}
            {member.interests && member.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {member.interests.slice(0, 4).map(interest => <span key={interest} className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${interestColor(interest)}`}>{interest}</span>)}
                  {member.interests.length > 4 && <span className="text-xs text-[#a08868] self-center">+{member.interests.length - 4} 更多</span>}
                </div>
            )}
            <button onClick={onMessage} className="mt-3 w-full py-2 rounded-xl bg-[#f3eee3] hover:bg-[#e4d8c2] text-[#7d5430] text-xs font-semibold flex items-center justify-center gap-1.5 transition">
              <MessageSquare className="w-3.5 h-3.5" /> 发消息
            </button>
          </div>
        </div>
      </div>
  );
}
