import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { LifeMemoirChat, LifeMemoirRecord, LifeMemoirEvent } from '../lib/database.types';
import {
  ArrowLeft, BookOpen, Send, Sparkles, MessageCircle,
  Calendar, Trash2, Clock, ChevronRight, Plus,
} from 'lucide-react';

type View = 'list' | 'chat' | 'memoir';

export default function LifeMemoir({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [view, setView] = useState<View>('list');
  const [memoirs, setMemoirs] = useState<LifeMemoirRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMemoir, setActiveMemoir] = useState<LifeMemoirRecord | null>(null);

  const loadMemoirs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('life_memoirs')
      .select('*')
      .eq('user_id', user?.id || '')
      .order('created_at', { ascending: false });
    if (data) setMemoirs(data as LifeMemoirRecord[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (view === 'list') loadMemoirs();
  }, [view, loadMemoirs]);

  const handleMemoirGenerated = () => {
    loadMemoirs();
    setView('list');
  };

  return (
    <div className="fixed inset-0 bg-amber-50 z-50 overflow-y-auto">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 bg-amber-100 text-amber-900 px-5 py-4 flex items-center gap-3 shadow-md z-10">
          {view === 'list' ? (
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-amber-200/60 flex items-center justify-center hover:bg-amber-300/60 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setView('list')} className="w-9 h-9 rounded-full bg-amber-200/60 flex items-center justify-center hover:bg-amber-300/60 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <h1 className="text-lg font-bold">
              {view === 'chat' ? '伴伴对话' : view === 'memoir' ? '人生回忆录' : '人生记忆银行'}
            </h1>
          </div>
        </header>

        {view === 'list' && (
          <MemoirList
            memoirs={memoirs}
            loading={loading}
            onNewChat={() => setView('chat')}
            onView={(m) => { setActiveMemoir(m); setView('memoir'); }}
            onDelete={async (id) => {
              await supabase.from('life_memoirs').delete().eq('id', id);
              loadMemoirs();
            }}
          />
        )}

        {view === 'chat' && (
          <ChatView
            userId={user?.id || ''
            }
            onGenerated={handleMemoirGenerated}
            onViewMemoir={(m) => { setActiveMemoir(m); setView('memoir'); }}
          />
        )}

        {view === 'memoir' && activeMemoir && (
          <MemoirDetail memoir={activeMemoir} />
        )}
      </div>
    </div>
  );
}

/* ---------- Memoir List ---------- */

function MemoirList({
  memoirs, loading, onNewChat, onView, onDelete,
}: {
  memoirs: LifeMemoirRecord[];
  loading: boolean;
  onNewChat: () => void;
  onView: (m: LifeMemoirRecord) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="px-5 py-6">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-3">
          <BookOpen className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-amber-900">岁月如歌 · 人生华章</h2>
        <p className="text-sm text-amber-600 mt-2 leading-relaxed">
          和伴伴聊聊人生故事，<br />生成属于你的回忆录
        </p>
      </div>

      {/* New chat button */}
      <button
        onClick={onNewChat}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all mb-6"
      >
        <Plus className="w-5 h-5" />
        开始新的对话
      </button>

      {/* Memoir list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-amber-100" />
          ))}
        </div>
      ) : memoirs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-8 text-center">
          <MessageCircle className="w-12 h-12 text-amber-200 mx-auto mb-2" />
          <p className="text-sm text-amber-700 font-medium mb-1">还没有回忆录</p>
          <p className="text-xs text-amber-500">和伴伴聊天后，点击「生成回忆录」即可创建</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest">已生成的回忆录</p>
          {memoirs.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden hover:shadow-md hover:border-amber-200 transition-all active:scale-[0.98] group"
            >
              <button onClick={() => onView(m)} className="w-full text-left p-4 flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-amber-900 text-sm truncate">{m.title}</h3>
                  <p className="text-xs text-amber-600 mt-1 line-clamp-2 leading-relaxed">{m.summary}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-amber-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(m.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-amber-400">·</span>
                    <span className="text-xs text-amber-400">{m.events.length} 个篇章</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-300 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1" />
              </button>
              <div className="px-4 pb-3 flex justify-end">
                <button
                  onClick={() => onDelete(m.id)}
                  className="text-xs text-amber-400 hover:text-rose-400 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Chat View ---------- */

interface UIMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

function ChatView({
  userId, onGenerated, onViewMemoir,
}: {
  userId: string;
  onGenerated: () => void;
  onViewMemoir: (m: LifeMemoirRecord) => void;
}) {
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      role: 'assistant',
      content: '你好！我是伴伴，很高兴和你聊天。我会陪你一起回忆人生中的美好时光。请告诉我，你是在哪里出生的？小时候有什么难忘的记忆吗？',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    const userMsg: UIMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const { data: savedMsg } = await supabase
        .from('life_memoir_chats')
        .insert({ user_id: userId, role: 'user', content: text })
        .select('*')
        .single();
      if (savedMsg && !chatId) {
        setChatId(savedMsg.id);
      }

      const allMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/life-memoir-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, action: 'chat' }),
      });

      if (!res.ok) throw new Error('对话失败，请重试');
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      const assistantMsg: UIMessage = { role: 'assistant', content: json.reply };
      setMessages((prev) => [...prev, assistantMsg]);

      await supabase
        .from('life_memoir_chats')
        .insert({ user_id: userId, role: 'assistant', content: json.reply });
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请重试');
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const generateMemoir = async () => {
    setGenerating(true);
    setError(null);
    try {
      const allMessages = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/life-memoir-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, action: 'generate', userId }),
      });

      if (!res.ok) throw new Error('生成失败，请重试');
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      const memoir = json.memoir as LifeMemoirRecord;

      await supabase.from('life_memoir_chats')
        .delete()
        .eq('user_id', userId);

      onViewMemoir(memoir);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成回忆录失败，请重试');
    }
    setGenerating(false);
  };

  const userMsgCount = messages.filter((m) => m.role === 'user').length;
  const canGenerate = userMsgCount >= 2 && !sending;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500 text-white rounded-br-md'
                  : 'bg-white text-gray-700 rounded-bl-md border border-amber-100 shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md border border-amber-100 shadow-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-xs text-rose-500 bg-rose-50 inline-block px-3 py-1.5 rounded-full">{error}</p>
          </div>
        )}
      </div>

      {/* Generate memoir button */}
      {canGenerate && (
        <div className="px-4 pb-2">
          <button
            onClick={generateMemoir}
            disabled={generating}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                正在生成回忆录...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                生成回忆录
              </>
            )}
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 bg-amber-50/80 backdrop-blur-sm border-t border-amber-100">
        <div className="flex items-end gap-2 bg-white rounded-2xl border border-amber-200 shadow-sm px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="和伴伴聊聊你的故事..."
            rows={1}
            className="flex-1 outline-none text-sm resize-none max-h-24 bg-transparent text-gray-700"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center flex-shrink-0 transition disabled:opacity-40 active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Memoir Detail ---------- */

function MemoirDetail({ memoir }: { memoir: LifeMemoirRecord }) {
  const events: LifeMemoirEvent[] = memoir.events || [];

  return (
    <div className="px-5 py-6">
      {/* Title section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-3">
          <BookOpen className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-amber-900">{memoir.title}</h2>
        <p className="text-sm text-amber-600 mt-2 leading-relaxed">{memoir.summary}</p>
        <p className="text-xs text-amber-400 mt-2">
          {new Date(memoir.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} 生成
        </p>
      </div>

      {/* Timeline */}
      {events.length > 0 && (
        <div className="relative">
          <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-amber-200" />
          <div className="space-y-8">
            {events.map((event, index) => (
              <div key={index} className="relative pl-16">
                <div className="absolute left-0 top-1 w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-lg border-4 border-amber-50 z-10">
                  {event.year}
                </div>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-100">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <h3 className="font-bold text-amber-900 text-sm">{event.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation reference */}
      {memoir.chat_messages && memoir.chat_messages.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-amber-500" />
            对话记录
          </h3>
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-3 max-h-64 overflow-y-auto">
            {memoir.chat_messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="inline-block bg-amber-100 rounded-2xl px-6 py-4">
          <p className="text-sm text-amber-700 font-medium leading-relaxed">
            人生是一场漫长的旅行，<br />
            愿每一段回忆都温暖如初。
          </p>
        </div>
      </div>
    </div>
  );
}
