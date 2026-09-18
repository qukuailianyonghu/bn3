import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../lib/createOrder';
import {
  ChevronLeft, Crown, Check, Sparkles, Gift, Star,
  Heart, ShieldCheck, Ticket, Loader2, AlertCircle, UserRoundPlus,
} from 'lucide-react';

const MEMBERSHIP_PRICE = 299;

const BENEFITS: { icon: typeof Crown; title: string; desc: string }[] = [
  { icon: Crown, title: '专属会员标识', desc: '个人主页展示金色皇冠徽章，彰显尊贵身份' },
  { icon: Star, title: '优先报名权', desc: '热门活动和旅行主题提前 48 小时优先报名' },
  { icon: Gift, title: '会员专享礼遇', desc: '生日月专属礼物，节日限定惊喜福利' },
  { icon: Heart, title: '专属伴伴服务', desc: '一对一旅行管家，贴心规划每一次出行' },
  { icon: ShieldCheck, title: '安心出行保障', desc: '旅行意外险全覆盖，出行更安心' },
  { icon: Ticket, title: '专属折扣优惠', desc: '全部旅行主题享受会员专属 9 折优惠' },
];

export default function Membership({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBecomeMember = async () => {
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      const desc = inviteCode.trim()
        ? `会员开通 · 邀请码 ${inviteCode.trim()}`
        : '会员开通 · 伴龄尊享会员';
      const orderId = await createOrder({
        userId: user.id,
        title: '伴龄尊享会员',
        amount: MEMBERSHIP_PRICE,
        description: desc,
        image_url: null,
      });
      if (!orderId) {
        setError('订单创建失败，请稍后重试。');
        setSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError('操作失败，请稍后重试。');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fbf7ef] overflow-y-auto animate-slide-up">
      <div className="max-w-md mx-auto pb-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#8f5524] to-[#6f421d] px-5 pt-10 pb-4 flex items-center gap-3 shadow-md">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <UserRoundPlus className="w-5 h-5 text-white" />
            <h1 className="text-xl font-bold text-white">成为会员</h1>
          </div>
        </div>

        {success ? (
          <div className="px-5 pt-16 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <Check className="w-10 h-10 text-emerald-600" strokeWidth={2.5} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#493323]">订单已创建</h2>
            <p className="mt-2 text-sm text-[#806c58] leading-relaxed max-w-[280px]">
              会员开通订单已生成，请前往「我的订单」完成付款，付款后即可享受全部会员权益。
            </p>
            <button
              onClick={onClose}
              className="mt-8 rounded-xl bg-[#8f5524] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#8f5524]/25 transition hover:bg-[#6f421d] active:scale-95"
            >
              返回个人主页
            </button>
          </div>
        ) : (
          <>
            {/* Gold membership card */}
            <div className="px-5 pt-6">
              <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#d4a84b] via-[#c8893e] to-[#a06820] p-6 shadow-[0_12px_30px_rgba(160,104,32,0.3)]">
                {/* Decorative shine */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
                <div className="absolute -left-6 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />

                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-6 h-6 text-white" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">BANLING</span>
                    </div>
                    <h2 className="mt-3 font-serif text-2xl font-bold text-white">伴龄尊享会员</h2>
                    <p className="mt-1 text-sm text-white/70">开启精彩人生下半场</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">年费</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-extrabold text-white">299</span>
                      <span className="text-base font-bold text-white/70">元</span>
                    </div>
                  </div>
                </div>

                <div className="relative mt-5 flex items-center gap-2 border-t border-white/20 pt-4">
                  <Sparkles className="w-4 h-4 text-white/80" />
                  <span className="text-xs text-white/80">六大权益 · 尊享一年</span>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="px-5 mt-6">
              <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#493323] mb-4">
                <Star className="w-5 h-5 text-[#c8893e]" fill="currentColor" />
                会员权益
              </h3>
              <div className="space-y-3">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-2xl border border-[#eadcc6] bg-white/80 p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f3eee3] to-[#e4d8c2]">
                      <Icon className="w-5.5 h-5.5 text-[#8f5524]" strokeWidth={1.7} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[#493323]">{title}</p>
                      <p className="mt-0.5 text-xs text-[#9a8771] leading-relaxed">{desc}</p>
                    </div>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Invitation code + submit */}
            <div className="px-5 mt-6">
              <div className="rounded-2xl border border-[#eadcc6] bg-white/80 p-5 shadow-sm">
                <label className="block text-sm font-semibold text-[#654831] mb-1.5">
                  邀请码
                </label>
                <p className="text-xs text-[#9a8771] mb-3">如有邀请码请填写，没有也可直接开通</p>
                <input
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="请输入邀请码（选填）"
                  className="w-full rounded-xl border border-[#e0cfb5] bg-[#fffdf9] px-4 py-3 text-sm outline-none transition focus:border-[#b0702e] focus:ring-2 focus:ring-[#c8893e]/15"
                />

                {error && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleBecomeMember}
                  disabled={submitting}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#c8893e] to-[#8f5524] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#8f5524]/25 transition hover:from-[#b0702e] hover:to-[#6f421d] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      正在创建订单...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      成为会员 · ¥{MEMBERSHIP_PRICE}
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-[#a28d77]">
                  点击开通将生成会员费订单，可在「我的订单」中查看付款
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
