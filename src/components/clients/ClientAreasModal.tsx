// src/components/clients/ClientAreasModal.tsx
import { useEffect, useState } from "react";
import type { Client } from "../../interfaces/ClientInterfaces";
import type { Equipment } from "../../interfaces/EquipmentInterfaces";
import { getEquipmentByClientRequest } from "../../api/equipment";
import styles from "../../styles/components/clients/ClientAreasModal.module.css";

interface ClientAreasModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
}

export default function ClientAreasModal({
  isOpen,
  client,
  onClose,
}: ClientAreasModalProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !client) return;

    const loadEquipment = async () => {
      try {
        setLoadingEquipments(true);
        setEquipmentError(null);
        const equipments = await getEquipmentByClientRequest(client.idCliente);
        setEquipmentList(equipments);
      } catch (err: any) {
        console.error("Error cargando equipos del cliente:", err);
        setEquipmentError(
          err.response?.data?.error ||
            err.message ||
            "Error al cargar los equipos del cliente."
        );
      } finally {
        setLoadingEquipments(false);
      }
    };

    loadEquipment();
  }, [isOpen, client?.idCliente]);

  if (!isOpen || !client) return null;

  const areas = client.areas || [];
  const totalSubAreas =
    areas.reduce(
      (total, area) => total + (area.subAreas?.length || 0),
      0
    ) || 0;
  const totalEquipments = equipmentList.length;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* Header */}
        <header className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2 className={styles.modalTitle}>Áreas de {client.nombre}</h2>
            <p className={styles.modalSubtitle}>
              {areas.length} área{areas.length === 1 ? "" : "s"} ·{" "}
              {totalSubAreas} subárea{totalSubAreas === 1 ? "" : "s"} ·{" "}
              {totalEquipments} equipo
              {totalEquipments === 1 ? "" : "s"}
            </p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        {/* Body */}
        <div className={styles.modalBody}>
          {equipmentError && (
            <div className={styles.errorBox}>{equipmentError}</div>
          )}

          {loadingEquipments && (
            <p className={styles.loadingText}>Cargando equipos...</p>
          )}

          {areas.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📁</div>
              <p>Este cliente aún no tiene áreas registradas.</p>
              <small>
                Puedes añadirlas desde la edición del cliente en el módulo de
                clientes.
              </small>
            </div>
          ) : (
            <div className={styles.areaList}>
              {areas.map((area) => {
                const subAreas = area.subAreas || [];

                // Equipos asociados a esta área
                const areaEquipments = equipmentList.filter(
                  (eq) => eq.areaId === area.idArea
                );

                const areaEquipmentsWithoutSub = areaEquipments.filter(
                  (eq) => !eq.subAreaId
                );

                const areaEquipmentsCount = areaEquipments.length;

                return (
                  <div key={area.idArea} className={styles.areaItem}>
                    <div className={styles.areaHeader}>
                      <div className={styles.areaInfo}>
                        <span className={styles.areaBullet}>•</span>
                        <span className={styles.areaName}>
                          {area.nombreArea}
                        </span>
                      </div>
                      <div className={styles.areaBadges}>
                        <span className={styles.subareaCount}>
                          {subAreas.length} subárea
                          {subAreas.length === 1 ? "" : "s"}
                        </span>
                        <span className={styles.equipmentCount}>
                          {areaEquipmentsCount} equipo
                          {areaEquipmentsCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    {/* Equipos asignados directamente al área (sin subárea) */}
                    {areaEquipmentsWithoutSub.length > 0 && (
                      <div className={styles.equipmentList}>
                        <div className={styles.equipmentListTitle}>
                          Equipos asignados directamente a esta área
                        </div>
                        {areaEquipmentsWithoutSub.map((eq) => (
                          <div
                            key={eq.equipmentId}
                            className={styles.equipmentItem}
                          >
                            <span className={styles.equipmentName}>
                              {eq.name}
                            </span>
                            {eq.code && (
                              <span className={styles.equipmentCode}>
                                {eq.code}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Subáreas y sus equipos */}
                    {subAreas.length > 0 && (
                      <ul className={styles.subareasList}>
                        {subAreas.map((sub) => {
                          const subEquipments = equipmentList.filter(
                            (eq) => eq.subAreaId === sub.idSubArea
                          );
                          const subEquipCount = subEquipments.length;

                          return (
                            <li
                              key={sub.idSubArea}
                              className={styles.subareaItem}
                            >
                              <div className={styles.subareaHeader}>
                                <span className={styles.subareaName}>
                                  {sub.nombreSubArea}
                                </span>
                                <span className={styles.subareaEquipCount}>
                                  {subEquipCount} equipo
                                  {subEquipCount === 1 ? "" : "s"}
                                </span>
                              </div>

                              {subEquipments.length > 0 && (
                                <div className={styles.subareaEquipmentList}>
                                  {subEquipments.map((eq) => (
                                    <div
                                      key={eq.equipmentId}
                                      className={styles.equipmentItem}
                                    >
                                      <span
                                        className={styles.equipmentName}
                                      >
                                        {eq.name}
                                      </span>
                                      {eq.code && (
                                        <span
                                          className={styles.equipmentCode}
                                        >
                                          {eq.code}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}

              {areas.length > 0 && totalEquipments === 0 && !loadingEquipments && (
                <div className={styles.noEquipmentsNote}>
                  <span>
                    No hay equipos registrados para este cliente en estas
                    áreas/subáreas.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className={styles.modalFooter}>
          <button className={styles.closeFooterButton} onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}