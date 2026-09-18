import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Check, Trash2, Pencil, Heart, Sparkles, Baby, Briefcase, CloudSun } from 'lucide-react';

interface Wish {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  category: string;
}

type CategoryKey = 'childhood' | 'middle_age' | 'old_age';

const CATEGORIES: { key: CategoryKey; label: string; desc: string; icon: typeof Baby; accent: string; accentBg: string; accentText: string; accentBorder: string; accentLight: string; accentGradient: string }[] = [
  {
    key: 'childhood',
    label: '童年心愿',
    desc: '那些纯真年代的小小梦想',
    icon: Baby,
    accent: 'sky',
    accentBg: 'bg-sky-500',
    accentText: 'text-sky-600',
    accentBorder: 'border-sky-200',
    accentLight: 'bg-sky-50',
    accentGradient: 'from-sky-400 to-sky-600',
  },
  {
    key: 'middle_age',
    label: '中年心愿',
    desc: '奋斗岁月里的人生期盼',
    icon: Briefcase,
    accent: 'amber',
    accentBg: 'bg-amber-500',
    accentText: 'text-amber-600',
    accentBorder: 'border-amber-200',
    accentLight: 'bg-amber-50',
    accentGradient: 'from-amber-400 to-amber-600',
  },
  {
    key: 'old_age',
    label: '晚年心愿',
    desc: '金色年华中的美好向往',
    icon: CloudSun,
    accent: 'rose',
    accentBg: 'bg-rose-500',
    accentText: 'text-rose-600',
    accentBorder: 'border-rose-200',
    accentLight: 'bg-rose-50',
    accentGradient: 'from-rose-400 to-rose-600',
  },
];

const SUGGESTED_WISHES: Record<CategoryKey, string[]> = {
  childhood: [
    '拥有一辆自己的自行车',
    '去动物园看大熊猫',
    '学会骑马',
    '在海边堆一座大沙堡',
    '放一次风筝飞得最高',
    '拥有一整套童话书',
    '去游乐园玩一整天',
    '学会游泳',
    '养一只小猫或小狗',
    '看一场露天电影',
  ],
  middle_age: [
    '和家人一起去一次长途旅行',
    '学会一门新乐器',
    '写一本属于自己的书',
    '种一棵属于自己的树',
    '和老朋友重新联系上',
    '学会做十道拿手菜',
    '完成一次独自背包旅行',
    '参加一次志愿者活动',
    '学会一门外语能日常交流',
    '看一次日出和日落',
  ],
  old_age: [
    '和老伴一起重游故地',
    '给孙辈写一本人生故事',
    '在院子里种满花草',
    '参加一次老年大学课程',
    '和的老朋友喝一次茶',
    '完成一次温泉旅行',
    '学会用手机拍出好看的照片',
    '给每一个家人写一封信',
    '看一次满天繁星',
    '参加一次社区合唱团',
  ],
};

export default function WishList({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCategory = CATEGORIES[currentPage];

  const loadWishes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('wishes')
      .select('id, title, completed, created_at, category')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setWishes(data as Wish[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadWishes();
  }, [loadWishes]);

  const categoryWishes = wishes.filter(w => w.category === currentCategory.key);
  const completedCount = categoryWishes.filter(w => w.completed).length;

  const addWish = async () => {
    if (!user || !newText.trim()) return;
    const { data, error } = await supabase
      .from('wishes')
      .insert({ title: newText.trim(), user_id: user.id, category: currentCategory.key })
      .select('id, title, completed, created_at, category')
      .single();
    if (!error && data) {
      setWishes(prev => [data as Wish, ...prev]);
      setNewText('');
      setAdding(false);
    }
  };

  const addSuggestedWish = async (text: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('wishes')
      .insert({ title: text, user_id: user.id, category: currentCategory.key })
      .select('id, title, completed, created_at, category')
      .single();
    if (!error && data) {
      setWishes(prev => [data as Wish, ...prev]);
    }
  };

  const toggleComplete = async (wish: Wish) => {
    const { error } = await supabase
      .from('wishes')
      .update({ completed: !wish.completed, updated_at: new Date().toISOString() })
      .eq('id', wish.id);
    if (!error) {
      setWishes(prev => prev.map(w => w.id === wish.id ? { ...w, completed: !w.completed } : w));
    }
  };

  const startEdit = (wish: Wish) => {
    setEditingId(wish.id);
    setEditText(wish.title);
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    const { error } = await supabase
      .from('wishes')
      .update({ title: editText.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setWishes(prev => prev.map(w => w.id === id ? { ...w, title: editText.trim() } : w));
      setEditingId(null);
      setEditText('');
    }
  };

  const deleteWish = async (id: string) => {
    const { error } = await supabase.from('wishes').delete().eq('id', id);
    if (!error) {
      setWishes(prev => prev.filter(w => w.id !== id));
    }
  };

  // ── Swipe handlers ──
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDelta(0);
    setIsSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = e.touches[0].clientX - touchStartX;
    setTouchDelta(delta);
  };

  const onTouchEnd = () => {
    setIsSwiping(false);
    const threshold = 60;
    if (touchDelta > threshold && currentPage > 0) {
      setCurrentPage(p => p - 1);
    } else if (touchDelta < -threshold && currentPage < CATEGORIES.length - 1) {
      setCurrentPage(p => p + 1);
    }
    setTouchStartX(null);
    setTouchDelta(0);
  };

  const pageOffset = isSwiping ? touchDelta : 0;

  return (
    <div className="fixed inset-0 bg-oshiruco-50 z-50 overflow-y-auto">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 bg-gradient-to-r from-oshiruco-600 to-oshiruco-700 text-white px-5 py-4 flex items-center gap-3 shadow-md z-10">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            <h1 className="text-lg font-bold">我的心愿单</h1>
          </div>
        </header>

        {/* Page tabs */}
        <div className="px-5 pt-4">
          <div className="flex bg-white rounded-2xl shadow-sm border border-oshiruco-100 p-1.5">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              const active = currentPage === i;
              return (
                <button
                  key={cat.key}
                  onClick={() => { setCurrentPage(i); setAdding(false); setEditingId(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-1 ${
                    active
                      ? `bg-gradient-to-br ${cat.accentGradient} text-white shadow-md`
                      : 'text-oshiruco-400 hover:text-oshiruco-600'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.8} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Swipeable pages */}
        <div
          ref={containerRef}
          className="overflow-hidden px-5 py-5"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(calc(-${currentPage * 100}% + ${pageOffset}px))`,
              transitionDuration: isSwiping ? '0ms' : '300ms',
            }}
          >
            {CATEGORIES.map((cat) => {
              const catWishes = wishes.filter(w => w.category === cat.key);
              const catCompleted = catWishes.filter(w => w.completed).length;
              const Icon = cat.icon;
              const isCurrent = cat.key === currentCategory.key;

              return (
                <div key={cat.key} className="w-full flex-shrink-0 px-1">
                  {/* Category header card */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-oshiruco-100 mb-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.accentGradient} flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h2 className={`font-bold text-lg ${cat.accentText}`}>{cat.label}</h2>
                        <p className="text-xs text-oshiruco-400">{cat.desc}</p>
                      </div>
                    </div>
                    {catWishes.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-2 ${cat.accentLight} rounded-full overflow-hidden`}>
                          <div
                            className={`h-full bg-gradient-to-r ${cat.accentGradient} rounded-full transition-all duration-500`}
                            style={{ width: `${(catCompleted / catWishes.length) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${cat.accentText}`}>{catCompleted}/{catWishes.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Add form */}
                  {isCurrent && adding && (
                    <div className={`bg-white rounded-2xl p-4 shadow-sm border ${cat.accentBorder} mb-4`}>
                      <textarea
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                        placeholder="写下你的心愿..."
                        rows={2}
                        autoFocus
                        className={`w-full px-3 py-2 rounded-xl border ${cat.accentBorder} focus:border-oshiruco-300 outline-none text-sm resize-none`}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={addWish}
                          className={`flex-1 py-2 ${cat.accentBg} text-white rounded-xl text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-1`}
                        >
                          <Check className="w-4 h-4" /> 添加
                        </button>
                        <button
                          onClick={() => { setAdding(false); setNewText(''); }}
                          className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Wish list or empty state */}
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-oshiruco-50" />
                      ))}
                    </div>
                  ) : catWishes.length === 0 ? (
                    <div className="bg-white rounded-2xl p-6 text-center border border-oshiruco-50">
                      <Icon className={`w-12 h-12 mx-auto mb-3 ${cat.accentLight} p-2 rounded-2xl ${cat.accentText}`} strokeWidth={1.5} />
                      <p className="font-semibold text-oshiruco-800 mb-1">还没有{cat.label}</p>
                      <p className="text-sm text-oshiruco-400 mb-4">从以下推荐中选择，或添加你自己的心愿</p>
                      <div className="space-y-2 text-left">
                        {SUGGESTED_WISHES[cat.key].map((wish, i) => (
                          <button
                            key={i}
                            onClick={() => addSuggestedWish(wish)}
                            className={`w-full text-left px-4 py-2.5 ${cat.accentLight} rounded-xl text-sm ${cat.accentText} hover:opacity-80 transition flex items-center gap-2`}
                          >
                            <Plus className="w-4 h-4 flex-shrink-0" /> {wish}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {catWishes.map(wish => (
                          <div
                            key={wish.id}
                            className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                              wish.completed ? `${cat.accentBorder} opacity-60` : 'border-oshiruco-50'
                            }`}
                          >
                            {editingId === wish.id ? (
                              <div>
                                <textarea
                                  value={editText}
                                  onChange={e => setEditText(e.target.value)}
                                  rows={2}
                                  autoFocus
                                  className={`w-full px-3 py-2 rounded-xl border ${cat.accentBorder} focus:border-oshiruco-300 outline-none text-sm resize-none`}
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => saveEdit(wish.id)}
                                    className={`flex-1 py-2 ${cat.accentBg} text-white rounded-xl text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-1`}
                                  >
                                    <Check className="w-4 h-4" /> 保存
                                  </button>
                                  <button
                                    onClick={() => { setEditingId(null); setEditText(''); }}
                                    className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => toggleComplete(wish)}
                                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                    wish.completed
                                      ? `${cat.accentBg} border-transparent`
                                      : `border-oshiruco-200 hover:${cat.accentBorder}`
                                  }`}
                                >
                                  {wish.completed && <Check className="w-4 h-4 text-white" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm leading-relaxed ${wish.completed ? 'line-through text-oshiruco-300' : 'text-oshiruco-700'}`}>
                                    {wish.title}
                                  </p>
                                  <p className="text-xs text-oshiruco-300 mt-1">
                                    {new Date(wish.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => startEdit(wish)}
                                    className="w-8 h-8 rounded-lg text-oshiruco-300 hover:bg-oshiruco-50 hover:text-oshiruco-500 flex items-center justify-center transition"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteWish(wish.id)}
                                    className="w-8 h-8 rounded-lg text-oshiruco-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Suggested wishes */}
                      {isCurrent && !adding && (
                        <div className="mt-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className={`w-4 h-4 ${cat.accentText}`} />
                            <h3 className={`text-sm font-bold ${cat.accentText}`}>推荐心愿</h3>
                          </div>
                          <div className="space-y-2">
                            {SUGGESTED_WISHES[cat.key].map((wish, i) => {
                              const alreadyAdded = catWishes.some(w => w.title === wish);
                              return (
                                <button
                                  key={i}
                                  onClick={() => !alreadyAdded && addSuggestedWish(wish)}
                                  disabled={alreadyAdded}
                                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition flex items-center gap-2 ${
                                    alreadyAdded
                                      ? 'bg-oshiruco-50 text-oshiruco-300 cursor-not-allowed'
                                      : `${cat.accentLight} ${cat.accentText} hover:opacity-80`
                                  }`}
                                >
                                  {alreadyAdded ? <Check className="w-4 h-4 flex-shrink-0" /> : <Plus className="w-4 h-4 flex-shrink-0" />}
                                  {wish}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Add custom wish button */}
                  {isCurrent && !adding && (
                    <button
                      onClick={() => setAdding(true)}
                      className={`w-full mt-4 py-3.5 border-2 border-dashed ${cat.accentBorder} rounded-2xl ${cat.accentText} font-semibold text-sm hover:opacity-70 transition flex items-center justify-center gap-1.5`}
                    >
                      <Plus className="w-5 h-5" /> 添加自定义心愿
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Page indicators */}
        <div className="flex justify-center gap-2 pb-6">
          {CATEGORIES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentPage(i); setAdding(false); setEditingId(null); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentPage === i ? 'w-8 bg-oshiruco-600' : 'w-2 bg-oshiruco-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
