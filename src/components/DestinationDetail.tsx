import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Destination, Post } from '../lib/database.types';
import {
  MapPin, Star, Heart, ChevronLeft, Globe, TrendingUp,
  MessageCircle, Users, Calendar, ArrowRight, X,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  scenic: '风景', cultural: '文化', nature: '自然',
  city: '城市', beach: '海滩', '红色': '红色', '欧洲': '欧洲',
  '日本': '日本', '宗教': '宗教',
};

const CATEGORY_COLORS: Record<string, string> = {
  scenic: 'bg-sky-100 text-sky-700',
  cultural: 'bg-amber-100 text-amber-700',
  nature: 'bg-emerald-100 text-emerald-700',
  city: 'bg-violet-100 text-violet-700',
  beach: 'bg-cyan-100 text-cyan-700',
  '红色': 'bg-red-100 text-red-700',
  '欧洲': 'bg-sky-100 text-sky-700',
  '日本': 'bg-rose-100 text-rose-700',
  '宗教': 'bg-amber-100 text-amber-700',
};

const HIGHLIGHTS: Record<string, string[]> = {
  scenic: ['绝美全景', '摄影天堂', '日出观赏点'],
  cultural: ['博物馆参观', '历史街区', '传统表演'],
  nature: ['生态徒步', '野生动物', '国家公园'],
  city: ['购物商圈', '美食街道', '夜生活'],
  beach: ['水上运动', '日落海滩', '海鲜餐厅'],
  '红色': ['革命纪念馆', '历史博物馆', '爱国教育基地'],
  '欧洲': ['古典建筑', '艺术画廊', '咖啡文化'],
  '日本': ['樱花赏析', '温泉体验', '动漫圣地'],
  '宗教': ['朝圣之旅', '寺庙参观', '宗教文化体验'],
};

interface Props {
  destination: Destination;
  onClose: () => void;
}

interface PostProfile {
  full_name: string;
  avatar_url: string | null;
}

export default function DestinationDetail({ destination, onClose }: Props) {
  const { user } = useAuth();
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0 });
    loadRelated();
  }, [destination.id]);

  const loadRelated = async () => {
    setLoading(true);
    const [postsRes, likesRes] = await Promise.all([
      supabase
        .from('posts')
        .select('*, profiles(full_name, avatar_url), post_likes(id, user_id)')
        .ilike('destination_name', `%${destination.name}%`)
        .order('likes', { ascending: false })
        .limit(10),
      user
        ? supabase.from('post_likes').select('post_id').eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ]);
    if (postsRes.data) setRelatedPosts(postsRes.data as Post[]);
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
      setRelatedPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', post.id);
      setLikedPosts(prev => new Set([...prev, post.id]));
      setRelatedPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: p.likes + 1 } : p));
    }
  };

  const highlights = HIGHLIGHTS[destination.category] || ['必游景点', '地方美食', '特色体验'];

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto animate-slide-up">
      {/* Hero */}
      <div className="relative h-72">
        {destination.image_url ? (
          <img src={destination.image_url} alt={destination.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        {/* Back button */}
        <button
          onClick={onClose}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="absolute bottom-5 left-5 right-5">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full mb-3 inline-block ${CATEGORY_COLORS[destination.category] || 'bg-gray-100 text-gray-700'}`}>
            {CATEGORY_LABELS[destination.category] || destination.category}
          </span>
          <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">{destination.name}</h1>
          <p className="text-white/80 flex items-center gap-1.5 mt-1 text-sm">
            <MapPin className="w-4 h-4" />{destination.country}
            {destination.region && <span className="text-white/60"> · {destination.region}</span>}
          </p>
        </div>
      </div>

      {/* Rating bar */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-4 h-4 ${s <= Math.round(destination.rating) ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
            ))}
          </div>
          <span className="text-base font-bold text-gray-900">{destination.rating}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <Users className="w-4 h-4" />
          <span>{destination.review_count.toLocaleString()} 条评价</span>
        </div>
      </div>

      <div className="px-5 pt-5 pb-28">
        {/* Description */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">关于</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{destination.description || '这是一处迷人的旅行目的地，等待您的探索与发现。'}</p>
        </section>

        {/* Highlights */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">热门体验</h2>
          <div className="grid grid-cols-3 gap-3">
            {highlights.map((h, i) => (
              <div key={i} className="bg-teal-50 border border-teal-100 rounded-2xl p-3 flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                  {i === 0 && <Globe className="w-4 h-4 text-teal-600" />}
                  {i === 1 && <Calendar className="w-4 h-4 text-teal-600" />}
                  {i === 2 && <TrendingUp className="w-4 h-4 text-teal-600" />}
                </div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{h}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Travel tips */}
        <section className="mb-6 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <h2 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-current" /> 旅行小贴士
          </h2>
          <ul className="space-y-1.5 text-xs text-amber-700 leading-relaxed">
            <li>· 建议提前预订热门景点门票，避免排队等待。</li>
            <li>· 请尊重当地风俗习惯，衣着得体。</li>
            <li>· 随身携带适量现金，部分小店不支持刷卡。</li>
          </ul>
        </section>

        {/* Related posts */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            旅行故事
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : relatedPosts.length > 0 ? (
            <div className="space-y-3">
              {relatedPosts.map(post => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.99]"
                >
                  {post.image_url && (
                    <img src={post.image_url} alt={post.title} className="w-full h-36 object-cover" />
                  )}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {(post.profiles as PostProfile | undefined)?.avatar_url ? (
                          <img src={(post.profiles as PostProfile).avatar_url!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-teal-700 font-bold text-xs">{(post.profiles as PostProfile | undefined)?.full_name?.[0] || '?'}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{(post.profiles as PostProfile | undefined)?.full_name || '旅行者'}</span>
                      <span className="ml-auto text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{post.title}</h3>
                    {post.body && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.body}</p>}
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${likedPosts.has(post.id) ? 'text-rose-500' : 'text-gray-400'}`}
                        onClick={e => { e.stopPropagation(); toggleLike(post); }}
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                        {post.likes}
                      </span>
                      <span className="text-xs text-teal-600 font-semibold ml-auto flex items-center gap-0.5">
                        阅读全文 <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无相关故事</p>
              <p className="text-xs mt-1">成为第一个分享此地故事的人！</p>
            </div>
          )}
        </section>
      </div>

      {/* Post detail overlay */}
      {selectedPost && (
        <PostDetailOverlay
          post={selectedPost}
          liked={likedPosts.has(selectedPost.id)}
          onLike={() => toggleLike(selectedPost)}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}

function PostDetailOverlay({
  post, liked, onLike, onClose,
}: {
  post: Post;
  liked: boolean;
  onLike: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 bg-white overflow-y-auto animate-slide-up">
      <div className="relative">
        {post.image_url ? (
          <img src={post.image_url} alt={post.title} className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-32 bg-gradient-to-r from-teal-500 to-emerald-500" />
        )}
        <button
          onClick={onClose}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="px-5 pt-5 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
            {(post.profiles as PostProfile | undefined)?.avatar_url ? (
              <img src={(post.profiles as PostProfile).avatar_url!} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-teal-700 font-bold">{(post.profiles as PostProfile | undefined)?.full_name?.[0] || '?'}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{(post.profiles as PostProfile | undefined)?.full_name || '旅行者'}</p>
            <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {post.destination_name && (
          <p className="text-xs text-teal-600 font-medium flex items-center gap-1 mb-3 bg-teal-50 px-3 py-1.5 rounded-full w-fit">
            <MapPin className="w-3 h-3" />{post.destination_name}
          </p>
        )}

        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-4">{post.title}</h1>
        {post.body && (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{post.body}</p>
        )}

        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onLike}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${liked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span>{post.likes} 喜欢</span>
          </button>
        </div>
      </div>
    </div>
  );
}
