// src/utils/notificationUtils.ts
import {
  NotificationModule,
  type Notification,
} from "../interfaces/NotificationInterfaces";

// Mapeo de tipos a módulos
export const NotificationTypeToModule: Record<string, NotificationModule> = {
  WORK_ORDER_CREATED: NotificationModule.WORK_ORDERS,
  WORK_ORDER_ASSIGNED: NotificationModule.WORK_ORDERS,
  WORK_ORDER_IN_PROGRESS: NotificationModule.WORK_ORDERS,
  WORK_ORDER_COMPLETED: NotificationModule.WORK_ORDERS,
  WORK_ORDER_INVOICED: NotificationModule.WORK_ORDERS,
  WORK_ORDER_CANCELLED: NotificationModule.WORK_ORDERS,

  STOCK_BELOW_MIN: NotificationModule.INVENTORY,
  STOCK_EXPIRING: NotificationModule.INVENTORY,
  STOCK_OUT: NotificationModule.INVENTORY,

  USER_CREATED: NotificationModule.USERS,
  USER_UPDATED: NotificationModule.USERS,

  SST_DOCUMENT_EXPIRING: NotificationModule.SST,
  SST_EXPIRED: NotificationModule.SST,

  PAYMENT_RECEIVED: NotificationModule.PAYMENTS,
  PAYMENT_OVERDUE: NotificationModule.PAYMENTS,

  SYSTEM_MAINTENANCE: NotificationModule.SYSTEM,
  SYSTEM_ERROR: NotificationModule.SYSTEM,
};

// Configuración por módulo
export const moduleConfig: Record<
  NotificationModule,
  {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    lightBg: string;
  }
> = {
  [NotificationModule.WORK_ORDERS]: {
    name: "Órdenes de Trabajo",
    icon: "📋",
    color: "#2563eb",
    bgColor: "#3b82f6",
    lightBg: "#eff6ff",
  },
  [NotificationModule.INVENTORY]: {
    name: "Inventario",
    icon: "📦",
    color: "#ca8a04",
    bgColor: "#eab308",
    lightBg: "#fef9c3",
  },
  [NotificationModule.USERS]: {
    name: "Usuarios",
    icon: "👥",
    color: "#059669",
    bgColor: "#10b981",
    lightBg: "#d1fae5",
  },
  [NotificationModule.SST]: {
    name: "SST",
    icon: "🛡️",
    color: "#b91c1c",
    bgColor: "#ef4444",
    lightBg: "#fee2e2",
  },
  [NotificationModule.PAYMENTS]: {
    name: "Pagos",
    icon: "💰",
    color: "#7e22ce",
    bgColor: "#a855f7",
    lightBg: "#f3e8ff",
  },
  [NotificationModule.SYSTEM]: {
    name: "Sistema",
    icon: "⚙️",
    color: "#4b5563",
    bgColor: "#6b7280",
    lightBg: "#f3f4f6",
  },
};

// Obtener módulo de una notificación
export function getNotificationModule(tipo: string): NotificationModule {
  return NotificationTypeToModule[tipo] || NotificationModule.SYSTEM;
}

// 🔥 INTERFAZ PARA LA ACCIÓN (sin path, solo metadata)
export interface NotificationAction {
  label: string;
  icon?: string;
  module: NotificationModule;
  entityId?: number | string;
  entityType?: "order" | "inventory" | "user" | "sst" | "payment" | "system";
}

// 🔥 CORREGIDO: Ahora devuelve metadata en lugar de rutas
export function getNotificationAction(notif: Notification): NotificationAction {
  const module = getNotificationModule(notif.tipo);

  switch (notif.tipo) {
    case "WORK_ORDER_CREATED":
    case "WORK_ORDER_ASSIGNED":
    case "WORK_ORDER_IN_PROGRESS":
    case "WORK_ORDER_COMPLETED":
    case "WORK_ORDER_INVOICED": {
      const id = notif.data?.workOrderId ?? notif.data?.ordenId;
      return {
        label: "Ver orden",
        icon: "🔍",
        module,
        entityId: id,
        entityType: "order",
      };
    }

    case "STOCK_BELOW_MIN":
    case "STOCK_EXPIRING":
    case "STOCK_OUT": {
      const id = notif.data?.insumoId;
      return {
        label: "Ver insumo",
        icon: "📦",
        module,
        entityId: id,
        entityType: "inventory",
      };
    }

    case "USER_CREATED":
    case "USER_UPDATED": {
      const id = notif.data?.usuarioId;
      return {
        label: "Ver usuario",
        icon: "👥",
        module,
        entityId: id,
        entityType: "user",
      };
    }

    case "PAYMENT_RECEIVED":
    case "PAYMENT_OVERDUE": {
      const id = notif.data?.pagoId;
      return {
        label: "Ver pago",
        icon: "💰",
        module,
        entityId: id,
        entityType: "payment",
      };
    }

    case "SST_DOCUMENT_EXPIRING":
    case "SST_EXPIRED": {
      const id = notif.data?.documentoId;
      return {
        label: "Ver documento",
        icon: "🛡️",
        module,
        entityId: id,
        entityType: "sst",
      };
    }

    default:
      return {
        label: "Ver detalles",
        module,
        entityType: "system",
      };
  }
}

// Mensaje formateado
export function getFormattedMessage(notif: Notification): string {
  switch (notif.tipo) {
    case "WORK_ORDER_CREATED":
      return notif.data?.isEmergency
        ? `🚨 Orden de emergencia #${notif.data?.workOrderId}`
        : `Nueva orden #${notif.data?.workOrderId}`;

    case "WORK_ORDER_ASSIGNED":
      return `Orden #${notif.data?.workOrderId} asignada${notif.data?.isLeader ? " (líder)" : ""}`;

    case "WORK_ORDER_IN_PROGRESS":
      return `Orden #${notif.data?.workOrderId} en proceso`;

    case "WORK_ORDER_COMPLETED":
      return `Orden #${notif.data?.workOrderId} finalizada`;

    case "WORK_ORDER_INVOICED":
      return `Orden #${notif.data?.workOrderId} facturada`;

    case "STOCK_BELOW_MIN":
      return `Stock bajo: ${notif.data?.nombre || "Insumo"}`;

    default:
      return notif.mensaje;
  }
}
