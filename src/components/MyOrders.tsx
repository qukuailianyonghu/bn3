import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../lib/database.types';
import {
  ChevronLeft, Clock, CheckCircle2, XCircle, Package, Wallet,
  Calendar, ChevronRight, Receipt, Inbox,
} from 'lucide-react';

type StatusFilter = 'all' | 'pending_payment' | 'paid' | 'cancelled';

const STATUS_CONFIG: Record<Order['status'], {
  label: string;
  icon: React.FC<{ className?: string }>;
  badge: string;
  dot: string;
  accent: string;
}> = {
  pending_payment: {
    label: '待付款',
    icon: Clock,
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    accent: 'text-amber-600',
  },
  paid: {
    label: '已付款',
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    accent: 'text-emerald-600',
  },
  cancelled: {
    label: '已取消',
    icon: XCircle,
    badge: 'bg-gray-100 text-gray-500',
    dot: 'bg-gray-400',
    accent: 'text-gray-400',
  },
};

const TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'pending_payment', label: '待付款' },
  { id: 'paid', label: '已付款' },
  { id: 'cancelled', label: '已取消' },
];

const ORDER_IMAGES = [
  'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?w=400',
  'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?w=400',
  'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?w=400',
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=400',
  'https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg?w=400',
];

export default function MyOrders({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusFilter>('all');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [payProcessing, setPayProcessing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user?.id || '')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);

  const counts = {
    all: orders.length,
    pending_payment: orders.filter(o => o.status === 'pending_payment').length,
    paid: orders.filter(o => o.status === 'paid').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const confirmPayOrder = async () => {
    if (!payOrder) return;
    setPayProcessing(true);
    const { data } = await supabase
      .from('orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', payOrder.id)
      .select('*')
      .single();
    if (data) {
      setOrders(prev => prev.map(o => o.id === payOrder.id ? { ...(data as Order) } : o));
    }
    setPayProcessing(false);
    setPayOrder(null);
  };

  const cancelOrder = async (order: Order) => {
    setCancellingId(order.id);
    const { data } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .select('*')
      .single();
    if (data) {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...(data as Order) } : o));
    }
    setCancellingId(null);
  };

  const cancelFromDialog = async () => {
    if (!payOrder) return;
    setCancellingId(payOrder.id);
    const { data } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', payOrder.id)
      .select('*')
      .single();
    if (data) {
      setOrders(prev => prev.map(o => o.id === payOrder.id ? { ...(data as Order) } : o));
    }
    setCancellingId(null);
    setPayOrder(null);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-5 pt-10 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">我的订单</h1>
            <p className="text-white/60 text-xs mt-0.5">查看和管理您的旅行订单</p>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex-shrink-0">
        <div className="flex gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
                tab === id
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {label}
              {counts[id] > 0 && (
                <span className={`ml-1 text-[10px] ${tab === id ? 'text-white/70' : 'text-gray-400'}`}>
                  ({counts[id]})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Order list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Inbox className="w-16 h-16 text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-600">
              {tab === 'all' ? '暂无订单' : `暂无${STATUS_CONFIG[tab as Order['status']].label}订单`}
            </p>
            <p className="text-xs text-gray-400 mt-1">去旅行主题页面报名即可生成订单</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const conf = STATUS_CONFIG[order.status];
              const StatusIcon = conf.icon;
              return (
                <div
                  key={order.id}
                  onClick={() => setPayOrder(order)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                >
                  {/* Order header */}
                  <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Receipt className="w-3.5 h-3.5" />
                      <span className="font-mono">{order.order_no}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${conf.badge}`}>
                      <StatusIcon className="w-3 h-3" />
                      {conf.label}
                    </span>
                  </div>

                  {/* Order body */}
                  <div className="px-4 py-3.5 flex gap-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {order.image_url ? (
                        <img src={order.image_url} alt={order.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 leading-snug mb-1">{order.title}</h3>
                      {order.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{order.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Order footer */}
                  <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-gray-500">实付</span>
                      <span className="text-lg font-extrabold text-slate-800">
                        ¥{order.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending_payment' && (
                        <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" /> 点击订单付款
                        </span>
                      )}
                      {order.status === 'paid' && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          交易完成
                        </span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="text-xs text-gray-400">订单已关闭</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment dialog */}
      {payOrder && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end" onClick={() => !payProcessing && setPayOrder(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">订单支付</h3>
              <button onClick={() => !payProcessing && setPayOrder(null)} className="text-gray-400">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Order summary */}
            <div className="flex gap-3 mb-5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {payOrder.image_url ? (
                  <img src={payOrder.image_url} alt={payOrder.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-7 h-7 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 leading-snug">{payOrder.title}</h4>
                <p className="text-xs text-gray-400 font-mono mt-1">{payOrder.order_no}</p>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-amber-50 rounded-2xl p-4 mb-5 text-center">
              <p className="text-xs text-gray-500 mb-1">应付金额</p>
              <p className="text-3xl font-extrabold text-amber-600">
                ¥{payOrder.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Payment method */}
            <div className="space-y-2 mb-5">
              <p className="text-xs font-semibold text-gray-500 mb-2">选择支付方式</p>
              {[
                { id: 'wechat', label: '微信支付', icon: '💬', desc: '推荐使用' },
                { id: 'alipay', label: '支付宝', icon: '💙', desc: '' },
                { id: 'card', label: '银行卡', icon: '💳', desc: '储蓄卡/信用卡' },
              ].map((method, i) => (
                <div key={method.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition ${i === 0 ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200'}`}>
                  <span className="text-xl">{method.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{method.label}</p>
                    {method.desc && <p className="text-xs text-gray-400">{method.desc}</p>}
                  </div>
                  {i === 0 && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={cancelFromDialog}
                disabled={payProcessing || cancellingId === payOrder.id}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition disabled:opacity-50"
              >
                {cancellingId === payOrder.id ? '取消中…' : '取消订单'}
              </button>
              <button
                onClick={confirmPayOrder}
                disabled={payProcessing || cancellingId === payOrder.id}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {payProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    支付中…
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    确认支付 ¥{payOrder.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
