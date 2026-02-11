import { useEffect } from "react";
import { FormType } from "../../../interfaces/SgSstInterface";
import styles from "../../../styles/components/sg-sst/forms/FormSelectionModal.module.css";

interface FormSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormSelect: (formType: FormType) => void;
}

export default function FormSelectionModal({
  isOpen,
  onClose,
  onFormSelect,
}: FormSelectionModalProps) {
  if (!isOpen) return null;

  const formTypes = [
    {
      type: FormType.ATS,
      title: "Análisis de Trabajo Seguro (ATS)",
      description:
        "Identificación y control de riesgos antes de iniciar trabajos",
      icon: "📋",
      color: "#3B82F6",
    },
    {
      type: FormType.HEIGHT_WORK,
      title: "Trabajo en Alturas",
      description: "Permiso y control para trabajos en alturas",
      icon: "🪜",
      color: "#EF4444",
    },
    {
      type: FormType.PREOPERATIONAL,
      title: "Checklist Preoperacional",
      description: "Verificación de equipos y herramientas antes del uso",
      icon: "🔧",
      color: "#10B981",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      // Guardar la posición actual del scroll
      const scrollY = window.scrollY;

      // Prevenir scroll del body
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // Restaurar scroll del body
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Seleccionar Tipo de Formulario</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.subtitle}>
            Elige el tipo de formulario que deseas crear:
          </p>

          <div className={styles.formOptions}>
            {formTypes.map((form) => (
              <div
                key={form.type}
                className={styles.formOption}
                onClick={() => onFormSelect(form.type)}
                style={{ borderLeftColor: form.color }}
              >
                <div className={styles.formIcon} style={{ color: form.color }}>
                  {form.icon}
                </div>
                <div className={styles.formInfo}>
                  <h3 className={styles.formTitle}>{form.title}</h3>
                  <p className={styles.formDescription}>{form.description}</p>
                </div>
                <div className={styles.formArrow}>→</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
