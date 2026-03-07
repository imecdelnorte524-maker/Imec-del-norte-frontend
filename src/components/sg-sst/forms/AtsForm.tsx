// src/components/sg-sst/AtsForm.tsx
import { useState, useEffect, useMemo } from "react";
import type {
  AtsFormData,
  SignFormData,
} from "../../../interfaces/SgSstInterface";
import type { Usuario } from "../../../interfaces/UserInterfaces";
import type { Rol } from "../../../interfaces/RolesInterfaces";
import type { Client } from "../../../interfaces/ClientInterfaces";
import type { Order } from "../../../interfaces/OrderInterfaces";
import type { Area } from "../../../interfaces/AreaInterfaces";
import type { SubArea } from "../../../interfaces/SubAreaInterfaces";
import { usersApi } from "../../../api/users";
import { sgSstService } from "../../../api/sg-sst";
import { areas as areasAPI } from "../../../api/areas";
import { subAreas as subAreasAPI } from "../../../api/subAreas";
import SignaturePad from "../SignaturePad";
import styles from "../../../styles/components/sg-sst/forms/AtsForm.module.css";
import { useAuth } from "../../../hooks/useAuth";
import { rolesApi } from "../../../api/roles";
import { getMyAssignedOrdersRequest } from "../../../api/orders";
import { useModal } from "../../../context/ModalContext";

interface AtsFormProps {
  onSubmit: (data: AtsFormData) => void;
  onCancel: () => void;
  userId: number;
  createdBy: number;
}

export default function AtsForm({
  onSubmit,
  onCancel,
  userId,
  createdBy,
}: AtsFormProps) {
  const { showModal } = useModal();
  const { user } = useAuth();

  const isTechnician =
    user?.role?.nombreRol?.toLowerCase() === "técnico" ||
    user?.role?.nombreRol?.toLowerCase() === "tecnico";

  const [dateString, setDateString] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const [formData, setFormData] = useState<Omit<AtsFormData, "date">>({
    workerName: "",
    position: "",
    area: "",
    subArea: "",
    workToPerform: "",
    location: "",
    startTime: "",
    endTime: "",
    observations: "",
    selectedRisks: {},
    requiredPpe: {},
    userId,
    createdBy,
    workOrderId: 0,
  });

  const [userIdentification, setUserIdentification] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [availableAreas, setAvailableAreas] = useState<Area[]>([]);
  const [availableSubAreas, setAvailableSubAreas] = useState<SubArea[]>([]);

  const [signatureData, setSignatureData] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Estados para OTP y flujo de dos pasos
  const [createdFormId, setCreatedFormId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [suggestions, setSuggestions] = useState<Usuario[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const riskCategories = {
    fisicos: [
      "Ruidos",
      "Temperaturas extremas",
      "Vibraciones",
      "Presiones anormales",
    ],
    quimicos: [
      "Gases y vapores",
      "Polvos inorgánicos",
      "Polvos orgánicos",
      "Humos",
      "Neblinas",
    ],
    biomecanicos: ["Posiciones forzadas", "Sobre esfuerzo", "Fatiga"],
    locativos: [
      "Pisos",
      "Techos",
      "Iluminación",
      "Almacenamiento",
      "Muros",
      "Orden y limpieza",
    ],
    mecanicos: ["Herramientas", "Máquinas", "Equipos"],
    electricos: [
      "Puestas a tierra",
      "Instalaciones en mal estado",
      "Instalaciones recargadas",
    ],
    transito: [
      "Colisiones",
      "Obstáculos",
      "Desplazamientos",
      "Atropellamientos",
    ],
    biologicos: ["Virus", "Hongos", "Bacterias"],
    psicosociales: [
      "Excesos de responsabilidad",
      "Problemas familiares",
      "Trabajo bajo presión",
      "Monotonía y rutina",
      "Problemas laborales",
    ],
    naturales: ["Terremotos", "Volcánicos"],
  };

  const ppeOptions = [
    "ARNÉS DE SEGURIDAD",
    "ROPA DE TRABAJO",
    "PROTECCIÓN RESPIRATORIA",
    "BOTAS DE SEGURIDAD",
    "CASCO",
    "GAFAS",
    "GUANTES DE PROTECCIÓN",
    "MASCARILLA",
  ];

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      workerName:
        prev.workerName || `${user.nombre} ${user.apellido || ""}`.trim(),
      position: prev.position || user.role?.nombreRol || "Técnico",
    }));

    setUserIdentification((prev) => prev || user.cedula || "");
  }, [user]);

  const isFormValid = useMemo(() => {
    const requiredFields = [
      formData.workerName?.trim(),
      userIdentification?.trim(),
      formData.position?.trim(),
      selectedClient,
      formData.workToPerform?.trim(),
      formData.location?.trim(),
      formData.startTime,
      formData.endTime,
      dateString,
      selectedOrder,
    ];

    const allRequiredFieldsFilled = requiredFields.every(
      (field) => field !== undefined && field !== null && field !== "",
    );

    const hasSelectedRisks =
      Object.keys(formData.selectedRisks || {}).length > 0 &&
      Object.values(formData.selectedRisks).some(
        (risks) => Array.isArray(risks) && risks.length > 0,
      );

    const hasSelectedPPE = Object.values(formData.requiredPpe || {}).some(
      (value) => value === true,
    );

    const hasSignature = !!signatureData;
    const hasAcceptedTerms = privacyAccepted;

    return (
      allRequiredFieldsFilled &&
      hasSelectedRisks &&
      hasSelectedPPE &&
      hasSignature &&
      hasAcceptedTerms
    );
  }, [
    formData,
    dateString,
    signatureData,
    privacyAccepted,
    userIdentification,
    selectedClient,
    selectedOrder,
  ]);

  const getValidationErrors = () => {
    const errors: string[] = [];

    if (!selectedOrder) errors.push("Orden de trabajo");
    if (!formData.workerName?.trim()) errors.push("Nombre del trabajador");
    if (!userIdentification?.trim()) errors.push("Cédula del trabajador");
    if (!formData.position?.trim()) errors.push("Cargo");
    if (!selectedClient) errors.push("Cliente");
    if (!formData.workToPerform?.trim()) errors.push("Descripción del trabajo");
    if (!formData.location?.trim()) errors.push("Ubicación");
    if (!formData.startTime) errors.push("Hora de inicio");
    if (!formData.endTime) errors.push("Hora de fin");
    if (!dateString) errors.push("Fecha");

    if (
      Object.keys(formData.selectedRisks || {}).length === 0 ||
      !Object.values(formData.selectedRisks).some(
        (risks) => Array.isArray(risks) && risks.length > 0,
      )
    ) {
      errors.push("Al menos un riesgo seleccionado");
    }

    if (
      !Object.values(formData.requiredPpe || {}).some((value) => value === true)
    ) {
      errors.push("Al menos un EPP o herramienta seleccionado");
    }

    if (!signatureData) errors.push("Firma");
    if (!privacyAccepted) errors.push("Aceptación de términos de seguridad");

    return errors;
  };

  useEffect(() => {
    loadUsersAndRoles();
    loadOrders();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadAreasByClient(
        (selectedClient as any).id_cliente || selectedClient.idCliente,
      );
    } else {
      setAvailableAreas([]);
      setAvailableSubAreas([]);
    }
  }, [selectedClient]);

  const loadUsersAndRoles = async () => {
    try {
      setIsLoading(true);
      const [usuariosData, rolesData] = await Promise.all([
        usersApi.getAllUsers(),
        rolesApi.getAllRoles(),
      ]);

      setUsuarios(usuariosData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      showModal({
        type: "error",
        title: "Error",
        message: "Error al cargar la lista de usuarios y roles",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const data = await getMyAssignedOrdersRequest();
      setOrders(data);
    } catch (error: any) {
      console.error("Error cargando órdenes del técnico:", error);
      setOrdersError(
        error.response?.data?.message ||
          "Error al cargar las órdenes del técnico",
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadAreasByClient = async (clientId: number) => {
    try {
      setIsLoading(true);
      const areasData = await areasAPI.getAllAreas(clientId);
      setAvailableAreas(areasData);
      setAvailableSubAreas([]);

      setFormData((prev) => ({
        ...prev,
        area: "",
        subArea: "",
      }));
    } catch (error) {
      console.error("Error cargando áreas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubAreasByArea = async (areaId: number) => {
    try {
      const subAreasData = await subAreasAPI.getAllSubAreas(areaId);
      setAvailableSubAreas(subAreasData);

      setFormData((prev) => ({
        ...prev,
        subArea: "",
      }));
    } catch (error) {
      console.error("Error cargando subáreas:", error);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const id = parseInt(orderId, 10);
    const order = orders.find((o) => o.orden_id === id) || null;
    setSelectedOrder(order);

    if (order?.cliente_empresa) {
      setSelectedClient(order.cliente_empresa as any);
      loadAreasByClient(order.cliente_empresa.id_cliente);
    } else {
      setSelectedClient(null);
      setAvailableAreas([]);
      setAvailableSubAreas([]);
    }

    let locationFromOrder = formData.location;
    if (order?.cliente_empresa) {
      const empresa = order.cliente_empresa as any;
      locationFromOrder =
        empresa.direccion ||
        order.cliente_empresa.localizacion ||
        locationFromOrder;
    }

    let newDateString = dateString;
    let startTimeFromOrder = formData.startTime;
    let endTimeFromOrder = formData.endTime;

    if (order?.fecha_inicio) {
      const [datePart, timePart] = order.fecha_inicio.split("T");
      newDateString = datePart;
      if (timePart) {
        startTimeFromOrder = timePart.slice(0, 5);
      }
    }

    if (order?.fecha_finalizacion) {
      const [, timePart] = order.fecha_finalizacion.split("T");
      if (timePart) {
        endTimeFromOrder = timePart.slice(0, 5);
      }
    }

    let workToPerformFromOrder = formData.workToPerform;
    if (!workToPerformFromOrder && order) {
      workToPerformFromOrder =
        order.comentarios || order.servicio.nombre_servicio || "";
    }

    setDateString(newDateString);

    setFormData((prev) => ({
      ...prev,
      workOrderId: order ? order.orden_id : 0,
      location: locationFromOrder || prev.location,
      startTime: startTimeFromOrder || prev.startTime,
      endTime: endTimeFromOrder || prev.endTime,
      workToPerform: workToPerformFromOrder || prev.workToPerform,
    }));
  };

  const handleWorkerNameChange = (value: string) => {
    if (isTechnician) return;

    setFormData((prev) => ({ ...prev, workerName: value }));

    if (value.length > 1) {
      const filtered = usuarios.filter((usuario) =>
        `${usuario.nombre} ${usuario.apellido}`
          .toLowerCase()
          .includes(value.toLowerCase()),
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);

      if (filtered.length === 1) {
        const usuario = filtered[0];
        if (usuario.cedula) {
          setUserIdentification(usuario.cedula || "");
        }
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectUser = (usuario: Usuario) => {
    if (isTechnician) return;

    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
    setFormData((prev) => ({
      ...prev,
      workerName: nombreCompleto,
      position: usuario.role?.nombreRol || "",
    }));

    if (usuario.cedula) {
      setUserIdentification(usuario.cedula || "");
    }

    setShowSuggestions(false);
  };

  const handleAreaChange = (areaId: string) => {
    const area = availableAreas.find((a) => a.idArea.toString() === areaId);
    setFormData((prev) => ({
      ...prev,
      area: area?.nombreArea || "",
      subArea: "",
    }));

    if (areaId) {
      loadSubAreasByArea(parseInt(areaId, 10));
    } else {
      setAvailableSubAreas([]);
    }
  };

  const handleSubAreaChange = (subAreaId: string) => {
    const subArea = availableSubAreas.find(
      (sa) => sa.idSubArea.toString() === subAreaId,
    );
    setFormData((prev) => ({
      ...prev,
      subArea: subArea?.nombreSubArea || "",
    }));
  };

  const handleRiskToggle = (category: string, risk: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedRisks: {
        ...prev.selectedRisks,
        [category]: prev.selectedRisks?.[category]?.includes(risk)
          ? prev.selectedRisks[category].filter((r: string) => r !== risk)
          : [...(prev.selectedRisks?.[category] || []), risk],
      },
    }));
  };

  const handlePpeToolToggle = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredPpe: {
        ...prev.requiredPpe,
        [item]: !prev.requiredPpe?.[item],
      },
    }));
  };

  const handleInputChange = (
    field: keyof Omit<AtsFormData, "date">,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (value: string) => {
    setDateString(value);
  };

  const handleSignatureSave = (signature: string) => {
    setSignatureData(signature);
  };

  const handleSignatureClear = () => {
    setSignatureData("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ----------------------------------------------------
    // PASO 1: Crear Formulario y Solicitar OTP
    // ----------------------------------------------------
    if (!createdFormId) {
      if (!selectedOrder) {
        showModal({
          type: "warning",
          title: "Campo requerido",
          message: "Debe seleccionar una orden de trabajo.",
        });
        return;
      }

      if (!isFormValid) {
        const errors = getValidationErrors();
        showModal({
          type: "warning",
          title: "Formulario incompleto",
          message: (
            <>
              <p>Por favor complete los siguientes campos antes de enviar:</p>
              <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </>
          ),
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const dateValue = dateString || new Date().toISOString().split("T")[0];

        const clientEmpresa = selectedOrder.cliente_empresa;
        const clientPersona = selectedOrder.cliente;

        const clientId = clientEmpresa?.id_cliente;
        const clientName =
          clientEmpresa?.nombre ||
          (clientPersona
            ? `${clientPersona.nombre} ${clientPersona.apellido ?? ""}`.trim()
            : "N/D");
        const clientNit = clientEmpresa?.nit;

        // Armamos datos para crear (SIN firma)
        const atsData: AtsFormData = {
          workerName: formData.workerName,
          workerIdentification: userIdentification,
          position: formData.position,
          clientId,
          clientName,
          clientNit,
          area: formData.area,
          subArea: formData.subArea,
          workToPerform: formData.workToPerform,
          location: formData.location,
          startTime: formData.startTime,
          endTime: formData.endTime,
          date: dateValue,
          observations: formData.observations,
          selectedRisks: formData.selectedRisks || {},
          requiredPpe: formData.requiredPpe || {},
          userId: formData.userId,
          createdBy: formData.createdBy,
          workOrderId: selectedOrder.orden_id,
        };

        // 1. Crear ATS en estado DRAFT
        const resp = await sgSstService.createAts(atsData as any);
        const newFormId = resp?.data?.form?.id;

        if (!newFormId) {
          throw new Error("No se pudo obtener el ID del formulario ATS creado");
        }

        // 2. Solicitar OTP
        await sgSstService.requestSignOtp(newFormId, "TECHNICIAN");

        setCreatedFormId(newFormId);
        setSuccessMessage(
          "ATS guardado correctamente. Se ha enviado un código OTP a tu correo.",
        );
        showModal({
          type: "success",
          title: "ATS Guardado",
          message:
            "Revisa tu correo, ingresa el código OTP y haz clic en Firmar.",
        });
      } catch (error: any) {
        console.error("❌ ERROR en el proceso:", error);
        showModal({
          type: "error",
          title: "Error",
          message: error.response?.data?.message || "Error al crear el ATS",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ----------------------------------------------------
    // PASO 2: Firmar con OTP
    // ----------------------------------------------------
    if (!otpCode.trim()) {
      showModal({
        type: "warning",
        title: "Código Requerido",
        message: "Por favor ingresa el código OTP enviado a tu correo.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const signPayload: SignFormData = {
        signerType: "TECHNICIAN",
        signatureData, // Enviamos firma ahora
        otpCode: otpCode.trim(),
      };

      await sgSstService.signForm(createdFormId, signPayload);

      showModal({
        type: "success",
        title: "¡Firmado!",
        message: "ATS firmado exitosamente con OTP.",
      });

      if (onSubmit) {
        onSubmit(formData as any);
      }
      onCancel();
    } catch (error: any) {
      console.error("Error firmando ATS:", error);
      showModal({
        type: "error",
        title: "Error al firmar",
        message: error.response?.data?.message || error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSectionStatus = (sectionNumber: number) => {
    switch (sectionNumber) {
      case 1:
        return (
          formData.workerName?.trim() &&
          userIdentification?.trim() &&
          formData.position?.trim()
        );
      case 2:
        return selectedClient && selectedOrder;
      case 3:
        return (
          dateString &&
          formData.startTime &&
          formData.endTime &&
          formData.location?.trim() &&
          formData.workToPerform?.trim()
        );
      case 4:
        return Object.values(formData.selectedRisks || {}).some(
          (risks) => Array.isArray(risks) && risks.length > 0,
        );
      case 5:
        return Object.values(formData.requiredPpe || {}).some(
          (value) => value === true,
        );
      case 6:
        return !!signatureData;
      case 7:
        return privacyAccepted;
      default:
        return true;
    }
  };

  const getClientContactDisplay = () => {
    const empresaContact = (selectedClient as any)?.contacto as
      | string
      | undefined;

    if (empresaContact && empresaContact.trim() !== "") {
      return empresaContact;
    }

    const personaClient = selectedOrder?.cliente;
    if (personaClient) {
      return `${personaClient.nombre} ${personaClient.apellido ?? ""}`.trim();
    }

    return "N/D";
  };

  const getClientPhoneDisplay = () => {
    if (selectedClient?.telefono) return selectedClient.telefono;
    if (selectedOrder?.cliente?.telefono) return selectedOrder.cliente.telefono;
    return "N/D";
  };

  const isOtpStep = createdFormId !== null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onCancel}>
          ← Volver
        </button>
        <h1 className={styles.title}>Análisis de Trabajo Seguro (ATS)</h1>

        <div
          className={`${styles.validationIndicator} ${
            isFormValid ? styles.valid : styles.invalid
          }`}
        >
          {isOtpStep
            ? "Código OTP pendiente"
            : isFormValid
              ? "✓ Formulario completo"
              : "✗ Formulario incompleto"}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {successMessage && (
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✅</div>
            <div className={styles.successText}>
              <strong>¡Paso 1 completado!</strong>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* SECCIÓN 1: INFORMACIÓN DEL TRABAJADOR */}
        <div
          className={`${styles.section} ${
            !getSectionStatus(1) ? styles.sectionIncomplete : ""
          }`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              1. Información del Trabajador
            </h2>
            {getSectionStatus(1) && (
              <span className={styles.sectionStatus}>✓</span>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nombre del Trabajador *
                {!formData.workerName?.trim() && (
                  <span className={styles.requiredIndicator}> (Requerido)</span>
                )}
              </label>
              <div className={styles.autocompleteContainer}>
                <input
                  type="text"
                  className={`${styles.input} ${
                    !formData.workerName?.trim() ? styles.inputError : ""
                  }`}
                  value={formData.workerName}
                  onChange={(e) => handleWorkerNameChange(e.target.value)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                  onFocus={() => {
                    if (!isTechnician && formData.workerName.length > 1) {
                      setShowSuggestions(true);
                    }
                  }}
                  required
                  placeholder="Escriba para buscar..."
                  disabled={isTechnician}
                />
                {isLoading && (
                  <div className={styles.loadingIndicator}>Cargando...</div>
                )}
                {!isTechnician && showSuggestions && suggestions.length > 0 && (
                  <div className={styles.suggestionsList}>
                    {suggestions.map((usuario) => (
                      <div
                        key={usuario.usuarioId}
                        className={styles.suggestionItem}
                        onClick={() => handleSelectUser(usuario)}
                      >
                        <div className={styles.suggestionName}>
                          {usuario.nombre} {usuario.apellido}
                        </div>
                        <div className={styles.suggestionRole}>
                          {usuario.role?.nombreRol}
                        </div>
                        <div className={styles.suggestionId}>
                          Cédula: {usuario.cedula || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Cédula del Trabajador *
                {!userIdentification?.trim() && (
                  <span className={styles.requiredIndicator}> (Requerido)</span>
                )}
              </label>
              <input
                type="text"
                className={`${styles.input} ${
                  !userIdentification?.trim() ? styles.inputError : ""
                }`}
                value={userIdentification}
                onChange={(e) => setUserIdentification(e.target.value)}
                placeholder="Número de cédula"
                required
                disabled={isTechnician}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Cargo *
                {!formData.position?.trim() && (
                  <span className={styles.requiredIndicator}> (Requerido)</span>
                )}
              </label>
              <select
                className={`${styles.input} ${
                  !formData.position?.trim() ? styles.inputError : ""
                }`}
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                required
                disabled={isTechnician}
              >
                <option value="">Seleccione un cargo</option>
                {roles.map((rol) => (
                  <option key={rol.rolId} value={rol.nombreRol}>
                    {rol.nombreRol}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: ORDEN Y CLIENTE */}
        <div
          className={`${styles.section} ${
            !getSectionStatus(2) ? styles.sectionIncomplete : ""
          }`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              2. Orden de Trabajo e Información del Cliente
            </h2>
            {getSectionStatus(2) && (
              <span className={styles.sectionStatus}>✓</span>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Orden de trabajo *
                {!selectedOrder && (
                  <span className={styles.requiredIndicator}> (Requerido)</span>
                )}
              </label>
              {ordersLoading ? (
                <p>Cargando órdenes...</p>
              ) : ordersError ? (
                <p className={styles.errorText}>{ordersError}</p>
              ) : (
                <select
                  className={`${styles.input} ${
                    !selectedOrder ? styles.inputError : ""
                  }`}
                  value={selectedOrder?.orden_id || ""}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  required
                >
                  <option value="">Seleccione una orden...</option>
                  {orders.map((o) => {
                    const personaClient = o.cliente;
                    const clientName =
                      o.cliente_empresa?.nombre ||
                      (personaClient
                        ? `${personaClient.nombre} ${personaClient.apellido ?? ""}`.trim()
                        : "N/D");

                    return (
                      <option key={o.orden_id} value={o.orden_id}>
                        #{o.orden_id} - {clientName} -{" "}
                        {o.servicio.nombre_servicio}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Cliente seleccionado</label>
              {selectedClient ? (
                <div className={styles.selectedClientCard}>
                  <div className={styles.clientCardHeader}>
                    <h3 className={styles.clientCardTitle}>
                      {selectedClient.nombre}
                    </h3>
                  </div>
                  <div className={styles.clientCardDetails}>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>NIT:</span>
                      <span className={styles.detailValue}>
                        {selectedClient.nit}
                      </span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Contacto:</span>
                      <span className={styles.detailValue}>
                        {getClientContactDisplay()}
                      </span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Email:</span>
                      <span className={styles.detailValue}>
                        {selectedClient.email}
                      </span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Teléfono:</span>
                      <span className={styles.detailValue}>
                        {getClientPhoneDisplay()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={styles.infoText}>
                  Seleccione una orden de trabajo para ver la información del
                  cliente.
                </p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Área{" "}
                <span className={styles.optionalIndicator}> (Opcional)</span>
              </label>
              <select
                className={styles.input}
                value={
                  availableAreas.find((a) => a.nombreArea === formData.area)
                    ?.idArea || ""
                }
                onChange={(e) => handleAreaChange(e.target.value)}
                disabled={!selectedClient || availableAreas.length === 0}
              >
                <option value="">
                  {selectedClient
                    ? "Seleccione un área (opcional)"
                    : "Seleccione una orden primero"}
                </option>
                {availableAreas.map((area) => (
                  <option key={area.idArea} value={area.idArea}>
                    {area.nombreArea}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Sub-Área{" "}
                <span className={styles.optionalIndicator}> (Opcional)</span>
              </label>
              <select
                className={styles.input}
                value={
                  availableSubAreas.find(
                    (sa) => sa.nombreSubArea === formData.subArea,
                  )?.idSubArea || ""
                }
                onChange={(e) => handleSubAreaChange(e.target.value)}
                disabled={!formData.area || availableSubAreas.length === 0}
              >
                <option value="">
                  {formData.area
                    ? "Seleccione una sub-área (opcional)"
                    : "Seleccione un área primero"}
                </option>
                {availableSubAreas.map((subArea) => (
                  <option key={subArea.idSubArea} value={subArea.idSubArea}>
                    {subArea.nombreSubArea}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: INFORMACIÓN DEL TRABAJO */}
        <div
          className={`${styles.section} ${
            !getSectionStatus(3) ? styles.sectionIncomplete : ""
          }`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>3. Información del Trabajo</h2>
            {getSectionStatus(3) && (
              <span className={styles.sectionStatus}>✓</span>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Fecha *
                {!dateString && (
                  <span className={styles.requiredIndicator}> (Requerido)</span>
                )}
              </label>
              <input
                type="date"
                className={`${styles.input} ${
                  !dateString ? styles.inputError : ""
                }`}
                value={dateString}
                onChange={(e) => handleDateChange(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Hora de Inicio *
                {!formData.startTime && (
                  <span className={styles.requiredIndicator}> (Requerido)</span>
                )}
              </label>
              <input
                type="time"
                className={`${styles.input} ${
                  !formData.startTime ? styles.inputError : ""
                }`}
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Hora de Fin *
                {!formData.endTime && (
                  <span className={styles.requiredIndicator}> (Requerido)</span>
                )}
              </label>
              <input
                type="time"
                className={`${styles.input} ${
                  !formData.endTime ? styles.inputError : ""
                }`}
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Ubicación *
                {!formData.location?.trim() && (
                  <span className={styles.requiredIndicator}> (Requerido)</span>
                )}
              </label>
              <input
                type="text"
                className={`${styles.input} ${
                  !formData.location?.trim() ? styles.inputError : ""
                }`}
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Ej: Planta 1, Oficina 204, etc."
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Descripción del Trabajo *
              {!formData.workToPerform?.trim() && (
                <span className={styles.requiredIndicator}> (Requerido)</span>
              )}
            </label>
            <textarea
              className={`${styles.textarea} ${
                !formData.workToPerform?.trim() ? styles.textareaError : ""
              }`}
              value={formData.workToPerform}
              onChange={(e) =>
                handleInputChange("workToPerform", e.target.value)
              }
              rows={3}
              required
              placeholder="Describa detalladamente el trabajo a realizar..."
            />
          </div>
        </div>

        {/* SECCIÓN 4: RIESGOS */}
        <div
          className={`${styles.section} ${
            !getSectionStatus(4) ? styles.sectionIncomplete : ""
          }`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              4. Identificación de Riesgos / Peligros
            </h2>
            {getSectionStatus(4) && (
              <span className={styles.sectionStatus}>✓</span>
            )}
            {!getSectionStatus(4) && (
              <span className={styles.requiredIndicator}>
                {" "}
                (Seleccione al menos uno)
              </span>
            )}
          </div>
          <p className={styles.sectionSubtitle}>
            Seleccione los riesgos a los que se encuentra expuesto:
          </p>

          <div className={styles.riskCategories}>
            {Object.entries(riskCategories).map(([category, risks]) => (
              <div key={category} className={styles.riskCategory}>
                <h3 className={styles.riskCategoryTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div className={styles.risksGrid}>
                  {risks.map((risk) => (
                    <label key={risk} className={styles.riskCheckbox}>
                      <input
                        type="checkbox"
                        checked={
                          formData.selectedRisks?.[category]?.includes(risk) ||
                          false
                        }
                        onChange={() => handleRiskToggle(category, risk)}
                      />
                      <span className={styles.checkboxLabel}>{risk}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 5: EPP */}
        <div
          className={`${styles.section} ${
            !getSectionStatus(5) ? styles.sectionIncomplete : ""
          }`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              5. Equipo y Herramientas Requeridas
            </h2>
            {getSectionStatus(5) && (
              <span className={styles.sectionStatus}>✓</span>
            )}
            {!getSectionStatus(5) && (
              <span className={styles.requiredIndicator}>
                {" "}
                (Seleccione al menos uno)
              </span>
            )}
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>
              Equipo de Protección Personal (EPP)
            </h3>
            <div className={styles.ppeGrid}>
              {ppeOptions.map((ppe) => (
                <label key={ppe} className={styles.ppeCheckbox}>
                  <input
                    type="checkbox"
                    checked={formData.requiredPpe?.[ppe] || false}
                    onChange={() => handlePpeToolToggle(ppe)}
                  />
                  <span className={styles.ppeLabel}>{ppe}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* SECCIÓN 6: OBSERVACIONES */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              6. Observaciones Adicionales
            </h2>
            <span className={styles.optionalIndicator}> (Opcional)</span>
          </div>
          <textarea
            className={styles.textarea}
            value={formData.observations}
            onChange={(e) => handleInputChange("observations", e.target.value)}
            rows={4}
            placeholder="Observaciones adicionales sobre el trabajo..."
          />
        </div>

        {/* SECCIÓN 7: FIRMA */}
        <div
          className={`${styles.section} ${
            !getSectionStatus(6) ? styles.sectionIncomplete : ""
          }`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>7. Firma del Trabajador</h2>
            {getSectionStatus(6) && (
              <span className={styles.sectionStatus}>✓</span>
            )}
            {!getSectionStatus(6) && (
              <span className={styles.requiredIndicator}> (Requerida)</span>
            )}
          </div>
          <p className={styles.sectionSubtitle}>
            {formData.workerName || "Trabajador"}, firme en el área inferior
            para confirmar el análisis de seguridad
          </p>

          <SignaturePad
            onSignatureSave={handleSignatureSave}
            onClear={handleSignatureClear}
          />

          {signatureData && (
            <div className={styles.signaturePreview}>
              <strong>Firma guardada:</strong>
              <img
                src={signatureData}
                alt="Firma del trabajador"
                className={styles.signatureImage}
              />
            </div>
          )}

          {/* INPUT PARA OTP */}
          {isOtpStep && (
            <div className={styles.otpSection}>
              <label className={styles.label}>
                Código OTP enviado a tu correo *
              </label>
              <input
                type="text"
                className={styles.input}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                placeholder="Ingresa los 6 dígitos"
                style={{
                  fontSize: "1.5rem",
                  letterSpacing: "0.25rem",
                  textAlign: "center",
                  maxWidth: "250px",
                  margin: "0 auto",
                  display: "block",
                }}
              />
              <p className={styles.otpHelpText} style={{ marginTop: "10px" }}>
                Revisa tu bandeja de entrada.
              </p>
            </div>
          )}
        </div>

        {/* SECCIÓN 8: TÉRMINOS */}
        <div
          className={`${styles.section} ${
            !getSectionStatus(7) ? styles.sectionIncomplete : ""
          }`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>8. Términos y Condiciones</h2>
            {getSectionStatus(7) && (
              <span className={styles.sectionStatus}>✓</span>
            )}
            {!getSectionStatus(7) && (
              <span className={styles.requiredIndicator}> (Requerida)</span>
            )}
          </div>
          <div className={styles.termsBox}>
            <p>Declaro que:</p>
            <ul className={styles.termsList}>
              <li>He leído y comprendido las instrucciones de seguridad.</li>
              <li>He identificado los riesgos asociados al trabajo.</li>
              <li>
                Cuento con el herramienta de protección personal necesario.
              </li>
              <li>Conozco los procedimientos de emergencia.</li>
              <li>
                Acepto realizar el trabajo de acuerdo a los estándares de
                seguridad.
              </li>
            </ul>
          </div>
          <label className={styles.privacyCheckbox}>
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              required
            />
            <span className={styles.checkboxLabel}>
              Confirmo que he leído y acepto los términos y condiciones de
              seguridad. *
            </span>
          </label>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`${styles.submitButton} ${
              !isFormValid && !isOtpStep ? styles.submitButtonDisabled : ""
            }`}
            disabled={
              isSubmitting ||
              (!isFormValid && !isOtpStep) ||
              (isOtpStep && !otpCode.trim()) ||
              (!!successMessage && !isOtpStep)
            }
          >
            {isSubmitting
              ? "Procesando..."
              : isOtpStep
                ? "Firmar con OTP"
                : "✅ Guardar y solicitar OTP"}
          </button>
        </div>

        {!isFormValid && !isOtpStep && (
          <div className={styles.validationMessage}>
            <strong>⚠️ Complete los siguientes campos:</strong>
            <ul>
              {getValidationErrors().map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
