// src/components/InProgress.tsx
import styles from '../styles/components/InProgress.module.css';

interface InProgressProps {
  moduleName?: string;
  estimatedDate?: string;
}

export default function InProgress({ 
  moduleName = "este módulo", 
  estimatedDate 
}: InProgressProps) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>🚧</div>
        <h1 className={styles.title}>¡Oops! Estamos trabajando en {moduleName}</h1>
        <p className={styles.description}>
          Este módulo se encuentra en desarrollo activo. Nuestro herramienta está 
          trabajando para brindarte la mejor experiencia posible.
        </p>
        
        <div className={styles.features}>
          <h3 className={styles.featuresTitle}>Próximamente incluirá:</h3>
          <ul className={styles.featuresList}>
            <li>✅ Funcionalidades completas</li>
            <li>✅ Interfaz optimizada</li>
            <li>✅ Experiencia de usuario mejorada</li>
            <li>✅ Integración con otros módulos</li>
          </ul>
        </div>

        {estimatedDate && (
          <div className={styles.estimatedDate}>
            <span className={styles.dateLabel}>Fecha estimada:</span>
            <span className={styles.dateValue}>{estimatedDate}</span>
          </div>
        )}

        <div className={styles.actions}>
          <button 
            className={styles.button}
            onClick={() => window.history.back()}
          >
            ← Volver atrás
          </button>
          <button 
            className={`${styles.button} ${styles.primary}`}
            onClick={() => window.location.href = '/dashboard'}
          >
            Ir al Dashboard
          </button>
        </div>

        <div className={styles.footer}>
          <p>Gracias por tu paciencia y comprensión</p>
          <p className={styles.team}>— Equipo de Desarrollo —</p>
        </div>
      </div>
    </div>
  );
}