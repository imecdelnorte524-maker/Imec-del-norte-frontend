// src/components/inventory/EditInventoryModal.tsx
import { useState, useEffect } from "react";
import { inventory } from "../../api/inventory";
import { warehouses, type Warehouse } from "../../api/warehouses";
import { toolsApi } from "../../api/tools";
import { suppliesApi } from "../../api/supplies";
import { imagesApi } from "../../api/images";

import UnitMeasureAutocomplete from "../common/UnitMeasureAutocomplete";
import MultiImageUpload from "../common/MultiImageUpload";
import styles from "../../styles/components/inventory/EditInventoryModal.module.css";
import { playErrorSound } from "../../utils/sounds";
import type { InventoryItem } from "../../interfaces/InventoryInterfaces";
import {
  ToolStatus,
  ToolType,
  type UpdateToolPayload,
} from "../../interfaces/ToolsInterfaces";
import {
  SupplyCategory,
  SupplyStatus,
  type UpdateSupplyPayload,
} from "../../interfaces/SuppliesInterfaces";

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem | null;
}

// Datos de inventario que irán al backend
interface InventoryBackendData {
  cantidadActual?: number;
  bodegaId?: number | null;
  ubicacion?: string;
}

export default function EditInventoryModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: EditInventoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [, setImagesToDelete] = useState<string[]>([]);

  // Estados para herramientas
  const [toolData, setToolData] = useState<{
    nombre: string;
    marca: string;
    serial: string;
    modelo: string;
    caracteristicasTecnicas: string;
    observacion: string;
    tipo: ToolType;
    estado: ToolStatus;
    valorUnitario: number;
    bodegaId: number | null;
    ubicacion: string;
  }>({
    nombre: "",
    marca: "",
    serial: "",
    modelo: "",
    caracteristicasTecnicas: "",
    observacion: "",
    tipo: ToolType.HERRAMIENTA,
    estado: ToolStatus.DISPONIBLE,
    valorUnitario: 0,
    bodegaId: null,
    ubicacion: "",
  });

  // Estados para insumos
  const [supplyData, setSupplyData] = useState<{
    nombre: string;
    categoria: SupplyCategory;
    unidadMedida: string;
    estado: SupplyStatus;
    stockMin: number;
    valorUnitario: number;
    cantidadActual: number;
    bodegaId: number | null;
    ubicacion: string;
  }>({
    nombre: "",
    categoria: SupplyCategory.GENERAL,
    unidadMedida: "",
    estado: SupplyStatus.DISPONIBLE,
    stockMin: 0,
    valorUnitario: 0,
    cantidadActual: 0,
    bodegaId: null,
    ubicacion: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
      if (item) {
        loadExistingImages();
        initializeFormData();
      }
    } else {
      setError(null);
      setValidationErrors({});
      setNewImages([]);
      setImagesToDelete([]);
    }
  }, [isOpen, item]);

  const initializeFormData = () => {
    if (!item) return;

    if (item.tipo === "herramienta" && item.tool) {
      setToolData({
        nombre: item.tool.nombre || "",
        marca: item.tool.marca || "",
        serial: item.tool.serial || "",
        modelo: item.tool.modelo || "",
        caracteristicasTecnicas:
          (item.tool as any).caracteristicasTecnicas || "",
        observacion: (item.tool as any).observacion || "",
        tipo: (item.tool as any).tipo || ToolType.HERRAMIENTA,
        estado: (item.tool.estado as any) || ToolStatus.DISPONIBLE,
        valorUnitario: item.tool.valorUnitario || 0,
        bodegaId: item.bodega?.bodegaId ?? null,
        ubicacion: item.ubicacion || "",
      });
    } else if (item.tipo === "insumo" && item.supply) {
      setSupplyData({
        nombre: item.supply.nombre || "",
        categoria: (item.supply.categoria as any) || SupplyCategory.GENERAL,
        unidadMedida: item.supply.unidadMedida || "",
        estado: (item.supply.estado as any) || SupplyStatus.DISPONIBLE,
        stockMin: item.supply.stockMin || 0,
        valorUnitario: item.supply.valorUnitario || 0,
        cantidadActual: item.cantidadActual || 0,
        bodegaId: item.bodega?.bodegaId ?? null,
        ubicacion: item.ubicacion || "",
      });
    }
  };

  const loadWarehouses = async () => {
    try {
      setLoadingWarehouses(true);
      const data = await warehouses.getAll();
      setWarehousesList(data);
    } catch (err) {
      console.error("Error cargando bodegas:", err);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const loadExistingImages = async () => {
    if (!item) return;

    try {
      let images: string[] = [];
      if (item.tool?.herramientaId) {
        const toolImages = await imagesApi.getToolImages(
          item.tool.herramientaId,
        );
        images = toolImages.map((img) => img.url);
      } else if (item.supply?.insumoId) {
        const supplyImages = await imagesApi.getSupplyImages(
          item.supply.insumoId,
        );
        images = supplyImages.map((img) => img.url);
      }
      setExistingImages(images);
    } catch (err) {
      console.error("Error cargando imágenes:", err);
    }
  };

  const validateTool = (): boolean => {
    const errors: Record<string, string> = {};

    if (!toolData.nombre?.trim()) {
      errors.nombre = "El nombre es requerido";
    }

    if (!toolData.serial?.trim()) {
      errors.serial = "El serial es requerido";
    }

    if (!toolData.valorUnitario || toolData.valorUnitario <= 0) {
      errors.valorUnitario = "El valor unitario debe ser mayor a 0";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSupply = (): boolean => {
    const errors: Record<string, string> = {};

    if (!supplyData.nombre?.trim()) {
      errors.nombre = "El nombre es requerido";
    }

    if (!supplyData.valorUnitario || supplyData.valorUnitario <= 0) {
      errors.valorUnitario = "El valor unitario debe ser mayor a 0";
    }

    if (!supplyData.unidadMedida?.trim()) {
      errors.unidadMedida = "La unidad de medida es requerida";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (item.tipo === "herramienta" && !validateTool()) {
      playErrorSound();
      return;
    }

    if (item.tipo === "insumo" && !validateSupply()) {
      playErrorSound();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      // 1. INVENTARIO
      const inventoryData: InventoryBackendData = {};

      if (item.tipo === "insumo") {
        if (supplyData.cantidadActual !== item.cantidadActual) {
          inventoryData.cantidadActual = supplyData.cantidadActual;
        }
      }

      const newBodegaId =
        item.tipo === "herramienta" ? toolData.bodegaId : supplyData.bodegaId;
      const currentBodegaId = item.bodega?.bodegaId ?? null;
      if (newBodegaId !== currentBodegaId) {
        inventoryData.bodegaId = newBodegaId;
      }

      const newUbicacion =
        item.tipo === "herramienta" ? toolData.ubicacion : supplyData.ubicacion;
      if (newUbicacion !== item.ubicacion) {
        inventoryData.ubicacion = newUbicacion;
      }

      if (Object.keys(inventoryData).length > 0) {
        await inventory.update(item.inventarioId, inventoryData);
      }

      // 2. HERRAMIENTA
      if (item.tipo === "herramienta" && item.tool) {
        const herramientaId = item.tool.herramientaId;
        const toolUpdateData: UpdateToolPayload = {};

        if (toolData.nombre !== item.tool.nombre) {
          toolUpdateData.nombre = toolData.nombre.trim();
        }
        if (toolData.marca !== (item.tool.marca || "")) {
          toolUpdateData.marca = toolData.marca || undefined;
        }
        if (toolData.serial !== (item.tool.serial || "")) {
          toolUpdateData.serial = toolData.serial.trim();
        }
        if (toolData.modelo !== (item.tool.modelo || "")) {
          toolUpdateData.modelo = toolData.modelo || undefined;
        }
        if (
          toolData.caracteristicasTecnicas !==
          ((item.tool as any).caracteristicasTecnicas || "")
        ) {
          toolUpdateData.caracteristicasTecnicas =
            toolData.caracteristicasTecnicas || undefined;
        }
        if (toolData.observacion !== ((item.tool as any).observacion || "")) {
          toolUpdateData.observacion = toolData.observacion || undefined;
        }
        if (toolData.tipo !== (item.tool as any).tipo) {
          toolUpdateData.tipo = toolData.tipo;
        }
        if (toolData.estado !== item.tool.estado) {
          toolUpdateData.estado = toolData.estado;
        }
        if (toolData.valorUnitario !== item.tool.valorUnitario) {
          toolUpdateData.valorUnitario = toolData.valorUnitario;
        }
        if (
          toolData.caracteristicasTecnicas !== item.tool.caracteristicasTecnicas
        ) {
          toolUpdateData.caracteristicasTecnicas =
            toolData.caracteristicasTecnicas;
        }
        if (toolData.observacion !== item.tool.observacion) {
          toolUpdateData.observacion = toolData.observacion;
        }

        if (Object.keys(toolUpdateData).length > 0) {
          await toolsApi.updateTool(herramientaId, toolUpdateData);
        }
      }

      // 3. INSUMO
      if (item.tipo === "insumo" && item.supply) {
        const insumoId = item.supply.insumoId;
        const supplyUpdateData: UpdateSupplyPayload = {};

        if (supplyData.nombre !== item.supply.nombre) {
          supplyUpdateData.nombre = supplyData.nombre.trim();
        }
        if (supplyData.categoria !== item.supply.categoria) {
          supplyUpdateData.categoria = supplyData.categoria;
        }

        const currentUnidadMedida = item.supply.unidadMedida;
        if (supplyData.unidadMedida !== currentUnidadMedida) {
          supplyUpdateData.unidadMedida = supplyData.unidadMedida;
        }

        if (supplyData.estado !== item.supply.estado) {
          supplyUpdateData.estado = supplyData.estado;
        }
        if (supplyData.stockMin !== item.supply.stockMin) {
          supplyUpdateData.stockMin = supplyData.stockMin;
        }
        if (supplyData.valorUnitario !== item.supply.valorUnitario) {
          supplyUpdateData.valorUnitario = supplyData.valorUnitario;
        }

        if (Object.keys(supplyUpdateData).length > 0) {
          await suppliesApi.updateSupply(insumoId, supplyUpdateData);
        }
      }

      // 4. NUEVAS IMÁGENES
      if (newImages.length > 0) {
        try {
          if (item.tool?.herramientaId) {
            await imagesApi.uploadToolImages(
              item.tool.herramientaId,
              newImages,
            );
          } else if (item.supply?.insumoId) {
            await imagesApi.uploadSupplyImages(item.supply.insumoId, newImages);
          }
        } catch (imgError: any) {
          console.warn("⚠️ Error subiendo imágenes:", imgError?.message);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("❌ Error en actualización:", err);

      let errorMessage = "Error al actualizar el item";

      if (err.response?.data?.message) {
        const messages = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(", ")
          : err.response.data.message;
        errorMessage = `Error: ${messages}`;
      } else if (err.response?.data?.error) {
        errorMessage = `Error: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!item || item.tipo !== "insumo") return;

    try {
      setLoading(true);
      setError(null);

      await inventory.updateStock(item.inventarioId, supplyData.cantidadActual);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("❌ Error actualizando stock:", err);

      let errorMessage = "Error al actualizar stock";
      if (err.response?.data?.message) {
        errorMessage = `Error: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    const imageUrl = existingImages[index];
    setImagesToDelete((prev) => [...prev, imageUrl]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToolChange = <K extends keyof typeof toolData>(
    field: K,
    value: (typeof toolData)[K],
  ) => {
    setToolData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field as string]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleSupplyChange = <K extends keyof typeof supplyData>(
    field: K,
    value: (typeof supplyData)[K],
  ) => {
    setSupplyData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field as string]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  if (!isOpen || !item) return null;

  const isHerramienta = item.tipo === "herramienta";
  const isInsumo = item.tipo === "insumo";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <span className={styles.icon}>{isHerramienta ? "🛠️" : "📦"}</span>
            Editar {isHerramienta ? "Herramienta" : "Insumo"}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            ×
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* ========== FORMULARIO HERRAMIENTAS ========== */}
          {isHerramienta && (
            <>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Información Básica</h3>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span className={styles.required}>*</span>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={toolData.nombre}
                    onChange={(e) => handleToolChange("nombre", e.target.value)}
                    className={`${styles.input} ${validationErrors.nombre ? styles.inputError : ""}`}
                    disabled={loading}
                    placeholder="Nombre de la herramienta"
                  />
                  {validationErrors.nombre && (
                    <span className={styles.fieldError}>
                      {validationErrors.nombre}
                    </span>
                  )}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Marca</label>
                    <input
                      type="text"
                      value={toolData.marca}
                      onChange={(e) =>
                        handleToolChange("marca", e.target.value)
                      }
                      className={styles.input}
                      disabled={loading}
                      placeholder="Marca"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span>
                      Serial
                    </label>
                    <input
                      type="text"
                      value={toolData.serial}
                      onChange={(e) =>
                        handleToolChange("serial", e.target.value)
                      }
                      className={`${styles.input} ${validationErrors.serial ? styles.inputError : ""}`}
                      disabled={loading}
                      placeholder="Número de serie"
                    />
                    {validationErrors.serial && (
                      <span className={styles.fieldError}>
                        {validationErrors.serial}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Modelo</label>
                    <input
                      type="text"
                      value={toolData.modelo}
                      onChange={(e) =>
                        handleToolChange("modelo", e.target.value)
                      }
                      className={styles.input}
                      disabled={loading}
                      placeholder="Modelo"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tipo</label>
                    <select
                      value={toolData.tipo}
                      onChange={(e) =>
                        handleToolChange(
                          "tipo",
                          e.target
                            .value as (typeof ToolType)[keyof typeof ToolType],
                        )
                      }
                      className={styles.select}
                      disabled={loading}
                    >
                      {Object.values(ToolType).map((type) => (
                        <option
                          key={String(type)} // ✅ cast a string
                          value={type as string} // ya existía el cast
                        >
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Características</h3>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Características Técnicas
                  </label>
                  <textarea
                    value={toolData.caracteristicasTecnicas}
                    onChange={(e) =>
                      handleToolChange(
                        "caracteristicasTecnicas",
                        e.target.value,
                      )
                    }
                    className={styles.textarea}
                    disabled={loading}
                    placeholder="Descripción técnica detallada..."
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Observaciones</label>
                  <textarea
                    value={toolData.observacion}
                    onChange={(e) =>
                      handleToolChange("observacion", e.target.value)
                    }
                    className={styles.textarea}
                    disabled={loading}
                    placeholder="Observaciones adicionales..."
                    rows={2}
                  />
                </div>
              </div>

              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Estado y Valor</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Estado</label>
                    <select
                      value={toolData.estado}
                      onChange={(e) =>
                        handleToolChange(
                          "estado",
                          e.target
                            .value as (typeof ToolStatus)[keyof typeof ToolStatus],
                        )
                      }
                      className={styles.select}
                      disabled={loading}
                    >
                      {Object.values(ToolStatus).map((status) => (
                        <option
                          key={String(status)} // ✅
                          value={status as string}
                        >
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span>
                      Valor Unitario (COP)
                    </label>
                    <div className={styles.currencyInput}>
                      <span className={styles.currencySymbol}>$</span>
                      <input
                        type="number"
                        value={toolData.valorUnitario}
                        onChange={(e) =>
                          handleToolChange(
                            "valorUnitario",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        min="0"
                        step="0.01"
                        className={`${styles.input} ${validationErrors.valorUnitario ? styles.inputError : ""}`}
                        disabled={loading}
                        placeholder="0.00"
                      />
                    </div>
                    {validationErrors.valorUnitario && (
                      <span className={styles.fieldError}>
                        {validationErrors.valorUnitario}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Ubicación</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Bodega</label>
                    {loadingWarehouses ? (
                      <div className={styles.loadingSmall}>Cargando...</div>
                    ) : (
                      <select
                        value={toolData.bodegaId || ""}
                        onChange={(e) =>
                          handleToolChange(
                            "bodegaId",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className={styles.select}
                        disabled={loading}
                      >
                        <option value="">Sin bodega asignada</option>
                        {warehousesList.map((wh) => (
                          <option key={wh.bodegaId} value={wh.bodegaId}>
                            {wh.nombre} {!wh.activa && "(Inactiva)"}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Ubicación específica</label>
                    <input
                      type="text"
                      value={toolData.ubicacion}
                      onChange={(e) =>
                        handleToolChange("ubicacion", e.target.value)
                      }
                      className={styles.input}
                      disabled={loading}
                      placeholder="Ej: Estante A, Nivel 3"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========== FORMULARIO INSUMOS ========== */}
          {isInsumo && (
            <>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Información Básica</h3>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span className={styles.required}>*</span>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={supplyData.nombre}
                    onChange={(e) =>
                      handleSupplyChange("nombre", e.target.value)
                    }
                    className={`${styles.input} ${validationErrors.nombre ? styles.inputError : ""}`}
                    disabled={loading}
                    placeholder="Nombre del insumo"
                  />
                  {validationErrors.nombre && (
                    <span className={styles.fieldError}>
                      {validationErrors.nombre}
                    </span>
                  )}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Categoría</label>
                    <select
                      value={supplyData.categoria}
                      onChange={(e) =>
                        handleSupplyChange(
                          "categoria",
                          e.target
                            .value as (typeof SupplyCategory)[keyof typeof SupplyCategory],
                        )
                      }
                      className={styles.select}
                      disabled={loading}
                    >
                      {Object.values(SupplyCategory).map((cat) => (
                        <option
                          key={String(cat)} // ✅
                          value={cat as string}
                        >
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <UnitMeasureAutocomplete
                      value={supplyData.unidadMedida}
                      onChange={(value) =>
                        handleSupplyChange("unidadMedida", value)
                      }
                      disabled={loading}
                      required
                    />
                    {validationErrors.unidadMedida && (
                      <span className={styles.fieldError}>
                        {validationErrors.unidadMedida}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Stock y Valor</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span>
                      Cantidad Actual
                    </label>
                    <div className={styles.quantityControl}>
                      <input
                        type="number"
                        value={
                          supplyData.cantidadActual === 0
                            ? ""
                            : supplyData.cantidadActual
                        }
                        onChange={(e) =>
                          handleSupplyChange(
                            "cantidadActual",
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value) || 0,
                          )
                        }
                        min="0"
                        step={
                          supplyData.unidadMedida === "Unidad" ? "1" : "0.01"
                        }
                        className={styles.input}
                        required
                        disabled={loading}
                      />
                      <span className={styles.unitLabel}>
                        {supplyData.unidadMedida || "Unidad"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Stock Mínimo</label>
                    <div className={styles.quantityControl}>
                      <input
                        type="number"
                        value={
                          supplyData.stockMin === 0 ? "" : supplyData.stockMin
                        }
                        onChange={(e) =>
                          handleSupplyChange(
                            "stockMin",
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value) || 0,
                          )
                        }
                        min="0"
                        step={
                          supplyData.unidadMedida === "Unidad" ? "1" : "0.01"
                        }
                        className={styles.input}
                        disabled={loading}
                        placeholder="0"
                      />
                      <span className={styles.unitLabel}>
                        {supplyData.unidadMedida || "Unidad"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span>
                      Valor Unitario (COP)
                    </label>
                    <div className={styles.currencyInput}>
                      <span className={styles.currencySymbol}>$</span>
                      <input
                        type="number"
                        value={
                          supplyData.valorUnitario === 0
                            ? ""
                            : supplyData.valorUnitario
                        }
                        onChange={(e) =>
                          handleSupplyChange(
                            "valorUnitario",
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value) || 0,
                          )
                        }
                        min="0"
                        step="0.01"
                        className={`${styles.input} ${validationErrors.valorUnitario ? styles.inputError : ""}`}
                        disabled={loading}
                        placeholder="0.00"
                      />
                    </div>
                    {validationErrors.valorUnitario && (
                      <span className={styles.fieldError}>
                        {validationErrors.valorUnitario}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Estado</label>
                    <select
                      value={supplyData.estado}
                      onChange={(e) =>
                        handleSupplyChange(
                          "estado",
                          e.target
                            .value as (typeof SupplyStatus)[keyof typeof SupplyStatus],
                        )
                      }
                      className={styles.select}
                      disabled={loading}
                    >
                      {Object.values(SupplyStatus).map((status) => (
                        <option
                          key={String(status)} // ✅
                          value={status as string}
                        >
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Ubicación</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Bodega</label>
                    {loadingWarehouses ? (
                      <div className={styles.loadingSmall}>Cargando...</div>
                    ) : (
                      <select
                        value={supplyData.bodegaId || ""}
                        onChange={(e) =>
                          handleSupplyChange(
                            "bodegaId",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className={styles.select}
                        disabled={loading}
                      >
                        <option value="">Sin bodega asignada</option>
                        {warehousesList.map((wh) => (
                          <option key={wh.bodegaId} value={wh.bodegaId}>
                            {wh.nombre} {!wh.activa && "(Inactiva)"}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Ubicación específica</label>
                    <input
                      type="text"
                      value={supplyData.ubicacion}
                      onChange={(e) =>
                        handleSupplyChange("ubicacion", e.target.value)
                      }
                      className={styles.input}
                      disabled={loading}
                      placeholder="Ej: Estante A, Nivel 3"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECCIÓN DE IMÁGENES */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Imágenes</h3>
            <MultiImageUpload
              onImagesChange={setNewImages}
              existingImages={existingImages}
              onRemoveExisting={handleRemoveExistingImage}
              maxFiles={10}
              maxSizeMB={5}
              disabled={loading}
            />
          </div>

          {/* BOTONES */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={loading}
            >
              Cancelar
            </button>

            {isInsumo && (
              <button
                type="button"
                onClick={handleUpdateStock}
                className={styles.btnWarning}
                disabled={loading}
              >
                {loading ? "Actualizando..." : "Solo Actualizar Stock"}
              </button>
            )}

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
