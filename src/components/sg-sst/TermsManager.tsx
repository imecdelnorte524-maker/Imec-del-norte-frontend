// src/components/admin/TermsManager.tsx
import { useState, useEffect } from "react";
import { termsApi } from "../../api/terms";
import styles from "../../styles/components/sg-sst/TermsManager.module.css";
import type {
  TermsData,
  UpdateTermsDto,
} from "../../interfaces/TermsIntefaces";

// Lista de tipos de términos disponibles
const TERM_TYPES = [
  {
    value: "dataprivacy",
    label: "📋 Protección de Datos Personales",
    formType: "Todos los formularios",
  },
  {
    value: "ats",
    label: "⚠️ Análisis de Trabajo Seguro (ATS)",
    formType: "Formulario ATS",
  },
  {
    value: "height_work",
    label: "🧗 Trabajo en Alturas",
    formType: "Formulario Trabajo en Alturas",
  },
  {
    value: "preoperational_form",
    label: "✅ Checklist Preoperacional",
    formType: "Formulario Preoperacional",
  },
  { value: "security", label: "🛡️ Seguridad General", formType: "General" },
];

export default function TermsManager() {
  const [selectedType, setSelectedType] = useState("dataprivacy");
  const [terms, setTerms] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    items: [""],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadTerms();
  }, [selectedType]);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const data = await termsApi.getTermsByType(selectedType);
      setTerms(data);
      setFormData({
        title: data.title,
        description: data.description || "",
        items: data.items,
      });
      setEditing(false);
    } catch (error) {
      console.error("Error loading terms:", error);
      setMessage({ type: "error", text: "Error al cargar los términos" });
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, ""] });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const updateData: UpdateTermsDto = {
        title: formData.title,
        description: formData.description || undefined,
        items: formData.items.filter((item) => item.trim() !== ""),
      };

      const updated = await termsApi.updateTerms(selectedType, updateData);
      setTerms(updated);
      setEditing(false);
      setMessage({
        type: "success",
        text: "Términos actualizados correctamente",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al actualizar términos",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando términos...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Selector de tipo de términos */}
      <div className={styles.typeSelector}>
        <label className={styles.selectorLabel}>
          Seleccionar tipo de términos:
        </label>
        <div className={styles.typeButtons}>
          {TERM_TYPES.map((type) => (
            <button
              key={type.value}
              className={`${styles.typeButton} ${selectedType === type.value ? styles.activeType : ""}`}
              onClick={() => setSelectedType(type.value)}
            >
              <div className={styles.typeButtonLabel}>{type.label}</div>
              <div className={styles.typeButtonForm}>{type.formType}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mensajes de estado */}
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Header con información de versión */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h3 className={styles.termsTitle}>{terms?.title}</h3>
          {terms && (
            <div className={styles.versionBadge}>
              Versión {terms.version}
              {terms.updatedAt && (
                <span className={styles.versionDate}>
                  (Actualizado: {new Date(terms.updatedAt).toLocaleDateString()}
                  )
                </span>
              )}
            </div>
          )}
        </div>
        <button
          className={styles.editButton}
          onClick={() => setEditing(!editing)}
        >
          {editing ? "Cancelar" : "✏️ Editar"}
        </button>
      </div>

      {editing ? (
        <div className={styles.editor}>
          <div className={styles.field}>
            <label>Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={styles.input}
              placeholder="Ingrese el título"
            />
          </div>

          <div className={styles.field}>
            <label>Descripción (opcional)</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={styles.textarea}
              rows={3}
              placeholder="Descripción adicional que aparece antes de la lista"
            />
          </div>

          <div className={styles.field}>
            <label>Lista de puntos</label>
            <div className={styles.itemsList}>
              {formData.items.map((item, index) => (
                <div key={index} className={styles.itemRow}>
                  <span className={styles.itemNumber}>{index + 1}.</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    className={styles.itemInput}
                    placeholder={`Punto ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className={styles.removeButton}
                    disabled={formData.items.length === 1}
                    title="Eliminar punto"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className={styles.addButton}
            >
              + Agregar nuevo punto
            </button>
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleSave}
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? "Guardando..." : "💾 Guardar cambios"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.preview}>
          {terms?.description && (
            <div className={styles.descriptionBox}>
              <p>{terms.description}</p>
            </div>
          )}
          <div className={styles.itemsPreview}>
            <p className={styles.declarationText}>Declaro que:</p>
            <ul>
              {terms?.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
          <div className={styles.infoBox}>
            <p className={styles.infoText}>
              ℹ️ Estos términos se mostrarán en el modal correspondiente cuando
              el usuario haga clic en "términos y condiciones" dentro del
              formulario.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
