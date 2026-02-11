// src/config/roles.config.ts

// Definir tipos explícitos para los roles
type RoleKey =
  | "ADMINISTRADOR"
  | "SUPERVISOR"
  | "SECRETARIA"
  | "SG-SST"
  | "TECNICO";

// Mapeo de nombres de roles (para manejar diferentes formatos)
export const ROLE_NAMES: Record<RoleKey, readonly string[]> = {
  ADMINISTRADOR: ["ADMINISTRADOR", "Administrador", "administrador"],
  SUPERVISOR: ["SUPERVISOR", "Supervisor", "supervisor"],
  SECRETARIA: ["SECRETARIA", "Secretaria", "secretaria"],
  "SG-SST": ["SG-SST", "SGSST", "sgsst"],
  TECNICO: ["TECNICO", "Técnico", "técnico", "tecnico"],
} as const;

// Crear arrays planos para los permisos
const FULL_ACCESS_ROLES = [
  ...ROLE_NAMES.ADMINISTRADOR,
  ...ROLE_NAMES.SUPERVISOR,
  ...ROLE_NAMES.SECRETARIA,
  ...ROLE_NAMES["SG-SST"],
];

const OWN_ACCESS_ROLES = [...ROLE_NAMES.TECNICO];

export const ROLE_PERMISSIONS = {
  // Roles que pueden ver todos los reportes
  FULL_ACCESS: FULL_ACCESS_ROLES,

  // Roles que solo pueden ver sus propios reportes
  OWN_ACCESS: OWN_ACCESS_ROLES,

  // Roles que no pueden ver el módulo (se configurarán después)
  NO_ACCESS: [] as string[], // Se puede expandir después
} as const;

// Función para normalizar el nombre del rol
export const normalizeRoleName = (roleName?: string): RoleKey | string => {
  if (!roleName) return "";

  // Buscar en cada grupo de roles
  for (const [key, values] of Object.entries(ROLE_NAMES)) {
    if (values.includes(roleName.toUpperCase()) || values.includes(roleName)) {
      return key as RoleKey; // Retorna el nombre normalizado (ej: 'ADMINISTRADOR')
    }
  }

  return roleName; // Si no se encuentra, retorna el original
};

// Función para verificar si un rol tiene acceso completo
export const hasFullAccess = (roleName?: string): boolean => {
  const normalizedRole = normalizeRoleName(roleName);
  if (!normalizedRole) return false;

  // Si el rol está normalizado a uno de los keys, verificar en FULL_ACCESS_ROLES
  if (
    typeof normalizedRole === "string" &&
    Object.keys(ROLE_NAMES).includes(normalizedRole)
  ) {
    return FULL_ACCESS_ROLES.some((role) =>
      ROLE_NAMES[normalizedRole as RoleKey].includes(role),
    );
  }

  // Si es un string normal, verificar directamente
  return FULL_ACCESS_ROLES.includes(normalizedRole);
};

// Función para verificar si un rol tiene acceso solo a sus reportes
export const hasOwnAccess = (roleName?: string): boolean => {
  const normalizedRole = normalizeRoleName(roleName);
  if (!normalizedRole) return false;

  // Si el rol está normalizado a uno de los keys, verificar en OWN_ACCESS_ROLES
  if (
    typeof normalizedRole === "string" &&
    Object.keys(ROLE_NAMES).includes(normalizedRole)
  ) {
    return OWN_ACCESS_ROLES.some((role) =>
      ROLE_NAMES[normalizedRole as RoleKey].includes(role),
    );
  }

  // Si es un string normal, verificar directamente
  return OWN_ACCESS_ROLES.includes(normalizedRole);
};

// Función para verificar si un usuario puede ver el módulo
export const canViewModule = (roleName?: string): boolean => {
  if (!roleName) return false;
  return hasFullAccess(roleName) || hasOwnAccess(roleName);
};

// Función para determinar qué reportes puede ver un usuario
export const getUserAccessLevel = (
  roleName?: string,
): "full" | "own" | "none" => {
  if (!roleName) return "none";
  if (hasFullAccess(roleName)) return "full";
  if (hasOwnAccess(roleName)) return "own";
  return "none";
};

// Función para obtener el nombre de rol para mostrar
export const getDisplayRoleName = (roleName?: string): string => {
  const normalizedRole = normalizeRoleName(roleName);

  if (normalizedRole === "ADMINISTRADOR") return "Administrador";
  if (normalizedRole === "SUPERVISOR") return "Supervisor";
  if (normalizedRole === "SECRETARIA") return "Secretaria";
  if (normalizedRole === "SG-SST") return "SG-SST";
  if (normalizedRole === "TECNICO") return "Técnico";

  return roleName || "Sin rol";
};

// Función alternativa más simple para verificar acceso
export const checkRoleAccess = (roleName?: string) => {
  if (!roleName) return { level: "none", canView: false, canCreate: false };

  const roleUpper = roleName.toUpperCase();

  // Verificar acceso completo
  const isFullAccess = FULL_ACCESS_ROLES.some(
    (role) => role.toUpperCase() === roleUpper,
  );

  // Verificar acceso propio
  const isOwnAccess = OWN_ACCESS_ROLES.some(
    (role) => role.toUpperCase() === roleUpper,
  );

  const level = isFullAccess ? "full" : isOwnAccess ? "own" : "none";
  const canView = isFullAccess || isOwnAccess;
  const canCreate = isOwnAccess; // Solo técnicos pueden crear

  return {
    level,
    canView,
    canCreate,
    isSST: roleUpper.includes("SGSST") || roleUpper.includes("SG-SST"),
  };
};
