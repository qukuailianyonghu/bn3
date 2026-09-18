import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Profile, Message } from '../lib/database.types';
import { ChevronLeft, Send, MapPin, CircleUser as UserCircle, Mic, Square } from 'lucide-react';

interface Props {
  recipient: Profile;
  onClose: () => void;
}

function avatarGradient(name: string) {
  const gradients = [
    'from-emerald-400 to-teal-500', 'from-sky-400 to-blue-500',
    'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500',
    'from-violet-400 to-purple-500', 'from-teal-400 to-cyan-500',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % gradients.length;
  return gradients[h];
}

export default function SendMessage({ recipient, onClose }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  const initRecognition = () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceSupported(false);
      return null;
    }
    const rec = new Ctor();
    rec.lang = 'zh-CN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          finalTranscriptRef.current += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      if (interim) setText(prev => (prev + interim).slice(0, 500));
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setVoiceError('麦克风权限被拒绝，请在浏览器设置中允许使用麦克风。');
      } else if (e.error !== 'no-speech') {
        setVoiceError('语音识别出错，请重试。');
      }
      setListening(false);
    };

    rec.onend = () => {
      if (finalTranscriptRef.current) {
        setText(prev => (prev + finalTranscriptRef.current).slice(0, 500));
        finalTranscriptRef.current = '';
      }
      setListening(false);
    };

    return rec;
  };

  const toggleVoice = () => {
    setVoiceError(null);
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    const rec = recognitionRef.current;
    if (!rec) return;
    finalTranscriptRef.current = '';
    try {
      rec.start();
      setListening(true);
    } catch {
      rec.abort();
      try { rec.start(); setListening(true); } catch { setListening(false); }
    }
  };

  useEffect(() => () => { recognitionRef.current?.abort(); }, []);

  useEffect(() => {
    loadMessages();
  }, [recipient.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},recipient_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
    setLoading(false);
  };

  const send = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const body = text.trim();
    setText('');
    const { data } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, recipient_id: recipient.id, body })
      .select('*')
      .single();
    if (data) setMessages(prev => [...prev, data as Message]);
    setSending(false);
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const grad = avatarGradient(recipient.full_name);

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 pt-9 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center overflow-hidden flex-shrink-0`}>
            {recipient.avatar_url ? (
              <img src={recipient.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold">{recipient.full_name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base truncate">{recipient.full_name}</h1>
            <p className="text-white/70 text-xs flex items-center gap-1">
              {recipient.age && <span>{recipient.age} 岁</span>}
              {recipient.location && (
                <span className="flex items-center gap-0.5">
                  {recipient.age && <span>·</span>}
                  <MapPin className="w-3 h-3" />{recipient.location}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[70%] h-12 bg-gray-100 rounded-2xl animate-pulse w-48" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center mb-4 overflow-hidden`}>
              {recipient.avatar_url ? (
                <img src={recipient.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-10 h-10 text-white" />
              )}
            </div>
            <p className="text-sm font-semibold text-gray-700">{recipient.full_name}</p>
            {recipient.interests && recipient.interests.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">喜欢：{recipient.interests.slice(0, 3).join(' · ')}</p>
            )}
            <p className="text-sm text-gray-400 mt-4 text-center max-w-[240px]">
              还没有聊天记录，发送第一条消息开始对话吧！
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            const prevMsg = messages[i - 1];
            const showTime = !prevMsg || new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString();
            return (
              <div key={msg.id}>
                {showTime && (
                  <p className="text-center text-xs text-gray-400 my-3">
                    {new Date(msg.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-emerald-500 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-3 py-2.5 pb-4 flex items-end gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={listening ? '正在聆听…说话即可输入' : `给 ${recipient.full_name} 发送消息...`}
          rows={1}
          className="flex-1 resize-none px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-emerald-400 outline-none text-sm text-gray-800 max-h-24"
          style={{ minHeight: '42px' }}
        />
        <button
          type="button"
          onClick={toggleVoice}
          disabled={!voiceSupported}
          aria-label={listening ? '停止语音输入' : '语音输入'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0 ${
            listening
              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
              : voiceSupported
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {listening ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      {voiceError && (
        <div className="flex-shrink-0 bg-rose-50 border-t border-rose-100 px-4 py-2 text-xs text-rose-600 flex items-center gap-2">
          <Mic className="w-3.5 h-3.5 flex-shrink-0" />
          {voiceError}
        </div>
      )}
    </div>
  );
}
