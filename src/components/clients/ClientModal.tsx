import React, { useState, useEffect, useRef } from "react";
import { clients as clientsAPI } from "../../api/clients";
import { areas as areasAPI } from "../../api/areas";
import { subAreas as subAreasAPI } from "../../api/subAreas";
import { imagesApi } from "../../api/images";
import { usersApi as usersAPI } from "../../api/users";
import { useAuth } from "../../hooks/useAuth";
import type {
  Client,
  CreateClientDto,
  ClientFormData,
  Usuario,
} from "../../interfaces/ClientInterfaces";
import styles from "../../styles/components/clients/ClientModal.module.css";
import { playErrorSound } from "../../utils/sounds";
import type { AreaFormData } from "../../interfaces/AreaInterfaces";
import type { SubAreaFormData } from "../../interfaces/SubAreaInterfaces";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client?: Client) => void;
  editingClient?: Client | null;
}

export default function ClientModal({
  isOpen,
  onClose,
  onSuccess,
  editingClient,
}: ClientModalProps) {
  const { user } = useAuth();
  const roleName = user?.role?.nombreRol || "";
  const isCliente = roleName === "Cliente";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<Usuario[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Nueva área
  const [newAreaName, setNewAreaName] = useState("");
  // Nueva subárea
  const [selectedAreaForSubarea, setSelectedAreaForSubarea] = useState<
    number | null
  >(null);
  const [selectedParentSubarea, setSelectedParentSubarea] = useState<
    number | null
  >(null);
  const [newSubareaName, setNewSubareaName] = useState("");
  const [isSubareaModalOpen, setIsSubareaModalOpen] = useState(false);

  const [formData, setFormData] = useState<ClientFormData>({
    nombre: "",
    nit: "",
    // Campos de dirección separados
    direccionBase: "",
    barrio: "",
    ciudad: "",
    departamento: "",
    pais: "Colombia",
    contacto: "",
    email: "",
    telefono: "",
    localizacion: "",
    fecha_creacion: "",
    idUsuarioContacto: null,
    areas: [],
  });

  // Función para generar URL de Google Maps
  const generateGoogleMapsURL = (addressData: {
    nombre: string;
    direccionBase: string;
    barrio: string;
    ciudad: string;
    departamento: string;
    pais: string;
  }): string => {
    const { nombre, direccionBase, barrio, ciudad, departamento, pais } = addressData;

    // Verificar campos mínimos requeridos
    if ( !nombre || !direccionBase || !ciudad) {
      return "";
    }

    // Construir dirección de forma inteligente
    const parts = [];

    if (nombre.trim()) parts.push(nombre.trim());
    if (direccionBase.trim()) parts.push(direccionBase.trim());
    if (barrio.trim()) parts.push(barrio.trim());
    if (ciudad.trim()) parts.push(ciudad.trim());
    if (departamento.trim()) parts.push(departamento.trim());
    if (pais.trim()) parts.push(pais.trim());

    // Eliminar duplicados consecutivos
    const cleanParts = parts.filter((part, index, arr) => {
      return index === 0 || part !== arr[index - 1];
    });

    const fullAddress = cleanParts.join(", ");

    if (!fullAddress) return "";

    // Codificar para URL
    const encodedAddress = encodeURIComponent(fullAddress);

    // Retornar URL de Google Maps
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  // Efecto para generar automáticamente la URL de Google Maps
  useEffect(() => {
    const url = generateGoogleMapsURL({
      nombre: formData.nombre,
      direccionBase: formData.direccionBase,
      barrio: formData.barrio,
      ciudad: formData.ciudad,
      departamento: formData.departamento,
      pais: formData.pais,
    });

    if (url) {
      setFormData((prev) => ({
        ...prev,
        localizacion: url,
      }));
    }
  }, [
    formData.direccionBase,
    formData.barrio,
    formData.ciudad,
    formData.departamento,
    formData.pais,
  ]);

  const resetForm = () => {
    setFormData({
      nombre: "",
      nit: "",
      direccionBase: "",
      barrio: "",
      ciudad: "",
      departamento: "",
      pais: "Colombia",
      contacto: "",
      email: "",
      telefono: "",
      localizacion: "",
      fecha_creacion: "",
      idUsuarioContacto: null,
      areas: [],
    });
    setUserSearch("");
    setNewAreaName("");
    setNewSubareaName("");
    setSelectedAreaForSubarea(null);
    setSelectedParentSubarea(null);
    setLogoFile(null);
    setLogoPreview(null);
    setIsSubareaModalOpen(false);
    setStep(1);
    setError(null);
  };

  const loadUsers = async () => {
    try {
      const usersData = await usersAPI.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  // Inicializar datos al abrir o cambiar cliente/rol
  useEffect(() => {
    if (!isOpen) return;

    setError(null);

    if (editingClient) {
      setFormData({
        nombre: editingClient.nombre,
        nit: editingClient.nit,
        // Cargar campos de dirección desglosados
        direccionBase: editingClient.direccionBase || "",
        barrio: editingClient.barrio || "",
        ciudad: editingClient.ciudad || "",
        departamento: editingClient.departamento || "",
        pais: editingClient.pais || "Colombia",
        contacto: editingClient.contacto,
        email: editingClient.email,
        telefono: editingClient.telefono,
        // Generar URL inicial o usar la existente
        localizacion:
          editingClient.localizacion ||
          generateGoogleMapsURL({
            nombre: editingClient.nombre || "",
            direccionBase: editingClient.direccionBase || "",
            barrio: editingClient.barrio || "",
            ciudad: editingClient.ciudad || "",
            departamento: editingClient.departamento || "",
            pais: editingClient.pais || "Colombia",
          }),
        fecha_creacion: editingClient.fechaCreacionEmpresa || "",
        idUsuarioContacto: editingClient.idUsuarioContacto,
        areas:
          editingClient.areas?.map((area, index) => ({
            id: area.idArea || -(index + 1),
            nombreArea: area.nombreArea,
            subAreas:
              area.subAreas?.map((subArea, subIndex) => ({
                id: subArea.idSubArea || -(subIndex + 1),
                nombreSubArea: subArea.nombreSubArea,
                areaId: subArea.areaId,
                parentSubAreaId: subArea.parentSubAreaId,
              })) || [],
          })) || [],
      });

      if (editingClient.usuarioContacto) {
        const u = editingClient.usuarioContacto;
        setUserSearch(`${u.nombre} ${u.apellido || ""}`);
      }

      // Cargar logo si existe
      const logo = editingClient.images?.find((img) => img.isLogo);
      if (logo) {
        setLogoPreview(logo.url);
      }
    } else {
      resetForm();

      // Si es cliente, usar su propio usuario como contacto
      if (isCliente && user) {
        const fullName = `${user.nombre} ${user.apellido || ""}`.trim();
        setFormData((prev) => ({
          ...prev,
          idUsuarioContacto: user.usuarioId,
          contacto: fullName,
        }));
        setUserSearch(fullName);
      }
    }

    // Solo Admin/Secretaria cargan usuarios
    if (!isCliente) {
      loadUsers();
    }
  }, [isOpen, editingClient, isCliente, user]);

  // Filtrar usuarios
  useEffect(() => {
    if (!userSearch.trim() || isCliente) {
      setFilteredUsers([]);
      return;
    }

    const filtered = users.filter(
      (u) =>
        `${u.nombre} ${u.apellido || ""}`
          .toLowerCase()
          .includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearch.toLowerCase()),
    );
    setFilteredUsers(filtered.slice(0, 10));
  }, [userSearch, users, isCliente]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (userId: number, userName: string) => {
    setFormData((prev) => ({
      ...prev,
      idUsuarioContacto: userId,
      contacto: userName,
    }));
    setUserSearch(userName);
    setShowUserList(false);
  };

  // Manejo de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Por favor, sube una imagen válida (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen es demasiado grande. Máximo 5MB");
      return;
    }

    setLogoFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // ========== MANEJO DE ÁREAS ==========
  const handleAddArea = () => {
    if (!newAreaName.trim()) return;

    const newArea: AreaFormData = {
      id: -(formData.areas.length + 1), // ID temporal negativo
      nombreArea: newAreaName.trim(),
      subAreas: [],
    };

    setFormData((prev) => ({
      ...prev,
      areas: [...prev.areas, newArea],
    }));
    setNewAreaName("");
  };

  const handleRemoveArea = (areaId: number) => {
    setFormData((prev) => ({
      ...prev,
      areas: prev.areas.filter((a) => a.id !== areaId),
    }));
    if (selectedAreaForSubarea === areaId) {
      setSelectedAreaForSubarea(null);
      setSelectedParentSubarea(null);
    }
  };

  // ========== MANEJO DE SUBÁREAS (incluye jerarquía) ==========
  const handleAddSubarea = () => {
    if (!newSubareaName.trim() || selectedAreaForSubarea === null) return;

    setFormData((prev) => ({
      ...prev,
      areas: prev.areas.map((area) => {
        if (area.id === selectedAreaForSubarea) {
          const newId = -(area.subAreas.length + 1);
          const newSub: SubAreaFormData = {
            id: newId,
            nombreSubArea: newSubareaName.trim(),
            areaId: area.id, // temporal o real
            parentSubAreaId: selectedParentSubarea ?? undefined,
          };
          return {
            ...area,
            subAreas: [...area.subAreas, newSub],
          };
        }
        return area;
      }),
    }));
    setNewSubareaName("");
    setIsSubareaModalOpen(false);
  };

  // Eliminar una subárea y todos sus descendientes
  const handleRemoveSubarea = (areaId: number, subareaId: number) => {
    setFormData((prev) => ({
      ...prev,
      areas: prev.areas.map((area) => {
        if (area.id === areaId) {
          const idsToRemove = new Set<number>();
          idsToRemove.add(subareaId);

          let changed = true;
          while (changed) {
            changed = false;
            for (const s of area.subAreas) {
              if (
                s.parentSubAreaId !== undefined &&
                idsToRemove.has(s.parentSubAreaId) &&
                s.id !== undefined &&
                !idsToRemove.has(s.id)
              ) {
                idsToRemove.add(s.id);
                changed = true;
              }
            }
          }

          return {
            ...area,
            subAreas: area.subAreas.filter(
              (s) => !(s.id !== undefined && idsToRemove.has(s.id)),
            ),
          };
        }
        return area;
      }),
    }));
  };

  // Iniciar creación de subárea dentro de un área (nivel 1)
  const startAddSubareaForArea = (areaId: number) => {
    setSelectedAreaForSubarea(areaId);
    setSelectedParentSubarea(null);
    setNewSubareaName("");
    setIsSubareaModalOpen(true);
  };

  // Iniciar creación de subárea hija de otra subárea (nivel N)
  const startAddSubareaForSubarea = (
    areaId: number,
    parentSubareaId: number,
  ) => {
    setSelectedAreaForSubarea(areaId);
    setSelectedParentSubarea(parentSubareaId);
    setNewSubareaName("");
    setIsSubareaModalOpen(true);
  };

  const closeSubareaModal = () => {
    setIsSubareaModalOpen(false);
    setNewSubareaName("");
  };

  // ========== VALIDACIONES ==========
  const validateStep1 = (): boolean => {
    const requiredFields: (keyof ClientFormData)[] = [
      "nombre",
      "nit",
      "direccionBase",
      "barrio",
      "ciudad",
      "departamento",
      "pais",
      "telefono",
      "fecha_creacion",
    ];

    const fieldLabels: Partial<Record<keyof ClientFormData, string>> = {
      nombre: "Nombre de la Empresa",
      nit: "NIT",
      direccionBase: "Dirección Base",
      barrio: "Barrio",
      ciudad: "Ciudad",
      departamento: "Departamento",
      pais: "País",
      telefono: "Teléfono",
      fecha_creacion: "Fecha de Creación",
    };

    for (const field of requiredFields) {
      const value = formData[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        setError(
          `El campo ${fieldLabels[field] ?? String(field)} es requerido`,
        );
        playErrorSound();
        return false;
      }
    }

    // Validar que la URL de Google Maps se haya generado
    if (
      !formData.localizacion ||
      !formData.localizacion.startsWith("https://www.google.com/maps/")
    ) {
      setError(
        "Por favor, complete todos los campos de dirección para generar la ubicación",
      );
      playErrorSound();
      return false;
    }

    // Fecha de creación
    if (formData.fecha_creacion) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.fecha_creacion)) {
        setError("Seleccione una fecha de creación válida");
        playErrorSound();
        return false;
      }
    }

    // Email opcional
    const emailTrimmed = formData.email.trim();
    if (emailTrimmed) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        setError("Ingrese un email válido");
        playErrorSound();
        return false;
      }
    }

    // Teléfono
    const phoneTrimmed = formData.telefono.trim();
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    if (!phoneRegex.test(phoneTrimmed.replace(/\s/g, ""))) {
      setError("Ingrese un teléfono válido (mínimo 7 dígitos)");
      playErrorSound();
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (formData.areas.length === 0) {
      setError("Debes agregar al menos 1 área para el cliente");
      playErrorSound();
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(1);
  };

  // Crear subáreas en el backend respetando la jerarquía
  const createSubareasForArea = async (
    area: AreaFormData,
    dbAreaId: number,
  ) => {
    const newSubs = area.subAreas.filter(
      (s) => s.id === undefined || (s.id as number) < 0,
    );
    if (newSubs.length === 0) return;

    const tempToReal = new Map<number, number>();
    let pending = [...newSubs];

    while (pending.length > 0) {
      let createdSomething = false;
      const remaining: SubAreaFormData[] = [];

      for (const sub of pending) {
        let parentDbId: number | undefined;

        if (sub.parentSubAreaId === undefined || sub.parentSubAreaId === null) {
          parentDbId = undefined;
        } else if (sub.parentSubAreaId > 0) {
          parentDbId = sub.parentSubAreaId;
        } else {
          const mapped = tempToReal.get(sub.parentSubAreaId);
          if (!mapped) {
            remaining.push(sub);
            continue;
          }
          parentDbId = mapped;
        }

        const created = await subAreasAPI.createSubArea({
          nombreSubArea: sub.nombreSubArea,
          areaId: dbAreaId,
          parentSubAreaId: parentDbId,
        });

        if (sub.id !== undefined && sub.id < 0) {
          tempToReal.set(sub.id, created.idSubArea);
        }
        createdSomething = true;
      }

      if (!createdSomething) {
        console.warn(
          "No se pudieron resolver algunas subáreas por referencias de padre inválidas.",
        );
        break;
      }

      pending = remaining;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    try {
      setLoading(true);
      setError(null);

      const clientData: CreateClientDto = {
        nombre: formData.nombre,
        nit: formData.nit,
        // Enviar campos desglosados
        direccionBase: formData.direccionBase,
        barrio: formData.barrio,
        ciudad: formData.ciudad,
        departamento: formData.departamento,
        pais: formData.pais,
        contacto: formData.contacto,
        email: formData.email,
        telefono: formData.telefono,
        localizacion: formData.localizacion,
        fechaCreacionEmpresa: formData.fecha_creacion,
      };

      if (formData.idUsuarioContacto) {
        clientData.idUsuarioContacto = formData.idUsuarioContacto;
      }

      let savedClient: Client;

      if (editingClient) {
        // Actualizar cliente
        await clientsAPI.updateClient(editingClient.idCliente, clientData);

        // Manejo de áreas existentes vs nuevas
        const existingAreaIds = editingClient.areas?.map((a) => a.idArea) || [];
        const currentAreaIds =
          formData.areas
            .filter((a) => a.id !== undefined && a.id > 0)
            .map((a) => a.id as number) || [];

        // Eliminar áreas que ya no están
        for (const areaId of existingAreaIds) {
          if (!currentAreaIds.includes(areaId)) {
            await areasAPI.deleteArea(areaId);
          }
        }

        // Crear/actualizar áreas y subáreas
        for (const area of formData.areas) {
          if (area.id !== undefined && area.id < 0) {
            // Área nueva
            const createdArea = await areasAPI.createArea({
              nombreArea: area.nombreArea,
              clienteId: editingClient.idCliente,
            });

            await createSubareasForArea(area, createdArea.idArea);
          } else if (area.id !== undefined && area.id > 0) {
            // Área existente: eliminar subáreas quitadas y crear nuevas
            const existingArea = editingClient.areas?.find(
              (a) => a.idArea === area.id,
            );
            const existingSubareaIds =
              existingArea?.subAreas?.map((s) => s.idSubArea) || [];
            const currentSubareaIds =
              area.subAreas
                .filter((s) => s.id !== undefined && s.id > 0)
                .map((s) => s.id as number) || [];

            // Eliminar subáreas que ya no están
            for (const subId of existingSubareaIds) {
              if (!currentSubareaIds.includes(subId)) {
                await subAreasAPI.deleteSubArea(subId);
              }
            }

            await createSubareasForArea(area, area.id);
          }
        }

        savedClient = await clientsAPI.getClientById(editingClient.idCliente);
      } else {
        // Crear cliente
        const newClient = await clientsAPI.createClient(clientData);

        // Crear áreas + subáreas
        for (const area of formData.areas) {
          const createdArea = await areasAPI.createArea({
            nombreArea: area.nombreArea,
            clienteId: newClient.idCliente,
          });

          await createSubareasForArea(area, createdArea.idArea);
        }

        savedClient = await clientsAPI.getClientById(newClient.idCliente);
      }

      // Subir logo si hay uno seleccionado
      if (logoFile && savedClient) {
        try {
          await imagesApi.uploadClientLogo(savedClient.idCliente, logoFile);
        } catch (uploadError: any) {
          console.error("Error subiendo logo:", uploadError);
          // No detenemos el flujo si falla la subida del logo
          setError(
            `Cliente guardado, pero error al subir logo: ${uploadError.message}`,
          );
        }
      }

      onSuccess(savedClient);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el cliente");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Área actualmente seleccionada para agregar subárea
  const currentAreaForSubarea = formData.areas.find(
    (a) => a.id === selectedAreaForSubarea,
  );

  // Subárea padre actualmente seleccionada (si hay)
  const currentParentSubarea =
    currentAreaForSubarea && selectedParentSubarea != null
      ? currentAreaForSubarea.subAreas.find(
          (s) => s.id === selectedParentSubarea,
        ) || null
      : null;

  // Render recursivo de subáreas como árbol
  const renderSubareasTree = (
    area: AreaFormData,
    parentId: number | null = null,
  ): React.ReactNode[] => {
    const children = area.subAreas.filter(
      (s) =>
        (s.parentSubAreaId ?? null) === parentId &&
        s.id !== undefined &&
        s.id !== null,
    );

    if (!children.length) return [];

    return children.map((sub) => (
      <div key={sub.id} className={styles.subareaTreeItem}>
        <div className={styles.subareaItem}>
          <span className={styles.subareaName}>📂 {sub.nombreSubArea}</span>

          <div className={styles.subareaActions}>
            {/* + hija de esta subárea */}
            <button
              type="button"
              onClick={() =>
                startAddSubareaForSubarea(area.id as number, sub.id as number)
              }
              className={styles.addButtonSmall}
              disabled={loading}
              title="Añadir subárea dentro de esta subárea"
            >
              +
            </button>

            <button
              type="button"
              onClick={() =>
                handleRemoveSubarea(area.id as number, sub.id as number)
              }
              className={styles.removeButtonSmall}
              disabled={loading}
              title="Eliminar subárea (y sus subniveles)"
            >
              ×
            </button>
          </div>
        </div>
        <div className={styles.subareaChildren}>
          {renderSubareasTree(area, sub.id as number)}
        </div>
      </div>
    ));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2 className={styles.modalTitle}>
              {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <div className={styles.stepIndicator}>
              <span className={step === 1 ? styles.activeStep : ""}>1</span>
              <span className={styles.stepDivider}>→</span>
              <span className={step === 2 ? styles.activeStep : ""}>2</span>
            </div>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorAlert}>
              <span className={styles.errorIcon}>⚠️</span>
              <span className={styles.errorText}>{error}</span>
              <button
                className={styles.errorClose}
                onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* ========== PASO 1: Información del Cliente ========== */}
          {step === 1 && (
            <div className={styles.step}>
              <h3 className={styles.stepTitle}>
                <span className={styles.stepNumber}>1</span>
                Información del Cliente
              </h3>

              <div className={styles.formGrid}>
                {/* Nombre y NIT */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Cerámica Italia S.A."
                    className={styles.formInput}
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>NIT *</label>
                  <input
                    type="text"
                    name="nit"
                    value={formData.nit}
                    onChange={handleInputChange}
                    placeholder="Ej: 900123456-7"
                    className={styles.formInput}
                    disabled={loading}
                  />
                </div>

                {/* Logo de la Empresa */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>
                    Logo de la Empresa (Opcional)
                  </label>
                  <div className={styles.logoUploadContainer}>
                    {logoPreview ? (
                      <div className={styles.logoPreview}>
                        <img
                          src={logoPreview}
                          alt="Preview logo"
                          className={styles.logoPreviewImage}
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className={styles.removeLogoBtn}
                          disabled={loading}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className={styles.logoUploadPlaceholder}>
                        <span className={styles.logoIcon}>🏢</span>
                        <span className={styles.logoText}>Subir logo</span>
                        <span className={styles.logoHint}>
                          Formatos: JPG, PNG, GIF, WebP
                          <br />
                          Máximo: 5MB
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleLogoChange}
                      className={styles.logoInput}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Contacto y Email */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    name="contacto"
                    value={formData.contacto}
                    onChange={handleInputChange}
                    placeholder="Se autocompletará al seleccionar usuario"
                    className={styles.formInput}
                    disabled={true}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email corporativo"
                    className={styles.formInput}
                    disabled={loading}
                  />
                </div>

                {/* Teléfono y Fecha */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Teléfono de la empresa"
                    className={styles.formInput}
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Fecha de Creación *
                  </label>
                  <input
                    type="date"
                    name="fecha_creacion"
                    value={formData.fecha_creacion}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    disabled={loading}
                  />
                </div>

                {/* --- SECCIÓN DE DIRECCIÓN DESGLOSADA --- */}
                <div
                  className={`${styles.formGroup} ${styles.fullWidth}`}
                  style={{
                    gridColumn: "1 / -1",
                  }}
                >
                  <label
                    className={styles.formLabel}
                    style={{
                      marginBottom: "0.5rem",
                      display: "block",
                    }}
                  >
                    Dirección de la Empresa *
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "1rem",
                    }}
                  >
                    {/* Dirección Base */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <input
                        type="text"
                        name="direccionBase"
                        value={formData.direccionBase}
                        onChange={handleInputChange}
                        placeholder="Dirección base (ej: Calle 10 # 20-30, Oficina 401)"
                        className={styles.formInput}
                        disabled={loading}
                      />
                    </div>

                    {/* Barrio */}
                    <div>
                      <input
                        type="text"
                        name="barrio"
                        value={formData.barrio}
                        onChange={handleInputChange}
                        placeholder="Barrio"
                        className={styles.formInput}
                        disabled={loading}
                      />
                    </div>

                    {/* Ciudad */}
                    <div>
                      <input
                        type="text"
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={handleInputChange}
                        placeholder="Ciudad"
                        className={styles.formInput}
                        disabled={loading}
                      />
                    </div>

                    {/* Departamento */}
                    <div>
                      <input
                        type="text"
                        name="departamento"
                        value={formData.departamento}
                        onChange={handleInputChange}
                        placeholder="Departamento"
                        className={styles.formInput}
                        disabled={loading}
                      />
                    </div>

                    {/* País */}
                    <div>
                      <input
                        type="text"
                        name="pais"
                        value={formData.pais}
                        onChange={handleInputChange}
                        placeholder="País"
                        className={styles.formInput}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  {/* URL de Google Maps generada automáticamente */}
                  {formData.localizacion && (
                    <div style={{ marginTop: "1rem" }}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          URL de Google Maps (generada automáticamente)
                        </label>
                        <div className={styles.readonlyField}>
                          <input
                            type="text"
                            value={formData.localizacion}
                            readOnly
                            className={`${styles.formInput} ${styles.readonlyInput}`}
                          />
                          <small className={styles.fieldNote}>
                            Esta URL se guardará automáticamente con los datos
                            de dirección
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Usuario contacto (solo Admin/Secretaria) */}
                {!isCliente && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.formLabel}>
                      Buscar Usuario Contacto (opcional)
                      <span className={styles.fieldNote}>
                        (Autocompleta el nombre de contacto)
                      </span>
                    </label>
                    <div className={styles.autocompleteWrapper}>
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setShowUserList(true);
                        }}
                        onFocus={() => setShowUserList(true)}
                        placeholder="Buscar por nombre, apellido o email..."
                        className={styles.formInput}
                        disabled={loading}
                      />

                      {showUserList && filteredUsers.length > 0 && (
                        <div className={styles.autocompleteList}>
                          {filteredUsers.map((u) => (
                            <div
                              key={u.usuarioId}
                              className={styles.autocompleteItem}
                              onClick={() =>
                                handleUserSelect(
                                  u.usuarioId,
                                  `${u.nombre} ${u.apellido || ""}`,
                                )
                              }
                            >
                              <div className={styles.userInfo}>
                                <div className={styles.userMainInfo}>
                                  <strong>
                                    {u.nombre} {u.apellido || ""}
                                  </strong>
                                  <span className={styles.userRole}>
                                    {u.role?.nombreRol}
                                  </span>
                                </div>
                                <div className={styles.userContactInfo}>
                                  <small className={styles.userEmail}>
                                    {u.email}
                                  </small>
                                </div>
                              </div>
                              <span className={styles.selectIcon}>✓</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {formData.idUsuarioContacto && (
                      <div className={styles.selectedUser}>
                        <span className={styles.checkmark}>✓</span>
                        <div className={styles.selectedUserInfo}>
                          <strong>Usuario contacto seleccionado</strong>
                          <small>Nombre de contacto autocompletado</small>
                        </div>
                        <button
                          className={styles.clearUserButton}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              idUsuarioContacto: null,
                              contacto: "",
                            }));
                            setUserSearch("");
                          }}
                          disabled={loading}
                        >
                          Cambiar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Cliente: info de su usuario */}
                {isCliente && user && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <div className={styles.selectedUser}>
                      <span className={styles.checkmark}>✓</span>
                      <div className={styles.selectedUserInfo}>
                        <strong>Usuario contacto</strong>
                        <small>
                          Se usará tu usuario ({user.nombre}{" "}
                          {user.apellido || ""}) como contacto.
                        </small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== PASO 2: Áreas y Subáreas ========== */}
          {step === 2 && (
            <div className={styles.step}>
              <h3 className={styles.stepTitle}>
                <span className={styles.stepNumber}>2</span>
                Áreas y Subáreas
              </h3>

              <div className={styles.stepDescription}>
                <p>
                  Agrega las áreas de la empresa y organiza las subáreas en
                  niveles (subáreas dentro de subáreas).
                </p>
                <span className={styles.requiredText}>
                  * Debes agregar al menos 1 área
                </span>
              </div>

              {/* Agregar Área */}
              <div className={styles.addAreaForm}>
                <div className={styles.areaInputGroup}>
                  <input
                    type="text"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder="Nombre del área (ej: Producción, Bodega, Oficinas)"
                    className={styles.areaInput}
                    disabled={loading}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddArea();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddArea}
                    className={styles.addButton}
                    disabled={loading || !newAreaName.trim()}
                  >
                    <span className={styles.plusIcon}>+</span>
                    Agregar Área
                  </button>
                </div>
              </div>

              {/* Lista de Áreas */}
              {formData.areas.length > 0 ? (
                <div className={styles.areasSection}>
                  <h4 className={styles.listTitle}>
                    Áreas agregadas ({formData.areas.length})
                  </h4>
                  <div className={styles.areasList}>
                    {formData.areas.map((area) => (
                      <div key={area.id} className={styles.areaItem}>
                        <div className={styles.areaHeader}>
                          <div className={styles.areaInfo}>
                            <span className={styles.areaBullet}>📁</span>
                            <span className={styles.areaName}>
                              {area.nombreArea}
                            </span>
                            <span className={styles.subareaCount}>
                              {area.subAreas.length} subárea
                              {area.subAreas.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          <div className={styles.areaActions}>
                            {/* + subárea nivel 1 */}
                            <button
                              type="button"
                              onClick={() =>
                                startAddSubareaForArea(area.id as number)
                              }
                              className={styles.addButtonSmall}
                              disabled={loading}
                              title="Añadir subárea dentro de esta área"
                            >
                              +
                            </button>

                            {/* eliminar área */}
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveArea(area.id as number)
                              }
                              className={styles.removeButton}
                              disabled={loading}
                              title="Eliminar área"
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        {/* Subáreas como árbol */}
                        {area.subAreas.length > 0 && (
                          <div className={styles.subareasList}>
                            {renderSubareasTree(area, null)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.noAreas}>
                  <div className={styles.noDataIcon}>📁</div>
                  <p>No hay áreas agregadas</p>
                  <small>
                    Agrega al menos 1 área para poder guardar el cliente
                  </small>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerContent}>
            <div className={styles.navigationButtons}>
              {step === 2 && (
                <button
                  className={styles.backButton}
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  ← Anterior
                </button>
              )}
            </div>

            <div className={styles.actionButtons}>
              <button
                className={styles.cancelButton}
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>

              {step === 1 ? (
                <button
                  className={styles.nextButton}
                  onClick={handleNextStep}
                  disabled={loading}
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  className={styles.submitButton}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Guardando...
                    </>
                  ) : editingClient ? (
                    "Actualizar Cliente"
                  ) : (
                    "Crear Cliente"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mini-modal para crear subárea */}
        {isSubareaModalOpen && currentAreaForSubarea && (
          <div
            className={styles.subareaModalOverlay}
            onClick={closeSubareaModal}
          >
            <div
              className={styles.subareaModal}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className={styles.subareaModalTitle}>Agregar subárea</h4>
              <div className={styles.subareaModalContext}>
                <div>
                  Área: <strong>{currentAreaForSubarea.nombreArea}</strong>
                </div>
                {currentParentSubarea && (
                  <div>
                    Subárea padre:{" "}
                    <strong>{currentParentSubarea.nombreSubArea}</strong>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={newSubareaName}
                onChange={(e) => setNewSubareaName(e.target.value)}
                placeholder="Nombre de la subárea"
                className={styles.subareaInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubarea();
                  }
                }}
                autoFocus
              />
              <div className={styles.subareaModalActions}>
                <button
                  type="button"
                  className={styles.subareaModalCancel}
                  onClick={closeSubareaModal}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.subareaModalConfirm}
                  onClick={handleAddSubarea}
                  disabled={
                    loading ||
                    !newSubareaName.trim() ||
                    selectedAreaForSubarea === null
                  }
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
