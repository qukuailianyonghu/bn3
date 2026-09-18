import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthScreen from './components/AuthScreen';
import Discovery from './components/Discovery';
import Travel from './components/Travel';
import Events from './components/Events';
import Companions from './components/Companions';
import MyProfile from './components/MyProfile';
import BottomNav from './components/BottomNav';

type Tab = 'discovery' | 'travel' | 'events' | 'companions' | 'profile';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('discovery');

  if (loading) {
    return (
      <div className="min-h-screen bg-oshiruco-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-oshiruco-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-oshiruco-700 font-semibold tracking-wide">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-oshiruco-50 max-w-md mx-auto relative">
      <div id="main-scroll" className="h-screen overflow-y-auto">
        {activeTab === 'discovery' && <Discovery />}
        {activeTab === 'travel' && <Travel />}
        {activeTab === 'events' && <Events />}
        {activeTab === 'companions' && <Companions />}
        {activeTab === 'profile' && <MyProfile />}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
