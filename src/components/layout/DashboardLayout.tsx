// src/components/layout/DashboardLayout.tsx
import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../../styles/components/layouts/DashboardLayout.module.css";
import useClickOutside from "../../hooks/useClickOutside";
import {
  useNotifications,
  type Notification,
} from "../../hooks/useNotifications";
import { users } from "../../api/users"; // ⬅️ para cargar la foto

import type { SVGProps } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

import {
  HomeIcon,
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
} from "@heroicons/react/24/outline";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

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
  moduleType?: "principal" | "operativo" | "administrativo" | "cliente";
}

interface UserDropdownProps {
  isCollapsed?: boolean;
  onLogout: () => void;
  onProfile: () => void;
}

type ModuleKey =
  | "dashboard"
  | "sg-sst"
  | "orders"
  | "my-tasks"
  | "my-orders"
  | "requirements"
  | "cost-centers"
  | "areas"
  | "reports"
  | "statistics"
  | "inventory"
  | "users"
  | "clients"
  | "purchases"
  | "inspections"
  | "settings"
  | "equipments";

type RoleKey =
  | "ADMINISTRADOR"
  | "SG-SST"
  | "SECRETARIA"
  | "COORDINADOR"
  | "TECNICO"
  | "CLIENTE"
  | "MARKETING";

type HeroIcon = ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, "ref"> & {
    title?: string;
    titleId?: string;
  } & RefAttributes<SVGSVGElement>
>;

interface ModuleConfig {
  name: string;
  href: string;
  icon: HeroIcon;
  moduleType: "principal" | "operativo" | "administrativo" | "cliente";
}

const MODULE_CONFIG = {
  modules: {
    dashboard: {
      name: "Página Principal",
      href: "/dashboard",
      icon: HomeIcon,
      moduleType: "principal" as const,
    },
    "sg-sst": {
      name: "SG-SST",
      href: "/sg-sst",
      icon: ShieldCheckIcon,
      moduleType: "administrativo" as const,
    },
    orders: {
      name: "Órdenes de Servicio",
      href: "/orders",
      icon: ClipboardDocumentListIcon,
      moduleType: "operativo" as const,
    },
    requirements: {
      name: "Requerimientos",
      href: "/requirements",
      icon: DocumentTextIcon,
      moduleType: "operativo" as const,
    },
    "cost-centers": {
      name: "Centro de Costos",
      href: "/cost-centers",
      icon: CurrencyDollarIcon,
      moduleType: "administrativo" as const,
    },
    reports: {
      name: "Reportes",
      href: "/reports",
      icon: ChartBarSquareIcon,
      moduleType: "administrativo" as const,
    },
    inventory: {
      name: "Inventario",
      href: "/inventory",
      icon: CubeIcon,
      moduleType: "administrativo" as const,
    },
    users: {
      name: "Usuarios",
      href: "/users",
      icon: UsersIcon,
      moduleType: "administrativo" as const,
    },
    clients: {
      name: "Clientes",
      href: "/clients",
      icon: UserGroupIcon,
      moduleType: "administrativo" as const,
    },
    settings: {
      name: "Configuración",
      href: "/settings",
      icon: Cog6ToothIcon,
      moduleType: "administrativo" as const,
    },
    equipments: {
      name: "Equipos",
      href: "/equipment",
      icon: WrenchIcon,
      moduleType: "operativo" as const,
    },
  } as Record<ModuleKey, ModuleConfig>,

  roleAccess: {
    ADMINISTRADOR: ["all"] as ModuleKey[] | ["all"],
    "SG-SST": [
      "dashboard",
      "sg-sst",
      "orders",
      "requirements",
      "reports",
      "inspections",
    ] as ModuleKey[],
    SECRETARIA: ["all"] as ModuleKey[] | ["all"],
    COORDINADOR: [
      "dashboard",
      "orders",
      "requirements",
      "reports",
      "inventory",
    ] as ModuleKey[],
    TECNICO: [
      "dashboard",
      "orders",
      "my-tasks",
      "reports",
      "sg-sst",
    ] as ModuleKey[],
    CLIENTE: ["dashboard", "orders", "requirements", "reports"] as ModuleKey[],
    MARKETING: ["all"] as ModuleKey[] | ["all"],
  } as Record<RoleKey, ModuleKey[] | ["all"]>,

  roleNames: {
    ADMINISTRADOR: "Administrador",
    "SG-SST": "SG-SST",
    SECRETARIA: "Secretaría",
    COORDINADOR: "Coordinador",
    TECNICO: "Técnico",
    CLIENTE: "Cliente",
    MARKETING: "MARKETING",
  } as Record<RoleKey, string>,
};

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

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const httpBaseUrl =
    (import.meta as any).env?.VITE_API_URL || "http://localhost:3000/api";
  const wsBaseUrl =
    (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3000";

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications({ token, httpBaseUrl, wsBaseUrl });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filteredNavigation, setFilteredNavigation] = useState<
    NavigationItem[]
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // NUEVO: foto de perfil para el layout
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);

  const sidebarUserMenuRef = useClickOutside(() => {
    setShowUserMenu(false);
  }, [`.${styles.dropdownItem}`]);

  const mobileUserMenuRef = useClickOutside(() => {
    setShowUserMenu(false);
  }, [`.${styles.dropdownItem}`]);

  const notificationsMenuRef = useClickOutside(() => {
    setShowNotifications(false);
  }, []);

  const getUserRole = useCallback((): string => {
    if (!user) return "TECNICO";

    if (user.role && typeof user.role === "object" && user.role.nombreRol) {
      return user.role.nombreRol;
    }

    if (typeof user.role === "string") {
      return user.role;
    }

    return user.role?.nombreRol || "TECNICO";
  }, [user]);

  // Cargar foto de perfil para el layout
  useEffect(() => {
    const loadPhoto = async () => {
      if (!user) {
        setUserPhotoUrl(null);
        return;
      }

      try {
        const data = await users.getUserPhoto(user.usuarioId);
        if (data && data.url) {
          setUserPhotoUrl(data.url);
        } else {
          setUserPhotoUrl(null);
        }
      } catch (err) {
        console.error("Error cargando foto de usuario en layout:", err);
        setUserPhotoUrl(null);
      }
    };

    loadPhoto();
  }, [user]);

  useEffect(() => {
    if (!user || !user.role) {
      setFilteredNavigation([]);
      return;
    }

    const userRoleRaw = getUserRole().toUpperCase();

    const isValidRole = (role: string): role is RoleKey => {
      return role in MODULE_CONFIG.roleAccess;
    };

    const userRole = isValidRole(userRoleRaw)
      ? userRoleRaw
      : ("TECNICO" as RoleKey);

    const allowedModules = MODULE_CONFIG.roleAccess[userRole] || [];

    let modulesToShow: ModuleKey[] = [];

    if (allowedModules[0] === "all") {
      modulesToShow = Object.keys(MODULE_CONFIG.modules) as ModuleKey[];
    } else {
      modulesToShow = allowedModules as ModuleKey[];
    }

    const navigationItems: NavigationItem[] = [];

    modulesToShow.forEach((moduleKey) => {
      const module = MODULE_CONFIG.modules[moduleKey];
      if (module) {
        navigationItems.push({
          name: module.name,
          href: module.href,
          icon: module.icon,
          current: location.pathname === module.href,
          moduleType: module.moduleType,
        });
      }
    });

    const orderedNavigation = navigationItems.sort((a, b) => {
      const order = {
        principal: 1,
        operativo: 2,
        cliente: 3,
        administrativo: 4,
      };
      return (
        (order[a.moduleType || "principal"] || 5) -
        (order[b.moduleType || "principal"] || 5)
      );
    });

    setFilteredNavigation(orderedNavigation);
  }, [user, location.pathname, getUserRole]);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebarCollapsed = useCallback(
    () => setSidebarCollapsed((prev) => !prev),
    []
  );
  const toggleUserMenu = useCallback(
    () => setShowUserMenu((prev) => !prev),
    []
  );
  const toggleNotifications = useCallback(
    () => setShowNotifications((prev) => !prev),
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
    navigate("/", { replace: true });
  }, [logout, navigate]);

  const handleGoProfile = useCallback(() => {
    navigate("/profile");
    setShowUserMenu(false);
    closeSidebar();
  }, [navigate, closeSidebar]);

  const getNotificationTargetPath = useCallback(
    (notif: Notification): string | null => {
      switch (notif.tipo) {
        case "WORK_ORDER_CREATED":
        case "WORK_ORDER_ASSIGNED": {
          const id =
            notif.data?.workOrderId ?? notif.data?.ordenId ?? notif.data?.id;
          if (id) {
            return `/orders?ordenId=${id}`;
          }
          return "/orders";
        }
        case "STOCK_BELOW_MIN": {
          return "/inventory";
        }
        default:
          return null;
      }
    },
    []
  );

  const handleNotificationClick = useCallback(
    (notif: Notification) => {
      if (!notif.leida) {
        markAsRead(notif.notificacionId);
      }

      const target = getNotificationTargetPath(notif);
      if (target) {
        navigate(target);
      }

      setShowNotifications(false);
    },
    [markAsRead, getNotificationTargetPath, navigate]
  );

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
    const roleKey = getUserRole().toUpperCase();

    if (roleKey in MODULE_CONFIG.roleNames) {
      return MODULE_CONFIG.roleNames[roleKey as RoleKey];
    }

    return roleKey;
  }, [getUserRole]);

  const getCurrentPageTitle = useCallback(() => {
    for (const module of Object.values(MODULE_CONFIG.modules)) {
      if (location.pathname === module.href) {
        return module.name;
      }
    }

    const pageTitles: Record<string, string> = {
      "/profile": "Mi Perfil",
      "/roles": "Gestión de Roles",
      "/equipment": "Gestión de Equipos",
      "/equipment/": "Hoja de Vida del Equipo",
    };

    return pageTitles[location.pathname] || "Dashboard";
  }, [location.pathname]);

  const groupedNavigation = useMemo(() => {
    const groups: Record<string, NavigationItem[]> = {};

    filteredNavigation.forEach((item) => {
      const group = item.moduleType || "otros";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
    });

    return groups;
  }, [filteredNavigation]);

  const getGroupTitle = (groupType: string): string => {
    const titles: Record<string, string> = {
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
              src="/Assets/images/LOGO_IMEC.png"
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
          {Object.entries(groupedNavigation).map(([groupType, items]) => (
            <div key={groupType} className={styles.navSection}>
              {!sidebarCollapsed && items.length > 0 && (
                <h3 className={styles.sectionTitle}>
                  {getGroupTitle(groupType)}
                </h3>
              )}

              {items.map((item) => (
                <button
                  key={item.name}
                  className={`${styles.navItem} ${
                    item.current ? styles.navItemActive : ""
                  }`}
                  onClick={() => handleNavigation(item.href)}
                  title={item.name}
                >
                  <item.icon className={styles.navIcon} />
                  {!sidebarCollapsed && (
                    <span className={styles.navText}>{item.name}</span>
                  )}
                </button>
              ))}
            </div>
          ))}

          {filteredNavigation.length === 0 && user && (
            <div className={styles.noModulesMessage}>
              <p>No tienes módulos asignados.</p>
              <p>Contacta al administrador.</p>
            </div>
          )}
        </nav>

        {/* ===== USER FOOTER (DESKTOP) ===== */}
        <div className={styles.sidebarFooter} ref={sidebarUserMenuRef}>
          <div className={styles.userProfile} onClick={toggleUserMenu}>
            <div className={styles.userAvatar}>
              {userPhotoUrl ? (
                <img
                  src={userPhotoUrl}
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

            <h1 className={styles.pageTitle}>
              {getCurrentPageTitle()}
            </h1>
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
                <div className={styles.notificationsDropdown}>
                  <div className={styles.notificationsHeader}>
                    <span>Notificaciones</span>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        className={styles.markAllReadButton}
                        onClick={markAllAsRead}
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className={styles.noNotifications}>
                      No hay notificaciones
                    </div>
                  ) : (
                    <ul className={styles.notificationsList}>
                      {notifications.map((n) => (
                        <li
                          key={n.notificacionId}
                          className={
                            n.leida
                              ? styles.notificationItemRead
                              : styles.notificationItemUnread
                          }
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className={styles.notificationTitle}>
                            {n.titulo}
                          </div>
                          <div className={styles.notificationMessage}>
                            {n.mensaje}
                          </div>
                          <div className={styles.notificationDate}>
                            {new Date(n.fechaCreacion).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* USUARIO (AVATAR) */}
            <button
              className={styles.userAvatarButton}
              onClick={toggleUserMenu}
            >
              <div className={styles.userAvatar}>
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
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
    </div>
  );
}