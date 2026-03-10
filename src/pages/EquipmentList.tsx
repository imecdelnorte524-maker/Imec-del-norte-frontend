import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import {
  getEquipmentByClientRequest,
  createEquipmentRequest,
  addEquipmentPhotoRequest,
  exportMaintenancePlanExcelRequest,
  getMyEquipmentRequest,
  exportEquipmentInventoryExcelRequest, // 👈 NUEVO IMPORT
} from "../api/equipment";
import {
  addEquipmentToOrderRequest,
  getOrdersByClientAndCategoryRequest,
} from "../api/orders";
import type {
  AirConditionerTypeOption,
  ClientOption,
  Equipment,
  CreateEquipmentData,
  EvaporatorData,
  CondenserData,
  PlanMantenimientoData,
} from "../interfaces/EquipmentInterfaces";
import type { Order } from "../interfaces/OrderInterfaces";
import styles from "../styles/pages/EquipmentDetailPage.module.css";
import listStyles from "../styles/pages/EquipmentListPage.module.css";
import { playErrorSound } from "../utils/sounds";
import {
  EquipmentFilters,
  EquipmentGrid,
  CreateEquipmentModal,
  CreateAcTypeModal,
  EmptyState,
} from "../components/equipment/equipment-list";
import type { AreaSimple } from "../interfaces/AreaInterfaces";

const STORAGE_KEYS = {
  SELECTED_CLIENT_ID: "equipmentList_selectedClientId",
  SEARCH_TERM: "equipmentList_searchTerm",
};

export default function EquipmentListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  interface RouteStateType {
    clientId?: number;
    clientName?: string;
    clientNit?: string;
    workOrderId?: number;
  }

  const routeState = (location.state || {}) as RouteStateType;

  const [clients, setClients] = useState<ClientOption[]>([]);

  // 🔹 Inicializar selectedClientId desde sessionStorage o ruta
  const [selectedClientId, setSelectedClientId] = useState<number | 0>(() => {
    // Prioridad: 1. Ruta, 2. SessionStorage, 3. 0
    if (routeState.clientId) return routeState.clientId;
    const saved = sessionStorage.getItem(STORAGE_KEYS.SELECTED_CLIENT_ID);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(
    null,
  );

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);

  // 🔹 Inicializar search desde sessionStorage
  const [search, setSearch] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.SEARCH_TERM);
    return saved || "";
  });

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);

  // Crear equipo
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [areas, setAreas] = useState<AreaSimple[]>([]);
  const [airConditionerTypes, setAirConditionerTypes] = useState<
    AirConditionerTypeOption[]
  >([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | null>(
    null,
  );

  const [evaporators, setEvaporators] = useState<EvaporatorData[]>([]);
  const [condensers, setCondensers] = useState<CondenserData[]>([]);
  const [planMantenimiento, setPlanMantenimiento] =
    useState<PlanMantenimientoData>({});

  const [showNewAcTypeForm, setShowNewAcTypeForm] = useState(false);
  const [newAcTypeForm, setNewAcTypeForm] = useState({
    name: "",
    hasEvaporator: true,
    hasCondenser: true,
  });
  const [creatingAcType, setCreatingAcType] = useState(false);
  const [acTypeError, setAcTypeError] = useState<string | null>(null);

  const [ordersForClient, setOrdersForClient] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [exportingPlan, setExportingPlan] = useState(false);
  const [exportingInventory, setExportingInventory] = useState(false);

  const [createForm, setCreateForm] = useState({
    clientId: selectedClientId,
    category: "Aires Acondicionados",
    airConditionerTypeId: "",
    code: "",
    status: "Activo",
    installationDate: "",
    notes: "",
    planMantenimientoAutomatico: false,
  });

  const roleName = user?.role?.nombreRol;
  const isClient = roleName === "Cliente";

  const canView =
    roleName === "Administrador" ||
    roleName === "Secretaria" ||
    roleName === "Técnico" ||
    roleName === "Cliente";

  const canCreate = roleName === "Administrador" || roleName === "Técnico";

  const canExport =
    roleName === "Administrador" ||
    roleName === "Secretaria" ||
    roleName === "Cliente";

  const hasFixedClientFromRoute = !!routeState.clientId;

  // 🔹 Guardar filtros en sessionStorage cuando cambian
  useEffect(() => {
    if (!isClient && !hasFixedClientFromRoute) {
      if (selectedClientId && selectedClientId !== 0) {
        sessionStorage.setItem(
          STORAGE_KEYS.SELECTED_CLIENT_ID,
          String(selectedClientId),
        );
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.SELECTED_CLIENT_ID);
      }
    }
  }, [selectedClientId, isClient, hasFixedClientFromRoute]);

  useEffect(() => {
    if (!isClient && !hasFixedClientFromRoute) {
      if (search) {
        sessionStorage.setItem(STORAGE_KEYS.SEARCH_TERM, search);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.SEARCH_TERM);
      }
    }
  }, [search, isClient, hasFixedClientFromRoute]);

  // 🔹 Limpiar storage cuando es cliente o ruta fija
  useEffect(() => {
    if (isClient || hasFixedClientFromRoute) {
      sessionStorage.removeItem(STORAGE_KEYS.SELECTED_CLIENT_ID);
      sessionStorage.removeItem(STORAGE_KEYS.SEARCH_TERM);
    }
  }, [isClient, hasFixedClientFromRoute]);

  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find((c) => c.idCliente === selectedClientId);
      if (client) setSelectedClient(client);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId, clients]);

  // Cargar clientes
  useEffect(() => {
    if (!canView) {
      setError("No tiene permisos para ver el listado de equipos.");
      playErrorSound();
      setLoadingClients(false);
      return;
    }

    // Para CLIENTE: no necesitamos /clients global, lo derivamos de los equipos
    if (isClient) {
      setLoadingClients(false);
      return;
    }

    const loadSingleClient = async (id: number) => {
      try {
        setLoadingClients(true);
        setError(null);

        if (routeState.clientName) {
          const clientData = {
            idCliente: id,
            nombre: routeState.clientName,
            nit: routeState.clientNit || "",
          };
          setClients([clientData]);
          setSelectedClient(clientData);
          return;
        }

        const res = await api.get(`/clients/${id}`);
        const c = res.data?.data;
        if (c) {
          const clientData = {
            idCliente: c.idCliente,
            nombre: c.nombre,
            nit: c.nit,
          };
          setClients([clientData]);
          setSelectedClient(clientData);
        }
      } catch (err: any) {
        console.error("Error cargando cliente para equipos:", err);
        setError(
          err.response?.data?.error ||
            "Error al cargar la información del cliente.",
        );
        playErrorSound();
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
          setSelectedClient(mapped[0]);
        }
      } catch (err: any) {
        console.error("Error cargando clientes para equipos:", err);
        setError(
          err.response?.data?.error || "Error al cargar la lista de clientes.",
        );
        playErrorSound();
      } finally {
        setLoadingClients(false);
      }
    };

    if (hasFixedClientFromRoute && routeState.clientId) {
      setSelectedClientId(routeState.clientId);
      loadSingleClient(routeState.clientId);
    } else {
      loadClients();
    }
  }, [
    canView,
    isClient,
    hasFixedClientFromRoute,
    routeState.clientId,
    routeState.clientName,
    routeState.clientNit,
    selectedClientId,
  ]);

  const loadAirConditionerTypes = async () => {
    try {
      const res = await api.get("/air-conditioner-types");
      const data = res.data?.data || [];
      setAirConditionerTypes(data);
    } catch (err) {
      console.error("Error cargando tipos de aire acondicionado:", err);
    }
  };

  const handleLoadOrders = async (
    clienteEmpresaId: number,
    category: string,
  ) => {
    setLoadingOrders(true);
    setOrdersError(null);

    try {
      const orders = await getOrdersByClientAndCategoryRequest(
        clienteEmpresaId,
        category,
      );
      setOrdersForClient(orders);
    } catch (error: any) {
      console.error("Error cargando órdenes:", error);
      setOrdersError("No se pudieron cargar las órdenes disponibles");
      setOrdersForClient([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Cargar equipos
  useEffect(() => {
    const loadEquipment = async () => {
      if (!canView) return;

      try {
        setLoadingEquipment(true);
        setEquipmentError(null);

        let equipments: Equipment[] = [];

        if (isClient) {
          equipments = await getMyEquipmentRequest();

          const clientMap = new Map<number, ClientOption>();
          equipments.forEach((eq) => {
            if (eq.client) {
              clientMap.set(eq.client.idCliente, {
                idCliente: eq.client.idCliente,
                nombre: eq.client.nombre,
                nit: eq.client.nit,
              });
            }
          });
          const derivedClients = Array.from(clientMap.values());
          setClients(derivedClients);

          if (derivedClients.length > 0 && !selectedClientId) {
            setSelectedClientId(derivedClients[0].idCliente);
            setSelectedClient(derivedClients[0]);
          }
        } else {
          if (!selectedClientId) {
            setAllEquipments([]);
            setEquipmentList([]);
            return;
          }
          equipments = await getEquipmentByClientRequest(selectedClientId);
        }

        setAllEquipments(equipments);
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
  }, [selectedClientId, canView, isClient]);

  // 🔹 Filtrar equipos por búsqueda (100% local, sobre los datos ya cargados)
  useEffect(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      setEquipmentList(allEquipments);
      return;
    }

    const filtered = allEquipments.filter((eq) => {
      const code = eq.code?.toLocaleLowerCase() ?? "";
      const areaName = eq.area?.nombreArea.toLowerCase() ?? "";
      const subAreaName = eq.subArea?.nombreSubArea.toLowerCase() ?? "";
      const typeAirConditioner =
        eq.airConditionerType?.name.toLowerCase() ?? "";

      return (
        code.includes(term) ||
        areaName.includes(term) ||
        subAreaName.includes(term) ||
        typeAirConditioner.includes(term)
      );
    });

    setEquipmentList(filtered);
  }, [search, allEquipments]);

  const loadHierarchicalAreas = async () => {
    try {
      const areasRes = await api.get("/areas", {
        params: { clienteId: selectedClientId },
      });
      const areasData = areasRes.data?.data || [];

      const areasWithTrees = await Promise.all(
        areasData.map(async (area: any) => {
          try {
            const treeRes = await api.get(`/sub-areas/tree/${area.idArea}`);
            const treeData = treeRes.data?.data;

            return {
              idArea: area.idArea,
              nombreArea: area.nombreArea,
              treeData: treeData,
              subAreas: [],
            };
          } catch (err) {
            console.error(
              `Error cargando árbol para área ${area.idArea}:`,
              err,
            );
            return {
              idArea: area.idArea,
              nombreArea: area.nombreArea,
              treeData: null,
              subAreas: [],
            };
          }
        }),
      );

      setAreas(areasWithTrees);
    } catch (err: any) {
      console.error("Error cargando áreas jerárquicas:", err);
      throw err;
    }
  };

  const loadOrdersForClient = async (clientId: number, category: string) => {
    if (!clientId || !category) {
      setOrdersForClient([]);
      return;
    }

    setLoadingOrders(true);
    setOrdersError(null);

    try {
      const orders = await getOrdersByClientAndCategoryRequest(
        clientId,
        category,
      );
      setOrdersForClient(orders);
    } catch (err: any) {
      console.error("Error cargando órdenes del cliente:", err);
      setOrdersError("Error al cargar órdenes disponibles");
      setOrdersForClient([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (showCreateForm && selectedClientId && createForm.category) {
      loadOrdersForClient(selectedClientId, createForm.category);
      setSelectedOrderIds([]);
    }
  }, [showCreateForm, createForm.category, selectedClientId]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    const newClientId = isNaN(value) ? 0 : value;

    setSelectedClientId(newClientId);
    setSearch("");

    const client = clients.find((c) => c.idCliente === newClientId);
    setSelectedClient(client || null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleOpenEquipment = (equipmentId: number) => {
    navigate(`/equipment/${equipmentId}`);
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number.parseInt(e.target.value, 10) : null;
    setSelectedAreaId(value);
    setSelectedSubAreaId(null);
  };

  const handleSubAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number.parseInt(e.target.value, 10) : null;
    setSelectedSubAreaId(value);
  };

  const handleAddEvaporator = () => setEvaporators([...evaporators, {}]);

  const handleAddCondenser = () => setCondensers([...condensers, {}]);

  const handleRemoveEvaporator = (index: number) => {
    setEvaporators(evaporators.filter((_, i) => i !== index));
  };

  const handleRemoveCondenser = (index: number) => {
    setCondensers(condensers.filter((_, i) => i !== index));
  };

  // 🔥 ACTUALIZADO: Ahora acepta tanto input como select
  const handleEvaporatorChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const newEvaporators = [...evaporators];

    // Si es el campo de tipo, convertir a número
    if (name === "airConditionerTypeEvapId") {
      newEvaporators[index] = {
        ...newEvaporators[index],
        [name]: value ? parseInt(value) : undefined,
      };
    } else {
      newEvaporators[index] = {
        ...newEvaporators[index],
        [name]: value,
      };
    }

    setEvaporators(newEvaporators);
  };

  const handleCondenserChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newCondensers = [...condensers];
    newCondensers[index] = {
      ...newCondensers[index],
      [e.target.name]: e.target.value,
    };
    setCondensers(newCondensers);
  };

  const handlePlanMantenimientoChange = (
    e: React.ChangeEvent<
      HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setPlanMantenimiento((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, type } = target;

    const finalValue = type === "checkbox" ? target.checked : target.value;

    setCreateForm((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    if (name === "category" && showCreateForm && selectedClientId) {
      loadOrdersForClient(selectedClientId, String(finalValue));
    }
  };

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

  const handleOrderSelectionChange = (orderId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    } else {
      setSelectedOrderIds(selectedOrderIds.filter((id) => id !== orderId));
    }
  };

  const handleOpenCreateForm = async () => {
    if (!selectedClientId || !selectedClient) {
      setCreateError("Debe seleccionar una empresa primero.");
      return;
    }

    try {
      setCreateError(null);
      setCreateLoading(true);

      setCreateForm((prev) => ({
        ...prev,
        clientId: selectedClientId,
      }));

      await loadHierarchicalAreas();
      await loadAirConditionerTypes();

      await loadOrdersForClient(selectedClientId, createForm.category);

      setSelectedAreaId(null);
      setSelectedSubAreaId(null);
      setSelectedOrderIds([]);
      setEvaporators([]);
      setCondensers([]);
      setPlanMantenimiento({});

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

      const newType = response.data?.data;

      setAirConditionerTypes((prev) => [...prev, newType]);
      setCreateForm((prev) => ({
        ...prev,
        airConditionerTypeId: newType.id.toString(),
      }));

      setShowNewAcTypeForm(false);
      setNewAcTypeForm({
        name: "",
        hasEvaporator: true,
        hasCondenser: true,
      });
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

  const handleSubmitCreate = async (
    e: React.FormEvent<HTMLFormElement>,
    mainPhoto?: File | null,
  ) => {
    e.preventDefault();

    if (!selectedClientId || !selectedClient) {
      setCreateError("Debe seleccionar una empresa.");
      return;
    }

    if (
      createForm.category === "Aires Acondicionados" &&
      !createForm.airConditionerTypeId
    ) {
      setCreateError("Debe seleccionar un tipo de aire acondicionado.");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const payload: CreateEquipmentData = {
        clientId: selectedClientId,
        category: createForm.category,
        status: createForm.status,
        installationDate: createForm.installationDate || null,
        notes: createForm.notes || null,
        areaId: selectedAreaId || null,
        subAreaId: selectedSubAreaId || null,
        code: createForm.code || null,
        evaporators: evaporators,
        condensers: condensers,
        planMantenimiento:
          Object.keys(planMantenimiento).length > 0 ? planMantenimiento : null,
        planMantenimientoAutomatico: createForm.planMantenimientoAutomatico,
      };

      if (createForm.airConditionerTypeId) {
        payload.airConditionerTypeId = Number(createForm.airConditionerTypeId);
      }

      const newEquipment = await createEquipmentRequest(payload);

      if (mainPhoto) {
        await addEquipmentPhotoRequest(newEquipment.equipmentId, mainPhoto);
      }

      if (selectedOrderIds.length > 0) {
        try {
          await Promise.all(
            selectedOrderIds.map((orderId) =>
              addEquipmentToOrderRequest(orderId, newEquipment.equipmentId),
            ),
          );
        } catch (associationError) {
          console.error("Error asociando órdenes:", associationError);
        }
      }

      const equipments = await getEquipmentByClientRequest(selectedClientId);
      setAllEquipments(equipments);
      setEquipmentList(equipments);

      setShowCreateForm(false);
      setSelectedOrderIds([]);
      setCreateForm({
        clientId: selectedClientId,
        category: "Aires Acondicionados",
        airConditionerTypeId: "",
        code: "",
        status: "Activo",
        installationDate: "",
        notes: "",
        planMantenimientoAutomatico: false,
      });
      setEvaporators([]);
      setCondensers([]);
      setPlanMantenimiento({});
      setOrdersForClient([]);
    } catch (err: any) {
      console.error("Error creando equipo:", err);
      setCreateError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al crear la hoja de vida del equipo.",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleExportMaintenancePlan = async () => {
    if (!selectedClientId || selectedClientId === 0) {
      setEquipmentError(
        "Debe seleccionar una empresa para exportar el plan de mantenimiento.",
      );
      return;
    }

    try {
      setEquipmentError(null);
      setExportingPlan(true);

      await exportMaintenancePlanExcelRequest(selectedClientId);
    } catch (err: any) {
      console.error("Error exportando plan de mantenimiento:", err);
      setEquipmentError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error al exportar el plan de mantenimiento.",
      );
    } finally {
      setExportingPlan(false);
    }
  };

  // 👇 NUEVO MANEJADOR PARA EXPORTAR INVENTARIO DE EQUIPOS
  const handleExportEquipmentInventory = async () => {
    if (!selectedClientId || selectedClientId === 0) {
      setEquipmentError(
        "Debe seleccionar una empresa para exportar el inventario de equipos.",
      );
      return;
    }

    try {
      setEquipmentError(null);
      setExportingInventory(true);

      await exportEquipmentInventoryExcelRequest(selectedClientId);
    } catch (err: any) {
      console.error("Error exportando inventario de equipos:", err);
      setEquipmentError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Error al exportar el inventario de equipos.",
      );
    } finally {
      setExportingInventory(false);
    }
  };

  const selectedAcType = airConditionerTypes.find(
    (type) => type.id === Number.parseInt(createForm.airConditionerTypeId),
  );

  const renderContent = () => {
    if (isClient) {
      if (!canView) {
        return (
          <div className={styles.error}>
            No tiene permisos para ver los equipos.
          </div>
        );
      }

      if (loadingEquipment) {
        return <p className={styles.loading}>Cargando equipos...</p>;
      }

      if (equipmentError) {
        return <div className={styles.error}>{equipmentError}</div>;
      }

      if (equipmentList.length === 0 && !loadingEquipment) {
        return (
          <EmptyState message="No se encontraron equipos registrados para sus empresas." />
        );
      }

      return (
        <EquipmentGrid
          equipmentList={equipmentList}
          onOpenEquipment={handleOpenEquipment}
        />
      );
    }

    if (error) {
      return <div className={styles.error}>{error}</div>;
    }

    if (loadingClients) {
      return <p className={styles.loading}>Cargando clientes...</p>;
    }

    if (clients.length === 0 && !loadingClients && !hasFixedClientFromRoute) {
      return (
        <EmptyState message="No hay clientes registrados en el sistema. Para gestionar equipos, primero debe crear un cliente." />
      );
    }

    if (!selectedClientId || selectedClientId === 0) {
      return (
        <EmptyState message="Seleccione un cliente de la lista para ver sus equipos." />
      );
    }

    if (loadingEquipment) {
      return <p className={styles.loading}>Cargando equipos...</p>;
    }

    if (equipmentError) {
      return <div className={styles.error}>{equipmentError}</div>;
    }

    if (equipmentList.length === 0 && !loadingEquipment) {
      return (
        <EmptyState
          message={`${selectedClient?.nombre || "Este cliente"} no tiene equipos registrados. ${canCreate ? "¡Crea el primero!" : ""}`}
        />
      );
    }

    return (
      <EquipmentGrid
        equipmentList={equipmentList}
        onOpenEquipment={handleOpenEquipment}
      />
    );
  };

  return (
    <DashboardLayout>
      <div className={listStyles.container}>
        <div className={styles.header}>
          <h1>{isClient ? "Mis Equipos" : "Equipos por Empresa"}</h1>

          {selectedClientId && selectedClientId !== 0 && (
            <div className={listStyles.headerActions}>
              {canExport && (
                <>
                  <button
                    type="button"
                    className={listStyles.exportButton}
                    onClick={handleExportMaintenancePlan}
                    disabled={!selectedClientId || exportingPlan}
                  >
                    {exportingPlan
                      ? "Exportando..."
                      : "Exportar plan mantenimiento"}
                  </button>

                  {/* 👇 NUEVO BOTÓN PARA EXPORTAR INVENTARIO DE EQUIPOS */}
                  <button
                    type="button"
                    className={listStyles.exportInventoryButton}
                    onClick={handleExportEquipmentInventory}
                    disabled={!selectedClientId || exportingInventory}
                  >
                    {exportingInventory
                      ? "Exportando..."
                      : "Exportar inventario equipos"}
                  </button>
                </>
              )}

              {canCreate && (
                <button
                  type="button"
                  className={listStyles.createButton}
                  onClick={handleOpenCreateForm}
                  disabled={!selectedClientId || createLoading}
                >
                  + Crear equipo
                </button>
              )}
            </div>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {!error && (
          <>
            {clients.length > 0 && (
              <EquipmentFilters
                clients={clients}
                selectedClientId={selectedClientId}
                search={search}
                loadingClients={loadingClients}
                loadingEquipment={loadingEquipment}
                hasFixedClientFromRoute={hasFixedClientFromRoute}
                fixedClientName={routeState.clientName}
                fixedClientNit={routeState.clientNit}
                onClientChange={handleClientChange}
                onSearchChange={handleSearchChange}
                isClientUser={isClient}
              />
            )}

            {renderContent()}
          </>
        )}

        <CreateEquipmentModal
          isOpen={showCreateForm}
          loading={createLoading}
          error={createError}
          createForm={createForm}
          onCreateFormChange={handleCreateFormChange}
          airConditionerTypes={airConditionerTypes}
          selectedAcType={selectedAcType}
          onOpenNewAcTypeForm={() => {
            setShowNewAcTypeForm(true);
            setNewAcTypeForm({
              name: "",
              hasEvaporator: true,
              hasCondenser: true,
            });
          }}
          areas={areas}
          selectedAreaId={selectedAreaId}
          selectedSubAreaId={selectedSubAreaId}
          onAreaChange={handleAreaChange}
          onSubAreaChange={handleSubAreaChange}
          evaporators={evaporators}
          condensers={condensers}
          onAddEvaporator={handleAddEvaporator}
          onAddCondenser={handleAddCondenser}
          onRemoveEvaporator={handleRemoveEvaporator}
          onRemoveCondenser={handleRemoveCondenser}
          onEvaporatorChange={handleEvaporatorChange}
          onCondenserChange={handleCondenserChange}
          planMantenimiento={planMantenimiento}
          onPlanMantenimientoChange={handlePlanMantenimientoChange}
          ordersForClient={ordersForClient}
          loadingOrders={loadingOrders}
          ordersError={ordersError}
          selectedOrderIds={selectedOrderIds}
          onOrderSelectionChange={handleOrderSelectionChange}
          onSubmit={handleSubmitCreate}
          onClose={() => setShowCreateForm(false)}
          client={selectedClient}
          onLoadOrders={handleLoadOrders}
        />

        <CreateAcTypeModal
          isOpen={showNewAcTypeForm}
          form={newAcTypeForm}
          loading={creatingAcType}
          error={acTypeError}
          onChange={handleNewAcTypeFormChange}
          onSubmit={handleCreateNewAcType}
          onClose={() => setShowNewAcTypeForm(false)}
        />
      </div>
    </DashboardLayout>
  );
}
