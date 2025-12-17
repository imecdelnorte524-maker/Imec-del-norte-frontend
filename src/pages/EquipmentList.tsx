import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import {
  getEquipmentByClientRequest,
  createEquipmentRequest,
} from "../api/equipment";
import type { Equipment } from "../interfaces/EquipmentInterfaces";
import styles from "../styles/pages/EquipmentDetailPage.module.css"; // Reusamos header/errores
import listStyles from "../styles/pages/EquipmentListPage.module.css";

interface ClientOption {
  idCliente: number;
  nombre: string;
  nit: string;
}

interface SimpleArea {
  idArea: number;
  nombreArea: string;
}

interface SimpleSubArea {
  idSubArea: number;
  nombreSubArea: string;
}

interface RouteState {
  clientId?: number;
  clientName?: string;
  clientNit?: string;
}

export default function EquipmentListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state || {}) as RouteState;

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | 0>(
    routeState.clientId ?? 0,
  );

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [search, setSearch] = useState("");

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);

  // Crear equipo
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [areas, setAreas] = useState<SimpleArea[]>([]);
  const [subAreas, setSubAreas] = useState<SimpleSubArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | "">("");
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | "">("");
  const [createForm, setCreateForm] = useState({
    category: "Aires Acondicionados",
    name: "",
    code: "",
    brand: "",
    model: "",
    serialNumber: "",
    capacity: "",
    refrigerantType: "",
    voltage: "",
    physicalLocation: "",
    manufacturer: "",
    installationDate: "",
    notes: "",
  });

  const roleName = user?.role?.nombreRol;
  const canView =
    roleName === "Administrador" ||
    roleName === "Secretaria" ||
    roleName === "Técnico";
  const canCreate = roleName === "Administrador" || roleName === "Técnico";

  const hasFixedClientFromRoute = !!routeState.clientId;

  useEffect(() => {
    if (!canView) {
      setError("No tiene permisos para ver el listado de equipos.");
      setLoadingClients(false);
      return;
    }

    const loadSingleClient = async (id: number) => {
      try {
        setLoadingClients(true);
        setError(null);

        // Si el nombre/NIT ya vienen del state, no es necesario ir al backend
        if (routeState.clientName) {
          setClients([
            {
              idCliente: id,
              nombre: routeState.clientName,
              nit: routeState.clientNit || "",
            },
          ]);
          return;
        }

        const res = await api.get(`/clients/${id}`);
        const c = res.data?.data;
        if (c) {
          setClients([
            {
              idCliente: c.idCliente,
              nombre: c.nombre,
              nit: c.nit,
            },
          ]);
        }
      } catch (err: any) {
        console.error("Error cargando cliente para equipos:", err);
        setError(
          err.response?.data?.error ||
            "Error al cargar la información del cliente.",
        );
      } finally {
        setLoadingClients(false);
      }
    };

    const loadClients = async () => {
      try {
        setLoadingClients(true);
        setError(null);

        const res = await api.get("/clients");
        const data = res.data?.data || [];
        const mapped: ClientOption[] = data.map((c: any) => ({
          idCliente: c.idCliente,
          nombre: c.nombre,
          nit: c.nit,
        }));

        setClients(mapped);
        if (mapped.length > 0 && !selectedClientId) {
          setSelectedClientId(mapped[0].idCliente);
        }
      } catch (err: any) {
        console.error("Error cargando clientes para equipos:", err);
        setError(
          err.response?.data?.error ||
            "Error al cargar la lista de clientes.",
        );
      } finally {
        setLoadingClients(false);
      }
    };

    // Si venimos de una orden con clientId, usamos ese cliente fijo
    if (hasFixedClientFromRoute && routeState.clientId) {
      setSelectedClientId(routeState.clientId);
      loadSingleClient(routeState.clientId);
    } else {
      // Modo general: Admin/Secretaria/Técnico pueden elegir la empresa
      loadClients();
    }
  }, [canView, hasFixedClientFromRoute, routeState.clientId, routeState.clientName, routeState.clientNit, selectedClientId]);

  // Cargar equipos cuando cambia la empresa o la búsqueda
  useEffect(() => {
    const loadEquipment = async () => {
      if (!selectedClientId || !canView) return;

      try {
        setLoadingEquipment(true);
        setEquipmentError(null);
        const equipments = await getEquipmentByClientRequest(
          selectedClientId,
          search || undefined,
        );
        setEquipmentList(equipments);
      } catch (err: any) {
        console.error("Error cargando equipos:", err);
        setEquipmentError(
          err.response?.data?.error ||
            "Error al cargar los equipos de la empresa.",
        );
      } finally {
        setLoadingEquipment(false);
      }
    };

    loadEquipment();
  }, [selectedClientId, search, canView]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setSelectedClientId(isNaN(value) ? 0 : value);
    setSearch("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleOpenEquipment = (equipmentId: number) => {
    navigate(`/equipment/${equipmentId}`);
  };

  // ---- Crear equipo (hoja de vida) ----

  const handleOpenCreateForm = async () => {
    if (!selectedClientId) {
      setCreateError("Debe seleccionar una empresa primero.");
      return;
    }

    try {
      setCreateError(null);
      setCreateLoading(true);
      const res = await api.get("/areas", {
        params: { clienteId: selectedClientId },
      });
      const data = res.data?.data || [];
      const mappedAreas: SimpleArea[] = data.map((a: any) => ({
        idArea: a.idArea,
        nombreArea: a.nombreArea,
      }));
      setAreas(mappedAreas);
      setSubAreas([]);
      setSelectedAreaId("");
      setSelectedSubAreaId("");
      setCreateForm((prev) => ({
        ...prev,
        category: "Aires Acondicionados",
        name: "",
        code: "",
        brand: "",
        model: "",
        serialNumber: "",
        capacity: "",
        refrigerantType: "",
        voltage: "",
        physicalLocation: "",
        manufacturer: "",
        installationDate: "",
        notes: "",
      }));
      setShowCreateForm(true);
    } catch (err: any) {
      console.error("Error cargando áreas para crear equipo:", err);
      setCreateError(
        err.response?.data?.error || "Error al cargar las áreas de la empresa.",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const areaId = value ? parseInt(value, 10) : "";
    setSelectedAreaId(areaId);
    setSelectedSubAreaId("");
    setSubAreas([]);

    if (!areaId) return;

    const loadSubAreas = async () => {
      try {
        setCreateLoading(true);
        const res = await api.get("/sub-areas", {
          params: { areaId },
        });
        const data = res.data?.data || [];
        const mappedSub: SimpleSubArea[] = data.map((s: any) => ({
          idSubArea: s.idSubArea,
          nombreSubArea: s.nombreSubArea,
        }));
        setSubAreas(mappedSub);
      } catch (err: any) {
        console.error("Error cargando subáreas:", err);
        setCreateError(
          err.response?.data?.error ||
            "Error al cargar las subáreas del área seleccionada.",
        );
      } finally {
        setCreateLoading(false);
      }
    };

    loadSubAreas();
  };

  const handleCreateFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setCreateError("Debe seleccionar una empresa.");
      return;
    }
    if (!createForm.name.trim()) {
      setCreateError("El nombre del equipo es obligatorio.");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const payload = {
        clientId: selectedClientId,
        category: createForm.category,
        name: createForm.name,
        code: createForm.code || undefined, // backend ignora y genera automáticamente
        brand: createForm.brand || undefined,
        model: createForm.model || undefined,
        serialNumber: createForm.serialNumber || undefined,
        capacity: createForm.capacity || undefined,
        refrigerantType: createForm.refrigerantType || undefined,
        voltage: createForm.voltage || undefined,
        physicalLocation: createForm.physicalLocation || undefined,
        manufacturer: createForm.manufacturer || undefined,
        installationDate: createForm.installationDate || undefined,
        notes: createForm.notes || undefined,
        areaId:
          typeof selectedAreaId === "number" ? selectedAreaId : undefined,
        subAreaId:
          typeof selectedSubAreaId === "number"
            ? selectedSubAreaId
            : undefined,
      };

      await createEquipmentRequest(payload);

      // Recargar lista de equipos
      const equipments = await getEquipmentByClientRequest(
        selectedClientId,
        search || undefined,
      );
      setEquipmentList(equipments);

      setShowCreateForm(false);
    } catch (err: any) {
      console.error("Error creando equipo:", err);
      setCreateError(
        err.response?.data?.error ||
          "Error al crear la hoja de vida del equipo.",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={listStyles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <h1>Equipos por Empresa</h1>

          {canCreate && (
            <button
              type="button"
              className={listStyles.createButton}
              onClick={handleOpenCreateForm}
              disabled={!selectedClientId}
            >
              + Crear equipo
            </button>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {!error && (
          <>
            {/* Filtros */}
            <div className={listStyles.filters}>
              <div className={listStyles.filterGroup}>
                <label>Empresa</label>
                {loadingClients ? (
                  <p>Cargando empresas...</p>
                ) : hasFixedClientFromRoute ? (
                  // Cliente fijo (viene desde la orden)
                  <p className={listStyles.fixedClientText}>
                    {clients[0]
                      ? `${clients[0].nombre} (${clients[0].nit})`
                      : routeState.clientName
                      ? `${routeState.clientName} (${routeState.clientNit || ""})`
                      : "Cliente seleccionado"}
                  </p>
                ) : (
                  // Modo general: combo de empresas
                  <select
                    value={selectedClientId || 0}
                    onChange={handleClientChange}
                  >
                    <option value={0}>Seleccionar empresa...</option>
                    {clients.map((c) => (
                      <option key={c.idCliente} value={c.idCliente}>
                        {c.nombre} ({c.nit})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className={listStyles.filterGroup}>
                <label>Búsqueda</label>
                <input
                  type="text"
                  placeholder="Buscar por nombre o código de equipo..."
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Lista de equipos */}
            {equipmentError && (
              <div className={styles.error}>{equipmentError}</div>
            )}

            {loadingEquipment ? (
              <p className={styles.loading}>Cargando equipos...</p>
            ) : (
              <div className={listStyles.grid}>
                {equipmentList.map((eq) => (
                  <div
                    key={eq.equipmentId}
                    className={listStyles.card}
                    onClick={() => handleOpenEquipment(eq.equipmentId)}
                  >
                    <div className={listStyles.cardHeader}>
                      <h3>{eq.name}</h3>
                      <span className={listStyles.status}>{eq.status}</span>
                    </div>

                    <div className={listStyles.cardBody}>
                      {eq.code && (
                        <div className={listStyles.row}>
                          <span className={listStyles.label}>Código:</span>
                          <span className={listStyles.value}>{eq.code}</span>
                        </div>
                      )}
                      <div className={listStyles.row}>
                        <span className={listStyles.label}>Categoría:</span>
                        <span className={listStyles.value}>{eq.category}</span>
                      </div>
                      {eq.brand && (
                        <div className={listStyles.row}>
                          <span className={listStyles.label}>Marca:</span>
                          <span className={listStyles.value}>{eq.brand}</span>
                        </div>
                      )}
                      {eq.model && (
                        <div className={listStyles.row}>
                          <span className={listStyles.label}>Modelo:</span>
                          <span className={listStyles.value}>{eq.model}</span>
                        </div>
                      )}
                      {eq.physicalLocation && (
                        <div className={listStyles.row}>
                          <span className={listStyles.label}>Ubicación:</span>
                          <span className={listStyles.value}>
                            {eq.physicalLocation}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={listStyles.cardFooter}>
                      <span className={listStyles.footerText}>
                        ID #{eq.equipmentId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingEquipment &&
              equipmentList.length === 0 &&
              selectedClientId &&
              !equipmentError && (
                <div className={listStyles.empty}>
                  <p>No se encontraron equipos para esta empresa.</p>
                </div>
              )}
          </>
        )}

        {/* Modal de creación de equipo */}
        {showCreateForm && (
          <div className={listStyles.modal}>
            <div className={listStyles.modalContent}>
              <h3>Crear Hoja de Vida del Equipo</h3>

              {createError && <div className={styles.error}>{createError}</div>}

              <form onSubmit={handleSubmitCreate}>
                <div className={listStyles.formRow}>
                  <label>Categoría del equipo *</label>
                  <select
                    name="category"
                    value={createForm.category}
                    onChange={handleCreateFormChange}
                    required
                  >
                    <option value="Aires Acondicionados">
                      Aires Acondicionados
                    </option>
                    <option value="Redes Eléctricas">Redes Eléctricas</option>
                    <option value="Redes Contra Incendios">
                      Redes Contra Incendios
                    </option>
                    <option value="Obras Civiles">Obras Civiles</option>
                  </select>
                </div>

                <div className={listStyles.formRow}>
                  <label>Nombre del equipo *</label>
                  <input
                    name="name"
                    value={createForm.name}
                    onChange={handleCreateFormChange}
                    required
                  />
                </div>

                <div className={listStyles.formRow}>
                  <label>Código interno (se generará automáticamente)</label>
                  <input
                    name="code"
                    value={createForm.code}
                    readOnly
                    placeholder="Se generará al guardar (ej: AACI001)"
                  />
                  <span className={listStyles.helperText}>
                    El sistema generará el código interno según la categoría y
                    la empresa.
                  </span>
                </div>

                <div className={listStyles.formRow}>
                  <label>Marca</label>
                  <input
                    name="brand"
                    value={createForm.brand}
                    onChange={handleCreateFormChange}
                  />
                </div>

                <div className={listStyles.formRow}>
                  <label>Modelo</label>
                  <input
                    name="model"
                    value={createForm.model}
                    onChange={handleCreateFormChange}
                  />
                </div>

                <div className={listStyles.formRow}>
                  <label>Número de serie</label>
                  <input
                    name="serialNumber"
                    value={createForm.serialNumber}
                    onChange={handleCreateFormChange}
                  />
                </div>

                <div className={listStyles.formRow}>
                  <label>Capacidad</label>
                  <input
                    name="capacity"
                    value={createForm.capacity}
                    onChange={handleCreateFormChange}
                  />
                </div>

                <div className={listStyles.formRow}>
                  <label>Tipo de refrigerante</label>
                  <input
                    name="refrigerantType"
                    value={createForm.refrigerantType}
                    onChange={handleCreateFormChange}
                  />
                </div>

                <div className={listStyles.formRow}>
                  <label>Voltaje</label>
                  <input
                    name="voltage"
                    value={createForm.voltage}
                    onChange={handleCreateFormChange}
                  />
                </div>

                <div className={listStyles.formRow}>
                  <label>Ubicación física</label>
                  <input
                    name="physicalLocation"
                    value={createForm.physicalLocation}
                    onChange={handleCreateFormChange}
                  />
                </div>

                <div className={listStyles.formRow}>
                  <label>Fabricante</label>
                  <input
                    name="manufacturer"
                    value={createForm.manufacturer}
                    onChange={handleCreateFormChange}
                  />
                </div>

                <div className={listStyles.formRow}>
                  <label>Área (opcional)</label>
                  <select
                    value={selectedAreaId || ""}
                    onChange={handleAreaChange}
                  >
                    <option value="">Sin área</option>
                    {areas.map((a) => (
                      <option key={a.idArea} value={a.idArea}>
                        {a.nombreArea}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAreaId && (
                  <div className={listStyles.formRow}>
                    <label>Subárea (opcional)</label>
                    <select
                      value={selectedSubAreaId || ""}
                      onChange={(e) =>
                        setSelectedSubAreaId(
                          e.target.value ? parseInt(e.target.value, 10) : "",
                        )
                      }
                    >
                      <option value="">Sin subárea</option>
                      {subAreas.map((s) => (
                        <option key={s.idSubArea} value={s.idSubArea}>
                          {s.nombreSubArea}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={listStyles.formRow}>
                  <label>Fecha de instalación</label>
                  <input
                    type="date"
                    name="installationDate"
                    value={createForm.installationDate}
                    onChange={handleCreateFormChange}
                  />
                </div>

                <div className={listStyles.formRow}>
                  <label>Observaciones</label>
                  <textarea
                    name="notes"
                    value={createForm.notes}
                    onChange={handleCreateFormChange}
                    rows={3}
                  />
                </div>

                <div className={listStyles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={createLoading}>
                    {createLoading ? "Guardando..." : "Crear equipo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}