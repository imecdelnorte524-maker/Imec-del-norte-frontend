"use client"

// src/components/equipment-detail/PhotoCarousel.tsx
import type { EquipmentPhoto } from "../../../interfaces/EquipmentInterfaces"
import styles from "../../../styles/components/equipment/equipment-details/PhotoCarousel.module.css"

interface PhotoCarouselProps {
  photos: EquipmentPhoto[]
  currentIndex: number
  photoLoading: boolean
  photoError: string | null
  onPrev: () => void
  onNext: () => void
  onPhotoClick: (photo: EquipmentPhoto) => void
}

export default function PhotoCarousel({
  photos,
  currentIndex,
  photoLoading,
  photoError,
  onPrev,
  onNext,
  onPhotoClick,
}: PhotoCarouselProps) {
  const photosCount = photos.length
  const safeIndex = photosCount > 0 ? Math.min(currentIndex, photosCount - 1) : 0
  const currentPhoto = photosCount > 0 ? photos[safeIndex] : null

  return (
    <div className={styles.section}>
      <h3>Fotos del Equipo</h3>

      {photoError && <div className={styles.error}>{photoError}</div>}

      <div className={styles.carouselWrapper}>
        <div className={styles.carouselMain}>
          {currentPhoto ? (
            <>
              {photosCount > 1 && (
                <button
                  type="button"
                  className={`${styles.carouselNavButton} ${styles.carouselNavLeft}`}
                  onClick={onPrev}
                  disabled={photoLoading}
                >
                  ‹
                </button>
              )}

              <img
                src={currentPhoto.url || "/placeholder.svg"}
                alt={currentPhoto.description || "Foto del equipo"}
                className={styles.carouselImage}
                onClick={() => onPhotoClick(currentPhoto)}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />

              {photosCount > 1 && (
                <button
                  type="button"
                  className={`${styles.carouselNavButton} ${styles.carouselNavRight}`}
                  onClick={onNext}
                  disabled={photoLoading}
                >
                  ›
                </button>
              )}

              <div className={styles.carouselInfo}>
                Foto {safeIndex + 1} de {photosCount}
              </div>
            </>
          ) : (
            <p className={styles.emptyPhotos}>No hay fotos registradas para este equipo.</p>
          )}
        </div>
      </div>
    </div>
  )
}
