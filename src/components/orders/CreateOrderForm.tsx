import { useState, useEffect } from "react";
import { createOrderRequest } from "../../api/orders";
import api from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import type { CreateOrderData } from "../../interfaces/OrderInterfaces";
import type { Equipment } from "../../interfaces/EquipmentInterfaces";
import { getEquipmentByClientRequest } from "../../api/equipment";
import styles from "../../styles/components/orders/CreateOrderForm.module.css";
import type { Client } from "../../interfaces/ClientInterfaces";
import ClientModal from "../clients/ClientModal";
import { useClients } from "../../hooks/useClients";
import { playErrorSound } from "../../utils/sounds";

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ServiceOption {
  servicioId: number;
  nombreServicio: string;
  descripcion?: string | null;
  precioBase: number;
  categoriaServicio?: string | null;
  tipoTrabajo?: string | null;
  tipoMantenimiento?: string | null;
}

interface ClientCompanyOption {
  idCliente: number;
  nombre: string;
  nit: string;
}

export default function CreateOrderForm({ onSuccess, onCancel }: Props) {
  const { user, isAdmin } = useAuth();
  const { refreshClients } = useClients();

  const [formData, setFormData] = useState<CreateOrderData>({
    servicio_id: 0,
    comentarios: "",
    cliente_empresa_id: 0,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [servicios, setServicios] = useState<ServiceOption[]>([]);
  const [empresas, setEmpresas] = useState<ClientCompanyOption[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | 0>(0);

  const [selectedService, setSelectedService] = useState<ServiceOption | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);

  const roleName = user?.role?.nombreRol || "";
  const isSecretaria = roleName === "Secretaria";
  const isCliente = roleName === "Cliente";

  const isEquipmentCategory = (categoria?: string | null) =>
    [
      "Aires Acondicionados",
      "Redes Eléctricas",
      "Redes Contra Incendios",
    ].includes(categoria || "");

  const requiresEquipment = (): boolean => {
    if (!selectedService) return false;
    const isEquipCat = isEquipmentCategory(selectedService.categoriaServicio);
    const isMaintenance = selectedService.tipoTrabajo === "Mantenimiento";
    return isEquipCat && isMaintenance;
  };

  const handleCreate = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleModalSuccess = (client?: Client) => {
    if (client) {
      // Añadir empresa localmente y seleccionarla
      setEmpresas((prev) => [
        ...prev,
        {
          idCliente: client.idCliente,
          nombre: client.nombre,
          nit: client.nit,
        },
      ]);
      setFormData((prev) => ({
        ...prev,
        cliente_empresa_id: client.idCliente,
      }));
    }

    if (isAdmin || isSecretaria) {
      // Para admin/secretaria puedes refrescar listado global si lo usas en otras vistas
      refreshClients();
    }

    handleCloseModal();
  };

  // Cargar servicios y empresas según rol
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        setError(null);

        // Cargar servicios desde backend
        const servicesRes = await api.get("/services");
        const servicesData = servicesRes.data?.data || [];
        const mappedServices: ServiceOption[] = servicesData.map((s: any) => ({
          servicioId: s.servicioId,
          nombreServicio: s.nombreServicio,
          descripcion: s.descripcion ?? null,
          categoriaServicio: s.categoriaServicio ?? null,
          tipoTrabajo: s.tipoTrabajo ?? null,
          tipoMantenimiento: s.tipoMantenimiento ?? null,
          precioBase: s.precioBase ?? 0,
        }));
        setServicios(mappedServices);

        if (!user) return;

        // ADMIN / SECRETARIA: todas las empresas
        if (isAdmin || isSecretaria) {
          const clientsRes = await api.get("/clients");
          const clientsData = clientsRes.data?.data || [];
          const mappedClients: ClientCompanyOption[] = clientsData.map(
            (c: any) => ({
              idCliente: c.idCliente,
              nombre: c.nombre,
              nit: c.nit,
            })
          );
          setEmpresas(mappedClients);
        }

        // CLIENTE: solo SUS empresas (endpoint /clients/my)
        if (isCliente) {
          const clientsRes = await api.get("/clients/my");
          const clientsData = clientsRes.data?.data || [];
          const mappedClients: ClientCompanyOption[] = clientsData.map(
            (c: any) => ({
              idCliente: c.idCliente,
              nombre: c.nombre,
              nit: c.nit,
            })
          );
          setEmpresas(mappedClients);

          if (mappedClients.length === 1) {
            setFormData((prev) => ({
              ...prev,
              cliente_empresa_id: mappedClients[0].idCliente,
            }));
          }

          if (mappedClients.length === 0) {
            setError(
              "No tiene una empresa registrada. Debe crear una empresa antes de solicitar una orden de servicio."
            );
            playErrorSound();
          }
        }
      } catch (err: any) {
        console.error("Error cargando datos para orden:", err);
        const backendMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Error al cargar servicios o empresas";
        setError(
          Array.isArray(backendMessage)
            ? backendMessage.join(", ")
            : backendMessage
        );
        playErrorSound();
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user, isAdmin, isSecretaria, isCliente]);

  // Cargar equipos cuando se seleccione empresa + servicio que requiera equipo
  useEffect(() => {
    const service =
      servicios.find((s) => s.servicioId === formData.servicio_id) || null;
    setSelectedService(service);
    setEquipmentOptions([]);
    setSelectedEquipmentId(0);
    setEquipmentError(null);

    if (
      !service ||
      !formData.cliente_empresa_id ||
      !isEquipmentCategory(service.categoriaServicio) ||
      service.tipoTrabajo !== "Mantenimiento"
    ) {
      return;
    }

    const loadEquipment = async () => {
      try {
        setLoadingEquipment(true);
        setEquipmentError(null);
        const equipment = await getEquipmentByClientRequest(
          formData.cliente_empresa_id
        );
        setEquipmentOptions(equipment);
        if (equipment.length === 0) {
          setEquipmentError(
            "No hay equipos registrados para esta empresa. Debe registrar la hoja de vida del equipo antes de crear esta orden de mantenimiento."
          );
        }
      } catch (err: any) {
        console.error("Error cargando equipos:", err);
        const backendMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Error al cargar los equipos de la empresa";
        setEquipmentError(
          Array.isArray(backendMessage)
            ? backendMessage.join(", ")
            : backendMessage
        );
      } finally {
        setLoadingEquipment(false);
      }
    };

    loadEquipment();
  }, [formData.servicio_id, formData.cliente_empresa_id, servicios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.servicio_id === 0) {
      setError("Por favor seleccione un servicio");
      playErrorSound();
      return;
    }

    // Solo Admin/Secretaria (o Cliente con más de una empresa) deben escoger empresa
    const debeElegirEmpresa =
      isAdmin || isSecretaria || (isCliente && empresas.length > 1);

    if (
      debeElegirEmpresa &&
      (!formData.cliente_empresa_id || formData.cliente_empresa_id === 0)
    ) {
      setError("Por favor seleccione la empresa");
      playErrorSound();
      return;
    }

    if (requiresEquipment()) {
      if (equipmentOptions.length === 0) {
        setError(
          "Esta orden requiere asociar un equipo, pero la empresa no tiene equipos registrados. Registre primero la hoja de vida del equipo."
        );
        playErrorSound();
        return;
      }
      if (!selectedEquipmentId) {
        setError("Debe seleccionar el equipo para el mantenimiento.");
        playErrorSound();
        return;
      }
    }

    if (isCliente && empresas.length === 0) {
      setError(
        "No tiene una empresa registrada. Debe crear una empresa antes de solicitar una orden de servicio."
      );
      playErrorSound();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: CreateOrderData = {
        ...formData,
        equipo_id:
          requiresEquipment() && selectedEquipmentId
            ? selectedEquipmentId
            : undefined,
      };

      await createOrderRequest(payload);
      onSuccess();
    } catch (err: any) {
      console.error("Error al crear la orden:", err);
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error al crear la orden de servicio";

      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "servicio_id" || name === "cliente_empresa_id"
          ? parseInt(value, 10)
          : value,
    }));
  };

  if (loadingData) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Crear Nueva Orden de Servicio</h1>
          <button onClick={onCancel} className={styles.cancelButton}>
            Cancelar
          </button>
        </div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Crear Nueva Orden de Servicio</h1>
        <button onClick={onCancel} className={styles.cancelButton}>
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.error}>
            {error}
            {error.includes("empresa") && (
              <div style={{ marginTop: "8px" }}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleCreate}
                >
                  Crear empresa
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empresa */}
        {(isAdmin || isSecretaria) && (
          <div className={styles.formGroup}>
            <label htmlFor="cliente_empresa_id">Empresa *</label>
            <select
              id="cliente_empresa_id"
              name="cliente_empresa_id"
              value={formData.cliente_empresa_id}
              onChange={handleChange}
              required
            >
              <option value={0}>Seleccionar empresa...</option>
              {empresas.map((empresa) => (
                <option key={empresa.idCliente} value={empresa.idCliente}>
                  {empresa.nombre} ({empresa.nit})
                </option>
              ))}
            </select>
          </div>
        )}

        {isCliente && empresas.length > 1 && (
          <div className={styles.formGroup}>
            <label htmlFor="cliente_empresa_id">Empresa *</label>
            <select
              id="cliente_empresa_id"
              name="cliente_empresa_id"
              value={formData.cliente_empresa_id}
              onChange={handleChange}
              required
            >
              <option value={0}>Seleccionar empresa...</option>
              {empresas.map((empresa) => (
                <option key={empresa.idCliente} value={empresa.idCliente}>
                  {empresa.nombre} ({empresa.nit})
                </option>
              ))}
            </select>
            <p className={styles.helperText}>
              Solo se muestran las empresas donde usted es usuario de contacto.
            </p>
          </div>
        )}

        {isCliente && empresas.length === 1 && (
          <div className={styles.formGroup}>
            <label>Empresa</label>
            <input
              type="text"
              value={`${empresas[0].nombre} (${empresas[0].nit})`}
              disabled
            />
            <p className={styles.helperText}>
              Esta empresa se usará para la orden de servicio.
            </p>
          </div>
        )}

        {isCliente && empresas.length === 0 && !error && (
          <div className={styles.formGroup}>
            <label>Empresa</label>
            <p className={styles.infoText}>
              No tiene una empresa registrada. Debe crear una empresa antes de
              solicitar una orden de servicio.
            </p>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCreate}
            >
              Crear empresa
            </button>
          </div>
        )}

        {/* Servicio */}
        <div className={styles.formGroup}>
          <label htmlFor="servicio_id">Tipo de Servicio *</label>
          <select
            id="servicio_id"
            name="servicio_id"
            value={formData.servicio_id}
            onChange={handleChange}
            required
          >
            <option value={0}>Seleccionar servicio...</option>
            {servicios.map((servicio) => (
              <option key={servicio.servicioId} value={servicio.servicioId}>
                {servicio.nombreServicio}
              </option>
            ))}
          </select>

          {selectedService && (
            <div className={styles.serviceTags}>
              {selectedService.categoriaServicio && (
                <span className={styles.tag}>
                  {selectedService.categoriaServicio}
                </span>
              )}

              {selectedService.tipoTrabajo && (
                <span className={styles.tagSecondary}>
                  {selectedService.tipoTrabajo}
                </span>
              )}

              {selectedService.tipoTrabajo === "Mantenimiento" &&
                selectedService.tipoMantenimiento && (
                  <span className={styles.tagMaintenance}>
                    {selectedService.tipoMantenimiento}
                  </span>
                )}
            </div>
          )}
        </div>

        {/* Equipo */}
        {requiresEquipment() && (
          <div className={styles.formGroup}>
            <label htmlFor="equipo_id">Equipo para mantenimiento *</label>

            {loadingEquipment && (
              <p className={styles.infoText}>Cargando equipos...</p>
            )}

            {equipmentError && (
              <p className={styles.error}>{equipmentError}</p>
            )}

            {!loadingEquipment && equipmentOptions.length > 0 && (
              <select
                id="equipo_id"
                name="equipo_id"
                value={selectedEquipmentId || 0}
                onChange={(e) =>
                  setSelectedEquipmentId(parseInt(e.target.value, 10))
                }
                required
              >
                <option value={0}>Seleccionar equipo...</option>
                {equipmentOptions.map((eq) => (
                  <option key={eq.equipmentId} value={eq.equipmentId}>
                    {eq.name}
                    {eq.code ? ` [${eq.code}]` : ""}
                  </option>
                ))}
              </select>
            )}

            {!loadingEquipment &&
              !equipmentError &&
              equipmentOptions.length === 0 && (
                <p className={styles.infoText}>
                  No hay equipos registrados para esta empresa. Primero debe
                  crear la hoja de vida del equipo.
                </p>
              )}
          </div>
        )}

        {/* Comentarios */}
        <div className={styles.formGroup}>
          <label htmlFor="comentarios">Comentarios (opcional)</label>
          <textarea
            id="comentarios"
            name="comentarios"
            value={formData.comentarios}
            onChange={handleChange}
            placeholder="Describa detalles adicionales sobre el servicio requerido..."
            rows={5}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.secondaryButton}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              formData.servicio_id === 0 ||
              ((isAdmin ||
                isSecretaria ||
                (isCliente && empresas.length > 1)) &&
                formData.cliente_empresa_id === 0) ||
              (isCliente && empresas.length === 0) ||
              (requiresEquipment() &&
                (equipmentOptions.length === 0 || !selectedEquipmentId))
            }
            className={styles.primaryButton}
          >
            {loading ? "Creando..." : "Crear Orden"}
          </button>
        </div>
      </form>

      <ClientModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingClient={editingClient}
      />
    </div>
  );
}