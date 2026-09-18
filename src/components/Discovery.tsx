import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Destination, Post } from '../lib/database.types';
import {
  MapPin,
  Star,
  Heart,
  MessageCircle,
  Search,
  TrendingUp,
  Globe,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  Sparkles,
  BookOpen
} from 'lucide-react';
import DestinationDetail from './DestinationDetail';
import PostDetail from './PostDetail';

const CATEGORY_COLORS: Record<string, string> = {
  scenic: 'bg-sky-100 text-sky-700',
  cultural: 'bg-oshiruco-100 text-oshiruco-700',
  nature: 'bg-emerald-100 text-emerald-700',
  city: 'bg-sky-100 text-sky-700',
  beach: 'bg-cyan-100 text-cyan-700',
  '红色': 'bg-red-100 text-red-700',
  '欧洲': 'bg-sky-100 text-sky-700',
  '日本': 'bg-rose-100 text-rose-700',
  '宗教': 'bg-oshiruco-100 text-oshiruco-700',
};

const TRAVEL_QUOTES = [
  '「世界是一本书，不旅行的人只读了其中一页。」— 圣奥古斯丁',
  '「冒险本身就是有价值的。」— 艾米莉·埃尔哈特',
  '「走得够远，你便遇见自己。」— 大卫·米切尔',
  '「生命短暂，世界广阔。」— 西蒙·雷文',
];

const FALLBACK_POST_IMAGES = [
  'https://images.pexels.com/photos/7787410/pexels-photo-7787410.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/32638510/pexels-photo-32638510.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8170252/pexels-photo-8170252.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/16901403/pexels-photo-16901403.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7232988/pexels-photo-7232988.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8631570/pexels-photo-8631570.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/1850623/pexels-photo-1850623.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/33694822/pexels-photo-33694822.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

function fallbackImage(postId: string): string {
  let h = 0;
  for (let i = 0; i < postId.length; i++) h = (h * 31 + postId.charCodeAt(i)) % FALLBACK_POST_IMAGES.length;
  return FALLBACK_POST_IMAGES[h];
}

const SCROLL_BANNER_IMAGES = [
  'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/2225442/pexels-photo-2225442.jpeg?auto=compress&cs=tinysrgb&w=600',
];

const getImageUrl = (name: string) => {
  return new URL(`../images/${name}`, import.meta.url).href;
};

const HERO_SLIDES = [
  { image: getImageUrl('d1.jpg'), location: '旅行' },
  { image: getImageUrl('d2.jpg'), location: '生活' },
  { image: getImageUrl('d3.jpg'), location: '陪伴' },
  { image: getImageUrl('d4.jpg'), location: '价值' },
  { image: getImageUrl('d5.jpg'), location: '乐享' },
];

function HeroCarousel({ profile }: { profile: { full_name?: string } | null }) {
  const [current, setCurrent] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % HERO_SLIDES.length);
    }, 4000);
  };

  useEffect(() => {
    startAutoPlay();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    const scroller = document.getElementById('main-scroll');
    if (!scroller) return;
    const onScroll = () => setScrollY(scroller.scrollTop);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (idx: number) => { setCurrent(idx); startAutoPlay(); };
  const prev = () => goTo((current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const next = () => goTo((current + 1) % HERO_SLIDES.length);

  const parallaxOffset = Math.min(scrollY * 0.4, 60);



  return (
      <div className="relative h-76 overflow-hidden">
        {/* Hero — warm sunset image with brown overlay */}
        <section className="relative h-[260px] overflow-hidden">
          {HERO_SLIDES.map((slide, i) => (
              <div key={i} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === current ? 1 : 0 }}>
                <img
                    src={slide.image}
                    alt={slide.location}
                    className="w-full h-full object-cover will-change-transform"
                    style={{ transform: `translateY(${parallaxOffset}px) scale(1.2)`, transformOrigin: 'center top' }}
                />
              </div>
          ))}

          {/*<div className="absolute inset-0 bg-gradient-to-b from-oshiruco-900/40 via-oshiruco-900/15 to-oshiruco-900/70" />*/}

          <div className="absolute inset-0 bg-gradient-to-b from-[#3b2b25]/60 via-[#5e4030]/35 to-[#4c3327]/85" />


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
            <h1 className="mt-7 font-serif text-[27px] font-bold leading-tight tracking-wide">让人生下一城 <br/> 更加精彩</h1>

            <div className="mt-7 flex items-center gap-2">
              <p className="text-white font-semibold text-sm flex items-center gap-1 drop-shadow">
                旅行 . 价值 . 生活 . 人生
              </p>
            </div>

            <div className="flex gap-1.5">
              {HERO_SLIDES.map((_, i) => (
                  <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-6' : 'bg-white/40 w-1.5'}`}
                  />
              ))}
            </div>


            {/*<div className="mt-5 h-0.5 w-10 bg-[#f5d6a1]" />*/}

          </div>

          {/*<div className="absolute inset-0 flex flex-col justify-between px-5 pt-7 pb-5">*/}
          {/*  <div>*/}
          {/*    <div className="flex items-end justify-between mb-3">*/}
          {/*      <div>*/}
          {/*        /!*<p className="text-white/60 text-[10px] uppercase tracking-widest mb-0.5">当前目的地</p>*!/*/}
          {/*        <p className="text-white font-semibold text-sm flex items-center gap-1 drop-shadow">*/}
          {/*          /!*<MapPin className="w-3.5 h-3.5" />*!/*/}
          {/*          {HERO_SLIDES[current].location}*/}
          {/*        </p>*/}
          {/*      </div>*/}
          {/*      <div className="flex gap-1.5">*/}
          {/*        <button onClick={prev} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/35 transition">*/}
          {/*          <ChevronLeft className="w-4 h-4 text-white" />*/}
          {/*        </button>*/}
          {/*        <button onClick={next} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/35 transition">*/}
          {/*          <ChevronRight className="w-4 h-4 text-white" />*/}
          {/*        </button>*/}
          {/*      </div>*/}
          {/*    </div>*/}

          {/*  </div>*/}
          {/*</div>*/}


        </section>

      </div>


  );
}

export default function Discovery() {
  const { user, profile } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '', destination_name: '', image_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const quote = TRAVEL_QUOTES[new Date().getDay() % TRAVEL_QUOTES.length];
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => { loadData(); }, [user]);

  useEffect(() => {
    const scroller = document.getElementById('main-scroll');
    if (!scroller) return;
    const onScroll = () => setShowScrollTop(scroller.scrollTop > 400);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    const scroller = document.getElementById('main-scroll');
    if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadData = async () => {
    setLoading(true);
    const [destRes, postsRes, likesRes] = await Promise.all([
      supabase.from('destinations').select('*').order('rating', { ascending: false }),
      supabase.from('posts').select('*, profiles(full_name, avatar_url, location), post_likes(id, user_id)').order('created_at', { ascending: false }).limit(20),
      user ? supabase.from('post_likes').select('post_id').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ]);
    if (destRes.data) setDestinations(destRes.data);
    if (postsRes.data) setPosts(postsRes.data as Post[]);
    if (likesRes.data) setLikedPosts(new Set(likesRes.data.map((l: { post_id: string }) => l.post_id)));
    setLoading(false);
  };

  const toggleLike = async (post: Post) => {
    if (!user) return;
    const isLiked = likedPosts.has(post.id);
    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      await supabase.from('posts').update({ likes: Math.max(0, post.likes - 1) }).eq('id', post.id);
      setLikedPosts(prev => { const s = new Set(prev); s.delete(post.id); return s; });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', post.id);
      setLikedPosts(prev => new Set([...prev, post.id]));
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p));
    }
    if (selectedPost?.id === post.id) {
      setSelectedPost(prev => prev ? { ...prev, likes: isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1 } : prev);
    }
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.title.trim()) return;
    setSubmitting(true);
    await supabase.from('posts').insert({ ...newPost, user_id: user.id });
    setNewPost({ title: '', body: '', destination_name: '', image_url: '' });
    setShowNewPost(false);
    await loadData();
    setSubmitting(false);
  };

  const categories = ['all', '红色', '欧洲', '日本', '宗教'];
  const filteredDests = destinations.filter(d => {
    const matchCat = activeCategory === 'all' || d.category === activeCategory;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.country.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });



  return (
      <div className="pb-24">
        <HeroCarousel profile={profile} />
        {/* Quote banner */}
        {/*<div className="bg-oshiruco-600 px-5 py-3">*/}
        {/*  <p className="text-oshiruco-100 text-xs italic leading-relaxed text-center font-serif">{quote}</p>*/}
        {/*</div>*/}
        {/* Section title — editorial style */}
        <div className="px-4 mt-6 mb-4">
          {/*<h2 className="font-serif text-xl font-bold text-oshiruco-900 flex items-center gap-2">*/}
          {/*  <TrendingUp className="w-5 h-5 text-oshiruco-500" />*/}
          {/*  みんなの<span className="heading-italic text-oshiruco-600">物語</span>*/}
          {/*</h2>*/}
          {/*<p className="text-xs text-oshiruco-500 mt-1">社区故事 — 同世代的旅行分享</p>*/}
          <span className="heading-italic text-oshiruco-600">社区故事 — 同世代的旅行分享</span>
        </div>

        {/* Community Feed */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-oshiruco-500 font-medium">{posts.length} 篇故事</span>
            <button onClick={() => setShowNewPost(true)} className="text-xs text-oshiruco-700 font-semibold bg-oshiruco-100 px-3 py-1.5 rounded-full hover:bg-oshiruco-200 transition">+ 分享</button>
          </div>

          {showNewPost && (
              <div className="fixed inset-0 bg-oshiruco-900/50 z-50 flex items-end">
                <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up">
                  <h3 className="font-serif text-lg font-bold text-oshiruco-900 mb-4">分享您的旅行故事</h3>
                  <form onSubmit={submitPost} className="space-y-3">
                    <input value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} placeholder="标题" className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm bg-oshiruco-50/50" required />
                    <input value={newPost.destination_name} onChange={e => setNewPost({ ...newPost, destination_name: e.target.value })} placeholder="目的地（可选）" className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm bg-oshiruco-50/50" />
                    <textarea value={newPost.body} onChange={e => setNewPost({ ...newPost, body: e.target.value })} placeholder="分享您的旅行体验..." rows={4} className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm resize-none bg-oshiruco-50/50" />
                    <input value={newPost.image_url} onChange={e => setNewPost({ ...newPost, image_url: e.target.value })} placeholder="图片链接（可选）" className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 outline-none text-sm bg-oshiruco-50/50" />
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => setShowNewPost(false)} className="flex-1 py-3 rounded-xl border border-oshiruco-200 text-oshiruco-600 font-medium text-sm">取消</button>
                      <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-oshiruco-600 text-white font-medium text-sm disabled:opacity-60">发布</button>
                    </div>
                  </form>
                </div>
              </div>
          )}

          <div className="space-y-4">
            {posts.map(post => (
                <button
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-oshiruco-100 hover:shadow-md hover:border-oshiruco-200 transition-all active:scale-[0.99]"
                >
                  {post.image_url ? (
                      <img src={post.image_url} alt={post.title} className="w-full h-88 object-cover" />
                  ) : (
                      <img src={getImageUrl('d5.jpg')} alt={post.title} className="w-full h-88 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-oshiruco-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {(post.profiles as Profile | undefined)?.avatar_url ? (
                            <img src={(post.profiles as Profile | undefined)!.avatar_url!} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-oshiruco-700 font-bold text-sm">{(post.profiles as Profile | undefined)?.full_name?.[0] || '?'}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-oshiruco-900">{(post.profiles as Profile | undefined)?.full_name || '旅行者'}</p>
                        {post.destination_name && <p className="text-xs text-oshiruco-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{post.destination_name}</p>}
                      </div>
                      <span className="ml-auto text-xs text-oshiruco-400">{new Date(post.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <h3 className="font-serif font-bold text-oshiruco-900 mb-1">{post.title}</h3>
                    {post.body && <p className="text-sm text-oshiruco-700 leading-relaxed line-clamp-3">{post.body}</p>}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-oshiruco-50">
                  <span
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${likedPosts.has(post.id) ? 'text-rose-500' : 'text-oshiruco-400'}`}
                      onClick={e => { e.stopPropagation(); toggleLike(post); }}
                  >
                    <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} /> {post.likes}
                  </span>
                      <button className="flex items-center gap-1.5 text-sm text-oshiruco-400" onClick={e => e.stopPropagation()}>
                        <MessageCircle className="w-4 h-4" /> 评论
                      </button>
                      <span className="ml-auto text-xs text-oshiruco-600 font-semibold flex items-center gap-0.5">
                    阅读全文 <ArrowRight className="w-3 h-3" />
                  </span>
                    </div>
                  </div>
                </button>
            ))}
            {posts.length === 0 && !loading && (
                <div className="text-center py-10 text-oshiruco-400">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">暂无故事</p>
                  <p className="text-sm">成为第一个分享旅行故事的人！</p>
                </div>
            )}
          </div>
        </div>

        {/* Scrolling image banner card */}
        <div className="px-4 mt-8">
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-oshiruco-100">
            {/* Scrolling image background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="flex animate-scroll-x w-[200%]">
                {[...SCROLL_BANNER_IMAGES, ...SCROLL_BANNER_IMAGES].map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt=""
                        className="w-[200px] h-64 object-cover flex-shrink-0"
                        draggable={false}
                    />
                ))}
              </div>
            </div>
            {/* Gradient overlay for readability */}
            {/*<div className="absolute inset-0 bg-gradient-to-r from-oshiruco-900/85 via-oshiruco-900/55 to-oshiruco-900/85" />*/}

            {/* Content */}
            <div className="relative px-6 py-7 flex flex-col items-center text-center min-h-64 justify-center">
              <Sparkles className="w-7 h-7 text-oshiruco-300 mb-2" />
              <h2 className="font-serif text-xl font-bold text-white mb-1.5 text-shadow-warm">
                <span className="heading-italic">绚丽多彩的</span>美好世界
              </h2>
              {/*<p className="text-white/85 text-sm leading-relaxed max-w-[260px]">*/}
              {/*  漫漫人生的意义，其实就是一场旅行体验*/}
              {/*</p>*/}
              {/*<div className="mt-4 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white font-semibold text-sm px-6 py-2.5 rounded-full border border-white/20">*/}
              {/*  旅仲間を探す <ArrowRight className="w-3.5 h-3.5" />*/}
              {/*</div>*/}
            </div>
          </div>
        </div>

        {/* Destinations section */}
        <div className="px-4 mt-8">
          <div className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3 border border-oshiruco-100 mb-5">
            <Search className="w-5 h-5 text-oshiruco-400 flex-shrink-0" />
            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索目的地..."
                className="flex-1 outline-none text-oshiruco-800 text-sm bg-transparent"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200 ${activeCategory === cat ? 'bg-oshiruco-600 text-white shadow-sm' : 'bg-white text-oshiruco-600 border border-oshiruco-200 hover:border-oshiruco-400'}`}
                >
                  {cat === 'all' ? '全部' : cat}
                </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl font-bold text-oshiruco-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-oshiruco-500" />
              <span className="heading-italic text-oshiruco-600">人气目的地</span>
            </h2>
            <span className="text-xs text-oshiruco-400">{filteredDests.length} 个地点</span>
          </div>

          {loading ? (
              <div className="grid grid-cols-1 gap-3 mb-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-oshiruco-100 rounded-2xl animate-pulse" />)}
              </div>
          ) : (
              <div className="grid grid-cols-1 gap-3 mb-6">
                {filteredDests.map(dest => (
                    <button
                        key={dest.id}
                        onClick={() => setSelectedDestination(dest)}
                        className="text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-oshiruco-100 hover:shadow-md hover:border-oshiruco-200 transition-all active:scale-[0.98]"
                    >
                      <div className="relative h-48 bg-oshiruco-100">
                        {dest.image_url && <img src={dest.image_url} alt={dest.name} className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-oshiruco-900/60 to-transparent" />
                        <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[dest.category] || 'bg-oshiruco-100 text-oshiruco-700'}`}>{dest.category}</span>
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white font-bold text-sm leading-tight font-serif">{dest.name}</p>
                          <p className="text-white/80 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{dest.country}</p>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-semibold text-oshiruco-700">{dest.rating}</span>
                          </div>
                          <span className="text-xs text-oshiruco-400">{dest.review_count.toLocaleString()} 条评价</span>
                        </div>
                        <p className="text-xs text-oshiruco-500 mt-1 line-clamp-2">{dest.description}</p>
                      </div>
                    </button>
                ))}
              </div>
          )}
        </div>

        {/* Detail overlays */}
        {selectedDestination && (
            <DestinationDetail
                destination={selectedDestination}
                onClose={() => setSelectedDestination(null)}
            />
        )}
        {selectedPost && !selectedDestination && (
            <PostDetail
                post={selectedPost}
                liked={likedPosts.has(selectedPost.id)}
                onLike={() => toggleLike(selectedPost)}
                onClose={() => setSelectedPost(null)}
            />
        )}

        {showScrollTop && !selectedDestination && !selectedPost && (
            <button
                onClick={scrollToTop}
                className="fixed bottom-24 right-4 z-30 w-12 h-12 rounded-full bg-green-800 text-white shadow-lg flex items-center justify-center hover:bg-green-800 active:scale-90 transition-all"
                aria-label="回到顶部"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
        )}
      </div>
  );
}

interface Profile { full_name: string; avatar_url: string | null; location: string; }
