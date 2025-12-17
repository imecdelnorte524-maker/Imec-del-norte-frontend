import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../../styles/components/layouts/DashboardLayout.module.css';
import useClickOutside from '../../hooks/useClickOutside';

import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  UsersIcon,
  Cog6ToothIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentChartBarIcon,
  CurrencyDollarIcon,
  ChartBarSquareIcon,
  PowerIcon,
  ChevronDownIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

/* =======================
   TIPOS
======================= */

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current: boolean;
}

interface UserDropdownProps {
  isCollapsed?: boolean;
  onLogout: () => void;
}

/* =======================
   COMPONENTE DROPDOWN
======================= */
function UserDropdown({ isCollapsed = false, onLogout }: UserDropdownProps) {
  return (
    <div
      className={`${styles.userDropdown} ${
        isCollapsed ? styles.userDropdownCollapsed : ''
      }`}
    >
      <button
        className={`${styles.dropdownItem} dropdown-item`}
        onClick={onLogout}
      >
        <PowerIcon className={styles.dropdownIcon} />
        <span
          className={`${styles.dropdownName} ${
            isCollapsed ? styles.dropdownNameCollapsed : ''
          }`}
        >
          Cerrar Sesión
        </span>
      </button>
    </div>
  );
}

/* =======================
   COMPONENTE PRINCIPAL
======================= */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  /* =======================
     USE CLICK OUTSIDE
  ======================= */
  const sidebarUserMenuRef = useClickOutside(() => {
    setShowUserMenu(false);
  }, [`.${styles.dropdownItem}`]);

  const mobileUserMenuRef = useClickOutside(() => {
    setShowUserMenu(false);
  }, [`.${styles.dropdownItem}`]);

  /* =======================
     MENU
  ======================= */
  const navigation = useMemo<NavigationItem[]>(() => [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'SG-SST',
      href: '/sg-sst',
      icon: ShieldCheckIcon,
      current: location.pathname === '/sg-sst',
    },
    {
      name: 'Órdenes de Servicios',
      href: '/orders',
      icon: ClipboardDocumentListIcon,
      current: location.pathname === '/orders',
    },
    {
      name: 'Requerimientos',
      href: '/requirements',
      icon: DocumentChartBarIcon,
      current: location.pathname === '/requirements',
    },
    {
      name: 'Centro de Costos',
      href: '/cost-centers',
      icon: CurrencyDollarIcon,
      current: location.pathname === '/cost-centers',
    },
    {
      name: 'Áreas',
      href: '/areas',
      icon: BuildingOfficeIcon,
      current: location.pathname === '/areas',
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: ChartBarSquareIcon,
      current: location.pathname === '/reports',
    },
    {
      name: 'Inventario',
      href: '/inventory',
      icon: CubeIcon,
      current: location.pathname === '/inventory',
    },
    {
      name: 'Usuarios',
      href: '/users',
      icon: UsersIcon,
      current: location.pathname === '/users',
    },
    {
      name: 'Configuración',
      href: '/settings',
      icon: Cog6ToothIcon,
      current: location.pathname === '/settings',
    },
  ], [location.pathname]);

  /* =======================
     HANDLERS
  ======================= */
  const toggleSidebar = useCallback(
    () => setSidebarOpen(prev => !prev),
    []
  );

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const toggleSidebarCollapsed = useCallback(
    () => setSidebarCollapsed(prev => !prev),
    []
  );

  const toggleUserMenu = useCallback(
    () => setShowUserMenu(prev => !prev),
    []
  );

  const handleNavigation = useCallback(
    (href: string) => {
      closeSidebar();
      navigate(href);
    },
    [closeSidebar, navigate]
  );

  const handleLogout = useCallback(() => {
    logout();
    setShowUserMenu(false);
  }, [logout]);

  /* =======================
     HELPERS USUARIO
  ======================= */
  const getUserInitials = useCallback(() => {
    if (!user) return 'U';
    return `${user.nombre?.charAt(0) || ''}${user.apellido?.charAt(0) || ''}`.toUpperCase();
  }, [user]);

  const getUserDisplayName = useCallback(() => {
    if (!user) return 'Usuario';
    return `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Usuario';
  }, [user]);

  const getUserRole = useCallback(() => {
    if (!user) return 'Sin rol';

    if (user.role && typeof user.role === 'object' && user.role.nombreRol) {
      return user.role.nombreRol;
    }

    return user.role?.nombreRol || 'Usuario';
  }, [user]);

  const getCurrentPageTitle = useCallback(() => {
    const currentNav = navigation.find(item => item.current);
    if (currentNav) return currentNav.name;

    const pageTitles: Record<string, string> = {
      '/roles': 'Gestión de Roles',
      '/clients': 'Gestión de Clientes',
      '/equipment': 'Gestión de Equipos',
      '/equipment/': 'Hoja de Vida del Equipo',
    };

    return pageTitles[location.pathname] || 'Dashboard';
  }, [navigation, location.pathname]);

  /* =======================
     JSX
  ======================= */
  return (
    <div className={styles.container}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}

      {/* ===== SIDEBAR (DESKTOP) ===== */}
      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.sidebarOpen : ''
        } ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            {sidebarCollapsed ? (
              <img
                src="/Assets/images/LOGO_IMEC.png"
                alt="IMEC del Norte"
                className={styles.logoIcon}
              />
            ) : (
              <>
                <img
                  src="/Assets/images/LOGO_IMEC.png"
                  alt="IMEC del Norte"
                  className={styles.logo}
                />
                <span className={styles.logoText}>IMEC del Norte</span>
              </>
            )}
          </div>

          <div className={styles.sidebarControls}>
            <button className={styles.closeButton} onClick={closeSidebar}>
              <XMarkIcon className={styles.navIcon} />
            </button>

            <button
              className={styles.collapseButton}
              onClick={toggleSidebarCollapsed}
            >
              <Bars3Icon className={styles.navIcon} />
            </button>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            {!sidebarCollapsed && (
              <h3 className={styles.sectionTitle}>Principal</h3>
            )}

            {navigation.map(item => (
              <button
                key={item.name}
                className={`${styles.navItem} ${
                  item.current ? styles.navItemActive : ''
                }`}
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon className={styles.navIcon} />
                {!sidebarCollapsed && (
                  <span className={styles.navText}>{item.name}</span>
                )}
                <div className={styles.tooltip}>
                  {item.name}
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* ===== USER FOOTER (DESKTOP) ===== */}
        <div
          className={styles.sidebarFooter}
          ref={sidebarUserMenuRef}
        >
          <div
            className={styles.userProfile}
            onClick={toggleUserMenu}
          >
            <div className={styles.userAvatar}>
              {getUserInitials()}
            </div>

            {!sidebarCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {getUserDisplayName()}
                </span>
                <span className={styles.userRole}>
                  {getUserRole()}
                </span>
              </div>
            )}

            {!sidebarCollapsed && (
              <ChevronDownIcon
                className={`${styles.chevron} ${
                  showUserMenu ? styles.chevronRotated : ''
                }`}
              />
            )}

            {sidebarCollapsed && (
              <div className={styles.userProfileTooltip}>
                {getUserDisplayName()}
                <br />
                <small>{getUserRole()}</small>
              </div>
            )}
          </div>

          {showUserMenu && (
            <UserDropdown
              isCollapsed={sidebarCollapsed}
              onLogout={handleLogout}
            />
          )}
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main
        className={`${styles.mainContent} ${
          sidebarCollapsed ? styles.mainContentExpanded : ''
        }`}
      >
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.menuButton}
              onClick={toggleSidebar}
            >
              <Bars3Icon className={styles.navIcon} />
            </button>

            <h1 className={styles.pageTitle}>
              {getCurrentPageTitle()}
            </h1>
          </div>

          {/* ===== HEADER USER (MOBILE) ===== */}
          <div
            className={styles.headerRight}
            ref={mobileUserMenuRef}
          >
            <button className={styles.iconButton}>
              <BellIcon className={styles.navIcon} />
            </button>

            <button
              className={styles.userAvatarButton}
              onClick={toggleUserMenu}
            >
              <div className={styles.userAvatar}>
                {getUserInitials()}
              </div>
            </button>

            {showUserMenu && (
              <div className={styles.mobileUserDropdown}>
                <div className={styles.userDropdownInfo}>
                  <span className={styles.userName}>
                    {getUserDisplayName()}
                  </span>
                  <span className={styles.userRole}>
                    {getUserRole()}
                  </span>
                </div>

                <UserDropdown onLogout={handleLogout} />
              </div>
            )}
          </div>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
