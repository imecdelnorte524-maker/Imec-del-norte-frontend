// src/components/inventory/AddInventoryModal.tsx
import { useState, useEffect } from "react";
import { useCatalogActions } from "../../hooks/useInventory";
import { inventory as inventoryAPI } from "../../api/inventory";
import { imagesApi } from "../../api/images";
import { warehouses, type Warehouse } from "../../api/warehouses";
import UnitMeasureAutocomplete from "../common/UnitMeasureAutocomplete";
import MultiImageUpload from "../common/MultiImageUpload";
import styles from "../../styles/components/inventory/AddInventoryModal.module.css";
import {
  ToolStatus,
  ToolType,
  SupplyCategory,
  SupplyStatus,
} from "../../shared/enums";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalTab = "herramientas" | "insumos";

export default function AddInventoryModal({
  isOpen,
  onClose,
  onSuccess,
}: AddInventoryModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>("herramientas");
  const {
    createHerramienta,
    createInsumo,
    loading: createLoading,
    error: createError,
  } = useCatalogActions();

  const [toolImages, setToolImages] = useState<File[]>([]);
  const [supplyImages, setSupplyImages] = useState<File[]>([]);
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados para herramientas - SIN ubicacion
  const [nuevaHerramienta, setNuevaHerramienta] = useState({
    nombre: "",
    marca: "",
    serial: "",
    modelo: "",
    caracteristicasTecnicas: "",
    observacion: "",
    tipo: "Herramienta" as ToolType,
    estado: "Disponible" as ToolStatus,
    valorUnitario: 0,
    bodegaId: undefined as number | undefined,
  });

  // Estados para insumos - SIN ubicacion
  const [nuevoInsumo, setNuevoInsumo] = useState({
    nombre: "",
    categoria: "General" as SupplyCategory,
    unidadMedida: "",
    stockMin: 0,
    valorUnitario: 0,
    estado: "Disponible" as SupplyStatus,
    cantidadInicial: 0,
    bodegaId: undefined as number | undefined,
  });

  // Estados separados SOLO para ubicación
  const [ubicacionHerramienta, setUbicacionHerramienta] = useState("");
  const [ubicacionInsumo, setUbicacionInsumo] = useState("");

  const loading = createLoading;
  const error = createError || apiError;

  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
      setApiError(null);
    }
  }, [isOpen]);

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

  const handleSubmitHerramienta = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (
      !nuevaHerramienta.nombre ||
      !nuevaHerramienta.tipo ||
      !nuevaHerramienta.estado
    ) {
      alert(
        "Por favor complete los campos obligatorios: Nombre, Tipo y Estado",
      );
      return;
    }

    try {
      // 1. Crear la herramienta - SOLO datos básicos (SIN ubicacion)
      const herramientaData = {
        nombre: nuevaHerramienta.nombre,
        marca: nuevaHerramienta.marca,
        serial: nuevaHerramienta.serial,
        modelo: nuevaHerramienta.modelo,
        caracteristicasTecnicas: nuevaHerramienta.caracteristicasTecnicas,
        observacion: nuevaHerramienta.observacion,
        tipo: nuevaHerramienta.tipo,
        estado: nuevaHerramienta.estado,
        valorUnitario: nuevaHerramienta.valorUnitario,
        bodegaId: nuevaHerramienta.bodegaId,
      };

      const herramientaCreada = await createHerramienta(herramientaData);

      if (!herramientaCreada) {
        throw new Error("No se pudo crear la herramienta");
      }

      // 2. Crear registro en inventario CON la ubicación
      if (herramientaCreada.herramientaId) {
        const inventarioPayload = {
          herramientaId: herramientaCreada.herramientaId,
          bodegaId: nuevaHerramienta.bodegaId,
          cantidadActual: 1,
          ubicacion: ubicacionHerramienta || "",
        };

        try {
          await inventoryAPI.createInventory(inventarioPayload);
        } catch (inventoryError: any) {
          console.error("❌ Error creando inventario:", inventoryError);
          setApiError(
            `Herramienta creada pero error en inventario: ${inventoryError.message}`,
          );
        }
      }

      // 3. Subir imágenes si hay
      if (toolImages.length > 0 && herramientaCreada.herramientaId) {
        try {
          await imagesApi.uploadToolImages(
            herramientaCreada.herramientaId,
            toolImages,
          );
        } catch (imgError: any) {
          console.warn(
            "⚠️ No se pudieron subir todas las imágenes:",
            imgError?.message,
          );
        }
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("❌ Error creando herramienta:", err);
      setApiError(err.message || "No se pudo crear la herramienta");
    }
  };

  const handleSubmitInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (
      !nuevoInsumo.nombre ||
      !nuevoInsumo.unidadMedida ||
      nuevoInsumo.cantidadInicial === undefined
    ) {
      alert("Por favor complete los campos obligatorios");
      return;
    }

    try {
      // 1. Crear el insumo - SOLO campos permitidos (SIN ubicacion)
      const insumoData = {
        nombre: nuevoInsumo.nombre,
        categoria: nuevoInsumo.categoria,
        unidadMedida: nuevoInsumo.unidadMedida,
        stockMin: nuevoInsumo.stockMin,
        valorUnitario: nuevoInsumo.valorUnitario,
        estado: nuevoInsumo.estado,
        bodegaId: nuevoInsumo.bodegaId,
        cantidadInicial: nuevoInsumo.cantidadInicial,
      };

      const insumoCreado = await createInsumo(insumoData);

      if (!insumoCreado) {
        throw new Error("No se pudo crear el insumo");
      }

      // 2. Crear registro en inventario CON la ubicación
      if (insumoCreado.insumoId) {
        const inventarioPayload = {
          insumoId: insumoCreado.insumoId,
          bodegaId: nuevoInsumo.bodegaId,
          cantidadActual: nuevoInsumo.cantidadInicial,
          ubicacion: ubicacionInsumo || "",
        };

        try {
          await inventoryAPI.createInventory(inventarioPayload);
        } catch (inventoryError: any) {
          console.error("❌ Error creando inventario:", inventoryError);
          setApiError(
            `Insumo creado pero error en inventario: ${inventoryError.message}`,
          );
        }
      }

      // 3. Subir imágenes si hay
      if (supplyImages.length > 0 && insumoCreado.insumoId) {
        try {
          await imagesApi.uploadSupplyImages(
            insumoCreado.insumoId,
            supplyImages,
          );
        } catch (imgError: any) {
          console.warn(
            "⚠️ No se pudieron subir todas las imágenes:",
            imgError?.message,
          );
        }
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("❌ Error creando insumo:", err);

      let errorMessage = err.message || "No se pudo crear el insumo";

      if (
        errorMessage.includes("valor unitario") ||
        errorMessage.includes("stock") ||
        errorMessage.includes("número")
      ) {
        alert(
          `⚠️ Error de validación: ${errorMessage}\n\nAsegúrese de ingresar valores numéricos positivos.`,
        );
      } else {
        setApiError(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setNuevaHerramienta({
      nombre: "",
      marca: "",
      serial: "",
      modelo: "",
      caracteristicasTecnicas: "",
      observacion: "",
      tipo: "Herramienta",
      estado: "Disponible",
      valorUnitario: 0,
      bodegaId: undefined,
    });
    setNuevoInsumo({
      nombre: "",
      categoria: "General",
      unidadMedida: "",
      stockMin: 0,
      valorUnitario: 0,
      estado: "Disponible",
      cantidadInicial: 0,
      bodegaId: undefined,
    });
    setUbicacionHerramienta("");
    setUbicacionInsumo("");
    setToolImages([]);
    setSupplyImages([]);
    setApiError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Agregar al Inventario</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "herramientas" ? styles.active : ""}`}
            onClick={() => setActiveTab("herramientas")}
          >
            🛠️ Nueva Herramienta
          </button>
          <button
            className={`${styles.tab} ${activeTab === "insumos" ? styles.active : ""}`}
            onClick={() => setActiveTab("insumos")}
          >
            📦 Nuevo Insumo
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Cargando...</div>
        ) : (
          <div className={styles.modalBody}>
            {activeTab === "herramientas" && (
              <form onSubmit={handleSubmitHerramienta} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="nombreHerramienta">
                    Nombre de la Herramienta *
                  </label>
                  <input
                    type="text"
                    id="nombreHerramienta"
                    value={nuevaHerramienta.nombre}
                    onChange={(e) =>
                      setNuevaHerramienta({
                        ...nuevaHerramienta,
                        nombre: e.target.value,
                      })
                    }
                    placeholder="Ej: Taladro eléctrico, Multímetro..."
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="marca">Marca</label>
                    <input
                      type="text"
                      id="marca"
                      value={nuevaHerramienta.marca}
                      onChange={(e) =>
                        setNuevaHerramienta({
                          ...nuevaHerramienta,
                          marca: e.target.value,
                        })
                      }
                      placeholder="Ej: Bosch, Makita..."
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="modelo">Modelo</label>
                    <input
                      type="text"
                      id="modelo"
                      value={nuevaHerramienta.modelo}
                      onChange={(e) =>
                        setNuevaHerramienta({
                          ...nuevaHerramienta,
                          modelo: e.target.value,
                        })
                      }
                      placeholder="Ej: GSB 500 RE"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="serial">Número de Serie (Único)</label>
                  <input
                    type="text"
                    id="serial"
                    value={nuevaHerramienta.serial}
                    onChange={(e) =>
                      setNuevaHerramienta({
                        ...nuevaHerramienta,
                        serial: e.target.value,
                      })
                    }
                    placeholder="Ej: SN123456789"
                    className={styles.input}
                  />
                  <small className={styles.helpText}>
                    Opcional, pero debe ser único si se proporciona
                  </small>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="tipo">Tipo *</label>
                    <select
                      id="tipo"
                      value={nuevaHerramienta.tipo}
                      onChange={(e) =>
                        setNuevaHerramienta({
                          ...nuevaHerramienta,
                          tipo: e.target.value as ToolType,
                        })
                      }
                      className={styles.select}
                      required
                    >
                      {Object.values(ToolType).map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="estadoHerramienta">Estado *</label>
                    <select
                      id="estadoHerramienta"
                      value={nuevaHerramienta.estado}
                      onChange={(e) =>
                        setNuevaHerramienta({
                          ...nuevaHerramienta,
                          estado: e.target.value as ToolStatus,
                        })
                      }
                      className={styles.select}
                      required
                    >
                      {Object.values(ToolStatus).map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="valorHerramienta">
                    Valor Unitario (COP) *
                  </label>
                  <div className={styles.currencyInput}>
                    <span className={styles.currencySymbol}>$</span>
                    <input
                      type="number"
                      id="valorHerramienta"
                      value={nuevaHerramienta.valorUnitario}
                      onChange={(e) =>
                        setNuevaHerramienta({
                          ...nuevaHerramienta,
                          valorUnitario: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={styles.input}
                      required
                    />
                  </div>
                  <small className={styles.helpText}>
                    Ingrese un valor positivo (ej: 1500000 para 1.5 millones)
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ubicacionHerramienta">
                    Ubicación en Bodega
                  </label>
                  <input
                    type="text"
                    id="ubicacionHerramienta"
                    value={ubicacionHerramienta}
                    onChange={(e) => setUbicacionHerramienta(e.target.value)}
                    placeholder="Ej: Estante A, Caja 3, Piso 2..."
                    className={styles.input}
                  />

                  <label htmlFor="bodegaHerramienta">
                    Bodega de Almacenamiento
                  </label>
                  {loadingWarehouses ? (
                    <div className={styles.loadingSmall}>
                      Cargando bodegas...
                    </div>
                  ) : (
                    <select
                      id="bodegaHerramienta"
                      value={nuevaHerramienta.bodegaId || ""}
                      onChange={(e) =>
                        setNuevaHerramienta({
                          ...nuevaHerramienta,
                          bodegaId: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className={styles.select}
                    >
                      <option value="">Seleccionar bodega...</option>
                      {warehousesList.map((warehouse) => (
                        <option
                          key={warehouse.bodegaId}
                          value={warehouse.bodegaId}
                        >
                          {warehouse.nombre}
                          {!warehouse.activa && " (Inactiva)"}
                        </option>
                      ))}
                    </select>
                  )}
                  <small className={styles.helpText}>
                    La ubicación se guardará solo en el registro de inventario
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label>Imágenes de la Herramienta (Múltiples)</label>
                  <MultiImageUpload
                    onImagesChange={setToolImages}
                    maxFiles={10}
                    maxSizeMB={5}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={handleClose}
                    className={styles.btnSecondary}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={loading}
                  >
                    {loading ? "Creando..." : "Crear Herramienta"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "insumos" && (
              <form onSubmit={handleSubmitInsumo} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="nombreInsumo">Nombre del Insumo *</label>
                  <input
                    type="text"
                    id="nombreInsumo"
                    value={nuevoInsumo.nombre}
                    onChange={(e) =>
                      setNuevoInsumo({ ...nuevoInsumo, nombre: e.target.value })
                    }
                    placeholder="Ej: Tornillos 3mm, Cable eléctrico 2.5mm..."
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="categoria">Categoría *</label>
                    <select
                      id="categoria"
                      value={nuevoInsumo.categoria}
                      onChange={(e) =>
                        setNuevoInsumo({
                          ...nuevoInsumo,
                          categoria: e.target.value as SupplyCategory,
                        })
                      }
                      className={styles.select}
                      required
                    >
                      {Object.values(SupplyCategory).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <UnitMeasureAutocomplete
                      value={nuevoInsumo.unidadMedida}
                      onChange={(unitName) =>
                        setNuevoInsumo({
                          ...nuevoInsumo,
                          unidadMedida: unitName,
                        })
                      }
                      required
                      placeholder="Ej: Unidad, Kilo, Metro..."
                      className={styles.autocompleteInput}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cantidadInicial">Cantidad Inicial *</label>
                    <input
                      type="number"
                      id="cantidadInicial"
                      value={nuevoInsumo.cantidadInicial}
                      onChange={(e) =>
                        setNuevoInsumo({
                          ...nuevoInsumo,
                          cantidadInicial: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Ej: 10, 5.5..."
                      min="0"
                      step="0.01"
                      className={styles.input}
                      required
                    />
                    <small className={styles.helpText}>
                      Cantidad inicial en inventario
                    </small>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="stockMin">Stock Mínimo de Alerta</label>
                    <input
                      type="number"
                      id="stockMin"
                      value={nuevoInsumo.stockMin}
                      onChange={(e) =>
                        setNuevoInsumo({
                          ...nuevoInsumo,
                          stockMin: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      min="0"
                      className={styles.input}
                    />
                    <small className={styles.helpText}>
                      Se alertará cuando el stock llegue a este nivel
                    </small>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="valorInsumo">Valor Unitario (COP) *</label>
                  <div className={styles.currencyInput}>
                    <span className={styles.currencySymbol}>$</span>
                    <input
                      type="number"
                      id="valorInsumo"
                      value={nuevoInsumo.valorUnitario}
                      onChange={(e) =>
                        setNuevoInsumo({
                          ...nuevoInsumo,
                          valorUnitario: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className={styles.input}
                      required
                    />
                  </div>
                  <small className={styles.helpText}>
                    Ingrese un valor positivo (ej: 15000 para 15 mil)
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ubicacionInsumo">Ubicación en Bodega</label>
                  <input
                    type="text"
                    id="ubicacionInsumo"
                    value={ubicacionInsumo}
                    onChange={(e) => setUbicacionInsumo(e.target.value)}
                    placeholder="Ej: Estante B, Caja 5, Piso 1..."
                    className={styles.input}
                  />

                  <label htmlFor="bodegaInsumo">Bodega de Almacenamiento</label>
                  {loadingWarehouses ? (
                    <div className={styles.loadingSmall}>
                      Cargando bodegas...
                    </div>
                  ) : (
                    <select
                      id="bodegaInsumo"
                      value={nuevoInsumo.bodegaId || ""}
                      onChange={(e) =>
                        setNuevoInsumo({
                          ...nuevoInsumo,
                          bodegaId: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className={styles.select}
                    >
                      <option value="">Seleccionar bodega...</option>
                      {warehousesList.map((warehouse) => (
                        <option
                          key={warehouse.bodegaId}
                          value={warehouse.bodegaId}
                        >
                          {warehouse.nombre}
                          {!warehouse.activa && " (Inactiva)"}
                        </option>
                      ))}
                    </select>
                  )}
                  <small className={styles.helpText}>
                    La ubicación se guardará solo en el registro de inventario
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label>Imágenes del Insumo (Múltiples)</label>
                  <MultiImageUpload
                    onImagesChange={setSupplyImages}
                    maxFiles={10}
                    maxSizeMB={5}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={handleClose}
                    className={styles.btnSecondary}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.btnPrimary}
                    disabled={loading}
                  >
                    {loading ? "Creando..." : "Crear Insumo"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
