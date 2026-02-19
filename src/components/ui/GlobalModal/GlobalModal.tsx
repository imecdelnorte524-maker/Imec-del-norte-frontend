// components/ui/GlobalModal/GlobalModal.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useModal, type ModalButton } from '../../../context/ModalContext';
import styles from './GlobalModal.module.css';

const iconMap = {
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  conflict: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
      <path d="M8 5h8M8 19h8" />
    </svg>
  ),
};

export const GlobalModal: React.FC = () => {
  const { isOpen, modalConfig, hideModal } = useModal();

  // Manejar tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && modalConfig?.closeOnClickOutside !== false) {
        hideModal();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, modalConfig, hideModal]);

  // Prevenir scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !modalConfig) return null;

  const handleButtonClick = (button: ModalButton) => {
    if (button.onClick) {
      button.onClick();
    }
    if (button.autoClose !== false) {
      hideModal();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && modalConfig.closeOnClickOutside !== false) {
      hideModal();
    }
  };

  const modalContent = (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={`${styles.modal} ${styles[modalConfig.type]} ${styles[modalConfig.size || 'medium']}`}>
        <div className={styles.header}>
          <h3>
            {iconMap[modalConfig.type]}
            {modalConfig.title}
          </h3>
          {modalConfig.showCloseButton !== false && (
            <button onClick={hideModal} className={styles.closeButton}>
              ×
            </button>
          )}
        </div>

        <div className={styles.content}>
          {typeof modalConfig.message === 'string' ? (
            <p className={styles.message}>{modalConfig.message}</p>
          ) : (
            modalConfig.message
          )}

          {/* Renderizar conflictos si existen */}
          {modalConfig.conflicts && modalConfig.conflicts.length > 0 && (
            <ul className={styles.conflictList}>
              {modalConfig.conflicts.map((conflict) => (
                <li key={conflict.id} className={styles.conflictItem}>
                  <div className={styles.conflictHeader}>
                    {conflict.icon}
                    <span className={styles.conflictTitle}>{conflict.title}</span>
                  </div>
                  {conflict.description && (
                    <p className={styles.conflictDescription}>{conflict.description}</p>
                  )}
                  {conflict.details && (
                    <div className={styles.conflictDetails}>
                      {Object.entries(conflict.details).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <span className={styles.conflictLabel}>{key}:</span>
                          <span className={styles.conflictValue}>{value}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.footer}>
          {modalConfig.buttons ? (
            modalConfig.buttons.map((button, index) => (
              <button
                key={index}
                onClick={() => handleButtonClick(button)}
                className={`${styles.button} ${
                  button.variant === 'primary' ? styles.buttonPrimary :
                  button.variant === 'danger' ? styles.buttonDanger :
                  styles.buttonSecondary
                }`}
              >
                {button.text}
              </button>
            ))
          ) : (
            <button onClick={hideModal} className={`${styles.button} ${styles.buttonPrimary}`}>
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};