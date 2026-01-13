import { useEffect, useState, useRef } from "react";
import type { JSX } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { clients as clientsAPI } from "../api/clients";
import { imagesApi } from "../api/images";
import { getEquipmentByClientRequest } from "../api/equipment";
import type {
  Client,
  SubArea,
  ClientImage,
} from "../interfaces/ClientInterfaces";
import type { Equipment } from "../interfaces/EquipmentInterfaces";
import styles from "../styles/pages/ClientDetailsPage.module.css";

type TabType = "info" | "areas" | "gallery";

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const logoMenuRef = useRef<HTMLDivElement>(null);

  const [client, setClient] = useState<Client | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [clientImages, setClientImages] = useState<ClientImage[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [loading, setLoading] = useState(true);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [logoHover, setLogoHover] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    const loadClientData = async () => {
      if (!id) {
        setError("ID de cliente no proporcionado.");
        setLoading(false);
        return;
      }

      const clientId = parseInt(id, 10);
      if (isNaN(clientId)) {
        setError("ID de cliente inválido.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Cargar datos del cliente
        const clientData = await clientsAPI.getClientById(clientId);
        setClient(clientData);

        // Cargar equipos
        try {
          setEquipmentLoading(true);
          setEquipmentError(null);
          const equipments = await getEquipmentByClientRequest(clientId);
          setEquipmentList(equipments);
        } catch (err: any) {
          console.error("Error cargando equipos del cliente:", err);
          setEquipmentError(
            err.response?.data?.error ||
              err.message ||
              "Error al cargar los equipos del cliente."
          );
        } finally {
          setEquipmentLoading(false);
        }

        // Cargar imágenes del cliente
        try {
          setImagesLoading(true);
          const images = await imagesApi.getClientImages(clientId);
          setClientImages(images);
        } catch (err: any) {
          console.error("Error cargando imágenes del cliente:", err);
        } finally {
          setImagesLoading(false);
        }
      } catch (err: any) {
        console.error("Error cargando cliente:", err);
        setError(err.message || "Error al cargar el cliente");
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, [id]);

  // Hook para detectar clics fuera del contenedor del logo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        logoMenuRef.current &&
        !logoMenuRef.current.contains(event.target as Node)
      ) {
        setLogoHover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Función helper para manejar mouse leave de forma segura
  const handleLogoMouseLeave = (e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as Node;
    
    // Verificar que relatedTarget sea válido antes de usar .contains()
    if (!relatedTarget || !(relatedTarget instanceof Node)) {
      setLogoHover(false);
      return;
    }
    
    // Verificar que el contenedor exista y que relatedTarget no esté dentro de él
    if (!logoMenuRef.current || !logoMenuRef.current.contains(relatedTarget)) {
      setLogoHover(false);
    }
  };

  const handleBack = () => {
    navigate("/clients");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No especificada";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const isValidUrl = (str: string) => {
    if (!str) return false;
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  // Función para manejar la carga de logo
  const handleLogoUpload = async (file: File) => {
    if (!client || !id) return;

    try {
      setUploadingLogo(true);
      const clientId = parseInt(id, 10);

      const uploadedImage = await imagesApi.uploadClientLogo(clientId, file);

      // Actualizar el cliente con la nueva imagen
      setClient((prev) => {
        if (!prev) return null;

        const existingImages = prev.images || [];
        const filteredImages = existingImages.filter((img) => !img.isLogo);

        return {
          ...prev,
          images: [...filteredImages, uploadedImage],
        };
      });

    } catch (err: any) {
      setError(err.message || "Error al subir el logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Función para manejar la carga de imágenes de galería
  const handleGalleryUpload = async (files: FileList) => {
    if (!client || !id) return;

    try {
      setUploadingGallery(true);
      const clientId = parseInt(id, 10);

      const uploadPromises = Array.from(files).map((file) =>
        imagesApi.uploadClientImage(clientId, file)
      );

      const uploadedImages = await Promise.all(uploadPromises);

      // Actualizar las imágenes del cliente
      setClientImages((prev) => [...prev, ...uploadedImages]);
    } catch (err: any) {
      setError(err.message || "Error al subir las imágenes");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) return;

    handleLogoUpload(file);

    // Resetear el input
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = "";
    }
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validar cada archivo
    for (let i = 0; i < files.length; i++) {
      if (!validateImageFile(files[i])) {
        return;
      }
    }

    handleGalleryUpload(files);

    // Resetear el input
    if (galleryFileInputRef.current) {
      galleryFileInputRef.current.value = "";
    }
  };

  const validateImageFile = (file: File): boolean => {
    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Por favor, sube imágenes válidas (JPEG, PNG, GIF, WebP)");
      return false;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Una o más imágenes son demasiado grandes. Máximo 5MB por imagen"
      );
      return false;
    }

    return true;
  };

  // Función para eliminar logo
  const handleDeleteLogo = async () => {
    if (!client || !id) return;

    if (!window.confirm("¿Estás seguro de que quieres eliminar el logo?")) {
      return;
    }

    try {
      const logo = client.images?.find((img) => img.isLogo);

      if (logo) {
        await imagesApi.deleteClientImage(logo.id);

        // Actualizar el cliente
        setClient((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            images: prev.images?.filter((img) => img.id !== logo.id) || [],
          };
        });
      }
      setLogoHover(false);
    } catch (err: any) {
      setError(err.message || "Error al eliminar el logo");
    }
  };

  // Función para eliminar imagen de galería
  const handleDeleteGalleryImage = async (imageId: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta imagen?")) {
      return;
    }

    try {
      await imagesApi.deleteClientImage(imageId);

      // Actualizar las imágenes
      setClientImages((prev) => prev.filter((img) => img.id !== imageId));

      // Ajustar el índice si es necesario
      if (currentImageIndex >= clientImages.length - 1) {
        setCurrentImageIndex(Math.max(0, clientImages.length - 2));
      }
    } catch (err: any) {
      setError(err.message || "Error al eliminar la imagen");
    }
  };

  // Navegación del carrusel
  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === clientImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? clientImages.length - 1 : prev - 1
    );
  };

  // Función recursiva para organizar subáreas en árbol
  const organizeSubareasTree = (
    subareas: SubArea[],
    parentId: number | null = null
  ): SubArea[] => {
    const children = subareas.filter(
      (sub) => (sub.parentSubAreaId ?? null) === parentId
    );

    const result: SubArea[] = [];
    for (const child of children) {
      const childWithChildren = {
        ...child,
        children: organizeSubareasTree(subareas, child.idSubArea),
      };
      result.push(childWithChildren);
    }

    return result;
  };

  // Función recursiva para renderizar subáreas como árbol
  const renderSubareasTree = (
    subareas: SubArea[],
    depth: number = 0
  ): JSX.Element[] => {
    return subareas.map((subarea) => (
      <div key={subarea.idSubArea}>
        <div
          className={styles.subareaTreeItem}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className={styles.subareaItem}>
            <span className={styles.subareaIcon}>
              {subarea.children && subarea.children.length > 0 ? "📂" : "📄"}
            </span>
            <span className={styles.subareaName}>{subarea.nombreSubArea}</span>
            <span className={styles.subareaEquipmentCount}>
              {
                equipmentList.filter((eq) => eq.subAreaId === subarea.idSubArea)
                  .length
              }{" "}
              equipo
              {equipmentList.filter((eq) => eq.subAreaId === subarea.idSubArea)
                .length !== 1
                ? "s"
                : ""}
            </span>
          </div>

          {/* Mostrar equipos de esta subárea */}
          {renderSubareaEquipment(subarea)}

          {/* Renderizar hijos recursivamente */}
          {subarea.children && subarea.children.length > 0 && (
            <div className={styles.subareaChildren}>
              {renderSubareasTree(subarea.children, depth + 1)}
            </div>
          )}
        </div>
      </div>
    ));
  };

  // Función para renderizar equipos de una subárea
  const renderSubareaEquipment = (subarea: SubArea): JSX.Element | null => {
    const subareaEquipments = equipmentList.filter(
      (eq) => eq.subAreaId === subarea.idSubArea
    );

    if (subareaEquipments.length === 0) return null;

    return (
      <div className={styles.subareaEquipmentList}>
        {subareaEquipments.map((eq) => (
          <div key={eq.equipmentId} className={styles.equipmentItem}>
            <span className={styles.equipmentName}>{eq.name}</span>
            {eq.code && <span className={styles.equipmentCode}>{eq.code}</span>}
          </div>
        ))}
      </div>
    );
  };

  // Función para renderizar equipos directos del área
  const renderAreaEquipment = (areaId: number): JSX.Element | null => {
    const areaEquipments = equipmentList.filter(
      (eq) => eq.areaId === areaId && !eq.subAreaId
    );

    if (areaEquipments.length === 0) return null;

    return (
      <div className={styles.areaEquipmentList}>
        <div className={styles.equipmentListTitle}>
          Equipos asignados directamente al área:
        </div>
        <div className={styles.equipmentGrid}>
          {areaEquipments.map((eq) => (
            <div key={eq.equipmentId} className={styles.equipmentItem}>
              <span className={styles.equipmentName}>{eq.name}</span>
              {eq.code && (
                <span className={styles.equipmentCode}>{eq.code}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.pageWrapper}>
          <div className={styles.centerBox}>
            <div className={styles.spinner}></div>
            <p>Cargando cliente...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <div className={styles.pageWrapper}>
          <div className={styles.centerBox}>
            <h2>Error</h2>
            <p>{error || "No se encontró el cliente."}</p>
            <button className={styles.backButton} onClick={handleBack}>
              ← Volver a clientes
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const areas = client.areas || [];
  const totalEquipments = equipmentList.length;
  const clientLogo = client.images?.find((img) => img.isLogo);

  return (
    <DashboardLayout>
      <div className={styles.pageWrapper}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <button className={styles.backButton} onClick={handleBack}>
              ← Volver a clientes
            </button>

            <div className={styles.clientIdentity}>
              {/* LOGO CONTAINER - SIMPLIFICADO */}
              <div
                ref={logoMenuRef}
                className={styles.logoContainer}
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={handleLogoMouseLeave}
              >
                <div className={styles.logoImageWrapper}>
                  {clientLogo ? (
                    <img
                      src={clientLogo.url}
                      alt={`Logo de ${client.nombre}`}
                      className={styles.clientLogo}
                      onError={(e) => {
                        // Si falla la imagen, mostrar placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const wrapper = target.closest(
                          `.${styles.logoImageWrapper}`
                        );
                        if (wrapper) {
                          const placeholder = wrapper.querySelector(
                            `.${styles.clientLogoPlaceholder}`
                          );
                          if (placeholder) {
                            (placeholder as HTMLElement).style.display = "flex";
                          }
                        }
                      }}
                    />
                  ) : null}
                  {(!clientLogo || !clientLogo.url) && (
                    <div className={styles.clientLogoPlaceholder}>
                      {client.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Overlay para hover - ACCIONES DIRECTAS */}
                {logoHover && (
                  <div className={styles.logoOverlay}>
                    <div className={styles.logoActions}>
                      {/* Botón para subir nuevo logo */}
                      <input
                        type="file"
                        ref={logoFileInputRef}
                        onChange={handleLogoFileChange}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        style={{ display: "none" }}
                        id="logo-upload-input"
                      />
                      <button
                        className={styles.logoActionBtn}
                        onClick={() => logoFileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        title="Cambiar logo"
                      >
                        {uploadingLogo ? "Subiendo..." : "📷"}
                      </button>

                      {/* Botón para eliminar logo (solo si existe) */}
                      {clientLogo && (
                        <button
                          className={`${styles.logoActionBtn} ${styles.deleteLogoBtn}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLogo();
                          }}
                          disabled={uploadingLogo}
                          title="Eliminar logo"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.clientHeaderInfo}>
                <h1 className={styles.clientName}>{client.nombre}</h1>
                <span className={styles.clientNit}>NIT: {client.nit}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.quickStats}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>⚙️</span>
              <span className={styles.statValue}>{totalEquipments}</span>
              <span className={styles.statLabel}>
                Equipo{totalEquipments !== 1 ? "s" : ""}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>🏢</span>
              <span className={styles.statValue}>{areas.length}</span>
              <span className={styles.statLabel}>
                Área{areas.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>🖼️</span>
              <span className={styles.statValue}>{clientImages.length}</span>
              <span className={styles.statLabel}>
                Imagen{clientImages.length !== 1 ? "es" : ""}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <nav className={styles.tabsNav}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "info" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab("info")}
            >
              <span className={styles.tabIcon}>📋</span>
              Información
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "areas" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab("areas")}
            >
              <span className={styles.tabIcon}>🏢</span>
              Áreas y Subáreas
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "gallery" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab("gallery")}
            >
              <span className={styles.tabIcon}>🖼️</span>
              Galería
            </button>
          </nav>
        </header>

        {/* Body */}
        <main className={styles.pageBody}>
          {/* TAB: INFORMACIÓN */}
          {activeTab === "info" && (
            <section className={styles.infoSection}>
              {/* Contacto */}
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>👤</span>
                  Información de Contacto
                </h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      Persona de Contacto
                    </span>
                    <span className={styles.infoValue}>
                      {client.contacto || "No especificado"}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>
                      {client.email ? (
                        <a
                          href={`mailto:${client.email}`}
                          className={styles.infoLink}
                        >
                          {client.email}
                        </a>
                      ) : (
                        "No especificado"
                      )}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Teléfono</span>
                    <span className={styles.infoValue}>
                      {client.telefono ? (
                        <a
                          href={`tel:${client.telefono}`}
                          className={styles.infoLink}
                        >
                          {client.telefono}
                        </a>
                      ) : (
                        "No especificado"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usuario contacto del sistema */}
              {client.usuarioContacto && (
                <div className={styles.infoCard}>
                  <h3 className={styles.cardTitle}>
                    <span className={styles.cardIcon}>🔗</span>
                    Usuario Contacto del Sistema
                  </h3>
                  <div className={styles.userContactCard}>
                    <div className={styles.userAvatar}>
                      {client.usuarioContacto.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userContactInfo}>
                      <span className={styles.userName}>
                        {client.usuarioContacto.nombre}{" "}
                        {client.usuarioContacto.apellido || ""}
                      </span>
                      <span className={styles.userEmail}>
                        {client.usuarioContacto.email}
                      </span>
                      {client.usuarioContacto.telefono && (
                        <span className={styles.userPhone}>
                          {client.usuarioContacto.telefono}
                        </span>
                      )}
                    </div>
                    {client.usuarioContacto.role && (
                      <span
                        className={`${styles.roleBadge} ${
                          styles[
                            client.usuarioContacto.role.nombreRol
                              .toLowerCase()
                              .replace(/\s+/g, "")
                          ] || ""
                        }`}
                      >
                        {client.usuarioContacto.role.nombreRol}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Ubicación */}
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>📍</span>
                  Ubicación
                </h3>
                <div className={styles.infoGrid}>
                  <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                    <span className={styles.infoLabel}>Dirección Completa</span>
                    <span className={styles.infoValue}>
                      {client.direccionCompleta || "No especificada"}
                    </span>
                  </div>
                  <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                    <span className={styles.infoLabel}>Ubicación en Mapa</span>
                    {client.localizacion ? (
                      <div className={styles.locationWrapper}>
                        <span className={styles.infoValueSmall}>
                          {client.localizacion.length > 60
                            ? `${client.localizacion.substring(0, 60)}...`
                            : client.localizacion}
                        </span>
                        {isValidUrl(client.localizacion) && (
                          <a
                            href={client.localizacion}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.mapButton}
                          >
                            🗺️ Ver en Mapa
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className={styles.infoValue}>No especificada</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Empresa */}
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>🏛️</span>
                  Información de la Empresa
                </h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>NIT</span>
                    <span className={styles.infoValueCode}>{client.nit}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      Fecha de Creación de la Empresa
                    </span>
                    <span className={styles.infoValue}>
                      {formatDate(client.fechaCreacionEmpresa)}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      Registrado en Sistema
                    </span>
                    <span className={styles.infoValue}>
                      {formatDate(client.createdAt)}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      Última Actualización
                    </span>
                    <span className={styles.infoValue}>
                      {formatDate(client.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB: ÁREAS */}
          {activeTab === "areas" && (
            <section className={styles.areasSection}>
              {equipmentError && (
                <div className={styles.errorBox}>{equipmentError}</div>
              )}

              {equipmentLoading && (
                <div className={styles.loadingBox}>
                  <div className={styles.spinner}></div>
                  <span>Cargando equipos...</span>
                </div>
              )}

              {areas.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📁</div>
                  <h3>Sin áreas registradas</h3>
                  <p>Este cliente aún no tiene áreas registradas.</p>
                  <small>Puedes añadirlas desde la sección de clientes.</small>
                </div>
              ) : (
                <div className={styles.areaList}>
                  {areas.map((area) => {
                    const subAreas = area.subAreas || [];
                    const organizedSubareas = organizeSubareasTree(subAreas);
                    const areaEquipmentsCount = equipmentList.filter(
                      (eq) => eq.areaId === area.idArea
                    ).length;

                    return (
                      <article key={area.idArea} className={styles.areaItem}>
                        <div className={styles.areaHeader}>
                          <div className={styles.areaInfo}>
                            <span className={styles.areaBullet}>📁</span>
                            <span className={styles.areaName}>
                              {area.nombreArea}
                            </span>
                          </div>
                          <div className={styles.areaBadges}>
                            <span className={styles.subareaCountBadge}>
                              {subAreas.length} subárea
                              {subAreas.length !== 1 ? "s" : ""}
                            </span>
                            <span className={styles.equipmentCountBadge}>
                              {areaEquipmentsCount} equipo
                              {areaEquipmentsCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Equipos directos del área */}
                        {renderAreaEquipment(area.idArea)}

                        {/* Subáreas organizadas en árbol */}
                        {organizedSubareas.length > 0 && (
                          <div className={styles.subareasTree}>
                            <div className={styles.subareasTreeTitle}>
                              Subáreas (jerarquía):
                            </div>
                            <div className={styles.subareasTreeContent}>
                              {renderSubareasTree(organizedSubareas)}
                            </div>
                          </div>
                        )}

                        {subAreas.length === 0 && (
                          <div className={styles.noSubareasNote}>
                            <span className={styles.noteIcon}>ℹ️</span>
                            <span>
                              Este área no tiene subáreas registradas.
                            </span>
                          </div>
                        )}
                      </article>
                    );
                  })}

                  {areas.length > 0 &&
                    totalEquipments === 0 &&
                    !equipmentLoading && (
                      <div className={styles.noEquipmentsNote}>
                        <span className={styles.noteIcon}>ℹ️</span>
                        <span>
                          No hay equipos registrados para este cliente en estas
                          áreas/subáreas.
                        </span>
                      </div>
                    )}
                </div>
              )}
            </section>
          )}

          {/* TAB: GALERÍA */}
          {activeTab === "gallery" && (
            <section className={styles.gallerySection}>
              <div className={styles.galleryHeader}>
                <h3 className={styles.galleryTitle}>
                  <span className={styles.galleryIcon}>🖼️</span>
                  Galería de Imágenes
                </h3>
                <div className={styles.galleryControls}>
                  <input
                    type="file"
                    ref={galleryFileInputRef}
                    onChange={handleGalleryFileChange}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    style={{ display: "none" }}
                  />
                  <button
                    className={styles.uploadGalleryBtn}
                    onClick={() => galleryFileInputRef.current?.click()}
                    disabled={uploadingGallery || imagesLoading}
                  >
                    {uploadingGallery ? "Subiendo..." : "📁 Subir imágenes"}
                  </button>
                </div>
              </div>

              {imagesLoading ? (
                <div className={styles.loadingBox}>
                  <div className={styles.spinner}></div>
                  <span>Cargando imágenes...</span>
                </div>
              ) : clientImages.length === 0 ? (
                <div className={styles.emptyGallery}>
                  <div className={styles.emptyGalleryIcon}>🖼️</div>
                  <h3>No hay imágenes en la galería</h3>
                  <p>
                    Sube imágenes para crear una galería visual del cliente.
                  </p>
                  <button
                    className={styles.uploadGalleryEmptyBtn}
                    onClick={() => galleryFileInputRef.current?.click()}
                    disabled={uploadingGallery}
                  >
                    📁 Subir primeras imágenes
                  </button>
                </div>
              ) : (
                <div className={styles.galleryContent}>
                  {/* Carrusel principal */}
                  <div className={styles.carouselContainer}>
                    <div className={styles.carouselMain}>
                      <button
                        className={styles.carouselArrow}
                        onClick={prevImage}
                        disabled={clientImages.length <= 1}
                      >
                        ←
                      </button>

                      <div
                        className={styles.carouselImageContainer}
                        onClick={() => setShowLightbox(true)}
                      >
                        <img
                          src={clientImages[currentImageIndex].url}
                          alt={`Imagen ${currentImageIndex + 1} de ${
                            client.nombre
                          }`}
                          className={styles.carouselImage}
                        />
                      </div>

                      <button
                        className={styles.carouselArrow}
                        onClick={nextImage}
                        disabled={clientImages.length <= 1}
                      >
                        →
                      </button>
                    </div>

                    <div className={styles.carouselInfo}>
                      <span className={styles.carouselCounter}>
                        {currentImageIndex + 1} / {clientImages.length}
                      </span>
                      <button
                        className={styles.deleteImageBtn}
                        onClick={() =>
                          handleDeleteGalleryImage(
                            clientImages[currentImageIndex].id
                          )
                        }
                      >
                        🗑️ Eliminar esta imagen
                      </button>
                    </div>
                  </div>

                  {/* Miniaturas */}
                  <div className={styles.thumbnailGrid}>
                    {clientImages.map((image, index) => (
                      <div
                        key={image.id}
                        className={`${styles.thumbnailItem} ${
                          index === currentImageIndex
                            ? styles.thumbnailActive
                            : ""
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={image.url}
                          alt={`Miniatura ${index + 1}`}
                          className={styles.thumbnailImage}
                        />
                        <button
                          className={styles.thumbnailDeleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGalleryImage(image.id);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lightbox */}
              {showLightbox && (
                <div
                  className={styles.lightbox}
                  onClick={() => setShowLightbox(false)}
                >
                  <div
                    className={styles.lightboxContent}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={styles.lightboxClose}
                      onClick={() => setShowLightbox(false)}
                    >
                      ×
                    </button>
                    <img
                      src={clientImages[currentImageIndex].url}
                      alt={`Imagen ampliada`}
                      className={styles.lightboxImage}
                    />
                    <div className={styles.lightboxControls}>
                      <button
                        className={styles.lightboxArrow}
                        onClick={prevImage}
                      >
                        ←
                      </button>
                      <span className={styles.lightboxCounter}>
                        {currentImageIndex + 1} / {clientImages.length}
                      </span>
                      <button
                        className={styles.lightboxArrow}
                        onClick={nextImage}
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}