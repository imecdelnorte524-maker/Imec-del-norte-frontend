import { useEffect, useRef, useCallback, useState } from "react";
import HierarchicalAreaSelector from "./HierarchicalAreaSelector";
import { EvaporatorForm, CondenserForm } from "./forms";
import styles from "../../../styles/components/equipment/equipment-list/CreateEquipmentModal.module.css";
import detailStyles from "../../../styles/pages/EquipmentDetailPage.module.css";

import type {
  AirConditionerTypeOption,
  EvaporatorData,
  CondenserData,
  PlanMantenimientoData,
} from "../../../interfaces/EquipmentInterfaces";
import type { AreaSimple } from "../../../interfaces/AreaInterfaces";
import type { Order } from "../../../interfaces/OrderInterfaces";

// Reutilizamos la misma modal que en EquipmentDetailPage
import { AddPhotoModal } from "../equipment-details";

// Tipos de aire acondicionado que permiten múltiples componentes
const MULTIPLE_COMPONENT_TYPES = [
  "MultiSplit",
  "Refrigerante Variable",
  "VRF",
  "VRV",
  "Variable Refrigerant Flow",
  "Sistema Multi Split",
];

interface CreateEquipmentModalProps {
  isOpen: boolean;
  loading: boolean;
  error: string | null;

  // Formulario principal
  createForm: {
    clientId: number;
    category: string;
    airConditionerTypeId?: string;
    status?: string;
    installationDate?: string;
    notes?: string;
  };
  onCreateFormChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;

  // Tipos de aire acondicionado
  airConditionerTypes: AirConditionerTypeOption[];
  selectedAcType: AirConditionerTypeOption | undefined;
  onOpenNewAcTypeForm: () => void;

  // Áreas (del cliente, para selector jerárquico)
  areas: AreaSimple[];
  selectedAreaId: number | "" | null;
  selectedSubAreaId: number | "" | null;
  onAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;

  // Componentes (arrays para múltiples)
  evaporators: EvaporatorData[];
  condensers: CondenserData[];
  onAddEvaporator: () => void;
  onAddCondenser: () => void;
  onRemoveEvaporator: (index: number) => void;
  onRemoveCondenser: (index: number) => void;
  onEvaporatorChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onCondenserChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;

  // Plan de mantenimiento
  planMantenimiento: PlanMantenimientoData;
  onPlanMantenimientoChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;

  // Cliente actual (para obtener órdenes)
  client: {
    idCliente: number; // Este es el clienteEmpresaId
    nombre: string;
    nit: string;
  } | null;

  // Órdenes del cliente
  ordersForClient: Order[];
  loadingOrders: boolean;
  ordersError: string | null;

  // Estados para órdenes seleccionadas
  selectedOrderIds: number[];
  onOrderSelectionChange: (orderId: number, isSelected: boolean) => void;

  // Acciones
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    mainPhoto?: File | null,
  ) => void | Promise<void>;
  onClose: () => void;

  // Nueva prop: función para cargar órdenes
  onLoadOrders: (clienteEmpresaId: number, category: string) => void;
}

export default function CreateEquipmentModal({
  isOpen,
  loading,
  error,
  createForm,
  onCreateFormChange,
  airConditionerTypes,
  selectedAcType,
  onOpenNewAcTypeForm,
  areas,
  selectedAreaId,
  selectedSubAreaId,
  onAreaChange,
  onSubAreaChange,
  evaporators,
  condensers,
  onAddEvaporator,
  onAddCondenser,
  onRemoveEvaporator,
  onRemoveCondenser,
  onEvaporatorChange,
  onCondenserChange,
  planMantenimiento,
  onPlanMantenimientoChange,
  client,
  ordersForClient,
  loadingOrders,
  ordersError,
  selectedOrderIds,
  onOrderSelectionChange,
  onSubmit,
  onClose,
  onLoadOrders,
}: CreateEquipmentModalProps) {
  // 🔧 REFs para tracking de parámetros previos (órdenes)
  const previousCategoryRef = useRef<string>("");
  const previousClientRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- FOTO PRINCIPAL (una sola) usando AddPhotoModal ---
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoLoading] = useState(false); // solo para UI de la modal
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // 🔧 EFECTO PARA CARGAR ÓRDENES CON DEBOUNCING
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (isOpen && client && createForm.category) {
      const hasSameParams =
        previousCategoryRef.current === createForm.category &&
        previousClientRef.current === client.idCliente;

      if (!hasSameParams) {
        debounceTimerRef.current = setTimeout(() => {
          onLoadOrders(client.idCliente, createForm.category);
          previousCategoryRef.current = createForm.category;
          previousClientRef.current = client.idCliente;
        }, 500);
      }
    } else if (isOpen && createForm.category && !client) {
      console.warn("[Modal] No hay cliente definido para cargar órdenes");
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [isOpen, createForm.category, client, onLoadOrders]);

  // Recarga manual de órdenes
  const handleManualReloadOrders = useCallback(() => {
    if (client && createForm.category) {
      previousCategoryRef.current = "";
      previousClientRef.current = null;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      onLoadOrders(client.idCliente, createForm.category);
    }
  }, [client, createForm.category, onLoadOrders]);

  if (!isOpen) return null;

  // Función para verificar si el tipo seleccionado permite múltiples componentes
  const allowsMultipleComponents = (): boolean => {
    if (!selectedAcType || !selectedAcType.name) return false;
    const typeName = selectedAcType.name.toLowerCase();
    return MULTIPLE_COMPONENT_TYPES.some((multiType) =>
      typeName.includes(multiType.toLowerCase()),
    );
  };

  const canHaveMultipleComponents = allowsMultipleComponents();

  const evapCount = evaporators.length;
  const condCount = condensers.length;

  const canAddMoreEvaporators =
    canHaveMultipleComponents || evapCount === 0;
  const canAddMoreCondensers =
    canHaveMultipleComponents || condCount === 0;

  const canRemoveEvaporator =
    canHaveMultipleComponents && evapCount > 1;
  const canRemoveCondenser =
    canHaveMultipleComponents && condCount > 1;

  const handleAcTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__create_new__") {
      onOpenNewAcTypeForm();
      const syntheticEvent = {
        target: { name: "airConditionerTypeId", value: "" },
      } as React.ChangeEvent<HTMLSelectElement>;
      onCreateFormChange(syntheticEvent);
    } else {
      onCreateFormChange(e);
    }
  };

  const isAirConditioner = createForm.category === "Aires Acondicionados";

  // --- Handlers para la modal de foto (una sola foto) ---

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];

    if (file) {
      setPhotoFiles([file]);
      setPhotoError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoFiles([]);
      setPhotoPreview(null);
    }
  };

  const handleClearMainPhoto = () => {
    setPhotoFiles([]);
    setPhotoError(null);
    setPhotoPreview(null);
  };

  const handleConfirmMainPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (photoFiles.length === 0) {
      setPhotoError("Debes seleccionar una imagen.");
      return;
    }
    setShowAddPhotoModal(false);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    onSubmit(e, photoFiles[0] || null);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Crear Hoja de Vida del Equipo</h3>
          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && <div className={detailStyles.error}>{error}</div>}

        <form onSubmit={handleFormSubmit}>
          {/* Categoría */}
          <div className={styles.formRow}>
            <label>Categoría del equipo *</label>
            <select
              name="category"
              value={createForm.category}
              onChange={(e) => {
                previousCategoryRef.current = "";
                onCreateFormChange(e);
              }}
              required
              disabled={loading}
            >
              <option value="">Seleccionar categoría...</option>
              <option value="Aires Acondicionados">Aires Acondicionados</option>
              <option value="Redes Contra Incendios">
                Redes Contra Incendios
              </option>
              <option value="Redes Eléctricas">Redes Eléctricas</option>
              <option value="Obras Civiles">Obras Civiles</option>
            </select>
          </div>

          {/* Tipo de aire acondicionado (solo para aires) */}
          {isAirConditioner && (
            <div className={styles.formRow}>
              <label>Tipo de Aire Acondicionado *</label>
              <div className={styles.creatableSelect}>
                <select
                  name="airConditionerTypeId"
                  value={createForm.airConditionerTypeId || ""}
                  onChange={handleAcTypeSelect}
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar tipo...</option>
                  {airConditionerTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                  <option
                    value="__create_new__"
                    className={styles.createOption}
                  >
                    + Crear nuevo tipo...
                  </option>
                </select>
                {createForm.airConditionerTypeId && (
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => {
                      const syntheticEvent = {
                        target: { name: "airConditionerTypeId", value: "" },
                      } as React.ChangeEvent<HTMLSelectElement>;
                      onCreateFormChange(syntheticEvent);
                    }}
                    disabled={loading}
                  >
                    ×
                  </button>
                )}
              </div>
              {selectedAcType && (
                <div className={styles.typeInfo}>
                  <small>
                    {canHaveMultipleComponents
                      ? "✓ Este tipo permite múltiples evaporadoras y condensadoras"
                      : "✓ Este tipo permite una sola evaporadora y una sola condensadora"}
                  </small>
                </div>
              )}
              {airConditionerTypes.length === 0 && (
                <span className={styles.helperText}>
                  No hay tipos registrados. Crea uno nuevo seleccionando "Crear
                  nuevo tipo..."
                </span>
              )}
            </div>
          )}

          {/* Estado */}
          <div className={styles.formRow}>
            <label>Estado *</label>
            <select
              name="status"
              value={createForm.status || "Activo"}
              onChange={onCreateFormChange}
              required
              disabled={loading}
            >
              <option value="Activo">Activo</option>
              <option value="Fuera de Servicio">Fuera de Servicio</option>
              <option value="Dado de Baja">Dado de Baja</option>
            </select>
          </div>

          {/* FOTO PRINCIPAL CON MODAL (UNA SOLA) */}
          <div className={styles.formRow}>
            <label>Foto principal del equipo (opcional)</label>
            <div className={styles.photoMainRow}>
              <button
                type="button"
                className={styles.addButton}
                onClick={() => setShowAddPhotoModal(true)}
                disabled={loading}
              >
                {photoFiles.length > 0 ? "Cambiar foto" : "+ Añadir foto"}
              </button>
              {photoFiles.length > 0 && (
                <>
                  <span className={styles.helperText}>1 foto seleccionada</span>
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={handleClearMainPhoto}
                    disabled={loading}
                    title="Quitar foto seleccionada"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
            {photoError && (
              <small className={styles.helperText}>{photoError}</small>
            )}

            {/* Preview de la foto seleccionada */}
            {photoPreview && (
              <div className={styles.photoPreviewContainer}>
                <img
                  src={photoPreview}
                  alt="Foto principal seleccionada"
                  className={styles.photoPreviewImage}
                />
              </div>
            )}
          </div>

          {/* ASOCIAR A ÓRDENES EXISTENTES */}
          {createForm.category && client && (
            <div className={styles.formRow}>
              <div className={styles.ordersHeader}>
                <label>
                  Asociar a Órdenes de Servicio (Opcional)
                  <span className={styles.helperInfo}>
                    Solo se muestran órdenes pendientes/asignadas de la misma
                    categoría
                  </span>
                </label>
                <button
                  type="button"
                  className={styles.reloadOrdersButton}
                  onClick={handleManualReloadOrders}
                  disabled={loadingOrders || loading}
                  title="Recargar órdenes"
                >
                  🔄
                </button>
              </div>

              {loadingOrders ? (
                <div className={styles.loadingOrders}>
                  <div className={styles.spinner}></div>
                  <small>
                    Cargando órdenes disponibles para {createForm.category}...
                  </small>
                </div>
              ) : ordersError ? (
                <div className={styles.ordersError}>
                  <small>⚠️ {ordersError}</small>
                  <div className={styles.retryContainer}>
                    <button
                      type="button"
                      className={styles.retryButton}
                      onClick={handleManualReloadOrders}
                      disabled={loading}
                    >
                      Reintentar
                    </button>
                    <button
                      type="button"
                      className={styles.continueButton}
                      onClick={() => {
                        /* Continuar sin órdenes */
                      }}
                      disabled={loading}
                    >
                      Continuar sin órdenes
                    </button>
                  </div>
                </div>
              ) : ordersForClient.length > 0 ? (
                <>
                  <div className={styles.multiSelectContainer}>
                    {ordersForClient.map((order) => {
                      const isSelected = selectedOrderIds.includes(
                        order.orden_id,
                      );
                      return (
                        <div
                          key={order.orden_id}
                          className={`${styles.orderOption} ${
                            isSelected ? styles.selected : ""
                          }`}
                        >
                          <label>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                onOrderSelectionChange(
                                  order.orden_id,
                                  e.target.checked,
                                );
                              }}
                              disabled={loading}
                            />
                            <div className={styles.orderInfo}>
                              <span className={styles.orderLabel}>
                                <strong>Orden #{order.orden_id}</strong> -{" "}
                                {order.servicio.nombre_servicio}
                              </span>
                              <div className={styles.orderMeta}>
                                <small className={styles.orderDate}>
                                  {new Date(
                                    order.fecha_solicitud,
                                  ).toLocaleDateString()}
                                </small>
                                <span
                                  className={`${styles.orderStatus} ${
                                    styles[
                                      order.estado
                                        .toLowerCase()
                                        .replace(" ", "")
                                    ]
                                  }`}
                                >
                                  {order.estado}
                                </span>
                              </div>
                              {order.comentarios && (
                                <small className={styles.orderComments}>
                                  {order.comentarios}
                                </small>
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.ordersSummary}>
                    <span className={styles.helperText}>
                      {selectedOrderIds.length > 0 ? (
                        <>
                          <span className={styles.selectedCount}>
                            {selectedOrderIds.length} orden(es) seleccionada(s)
                          </span>
                          - Este equipo se asociará automáticamente a estas
                          órdenes
                        </>
                      ) : (
                        "Puedes crear el equipo sin asignarlo a órdenes existentes"
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className={styles.noOrdersInfo}>
                  <small>
                    ℹ️ No hay órdenes pendientes/asignadas para la categoría "
                    {createForm.category}". Puedes crear el equipo sin asignarlo
                    a una orden.
                  </small>
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={handleManualReloadOrders}
                    disabled={loading}
                  >
                    Verificar nuevamente
                  </button>
                </div>
              )}
            </div>
          )}

          {!client && createForm.category && (
            <div className={styles.warningInfo}>
              <small>
                ⚠️ Para asociar órdenes, primero selecciona un cliente en el
                formulario principal.
              </small>
            </div>
          )}

          {/* Selector jerárquico + gestión de áreas integrada */}
          <HierarchicalAreaSelector
            areas={areas}
            selectedAreaId={selectedAreaId}
            selectedSubAreaId={selectedSubAreaId}
            disabled={loading}
            onAreaChange={onAreaChange}
            onSubAreaChange={onSubAreaChange}
            clientId={client?.idCliente ?? null}
          />

          {/* Fecha de instalación */}
          <div className={styles.formRow}>
            <label>Fecha de instalación</label>
            <input
              type="date"
              name="installationDate"
              value={createForm.installationDate || ""}
              onChange={onCreateFormChange}
              disabled={loading}
            />
          </div>

          {/* Observaciones */}
          <div className={styles.formRow}>
            <label>Observaciones</label>
            <textarea
              name="notes"
              value={createForm.notes || ""}
              onChange={onCreateFormChange}
              rows={3}
              disabled={loading}
              placeholder="Notas adicionales sobre el equipo..."
            />
          </div>

          {/* COMPONENTES (solo para aires acondicionados) */}
          {isAirConditioner && (
            <div className={styles.componentsSection}>
              <h4>Componentes del Equipo</h4>

              {/* EVAPORADORES */}
              <div className={styles.componentGroup}>
                <div className={styles.groupHeader}>
                  <h5>
                    {evapCount === 1
                      ? "Evaporador"
                      : `Evaporadores (${evapCount})`}
                  </h5>
                  {canAddMoreEvaporators && (
                    <button
                      type="button"
                      className={styles.addButton}
                      onClick={onAddEvaporator}
                      disabled={loading}
                    >
                      + Agregar Evaporador
                    </button>
                  )}
                </div>
                {evaporators.length === 0 ? (
                  <div className={styles.noComponents}>
                    <small>No se han agregado evaporadores</small>
                  </div>
                ) : (
                  evaporators.map((evaporator, index) => (
                    <div key={index} className={styles.componentItem}>
                      <div className={styles.componentItemHeader}>
                        <h6>
                          {evapCount === 1
                            ? "Evaporador"
                            : `Evaporador ${index + 1}`}
                        </h6>
                        {canRemoveEvaporator && (
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => onRemoveEvaporator(index)}
                            disabled={loading}
                          >
                            ✕ Eliminar
                          </button>
                        )}
                      </div>
                      <EvaporatorForm
                        data={evaporator}
                        onChange={(e) => onEvaporatorChange(index, e)}
                        disabled={loading}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* CONDENSADORAS */}
              <div className={styles.componentGroup}>
                <div className={styles.groupHeader}>
                  <h5>
                    {condCount === 1
                      ? "Condensadora"
                      : `Condensadoras (${condCount})`}
                  </h5>
                  {canAddMoreCondensers && (
                    <button
                      type="button"
                      className={styles.addButton}
                      onClick={onAddCondenser}
                      disabled={loading}
                    >
                      + Agregar Condensadora
                    </button>
                  )}
                </div>
                {condensers.length === 0 ? (
                  <div className={styles.noComponents}>
                    <small>No se han agregado condensadoras</small>
                  </div>
                ) : (
                  condensers.map((condenser, index) => (
                    <div key={index} className={styles.componentItem}>
                      <div className={styles.componentItemHeader}>
                        <h6>
                          {condCount === 1
                            ? "Condensadora"
                            : `Condensadora ${index + 1}`}
                        </h6>
                        {canRemoveCondenser && (
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => onRemoveCondenser(index)}
                            disabled={loading}
                          >
                            ✕ Eliminar
                          </button>
                        )}
                      </div>
                      <CondenserForm
                        data={condenser}
                        onChange={(e) => onCondenserChange(index, e)}
                        disabled={loading}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PLAN DE MANTENIMIENTO */}
          <div className={styles.planSection}>
            <h4>Plan de Mantenimiento (Opcional)</h4>

            <div className={styles.formRow}>
              <label>Unidad de Frecuencia</label>
              <select
                name="unidadFrecuencia"
                value={planMantenimiento.unidadFrecuencia || ""}
                onChange={onPlanMantenimientoChange}
                disabled={loading}
              >
                <option value="">Sin plan</option>
                <option value="DIA">Dia</option>
                <option value="SEMANA">Semanas</option>
                <option value="MES">Meses</option>
              </select>
              <small className={styles.helperText}>
                Selecciona la unidad básica de repetición del mantenimiento.
              </small>
            </div>

            <div className={styles.formRow}>
              <label>
                Cada{" "}
                {planMantenimiento.unidadFrecuencia === "DIA"
                  ? "cuantos Días"
                  : planMantenimiento.unidadFrecuencia === "SEMANA"
                    ? "cuantas Semanas"
                    : "cuantos Meses"}
              </label>
              <input
                type="number"
                name="diaDelMes"
                min={1}
                max={31}
                value={
                  planMantenimiento.diaDelMes !== null &&
                  planMantenimiento.diaDelMes !== undefined
                    ? planMantenimiento.diaDelMes
                    : ""
                }
                onChange={onPlanMantenimientoChange}
                disabled={loading}
                placeholder="1-31"
              />
            </div>

            <div className={styles.formRow}>
              <label>Fecha Programada</label>
              <input
                type="date"
                name="fechaProgramada"
                value={planMantenimiento.fechaProgramada || ""}
                onChange={onPlanMantenimientoChange}
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
              <small className={styles.helperText}>
                Fecha de la próxima intervención programada.
              </small>
            </div>

            <div className={styles.formRow}>
              <label>Notas del Plan</label>
              <textarea
                name="notas"
                value={planMantenimiento.notas || ""}
                onChange={onPlanMantenimientoChange}
                rows={2}
                disabled={loading}
                placeholder="Notas sobre el plan de mantenimiento..."
              />
            </div>
          </div>

          {/* Botones */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Creando equipo...
                </>
              ) : (
                "Crear equipo"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL DE FOTO PRINCIPAL (UNA SOLA) */}
      {showAddPhotoModal && (
        <AddPhotoModal
          photoFiles={photoFiles}
          photoLoading={photoLoading}
          photoError={photoError}
          onFileSelection={handleFileSelection}
          onSubmit={handleConfirmMainPhoto}
          onClose={() => setShowAddPhotoModal(false)}
          multiple={false}
          title="Seleccionar foto principal"
        />
      )}
    </div>
  );
}