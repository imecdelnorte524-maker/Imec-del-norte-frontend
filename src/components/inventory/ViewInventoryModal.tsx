import { useEffect, useState } from "react";
import styles from "../../styles/components/inventory/ViewInventoryModal.module.css";
import type { Inventory } from "../../interfaces/InventoryInterfaces";
import { imagesApi, type ClientImage } from "../../api/images";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: Inventory | null;
}

export default function ViewInventoryModal({ isOpen, onClose, item }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      if (!isOpen || !item) {
        setImageUrl(null);
        setImageError(null);
        return;
      }

      try {
        setLoadingImage(true);
        setImageError(null);
        setImageUrl(null);

        let images: ClientImage[] = [];

        if (item.herramientaId) {
          images = await imagesApi.getToolImages(item.herramientaId);
        } else if (item.insumoId) {
          images = await imagesApi.getSupplyImages(item.insumoId);
        } else {
          console.log(
            "[ViewInventoryModal] Item sin herramientaId ni insumoId",
            item
          );
        }

        if (images.length > 0) {
          setImageUrl(images[0].url); // usamos la más reciente
        } else {
          setImageUrl(null);
        }
      } catch (err: any) {
        console.error("Error cargando imagen de inventario:", err);
        setImageError(err.message || "No se pudo cargar la imagen asociada");
      } finally {
        setLoadingImage(false);
      }
    };

    loadImage();
  }, [isOpen, item]); // dependemos de isOpen e item

  if (!isOpen || !item) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>
            Detalle de la{" "}
            {item.tipo === "herramienta" ? "Herramienta" : "Insumo"}
          </h2>
          <button onClick={onClose}>✖</button>
        </header>

        <div className={styles.content}>
          <div className={styles.imageBox}>
            {loadingImage ? (
              <div className={styles.noImage}>Cargando imagen...</div>
            ) : imageUrl ? (
              <img src={imageUrl} alt={item.nombreItem} />
            ) : (
              <div className={styles.noImage}>Sin imagen</div>
            )}
            {imageError && <p className={styles.imageError}>{imageError}</p>}
          </div>

          <div className={styles.info}>
            <p>
              <strong>Nombre:</strong> {item.nombreItem}
            </p>
            <p>
              <strong>Cantidad:</strong> {item.cantidadActual}
            </p>
            <p>
              <strong>Ubicación:</strong> {item.ubicacion || "N/A"}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              {item.tool?.estado || item.supply?.estado || "Activo"}
            </p>

            <p>
              <strong>Tipo:</strong> {item.tipo}
            </p>

            {item.supply && (
              <>
                <p>
                  <strong>Unidad:</strong> {item.supply.unidadMedida}
                </p>
                <p>
                  <strong>Stock mínimo:</strong> {item.supply.stockMin}
                </p>
              </>
            )}

            <p>
              <strong>Última actualización:</strong>{" "}
              {new Date(item.fechaUltimaActualizacion).toLocaleDateString()}
            </p>
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
