import { useEffect, useState } from "react";
import styles from "../../styles/components/inventory/ViewInventoryModal.module.css";
import type { InventoryItem } from "../../interfaces/InventoryInterfaces";
import { imagesApi } from "../../api/images";
import ImageCarousel from "../common/ImageCarousel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

export default function ViewInventoryModal({ isOpen, onClose, item }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      if (!isOpen || !item) {
        setImages([]);
        setImageError(null);
        return;
      }

      try {
        setLoadingImages(true);
        setImageError(null);
        setImages([]);

        let fetchedImages: string[] = [];

        if (item.tool?.herramientaId) {
          const toolImages = await imagesApi.getToolImages(
            item.tool.herramientaId,
          );
          fetchedImages = toolImages.map((img) => img.url);
        } else if (item.supply?.insumoId) {
          const supplyImages = await imagesApi.getSupplyImages(
            item.supply.insumoId,
          );
          fetchedImages = supplyImages.map((img) => img.url);
        }

        setImages(fetchedImages);
      } catch (err: any) {
        console.error("Error cargando imágenes:", err);
        setImageError(err.message || "No se pudieron cargar las imágenes");
      } finally {
        setLoadingImages(false);
      }
    };

    loadImages();
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const isHerramienta = item.tipo === "herramienta";
  const status = item.tool?.estado || item.supply?.estado || "Activo";
  const unit = item.supply?.unidadMedida;
  const value = item.supply?.valorUnitario || item.tool?.valorUnitario || 0;
  const lastUpdate = new Date(item.fechaUltimaActualizacion).toLocaleDateString(
    "es-ES",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>
            <span style={{ marginRight: "10px" }}>
              {isHerramienta ? "🛠️" : "📦"}
            </span>
            Detalles de {isHerramienta ? "Herramienta" : "Insumo"}
          </h2>
        </header>

        <div className={styles.content}>
          <div className={styles.leftColumn}>
            <div className={styles.imageSection}>
              <h3>Imágenes</h3>
              {loadingImages ? (
                <div className={styles.loadingImages}>
                  <div className={styles.spinner}></div>
                  Cargando imágenes...
                </div>
              ) : images.length > 0 ? (
                <div className={styles.carouselWrapper}>
                  <ImageCarousel
                    images={images}
                    alt={item.nombreItem}
                    showControls={true}
                    autoPlay={true}
                    interval={5000}
                  />
                  <div className={styles.imageCount}>
                    {images.length} imagen
                    {images.length !== 1 ? "es" : ""}
                  </div>
                </div>
              ) : (
                <div className={styles.noImages}>
                  <div className={styles.noImagesIcon}>📷</div>
                  <div className={styles.noImagesText}>
                    No hay imágenes disponibles
                  </div>
                  <div className={styles.noImagesSubtext}>
                    Puedes agregar imágenes desde la edición
                  </div>
                </div>
              )}
              {imageError && (
                <div className={styles.imageError}>
                  <span>⚠️</span> {imageError}
                </div>
              )}
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.infoSection}>
              <h3>Información General</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Nombre:</span>
                  <span className={styles.infoValue}>
                    <span className={styles.nameHighlight}>
                      {item.nombreItem}
                    </span>
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Tipo:</span>
                  <span className={styles.infoValue}>
                    <span
                      className={`${styles.typeBadge} ${
                        isHerramienta
                          ? item.tool?.tipo === "Equipo"
                            ? styles.equipoBadge
                            : styles.toolBadge
                          : styles.supplyBadge
                      }`}
                    >
                      {isHerramienta
                        ? item.tool?.tipo === "Equipo"
                          ? "🔧 Equipo"
                          : "🛠️ Herramienta"
                        : "📦 Insumo"}
                    </span>
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Cantidad:</span>
                  <span className={`${styles.infoValue} ${styles.quantity}`}>
                    {item.cantidadActual}
                    {unit && <span className={styles.unit}> {unit}</span>}
                  </span>
                </div>

                {item.supply && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Stock Mínimo:</span>
                    <span className={styles.infoValue}>
                      <span className={styles.stockMin}>
                        {item.supply.stockMin} {item.supply.unidadMedida}
                      </span>
                    </span>
                  </div>
                )}

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Ubicación:</span>
                  <span className={styles.infoValue}>
                    {item.ubicacion || (
                      <span className={styles.noInfo}>No especificada</span>
                    )}
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Estado:</span>
                  <span className={`${styles.infoValue} ${styles.status}`}>
                    {status}
                  </span>
                </div>

                {item.supply && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Categoría:</span>
                    <span className={styles.infoValue}>
                      {item.supply.categoria}
                    </span>
                  </div>
                )}

                {item.tool && (
                  <>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Marca:</span>
                      <span className={styles.infoValue}>
                        {item.tool.marca || (
                          <span className={styles.noInfo}>No especificada</span>
                        )}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Serial:</span>
                      <span className={styles.infoValue}>
                        {item.tool.serial || (
                          <span className={styles.noInfo}>No especificado</span>
                        )}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Modelo:</span>
                      <span className={styles.infoValue}>
                        {item.tool.modelo || (
                          <span className={styles.noInfo}>No especificado</span>
                        )}
                      </span>
                    </div>
                  </>
                )}

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Valor Unitario:</span>
                  <span className={`${styles.infoValue} ${styles.price}`}>
                    ${value.toLocaleString()}
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>
                    Última Actualización:
                  </span>
                  <span className={styles.infoValue}>
                    <span className={styles.lastUpdate}>{lastUpdate}</span>
                  </span>
                </div>

                {item.bodega && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Bodega:</span>
                    <span className={styles.infoValue}>
                      <span className={styles.warehouseName}>
                        {item.bodega.nombre}
                      </span>
                      {item.bodega.clienteNombre && (
                        <span className={styles.clientName}>
                          ({item.bodega.clienteNombre})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <button onClick={onClose} className={styles.closeBtn}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
