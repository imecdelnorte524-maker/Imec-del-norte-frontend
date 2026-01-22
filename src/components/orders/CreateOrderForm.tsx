import { useState, useEffect } from "react";
import { createOrderRequest } from "../../api/orders";
import { getMaintenanceTypesRequest } from "../../api/maintenance"; // <--- Nuevo import
import api from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import type {
  CreateOrderData,
  MaintenanceType,
} from "../../interfaces/OrderInterfaces";
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
    tipo_servicio: "",
    maintenance_type_id: undefined, // <--- Nuevo campo
  });

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [servicios, setServicios] = useState<ServiceOption[]>([]);
  const [empresas, setEmpresas] = useState<ClientCompanyOption[]>([]);
  const [, setEquipmentOptions] = useState<Equipment[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>(
    [],
  );

  // Nuevo estado para la lista de tipos de mantenimiento
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>(
    [],
  );

  const [, setSelectedService] = useState<ServiceOption | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [, setLoadingEquipment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setEquipmentError] = useState<string | null>(null);

  const roleName = user?.role?.nombreRol || "";
  const isSecretaria = roleName === "Secretaria";
  const isCliente = roleName === "Cliente";

  // Lógica para mostrar equipos
  const isEquipmentCategory = (categoria?: string | null) =>
    [
      "Aires Acondicionados",
      "Redes Eléctricas",
      "Redes Contra Incendios",
    ].includes(categoria || "");

  // Lógica para mostrar Tipos de Mantenimiento (Preventivo/Correctivo)
  const requiresMaintenanceType = (): boolean => {
    return (
      formData.tipo_servicio === "Mantenimiento" ||
      formData.tipo_servicio === "Mantenimiento e Instalación"
    );
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
      setEmpresas((prev) => [
        ...prev,
        { idCliente: client.idCliente, nombre: client.nombre, nit: client.nit },
      ]);
      setFormData((prev) => ({
        ...prev,
        cliente_empresa_id: client.idCliente,
      }));
    }
    if (isAdmin || isSecretaria) refreshClients();
    handleCloseModal();
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        setError(null);

        // 1. Cargar servicios
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

        // 2. Cargar Tipos de Mantenimiento
        try {
          const types = await getMaintenanceTypesRequest();
          setMaintenanceTypes(types);
        } catch (e) {
          console.error("Error cargando tipos de mantenimiento", e);
        }

        if (!user) return;

        // 3. Cargar Empresas
        if (isAdmin || isSecretaria) {
          const clientsRes = await api.get("/clients");
          const clientsData = clientsRes.data?.data || [];
          setEmpresas(
            clientsData.map((c: any) => ({
              idCliente: c.idCliente,
              nombre: c.nombre,
              nit: c.nit,
            })),
          );
        }

        if (isCliente) {
          const clientsRes = await api.get("/clients/my");
          const clientsData = clientsRes.data?.data || [];
          const mappedClients = clientsData.map((c: any) => ({
            idCliente: c.idCliente,
            nombre: c.nombre,
            nit: c.nit,
          }));
          setEmpresas(mappedClients);

          if (mappedClients.length === 1) {
            setFormData((prev) => ({
              ...prev,
              cliente_empresa_id: mappedClients[0].idCliente,
            }));
          }
          if (mappedClients.length === 0) {
            setError(
              "No tiene una empresa registrada. Debe crear una empresa antes de solicitar una orden de servicio.",
            );
            playErrorSound();
          }
        }
      } catch (err: any) {
        console.error("Error cargando datos:", err);
        setError(err.response?.data?.message || "Error al cargar datos");
        playErrorSound();
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user, isAdmin, isSecretaria, isCliente]);

  // Cargar equipos
  useEffect(() => {
    const service =
      servicios.find((s) => s.servicioId === formData.servicio_id) || null;
    setSelectedService(service);
    setEquipmentOptions([]);
    setSelectedEquipmentIds([]);
    setEquipmentError(null);

    if (
      !service ||
      !formData.cliente_empresa_id ||
      !isEquipmentCategory(service.categoriaServicio)
    ) {
      return;
    }

    const loadEquipment = async () => {
      try {
        setLoadingEquipment(true);
        const equipment = await getEquipmentByClientRequest(
          formData.cliente_empresa_id,
        );
        setEquipmentOptions(equipment);
        if (equipment.length === 0) {
          setEquipmentError(
            "No hay equipos registrados para esta empresa. Registre la hoja de vida primero.",
          );
        }
      } catch (err: any) {
        setEquipmentError(
          err.response?.data?.message || "Error al cargar equipos",
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
      setError("Seleccione un servicio");
      playErrorSound();
      return;
    }
    if (!formData.tipo_servicio) {
      setError("Seleccione el tipo de servicio");
      playErrorSound();
      return;
    }

    const debeElegirEmpresa =
      isAdmin || isSecretaria || (isCliente && empresas.length > 1);
    if (
      debeElegirEmpresa &&
      (!formData.cliente_empresa_id || formData.cliente_empresa_id === 0)
    ) {
      setError("Seleccione la empresa");
      playErrorSound();
      return;
    }

    if (requiresMaintenanceType() && !formData.maintenance_type_id) {
      setError("Seleccione el tipo de mantenimiento (Preventivo/Correctivo).");
      playErrorSound();
      return;
    }

    if (isCliente && empresas.length === 0) {
      setError("No tiene una empresa registrada.");
      playErrorSound();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: CreateOrderData = {
        ...formData,
        equipmentIds:
          selectedEquipmentIds.length > 0 ? selectedEquipmentIds : undefined,
        maintenance_type_id: requiresMaintenanceType()
          ? formData.maintenance_type_id
          : undefined,
      };

      await createOrderRequest(payload);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al crear la orden");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "servicio_id" ||
        name === "cliente_empresa_id" ||
        name === "maintenance_type_id"
          ? parseInt(value, 10)
          : value,
    }));
  };

  if (loadingData) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Crear Nueva Orden</h1>
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
        {(isAdmin || isSecretaria || (isCliente && empresas.length > 1)) && (
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
              {empresas.map((e) => (
                <option key={e.idCliente} value={e.idCliente}>
                  {e.nombre} ({e.nit})
                </option>
              ))}
            </select>
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
          </div>
        )}
        {isCliente && empresas.length === 0 && !error && (
          <div className={styles.formGroup}>
            <p className={styles.infoText}>No tiene empresa. Cree una.</p>
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
          <label htmlFor="servicio_id">Servicio *</label>
          <select
            id="servicio_id"
            name="servicio_id"
            value={formData.servicio_id}
            onChange={handleChange}
            required
          >
            <option value={0}>Seleccionar servicio...</option>
            {servicios.map((s) => (
              <option key={s.servicioId} value={s.servicioId}>
                {s.nombreServicio}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de servicio */}
        <div className={styles.formGroup}>
          <label htmlFor="tipo_servicio">Tipo de servicio *</label>
          <select
            id="tipo_servicio"
            name="tipo_servicio"
            value={formData.tipo_servicio || ""}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar...</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Instalación">Instalación</option>
            <option value="Mantenimiento e Instalación">
              Mantenimiento e Instalación
            </option>
          </select>
        </div>

        {/* NUEVO SELECT: Tipo de Mantenimiento (Preventivo, Correctivo) */}
        {requiresMaintenanceType() && (
          <div className={styles.formGroup}>
            <label htmlFor="maintenance_type_id">
              Clase de Mantenimiento *
            </label>
            <select
              id="maintenance_type_id"
              name="maintenance_type_id"
              value={formData.maintenance_type_id || 0}
              onChange={handleChange}
              required
            >
              <option value={0}>Seleccionar clase...</option>
              {maintenanceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Comentarios */}
        <div className={styles.formGroup}>
          <label htmlFor="comentarios">Comentarios</label>
          <textarea
            id="comentarios"
            name="comentarios"
            value={formData.comentarios}
            onChange={handleChange}
            rows={5}
            placeholder="Detalles adicionales..."
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
              loading || formData.servicio_id === 0 || !formData.tipo_servicio
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
