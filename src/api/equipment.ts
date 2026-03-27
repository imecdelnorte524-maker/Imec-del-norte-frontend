import api from "./axios";
import type {
  Equipment,
  EquipmentPhoto,
  CreateEquipmentData,
  UpdateEquipmentPayload,
  EquipmentResponse,
  MotorData,
  EvaporatorData,
  CondenserData,
  CompressorData,
  PlanMantenimientoData,
  WorkOrderInfo,
  EquipmentDocument,
} from "../interfaces/EquipmentInterfaces";

// ────────────────────────────────────────────────────────────────
// Mapeadores Backend → Frontend
// ────────────────────────────────────────────────────────────────

const mapPhoto = (p: any): EquipmentPhoto => ({
  photoId: p.photoId || p.id,
  equipmentId: p.equipmentId,
  url: p.url,
  description: p.description || null,
  createdAt: p.createdAt || p.created_at,
});

const mapWorkOrderInfo = (wo: any): WorkOrderInfo => ({
  workOrderId: wo.workOrderId || wo.orden_id || wo.workOrder?.ordenId,
  description: wo.description || null,
  createdAt: wo.createdAt || wo.created_at,
  workOrderDetails: wo.workOrder
    ? {
        estado: wo.workOrder.estado,
        tipoServicio: wo.workOrder.tipoServicio,
        fechaSolicitud: wo.workOrder.fechaSolicitud,
      }
    : undefined,
});

const mapMotor = (motor: any): MotorData => {
  const numeroParte =
    motor.numeroParte ?? motor.numeroparte ?? motor.numero_parte ?? null;

  return {
    amperaje: motor.amperaje,
    voltaje: motor.voltaje,
    numeroFases: motor.numeroFases,
    numeroParte: numeroParte ?? undefined,
    numero_parte: numeroParte ?? undefined,
    diametroEje: motor.diametroEje,
    tipoEje: motor.tipoEje,
    rpm: motor.rpm,
    correa: motor.correa,
    diametroPolea: motor.diametroPolea,
    capacidadHp: motor.capacidadHp,
    frecuencia: motor.frecuencia,
  };
};

const mapCompressor = (comp: any): CompressorData => ({
  marca: comp.marca,
  modelo: comp.modelo,
  serial: comp.serial,
  capacidad: comp.capacidad,
  voltaje: comp.voltaje,
  frecuencia: comp.frecuencia,
  tipoRefrigerante: comp.tipoRefrigerante,
  tipoAceite: comp.tipoAceite,
  cantidadAceite: comp.cantidadAceite,
  capacitor: comp.capacitor,
  lra: comp.lra,
  fla: comp.fla,
  cantidadPolos: comp.cantidadPolos,
  amperaje: comp.amperaje,
  voltajeBobina: comp.voltajeBobina,
  vac: comp.vac,
});

const mapEvaporator = (evap: any): EvaporatorData => {
  const typeEvap = evap.airConditionerTypeEvap;

  return {
    airConditionerTypeEvapId: evap.airConditionerTypeEvapId,
    airConditionerTypeEvap: typeEvap
      ? {
          id: typeEvap.id,
          name: typeEvap.name,
          hasEvaporator: typeEvap.hasEvaporator,
          hasCondenser: typeEvap.hasCondenser,
        }
      : undefined,
    marca: evap.marca,
    modelo: evap.modelo,
    serial: evap.serial,
    capacidad: evap.capacidad,
    tipoRefrigerante: evap.tipoRefrigerante,
    motors: Array.isArray(evap.motors) ? evap.motors.map(mapMotor) : [],
  };
};

const mapCondenser = (cond: any): CondenserData => ({
  marca: cond.marca,
  modelo: cond.modelo,
  serial: cond.serial,
  capacidad: cond.capacidad,
  amperaje: cond.amperaje,
  voltaje: cond.voltaje,
  tipoRefrigerante: cond.tipoRefrigerante,
  numeroFases: cond.numeroFases,
  presionAlta: cond.presionAlta,
  presionBaja: cond.presionBaja,
  hp: cond.hp,
  motors: Array.isArray(cond.motors) ? cond.motors.map(mapMotor) : [],
  compressors: Array.isArray(cond.compressors)
    ? cond.compressors.map(mapCompressor)
    : [],
});

const mapPlanMantenimiento = (plan: any): PlanMantenimientoData | null =>
  plan
    ? {
        unidadFrecuencia: plan.unidadFrecuencia || undefined,
        diaDelMes:
          plan.diaDelMes !== undefined && plan.diaDelMes !== null
            ? Number(plan.diaDelMes)
            : null,
        fechaProgramada: plan.fechaProgramada ?? null,
        notas: plan.notas ?? null,
      }
    : null;

export const mapEquipmentFromBackend = (data: any): Equipment => ({
  equipmentId: data.equipmentId,
  client: {
    idCliente: data.client.idCliente,
    nombre: data.client.nombre,
    nit: data.client.nit,
  },
  area: data.area
    ? {
        idArea: data.area.idArea,
        nombreArea: data.area.nombreArea,
      }
    : undefined,
  subArea: data.subArea
    ? {
        idSubArea: data.subArea.idSubArea,
        nombreSubArea: data.subArea.nombreSubArea,
      }
    : undefined,
  workOrders: Array.isArray(data.workOrders)
    ? data.workOrders.map(mapWorkOrderInfo)
    : [],
  category: data.category,
  airConditionerTypeId: data.airConditionerTypeId,
  airConditionerType: data.airConditionerType
    ? {
        id: data.airConditionerType.id,
        name: data.airConditionerType.name,
        hasEvaporator: data.airConditionerType.hasEvaporator,
        hasCondenser: data.airConditionerType.hasCondenser,
      }
    : undefined,
  code: data.code,
  status: data.status,
  installationDate: data.installationDate,
  notes: data.notes,
  createdAt: data.createdAt,
  createdBy: data.createdBy,
  updatedAt: data.updatedAt,
  updatedBy: data.updatedBy ?? null,
  photos: Array.isArray(data.photos) ? data.photos.map(mapPhoto) : [],
  evaporators: Array.isArray(data.evaporators)
    ? data.evaporators.map(mapEvaporator)
    : [],
  condensers: Array.isArray(data.condensers)
    ? data.condensers.map(mapCondenser)
    : [],
  planMantenimiento: mapPlanMantenimiento(data.planMantenimiento),
  planMantenimientoAutomatico:
    data.planMantenimientoAutomatico ??
    data.plan_mantenimiento_automatico ??
    false,
});

// ────────────────────────────────────────────────────────────────
// Mapeadores Frontend → Backend (para enviar datos)
// ────────────────────────────────────────────────────────────────

const prepareMotorForBackend = (motor: MotorData): any => ({
  amperaje: motor.amperaje || null,
  voltaje: motor.voltaje || null,
  numeroFases: motor.numeroFases || null,
  diametroEje: motor.diametroEje || null,
  tipoEje: motor.tipoEje || null,
  rpm: motor.rpm || null,
  correa: motor.correa || null,
  diametroPolea: motor.diametroPolea || null,
  capacidadHp: motor.capacidadHp || null,
  frecuencia: motor.frecuencia || null,
  numeroParte: motor.numeroParte || motor.numero_parte || null,
});

const prepareCompressorForBackend = (comp: CompressorData): any => ({
  marca: comp.marca || null,
  modelo: comp.modelo || null,
  serial: comp.serial || null,
  capacidad: comp.capacidad || null,
  voltaje: comp.voltaje || null,
  frecuencia: comp.frecuencia || null,
  tipoRefrigerante: comp.tipoRefrigerante || null,
  tipoAceite: comp.tipoAceite || null,
  cantidadAceite: comp.cantidadAceite || null,
  capacitor: comp.capacitor || null,
  lra: comp.lra || null,
  fla: comp.fla || null,
  cantidadPolos: comp.cantidadPolos || null,
  amperaje: comp.amperaje || null,
  voltajeBobina: comp.voltajeBobina || null,
  vac: comp.vac || null,
});

const prepareEvaporatorForBackend = (evap: EvaporatorData): any => ({
  airConditionerTypeEvapId: evap.airConditionerTypeEvapId || null,
  marca: evap.marca || null,
  modelo: evap.modelo || null,
  serial: evap.serial || null,
  capacidad: evap.capacidad || null,
  tipoRefrigerante: evap.tipoRefrigerante || null,
  motors: Array.isArray(evap.motors)
    ? evap.motors.map(prepareMotorForBackend)
    : [],
});

const prepareCondenserForBackend = (cond: CondenserData): any => ({
  marca: cond.marca || null,
  modelo: cond.modelo || null,
  serial: cond.serial || null,
  capacidad: cond.capacidad || null,
  amperaje: cond.amperaje || null,
  voltaje: cond.voltaje || null,
  tipoRefrigerante: cond.tipoRefrigerante || null,
  numeroFases: cond.numeroFases || null,
  presionAlta: cond.presionAlta || null,
  presionBaja: cond.presionBaja || null,
  hp: cond.hp || null,
  motors: Array.isArray(cond.motors)
    ? cond.motors.map(prepareMotorForBackend)
    : [],
  compressors: Array.isArray(cond.compressors)
    ? cond.compressors.map(prepareCompressorForBackend)
    : [],
});

// Type guard para verificar si es CreateEquipmentData
const isCreateEquipmentData = (
  data: CreateEquipmentData | UpdateEquipmentPayload,
): data is CreateEquipmentData => {
  return (data as CreateEquipmentData).clientId !== undefined;
};

export const prepareEquipmentForBackend = (
  data: CreateEquipmentData | UpdateEquipmentPayload,
): any => {
  const payload: any = {};

  // Solo incluir clientId y category si estamos creando un equipo
  if (isCreateEquipmentData(data)) {
    if (data.clientId !== undefined) payload.clientId = data.clientId;
    if (data.category !== undefined) payload.category = data.category;
  }

  // Campos comunes que pueden estar en ambos tipos
  if (data.status !== undefined) payload.status = data.status || "Activo";
  if (data.areaId !== undefined) payload.areaId = data.areaId;
  if (data.subAreaId !== undefined) payload.subAreaId = data.subAreaId;
  if (data.airConditionerTypeId !== undefined)
    payload.airConditionerTypeId = data.airConditionerTypeId;
  if (data.installationDate !== undefined)
    payload.installationDate = data.installationDate;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.planMantenimientoAutomatico !== undefined) {
    payload.planMantenimientoAutomatico = data.planMantenimientoAutomatico;
  }
  if (data.evaporators !== undefined) {
    payload.evaporators =
      data.evaporators?.map(prepareEvaporatorForBackend) || [];
  }

  if (data.condensers !== undefined) {
    payload.condensers = data.condensers?.map(prepareCondenserForBackend) || [];
  }

  if (data.planMantenimiento !== undefined) {
    if (!data.planMantenimiento) {
      payload.planMantenimiento = null;
    } else {
      const { unidadFrecuencia, diaDelMes, fechaProgramada, notas } =
        data.planMantenimiento;

      let diaDelMesNumber: number | null = null;

      if (diaDelMes !== null && diaDelMes !== undefined) {
        const n = Number(diaDelMes as any);
        diaDelMesNumber = Number.isNaN(n) ? null : n;
      }

      payload.planMantenimiento = {
        unidadFrecuencia: unidadFrecuencia || null,
        diaDelMes: diaDelMesNumber,
        fechaProgramada: fechaProgramada || null,
        notas: notas || null,
      };
    }
  }

  return payload;
};

// ────────────────────────────────────────────────────────────────
// Funciones de API
// ────────────────────────────────────────────────────────────────

/**
 * Obtener equipos con filtros
 */
export const getEquipmentRequest = async (filters?: {
  clientId?: number;
  areaId?: number;
  subAreaId?: number;
  search?: string;
}): Promise<Equipment[]> => {
  try {
    const params = new URLSearchParams();

    if (filters?.clientId)
      params.append("clientId", filters.clientId.toString());
    if (filters?.areaId) params.append("areaId", filters.areaId.toString());
    if (filters?.subAreaId)
      params.append("subAreaId", filters.subAreaId.toString());
    if (filters?.search) params.append("search", filters.search);

    const url = `/equipment${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get<EquipmentResponse>(url);
    const data = response.data.data;

    if (Array.isArray(data)) {
      return data.map(mapEquipmentFromBackend);
    }
    return [];
  } catch (error: any) {
    console.error("❌ Error en getEquipmentRequest:", error);
    throw new Error(
      error.response?.data?.message || "Error al obtener equipos",
    );
  }
};

/**
 * Obtener equipos para cliente (con restricciones de seguridad)
 */
export const getMyEquipmentRequest = async (
  search?: string,
): Promise<Equipment[]> => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);

    const url = `/equipment${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get<EquipmentResponse>(url);
    const data = response.data.data;

    if (Array.isArray(data)) {
      return data.map(mapEquipmentFromBackend);
    }
    return [];
  } catch (error: any) {
    console.error("❌ Error en getMyEquipmentRequest:", error);
    throw new Error(
      error.response?.data?.message || "Error al obtener mis equipos",
    );
  }
};

/**
 * Obtener equipos por cliente
 */
export const getEquipmentByClientRequest = async (
  clientId: number,
  search?: string,
): Promise<Equipment[]> => {
  try {
    const params = new URLSearchParams();
    params.append("clientId", clientId.toString());
    if (search) params.append("search", search);

    const response = await api.get<EquipmentResponse>(
      `/equipment?${params.toString()}`,
    );
    const data = response.data.data;

    if (Array.isArray(data)) {
      return data.map(mapEquipmentFromBackend);
    }
    return [];
  } catch (error: any) {
    console.error(
      `❌ Error en getEquipmentByClientRequest(${clientId}):`,
      error,
    );
    throw new Error(
      error.response?.data?.message || "Error al obtener equipos del cliente",
    );
  }
};

/**
 * Obtener equipo por ID
 */
export const getEquipmentByIdRequest = async (
  equipmentId: number,
): Promise<Equipment> => {
  try {
    const response = await api.get<EquipmentResponse>(
      `/equipment/${equipmentId}`,
    );
    return mapEquipmentFromBackend(response.data.data);
  } catch (error: any) {
    console.error(
      `❌ Error en getEquipmentByIdRequest(${equipmentId}):`,
      error,
    );
    throw new Error(
      error.response?.data?.message || "Error al obtener el equipo",
    );
  }
};

/**
 * Obtener órdenes de un equipo específico
 */
export const getEquipmentWorkOrdersRequest = async (
  equipmentId: number,
): Promise<WorkOrderInfo[]> => {
  try {
    const response = await api.get(`/equipment/${equipmentId}/work-orders`);
    const data = response.data.data || [];

    return data.map((wo: any) => ({
      workOrderId: wo.workOrderId || wo.ordenId,
      description: wo.description,
      createdAt: wo.createdAt || wo.created_at,
      workOrderDetails: wo.workOrder
        ? {
            estado: wo.workOrder.estado,
            tipoServicio: wo.workOrder.tipoServicio,
            fechaSolicitud: wo.workOrder.fechaSolicitud,
            servicio: wo.workOrder.service
              ? {
                  nombre_servicio: wo.workOrder.service.nombre_servicio,
                }
              : null,
            cliente: wo.workOrder.cliente,
            tecnico: wo.workOrder.tecnico,
          }
        : undefined,
    }));
  } catch (error: any) {
    console.error(
      `❌ Error en getEquipmentWorkOrdersRequest(${equipmentId}):`,
      error,
    );
    throw new Error(
      error.response?.data?.message || "Error al obtener órdenes del equipo",
    );
  }
};

/**
 * Asociar múltiples órdenes a un equipo
 */
export const associateOrdersToEquipmentRequest = async (
  equipmentId: number,
  orderIds: number[],
  description?: string,
): Promise<void> => {
  try {
    await api.post(`/equipment/${equipmentId}/work-orders/batch`, {
      orderIds,
      description: description || "Asociado desde creación de equipo",
    });
  } catch (error: any) {
    console.error(`❌ Error en associateOrdersToEquipmentRequest:`, error);
    throw new Error(
      error.response?.data?.message || "Error al asociar órdenes al equipo",
    );
  }
};

/**
 * Obtener órdenes disponibles para asociar
 */
export const getAvailableOrdersForClientRequest = async (
  clientId: number,
  category?: string,
  excludeCompleted: boolean = true,
): Promise<any[]> => {
  try {
    const params = new URLSearchParams();
    params.append("clientId", clientId.toString());
    if (category) params.append("category", category);
    if (excludeCompleted) params.append("excludeCompleted", "true");

    const response = await api.get(
      `/work-orders/available-for-equipment?${params.toString()}`,
    );
    return response.data.data || [];
  } catch (error: any) {
    console.error("❌ Error en getAvailableOrdersForClientRequest:", error);
    throw new Error(
      error.response?.data?.message || "Error al obtener órdenes disponibles",
    );
  }
};

/**
 * Crear equipo
 */
export const createEquipmentRequest = async (
  data: CreateEquipmentData,
): Promise<Equipment> => {
  try {
    const payload = prepareEquipmentForBackend(data);
    const response = await api.post<EquipmentResponse>("/equipment", payload);
    return mapEquipmentFromBackend(response.data.data);
  } catch (error: any) {
    console.error("❌ Error en createEquipmentRequest:", error);
    throw new Error(error.response?.data?.message || "Error al crear equipo");
  }
};

/**
 * Actualizar equipo
 */
export const updateEquipmentRequest = async (
  equipmentId: number,
  data: UpdateEquipmentPayload,
): Promise<Equipment> => {
  try {
    const payload = prepareEquipmentForBackend(data);
    const response = await api.patch<EquipmentResponse>(
      `/equipment/${equipmentId}`,
      payload,
    );
    return mapEquipmentFromBackend(response.data.data);
  } catch (error: any) {
    console.error(`❌ Error en updateEquipmentRequest(${equipmentId}):`, error);
    throw new Error(
      error.response?.data?.message || "Error al actualizar equipo",
    );
  }
};

/**
 * Eliminar equipo
 */
export const deleteEquipmentRequest = async (
  equipmentId: number,
): Promise<void> => {
  try {
    await api.delete(`/equipment/${equipmentId}`);
  } catch (error: any) {
    console.error(`❌ Error en deleteEquipmentRequest(${equipmentId}):`, error);
    throw new Error(
      error.response?.data?.message || "Error al eliminar equipo",
    );
  }
};

/**
 * Desasociar orden de equipo
 */
export const removeOrderFromEquipmentRequest = async (
  equipmentId: number,
  orderId: number,
): Promise<void> => {
  try {
    await api.delete(`/equipment/${equipmentId}/work-orders/${orderId}`);
  } catch (error: any) {
    console.error(`❌ Error en removeOrderFromEquipmentRequest:`, error);
    throw new Error(
      error.response?.data?.message || "Error al desasociar orden",
    );
  }
};

/**
 * Agregar foto al equipo
 */
export const addEquipmentPhotoRequest = async (
  equipmentId: number,
  file: File,
): Promise<EquipmentPhoto> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/images/equipment/${equipmentId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return mapPhoto(response.data);
  } catch (error: any) {
    console.error(`❌ Error en addEquipmentPhotoRequest:`, error);
    throw new Error(error.response?.data?.message || "Error al agregar foto");
  }
};

/**
 * Eliminar foto del equipo
 */
export const deleteEquipmentPhotoRequest = async (
  photoId: number,
): Promise<void> => {
  try {
    await api.delete(`/images/${photoId}`);
  } catch (error: any) {
    console.error(
      `❌ Error en deleteEquipmentPhotoRequest(${photoId}):`,
      error,
    );
    throw new Error(error.response?.data?.message || "Error al eliminar foto");
  }
};

/**
 * Exportar plan de mantenimiento a Excel
 */
export const exportMaintenancePlanExcelRequest = async (
  clientId: number,
  year?: number,
): Promise<void> => {
  try {
    const targetYear = year ?? new Date().getFullYear();

    const response = await api.get("/equipment/maintenance-plan/export", {
      params: { clientId, year: targetYear },
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `plan_mantenimiento_cliente_${clientId}_${targetYear}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error("❌ Error en exportMaintenancePlanExcelRequest:", error);
    throw new Error(
      error.response?.data?.message ||
        "Error al exportar plan de mantenimiento",
    );
  }
};

/**
 * Obtener documentos del equipo
 */
export const getEquipmentDocumentsRequest = async (
  equipmentId: number,
): Promise<EquipmentDocument[]> => {
  try {
    const res = await api.get(`/equipment/${equipmentId}/documents`);
    return res.data?.data as EquipmentDocument[];
  } catch (error: any) {
    console.error(
      `❌ Error en getEquipmentDocumentsRequest(${equipmentId}):`,
      error,
    );
    throw new Error(
      error.response?.data?.message || "Error al obtener documentos",
    );
  }
};

/**
 * Agregar documento al equipo
 */
export const addEquipmentDocumentRequest = async (
  equipmentId: number,
  file: File,
): Promise<EquipmentDocument> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post(
      `/equipment/${equipmentId}/documents`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    return res.data?.data as EquipmentDocument;
  } catch (error: any) {
    console.error(`❌ Error en addEquipmentDocumentRequest:`, error);
    throw new Error(
      error.response?.data?.message || "Error al agregar documento",
    );
  }
};

/**
 * Eliminar documento del equipo
 */
export const deleteEquipmentDocumentRequest = async (
  documentId: number,
): Promise<void> => {
  try {
    await api.delete(`/equipment-documents/${documentId}`);
  } catch (error: any) {
    console.error(
      `❌ Error en deleteEquipmentDocumentRequest(${documentId}):`,
      error,
    );
    throw new Error(
      error.response?.data?.message || "Error al eliminar documento",
    );
  }
};

/**
 * Avanzar plan de mantenimiento
 */
export const advanceMaintenancePlanRequest = async (
  equipmentId: number,
): Promise<Equipment> => {
  try {
    const response = await api.patch<EquipmentResponse>(
      `/equipment/${equipmentId}/maintenance-plan/advance`,
    );
    return mapEquipmentFromBackend(response.data.data);
  } catch (error: any) {
    console.error(
      `❌ Error en advanceMaintenancePlanRequest(${equipmentId}):`,
      error,
    );
    throw new Error(
      error.response?.data?.message || "Error al avanzar plan de mantenimiento",
    );
  }
};

/**
 * Exportar inventario de equipos a Excel
 */
export const exportEquipmentInventoryExcelRequest = async (
  clientId?: number,
): Promise<void> => {
  try {
    const response = await api.get("/equipment/export/inventory-equipment", {
      params: clientId ? { clientId } : {},
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "INVENTARIO-EQUIPOS.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error("❌ Error en exportEquipmentInventoryExcelRequest:", error);
    throw new Error(
      error.response?.data?.message ||
        "Error al exportar inventario de equipos",
    );
  }
};

/**
 * Descargar PDF con historial del equipo
 */
export const downloadEquipmentHistoryPdfRequest = async (
  equipmentId: number,
): Promise<void> => {
  try {
    const response = await api.get(`/equipment/${equipmentId}/history-pdf`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historial-equipo-${equipmentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error(
      `❌ Error en downloadEquipmentHistoryPdfRequest(${equipmentId}):`,
      error,
    );
    throw new Error(
      error.response?.data?.message || "Error al descargar PDF del historial",
    );
  }
};

export const getClientEquipmentRequest = async () => {
  try {
    const response = await api.get("/equipment/client");
    return response.data.data || [];
  } catch (error: any) {
    console.error("Error obteniendo equipos del cliente:", error);
    throw new Error(error.response?.data?.error || "Error al obtener equipos");
  }
};
