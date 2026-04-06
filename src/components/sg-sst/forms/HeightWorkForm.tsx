import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type {
  HeightWorkFormData,
  SignFormData,
  HeightCatalogs,
  TermsAcceptancePayload,
} from "../../../interfaces/SgSstInterface";
import type { Usuario } from "../../../interfaces/UserInterfaces";
import type { Rol } from "../../../interfaces/RolesInterfaces";
import type { Client } from "../../../interfaces/ClientInterfaces";
import type { Order } from "../../../interfaces/OrderInterfaces";
import { usersApi } from "../../../api/users";
import { sgSstService } from "../../../api/sg-sst";
import { getMyAssignedOrdersRequest } from "../../../api/orders";
import SignaturePad from "../SignaturePad";
import styles from "../../../styles/components/sg-sst/forms/HeightWorkForm.module.css";
import { useAuth } from "../../../hooks/useAuth";
import { rolesApi } from "../../../api/roles";
import { useModal } from "../../../context/ModalContext";
import TermsModal from "../TermsModal";

interface HeightWorkFormProps {
  onSubmit: (data: HeightWorkFormData) => void;
  onCancel: () => void;
  userId: number;
  createdBy: number;
}

export default function HeightWorkForm({
  onSubmit,
  onCancel,
  userId,
  createdBy,
}: HeightWorkFormProps) {
  const { showModal } = useModal();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    workerName: "",
    identification: "",
    position: "",
    workDescription: "",
    location: "",
    estimatedTime: "",
    physicalCondition: false,
    instructionsReceived: false,
    fitForHeightWork: false,
    authorizerName: "",
    authorizerIdentification: "",
    userId,
    createdBy,
    workOrderId: 0,
  });

  const [selectedProtectionElementIds, setSelectedProtectionElementIds] =
    useState<number[]>([]);
  const [catalogs, setCatalogs] = useState<HeightCatalogs | null>(null);

  const [signatureData, setSignatureData] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [termsAcceptedVersion, setTermsAcceptedVersion] = useState<number | null>(
    null,
  );
  const [showTermsModal, setShowTermsModal] = useState(false);

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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      workerName:
        prev.workerName || `${user.nombre} ${user.apellido || ""}`.trim(),
      identification: prev.identification || user.cedula || "",
      position: prev.position || user.role?.nombreRol || "Técnico",
    }));
  }, [user]);

  useEffect(() => {
    loadUsersAndRoles();
    loadOrders();
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      const response = await sgSstService.getHeightsCatalogs();
      if (response.success && response.data) {
        setCatalogs(response.data);
      }
    } catch (error) {
      console.error("Error cargando catálogo de alturas:", error);
      showModal({
        type: "error",
        title: "Error",
        message: "No se pudieron cargar los elementos de protección",
      });
    }
  };

  const loadUsersAndRoles = async () => {
    try {
      setIsLoading(true);
      const [usuariosData, rolesData] = await Promise.all([
        usersApi.getAllUsers(),
        rolesApi.getAllRoles(),
      ]);
      setUsuarios(usuariosData || []);
      setRoles(rolesData || []);
    } catch (error) {
      console.error("Error cargando usuarios/roles:", error);
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
      setOrders(data || []);
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

  const redirectToReportsList = () => {
    setTimeout(() => {
      navigate("/sg-sst");
    }, 2000);
  };

  const handleWorkerNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      workerName: value,
      identification: "",
      position: "",
    }));

    if (value.length > 1) {
      const filtered = usuarios.filter((usuario) =>
        `${usuario.nombre} ${usuario.apellido}`
          .toLowerCase()
          .includes(value.toLowerCase()),
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectUser = (usuario: Usuario) => {
    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
    setFormData((prev) => ({
      ...prev,
      workerName: nombreCompleto,
      identification: usuario.cedula || "",
      position: usuario.role?.nombreRol || "",
    }));
    setShowSuggestions(false);
  };

  const handleSelectOrder = (orderId: string) => {
    const id = parseInt(orderId, 10);
    const order = orders.find((o) => o.orden_id === id) || null;
    setSelectedOrder(order);

    if (order?.cliente_empresa) {
      setSelectedClient(order.cliente_empresa as any);
    } else {
      setSelectedClient(null);
    }

    setFormData((prev) => {
      let location = prev.location;
      let workDescription = prev.workDescription;
      let estimatedTime = prev.estimatedTime;

      if (order?.cliente_empresa) {
        location =
          order.cliente_empresa.direccion ||
          order.cliente_empresa.localizacion ||
          location;
      }

      if (!workDescription) {
        workDescription =
          order?.comentarios || order?.servicio?.nombre_servicio || "";
      }

      if (!estimatedTime) {
        estimatedTime = order?.servicio?.duracion_estimada || "";
      }

      return {
        ...prev,
        workOrderId: order ? order.orden_id : 0,
        location,
        workDescription,
        estimatedTime,
      };
    });
  };

  const handleProtectionToggle = (elementId: number) => {
    setSelectedProtectionElementIds((prev) =>
      prev.includes(elementId)
        ? prev.filter((id) => id !== elementId)
        : [...prev, elementId],
    );
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatureSave = (signature: string) => {
    setSignatureData(signature);
  };

  const handleSignatureClear = () => {
    setSignatureData("");
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

  const isFormValid = useMemo(() => {
    const requiredFields = [
      formData.workerName?.trim(),
      formData.identification?.trim(),
      formData.workDescription?.trim(),
      formData.location?.trim(),
      selectedOrder,
    ];

    const allRequiredFieldsFilled = requiredFields.every(
      (field) => field !== undefined && field !== null && field !== "",
    );

    const hasSelectedProtection = selectedProtectionElementIds.length > 0;

    const safetyChecksOk =
      formData.physicalCondition &&
      formData.instructionsReceived &&
      formData.fitForHeightWork;

    const hasSignature = !!signatureData;
    const hasAcceptedTerms = !!termsAcceptedVersion;

    return (
      allRequiredFieldsFilled &&
      hasSelectedProtection &&
      safetyChecksOk &&
      hasSignature &&
      hasAcceptedTerms
    );
  }, [
    formData,
    signatureData,
    selectedOrder,
    selectedProtectionElementIds,
    termsAcceptedVersion,
  ]);

  const getValidationErrors = () => {
    const errors: string[] = [];

    if (!selectedOrder) errors.push("Orden de trabajo");
    if (!formData.workerName?.trim()) errors.push("Nombre del trabajador");
    if (!formData.identification?.trim()) errors.push("Cédula del trabajador");
    if (!formData.workDescription?.trim())
      errors.push("Descripción del trabajo");
    if (!formData.location?.trim()) errors.push("Ubicación específica");
    if (selectedProtectionElementIds.length === 0)
      errors.push("Al menos un elemento de protección seleccionado");
    if (!formData.physicalCondition)
      errors.push("Confirmar condiciones físicas para trabajo en alturas");
    if (!formData.instructionsReceived)
      errors.push("Confirmar que recibió instrucciones para trabajo en alturas");
    if (!formData.fitForHeightWork)
      errors.push("Confirmar que está apto para trabajo en alturas");
    if (!signatureData) errors.push("Firma del trabajador");
    if (!termsAcceptedVersion) errors.push("Aceptación de términos");

    return errors;
  };

  const getSectionStatus = (sectionNumber: number) => {
    switch (sectionNumber) {
      case 1:
        return formData.workerName?.trim() && formData.identification?.trim();
      case 2:
        return !!selectedOrder;
      case 3:
        return formData.workDescription?.trim() && formData.location?.trim();
      case 4: {
        const hasProtection = selectedProtectionElementIds.length > 0;
        const safetyChecksOk =
          formData.physicalCondition &&
          formData.instructionsReceived &&
          formData.fitForHeightWork;
        return hasProtection && safetyChecksOk;
      }
      case 5:
        return !!signatureData;
      case 6:
        return !!termsAcceptedVersion;
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createdFormId) {
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
      setSuccessMessage("");

      try {
        const termsAcceptances: TermsAcceptancePayload[] = [
          {
            termsType: "dataprivacy",
            termsVersion: termsAcceptedVersion!,
          },
          {
            termsType: "HEIGHT_WORK",
            termsVersion: termsAcceptedVersion!,
          },
        ];

        const submitData: HeightWorkFormData = {
          workerName: formData.workerName,
          identification: formData.identification || "",
          position: formData.position || "",
          workDescription: formData.workDescription || "",
          location: formData.location || "",
          estimatedTime: formData.estimatedTime || "",
          protectionElementIds: selectedProtectionElementIds,
          physicalCondition: formData.physicalCondition,
          instructionsReceived: formData.instructionsReceived,
          fitForHeightWork: formData.fitForHeightWork,
          authorizerName: formData.authorizerName || "",
          authorizerIdentification: formData.authorizerIdentification || "",
          termsAcceptances,
          userId: formData.userId,
          createdBy: formData.createdBy,
          workOrderId: formData.workOrderId,
        };

        const resp = await sgSstService.createHeightWork(submitData);
        const newFormId = resp?.data?.form?.id;

        if (!newFormId) {
          throw new Error(
            "No se pudo obtener el ID del formulario de trabajo en alturas creado",
          );
        }

        await sgSstService.requestSignOtp(newFormId, "TECHNICIAN");

        setCreatedFormId(newFormId);
        setSuccessMessage(
          "Permiso guardado. Se envió un código OTP a tu correo para firmar.",
        );
        showModal({
          type: "success",
          title: "Guardado",
          message:
            "Se ha enviado un código OTP a tu correo. Ingrésalo para firmar el permiso.",
        });
      } catch (error: any) {
        console.error("Error enviando Trabajo en Alturas:", error);
        showModal({
          type: "error",
          title: "Error",
          message: error.response?.data?.message || "Error al crear el permiso",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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
        signatureData,
        otpCode: otpCode.trim(),
      };

      await sgSstService.signForm(createdFormId, signPayload);

      showModal({
        type: "success",
        title: "¡Éxito!",
        message: "Permiso firmado exitosamente con OTP.",
      });

      const payload: HeightWorkFormData = {
        workerName: formData.workerName,
        identification: formData.identification || "",
        position: formData.position || "",
        workDescription: formData.workDescription || "",
        location: formData.location || "",
        estimatedTime: formData.estimatedTime || "",
        protectionElementIds: selectedProtectionElementIds,
        physicalCondition: formData.physicalCondition,
        instructionsReceived: formData.instructionsReceived,
        fitForHeightWork: formData.fitForHeightWork,
        authorizerName: formData.authorizerName || "",
        authorizerIdentification: formData.authorizerIdentification || "",
        termsAcceptances: [
          {
            termsType: "dataprivacy",
            termsVersion: termsAcceptedVersion!,
          },
          {
            termsType: "HEIGHT_WORK",
            termsVersion: termsAcceptedVersion!,
          },
        ],
        userId: formData.userId,
        createdBy: formData.createdBy,
        workOrderId: formData.workOrderId,
      };

      onSubmit(payload);
      redirectToReportsList();
    } catch (error: any) {
      console.error("Error firmando:", error);
      showModal({
        type: "error",
        title: "Error al firmar",
        message: error.response?.data?.message || error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOtpStep = createdFormId !== null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onCancel}>
          ← Volver
        </button>
        <h1 className={styles.title}>Permiso para Trabajo en Alturas</h1>

        <div
          className={`${styles.validationIndicator} ${isFormValid ? styles.valid : styles.invalid
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

        {/* 1. DATOS TRABAJADOR */}
        <div className={`${styles.section} ${!getSectionStatus(1) ? styles.sectionIncomplete : ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>1. Datos del Trabajador</h2>
            {getSectionStatus(1) && <span className={styles.sectionStatus}>✓</span>}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre Completo *</label>
              <div className={styles.autocompleteContainer}>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.workerName}
                  onChange={(e) => handleWorkerNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onFocus={() => {
                    if (formData.workerName.length > 1) {
                      setShowSuggestions(true);
                    }
                  }}
                  required
                  placeholder="Escriba para buscar trabajador..."
                />
                {isLoading && (
                  <div className={styles.loadingIndicator}>Cargando...</div>
                )}
                {showSuggestions && suggestions.length > 0 && (
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
                        <div className={styles.suggestionDetails}>
                          <span className={styles.suggestionDetail}>
                            Cédula: {usuario.cedula || "No registrada"}
                          </span>
                          {usuario.role?.nombreRol && (
                            <span className={styles.suggestionDetail}>
                              Cargo: {usuario.role.nombreRol}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Cédula *</label>
              <input
                type="text"
                className={`${styles.input} ${!formData.identification?.trim() ? styles.inputError : ""
                  }`}
                value={formData.identification}
                onChange={(e) =>
                  handleInputChange("identification", e.target.value)
                }
                required
                placeholder="Número de cédula"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Cargo *</label>
              <select
                className={`${styles.input} ${!formData.position?.trim() ? styles.inputError : ""
                  }`}
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                required
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

        {/* 2. ORDEN / CLIENTE */}
        <div className={`${styles.section} ${!getSectionStatus(2) ? styles.sectionIncomplete : ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>2. Orden de Trabajo e Información del Cliente</h2>
            {getSectionStatus(2) && <span className={styles.sectionStatus}>✓</span>}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Orden de trabajo *</label>
              {ordersLoading ? (
                <p>Cargando órdenes...</p>
              ) : ordersError ? (
                <p className={styles.errorText}>{ordersError}</p>
              ) : (
                <select
                  className={`${styles.input} ${!selectedOrder ? styles.inputError : ""}`}
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
                        ? `${personaClient.nombre} ${personaClient.apellido ?? ""
                          }`.trim()
                        : "N/D");

                    return (
                      <option key={o.orden_id} value={o.orden_id}>
                        #{o.orden_id} - {clientName} - {o.servicio.nombre_servicio}
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
                    <h3 className={styles.clientCardTitle}>{selectedClient.nombre}</h3>
                  </div>
                  <div className={styles.clientCardDetails}>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>NIT:</span>
                      <span className={styles.detailValue}>{selectedClient.nit}</span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Contacto:</span>
                      <span className={styles.detailValue}>{getClientContactDisplay()}</span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Email:</span>
                      <span className={styles.detailValue}>{selectedClient.email}</span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Teléfono:</span>
                      <span className={styles.detailValue}>{getClientPhoneDisplay()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={styles.infoText}>
                  Seleccione una orden de trabajo para ver la información del cliente.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. DESCRIPCIÓN TRABAJO */}
        <div className={`${styles.section} ${!getSectionStatus(3) ? styles.sectionIncomplete : ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>3. Descripción del Trabajo</h2>
            {getSectionStatus(3) && <span className={styles.sectionStatus}>✓</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Descripción del Trabajo a Realizar *</label>
            <textarea
              className={`${styles.textarea} ${!formData.workDescription?.trim() ? styles.textareaError : ""
                }`}
              value={formData.workDescription}
              onChange={(e) =>
                handleInputChange("workDescription", e.target.value)
              }
              rows={3}
              required
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ubicación Específica *</label>
              <textarea
                className={`${styles.textarea} ${!formData.location?.trim() ? styles.textareaError : ""
                  }`}
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                rows={2}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tiempo Estimado (Opcional)</label>
              <input
                type="text"
                className={styles.input}
                value={formData.estimatedTime}
                onChange={(e) =>
                  handleInputChange("estimatedTime", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* 4. ELEMENTOS PROTECCIÓN */}
        <div className={`${styles.section} ${!getSectionStatus(4) ? styles.sectionIncomplete : ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              4. Elementos de Protección Personal y Verificaciones
            </h2>
            {getSectionStatus(4) && <span className={styles.sectionStatus}>✓</span>}
          </div>

          <div className={styles.protectionGrid}>
            {catalogs?.protectionElements?.map((element) => (
              <label key={element.id} className={styles.protectionCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedProtectionElementIds.includes(element.id)}
                  onChange={() => handleProtectionToggle(element.id)}
                />
                <span className={styles.protectionLabel}>{element.name}</span>
              </label>
            ))}
          </div>

          <div className={styles.verificationsSection}>
            <h3 className={styles.subsectionTitle}>Verificaciones previas</h3>

            <div className={styles.verificationsList}>
              <label className={styles.verificationCheckbox}>
                <input
                  type="checkbox"
                  checked={formData.physicalCondition || false}
                  onChange={(e) =>
                    handleInputChange("physicalCondition", e.target.checked)
                  }
                  required
                />
                <span className={styles.verificationLabel}>
                  Poseo condiciones físicas adecuadas para trabajar en alturas
                </span>
              </label>

              <label className={styles.verificationCheckbox}>
                <input
                  type="checkbox"
                  checked={formData.instructionsReceived || false}
                  onChange={(e) =>
                    handleInputChange("instructionsReceived", e.target.checked)
                  }
                  required
                />
                <span className={styles.verificationLabel}>
                  He recibido instrucciones completas para trabajo en alturas
                </span>
              </label>

              <label className={styles.verificationCheckbox}>
                <input
                  type="checkbox"
                  checked={formData.fitForHeightWork || false}
                  onChange={(e) =>
                    handleInputChange("fitForHeightWork", e.target.checked)
                  }
                  required
                />
                <span className={styles.verificationLabel}>
                  Me declaro apto para realizar este trabajo en alturas
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 5. FIRMA */}
        <div className={`${styles.section} ${!getSectionStatus(5) ? styles.sectionIncomplete : ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>5. Firma del Trabajador</h2>
            {getSectionStatus(5) && <span className={styles.sectionStatus}>✓</span>}
          </div>

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

          {isOtpStep && (
            <div className={styles.otpSection} style={{ marginTop: "20px" }}>
              <label className={styles.label}>Código OTP enviado a tu correo *</label>
              <input
                type="text"
                className={styles.input}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                placeholder="Ingresa los 6 dígitos"
              />
            </div>
          )}
        </div>

        {/* 6. TÉRMINOS */}
        <div className={`${styles.section} ${!getSectionStatus(6) ? styles.sectionIncomplete : ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>6. Términos y Condiciones</h2>
            {getSectionStatus(6) && <span className={styles.sectionStatus}>✓</span>}
          </div>

          <div className={styles.termsBox}>
            <p>Declaro que:</p>
            <ul className={styles.termsList}>
              <li>
                He recibido entrenamiento para{" "}
                <button
                  type="button"
                  className={styles.termsLink}
                  onClick={() => setShowTermsModal(true)}
                >
                  trabajo en alturas
                </button>.
              </li>
              <li>Conozco y utilizaré los elementos de protección personal indicados.</li>
              <li>He verificado el estado de los equipos y sistemas de protección.</li>
              <li>Informaré inmediatamente cualquier condición insegura.</li>
              <li>Acepto seguir los procedimientos establecidos para trabajo en alturas.</li>
            </ul>
          </div>

          <label className={styles.privacyCheckbox}>
            <input
              type="checkbox"
              checked={!!termsAcceptedVersion}
              onChange={(e) => {
                if (!e.target.checked) setTermsAcceptedVersion(null);
              }}
            />
            <span className={styles.checkboxLabel}>
              Confirmo que he leído, comprendido y acepto los{" "}
              <button
                type="button"
                className={styles.termsLink}
                onClick={() => setShowTermsModal(true)}
              >
                términos y condiciones
              </button>{" "}
              para trabajo en alturas. *
            </span>
          </label>
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="submit"
            className={`${styles.submitButton} ${!isFormValid && !isOtpStep ? styles.submitButtonDisabled : ""
              }`}
            disabled={
              isSubmitting ||
              (!isFormValid && !isOtpStep) ||
              (isOtpStep && !otpCode.trim())
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

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={(version) => {
          setTermsAcceptedVersion(version);
          setShowTermsModal(false);
        }}
        onReject={() => {
          setTermsAcceptedVersion(null);
          setShowTermsModal(false);
        }}
        type="height_work"
      />
    </div>
  );
}