import React from 'react';
import { Home, BarChart3, Target, Users, Search } from 'lucide-react';
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
    { id: 'dashboard', icon: Home, label: 'Dashboard', roles: [Role.SWIMMER, Role.PARENT] },
    { id: 'admin', icon: BarChart3, label: 'Results', roles: [Role.ADMIN, Role.COACH, Role.PARENT, Role.SWIMMER] },
    { id: 'focus', icon: Target, label: 'Focus', roles: [Role.SWIMMER, Role.COACH, Role.PARENT] },
    { id: 'roster', icon: Users, label: 'Team', roles: [Role.COACH, Role.ADMIN, Role.PARENT] },
  ].filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1a] pb-24">
      {/* Header */}
      <header className="bg-[#0a0f1a]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 flex items-center justify-center float">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-sky-400" fill="currentColor">
                <path d="M22 12c0 1.1-.9 2-2 2-.26 0-.5-.05-.73-.13l-1.94.78a3.002 3.002 0 01-2.51 2.22v1.05c.53.5.88 1.21.88 1.98 0 1.51-1.22 2.74-2.73 2.74-1.51 0-2.73-1.23-2.73-2.74 0-.77.35-1.48.88-1.98v-1.05a3.002 3.002 0 01-2.51-2.22l-1.94-.78c-.23.08-.47.13-.73.13-1.1 0-2-.9-2-2s.9-2 2-2c.26 0 .5.05.73.13l1.94-.78c.25-1.28 1.25-2.27 2.51-2.22V7.1c-.53-.5-.88-1.21-.88-1.98C8.24 3.61 9.46 2.38 10.97 2.38c1.51 0 2.73 1.23 2.73 2.74 0 .77-.35 1.48-.88 1.98v1.05c1.26-.05 2.26.94 2.51 2.22l1.94.78c.23-.08.47-.13.73-.13 1.1 0 2 .9 2 2z"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white italic">
              SwimQual
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button className="w-9 h-9 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={onLogout}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-display font-bold text-sm"
              title="Switch User"
            >
              {user.name.charAt(0)}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full page-enter">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0f1a]/95 backdrop-blur-xl border-t border-white/5 px-4 py-2 z-50">
        <div className="flex justify-around items-center max-w-2xl mx-auto">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                data-testid={`nav-${id}`}
                className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-xl transition-all btn-press icon-bounce ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-sky-500 shadow-lg shadow-sky-500/30 glow-pulse' 
                    : 'bg-transparent hover:bg-slate-800/60'
                }`}>
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isActive ? 'text-white' : 'text-slate-500'
                }`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
