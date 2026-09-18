import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Post, PostComment, Profile } from '../lib/database.types';
import { MapPin, Heart, ChevronLeft, MessageCircle, Send, Trash2 } from 'lucide-react';
import SendMessage from './SendMessage';

interface PostProfile {
  full_name: string;
  avatar_url: string | null;
}

interface Props {
  post: Post;
  liked: boolean;
  onLike: () => void;
  onClose: () => void;
}

export default function PostDetail({ post, liked, onLike, onClose }: Props) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [messageTo, setMessageTo] = useState<Profile | null>(null);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from('post_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    if (data) setComments(data as PostComment[]);
    setLoadingComments(false);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = commentText.trim();
    if (!body || !user || submitting) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: post.id, body })
      .select('*, profiles(full_name, avatar_url)')
      .single();
    if (!error && data) {
      setComments(prev => [...prev, data as PostComment]);
      setCommentText('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
    setSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    if (deletingId) return;
    setDeletingId(commentId);
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
    if (!error) setComments(prev => prev.filter(c => c.id !== commentId));
    setDeletingId(null);
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const authorProfile = post.profiles as PostProfile | undefined;

  const getImageUrl = (name: string) => {
    return new URL(`../images/${name}`, import.meta.url).href;
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden animate-slide-up">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero image */}
        <div className="relative">
          <img src={getImageUrl('d5.jpg')} alt={post.title} className="w-full h-72 object-cover" />
          {/*{post.image_url ? (*/}
          {/*  <img src={getImageUrl('d5.jpg')} alt={post.title} className="w-full h-72 object-cover" />*/}
          {/*) : (*/}
          {/*  <div className="w-full h-36 bg-gradient-to-r from-teal-500 to-emerald-500" />*/}
          {/*)}*/}
          <button
            onClick={onClose}
            className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-5 pt-5">
          {/* Author row */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                if (!user || user.id === post.user_id) return;
                setMessageTo({
                  id: post.user_id,
                  full_name: authorProfile?.full_name || '旅行者',
                  avatar_url: authorProfile?.avatar_url ?? null,
                  bio: '',
                  location: '',
                  age: null,
                  interests: [],
                  travel_style: 'relaxed',
                  created_at: '',
                  updated_at: '',
                });
              }}
              disabled={!user || user.id === post.user_id}
              className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-transparent hover:ring-teal-400 transition disabled:hover:ring-transparent disabled:cursor-default"
              title={user && user.id !== post.user_id ? `给 ${authorProfile?.full_name || '旅行者'} 发消息` : undefined}
            >
              {authorProfile?.avatar_url ? (
                <img src={getImageUrl(authorProfile.avatar_url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-teal-700 font-bold text-lg">{authorProfile?.full_name?.[0] || '?'}</span>
              )}
            </button>
            <div>
              <p className="font-semibold text-gray-900">{authorProfile?.full_name || '旅行者'}</p>
              <p className="text-xs text-gray-400">
                {new Date(post.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Destination tag */}
          {post.destination_name && (
            <p className="text-xs text-teal-600 font-medium flex items-center gap-1 mb-4 bg-teal-50 px-3 py-1.5 rounded-full w-fit border border-teal-100">
              <MapPin className="w-3 h-3" />{post.destination_name}
            </p>
          )}

          {/* Title & body */}
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-5">{post.title}</h1>
          {post.body ? (
            <p className="text-sm text-gray-700 leading-[1.8] whitespace-pre-line">{post.body}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">暂无正文内容。</p>
          )}

          {/* Like row */}
          <div className="flex items-center gap-5 mt-6 pb-5 border-b border-gray-100">
            <button
              onClick={onLike}
              className={`flex items-center gap-2 text-sm font-semibold transition-all active:scale-110 ${liked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}
            >
              <Heart className={`w-5 h-5 transition-all ${liked ? 'fill-current' : ''}`} />
              <span>{post.likes} 喜欢</span>
            </button>
            <button
              onClick={() => textareaRef.current?.focus()}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-teal-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{comments.length} 评论</span>
            </button>
          </div>

          {/* Comments section */}
          <div className="pt-5 pb-4">
            <h2 className="text-base font-bold text-gray-900 mb-4">评论</h2>

            {loadingComments ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">还没有评论，来发表第一条吧！</p>
              </div>
            ) : (
              <div className="space-y-5">
                {comments.map(comment => {
                  const cp = comment.profiles as PostProfile | undefined;
                  const isOwn = user?.id === comment.user_id;
                  return (
                    <div key={comment.id} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
                        {cp?.avatar_url ? (
                          <img src={cp.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-teal-700 font-bold text-xs">{cp?.full_name?.[0] || '?'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900 truncate">{cp?.full_name || '旅行者'}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(comment.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed break-words">{comment.body}</p>
                      </div>
                      {isOwn && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          disabled={deletingId === comment.id}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity self-start mt-1 text-gray-300 hover:text-rose-400 p-1 rounded flex-shrink-0"
                          aria-label="删除评论"
                        >
                          {deletingId === comment.id ? (
                            <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin inline-block" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky comment input */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3 safe-area-bottom">
        {user ? (
          <form onSubmit={submitComment} className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-teal-700 font-bold text-xs">{profile?.full_name?.[0] || '?'}</span>
              )}
            </div>
            <div className="flex-1 flex items-end gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-teal-400 focus-within:bg-white transition-colors">
              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={e => { setCommentText(e.target.value); autoResize(e.target); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(e as unknown as React.FormEvent); } }}
                placeholder="写下你的评论…"
                rows={1}
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 resize-none leading-relaxed min-h-[24px]"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center disabled:opacity-40 hover:bg-teal-700 active:scale-95 transition-all"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-center text-sm text-gray-400 py-2">登录后即可发表评论</p>
        )}
      </div>

      {messageTo && (
        <SendMessage recipient={messageTo} onClose={() => setMessageTo(null)} />
      )}
    </div>
  );
}
