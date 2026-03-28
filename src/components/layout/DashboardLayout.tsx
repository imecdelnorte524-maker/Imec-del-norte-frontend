// src/components/layout/DashboardLayout.tsx
import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../../styles/components/layouts/DashboardLayout.module.css";
import useClickOutside from "../../hooks/useClickOutside";
import { useNotifications } from "../../hooks/useNotifications";
import { useModules } from "../../hooks/useModules";
import type { Module as ModuleInterface } from "../../interfaces/ModulesInterfaces";
import type { Rol } from "../../interfaces/RolesInterfaces";
import { getDisplayRoleName as getDisplayRoleNameFromConfig } from "../../config/roles.config";
import { useUserPhoto } from "../../hooks/useUserPhoto";

import type { SVGProps } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

import {
  HomeIcon,
  ClipboardIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  UsersIcon,
  Cog6ToothIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
  ChartBarSquareIcon,
  PowerIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  WrenchIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { NotificationsDropdown } from "../notifications/NotificationsDropdown";
import { enableAudio } from "../../utils/sounds";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const ICON_MAP: Record<
  string,
  ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, "ref"> & {
      title?: string;
      titleId?: string;
    } & RefAttributes<SVGSVGElement>
  >
> = {
  HomeIcon,
  ClipboardIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  UsersIcon,
  Cog6ToothIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
  ChartBarSquareIcon,
  PowerIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  WrenchIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
};

type ModuleCategory =
  | "principal"
  | "operativo"
  | "administrativo"
  | "cliente"
  | "otros";

interface NavigationItem {
  name: string;
  href: string;
  icon: ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, "ref"> & {
      title?: string;
      titleId?: string;
    } & RefAttributes<SVGSVGElement>
  >;
  current: boolean;
  moduleType: ModuleCategory;
  order: number;
}

interface UserDropdownProps {
  isCollapsed?: boolean;
  onLogout: () => void;
  onProfile: () => void;
}

function UserDropdown({
  isCollapsed = false,
  onLogout,
  onProfile,
}: UserDropdownProps) {
  return (
    <div
      className={`${styles.userDropdown} ${
        isCollapsed ? styles.userDropdownCollapsed : ""
      }`}
    >
      <button
        className={`${styles.dropdownItem} dropdown-item`}
        onClick={onProfile}
      >
        <UserCircleIcon className={styles.dropdownIcon} />
        <span
          className={`${styles.dropdownName} ${
            isCollapsed ? styles.dropdownNameCollapsed : ""
          }`}
        >
          Mi Perfil
        </span>
      </button>

      <button
        className={`${styles.dropdownItem} dropdown-item`}
        onClick={onLogout}
      >
        <PowerIcon className={styles.dropdownIcon} />
        <span
          className={`${styles.dropdownName} ${
            isCollapsed ? styles.dropdownNameCollapsed : ""
          }`}
        >
          Cerrar Sesión
        </span>
      </button>
    </div>
  );
}

const determineModuleType = (module: ModuleInterface): ModuleCategory => {
  if (module.codigoInterno) {
    if (
      module.codigoInterno.startsWith("MOD_DASHBOARD") ||
      module.codigoInterno.startsWith("MOD_REG_BOARD")
    ) {
      return "principal";
    }
    if (
      module.codigoInterno.startsWith("MOD_ORDERS") ||
      module.codigoInterno.startsWith("MOD_REQUIREMENTS") ||
      module.codigoInterno.startsWith("MOD_EQUIPMENTS") ||
      module.codigoInterno.startsWith("MOD_INSPECTIONS")
    ) {
      return "operativo";
    }
    if (
      module.codigoInterno.startsWith("MOD_SGSST") ||
      module.codigoInterno.startsWith("MOD_HR") ||
      module.codigoInterno.startsWith("MOD_COST_CENTERS") ||
      module.codigoInterno.startsWith("MOD_REPORTS") ||
      module.codigoInterno.startsWith("MOD_INVENTORY") ||
      module.codigoInterno.startsWith("MOD_USERS") ||
      module.codigoInterno.startsWith("MOD_CLIENTS") ||
      module.codigoInterno.startsWith("MOD_SETTINGS")
    ) {
      return "administrativo";
    }
  }
  if (module.orden < 200) return "principal";
  if (module.orden >= 200 && module.orden < 300) return "operativo";
  if (module.orden >= 300) return "administrativo";
  return "otros";
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { photo: userPhoto } = useUserPhoto(user?.usuarioId);
  const {
    modules,
    loading: modulesLoading,
    error: modulesError,
  } = useModules();

  const httpBaseUrl =
    (import.meta as any).env?.VITE_API_URL || "https://m3h6rtnz-4001.use.devtunnels.ms/api";

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications({ token, httpBaseUrl });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- Reminder global state & refs ---
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const reminderIntervalRef = useRef<number | null>(null);
  const reminderTimeoutRef = useRef<number | null>(null);

  // helper to check if role is Cliente
  const isClientRole = useCallback(() => {
    return user?.role?.nombreRol?.toLowerCase() === "cliente";
  }, [user]);

  // Helper to determine if profile is complete
  const isProfileComplete = useCallback((u: any | undefined | null) => {
    if (!u) return true;
    if (String(u.role?.nombreRol || "").toLowerCase() === "cliente")
      return true;

    const get = (keys: string[]) => {
      for (const k of keys) {
        const v = (u as any)[k];
        if (v) return v;
      }
      return "";
    };

    const ubic = get(["ubicacionResidencia", "ubicacion"]);
    const arl = u.arl ?? "";
    const eps = u.eps ?? "";
    const afp = u.afp ?? "";

    const emergencyName =
      u.contactoEmergenciaNombre ?? u.contactoEmergencia?.nombre ?? "";
    const emergencyPhone =
      u.contactoEmergenciaTelefono ?? u.contactoEmergencia?.telefono ?? "";
    const emergencyRelation =
      u.contactoEmergenciaParentesco ?? u.contactoEmergencia?.parentesco ?? "";

    const fields = [
      ubic,
      arl,
      eps,
      afp,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
    ];

    return fields.every((v) => v && String(v).trim().length > 0);
  }, []);

  useEffect(() => {
    const handleFirstClick = () => {
      enableAudio();
    };

    window.addEventListener("click", handleFirstClick, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstClick);
    };
  }, []);
  // show reminder briefly (~17s)
  const showReminderOnce = useCallback(() => {
    setShowProfileReminder(true);
    if (reminderTimeoutRef.current)
      window.clearTimeout(reminderTimeoutRef.current);
    reminderTimeoutRef.current = window.setTimeout(() => {
      setShowProfileReminder(false);
    }, 17_000);
  }, []);

  const stopReminderTimers = useCallback(() => {
    if (reminderIntervalRef.current) {
      window.clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }
    if (reminderTimeoutRef.current) {
      window.clearTimeout(reminderTimeoutRef.current);
      reminderTimeoutRef.current = null;
    }
    setShowProfileReminder(false);
  }, []);

  // When user changes, initialize reminder logic globally
  useEffect(() => {
    // Only for authenticated non-client users
    if (!user || isClientRole()) {
      stopReminderTimers();
      return;
    }

    const completedKey = `profileCompleted_${user.usuarioId}`;
    // If user already marked as completed (localStorage) -> nothing to do
    if (localStorage.getItem(completedKey) === "true") {
      stopReminderTimers();
      return;
    }

    // If the profile (from server) is already complete -> mark and stop
    if (isProfileComplete(user)) {
      localStorage.setItem(completedKey, "true");
      stopReminderTimers();
      return;
    }

    // Show one now and then schedule every 15 minutes
    showReminderOnce();

    reminderIntervalRef.current = window.setInterval(
      () => {
        // Recheck localStorage (profile page may have set it)
        if (localStorage.getItem(completedKey) === "true") {
          stopReminderTimers();
          return;
        }

        // Recheck server-side data (if user object updated via auth refresh)
        if (isProfileComplete(user)) {
          localStorage.setItem(completedKey, "true");
          stopReminderTimers();
          return;
        }

        // Otherwise show again
        showReminderOnce();
      },
      15 * 60 * 1000,
    ); // 15 minutes

    return () => {
      stopReminderTimers();
    };
  }, [
    user,
    isClientRole,
    isProfileComplete,
    showReminderOnce,
    stopReminderTimers,
  ]);

  // Utilities & UI helpers (existing)
  const sidebarUserMenuRef = useClickOutside(() => {
    setShowUserMenu(false);
  }, [`.${styles.dropdownItem}`]);

  const mobileUserMenuRef = useClickOutside(() => {
    setShowUserMenu(false);
  }, [`.${styles.dropdownItem}`]);

  const notificationsMenuRef = useClickOutside(() => {
    setShowNotifications(false);
  }, []);

  const getUserRole = useCallback((): Rol | undefined => {
    if (!user) return undefined;
    return user.role;
  }, [user]);

  // --- Sidebar scroll automático ---
  const activeModuleRef = useRef<HTMLButtonElement | null>(null);

  const filteredNavigation = useMemo(() => {
    if (!user || !user.role || modulesLoading || modulesError) {
      return [];
    }

    const userRole = user.role;
    const navigationItems: NavigationItem[] = [];

    modules.forEach((moduleItem: ModuleInterface) => {
      const hasAccess =
        moduleItem.activo &&
        moduleItem.roles.some((mRole) => mRole.rolId === userRole.rolId);

      if (hasAccess) {
        const IconComponent =
          ICON_MAP[moduleItem.icono || "CubeIcon"] || CubeIcon;
        const determinedModuleType = determineModuleType(moduleItem);

        navigationItems.push({
          name: moduleItem.nombreModulo,
          href: moduleItem.rutaFrontend || "#",
          icon: IconComponent,
          current: location.pathname === moduleItem.rutaFrontend,
          moduleType: determinedModuleType,
          order: moduleItem.orden,
        });
      }
    });

    return navigationItems.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      const orderByType: Record<ModuleCategory, number> = {
        principal: 1,
        operativo: 2,
        cliente: 3,
        administrativo: 4,
        otros: 5,
      };
      return (
        (orderByType[a.moduleType] || 5) - (orderByType[b.moduleType] || 5)
      );
    });
  }, [user, modules, modulesLoading, modulesError, location.pathname]);

  useEffect(() => {
    if (activeModuleRef.current) {
      activeModuleRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [filteredNavigation, location.pathname]);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebarCollapsed = useCallback(
    () => setSidebarCollapsed((prev) => !prev),
    [],
  );
  const toggleNotifications = useCallback(
    () => setShowNotifications((prev) => !prev),
    [],
  );

  const handleNavigation = useCallback(
    (href: string) => {
      closeSidebar();
      navigate(href);
    },
    [closeSidebar, navigate],
  );

  const handleLogout = useCallback(() => {
    logout();
    setShowUserMenu(false);
    navigate("/", { replace: true });
  }, [logout, navigate]);

  // When user clicks "Mi perfil" in the dropdown we send state to focus the additional form
  const handleGoProfile = useCallback(() => {
    navigate("/profile", { state: { focus: "additional" } });
    setShowUserMenu(false);
    closeSidebar();
  }, [navigate, closeSidebar]);

  // When notification CTA clicked from global reminder
  const globalGoToProfile = useCallback(() => {
    navigate("/profile", { state: { focus: "additional" } });
    setShowProfileReminder(false);
  }, [navigate]);

  const getUserInitials = useCallback(() => {
    if (!user) return "U";
    return `${user.nombre?.charAt(0) || ""}${
      user.apellido?.charAt(0) || ""
    }`.toUpperCase();
  }, [user]);

  const getUserDisplayName = useCallback(() => {
    if (!user) return "Usuario";
    return (
      `${user.nombre || ""} ${user.apellido || ""}`.trim() ||
      user.username ||
      "Usuario"
    );
  }, [user]);

  const getDisplayRoleName = useCallback(() => {
    const userRole = getUserRole();
    if (!userRole) return "Sin Rol";
    return (
      getDisplayRoleNameFromConfig(userRole.nombreRol) || userRole.nombreRol
    );
  }, [getUserRole]);

  const getCurrentPageTitle = useCallback(() => {
    const pathname = location.pathname;
    for (const module of filteredNavigation) {
      if (pathname === module.href) {
        return module.name;
      }
    }
    const staticTitles: Record<string, string> = {
      "/profile": "Mi Perfil",
      "/roles": "Gestión de Roles",
      "/modules": "Gestión de Módulos",
    };
    if (staticTitles[pathname]) {
      return staticTitles[pathname];
    }
    if (pathname.startsWith("/equipment/")) {
      return "Hoja de Vida del Equipo";
    }
    if (pathname.startsWith("/clients/")) {
      return "Perfil del Cliente";
    }
    return "Dashboard";
  }, [location.pathname, filteredNavigation]);

  const groupedNavigation = useMemo(() => {
    const groups: { [key in ModuleCategory]?: NavigationItem[] } = {};
    filteredNavigation.forEach((item) => {
      const group = item.moduleType;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group]?.push(item);
    });
    return groups;
  }, [filteredNavigation]);

  const getGroupTitle = (groupType: ModuleCategory): string => {
    const titles: Record<ModuleCategory, string> = {
      principal: "Principal",
      operativo: "Operativo",
      cliente: "Cliente",
      administrativo: "Administrativo",
      otros: "Otros",
    };
    return titles[groupType] || groupType;
  };

  return (
    <div className={styles.container}>
      {sidebarOpen && <div className={styles.overlay} onClick={closeSidebar} />}

      {/* ===== SIDEBAR (DESKTOP) ===== */}
      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.sidebarOpen : ""
        } ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <img
              src="/Assets/icons/favicon-imec.png"
              alt="IMEC del Norte"
              className={styles.logoIcon}
            />
            <span className={styles.logoText}>IMEC del Norte</span>
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
          {modulesLoading && (
            <p className={styles.loadingMessage}>Cargando módulos...</p>
          )}
          {modulesError && (
            <p className={styles.errorMessage}>
              Error al cargar módulos: {modulesError}
            </p>
          )}

          {!modulesLoading &&
            !modulesError &&
            Object.entries(groupedNavigation).map(([groupType, items]) => (
              <div key={groupType} className={styles.navSection}>
                {!sidebarCollapsed && items.length > 0 && (
                  <h3 className={styles.sectionTitle}>
                    {getGroupTitle(groupType as ModuleCategory)}
                  </h3>
                )}

                {items.map((item) => {
                  const isActive = item.current;
                  return (
                    <button
                      key={item.name}
                      ref={isActive ? activeModuleRef : undefined}
                      className={`${styles.navItem} ${
                        isActive ? styles.navItemActive : ""
                      }`}
                      onClick={() => handleNavigation(item.href)}
                      title={item.name}
                    >
                      <item.icon className={styles.navIcon} />
                      {!sidebarCollapsed && (
                        <span className={styles.navText}>{item.name}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

          {!modulesLoading &&
            !modulesError &&
            filteredNavigation.length === 0 &&
            user && (
              <div className={styles.noModulesMessage}>
                <p>No tienes módulos asignados o activos.</p>
                <p>Contacta al administrador.</p>
              </div>
            )}
        </nav>

        {/* ===== USER FOOTER (DESKTOP) ===== */}
        <div className={styles.sidebarFooter} ref={sidebarUserMenuRef}>
          <div
            className={styles.userProfile}
            onClick={() => setShowUserMenu((s) => !s)}
          >
            <div className={styles.userAvatar}>
              {userPhoto?.url ? (
                <img
                  src={userPhoto.url}
                  alt="Foto de perfil"
                  className={styles.userAvatarImage}
                />
              ) : (
                getUserInitials()
              )}
            </div>

            {!sidebarCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{getUserDisplayName()}</span>
                <span className={styles.userRole}>{getDisplayRoleName()}</span>
              </div>
            )}

            {!sidebarCollapsed && (
              <ChevronDownIcon
                className={`${styles.chevron} ${
                  showUserMenu ? styles.chevronRotated : ""
                }`}
              />
            )}

            {sidebarCollapsed && (
              <div className={styles.userProfileTooltip}>
                {getUserDisplayName()}
                <br />
                <small>{getDisplayRoleName()}</small>
              </div>
            )}
          </div>

          {showUserMenu && (
            <UserDropdown
              isCollapsed={sidebarCollapsed}
              onLogout={handleLogout}
              onProfile={handleGoProfile}
            />
          )}
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main
        className={`${styles.mainContent} ${
          sidebarCollapsed ? styles.mainContentExpanded : ""
        }`}
      >
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.menuButton} onClick={toggleSidebar}>
              <Bars3Icon className={styles.navIcon} />
            </button>

            <h1 className={styles.pageTitle}>{getCurrentPageTitle()}</h1>
          </div>

          {/* ===== HEADER RIGHT (NOTIFICACIONES + USUARIO) ===== */}
          <div className={styles.headerRight} ref={mobileUserMenuRef}>
            {/* NOTIFICACIONES */}
            <div
              className={styles.notificationsWrapper}
              ref={notificationsMenuRef}
            >
              <button
                className={styles.iconButton}
                onClick={toggleNotifications}
              >
                <BellIcon className={styles.navIcon} />
                {unreadCount > 0 && (
                  <span className={styles.notificationBadge}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationsDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>

            {/* USUARIO (AVATAR) */}
            <button
              className={styles.userAvatarButton}
              onClick={() => setShowUserMenu((s) => !s)}
            >
              <div className={styles.userAvatar}>
                {userPhoto?.url ? (
                  <img
                    src={userPhoto.url}
                    alt="Foto de perfil"
                    className={styles.userAvatarImage}
                  />
                ) : (
                  getUserInitials()
                )}
              </div>
            </button>

            {showUserMenu && (
              <div className={styles.mobileUserDropdown}>
                <div className={styles.userDropdownInfo}>
                  <span className={styles.userName}>
                    {getUserDisplayName()}
                  </span>
                  <span className={styles.userRole}>
                    {getDisplayRoleName()}
                  </span>
                </div>

                <UserDropdown
                  onLogout={handleLogout}
                  onProfile={handleGoProfile}
                />
              </div>
            )}
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </main>

      {/* ===== GLOBAL PROFILE REMINDER (visible en todo el sitio) ===== */}
      {!isClientRole() && user && (
        <div
          className={`${styles.globalProfileReminder} ${
            showProfileReminder ? styles.globalProfileReminderVisible : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <div className={styles.reminderContent}>
            <p className={styles.reminderTitle}>
              Por favor completa tu información
            </p>
            <p style={{ margin: 0, fontSize: 13 }}>
              Diligencia ubicación, ARL, EPS, AFP y un contacto de emergencia.
            </p>
          </div>

          <div className={styles.reminderActions}>
            <button onClick={globalGoToProfile} className={styles.ctaButton}>
              Ir a mi perfil
            </button>
            <button
              aria-label="Cerrar"
              className={styles.reminderClose}
              onClick={() => setShowProfileReminder(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
