// src/components/ServicesCard.tsx

import React from "react";
import type { Service } from "../interfaces/ServicesInterface";
import {
  getStatusClass,
  getPriorityIcon,
  formatDateTime,
} from "../utils/statusUtils";
import styles from "../styles/components/ServicesCard.module.css";

interface ServicesCardProps {
  service: Service;
  onClick?: (service: Service) => void;
}

const ServicesCard: React.FC<ServicesCardProps> = ({ service, onClick }) => {
  const getDisplayDate = () => {
    return service.fecha_inicio || service.fecha_solicitud;
  };

  const getTecnicoDisplayName = () => {
    if (!service.tecnico) return "Sin asignar";
    return `${service.tecnico.nombre} ${service.tecnico.apellido || ""}`.trim();
  };

  const getClienteDisplayName = () => {
    return `${service.cliente.nombre} ${service.cliente.apellido || ""}`.trim();
  };

  return (
    <div className={styles.card} onClick={() => onClick && onClick(service)}>
      <div className={styles.cardHeader}>
        <div className={styles.serviceTitle}>
          {service.servicio.nombre_servicio}
        </div>
        <div className={styles.priority}>
          {getPriorityIcon(service.prioridad)}
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.cardContent}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Cliente</span>
          <span className={styles.value}>{getClienteDisplayName()}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Técnico</span>
          <span className={styles.value}>{getTecnicoDisplayName()}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Equipo</span>
          <span className={styles.value}>
            {service.equipo_asignado || "Por asignar"}
          </span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Fecha Programada</span>
          <span className={styles.value}>
            {formatDateTime(getDisplayDate())}
          </span>
        </div>

        {service.comentarios && (
          <div className={styles.infoRow}>
            <span className={styles.label}>Comentarios</span>
            <span className={styles.valueComments}>{service.comentarios}</span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <div
          className={`${styles.status} ${
            styles[getStatusClass("estado", service.estado)]
          }`}
        >
          {service.estado}
        </div>
        <div className={styles.serviceNumber}>
          #{service.orden_id.toString().padStart(4, "0")}
        </div>
      </div>
    </div>
  );
};

export default ServicesCard;
