import { useRef, useState } from "react";
import { useCatalogActions } from "../../hooks/useInventory";
import styles from "../../styles/components/inventory/AddInventoryModal.module.css";
import {
  ToolStatus,
  ToolType,
  SupplyCategory,
  SupplyStatus,
  UnitOfMeasure,
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

  const [herramientaFile, setHerramientaFile] = useState<File | null>(null);
  const [herramientaPreview, setHerramientaPreview] = useState<string>("");
  const [insumoFile, setInsumoFile] = useState<File | null>(null);
  const [insumoPreview, setInsumoPreview] = useState<string>("");

  const herramientaFileRef = useRef<HTMLInputElement>(null);
  const insumoFileRef = useRef<HTMLInputElement>(null);

  const loading = createLoading;
  const error = createError;

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "herramienta" | "insumo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      alert("Por favor selecciona una imagen (JPG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe superar los 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "herramienta") {
        setHerramientaFile(file);
        setHerramientaPreview(reader.result as string);
      } else {
        setInsumoFile(file);
        setInsumoPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

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
    ubicacion: "",
  });

  const [nuevoInsumo, setNuevoInsumo] = useState({
    nombre: "",
    categoria: "General" as SupplyCategory,
    unidadMedida: "Unidad" as UnitOfMeasure,
    stockMin: 0,
    valorUnitario: 0,
    estado: "Disponible" as SupplyStatus,
    cantidadInicial: 0,
    ubicacion: "",
  });

  const handleSubmitHerramienta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !nuevaHerramienta.nombre ||
      !nuevaHerramienta.tipo ||
      !nuevaHerramienta.estado
    ) {
      alert(
        "Por favor complete los campos obligatorios: Nombre, Tipo y Estado"
      );
      return;
    }

    try {
      const herramientaCreada = await createHerramienta(
        nuevaHerramienta,
        herramientaFile || undefined
      );

      if (!herramientaCreada) {
        throw new Error("No se pudo crear la herramienta");
      }
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("❌ Error creando herramienta:", err);
      alert(`Error: ${err.message || "No se pudo crear la herramienta"}`);
    }
  };

  const handleSubmitInsumo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !nuevoInsumo.nombre ||
      !nuevoInsumo.unidadMedida ||
      nuevoInsumo.cantidadInicial === undefined
    ) {
      return;
    }

    try {
      const insumoData = {
        nombre: nuevoInsumo.nombre,
        categoria: nuevoInsumo.categoria,
        unidadMedida: nuevoInsumo.unidadMedida,
        stockMin: nuevoInsumo.stockMin,
        valorUnitario: nuevoInsumo.valorUnitario,
        estado: nuevoInsumo.estado,
        ubicacion: nuevoInsumo.ubicacion,
        cantidadInicial: nuevoInsumo.cantidadInicial,
      };

      const cleanData: any = { ...insumoData };
      if ("inventarioId" in cleanData) {
        delete cleanData.inventarioId;
      }
      if ("stock" in cleanData) {
        delete cleanData.stock;
      }
      const insumoCreado = await createInsumo(
        cleanData,
        insumoFile || undefined
      );

      if (!insumoCreado) {
        throw new Error("No se pudo crear el insumo");
      }
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("❌ Error creando insumo:", err);

      const errorMessage = err.message || "No se pudo crear el insumo";

      if (errorMessage.includes("inventarioId")) {
        alert(
          `⚠️ Error: El backend está recibiendo un campo 'inventarioId'.\n\nEsto es un problema en el servicio. Revisa catalog.ts y useInventory.ts.`
        );
      } else if (
        errorMessage.includes("valor unitario") ||
        errorMessage.includes("stock") ||
        errorMessage.includes("número")
      ) {
        alert(
          `⚠️ Error de validación: ${errorMessage}\n\nAsegúrese de ingresar valores numéricos positivos.`
        );
      } else {
        alert(`Error: ${errorMessage}`);
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
      ubicacion: "",
    });
    setNuevoInsumo({
      nombre: "",
      categoria: "General",
      unidadMedida: "Unidad",
      stockMin: 0,
      valorUnitario: 0,
      estado: "Disponible",
      cantidadInicial: 0,
      ubicacion: "",
    });
    setHerramientaFile(null);
    setHerramientaPreview("");
    setInsumoFile(null);
    setInsumoPreview("");
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
            className={`${styles.tab} ${
              activeTab === "herramientas" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("herramientas")}
          >
            🛠️ Nueva Herramienta
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "insumos" ? styles.active : ""
            }`}
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
                    Ubicación en Inventario
                  </label>
                  <input
                    type="text"
                    id="ubicacionHerramienta"
                    value={nuevaHerramienta.ubicacion}
                    onChange={(e) =>
                      setNuevaHerramienta({
                        ...nuevaHerramienta,
                        ubicacion: e.target.value,
                      })
                    }
                    placeholder="Ej: Taller principal - Estante A..."
                    className={styles.input}
                  />
                  <small className={styles.helpText}>
                    Opcional. Define dónde se almacenará la herramienta
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="fotoHerramienta">
                    Foto de la Herramienta (Opcional)
                  </label>
                  <div className={styles.fileUpload}>
                    <input
                      type="file"
                      id="fotoHerramienta"
                      ref={herramientaFileRef}
                      onChange={(e) => handleFileSelect(e, "herramienta")}
                      accept="image/*"
                      className={styles.fileInput}
                    />
                    <button
                      type="button"
                      onClick={() => herramientaFileRef.current?.click()}
                      className={styles.fileButton}
                    >
                      📷 Seleccionar Foto
                    </button>
                    {herramientaFile && (
                      <div className={styles.fileInfo}>
                        <span>{herramientaFile.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setHerramientaFile(null);
                            setHerramientaPreview("");
                            if (herramientaFileRef.current)
                              herramientaFileRef.current.value = "";
                          }}
                          className={styles.removeFile}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {herramientaPreview && (
                      <div className={styles.preview}>
                        <img src={herramientaPreview} alt="Preview" />
                      </div>
                    )}
                    <small className={styles.helpText}>
                      Máximo 5MB. Formatos: JPG, PNG, GIF, WebP
                    </small>
                  </div>
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
                      setNuevoInsumo({
                        ...nuevoInsumo,
                        nombre: e.target.value,
                      })
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
                    <label htmlFor="unidadMedida">Unidad de Medida *</label>
                    <select
                      id="unidadMedida"
                      value={nuevoInsumo.unidadMedida}
                      onChange={(e) =>
                        setNuevoInsumo({
                          ...nuevoInsumo,
                          unidadMedida: e.target.value as UnitOfMeasure,
                        })
                      }
                      className={styles.select}
                      required
                    >
                      {Object.values(UnitOfMeasure).map((unidad) => (
                        <option key={unidad} value={unidad}>
                          {unidad}
                        </option>
                      ))}
                    </select>
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
                      step="0.1"
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
                  <label htmlFor="ubicacionInsumo">
                    Ubicación en Inventario
                  </label>
                  <input
                    type="text"
                    id="ubicacionInsumo"
                    value={nuevoInsumo.ubicacion}
                    onChange={(e) =>
                      setNuevoInsumo({
                        ...nuevoInsumo,
                        ubicacion: e.target.value,
                      })
                    }
                    placeholder="Ej: Almacén principal - Estante B..."
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="fotoInsumo">Foto del Insumo (Opcional)</label>
                  <div className={styles.fileUpload}>
                    <input
                      type="file"
                      id="fotoInsumo"
                      ref={insumoFileRef}
                      onChange={(e) => handleFileSelect(e, "insumo")}
                      accept="image/*"
                      className={styles.fileInput}
                    />
                    <button
                      type="button"
                      onClick={() => insumoFileRef.current?.click()}
                      className={styles.fileButton}
                    >
                      📷 Seleccionar Foto
                    </button>
                    {insumoFile && (
                      <div className={styles.fileInfo}>
                        <span>{insumoFile.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setInsumoFile(null);
                            setInsumoPreview("");
                            if (insumoFileRef.current)
                              insumoFileRef.current.value = "";
                          }}
                          className={styles.removeFile}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {insumoPreview && (
                      <div className={styles.preview}>
                        <img src={insumoPreview} alt="Preview" />
                      </div>
                    )}
                    <small className={styles.helpText}>
                      Máximo 5MB. Formatos: JPG, PNG, GIF, WebP
                    </small>
                  </div>
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
