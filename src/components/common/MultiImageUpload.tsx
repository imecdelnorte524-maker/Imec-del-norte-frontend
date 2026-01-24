// src/components/common/MultiImageUpload.tsx
import { useState, useRef, useEffect } from "react";
import styles from "../../styles/components/common/MultiImageUpload.module.css";

interface ImagePreview {
  id: string;
  file: File;
  previewUrl: string;
  isUploading: boolean;
}

interface MultiImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string;
  existingImages?: string[];
  onRemoveExisting?: (index: number) => void;
  disabled?: boolean; // AÑADIR ESTA PROPIEDAD
}

export default function MultiImageUpload({
  onImagesChange,
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedTypes = "image/*",
  existingImages = [],
  onRemoveExisting,
  disabled = false, // VALOR POR DEFECTO
}: MultiImageUploadProps) {
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [uploading, ] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = imagePreviews.length + existingImages.length;

  useEffect(() => {
    return () => {
      // Limpiar URLs de preview
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview.previewUrl));
    };
  }, [imagePreviews]);

  const validateFile = (file: File): boolean => {
    if (!file.type.match("image.*")) {
      setError("Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)");
      return false;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`La imagen no debe superar los ${maxSizeMB}MB`);
      return false;
    }

    if (totalImages >= maxFiles) {
      setError(`No puedes subir más de ${maxFiles} imágenes`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return; // PREVENIR SI ESTÁ DESHABILITADO
    
    const files = Array.from(e.target.files || []);
    setError(null);

    const validFiles = files.filter(validateFile);

    if (validFiles.length === 0) return;

    const newPreviews: ImagePreview[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      isUploading: false,
    }));

    setImagePreviews(prev => [...prev, ...newPreviews]);
    onImagesChange([...imagePreviews.map(p => p.file), ...validFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePreview = (id: string) => {
    if (disabled) return; // PREVENIR SI ESTÁ DESHABILITADO
    
    setImagePreviews(prev => {
      const removed = prev.find(p => p.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      const newPreviews = prev.filter(p => p.id !== id);
      onImagesChange(newPreviews.map(p => p.file));
      return newPreviews;
    });
  };

  const handleRemoveExisting = (index: number) => {
    if (disabled) return; // PREVENIR SI ESTÁ DESHABILITADO
    
    if (onRemoveExisting) {
      onRemoveExisting(index);
    }
  };

  const triggerFileInput = () => {
    if (disabled) return; // PREVENIR SI ESTÁ DESHABILITADO
    
    fileInputRef.current?.click();
  };

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      <label className={styles.label}>
        Imágenes ({totalImages}/{maxFiles})
        <small className={styles.helpText}>
          Puedes subir hasta {maxFiles} imágenes, máximo {maxSizeMB}MB cada una
        </small>
      </label>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.uploadArea}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes}
          multiple
          className={styles.fileInput}
          disabled={disabled || uploading || totalImages >= maxFiles}
        />

        <button
          type="button"
          onClick={triggerFileInput}
          className={`${styles.uploadButton} ${disabled ? styles.disabledButton : ''}`}
          disabled={disabled || uploading || totalImages >= maxFiles}
        >
          <span className={styles.uploadIcon}>📷</span>
          <span className={styles.uploadText}>
            {disabled ? 'Subida deshabilitada' : 'Seleccionar Imágenes'}
          </span>
          <span className={styles.uploadSubtext}>
            {disabled 
              ? 'Complete los campos requeridos'
              : `Hasta ${maxFiles - totalImages} restantes`
            }
          </span>
        </button>
      </div>

      {(imagePreviews.length > 0 || existingImages.length > 0) && (
        <div className={styles.imagesGrid}>
          {/* Imágenes existentes */}
          {existingImages.map((url, index) => (
            <div key={`existing-${index}`} className={styles.imageContainer}>
              <img 
                src={url} 
                alt={`Existente ${index + 1}`} 
                className={styles.image} 
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveExisting(index)}
                  className={styles.removeButton}
                  title="Eliminar imagen"
                  disabled={disabled}
                >
                  ×
                </button>
              )}
              <div className={styles.imageTypeBadge}>Existente</div>
            </div>
          ))}

          {/* Previews de nuevas imágenes */}
          {imagePreviews.map(preview => (
            <div key={preview.id} className={styles.imageContainer}>
              <img src={preview.previewUrl} alt="Preview" className={styles.image} />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemovePreview(preview.id)}
                  className={styles.removeButton}
                  title="Eliminar imagen"
                  disabled={disabled}
                >
                  ×
                </button>
              )}
              <div className={styles.imageTypeBadge}>Nueva</div>
              {preview.isUploading && (
                <div className={styles.uploadingOverlay}>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className={styles.uploadingMessage}>
          Subiendo {imagePreviews.filter(p => p.isUploading).length} de {imagePreviews.length} imágenes...
        </div>
      )}

      {disabled && (
        <div className={styles.disabledMessage}>
          ⚠️ Complete los campos requeridos para habilitar la subida de imágenes
        </div>
      )}
    </div>
  );
}