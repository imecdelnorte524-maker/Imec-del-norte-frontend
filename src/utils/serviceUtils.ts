import type { ServiceFromAPI } from "../interfaces/ServicesInterface";
import type { Service } from "../interfaces/ServicesInterface";

// Función para mapear servicio de API a interface del componente
export const mapServiceFromAPI = (service: ServiceFromAPI): Service => ({
  orden_id: service.orden_id,
  servicio: {
    nombre_servicio: service.servicio.nombre_servicio,
  },
  cliente: {
    nombre: service.cliente.nombre,
    apellido: service.cliente.apellido || undefined,
    email: service.cliente.email,
    telefono: service.cliente.telefono || undefined,
  },
  tecnico: service.tecnico
    ? {
        nombre: service.tecnico.nombre,
        apellido: service.tecnico.apellido || undefined,
      }
    : undefined,
  fecha_solicitud: new Date(service.fecha_solicitud),
  fecha_inicio: service.fecha_inicio
    ? new Date(service.fecha_inicio)
    : undefined,
  fecha_finalizacion: service.fecha_finalizacion
    ? new Date(service.fecha_finalizacion)
    : undefined,
  estado: service.estado,
  prioridad: service.prioridad || "Media",
  equipo_asignado: service.equipo_asignado || "Por asignar",
  comentarios: service.comentarios || undefined,
});

// Función para ordenar servicios
export const sortServices = (services: Service[]): Service[] => {
  const orderPriority = {
    "En Proceso": 1,
    Pendiente: 2,
    Cancelado: 3,
    Cancelada: 3,
    Rechazada: 3,
    Completado: 4,
  };

  return services.sort((a, b) => {
    const priorityA = orderPriority[a.estado] || 5;
    const priorityB = orderPriority[b.estado] || 5;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return (
      new Date(b.fecha_solicitud).getTime() -
      new Date(a.fecha_solicitud).getTime()
    );
  });
};

// Hook para filtrar servicios
export const useServiceFilters = (
  services: Service[],
  searchTerm: string,
  selectedStatus: string,
  startDate: string,
  endDate: string,
) => {
  const filteredServices = services.filter((service) => {
    const clienteNombre =
      `${service.cliente.nombre} ${service.cliente.apellido || ""}`.toLowerCase();
    const tecnicoNombre = service.tecnico
      ? `${service.tecnico.nombre} ${service.tecnico.apellido || ""}`.toLowerCase()
      : "";

    const matchesSearch =
      clienteNombre.includes(searchTerm.toLowerCase()) ||
      service.servicio.nombre_servicio
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      tecnicoNombre.includes(searchTerm.toLowerCase()) ||
      service.orden_id.toString().includes(searchTerm);

    const matchesStatus =
      selectedStatus === "" || service.estado === selectedStatus;

    const serviceDate = service.fecha_inicio || service.fecha_solicitud;
    const matchesStartDate = !startDate || serviceDate >= new Date(startDate);
    const matchesEndDate = !endDate || serviceDate <= new Date(endDate);

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  return { filteredServices };
};
