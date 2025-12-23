// src/api/orders.ts

import api from './axios';
import type {
  Order,
  CreateOrderData,
  UpdateOrderData,
  BillingEstado,
} from '../interfaces/OrderInterfaces';

// Helpers de mapeo de estados backend ↔ frontend
const mapStatusFromApi = (apiEstado: string): Order['estado'] => {
  switch (apiEstado) {
    case 'Solicitada sin asignar':
      return 'Pendiente';
    case 'Solicitada asignada':
      return 'Asignada';
    case 'En proceso':
      return 'En Proceso';
    case 'Finalizada':
      return 'Completado';
    case 'Cancelada':
      return 'Cancelada';
    default:
      return 'Pendiente';
  }
};

const mapStatusToApi = (uiEstado: Order['estado']): string => {
  switch (uiEstado) {
    case 'Pendiente':
      return 'Solicitada sin asignar';
    case 'Asignada':
      return 'Solicitada asignada';
    case 'En Proceso':
      return 'En proceso';
    case 'Completado':
      return 'Finalizada';
    case 'Cancelada':
    case 'Rechazada':
      return 'Cancelada';
    default:
      return 'Solicitada sin asignar';
  }
};

const mapBillingFromApi = (apiEstado: string | undefined): BillingEstado => {
  if (apiEstado === 'Facturado') return 'Facturado';
  return 'No facturado';
};

const mapApiOrderToOrder = (apiOrder: any): Order => {
  // El backend devuelve "equipos" (array). Tomamos el primero para el frontend actual.
  const firstEquipment =
    Array.isArray(apiOrder.equipos) && apiOrder.equipos.length > 0
      ? apiOrder.equipos[0]
      : null;

  return {
    orden_id: apiOrder.ordenId,
    servicio_id: apiOrder.service?.servicioId ?? 0,
    cliente_id: apiOrder.cliente?.usuarioId ?? 0,
    tecnico_id: apiOrder.tecnico?.usuarioId ?? null,
    fecha_solicitud: apiOrder.fechaSolicitud,
    fecha_inicio: apiOrder.fechaInicio ?? null,
    fecha_finalizacion: apiOrder.fechaFinalizacion ?? null,
    estado: mapStatusFromApi(apiOrder.estado),
    comentarios: apiOrder.comentarios ?? null,

    // 🔹 Facturación
    estado_facturacion: mapBillingFromApi(apiOrder.estadoFacturacion),
    factura_pdf_url: apiOrder.facturaPdfUrl ?? null,

    servicio: {
      servicio_id: apiOrder.service?.servicioId ?? 0,
      nombre_servicio: apiOrder.service?.nombreServicio ?? '',
      descripcion: apiOrder.service?.descripcion ?? null,
      precio_base: apiOrder.service?.precioBase ?? 0,
      duracion_estimada: apiOrder.service?.duracionEstimada ?? null,
      categoria_servicio: apiOrder.service?.categoriaServicio ?? null,
      tipo_trabajo: apiOrder.service?.tipoTrabajo ?? null,
      tipo_mantenimiento: apiOrder.service?.tipoMantenimiento ?? null,
    },

    cliente: {
      usuario_id: apiOrder.cliente?.usuarioId ?? 0,
      nombre: apiOrder.cliente?.nombre ?? '',
      apellido: apiOrder.cliente?.apellido ?? null,
      email: apiOrder.cliente?.email ?? '',
      telefono: apiOrder.cliente?.telefono ?? null,
    },

    tecnico: apiOrder.tecnico
      ? {
          usuario_id: apiOrder.tecnico.usuarioId,
          nombre: apiOrder.tecnico.nombre,
          apellido: apiOrder.tecnico.apellido ?? null,
          email: apiOrder.tecnico.email,
        }
      : null,

    cliente_empresa: apiOrder.clienteEmpresa
      ? {
          id_cliente: apiOrder.clienteEmpresa.idCliente,
          nombre: apiOrder.clienteEmpresa.nombre,
          nit: apiOrder.clienteEmpresa.nit,
          email: apiOrder.clienteEmpresa.email,
          telefono: apiOrder.clienteEmpresa.telefono,
          localizacion: apiOrder.clienteEmpresa.localizacion,
        }
      : null,

    // Tomamos solo el primer equipo (si existe) para el modelo actual
    equipo: firstEquipment
      ? {
          equipo_id: firstEquipment.equipmentId,
          nombre: firstEquipment.name,
          codigo: firstEquipment.code ?? null,
          categoria: firstEquipment.category ?? null,
        }
      : null,

    costo_total_insumos: apiOrder.costoTotalInsumos ?? 0,
    costo_total_estimado: apiOrder.costoTotalEstimado ?? 0,
  };
};

// Admin / Secretaria (ven todo; backend ya filtra por rol)
export const getAllOrdersRequest = async (filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Order[]> => {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.append('estado', filters.status);
  }
  if (filters?.startDate) {
    params.append('fecha-inicio', filters.startDate);
  }
  if (filters?.endDate) {
    params.append('fecha-fin', filters.endDate);
  }

  const url = `/work-orders${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.get(url);
  const data = response.data?.data || [];
  return data.map(mapApiOrderToOrder);
};

// Técnico: usa el mismo endpoint; el backend filtra por tecnicoId del token
export const getMyAssignedOrdersRequest = async (): Promise<Order[]> => {
  const response = await api.get('/work-orders');
  const data = response.data?.data || [];
  return data.map(mapApiOrderToOrder);
};

// Cliente: usa el mismo endpoint; el backend filtra por clienteId del token
export const getMyClientOrdersRequest = async (): Promise<Order[]> => {
  try {
    const response = await api.get('/work-orders');
    const data = response.data?.data || [];
    return data.map(mapApiOrderToOrder);
  } catch (error: any) {
    console.error(
      '❌ Frontend: Error al obtener mis solicitudes (cliente):',
      error,
    );
    throw error;
  }
};

export const createOrderRequest = async (
  orderData: CreateOrderData,
): Promise<Order> => {
  const payload: any = {
    servicioId: orderData.servicio_id,
    clienteEmpresaId: orderData.cliente_empresa_id,
  };

  if (orderData.comentarios) payload.comentarios = orderData.comentarios;
  if (orderData.tecnico_id) payload.tecnicoId = orderData.tecnico_id;
  if (orderData.equipo_id) payload.equipoId = orderData.equipo_id;

  const response = await api.post('/work-orders', payload);
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const updateOrderRequest = async (
  orderId: number,
  updateData: UpdateOrderData,
): Promise<Order> => {
  const payload: any = {};

  if (updateData.tecnico_id !== undefined) {
    payload.tecnicoId = updateData.tecnico_id;
  }
  if (updateData.estado) {
    payload.estado = mapStatusToApi(updateData.estado);
  }
  if (updateData.comentarios !== undefined) {
    payload.comentarios = updateData.comentarios;
  }
  if (updateData.fecha_inicio !== undefined) {
    payload.fechaInicio = updateData.fecha_inicio;
  }
  if (updateData.fecha_finalizacion !== undefined) {
    payload.fechaFinalizacion = updateData.fecha_finalizacion;
  }
  if (updateData.equipo_id !== undefined) {
    payload.equipoId = updateData.equipo_id;
  }

  const response = await api.patch(`/work-orders/${orderId}`, payload);
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const assignTechnicianRequest = async (
  orderId: number,
  technicianId: number,
): Promise<Order> => {
  const response = await api.patch(
    `/work-orders/${orderId}/assign-technician`,
    { tecnicoId: technicianId },
  );
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

// Desasignar técnico
export const unassignTechnicianRequest = async (
  orderId: number,
): Promise<Order> => {
  const response = await api.delete(`/work-orders/${orderId}/technician`);
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const getOrderByIdRequest = async (orderId: number): Promise<Order> => {
  const response = await api.get(`/work-orders/${orderId}`);
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

// Cliente: cancelar usando endpoint específico PATCH /work-orders/:id/cancel
export const cancelOrderRequest = async (orderId: number): Promise<Order> => {
  const response = await api.patch(`/work-orders/${orderId}/cancel`);
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const rejectOrderRequest = async (
  orderId: number,
  motivo: string,
): Promise<Order> => {
  return updateOrderRequest(orderId, {
    estado: 'Cancelada',
    comentarios: motivo,
  });
};

// Subir factura (Admin/Secretaria)
export const uploadInvoiceRequest = async (
  orderId: number,
  file: File,
): Promise<Order> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(
    `/work-orders/${orderId}/invoice`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};