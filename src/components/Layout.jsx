import {
  LayoutDashboard,
  PlusCircle,
  Calendar,
  BarChart3,
  User,
  Wallet,
  Sun,
  Moon,
  CalendarClock,
  LogOut,
  LogIn,
} from 'lucide-react';
import { getCurrencySymbol } from '../utils/exportUtils';

const navItems = [
  { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'add', label: 'Add Expense', icon: PlusCircle },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'subscriptions', label: 'Subscriptions', icon: CalendarClock },
  { id: 'analytics', label: 'Insights', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function Layout({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  currency = 'PHP',
  backendConnected = false,
  currentUser = null,
  onOpenAuth,
  onLogout,
  children,
}) {
  const userInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen flex flex-1 bg-[#FDFBF7] dark:bg-dark-bg transition-colors duration-300">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-white dark:bg-dark-card border-r border-[#E6E6FA]/60 dark:border-dark-border z-30 transition-colors duration-300">
          {/* Brand */}
          <div className="flex items-center justify-between px-6 py-7">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 flex items-center justify-center shadow-sm">
                <Wallet size={20} className="text-[#4A4556] dark:text-dark-text" />
              </div>
              <span className="text-lg font-bold text-[#4A4556] dark:text-dark-text tracking-tight">
                SpendWise
              </span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 dark:border-dark-border text-[#4A4556] dark:text-dark-text">
              {getCurrencySymbol(currency)} {currency}
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 mt-2 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 cursor-pointer
                    ${
                      active
                        ? 'bg-[#E6E6FA]/50 dark:bg-[#E6E6FA]/15 text-[#4A4556] dark:text-dark-text shadow-sm font-semibold'
                        : 'text-[#9B93A9] dark:text-dark-muted hover:bg-[#E6E6FA]/20 dark:hover:bg-[#E6E6FA]/10 hover:text-[#4A4556] dark:hover:text-dark-text'
                    }
                  `}
                >
                  <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Dark mode toggle */}
          <div className="px-4 py-2">
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#9B93A9] dark:text-dark-muted hover:bg-[#E6E6FA]/20 dark:hover:bg-[#E6E6FA]/10 hover:text-[#4A4556] dark:hover:text-dark-text transition-all cursor-pointer"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          {/* Sidebar footer / User Account */}
          <div className="p-4 border-t border-[#E6E6FA]/40 dark:border-dark-border">
            {currentUser ? (
              <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/50 dark:border-dark-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full shrink-0 bg-gradient-to-br from-[#FCE4EC] to-[#E6E6FA] dark:from-[#FCE4EC]/30 dark:to-[#E6E6FA]/30 flex items-center justify-center text-sm font-bold text-[#4A4556] dark:text-dark-text shadow-xs">
                    {userInitial}
                  </div>
                  <div className="text-left truncate">
                    <p className="text-xs font-bold text-[#4A4556] dark:text-dark-text truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-[#9B93A9] dark:text-dark-muted truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-[#9B93A9] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer shrink-0"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="w-full py-2.5 px-3 rounded-2xl bg-[#574C78] hover:bg-[#463c63] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogIn size={15} />
                <span>Sign In / Register</span>
              </button>
            )}

            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <p className="text-[10px] text-[#9B93A9] dark:text-dark-muted font-medium">
                {backendConnected ? 'MongoDB Cloud Live' : 'Offline / Local'}
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main wrapper ── */}
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* ── Mobile top header ── */}
          <header className="lg:hidden sticky top-0 z-20 bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg border-b border-[#E6E6FA]/40 dark:border-dark-border transition-colors duration-300">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E6E6FA] to-[#E0F4F1] dark:from-[#E6E6FA]/30 dark:to-[#E0F4F1]/30 flex items-center justify-center shadow-sm">
                  <Wallet size={18} className="text-[#4A4556] dark:text-dark-text" />
                </div>
                <span className="text-base font-bold text-[#4A4556] dark:text-dark-text tracking-tight">
                  SpendWise
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FDFBF7] dark:bg-dark-bg border border-[#E6E6FA]/60 text-[#4A4556] dark:text-dark-text flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  {getCurrencySymbol(currency)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile dark mode toggle */}
                <button
                  onClick={() => setDarkMode((d) => !d)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#9B93A9] dark:text-dark-muted hover:bg-[#E6E6FA]/20 dark:hover:bg-[#E6E6FA]/10 transition-colors cursor-pointer"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                {/* Mobile User Profile Button */}
                <button
                  onClick={currentUser ? onLogout : onOpenAuth}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FCE4EC] to-[#E6E6FA] dark:from-[#FCE4EC]/30 dark:to-[#E6E6FA]/30 flex items-center justify-center text-xs font-semibold text-[#4A4556] dark:text-dark-text shadow-sm cursor-pointer"
                >
                  {userInitial}
                </button>
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8 pb-24 lg:pb-8">
            {children}
          </main>

          {/* ── Mobile bottom navigation ── */}
          <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 dark:bg-dark-card/95 backdrop-blur-lg border-t border-[#E6E6FA]/40 dark:border-dark-border transition-colors duration-300">
            <div className="flex items-center justify-around px-1 py-1.5 max-w-lg mx-auto">
              {navItems.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`
                      flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl
                      transition-all duration-200 cursor-pointer min-w-[50px]
                      ${
                        active
                          ? 'text-[#4A4556] dark:text-dark-text font-bold'
                          : 'text-[#9B93A9] dark:text-dark-muted'
                      }
                    `}
                  >
                    <span
                      className={`
                        flex items-center justify-center w-9 h-9 rounded-xl
                        transition-all duration-200
                        ${active ? 'bg-[#E6E6FA]/60 dark:bg-[#E6E6FA]/20 shadow-xs scale-105' : ''}
                      `}
                    >
                      <Icon size={19} strokeWidth={active ? 2.2 : 1.6} />
                    </span>
                    <span
                      className={`text-[9px] transition-opacity duration-200 ${
                        active ? 'opacity-100 font-bold' : 'opacity-70'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </nav>
        </div>
      </div>
    </div>
  );
}
