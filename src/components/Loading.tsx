// src/components/Loading.tsx
import React from "react";
import styles from "../styles/components/Loading.module.css";

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
  size?: "small" | "medium" | "large";
}

const Loading: React.FC<LoadingProps> = ({
  fullScreen = false,
  message = "Cargando...",
  size = "medium",
}) => {
  const containerClass = fullScreen
    ? styles.fullScreenContainer
    : styles.container;

  return (
    <div className={containerClass}>
      <div className={`${styles.loadingSpinner} ${styles[size]}`}>
        {/* Aquí irá tu GIF */}
        <img
          src="/Assets/gifs/Loading.gif"
          alt="Cargando"
          className={styles.loadingGif}
        />
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default Loading;
