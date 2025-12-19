import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../../styles/components/layouts/DashboardLayout.module.css";
import useClickOutside from "../../hooks/useClickOutside";

// Importar tipos de iconos
import type { SVGProps } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

// Importar iconos
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
  // BuildingOfficeIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  // ChartPieIcon,
  // ShoppingCartIcon,
  // CheckCircleIcon,
  DocumentTextIcon,
  // WrenchScrewdriverIcon,
  // ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

/* =======================
   TIPOS
======================= */

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

/* =======================
   CONFIGURACIÓN CENTRALIZADA DE ROLES Y MÓDULOS
   CON TIPOS SEGUROS
======================= */

// Definir tipos para las claves
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
  | "settings";

type RoleKey =
  | "ADMINISTRADOR"
  | "SG-SST"
  | "SECRETARIA"
  | "COORDINADOR"
  | "TECNICO"
  | "CLIENTE"
  | "MARKETING";

// Tipo para iconos Heroicons
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

// Configuración con tipos seguros
const MODULE_CONFIG = {
  // Definición de todos los módulos disponibles
  modules: {
    dashboard: {
      name: "Dashboard",
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
    // 'my-tasks': {
    //   name: 'Mis Tareas',
    //   href: '/my-tasks',
    //   icon: WrenchScrewdriverIcon,
    //   moduleType: 'operativo' as const,
    // },
    // 'my-orders': {
    //   name: 'Mis Órdenes',
    //   href: '/my-orders',
    //   icon: CheckCircleIcon,
    //   moduleType: 'cliente' as const,
    // },
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
    // areas: {
    //   name: "Áreas",
    //   href: "/areas",
    //   icon: BuildingOfficeIcon,
    //   moduleType: "administrativo" as const,
    // },
    reports: {
      name: "Reportes",
      href: "/reports",
      icon: ChartBarSquareIcon,
      moduleType: "administrativo" as const,
    },
    // 'statistics': {
    //   name: 'Estadísticas',
    //   href: '/statistics',
    //   icon: ChartPieIcon,
    //   moduleType: 'administrativo' as const,
    // },
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
    // 'purchases': {
    //   name: 'Compras',
    //   href: '/purchases',
    //   icon: ShoppingCartIcon,
    //   moduleType: 'administrativo' as const,
    // },
    // 'inspections': {
    //   name: 'Inspecciones',
    //   href: '/inspections',
    //   icon: ClipboardDocumentCheckIcon,
    //   moduleType: 'administrativo' as const,
    // },
    settings: {
      name: "Configuración",
      href: "/settings",
      icon: Cog6ToothIcon,
      moduleType: "administrativo" as const,
    },
  } as Record<ModuleKey, ModuleConfig>,

  // Configuración de acceso por rol
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
    TECNICO: ["dashboard", "orders", "my-tasks", "reports", "sg-sst"] as ModuleKey[],
    CLIENTE: [
      "dashboard",
      "my-orders",
      "requirements",
      "reports",
    ] as ModuleKey[],
    MARKETING: ["all"] as ModuleKey[] | ["all"],
  } as Record<RoleKey, ModuleKey[] | ["all"]>,

  // Traducción de nombres de roles para mostrar
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

/* =======================
   COMPONENTE DROPDOWN
======================= */
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
  const [filteredNavigation, setFilteredNavigation] = useState<
    NavigationItem[]
  >([]);

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
     FILTRAR MÓDULOS POR ROL - CON TIPOS SEGUROS
  ======================= */
  useEffect(() => {
    if (!user || !user.role) {
      setFilteredNavigation([]);
      return;
    }

    // Obtener rol del usuario con validación de tipo
    const userRoleRaw = getUserRole().toUpperCase();

    // Verificar si el rol es válido
    const isValidRole = (role: string): role is RoleKey => {
      return role in MODULE_CONFIG.roleAccess;
    };

    const userRole = isValidRole(userRoleRaw)
      ? userRoleRaw
      : ("TECNICO" as RoleKey);

    // Obtener módulos permitidos para este rol
    const allowedModules = MODULE_CONFIG.roleAccess[userRole] || [];

    // Determinar qué módulos mostrar
    let modulesToShow: ModuleKey[] = [];

    if (allowedModules[0] === "all") {
      // Superadministrador - todos los módulos
      modulesToShow = Object.keys(MODULE_CONFIG.modules) as ModuleKey[];
    } else {
      // Otros roles - módulos específicos
      modulesToShow = allowedModules as ModuleKey[];
    }

    // Crear array de navegación filtrada
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

    // Ordenar módulos por tipo
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
  }, [user, location.pathname]);

  /* =======================
     HANDLERS
  ======================= */
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

  const handleGoProfile = useCallback(() => {
    navigate("/profile");
    setShowUserMenu(false);
    closeSidebar();
  }, [navigate, closeSidebar]);

  /* =======================
     HELPERS USUARIO - CON TIPOS SEGUROS
  ======================= */
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

  const getUserRole = useCallback(() => {
    if (!user) return "TECNICO";

    if (user.role && typeof user.role === "object" && user.role.nombreRol) {
      return user.role.nombreRol;
    }

    if (typeof user.role === "string") {
      return user.role;
    }

    return user.role?.nombreRol || "TECNICO";
  }, [user]);

  const getDisplayRoleName = useCallback(() => {
    const roleKey = getUserRole().toUpperCase();

    // Validar y obtener nombre del rol
    if (roleKey in MODULE_CONFIG.roleNames) {
      return MODULE_CONFIG.roleNames[roleKey as RoleKey];
    }

    return roleKey;
  }, [getUserRole]);

  const getCurrentPageTitle = useCallback(() => {
    // Buscar en los módulos configurados
    for (const module of Object.values(MODULE_CONFIG.modules)) {
      if (location.pathname === module.href) {
        return module.name;
      }
    }

    // Títulos especiales para rutas no en módulos
    const pageTitles: Record<string, string> = {
      "/profile": "Mi Perfil",
      "/roles": "Gestión de Roles",
      "/equipment": "Gestión de Equipos",
      "/equipment/": "Hoja de Vida del Equipo",
    };

    return pageTitles[location.pathname] || "Dashboard";
  }, [location.pathname]);

  // Agrupar módulos por tipo para mejor organización visual
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

  /* =======================
     JSX
  ======================= */
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
            {/* {sidebarCollapsed ? (
            ) : (
              <>
              <img
              src="/Assets/images/LOGO_IMEC.png"
              alt="IMEC del Norte"
              className={styles.logo}
              />
              </>
              )} */}
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
                  {!sidebarCollapsed && (
                    <span className={styles.moduleCount}>{items.length}</span>
                  )}
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
                  {/* <div className={styles.tooltip}>
                    {item.name}
                  </div> */}
                </button>
              ))}
            </div>
          ))}

          {/* Mostrar mensaje si no hay módulos */}
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
            <div className={styles.userAvatar}>{getUserInitials()}</div>

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
              {user && (
                <span className={styles.pageSubtitle}>
                  | {getDisplayRoleName()}
                </span>
              )}
            </h1>
          </div>

          {/* ===== HEADER USER (MOBILE) ===== */}
          <div className={styles.headerRight} ref={mobileUserMenuRef}>
            <button className={styles.iconButton}>
              <BellIcon className={styles.navIcon} />
            </button>

            <button
              className={styles.userAvatarButton}
              onClick={toggleUserMenu}
            >
              <div className={styles.userAvatar}>{getUserInitials()}</div>
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
