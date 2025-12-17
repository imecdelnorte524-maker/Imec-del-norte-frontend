import styles from '../../styles/components/inventory/ViewInventoryModal.module.css';
import type { Inventory } from '../../interfaces/InventoryInterfaces';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: Inventory | null;
}

export default function ViewInventoryModal({
  isOpen,
  onClose,
  item,
}: Props) {
  if (!isOpen || !item) return null;

  const imageUrl =
    item.tool?.fotoUrl ||
    item.supply?.fotoUrl ||
    null;

  console.log('Image URL:', imageUrl);

  const urlBase = import.meta.env.VITE_API_URL || 'https://fvwg9xhq-4001.use.devtunnels.ms/api';

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <header className={styles.header}>
          <h2>Detalle de la {item.tipo === 'herramienta' ? 'Herramienta' : 'Insumo'}</h2>
          <button onClick={onClose}>✖</button>
        </header>

        <div className={styles.content}>
          <div className={styles.imageBox}>
            {imageUrl ? (
              <img src={`${urlBase}${imageUrl}`} alt={item.nombreItem} />
            ) : (
              <div className={styles.noImage}>
                Sin imagen
              </div>
            )}
          </div>

          <div className={styles.info}>
            <p><strong>Nombre:</strong> {item.nombreItem}</p>
            <p><strong>Cantidad:</strong> {item.cantidadActual}</p>
            <p><strong>Ubicación:</strong> {item.ubicacion || 'N/A'}</p>
            <p><strong>Estado:</strong> {item.tool?.estado || item.supply?.estado || 'Activo'}</p>

            <p><strong>Tipo:</strong> {item.tipo}</p>

            {item.supply && (
              <>
                <p><strong>Unidad:</strong> {item.supply.unidadMedida}</p>
                <p><strong>Stock mínimo:</strong> {item.supply.stockMin}</p>
              </>
            )}

            <p>
              <strong>Última actualización:</strong>
              {' '}
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
