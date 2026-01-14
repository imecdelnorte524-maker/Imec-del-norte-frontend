// src/components/common/ImageCarousel.tsx
import { useState } from "react";
import styles from "../../styles/components/common/ImageCarousel.module.css";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  interval?: number;
}

export default function ImageCarousel({
  images,
  alt = "Imagen",
  showControls = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className={styles.emptyCarousel}>
        <div className={styles.emptyIcon}>📷</div>
        <div className={styles.emptyText}>No hay imágenes disponibles</div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carousel}>
        <div
          className={styles.slidesContainer}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className={styles.slide}>
              <img
                src={image}
                alt={`${alt} ${index + 1}`}
                className={styles.image}
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {showControls && images.length > 1 && (
          <>
            <button
              className={`${styles.controlButton} ${styles.prevButton}`}
              onClick={goToPrevious}
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button
              className={`${styles.controlButton} ${styles.nextButton}`}
              onClick={goToNext}
              aria-label="Siguiente imagen"
            >
              ›
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className={styles.dotsContainer}>
            {images.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${
                  index === currentIndex ? styles.activeDot : ""
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className={styles.counter}>
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      <div className={styles.thumbnails}>
        {images.map((image, index) => (
          <button
            key={index}
            className={`${styles.thumbnail} ${
              index === currentIndex ? styles.activeThumbnail : ""
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Ver imagen ${index + 1}`}
          >
            <img
              src={image}
              alt={`Miniatura ${index + 1}`}
              className={styles.thumbnailImage}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
