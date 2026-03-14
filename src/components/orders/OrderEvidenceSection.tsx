import { useEffect, useMemo, useRef, useState } from "react";
import {
  getWorkOrderImagesRequest,
  uploadWorkOrderImagesRequest,
  deleteWorkOrderImageRequest,
} from "../../api/orders";
import styles from "../../styles/components/orders/OrderEvidenceSection.module.css";
import type {
  WorkOrderImage,
  WorkOrderEvidencePhase,
  AssociatedEquipment,
} from "../../interfaces/OrderInterfaces";
import { useModal } from "../../context/ModalContext";
import { AxiosError } from "axios"; // Asegúrate de tener axios instalado

interface Props {
  orderId: number;
  canEdit: boolean;
  orderStatus: string;
  activeEquipmentId: number | null;
  equipments?: AssociatedEquipment[]; // Asegúrate de que esto se pasa desde el padre
}

export default function OrderEvidenceSection({
  orderId,
  canEdit,
  orderStatus,
  activeEquipmentId,
  equipments = [], // Valor por defecto para evitar undefined
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showModal } = useModal();
  const [images, setImages] = useState<WorkOrderImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phasePickerOpen, setPhasePickerOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] =
    useState<WorkOrderEvidencePhase>("DURING");
  const [, setViewingImage] = useState<WorkOrderImage | null>(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const isLocked = orderStatus === "Completado" || orderStatus === "Cancelada";

  const loadImages = async () => {
    try {
      setLoading(true);
      const imgs = await getWorkOrderImagesRequest(orderId);
      setImages(imgs);
    } catch (error) {
      setError("Error cargando fotos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [orderId]);

  // Función para obtener el código del equipo por su ID
  const getEquipmentCode = (equipmentId: number | null): string | null => {
    if (!equipmentId || !equipments.length) return null;
    const equipment = equipments.find((e) => e.equipmentId === equipmentId);
    return equipment?.code || null;
  };

  // Filtrar imágenes basado en el equipo activo
  const filteredImages = useMemo(() => {
    // Si no hay equipo seleccionado, mostrar todas las imágenes
    if (activeEquipmentId == null) return images;

    // Opción 1: Si las imágenes tienen equipmentId (cuando el backend se actualice)
    const imagesWithEquipmentId = images.filter(
      (img) => img.equipmentId === activeEquipmentId,
    );

    // Si encontramos imágenes con equipmentId, las retornamos
    if (imagesWithEquipmentId.length > 0) {
      return imagesWithEquipmentId;
    }

    // Opción 2: Si no, intentamos filtrar por el código en la observación
    const equipmentCode = getEquipmentCode(activeEquipmentId);
    if (equipmentCode) {
      return images.filter((img) =>
        img.observation?.includes(`[${equipmentCode}]`),
      );
    }

    // Si no hay código, retornamos todas (o un array vacío según prefieras)
    return images; // Cambia a [] si prefieres no mostrar nada
  }, [images, activeEquipmentId, equipments]);

  const grouped = {
    BEFORE: filteredImages.filter((i) => i.evidencePhase === "BEFORE"),
    DURING: filteredImages.filter(
      (i) => i.evidencePhase === "DURING" || !i.evidencePhase,
    ),
    AFTER: filteredImages.filter((i) => i.evidencePhase === "AFTER"),
  };

  const confirmPhaseAndUpload = (p: WorkOrderEvidencePhase) => {
    setSelectedPhase(p);
    setPhasePickerOpen(false);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !activeEquipmentId) return;

    try {
      setUploading(true);

      // Opcional: Añadir el código del equipo a la observación
      const equipmentCode = getEquipmentCode(activeEquipmentId);
      const observation = equipmentCode
        ? `[${equipmentCode}] Evidencia`
        : undefined;

      await uploadWorkOrderImagesRequest(orderId, Array.from(e.target.files), {
        phase: selectedPhase,
        equipmentId: activeEquipmentId,
        observation, // Si tu API soporta enviar observación
      });

      await loadImages();
      showModal({
        type: "success",
        title: "Fotos subidas",
        message: "Las imágenes se han subido correctamente.",
        buttons: [{ text: "Aceptar", variant: "primary" }],
      });
    } catch (err: unknown) {
      setError("Error al subir");

      let errorMessage = "Error al subir las imágenes";
      if (err instanceof AxiosError) {
        errorMessage = err.response?.data?.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      showModal({
        type: "error",
        title: "Error",
        message: errorMessage,
        buttons: [{ text: "Cerrar", variant: "primary" }],
      });
    } finally {
      setUploading(false);
      // Limpiar el input file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    showModal({
      type: "warning",
      title: "Confirmar eliminación",
      message: "¿Está seguro de eliminar esta imagen?",
      buttons: [
        {
          text: "Cancelar",
          variant: "secondary",
        },
        {
          text: "Sí, eliminar",
          variant: "danger",
          onClick: async () => {
            try {
              await deleteWorkOrderImageRequest(imageId);
              await loadImages();
              showModal({
                type: "success",
                title: "Imagen eliminada",
                message: "La imagen se ha eliminado correctamente.",
                buttons: [{ text: "Aceptar", variant: "primary" }],
              });
            } catch (err: unknown) {
              let errorMessage = "Error al eliminar la imagen";
              if (err instanceof AxiosError) {
                errorMessage = err.response?.data?.message || errorMessage;
              } else if (err instanceof Error) {
                errorMessage = err.message;
              }

              showModal({
                type: "error",
                title: "Error",
                message: errorMessage,
                buttons: [{ text: "Cerrar", variant: "primary" }],
              });
            }
          },
        },
      ],
    });
  };

  const renderGrid = (imgs: WorkOrderImage[], label: string) => {
    if (imgs.length === 0) return null;

    return (
      <div className={styles.evidenceGroup}>
        <h4 className={styles.evidenceGroupTitle}>📸 {label}</h4>
        <div className={styles.evidenceGrid}>
          {imgs.map((img) => (
            <div
              key={img.id}
              className={styles.evidenceCard}
              onClick={() => setViewingImage(img)}
            >
              <img
                src={
                  img.url.startsWith("http") ? img.url : `${apiUrl}${img.url}`
                }
                className={styles.evidenceThumb}
                alt="Evidencia"
                onError={(e) => {
                  console.error("Error loading image:", img.url);
                  e.currentTarget.src = "/placeholder-image.png"; // Añade una imagen placeholder
                }}
              />
              {canEdit && !isLocked && (
                <button
                  className={styles.evidenceDeleteButton}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleDeleteImage(img.id);
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleUploadClick = () => {
    if (!activeEquipmentId) {
      showModal({
        type: "info",
        title: "Seleccionar equipo",
        message:
          "Por favor, seleccione un equipo de la lista para asociar las fotos.",
        buttons: [{ text: "Aceptar", variant: "primary" }],
      });
      return;
    }
    setPhasePickerOpen(true);
  };

  // Mensaje contextual según el estado
  const getEmptyMessage = () => {
    if (!activeEquipmentId) {
      return "Seleccione un equipo para ver sus evidencias.";
    }
    if (!filteredImages.length) {
      return "No hay fotos para este equipo.";
    }
    return null;
  };

  const emptyMessage = getEmptyMessage();

  return (
    <div className={styles.section}>
      <h3>Evidencias Fotográficas</h3>
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className={styles.evidenceContainer}>
          {renderGrid(grouped.BEFORE, "Antes")}
          {renderGrid(grouped.DURING, "Durante")}
          {renderGrid(grouped.AFTER, "Después")}

          {emptyMessage && <p className={styles.helperText}>{emptyMessage}</p>}
        </div>
      )}

      {canEdit && !isLocked && (
        <div className={styles.subSection}>
          <div
            className={styles.fileUploadLabel}
            onClick={handleUploadClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleUploadClick();
              }
            }}
          >
            <span className={styles.uploadIcon}>📷</span>
            <span className={styles.uploadText}>
              {uploading ? "Subiendo..." : "Toca aquí para subir fotos"}
            </span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className={styles.hiddenFileInput}
        accept="image/*"
        multiple
        onChange={handleFiles}
      />

      {phasePickerOpen && (
        <div
          className={styles.phasePickerOverlay}
          onClick={() => setPhasePickerOpen(false)}
        >
          <div
            className={styles.phasePickerContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h4>Seleccione Fase:</h4>
            <div className={styles.phasePickerButtons}>
              <button onClick={() => confirmPhaseAndUpload("BEFORE")}>
                Antes
              </button>
              <button onClick={() => confirmPhaseAndUpload("DURING")}>
                Durante
              </button>
              <button onClick={() => confirmPhaseAndUpload("AFTER")}>
                Después
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
