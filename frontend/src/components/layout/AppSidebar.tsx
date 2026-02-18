import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FlaskConical, Settings, ChevronLeft, ChevronDown, Sun, Moon, LogOut, User } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { APP_NAME, getLogoUrl } from '../../config/branding';

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/exam/config', label: 'New Test', icon: PlusCircle },
  { to: '/lab-values', label: 'Lab Values', icon: FlaskConical },
];

const bottomNav = [{ to: '/settings', label: 'Settings', icon: Settings }];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggle } = useSidebar();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
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

  // Close user menu on click outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  return (
    <aside
      className={`shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-primary)] transition-[width] duration-200 ease-in-out overflow-hidden ${
        collapsed ? 'w-14' : 'w-56'
      }`}
      style={{ transitionDuration: '200ms' }}
      aria-label="Main navigation"
    >
      {/* Logo + app name: click toggles expand/collapse. No chevron when collapsed. */}
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

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto min-h-0 flex flex-col">
        <div className="space-y-0.5">
          {mainNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus-ring ${
                  isActive
                    ? 'bg-[var(--color-bg-active)] text-[var(--color-accent-text)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </div>
        {!collapsed && (
          <div className="mt-auto pt-2 border-t border-[var(--color-border)] space-y-0.5">
            {bottomNav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus-ring ${
                    isActive
                      ? 'bg-[var(--color-bg-active)] text-[var(--color-accent-text)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}
        {collapsed && (
          <div className="mt-auto pt-2 border-t border-[var(--color-border)]">
            <NavLink
              to="/settings"
              className="flex items-center justify-center p-2 rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] focus-ring"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </NavLink>
          </div>
        )}
      </nav>

      {/* User area: popup opens upward */}
      <div className="p-2 border-t border-[var(--color-border)] relative" ref={userMenuRef}>
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
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {userMenuOpen && (
              <div
                className="absolute left-2 right-2 bottom-full mb-1 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-[var(--shadow-md)] animate-fade-in"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => { toggleTheme(); setUserMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring w-full text-left"
                  role="menuitem"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0 opacity-70" /> : <Moon className="w-4 h-4 shrink-0 opacity-70" />}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring w-full text-left"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 shrink-0 opacity-70" />
                  Sign out
                </button>
                <div className="border-t border-[var(--color-border)] my-1" />
                <NavLink
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                  role="menuitem"
                >
                  <Settings className="w-4 h-4 shrink-0 opacity-70" />
                  Settings
                </NavLink>
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
