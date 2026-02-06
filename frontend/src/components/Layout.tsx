import React from 'react';
import { Home, Users, Target, Settings, Trophy, LogOut } from 'lucide-react';
import { User, Role } from '../types';

interface Props {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<Props> = ({ children, activeTab, setActiveTab, title, user, onLogout }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home', roles: [Role.SWIMMER, Role.PARENT] },
    { id: 'roster', icon: Users, label: 'Team', roles: [Role.COACH, Role.ADMIN, Role.PARENT] },
    { id: 'focus', icon: Target, label: 'Focus', roles: [Role.SWIMMER, Role.COACH, Role.PARENT] },
    { id: 'admin', icon: Settings, label: 'Admin', roles: [Role.ADMIN, Role.COACH, Role.PARENT] },
  ].filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Trophy className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase italic">
              SwimQual<span className="text-blue-600">.app</span>
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 leading-none">{user.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{user.role}</p>
            </div>
            <button 
              onClick={onLogout}
              className="bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Switch User"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-black text-slate-900 mb-6">{title}</h2>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 z-10 shadow-lg">
        <div className="flex justify-around items-center max-w-2xl mx-auto">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center space-y-1 transition-colors px-4 py-1 rounded-lg ${
                activeTab === id ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;