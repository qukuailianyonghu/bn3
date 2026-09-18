export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  location: string;
  age: number | null;
  interests: string[];
  travel_style: string;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  description: string;
  image_url: string | null;
  category: string;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  status: 'pending_payment' | 'planning' | 'active' | 'completed';
  image_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  event_time: string;
  max_attendees: number | null;
  category: string;
  image_url: string | null;
  is_public: boolean;
  fee: number | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  event_attendees?: { id: string; user_id: string; payment_status?: string }[];
}

export type EventPaymentStatus = 'pending_payment' | 'paid' | 'not_attended' | 'attended';

export interface MyEventAttendance {
  id: string;
  event_id: string;
  user_id: string;
  payment_status: EventPaymentStatus;
  created_at: string;
  events: Event;
}

export interface CompanionRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  trip_id: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  body: string;
  image_url: string | null;
  destination_name: string;
  likes: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  post_likes?: { id: string; user_id: string }[];
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile;
}

export interface CompanionMemo {
  id: string;
  user_id: string;
  memo_type: 'medication' | 'bedtime' | 'blood_pressure';
  title: string;
  scheduled_time: string;
  note: string;
  done: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_no: string;
  title: string;
  image_url: string | null;
  amount: number;
  status: 'pending_payment' | 'paid' | 'cancelled';
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ThemeRegistration {
  id: string;
  user_id: string;
  theme_id: string;
  note: string;
  created_at: string;
}

export interface LifeMemoirChat {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface LifeMemoirEvent {
  year: string;
  title: string;
  description: string;
}

export interface LifeMemoirRecord {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  events: LifeMemoirEvent[];
  chat_messages: { role: string; content: string }[];
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      destinations: { Row: Destination; Insert: Partial<Destination>; Update: Partial<Destination> };
      trips: { Row: Trip; Insert: Partial<Trip>; Update: Partial<Trip> };
      events: { Row: Event; Insert: Partial<Event>; Update: Partial<Event> };
      event_attendees: { Row: { id: string; event_id: string; user_id: string; payment_status: string; created_at: string }; Insert: Partial<{ id: string; event_id: string; user_id: string; payment_status: string; created_at: string }>; Update: Partial<{ id: string; event_id: string; user_id: string; payment_status: string; created_at: string }> };
      companion_requests: { Row: CompanionRequest; Insert: Partial<CompanionRequest>; Update: Partial<CompanionRequest> };
      posts: { Row: Post; Insert: Partial<Post>; Update: Partial<Post> };
      post_likes: { Row: { id: string; post_id: string; user_id: string; created_at: string }; Insert: Partial<{ id: string; post_id: string; user_id: string; created_at: string }>; Update: Partial<{ id: string; post_id: string; user_id: string; created_at: string }> };
    };
  };
};
