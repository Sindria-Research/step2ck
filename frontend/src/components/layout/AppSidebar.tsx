import { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FlaskConical, ChevronLeft, ChevronRight, Sun, Moon, LogOut, Settings, CreditCard, User } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { APP_NAME, getLogoUrl } from '../../config/branding';

const coreNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/exam/config', label: 'New Test', icon: PlusCircle },
];

const toolsNav = [
  { to: '/lab-values', label: 'Lab Values', icon: FlaskConical },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggle } = useSidebar();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isExamPage = location.pathname === '/exam';
  const logoUrl = getLogoUrl(theme);

  if (isExamPage) return null;

  const handleLogoClick = () => {
    toggle();
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-primary)] transition-[width] duration-200 ease-in-out overflow-hidden ${
        collapsed ? 'w-14' : 'w-56'
      }`}
      style={{ transitionDuration: '200ms' }}
      aria-label="Main navigation"
    >
      {/* Logo + app name: click toggles expand/collapse */}
      <div
        className={`flex items-center h-14 border-b border-[var(--color-border)] shrink-0 ${collapsed ? 'justify-center px-0' : 'gap-2 px-3'}`}
      >
        <button
          type="button"
          onClick={handleLogoClick}
          className={`flex items-center rounded-md focus-ring ${collapsed ? 'p-2' : 'gap-3 min-w-0 flex-1 py-2 pr-2 text-left'}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <img src={logoUrl} alt="" className="w-8 h-8 shrink-0 rounded-lg object-contain" />
          {!collapsed && (
            <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate font-display">
              {APP_NAME}
            </span>
          )}
        </button>
        {!collapsed && (
          <button
            type="button"
            onClick={toggle}
            className="p-2 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring shrink-0"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
      {collapsed && (
        <div className="flex justify-center py-1.5 border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={toggle}
            className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] focus-ring"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto min-h-0">
        {coreNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus-ring ${
                isActive
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
        {toolsNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus-ring ${
                isActive
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User area – ChatGPT-style: user block + Settings, Billing, theme, logout */}
      <div className="p-2 border-t border-[var(--color-border)] space-y-0.5">
        {user && !collapsed && (
          <>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
              </div>
              <span className="flex-1 truncate text-[var(--color-text-secondary)]">
                {user.display_name || user.email}
              </span>
              <ChevronRight
                className={`w-4 h-4 shrink-0 text-[var(--color-text-muted)] transition-transform ${userMenuOpen ? 'rotate-90' : ''}`}
              />
            </button>
            {userMenuOpen && (
              <div className="pl-2 pr-1 py-1 space-y-0.5 animate-fade-in">
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(false); /* TODO: open settings */ }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                >
                  <Settings className="w-4 h-4 shrink-0 opacity-70" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(false); /* TODO: open billing */ }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                >
                  <CreditCard className="w-4 h-4 shrink-0 opacity-70" />
                  Billing
                </button>
                <button
                  type="button"
                  onClick={() => { toggleTheme(); setUserMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0 opacity-70" /> : <Moon className="w-4 h-4 shrink-0 opacity-70" />}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                >
                  <LogOut className="w-4 h-4 shrink-0 opacity-70" />
                  Sign out
                </button>
              </div>
            )}
          </>
        )}
        {user && collapsed && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center w-full p-2 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] focus-ring"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
