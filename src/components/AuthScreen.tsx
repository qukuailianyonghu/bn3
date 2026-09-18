import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Eye, EyeOff, Users, Heart, ShieldCheck } from 'lucide-react';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      if (!fullName.trim()) { setError('请输入您的姓名。'); setLoading(false); return; }
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-oshiruco-50 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-oshiruco-500 to-oshiruco-700 rounded-2xl flex items-center justify-center shadow-lg shadow-oshiruco-500/30">
            <Users className="w-9 h-9 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/*<h1 className="font-serif text-3xl font-bold text-oshiruco-900 tracking-tight text-center leading-tight">*/}
        {/*  50歳から、<br />*/}
        {/*  <span className="heading-italic text-oshiruco-600">もっと</span>つながる。<br />*/}
        {/*  もっと楽しむ。*/}
        {/*</h1>*/}
        {/*<p className="text-oshiruco-700 font-medium text-sm mt-4 text-center leading-relaxed max-w-xs">*/}
        {/*  同世代だから話が合う。本人確認制だから安心。<br />*/}
        {/*  Companion Life は、50歳以上のためだけにつくられた<br />*/}
        {/*  コミュニティアプリです。*/}
        {/*</p>*/}

        <div className="flex gap-6 mb-8 mt-7">
          {[
            { icon: MapPin, label: '探索' },
            { icon: Users, label: '结识' },
            { icon: Heart, label: '分享' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-oshiruco-200">
                <Icon className="w-6 h-6 text-oshiruco-600" strokeWidth={1.8} />
              </div>
              <span className="text-xs font-medium text-oshiruco-700">{label}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-oshiruco-500/10 p-8 border border-oshiruco-100">
          <div className="flex bg-oshiruco-50 rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === m ? 'bg-white text-oshiruco-700 shadow-sm' : 'text-oshiruco-400 hover:text-oshiruco-600'}`}
              >
                {m === 'signin' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-oshiruco-800 mb-1.5">姓名</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="请输入您的姓名"
                  className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 focus:ring-2 focus:ring-oshiruco-100 outline-none text-base transition bg-oshiruco-50/50"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-oshiruco-800 mb-1.5">电子邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 focus:ring-2 focus:ring-oshiruco-100 outline-none text-base transition bg-oshiruco-50/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-oshiruco-800 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-oshiruco-200 focus:border-oshiruco-400 focus:ring-2 focus:ring-oshiruco-100 outline-none text-base transition bg-oshiruco-50/50"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-oshiruco-400 hover:text-oshiruco-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-oshiruco-500 to-oshiruco-600 hover:from-oshiruco-600 hover:to-oshiruco-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 text-base shadow-md shadow-oshiruco-500/20 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? '请稍候...' : mode === 'signin' ? '登录' : '创建账号'}
            </button>
          </form>

          <p className="text-center text-sm text-oshiruco-500 mt-5">
            {mode === 'signin' ? '还没有账号？' : '已有账号？'}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }} className="text-oshiruco-600 font-semibold hover:underline ml-1">
              {mode === 'signin' ? '立即注册' : '立即登录'}
            </button>
          </p>
        </div>

        {/* Trust badge */}
        <div className="flex items-center gap-1.5 mt-6 text-oshiruco-500">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-medium">本人確認制で安心・安全</span>
        </div>
      </div>

      <p className="text-center text-xs text-oshiruco-400 pb-6 font-serif italic">退休不是人生的终点，而是第二次出发。</p>
    </div>
  );
}
