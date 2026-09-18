/*
# Seed destinations with sample data

1. Data
  - Inserts sample destination rows across the categories the Discovery page filters by:
    '红色' (red tourism), '欧洲' (Europe), '日本' (Japan), '宗教' (religious).
  - Each row includes name, country, region, description, image_url (Pexels stock photos),
    category, rating, and review_count.
  - Uses ON CONFLICT DO NOTHING so re-running is safe (idempotent).

2. Security
  - No schema changes. RLS already enabled on `destinations`.
  - Insert is allowed by the existing `destinations_insert` policy (authenticated, WITH CHECK true).

3. Notes
  - This is reference/seed data — public and shared across all users.
  - Images are referenced from Pexels (not downloaded).
*/

INSERT INTO destinations (name, country, region, description, image_url, category, rating, review_count) VALUES
  -- 红色 (Red tourism)
  ('井冈山', '中国', '江西', '中国革命的摇篮，群山环抱中的红色圣地，感受革命先辈的峥嵘岁月。', 'https://images.pexels.com/photos/2073534/pexels-photo-2073534.jpeg', '红色', 4.8, 3241),
  ('延安', '中国', '陕西', '革命圣地延安，宝塔山下延河水，见证中国革命走向胜利的光辉历程。', 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg', '红色', 4.7, 2890),
  ('遵义', '中国', '贵州', '遵义会议旧址，历史转折之城，走进改变中国命运的关键时刻。', 'https://images.pexels.com/photos/2086361/pexels-photo-2086361.jpeg', '红色', 4.6, 1872),
  ('西柏坡', '中国', '河北', '新中国从这里走来，太行山深处的红色记忆，重温赶考精神。', 'https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg', '红色', 4.5, 1234),

  -- 欧洲 (Europe)
  ('巴黎', '法国', '法兰西岛', '浪漫之都巴黎，埃菲尔铁塔下的灯光、卢浮宫的艺术瑰宝与塞纳河畔的悠闲时光。', 'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg', '欧洲', 4.9, 12503),
  ('罗马', '意大利', '拉齐奥', '永恒之城罗马，斗兽场、梵蒂冈与特莱维喷泉，每一步都是千年历史的回响。', 'https://images.pexels.com/photos/2225442/pexels-photo-2225442.jpeg', '欧洲', 4.8, 9876),
  ('巴塞罗那', '西班牙', '加泰罗尼亚', '高迪的建筑奇迹与地中海阳光交织，圣家堂与兰布拉大道等待您的探索。', 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg', '欧洲', 4.8, 8765),
  ('维也纳', '奥地利', '维也纳', '音乐之都维也纳，美泉宫的华丽、金色大厅的旋律与咖啡馆的醇香。', 'https://images.pexels.com/photos/1098460/pexels-photo-1098460.jpeg', '欧洲', 4.7, 5432),

  -- 日本 (Japan)
  ('京都', '日本', '近畿', '千年古都京都，金阁寺的辉煌、岚山的竹林与祇园的艺伎，感受最纯正的日式美学。', 'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg', '日本', 4.9, 8234),
  ('东京', '日本', '关东', '繁华与传统的交汇，浅草寺的香火、涩谷的十字路口与富士山的远景。', 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg', '日本', 4.8, 10987),
  ('大阪', '日本', '近畿', '天下厨房大阪，道顿堀的美食、大阪城的壮丽与热情开朗的关西人情。', 'https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg', '日本', 4.6, 4567),
  ('北海道', '日本', '北海道', '雪国童话北海道，薰衣草花田、温泉与滑雪，四季皆美的北国风情。', 'https://images.pexels.com/photos/2060260/pexels-photo-2060260.jpeg', '日本', 4.7, 6789),

  -- 宗教 (Religious)
  ('拉萨', '中国', '西藏', '圣城拉萨，布达拉宫的庄严、大昭寺的虔诚与雪域高原的纯净天空。', 'https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg', '宗教', 4.9, 4321),
  ('五台山', '中国', '山西', '佛教四大名山之首，文殊菩萨道场，青庙黄庙共存的佛教圣地。', 'https://images.pexels.com/photos/2086361/pexels-photo-2086361.jpeg', '宗教', 4.7, 2345),
  ('瓦拉纳西', '印度', '北方邦', '恒河之畔的圣城，晨祷的钟声、河畔的祭火与千年不变的信仰力量。', 'https://images.pexels.com/photos/2060260/pexels-photo-2060260.jpeg', '宗教', 4.6, 3456),
  ('耶路撒冷', '以色列', '耶路撒冷', '三大宗教的圣地，哭墙的叹息、圣墓教堂的庄严与老城的千年沧桑。', 'https://images.pexels.com/photos/2225442/pexels-photo-2225442.jpeg', '宗教', 4.8, 5678)
ON CONFLICT DO NOTHING;
