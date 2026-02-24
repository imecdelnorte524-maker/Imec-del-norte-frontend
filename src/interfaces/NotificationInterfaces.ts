export interface Notification {
  notificacionId: number;
  usuarioId: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  data: any;
  leida: boolean;
  fechaCreacion: string;
  mensajeCorto: string;
}

// Módulos de notificación
export const NotificationModule = {
  WORK_ORDERS: "work_orders",
  INVENTORY: "inventory",
  USERS: "users",
  SST: "sst",
  PAYMENTS: "payments",
  SYSTEM: "system",
} as const;

// Tipo derivado del objeto
export type NotificationModule =
  (typeof NotificationModule)[keyof typeof NotificationModule];