import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Search,
  FileText,
  Layers,
  Bookmark,
  FlaskConical,
  Settings,
  ChevronLeft,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  BookOpen,
  ClipboardCheck,
  History,
  CalendarDays,
  Crown,
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/api';
import { useTheme } from '../../context/ThemeContext';
import { APP_NAME, getLogoUrl } from '../../config/branding';
import { ProBadge } from '../ProGate';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Study',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/study-plan', label: 'Study Plan', icon: CalendarDays },
    ],
  },
  {
    label: 'Practice',
    items: [
      { to: '/exam/config?type=practice', label: 'New Practice', icon: BookOpen },
      { to: '/practice-history', label: 'Practice History', icon: History },
    ],
  },
  {
    label: 'Test',
    items: [
      { to: '/exam/config?type=test', label: 'New Test', icon: ClipboardCheck },
      { to: '/previous-tests', label: 'Previous Tests', icon: ClipboardList },
    ],
  },
  {
    label: 'Review',
    items: [
      { to: '/performance', label: 'Performance', icon: BarChart3 },
      { to: '/search', label: 'Search', icon: Search },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/notes', label: 'Notes', icon: FileText },
      { to: '/flashcards', label: 'Flashcards', icon: Layers },
      { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
      { to: '/lab-values', label: 'Lab Values', icon: FlaskConical },
    ],
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const { user, logout, isPro } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState<number | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const isExamPage = location.pathname === '/exam';
  const logoUrl = getLogoUrl(theme);

  // On mobile drawer, always show labels regardless of desktop collapsed state
  const isCollapsed = collapsed && !mobileOpen;

  useEffect(() => {
    if (!mobileOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusables = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length) focusables[0].focus();

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') { setMobileOpen(false); return; }
      if (e.key !== 'Tab') return;
      const current = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (current.length === 0) return;
      const first = current[0];
      const last = current[current.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search, setMobileOpen]);

  const refreshBookmarkCount = useCallback(() => {
    if (!user) {
      setBookmarkCount(null);
      return;
    }
    api.bookmarks.count().then((r) => setBookmarkCount(r.count)).catch(() => setBookmarkCount(null));
  }, [user]);

  useEffect(() => {
    refreshBookmarkCount();
  }, [refreshBookmarkCount, location.pathname]);

  useEffect(() => {
    const onBookmarksChange = () => refreshBookmarkCount();
    window.addEventListener('bookmarks-changed', onBookmarksChange);
    return () => window.removeEventListener('bookmarks-changed', onBookmarksChange);
  }, [refreshBookmarkCount]);

  if (isExamPage) return null;

  const handleLogoClick = () => {
    toggle();
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/');
  };

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

  const PRO_ROUTES = new Set(['/study-plan']);

  const renderNavItem = ({ to, label, icon: Icon }: NavItem, badge?: number | null) => {
    const showProBadge = !isPro && PRO_ROUTES.has(to.split('?')[0]);
    const hasQuery = to.includes('?');
    const [basePath, queryString] = hasQuery ? to.split('?') : [to, ''];

    const isItemActive = hasQuery
      ? location.pathname === basePath && location.search === `?${queryString}`
      : location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);

    return (
      <NavLink
        key={to}
        to={to}
        end={hasQuery}
        className={() =>
          `flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-md text-sm transition-colors focus-ring ${isItemActive
            ? 'bg-[var(--color-bg-active)] text-[var(--color-accent-text)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
          }`
        }
        title={isCollapsed ? label : undefined}
      >
        <Icon className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {showProBadge && <ProBadge />}
            {badge != null && badge > 0 && (
              <span className="text-[0.65rem] font-medium tabular-nums text-[var(--color-text-muted)]" aria-label={`${badge} bookmarks`}>
                {badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden mobile-sidebar-overlay backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        ref={drawerRef}
        className={`shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-primary)] transition-[width,transform] duration-200 ease-in-out overflow-hidden ${isCollapsed ? 'w-14' : 'w-56'
          } fixed inset-y-0 left-0 z-50 md:relative md:z-auto ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
          } max-md:w-[17rem]`}
        aria-label="Main navigation"
        {...(mobileOpen ? { role: 'dialog' as const, 'aria-modal': true } : {})}
      >
        {/* Logo header */}
        <div
          className={`flex items-center h-14 border-b border-[var(--color-border)] shrink-0 ${isCollapsed ? 'justify-center px-0' : 'gap-2 px-3'}`}
        >
          <button
            type="button"
            onClick={handleLogoClick}
            className={`flex items-center rounded-md focus-ring ${isCollapsed ? 'p-2' : 'gap-3 min-w-0 flex-1 py-2 pr-2 text-left'}`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <img src={logoUrl} alt="" className="w-8 h-8 shrink-0 rounded-lg object-contain" />
            {!isCollapsed && (
              <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate font-display">
                {APP_NAME}
              </span>
            )}
          </button>
          {!isCollapsed && (
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

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto min-h-0 flex flex-col gap-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!isCollapsed && (
                <p className="px-3 pt-3 pb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {group.label}
                </p>
              )}
              {isCollapsed && group.label !== 'Study' && (
                <div className="border-t border-[var(--color-border)] my-1.5" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => renderNavItem(item, item.to === '/bookmarks' ? bookmarkCount : undefined))}
              </div>
            </div>
          ))}

          {/* Bottom: Upgrade + Settings */}
          <div className="mt-auto pt-2 border-t border-[var(--color-border)]">
            {!isPro && !isCollapsed && (
              <NavLink
                to="/pricing"
                className="flex items-center gap-2.5 mx-1 mb-1.5 px-3 py-2.5 rounded-lg border border-[var(--color-brand-blue)]/25 bg-[var(--color-brand-blue)]/8 text-[var(--color-brand-blue)] text-sm font-medium hover:bg-[var(--color-brand-blue)]/15 transition-all focus-ring"
              >
                <Crown className="w-4 h-4 shrink-0" />
                <span className="flex-1">Upgrade to Pro</span>
              </NavLink>
            )}
            {!isPro && isCollapsed && (
              <NavLink
                to="/pricing"
                className="flex items-center justify-center p-2 mx-auto mb-1 rounded-lg border border-[var(--color-brand-blue)]/25 bg-[var(--color-brand-blue)]/8 text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/15 transition-all focus-ring"
                title="Upgrade to Pro"
                aria-label="Upgrade to Pro"
              >
                <Crown className="w-4 h-4" />
              </NavLink>
            )}
            {renderNavItem({ to: '/settings', label: 'Settings', icon: Settings })}
          </div>
        </nav>

        {/* User area */}
        <div className="p-2 border-t border-[var(--color-border)] relative" ref={userMenuRef}>
          {user && !isCollapsed && (
            <>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors focus-ring"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <UserAvatar src={user.avatar_url} name={user.display_name} size="sm" />
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
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring text-left"
                    role="menuitem"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0 opacity-70" /> : <Moon className="w-4 h-4 shrink-0 opacity-70" />}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus-ring text-left"
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
          {user && isCollapsed && (
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
    </>
  );
}
