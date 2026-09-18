import { Globe, Plane, Calendar, Users, CircleUser as UserCircle } from 'lucide-react';
import React from 'react';

type Tab = 'discovery' | 'travel' | 'events' | 'companions' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'discovery', label: '发现', Icon: Globe },
  { id: 'travel', label: '旅行', Icon: Plane },
  { id: 'events', label: '活动', Icon: Calendar },
  { id: 'companions', label: '伴伴', Icon: Users },
  { id: 'profile', label: '我的', Icon: UserCircle },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-oshiruco-50/95 backdrop-blur-md border-t border-oshiruco-200 shadow-[0_-4px_20px_rgba(111,66,29,0.08)]">
      <div className="max-w-md mx-auto flex">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all duration-200 relative ${active ? 'text-oshiruco-600' : 'text-oshiruco-300 hover:text-oshiruco-500'}`}
            >
              <Icon className={`w-6 h-6 transition-transform duration-200 ${active ? 'scale-110' : ''}`} strokeWidth={active ? 2.2 : 1.8} />
              <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-oshiruco-700' : ''}`}>{label}</span>
              {active && <span className="absolute bottom-0 w-8 h-1 bg-oshiruco-500 rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
