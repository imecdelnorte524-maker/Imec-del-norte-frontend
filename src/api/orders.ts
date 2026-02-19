// src/api/orders.ts
import api from "./axios";
import type {
  Order,
  CreateOrderData,
  UpdateOrderData,
  BillingEstado,
  SupplyDetail,
  ToolDetail,
  AssociatedEquipment,
  TechnicianAssignment,
  UserInfo,
  PauseInfo,
  TimerInfo,
  WorkOrderImage,
  AcInspection,
  WorkOrderEvidencePhase,
} from "../interfaces/OrderInterfaces";

export interface CreateAcInspectionPayload {
  equipmentId: number;
  evapTempSupply: number;
  evapTempReturn: number;
  evapTempAmbient: number;
  evapTempOutdoor: number;
  evapMotorRpm: number;
  evapMicrofarads?: number;
  condHighPressure: number;
  condLowPressure: number;
  condAmperage: number;
  condVoltage: number;
  condTempIn: number;
  condTempDischarge: number;
  condMotorRpm: number;
  condMicrofarads?: number;
  compressorOhmio?: number;
  observation?: string;
}
// Helpers de mapeo de estados backend ↔ frontend
const mapStatusFromApi = (apiEstado: string | undefined): Order["estado"] => {
  if (!apiEstado) return "Pendiente";

  switch (apiEstado) {
    // Estados que vienen de /work-orders (enum textual)
    case "Solicitada sin asignar":
      return "Pendiente";
    case "Solicitada asignada":
      return "Asignada";
    case "En proceso":
      return "En Proceso";
    case "En pausa":
      return "Pausada"; // 👈 lo mostramos como "Pausada" en la UI
    case "Finalizada":
      return "Completado";
    case "Cancelada":
      return "Cancelada";

    case "Pendiente":
    case "Asignada":
    case "En Proceso":
    case "Rechazada":
      return apiEstado as Order["estado"];

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
    case "Pausada":
      return "En pausa";
    case "Completado":
      return "Finalizada";
    case "Cancelada":
    case "Rechazada":
      return "Cancelada";
    default:
      return "Solicitada sin asignar";
  }
};

const mapBillingFromApi = (
  apiEstado: string | null | undefined,
): BillingEstado => {
  if (apiEstado === "Por facturar") return "Por facturar";
  if (apiEstado === "Facturado") return "Facturado";
  if (apiEstado === "Garantía") return "Garantía";
  if (apiEstado === "Sin facturar") return "Sin facturar";
  return "";
};

const mapBillingToApi = (uiEstado: BillingEstado): string => {
  return uiEstado === "Facturado"
    ? "Facturado"
    : uiEstado === "Por facturar"
      ? "Por facturar"
      : uiEstado === "Garantía"
        ? "Garantía"
        : uiEstado === "Sin facturar"
          ? "Sin facturar"
          : "";
};

const mapUserInfo = (apiUser: any): UserInfo => ({
  usuario_id: apiUser.usuarioId || apiUser.usuario_id,
  nombre: apiUser.nombre || "",
  apellido: apiUser.apellido || null,
  email: apiUser.email || "",
  telefono: apiUser.telefono || null,
  cedula: apiUser.cedula,
});

const mapAssociatedEquipment = (equipment: any): AssociatedEquipment => ({
  equipmentId: equipment.equipmentId,
  code: equipment.code,
  category: equipment.category,
  description: equipment.description,
  status: equipment.status,
  area: equipment.area
    ? {
        areaId: equipment.area.areaId,
        nombre: equipment.area.nombre,
      }
    : null,
  subArea: equipment.subArea
    ? {
        subAreaId: equipment.subArea.subAreaId,
        nombre: equipment.subArea.nombre,
      }
    : null,
});

const mapTechnicianAssignment = (apiTech: any): TechnicianAssignment => ({
  id: apiTech.id,
  tecnicoId: apiTech.tecnicoId,
  isLeader: apiTech.isLeader || false,
  technician: mapUserInfo(apiTech.technician || {}),
  rating: apiTech.rating ?? null,
  ratedByUserId: apiTech.ratedByUserId ?? null,
  ratedAt: apiTech.ratedAt ?? null,
});

// Hacemos export para poder reutilizarlo desde api/dashboard.ts si se quiere
export const mapApiOrderToOrder = (apiOrder: any): Order => {
  // Técnicos (array)
  const technicians: TechnicianAssignment[] = Array.isArray(
    apiOrder.technicians,
  )
    ? apiOrder.technicians.map(mapTechnicianAssignment)
    : [];

  // Compatibilidad: usar el primer técnico como "principal"
  const primerTecnico = technicians[0];
  const tecnicoId = primerTecnico?.tecnicoId || null;
  const tecnico = primerTecnico?.technician || null;

  const equipos: AssociatedEquipment[] = Array.isArray(apiOrder.equipos)
    ? apiOrder.equipos.map(mapAssociatedEquipment)
    : [];

  const supplyDetails: SupplyDetail[] = Array.isArray(apiOrder.supplyDetails)
    ? apiOrder.supplyDetails.map((d: any) => ({
        detalleInsumoId: d.detalleInsumoId,
        cantidadUsada: Number(d.cantidadUsada ?? 0),
        costoUnitarioAlMomento: Number(d.costoUnitarioAlMomento ?? 0),
        nombreInsumo: d.nombreInsumo ?? d.supply?.nombre ?? "",
      }))
    : [];

  const toolDetails: ToolDetail[] = Array.isArray(apiOrder.toolDetails)
    ? apiOrder.toolDetails.map((d: any) => ({
        detalleHerramientaId: d.detalleHerramientaId,
        tiempoUso: d.tiempoUso ?? "",
        nombreHerramienta: d.nombreHerramienta ?? d.tool?.nombre ?? "",
        marca: d.marca ?? d.tool?.marca ?? "",
      }))
    : [];

  const timers =
    apiOrder.timers?.map((timer: any) => ({
      timerId: timer.timerId,
      startTime: timer.startTime,
      endTime: timer.endTime,
      totalSeconds: timer.totalSeconds,
    })) || [];

  const pauses =
    apiOrder.pauses?.map((pause: any) => ({
      pauseId: pause.pauseId,
      startTime: pause.startTime,
      endTime: pause.endTime,
      observacion: pause.observacion,
      user: mapUserInfo(pause.user),
    })) || [];

  const acInspections: AcInspection[] = Array.isArray(apiOrder.acInspections)
    ? apiOrder.acInspections.map((insp: any) => ({
        id: insp.id,
        equipmentId: insp.equipmentId ?? insp.equipment_id ?? null, // ✅ corregido
        phase: insp.phase,
        evapTempSupply: insp.evapTempSupply,
        evapTempReturn: insp.evapTempReturn,
        evapTempAmbient: insp.evapTempAmbient,
        evapTempOutdoor: insp.evapTempOutdoor,
        evapMotorRpm: insp.evapMotorRpm,
        evapMicrofarads: insp.evapMicrofarads ?? null,
        condHighPressure: insp.condHighPressure,
        condLowPressure: insp.condLowPressure,
        condAmperage: insp.condAmperage,
        condVoltage: insp.condVoltage,
        condTempIn: insp.condTempIn,
        condTempDischarge: insp.condTempDischarge,
        condMotorRpm: insp.condMotorRpm,
        condMicrofarads: insp.condMicrofarads ?? null,
        compressorOhmio: insp.compressorOhmio ?? null,
        observation: insp.observation ?? null,
        createdAt: insp.createdAt || insp.created_at,
      }))
    : [];

  const images: WorkOrderImage[] = Array.isArray(apiOrder.images)
    ? apiOrder.images.map((img: any) => ({
        id: img.id,
        url: img.url,
        public_id: img.public_id || img.publicId,
        folder: img.folder,
        created_at: img.created_at || img.createdAt,
        evidencePhase: img.evidencePhase ?? null,
        observation: img.observation ?? null,
      }))
    : [];

  return {
    orden_id: apiOrder.ordenId || apiOrder.orden_id,
    servicio_id: apiOrder.servicioId || apiOrder.service?.servicioId || 0,
    cliente_id:
      apiOrder.clienteId ||
      apiOrder.cliente?.usuarioId ||
      apiOrder.cliente?.usuario_id ||
      0,
    cliente_empresa_id:
      apiOrder.clienteEmpresaId ||
      apiOrder.clienteEmpresa?.idCliente ||
      apiOrder.cliente_empresa?.id_cliente ||
      null,
    fecha_solicitud: apiOrder.fechaSolicitud || apiOrder.fecha_solicitud,
    fecha_inicio: apiOrder.fechaInicio || apiOrder.fecha_inicio || null,
    fecha_finalizacion:
      apiOrder.fechaFinalizacion || apiOrder.fecha_finalizacion || null,
    estado: mapStatusFromApi(apiOrder.estado),
    comentarios: apiOrder.comentarios || null,
    tipo_servicio: apiOrder.tipoServicio || apiOrder.tipo_servicio || null,
    maintenance_type: apiOrder.maintenanceType
      ? {
          id: apiOrder.maintenanceType.id,
          nombre: apiOrder.maintenanceType.nombre,
        }
      : null,
    estado_facturacion: mapBillingFromApi(
      apiOrder.estadoFacturacion ?? apiOrder.estado_facturacion,
    ),
    factura_pdf_url: apiOrder.facturaPdfUrl || apiOrder.factura_pdf_url || null,
    isEmergency: apiOrder.isEmergency || false,
    plan_mantenimiento_id:
      apiOrder.planMantenimientoId || apiOrder.plan_mantenimiento_id || null,

    servicio: {
      servicio_id:
        apiOrder.service?.servicioId || apiOrder.servicio?.servicio_id || 0,
      nombre_servicio:
        apiOrder.service?.nombreServicio ||
        apiOrder.servicio?.nombre_servicio ||
        "",
      descripcion:
        apiOrder.service?.descripcion || apiOrder.servicio?.descripcion || null,
      duracion_estimada:
        apiOrder.service?.duracionEstimada ||
        apiOrder.servicio?.duracion_estimada ||
        null,
      categoria_servicio:
        apiOrder.service?.categoriaServicio ||
        apiOrder.servicio?.categoria_servicio ||
        null,
      tipo_trabajo:
        apiOrder.service?.tipoTrabajo ||
        apiOrder.servicio?.tipo_trabajo ||
        null,
      tipo_mantenimiento:
        apiOrder.service?.tipoMantenimiento ||
        apiOrder.servicio?.tipo_mantenimiento ||
        null,
    },

    cliente: apiOrder.cliente ? mapUserInfo(apiOrder.cliente) : undefined,

    cliente_empresa: apiOrder.clienteEmpresa
      ? {
          id_cliente:
            apiOrder.clienteEmpresa.idCliente ||
            apiOrder.cliente_empresa?.id_cliente,
          nombre:
            apiOrder.clienteEmpresa.nombre ||
            apiOrder.cliente_empresa?.nombre ||
            "",
          nit:
            apiOrder.clienteEmpresa.nit || apiOrder.cliente_empresa?.nit || "",
          email:
            apiOrder.clienteEmpresa.email ||
            apiOrder.cliente_empresa?.email ||
            "",
          telefono:
            apiOrder.clienteEmpresa.telefono ||
            apiOrder.cliente_empresa?.telefono ||
            "",
          localizacion:
            apiOrder.clienteEmpresa.localizacion ||
            apiOrder.cliente_empresa?.localizacion ||
            "",
          direccion:
            apiOrder.clienteEmpresa.direccion ||
            apiOrder.cliente_empresa?.direccion ||
            null,
          contacto:
            apiOrder.clienteEmpresa.contacto ||
            apiOrder.cliente_empresa?.contacto ||
            null,
          id_usuario_contacto:
            apiOrder.clienteEmpresa.idUsuarioContacto ||
            apiOrder.cliente_empresa?.id_usuario_contacto ||
            null,
        }
      : null,

    technicians,
    tecnico_id: tecnicoId,
    tecnico,

    equipos,
    supplyDetails,
    toolDetails,
    timers,
    pauses,

    costo_total_insumos:
      apiOrder.costo_total_insumos || apiOrder.costoTotalInsumos || 0,
    tiempo_total: apiOrder.tiempoTotal || apiOrder.tiempo_total || 0,
    received_by_name:
      apiOrder.receivedByName || apiOrder.received_by_name || null,
    received_by_position:
      apiOrder.receivedByPosition || apiOrder.received_by_position || null,
    received_by_signature_data:
      apiOrder.receivedBySignatureData ||
      apiOrder.received_by_signature_data ||
      null,
    received_at: apiOrder.receivedAt || apiOrder.received_at || null,
    acInspections,
    images,
  };
};

// 🔧 Obtener órdenes por cliente empresa y categoría
export const getOrdersByClientAndCategoryRequest = async (
  clienteEmpresaId: number,
  category: string,
): Promise<Order[]> => {
  try {
    const response = await api.get(
      `/work-orders/client/${clienteEmpresaId}/category/${encodeURIComponent(
        category,
      )}`,
    );

    const data = response.data?.data || [];
    const orders = data.map(mapApiOrderToOrder);

    // 🔥 FILTRO CORREGIDO: SOLO órdenes que cumplen TODAS las condiciones
    const filteredOrders = orders.filter((order: Order) => {
      // 1. Estado válido: Pendiente o Asignada
      const isValidStatus =
        order.estado === "Pendiente" || order.estado === "Asignada";

      // 2. Sin equipos asociados
      const hasNoEquipment = !order.equipos || order.equipos.length === 0;

      // 3. NO es orden automática de plan de mantenimiento
      const isNotAutomatic = order.plan_mantenimiento_id === null;

      // 4. Mismo cliente
      const isSameClient =
        order.cliente_empresa?.id_cliente === clienteEmpresaId;

      // 5. Misma categoría
      const isSameCategory =
        order.servicio.categoria_servicio?.toLowerCase() ===
        category.toLowerCase();

      return (
        isValidStatus &&
        hasNoEquipment &&
        isNotAutomatic &&
        isSameClient &&
        isSameCategory
      );
    });

    return filteredOrders;
  } catch (error: any) {
    console.error("[API] Error fetching orders by client and category:", error);

    if (error.response?.status === 404) {
      return getOrdersByClientAndCategoryFallback(clienteEmpresaId, category);
    }

    if (error.response?.status === 403) {
      return [];
    }

    throw error;
  }
};

// 🔧 MÉTODO DE RESPALDO - TAMBIÉN CORREGIDO
const getOrdersByClientAndCategoryFallback = async (
  clienteEmpresaId: number,
  category: string,
): Promise<Order[]> => {
  try {
    const response = await api.get("/work-orders");
    const data = response.data?.data || [];
    const orders = data.map(mapApiOrderToOrder);

    const filteredOrders = orders.filter((order: Order) => {
      // MISMOS FILTROS QUE ARRIBA
      const isValidStatus =
        order.estado === "Pendiente" || order.estado === "Asignada";

      const hasNoEquipment = !order.equipos || order.equipos.length === 0;
      const isNotAutomatic = order.plan_mantenimiento_id === null;
      const isSameClient =
        order.cliente_empresa?.id_cliente === clienteEmpresaId;
      const isSameCategory =
        order.servicio.categoria_servicio?.toLowerCase() ===
        category.toLowerCase();

      return (
        isValidStatus &&
        hasNoEquipment &&
        isNotAutomatic &&
        isSameClient &&
        isSameCategory
      );
    });

    return filteredOrders;
  } catch (error: any) {
    console.error("[API] Error en método de respaldo:", error);
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

// 🟢 Obtener todas las órdenes desde /work-orders (sin paginación real en backend)
export const getAllOrdersRequest = async (filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  services: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const params = new URLSearchParams();
  // Estos filtros hoy no los usa el backend en /work-orders,
  // pero los dejamos por si luego agregas soporte.
  if (filters?.status) params.append("estado", filters.status);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());

  const url = `/work-orders${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);

  const list = response.data?.data || [];
  const mappedServices = Array.isArray(list)
    ? list.map(mapApiOrderToOrder)
    : [];

  return {
    services: mappedServices,
    total: mappedServices.length,
    page: 1,
    limit: mappedServices.length,
    totalPages: 1,
  };
};

// 🔧 Mis órdenes (técnico/cliente) → usan /work-orders, el backend filtra según rol
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
  };

  if (orderData.cliente_empresa_id)
    payload.clienteEmpresaId = orderData.cliente_empresa_id;
  if (orderData.cliente_id) payload.clienteId = orderData.cliente_id;
  if (orderData.comentarios) payload.comentarios = orderData.comentarios;
  if (orderData.technicians) payload.technicians = orderData.technicians;
  if (orderData.equipmentIds) payload.equipmentIds = orderData.equipmentIds;
  if (orderData.tipo_servicio) payload.tipoServicio = orderData.tipo_servicio;
  if (orderData.maintenance_type_id)
    payload.maintenanceTypeId = orderData.maintenance_type_id;
  if (orderData.isEmergency !== undefined)
    payload.isEmergency = orderData.isEmergency;
  if (orderData.plan_mantenimiento_id)
    payload.planMantenimientoId = orderData.plan_mantenimiento_id;

  const response = await api.post("/work-orders", payload);
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const updateOrderRequest = async (
  orderId: number,
  updateData: UpdateOrderData,
): Promise<Order> => {
  const payload: any = {};

  if (updateData.estado) payload.estado = mapStatusToApi(updateData.estado);
  if (updateData.comentarios !== undefined)
    payload.comentarios = updateData.comentarios;
  if (updateData.fecha_inicio !== undefined)
    payload.fechaInicio = updateData.fecha_inicio;
  if (updateData.fecha_finalizacion !== undefined)
    payload.fechaFinalizacion = updateData.fecha_finalizacion;
  if (updateData.technicians !== undefined)
    payload.technicians = updateData.technicians;
  if (updateData.equipmentIds !== undefined)
    payload.equipmentIds = updateData.equipmentIds;
  if (updateData.estado_facturacion !== undefined)
    payload.estadoFacturacion = mapBillingToApi(updateData.estado_facturacion);
  if (updateData.tipo_servicio !== undefined)
    payload.tipoServicio = updateData.tipo_servicio;
  if (updateData.maintenance_type_id !== undefined)
    payload.maintenanceTypeId = updateData.maintenance_type_id;
  if (updateData.pause_observation !== undefined)
    payload.pauseObservation = updateData.pause_observation; // 👈 este nombre coincide con DTO backend

  const response = await api.patch(`/work-orders/${orderId}`, payload);
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const assignTechniciansRequest = async (
  orderId: number,
  payload: {
    technicianIds: number[];
    leaderTechnicianId?: number;
  },
): Promise<Order> => {
  const response = await api.patch(
    `/work-orders/${orderId}/assign-technicians`,
    payload,
  );
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const unassignTechnicianRequest = async (
  orderId: number,
): Promise<Order> => {
  const url = `/work-orders/${orderId}/technicians`;
  const response = await api.delete(url);
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const removeSpecificTechnicianRequest = async (
  orderId: number,
  tecnicoIdToRemove: number,
): Promise<Order> => {
  const currentOrder = await getOrderByIdRequest(orderId);

  const remainingTechnicians = currentOrder.technicians.filter(
    (t) => t.tecnicoId !== tecnicoIdToRemove,
  );

  if (remainingTechnicians.length === 0) {
    const response = await api.delete(`/work-orders/${orderId}/technicians`);
    const apiOrder = response.data?.data;
    return mapApiOrderToOrder(apiOrder);
  } else {
    const technicianIds = remainingTechnicians.map((t) => t.tecnicoId);
    const leaderTechnicianId =
      remainingTechnicians.find((t) => t.isLeader)?.tecnicoId ||
      technicianIds[0];

    return assignTechniciansRequest(orderId, {
      technicianIds,
      leaderTechnicianId,
    });
  }
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

// 🔧 Timers y pausas (adaptado a endpoints reales del backend)
export const startTimerRequest = async (
  orderId: number,
): Promise<TimerInfo> => {
  const response = await api.post(`/work-orders/${orderId}/start-timer`);
  return response.data?.data;
};

export const stopTimerRequest = async (orderId: number): Promise<TimerInfo> => {
  const response = await api.post(`/work-orders/${orderId}/stop-timer`);
  return response.data?.data;
};

export const addPauseRequest = async (
  orderId: number,
  payload: { observacion: string; userId?: number },
): Promise<PauseInfo> => {
  // El backend obtiene userId del JWT, solo necesita observacion
  const response = await api.post(`/work-orders/${orderId}/pause`, {
    observacion: payload.observacion,
  });
  return response.data?.data;
};

// El backend no cierra pausas por pauseId, usa /:id/resume y cierra la última pausa activa
export const endPauseRequest = async (orderId: number): Promise<TimerInfo> => {
  const response = await api.post(`/work-orders/${orderId}/resume`);
  return response.data?.data;
};

// Crear orden de emergencia desde una orden existente
export const createEmergencyOrderRequest = async (
  orderId: number,
  payload: {
    technicianIds: number[];
    leaderTechnicianId?: number;
    equipmentIds?: number[];
    comentarios?: string;
  },
): Promise<Order> => {
  const response = await api.post(`/work-orders/${orderId}/emergency`, payload);
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const rateTechniciansRequest = async (
  orderId: number,
  ratings: { technicianId: number; rating: number }[],
): Promise<Order> => {
  const response = await api.post(`/work-orders/${orderId}/rate-technicians`, {
    ratings,
  });
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const signOrderReceiptRequest = async (
  orderId: number,
  payload: {
    name: string;
    position: string;
    signatureData: string | null;
  },
): Promise<Order> => {
  const response = await api.post(
    `/work-orders/${orderId}/sign-receipt`,
    payload,
  );
  const apiOrder = response.data?.data;
  return mapApiOrderToOrder(apiOrder);
};

export const getWorkOrderImagesRequest = async (
  orderId: number,
): Promise<WorkOrderImage[]> => {
  const response = await api.get(`/images/work-order/${orderId}`);
  const data = response.data?.data || [];
  return data as WorkOrderImage[];
};

export const uploadWorkOrderImagesRequest = async (
  orderId: number,
  files: File[],
  options?: { phase?: WorkOrderEvidencePhase; observation?: string },
): Promise<WorkOrderImage[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  if (options?.phase) {
    formData.append("phase", options.phase);
  }
  if (options?.observation) {
    formData.append("observation", options.observation);
  }

  const response = await api.post(`/images/work-order/${orderId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const data = response.data?.data || [];
  return data as WorkOrderImage[];
};

export const deleteWorkOrderImageRequest = async (
  imageId: number,
): Promise<void> => {
  await api.delete(`/images/${imageId}`);
};

export const getAllOrdersForTechniciansRequest = async (): Promise<Order[]> => {
  try {
    // Usamos el parámetro all=true para que el backend devuelva todas las órdenes
    const response = await api.get("/work-orders?all=true");
    const data = response.data?.data || [];
    return data.map(mapApiOrderToOrder);
  } catch (error) {
    console.error("[API] Error fetching all orders for technicians:", error);
    return [];
  }
};

export const createAcInspectionBeforeRequest = async (
  orderId: number,
  payload: CreateAcInspectionPayload,
) => {
  const response = await api.post(
    `/work-orders/${orderId}/ac-inspections/before`,
    payload,
  );
  return response.data?.data;
};

export const createAcInspectionAfterRequest = async (
  orderId: number,
  payload: CreateAcInspectionPayload,
) => {
  const response = await api.post(
    `/work-orders/${orderId}/ac-inspections/after`,
    payload,
  );
  return response.data?.data;
};
