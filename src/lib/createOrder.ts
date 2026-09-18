import { supabase } from './supabase';

export async function createOrder(opts: {
  userId: string;
  title: string;
  amount: number;
  description?: string;
  image_url?: string | null;
}): Promise<string | null> {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 900) + 100);
  const orderNo = `ORD-${dateStr}-${rand}`;
  const { data, error } = await supabase.from('orders').insert({
    user_id: opts.userId,
    order_no: orderNo,
    title: opts.title,
    amount: opts.amount,
    description: opts.description || '',
    image_url: opts.image_url || null,
    status: 'pending_payment',
  }).select('id').single();
  if (error) return null;
  return data?.id ?? null;
}
