// src/components/inventory/EditInventoryModal.tsx
import { useState, useEffect } from 'react';
import { inventory } from '../../api/inventory';
import { warehouses, type Warehouse } from '../../api/warehouses';
import { toolsApi } from '../../api/tools';
import { suppliesApi } from '../../api/supplies';
import { imagesApi } from '../../api/images';
import type { Inventory } from '../../interfaces/InventoryInterfaces';
import {
  ToolStatus,
  SupplyStatus,
} from '../../shared/enums/inventory.enum';
import UnitMeasureAutocomplete from '../common/UnitMeasureAutocomplete';
import MultiImageUpload from '../common/MultiImageUpload';
import styles from '../../styles/components/inventory/EditInventoryModal.module.css';
import { playErrorSound } from '../../utils/sounds';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: Inventory | null;
}

export default function EditInventoryModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: EditInventoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    // Campos para inventario
    cantidadActual: 0,
    bodegaId: null as number | null,
    
    // Campos para tool/supply
    nombre: '',
    estado: '',
    valorUnitario: 0,
    unidadMedida: '',
    stockMin: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
      if (item) {
        loadExistingImages();
        setFormData({
          cantidadActual: item.cantidadActual,
          bodegaId: item.bodegaId || null,
          estado: item.tool?.estado || item.supply?.estado || 'Disponible',
          nombre: item.nombreItem,
          unidadMedida: item.supply?.unidadMedida || '',
          stockMin: item.supply?.stockMin || 0,
          valorUnitario: item.supply?.valorUnitario || item.tool?.valorUnitario || 0,
        });
      }
    }
    
    // Resetear el estado cuando se cierra el modal
    if (!isOpen) {
      setError(null);
      setNewImages([]);
    }
  }, [isOpen, item]);

  const loadWarehouses = async () => {
    try {
      setLoadingWarehouses(true);
      const data = await warehouses.getAll();
      setWarehousesList(data);
    } catch (err) {
      console.error("Error cargando bodegas:", err);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const loadExistingImages = async () => {
    if (!item) return;

    try {
      let images: string[] = [];
      if (item.herramientaId) {
        const toolImages = await imagesApi.getToolImages(item.herramientaId);
        images = toolImages.map(img => img.url);
      } else if (item.insumoId) {
        const supplyImages = await imagesApi.getSupplyImages(item.insumoId);
        images = supplyImages.map(img => img.url);
      }
      setExistingImages(images);
    } catch (err) {
      console.error("Error cargando imágenes:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Preparar datos para inventario
      const inventoryUpdateData: any = {
        cantidadActual: formData.cantidadActual,
      };

      // Solo incluir bodegaId si hay un valor
      if (formData.bodegaId !== undefined && formData.bodegaId !== null) {
        inventoryUpdateData.bodegaId = formData.bodegaId;
      }

      // 2. Actualizar el registro de inventario
      await inventory.updateInventory(item.inventarioId, inventoryUpdateData);

      // 3. Actualizar tool o supply según corresponda
      if (item.tipo === 'insumo' && item.supply && item.insumoId) {
        // Actualizar insumo
        try {
          const supplyUpdateData = {
            nombre: formData.nombre,
            estado: formData.estado,
            valorUnitario: formData.valorUnitario,
            unidadMedida: formData.unidadMedida,
            stockMin: formData.stockMin,
          };
          
          // Usar la API de insumos para actualizar
          await suppliesApi.updateSupply(item.insumoId, supplyUpdateData);
        } catch (supplyError: any) {
          console.warn("⚠️ Error actualizando insumo:", supplyError);
        }
      } else if (item.tipo === 'herramienta' && item.tool && item.herramientaId) {
        // Actualizar herramienta
        try {
          const toolUpdateData = {
            nombre: formData.nombre,
            estado: formData.estado,
            valorUnitario: formData.valorUnitario,
          };
          
          // Usar la API de herramientas para actualizar
          await toolsApi.updateTool(item.herramientaId, toolUpdateData);
        } catch (toolError: any) {
          console.warn("⚠️ Error actualizando herramienta:", toolError);
        }
      }

      // 4. Subir nuevas imágenes si hay
      if (newImages.length > 0) {
        try {
          if (item.herramientaId) {
            await imagesApi.uploadToolImages(item.herramientaId, newImages);
          } else if (item.insumoId) {
            await imagesApi.uploadSupplyImages(item.insumoId, newImages);
          }
        } catch (imgError: any) {
          console.warn("⚠️ No se pudieron subir todas las imágenes:", imgError?.message);
        }
      }

      // 5. Notificar éxito y cerrar
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Error detallado:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        config: err.config
      });
      
      // Mostrar error detallado
      if (err.response?.data?.message) {
        const errorMessages = Array.isArray(err.response.data.message) 
          ? err.response.data.message.join(', ')
          : err.response.data.message;
        setError(`Error: ${errorMessages}`);
      } else if (err.response?.data?.error) {
        setError(`Error: ${err.response.data.error}`);
      } else {
        setError(err.message || 'Error al actualizar el item');
      }
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!item) return;

    try {
      setLoading(true);
      setError(null);

      const response = await inventory.updateStock(
        item.inventarioId,
        formData.cantidadActual,
      );
      
      console.log('✅ Stock actualizado:', response);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Error actualizando stock:', err);
      
      if (err.response?.data?.message) {
        setError(`Error: ${err.response.data.message}`);
      } else {
        setError(err.message || 'Error al actualizar stock');
      }
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  if (!isOpen || !item) return null;

  const isInsumo = item.tipo === 'insumo';
  const isHerramienta = item.tipo === 'herramienta';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <span className={styles.icon}>
              {isHerramienta ? '🛠️' : '📦'}
            </span>
            Editar {isHerramienta ? 'Herramienta' : 'Insumo'}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            ×
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.required}>*</span>
              Nombre
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className={styles.input}
              required
              disabled={loading}
              placeholder="Nombre del item"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.required}>*</span>
              Cantidad Actual
            </label>
            <div className={styles.quantityControl}>
              <input
                type="number"
                value={formData.cantidadActual}
                onChange={(e) => handleNumberChange('cantidadActual', e.target.value)}
                min="0"
                step={isInsumo && formData.unidadMedida === 'Unidad' ? '1' : '0.01'}
                className={styles.input}
                required
                disabled={loading}
              />
              {isInsumo && (
                <span className={styles.unitLabel}>
                  {formData.unidadMedida || item.supply?.unidadMedida}
                </span>
              )}
            </div>
          </div>

          {isInsumo && item.supply && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span className={styles.required}>*</span>
                  Unidad de Medida
                </label>
                <UnitMeasureAutocomplete
                  value={formData.unidadMedida}
                  onChange={(unitName) => handleInputChange('unidadMedida', unitName)}
                  disabled={loading}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.stockMin}
                    onChange={(e) => handleNumberChange('stockMin', e.target.value)}
                    min="0"
                    step={formData.unidadMedida === 'Unidad' ? '1' : '0.01'}
                    className={styles.input}
                    disabled={loading}
                    placeholder="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Valor Unitario (COP)
                  </label>
                  <div className={styles.currencyInput}>
                    <span className={styles.currencySymbol}>$</span>
                    <input
                      type="number"
                      value={formData.valorUnitario}
                      onChange={(e) => handleNumberChange('valorUnitario', e.target.value)}
                      min="0"
                      step="0.01"
                      className={styles.input}
                      disabled={loading}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  {Object.values(SupplyStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {isHerramienta && item.tool && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Valor Unitario (COP)
                </label>
                <div className={styles.currencyInput}>
                  <span className={styles.currencySymbol}>$</span>
                    <input
                      type="number"
                      value={formData.valorUnitario}
                      onChange={(e) => handleNumberChange('valorUnitario', e.target.value)}
                      min="0"
                      step="0.01"
                      className={styles.input}
                      disabled={loading}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className={styles.select}
                    disabled={loading}
                  >
                    {Object.values(ToolStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Marca
                    </label>
                    <input
                      type="text"
                      value={item.tool.marca || 'No especificada'}
                      className={`${styles.input} ${styles.disabled}`}
                      disabled
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Serial
                    </label>
                    <input
                      type="text"
                      value={item.tool.serial || 'No especificado'}
                      className={`${styles.input} ${styles.disabled}`}
                      disabled
                    />
                  </div>
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Bodega
              </label>
              {loadingWarehouses ? (
                <div className={styles.loadingSmall}>Cargando bodegas...</div>
              ) : (
                <select
                  value={formData.bodegaId || ""}
                  onChange={(e) => handleInputChange('bodegaId', e.target.value ? Number(e.target.value) : null)}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="">Sin asignar bodega</option>
                  {warehousesList.map((warehouse) => (
                    <option key={warehouse.bodegaId} value={warehouse.bodegaId}>
                      {warehouse.nombre}
                      {!warehouse.activa && " (Inactiva)"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Imágenes
              </label>
              <MultiImageUpload
                onImagesChange={setNewImages}
                existingImages={existingImages}
                onRemoveExisting={handleRemoveExistingImage}
                maxFiles={10}
                maxSizeMB={5}
                disabled={loading}
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.btnSecondary}
                disabled={loading}
              >
                Cancelar
              </button>

              {isInsumo && (
                <button
                  type="button"
                  onClick={handleUpdateStock}
                  className={styles.btnWarning}
                  disabled={loading}
                >
                  {loading ? 'Actualizando...' : 'Solo Stock'}
                </button>
              )}

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }