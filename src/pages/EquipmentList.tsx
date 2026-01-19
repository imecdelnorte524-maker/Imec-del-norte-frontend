// src/pages/EquipmentListPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";
import {
  getEquipmentByClientRequest,
  createEquipmentRequest,
} from "../api/equipment";
import type {
  AirConditionerTypeOption,
  ClientOption,
  Equipment,
  RouteState,
} from "../interfaces/EquipmentInterfaces";
import styles from "../styles/pages/EquipmentDetailPage.module.css";
import listStyles from "../styles/pages/EquipmentListPage.module.css";
import { playErrorSound } from "../utils/sounds";

// Importar componentes separados
import {
  EquipmentFilters,
  EquipmentGrid,
  CreateEquipmentModal,
  CreateAcTypeModal,
  EmptyState,
} from "../components/equipment/equipment-list";
import type { AreaSimple } from "../interfaces/AreaInterfaces";
import type { SubAreaSimple } from "../interfaces/SubAreaInterfaces";

export default function EquipmentListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state || {}) as RouteState;

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | 0>(
    routeState.clientId ?? 0
  );

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [search, setSearch] = useState("");

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
  const [selectedAreaId, setSelectedAreaId] = useState<number | "">("");
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | "">("");
  const [selectedSubSubAreaId, setSelectedSubSubAreaId] = useState<number | "">(
    ""
  );
  const [selectedSubAreaWithChildren, setSelectedSubAreaWithChildren] =
    useState<any>(null);

  const [showMotorForm, setShowMotorForm] = useState(false);
  const [showEvaporatorForm, setShowEvaporatorForm] = useState(false);
  const [showCondenserForm, setShowCondenserForm] = useState(false);
  const [showCompressorForm, setShowCompressorForm] = useState(false);

  // Estados para crear tipo de aire acondicionado
  const [showNewAcTypeForm, setShowNewAcTypeForm] = useState(false);
  const [newAcTypeForm, setNewAcTypeForm] = useState({
    name: "",
    hasEvaporator: true,
    hasCondenser: true,
  });
  const [creatingAcType, setCreatingAcType] = useState(false);
  const [acTypeError, setAcTypeError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    category: "Aires Acondicionados",
    airConditionerTypeId: "",
    name: "",
    physicalLocation: "",
    installationDate: "",
    notes: "",
  });

  const [motorForm, setMotorForm] = useState({
    amperaje: "",
    voltaje: "",
    rpm: "",
    serialMotor: "",
    modeloMotor: "",
    diametroEje: "",
    tipoEje: "",
  });

  const [evaporatorForm, setEvaporatorForm] = useState({
    marca: "",
    modelo: "",
    serial: "",
    capacidad: "",
    amperaje: "",
    tipoRefrigerante: "",
    voltaje: "",
    numeroFases: "",
  });

  const [condenserForm, setCondenserForm] = useState({
    marca: "",
    modelo: "",
    serial: "",
    capacidad: "",
    amperaje: "",
    voltaje: "",
    tipoRefrigerante: "",
    numeroFases: "",
    presionAlta: "",
    presionBaja: "",
    hp: "",
  });

  const [compressorForm, setCompressorForm] = useState({
    marca: "",
    modelo: "",
    serial: "",
    capacidad: "",
    amperaje: "",
    tipoRefrigerante: "",
    voltaje: "",
    numeroFases: "",
    tipoAceite: "",
    cantidadAceite: "",
  });

  const roleName = user?.role?.nombreRol;
  const canView =
    roleName === "Administrador" ||
    roleName === "Secretaria" ||
    roleName === "Técnico";
  const canCreate = roleName === "Administrador" || roleName === "Técnico";

  const hasFixedClientFromRoute = !!routeState.clientId;

  // Funciones auxiliares
  const findSubAreaInTree = (tree: any[], subAreaId: number): any | null => {
    for (const node of tree) {
      if (node.id === subAreaId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findSubAreaInTree(node.children, subAreaId);
        if (found) return found;
      }
    }
    return null;
  };

  const convertSubAreasTree = (
    tree: any[],
    areaId: number,
    parentId: number | null = null
  ): SubAreaSimple[] => {
    return tree.map((node: any) => ({
      idSubArea: node.id,
      nombreSubArea: node.nombre,
      idAreaPadre: areaId,
      parentSubAreaId: parentId,
      subAreas: node.children
        ? convertSubAreasTree(node.children, areaId, node.id)
        : [],
    }));
  };

  // Cargar clientes
  useEffect(() => {
    if (!canView) {
      setError("No tiene permisos para ver el listado de equipos.");
      playErrorSound();
      setLoadingClients(false);
      return;
    }

    const loadSingleClient = async (id: number) => {
      try {
        setLoadingClients(true);
        setError(null);

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
            "Error al cargar la información del cliente."
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
        }
      } catch (err: any) {
        console.error("Error cargando clientes para equipos:", err);
        setError(
          err.response?.data?.error || "Error al cargar la lista de clientes."
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
    hasFixedClientFromRoute,
    routeState.clientId,
    routeState.clientName,
    routeState.clientNit,
    selectedClientId,
  ]);

  // Cargar tipos de aire acondicionado
  const loadAirConditionerTypes = async () => {
    try {
      const res = await api.get("/air-conditioner-types");
      const data = res.data?.data || [];
      setAirConditionerTypes(data);
    } catch (err) {
      console.error("Error cargando tipos de aire acondicionado:", err);
    }
  };

  // Cargar equipos
  useEffect(() => {
    const loadEquipment = async () => {
      if (!selectedClientId || !canView) return;

      try {
        setLoadingEquipment(true);
        setEquipmentError(null);

        const equipments = await getEquipmentByClientRequest(selectedClientId);
        setAllEquipments(equipments);
        setEquipmentList(equipments);
      } catch (err: any) {
        console.error("Error cargando equipos:", err);
        setEquipmentError(
          err.response?.data?.error ||
            "Error al cargar los equipos de la empresa."
        );
      } finally {
        setLoadingEquipment(false);
      }
    };

    loadEquipment();
  }, [selectedClientId, canView]);

  // Filtrar equipos
  useEffect(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      setEquipmentList(allEquipments);
      return;
    }

    const filtered = allEquipments.filter((eq) => {
      const name = eq.name?.toLowerCase() ?? "";
      const code = eq.code?.toLowerCase() ?? "";
      const location = eq.physicalLocation?.toLowerCase() ?? "";
      const idStr = String(eq.equipmentId);

      return (
        name.includes(term) ||
        code.includes(term) ||
        location.includes(term) ||
        idStr.includes(term)
      );
    });

    setEquipmentList(filtered);
  }, [search, allEquipments]);

  // Cargar áreas jerárquicas
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
              subAreas: treeData?.subAreas
                ? convertSubAreasTree(treeData.subAreas, area.idArea)
                : [],
            };
          } catch (err) {
            console.error(
              `Error cargando árbol para área ${area.idArea}:`,
              err
            );
            return {
              idArea: area.idArea,
              nombreArea: area.nombreArea,
              treeData: null,
              subAreas: [],
            };
          }
        })
      );

      setAreas(areasWithTrees);
    } catch (err: any) {
      console.error("Error cargando áreas jerárquicas:", err);
      throw err;
    }
  };

  // Handlers
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number.parseInt(e.target.value, 10);
    setSelectedClientId(isNaN(value) ? 0 : value);
    setSearch("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleOpenEquipment = (equipmentId: number) => {
    navigate(`/equipment/${equipmentId}`);
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const areaId = value ? Number.parseInt(value, 10) : "";
    setSelectedAreaId(areaId);
    setSelectedSubAreaId("");
    setSelectedSubSubAreaId("");
    setSelectedSubAreaWithChildren(null);
  };

  const handleSubAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const subAreaId = value ? Number.parseInt(value, 10) : "";
    setSelectedSubAreaId(subAreaId);
    setSelectedSubSubAreaId("");

    if (!subAreaId) {
      setSelectedSubAreaWithChildren(null);
      return;
    }

    const selectedArea = areas.find((a) => a.idArea === selectedAreaId);
    if (selectedArea?.treeData?.subAreas) {
      const foundSubArea = findSubAreaInTree(
        selectedArea.treeData.subAreas,
        subAreaId
      );
      setSelectedSubAreaWithChildren(foundSubArea || null);
    } else {
      setSelectedSubAreaWithChildren(null);
    }
  };

  const handleSubSubAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const subSubAreaId = value ? Number.parseInt(value, 10) : "";
    setSelectedSubSubAreaId(subSubAreaId);
  };

  const handleCreateFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMotorFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMotorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEvaporatorFormChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setEvaporatorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCondenserFormChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setCondenserForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompressorFormChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setCompressorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewAcTypeFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  // Abrir formulario de creación
  const handleOpenCreateForm = async () => {
    if (!selectedClientId) {
      setCreateError("Debe seleccionar una empresa primero.");
      return;
    }

    try {
      setCreateError(null);
      setCreateLoading(true);

      await loadHierarchicalAreas();
      await loadAirConditionerTypes();

      // Resetear selecciones
      setSelectedAreaId("");
      setSelectedSubAreaId("");
      setSelectedSubSubAreaId("");
      setSelectedSubAreaWithChildren(null);

      // Resetear formularios
      setCreateForm({
        category: "Aires Acondicionados",
        airConditionerTypeId: "",
        name: "",
        physicalLocation: "",
        installationDate: "",
        notes: "",
      });

      setMotorForm({
        amperaje: "",
        voltaje: "",
        rpm: "",
        serialMotor: "",
        modeloMotor: "",
        diametroEje: "",
        tipoEje: "",
      });

      setEvaporatorForm({
        marca: "",
        modelo: "",
        serial: "",
        capacidad: "",
        amperaje: "",
        tipoRefrigerante: "",
        voltaje: "",
        numeroFases: "",
      });

      setCondenserForm({
        marca: "",
        modelo: "",
        serial: "",
        capacidad: "",
        amperaje: "",
        voltaje: "",
        tipoRefrigerante: "",
        numeroFases: "",
        presionAlta: "",
        presionBaja: "",
        hp: "",
      });

      setCompressorForm({
        marca: "",
        modelo: "",
        serial: "",
        capacidad: "",
        amperaje: "",
        tipoRefrigerante: "",
        voltaje: "",
        numeroFases: "",
        tipoAceite: "",
        cantidadAceite: "",
      });

      setShowMotorForm(false);
      setShowEvaporatorForm(false);
      setShowCondenserForm(false);
      setShowCompressorForm(false);

      setShowCreateForm(true);
    } catch (err: any) {
      console.error("Error cargando áreas para crear equipo:", err);
      setCreateError(
        err.response?.data?.error || "Error al cargar las áreas de la empresa."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // Crear nuevo tipo de AC
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

  // Crear equipo
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
      const airConditionerTypeId =
        createForm.airConditionerTypeId !== ""
          ? Number(createForm.airConditionerTypeId)
          : undefined;

      const payload: any = {
        clientId: selectedClientId,
        category: createForm.category,
        airConditionerTypeId,
        name: createForm.name,
        physicalLocation: createForm.physicalLocation || null,
        installationDate: createForm.installationDate || null,
        notes: createForm.notes || null,
        workOrderId: routeState.workOrderId || null,
      };

      if (typeof selectedAreaId === "number") {
        payload.areaId = selectedAreaId;
      }

      if (typeof selectedSubAreaId === "number") {
        payload.subAreaId = selectedSubAreaId;
      }

      if (showMotorForm) {
        payload.motor = motorForm;
      }

      if (showEvaporatorForm) {
        payload.evaporator = evaporatorForm;
      }

      if (showCondenserForm) {
        payload.condenser = condenserForm;
      }

      if (showCompressorForm) {
        payload.compressor = compressorForm;
      }

      await createEquipmentRequest(payload);

      const equipments = await getEquipmentByClientRequest(selectedClientId);
      setAllEquipments(equipments);

      setShowCreateForm(false);
    } catch (err: any) {
      console.error("Error creando equipo:", err);
      setCreateError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al crear la hoja de vida del equipo."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // Obtener tipo de AC seleccionado
  const selectedAcType = airConditionerTypes.find(
    (type) => type.id === Number.parseInt(createForm.airConditionerTypeId)
  );

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
              disabled={!selectedClientId || createLoading}
            >
              + Crear equipo
            </button>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {!error && (
          <>
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
            />

            {equipmentError && (
              <div className={styles.error}>{equipmentError}</div>
            )}

            {loadingEquipment ? (
              <p className={styles.loading}>Cargando equipos...</p>
            ) : (
              <EquipmentGrid
                equipmentList={equipmentList}
                onOpenEquipment={handleOpenEquipment}
              />
            )}

            {!loadingEquipment &&
              equipmentList.length === 0 &&
              selectedClientId &&
              !equipmentError && (
                <EmptyState message="No se encontraron equipos para esta empresa." />
              )}
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
          selectedSubSubAreaId={selectedSubSubAreaId}
          selectedSubAreaWithChildren={selectedSubAreaWithChildren}
          onAreaChange={handleAreaChange}
          onSubAreaChange={handleSubAreaChange}
          onSubSubAreaChange={handleSubSubAreaChange}
          showMotorForm={showMotorForm}
          showEvaporatorForm={showEvaporatorForm}
          showCondenserForm={showCondenserForm}
          showCompressorForm={showCompressorForm}
          onToggleMotorForm={() => setShowMotorForm(!showMotorForm)}
          onToggleEvaporatorForm={() =>
            setShowEvaporatorForm(!showEvaporatorForm)
          }
          onToggleCondenserForm={() => setShowCondenserForm(!showCondenserForm)}
          onToggleCompressorForm={() =>
            setShowCompressorForm(!showCompressorForm)
          }
          motorForm={motorForm}
          evaporatorForm={evaporatorForm}
          condenserForm={condenserForm}
          compressorForm={compressorForm}
          onMotorFormChange={handleMotorFormChange}
          onEvaporatorFormChange={handleEvaporatorFormChange}
          onCondenserFormChange={handleCondenserFormChange}
          onCompressorFormChange={handleCompressorFormChange}
          onSubmit={handleSubmitCreate}
          onClose={() => setShowCreateForm(false)}
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
