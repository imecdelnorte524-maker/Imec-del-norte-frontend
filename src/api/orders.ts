import api from "./axios";
import type {
  Order,
  CreateOrderData,
  UpdateOrderData,
  BillingEstado,
  SupplyDetail,
  ToolDetail,
  AssociatedEquipment,
} from "../interfaces/OrderInterfaces";

// Helpers de mapeo de estados backend ↔ frontend
const mapStatusFromApi = (apiEstado: string): Order["estado"] => {
  switch (apiEstado) {
    case "Solicitada sin asignar":
      return "Pendiente";
    case "Solicitada asignada":
      return "Asignada";
    case "En proceso":
      return "En Proceso";
    case "Finalizada":
      return "Completado";
    case "Cancelada":
      return "Cancelada";
    default:
      return "Pendiente";
  }
};

const mapStatusToApi = (uiEstado: Order["estado"]): string => {
  switch (uiEstado) {
    case "Pendiente":
      return "Solicitada sin asignar";
    case "Asignada":
      return "Solicitada asignada";
    case "En Proceso":
      return "En proceso";
    case "Completado":
      return "Finalizada";
    case "Cancelada":
    case "Rechazada":
      return "Cancelada";
    default:
      return "Solicitada sin asignar";
  }
};

const mapBillingFromApi = (apiEstado: string | undefined): BillingEstado => {
  if (apiEstado === "Facturado") return "Facturado";
  return "No facturado";
};

const mapAssociatedEquipment = (equipment: any): AssociatedEquipment => ({
  equipmentId: equipment.equipmentId,
  code: equipment.code,
  category: equipment.category,
  description: equipment.description,
});

const mapApiOrderToOrder = (apiOrder: any): Order => {
  const equipos: AssociatedEquipment[] = Array.isArray(apiOrder.equipos)
    ? apiOrder.equipos.map(mapAssociatedEquipment)
    : [];

  const supplyDetails: SupplyDetail[] = Array.isArray(apiOrder.supplyDetails)
    ? apiOrder.supplyDetails.map((d: any) => ({
        detalleInsumoId: d.detalleInsumoId,
        cantidadUsada: Number(d.cantidadUsada ?? 0),
        costoUnitarioAlMomento: Number(d.costoUnitarioAlMomento ?? 0),
        nombreInsumo: d.nombreInsumo ?? "",
      }))
    : [];

  const toolDetails: ToolDetail[] = Array.isArray(apiOrder.toolDetails)
    ? apiOrder.toolDetails.map((d: any) => ({
        detalleHerramientaId: d.detalleHerramientaId,
        tiempoUso: d.tiempoUso ?? "",
        nombreHerramienta: d.nombreHerramienta ?? "",
        marca: d.marca ?? "",
      }))
    : [];

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

    tipo_servicio: apiOrder.tipoServicio ?? null,
    maintenance_type: apiOrder.maintenanceType
      ? {
          id: apiOrder.maintenanceType.id,
          nombre: apiOrder.maintenanceType.nombre,
        }
      : null,

    estado_facturacion: mapBillingFromApi(apiOrder.estadoFacturacion),
    factura_pdf_url: apiOrder.facturaPdfUrl ?? null,

    servicio: {
      servicio_id: apiOrder.service?.servicioId ?? 0,
      nombre_servicio: apiOrder.service?.nombreServicio ?? "",
      descripcion: apiOrder.service?.descripcion ?? null,
      duracion_estimada: apiOrder.service?.duracionEstimada ?? null,
      categoria_servicio: apiOrder.service?.categoriaServicio ?? null,
      tipo_trabajo: apiOrder.service?.tipoTrabajo ?? null,
      tipo_mantenimiento: apiOrder.service?.tipoMantenimiento ?? null,
    },

    cliente: {
      usuario_id: apiOrder.cliente?.usuarioId ?? 0,
      nombre: apiOrder.cliente?.nombre ?? "",
      apellido: apiOrder.cliente?.apellido ?? null,
      email: apiOrder.cliente?.email ?? "",
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
          direccion: apiOrder.clienteEmpresa.direccion ?? null,
          contacto: apiOrder.clienteEmpresa.contacto ?? null,
          id_usuario_contacto: apiOrder.clienteEmpresa.idUsuarioContacto ?? null,
        }
      : null,

    equipos: equipos,

    supplyDetails,
    toolDetails,

    costo_total_insumos: apiOrder.costoTotalInsumos ?? 0,
    costo_total_estimado: apiOrder.costoTotalEstimado ?? 0,
  };
};

// 🔧 NUEVO: Obtener órdenes por cliente empresa y categoría (endpoint optimizado)
export const getOrdersByClientAndCategoryRequest = async (
  clienteEmpresaId: number,
  category: string,
): Promise<Order[]> => {
  try {
    
    // Usar el nuevo endpoint optimizado del backend
    const response = await api.get(
      `/work-orders/client/${clienteEmpresaId}/category/${encodeURIComponent(category)}`
    );
    
    const data = response.data?.data || [];
    
    const orders = data.map(mapApiOrderToOrder);

    // Filtro adicional de seguridad (el backend ya filtra, pero por si acaso)
    const filteredOrders = orders.filter((order: Order) => {
      const isActiveStatus =
        order.estado === 'Pendiente' || 
        order.estado === 'Asignada' || 
        order.estado === 'En Proceso';
      
      const isSameClient = order.cliente_empresa?.id_cliente === clienteEmpresaId;
      const isSameCategory = order.servicio.categoria_servicio?.toLowerCase() === category.toLowerCase();
      
      return isActiveStatus && isSameClient && isSameCategory;
    });

    return filteredOrders;
  } catch (error: any) {
    console.error('[API] Error fetching orders by client and category:', error);
    
    // Si el nuevo endpoint no existe (404), usar método de respaldo
    if (error.response?.status === 404) {
      return getOrdersByClientAndCategoryFallback(clienteEmpresaId, category);
    }
    
    // Si es error de permisos (403), retornar array vacío
    if (error.response?.status === 403) {
      return [];
    }
    
    throw error;
  }
};

// 🔧 MÉTODO DE RESPALDO (para compatibilidad con backend antiguo)
const getOrdersByClientAndCategoryFallback = async (
  clienteEmpresaId: number,
  category: string,
): Promise<Order[]> => {
  try {
    const response = await api.get('/work-orders');
    const data = response.data?.data || [];
    const orders = data.map(mapApiOrderToOrder);

    const filteredOrders = orders.filter((order: Order) => {
      const isSameClient = order.cliente_empresa?.id_cliente === clienteEmpresaId;
      const isSameCategory = order.servicio.categoria_servicio?.toLowerCase() === category.toLowerCase();
      const isActiveStatus = 
        order.estado === 'Pendiente' || 
        order.estado === 'Asignada' || 
        order.estado === 'En Proceso';

      return isSameClient && isSameCategory && isActiveStatus;
    });

    return filteredOrders;
  } catch (error: any) {
    console.error('[API] Error en método de respaldo:', error);
    throw error;
  }
};

// 🔧 Obtener órdenes por equipo
export const getOrdersByEquipmentRequest = async (
  equipmentId: number,
): Promise<Order[]> => {
  const response = await api.get(`/work-orders/equipment/${equipmentId}`);
  const data = response.data?.data || [];
  return data.map(mapApiOrderToOrder);
};

// 🔧 Asociar equipo a orden
export const addEquipmentToOrderRequest = async (
  ordenId: number,
  equipmentId: number,
  description?: string,
): Promise<any> => {
  
  const response = await api.post(
    `/work-orders/${ordenId}/equipment/${equipmentId}`,
    { description },
  );
  
  return response.data;
};

// 🔧 Desasociar equipo de orden
export const removeEquipmentFromOrderRequest = async (
  ordenId: number,
  equipmentId: number,
): Promise<void> => {
  await api.delete(`/work-orders/${ordenId}/equipment/${equipmentId}`);
};

// 🟢 MÉTODOS EXISTENTES (sin cambios)
export const getAllOrdersRequest = async (filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Order[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("estado", filters.status);
  if (filters?.startDate) params.append("fecha-inicio", filters.startDate);
  if (filters?.endDate) params.append("fecha-fin", filters.endDate);

  const url = `/work-orders${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);
  const data = response.data?.data || [];
  return data.map(mapApiOrderToOrder);
};

export const getMyAssignedOrdersRequest = async (): Promise<Order[]> => {
  const response = await api.get("/work-orders");
  const data = response.data?.data || [];
  return data.map(mapApiOrderToOrder);
};

export const getMyClientOrdersRequest = async (): Promise<Order[]> => {
  try {
    const response = await api.get("/work-orders");
    const data = response.data?.data || [];
    return data.map(mapApiOrderToOrder);
  } catch (error: any) {
    console.error("Error fetching client orders:", error);
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
  if (orderData.equipmentIds) payload.equipmentIds = orderData.equipmentIds;
  if (orderData.tipo_servicio) payload.tipoServicio = orderData.tipo_servicio;
  if (orderData.maintenance_type_id) payload.maintenanceTypeId = orderData.maintenance_type_id;

  const response = await api.post("/work-orders", payload);
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const updateOrderRequest = async (
  orderId: number,
  updateData: UpdateOrderData,
): Promise<Order> => {
  const payload: any = {};
  if (updateData.tecnico_id !== undefined) payload.tecnicoId = updateData.tecnico_id;
  if (updateData.estado) payload.estado = mapStatusToApi(updateData.estado);
  if (updateData.comentarios !== undefined) payload.comentarios = updateData.comentarios;
  if (updateData.fecha_inicio !== undefined) payload.fechaInicio = updateData.fecha_inicio;
  if (updateData.fecha_finalizacion !== undefined) payload.fechaFinalizacion = updateData.fecha_finalizacion;
  if (updateData.equipmentIds !== undefined) payload.equipmentIds = updateData.equipmentIds;

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
    estado: "Cancelada",
    comentarios: motivo,
  });
};

export const uploadInvoiceRequest = async (
  orderId: number,
  file: File,
): Promise<Order> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/work-orders/${orderId}/invoice`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const addSupplyDetailRequest = async (
  orderId: number,
  payload: {
    insumoId: number;
    cantidadUsada: number;
    costoUnitarioAlMomento?: number;
  },
): Promise<SupplyDetail> => {
  const response = await api.post(`/work-orders/${orderId}/supplies`, payload);
  const d = response.data?.data;
  return {
    detalleInsumoId: d.detalleInsumoId,
    cantidadUsada: Number(d.cantidadUsada ?? payload.cantidadUsada ?? 0),
    costoUnitarioAlMomento: Number(
      d.costoUnitarioAlMomento ?? payload.costoUnitarioAlMomento ?? 0,
    ),
    nombreInsumo: d.supply?.nombre ?? d.nombreInsumo ?? "",
  };
};

export const addToolDetailRequest = async (
  orderId: number,
  payload: {
    herramientaId: number;
    tiempoUso?: string;
    comentariosUso?: string;
  },
): Promise<ToolDetail> => {
  const response = await api.post(`/work-orders/${orderId}/tools`, payload);
  const d = response.data?.data;
  return {
    detalleHerramientaId: d.detalleHerramientaId,
    tiempoUso: d.tiempoUso ?? payload.tiempoUso ?? "",
    nombreHerramienta: d.tool?.nombre ?? d.nombreHerramienta ?? "",
    marca: d.tool?.marca ?? d.marca ?? "",
  };
};

export const removeToolDetailRequest = async (
  orderId: number,
  detalleHerramientaId: number,
): Promise<void> => {
  await api.delete(`/work-orders/${orderId}/tools/${detalleHerramientaId}`);
};

export const removeSupplyDetailRequest = async (
  orderId: number,
  detalleInsumoId: number,
): Promise<void> => {
  await api.delete(`/work-orders/${orderId}/supplies/${detalleInsumoId}`);
};