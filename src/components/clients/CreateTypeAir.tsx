// src/components/clients/CreateTypeAir.tsx
import React, { useState } from "react";
import Styles from "../../styles/pages/ClientsPage.module.css";
import api from "../../api/axios";
import type { AirConditionerTypeOption } from "../../interfaces/EquipmentInterfaces";

interface CreateTypeAirProps {
  // Si no pasas isOpen, el modal se mostrará siempre
  isOpen?: boolean;
  // Si no pasas onClose, el botón cerrar solo resetea el formulario
  onClose?: () => void;
  // Notifica al padre el tipo creado (opcional)
  onCreated?: (type: AirConditionerTypeOption) => void;
}

export default function CreateTypeAir({
  isOpen = true,
  onClose,
  onCreated,
}: CreateTypeAirProps) {
  const [newAcTypeForm, setNewAcTypeForm] = useState({
    name: "",
    hasEvaporator: true,
    hasCondenser: true,
  });
  const [creatingAcType, setCreatingAcType] = useState(false);
  const [acTypeError, setAcTypeError] = useState<string | null>(null);

  const handleNewAcTypeFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setNewAcTypeForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setNewAcTypeForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreateNewAcType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcTypeForm.name.trim()) {
      setAcTypeError("El nombre del tipo es obligatorio.");
      return;
    }

    setCreatingAcType(true);
    setAcTypeError(null);

    try {
      const response = await api.post("/air-conditioner-types", {
        name: newAcTypeForm.name.trim(),
        hasEvaporator: newAcTypeForm.hasEvaporator,
        hasCondenser: newAcTypeForm.hasCondenser,
      });

      const newType = response.data?.data as AirConditionerTypeOption;

      // Notificar al padre si lo desea
      if (onCreated) {
        onCreated(newType);
      }

      // Resetear formulario
      setNewAcTypeForm({
        name: "",
        hasEvaporator: true,
        hasCondenser: true,
      });

      // Cerrar modal si hay onClose
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      console.error("Error creando tipo de aire acondicionado:", err);

      let errorMessage = "Error al crear el tipo de aire acondicionado.";

      if (err.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          errorMessage = err.response.data.message.join(", ");
        } else {
          errorMessage = err.response.data.message;
        }
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      setAcTypeError(errorMessage);
    } finally {
      setCreatingAcType(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Si no hay onClose, solo reseteamos errores y formulario
      setAcTypeError(null);
      setNewAcTypeForm({
        name: "",
        hasEvaporator: true,
        hasCondenser: true,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className={Styles.modalOverlay}>
      <div className={Styles.modal}>
        <div className={Styles.modalContent}>
          <div className={Styles.modalHeader}>
            <h3>Crear Nuevo Tipo de Aire Acondicionado</h3>
            <button
              type="button"
              className={Styles.modalCloseButton}
              onClick={handleClose}
              disabled={creatingAcType}
            >
              ×
            </button>
          </div>

          {acTypeError && <div className={Styles.error}>{acTypeError}</div>}

          <form onSubmit={handleCreateNewAcType}>
            <div className={Styles.formRow}>
              <label>Nombre del Tipo *</label>
              <input
                name="name"
                value={newAcTypeForm.name}
                onChange={handleNewAcTypeFormChange}
                required
                disabled={creatingAcType}
                placeholder="Ej: Split, Ventana, etc."
              />
            </div>

            <div className={Styles.formRow}>
              <div className={Styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="hasEvaporator"
                    checked={newAcTypeForm.hasEvaporator}
                    onChange={handleNewAcTypeFormChange}
                    disabled={creatingAcType}
                  />
                  Tiene Evaporador
                </label>
              </div>
              <div className={Styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="hasCondenser"
                    checked={newAcTypeForm.hasCondenser}
                    onChange={handleNewAcTypeFormChange}
                    disabled={creatingAcType}
                  />
                  Tiene Condensador
                </label>
              </div>
            </div>

            <div className={Styles.formActions}>
              <button
                type="button"
                onClick={handleClose}
                disabled={creatingAcType}
              >
                Cancelar
              </button>
              <button type="submit" disabled={creatingAcType}>
                {creatingAcType ? "Creando..." : "Crear Tipo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}