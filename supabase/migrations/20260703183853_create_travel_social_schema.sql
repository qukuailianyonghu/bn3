/*
# WanderWise Social Travel App - Initial Schema

## Overview
Creates all tables needed for a senior-focused social travel app with five main sections:
Discovery (explore destinations), Travel (trip planning), Events (post & browse events),
Companions (find travel buddies), and Profiles.

## New Tables

### profiles
- id (uuid, FK to auth.users)
- full_name, avatar_url, bio, location, age, interests (text[])
- travel_style: text (adventure, relaxed, cultural, etc.)
- created_at, updated_at

### destinations
- id, name, country, region, description, image_url
- category: text (cultural, nature, beach, city, etc.)
- rating (numeric), review_count (int)
- created_at

### trips
- id, user_id (FK profiles), title, destination, description
- start_date, end_date, status (planning / active / completed)
- image_url, is_public (bool)
- created_at, updated_at

### events
- id, user_id (FK profiles), title, description, location
- event_date, event_time, max_attendees, category
- image_url, is_public
- created_at, updated_at

### event_attendees
- id, event_id (FK events), user_id (FK profiles)
- created_at

### companion_requests
- id, from_user_id, to_user_id
- message, trip_id (nullable FK trips)
- status: text (pending / accepted / declined)
- created_at

### posts (discovery feed)
- id, user_id, title, body, image_url
- destination_name, likes (int)
- created_at, updated_at

### post_likes
- id, post_id, user_id, created_at

## Security
- RLS enabled on all tables
- Authenticated users own their rows
- Public content (destinations, published trips, public posts, events) readable by all authenticated users
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text DEFAULT '',
  location text DEFAULT '',
  age integer,
  interests text[] DEFAULT '{}',
  travel_style text DEFAULT 'relaxed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- DESTINATIONS (seeded/public reference data)
CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  region text DEFAULT '',
  description text DEFAULT '',
  image_url text,
  category text DEFAULT 'cultural',
  rating numeric(2,1) DEFAULT 4.5,
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "destinations_select" ON destinations;
CREATE POLICY "destinations_select" ON destinations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "destinations_insert" ON destinations;
CREATE POLICY "destinations_insert" ON destinations FOR INSERT TO authenticated WITH CHECK (true);

-- TRIPS
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  destination text NOT NULL,
  description text DEFAULT '',
  start_date date,
  end_date date,
  status text DEFAULT 'planning',
  image_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trips_select" ON trips;
CREATE POLICY "trips_select" ON trips FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_insert" ON trips;
CREATE POLICY "trips_insert" ON trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_update" ON trips;
CREATE POLICY "trips_update" ON trips FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_delete" ON trips;
CREATE POLICY "trips_delete" ON trips FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  location text NOT NULL,
  event_date date NOT NULL,
  event_time text DEFAULT '',
  max_attendees integer,
  category text DEFAULT 'social',
  image_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON events;
CREATE POLICY "events_select" ON events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "events_insert" ON events;
CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "events_update" ON events;
CREATE POLICY "events_update" ON events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_delete" ON events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- EVENT ATTENDEES
CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendees_select" ON event_attendees;
CREATE POLICY "attendees_select" ON event_attendees FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "attendees_insert" ON event_attendees;
CREATE POLICY "attendees_insert" ON event_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "attendees_delete" ON event_attendees;
CREATE POLICY "attendees_delete" ON event_attendees FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COMPANION REQUESTS
CREATE TABLE IF NOT EXISTS companion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text DEFAULT '',
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companion_select" ON companion_requests;
CREATE POLICY "companion_select" ON companion_requests FOR SELECT TO authenticated USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "companion_insert" ON companion_requests;
CREATE POLICY "companion_insert" ON companion_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "companion_update" ON companion_requests;
CREATE POLICY "companion_update" ON companion_requests FOR UPDATE TO authenticated USING (auth.uid() = to_user_id) WITH CHECK (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "companion_delete" ON companion_requests;
CREATE POLICY "companion_delete" ON companion_requests FOR DELETE TO authenticated USING (auth.uid() = from_user_id);

-- POSTS
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text DEFAULT '',
  image_url text,
  destination_name text DEFAULT '',
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select" ON posts;
CREATE POLICY "posts_select" ON posts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_update" ON posts;
CREATE POLICY "posts_update" ON posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_delete" ON posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- POST LIKES
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_likes_select" ON post_likes;
CREATE POLICY "post_likes_select" ON post_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "post_likes_insert" ON post_likes;
CREATE POLICY "post_likes_insert" ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_likes_delete" ON post_likes;
CREATE POLICY "post_likes_delete" ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companion_from ON companion_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_companion_to ON companion_requests(to_user_id);
