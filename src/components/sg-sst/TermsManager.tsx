import { useState, useEffect } from "react";
import { termsApi } from "../../api/terms";
import styles from "../../styles/components/sg-sst/TermsManager.module.css";
import type {
  TermsData,
  UpdateTermsDto,
  CreateTermsDto,
} from "../../interfaces/TermsIntefaces";

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
];

export default function TermsManager() {
  const [selectedType, setSelectedType] = useState("dataprivacy");
  const [terms, setTerms] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);

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
      setMessage(null);

      const data = await termsApi.getTermsByType(selectedType);
      setTerms(data);
      setFormData({
        title: data.title,
        description: data.description || "",
        items: data.items?.length ? data.items : [""],
      });
      setEditing(false);
      setCreating(false);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setTerms(null);
        setFormData({
          title: "",
          description: "",
          items: [""],
        });
        setCreating(true);
        setEditing(true);
        setMessage({
          type: "error",
          text: "No existen términos para este tipo. Puedes crearlos ahora.",
        });
      } else {
        console.error("Error loading terms:", error);
        setMessage({ type: "error", text: "Error al cargar los términos" });
      }
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
    setFormData({ ...formData, items: newItems.length ? newItems : [""] });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const cleanItems = formData.items.filter((item) => item.trim() !== "");

      if (!formData.title.trim()) {
        setMessage({ type: "error", text: "El título es obligatorio" });
        return;
      }

      if (!cleanItems.length) {
        setMessage({
          type: "error",
          text: "Debes agregar al menos un punto en la lista",
        });
        return;
      }

      if (creating || !terms) {
        const createData: CreateTermsDto = {
          type: selectedType,
          title: formData.title,
          description: formData.description || undefined,
          items: cleanItems,
          isActive: true,
        };

        const created = await termsApi.createTerms(createData);
        setTerms(created);
        setCreating(false);
        setEditing(false);
        setMessage({
          type: "success",
          text: "Términos creados correctamente",
        });
      } else {
        const updateData: UpdateTermsDto = {
          title: formData.title,
          description: formData.description || undefined,
          items: cleanItems,
        };

        const updated = await termsApi.updateTerms(selectedType, updateData);
        setTerms(updated);
        setEditing(false);
        setMessage({
          type: "success",
          text: "Términos actualizados correctamente",
        });
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al guardar términos",
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
      <div className={styles.typeSelector}>
        <label className={styles.selectorLabel}>
          Seleccionar tipo de términos:
        </label>
        <div className={styles.typeButtons}>
          {TERM_TYPES.map((type) => (
            <button
              key={type.value}
              className={`${styles.typeButton} ${selectedType === type.value ? styles.activeType : ""
                }`}
              onClick={() => setSelectedType(type.value)}
            >
              <div className={styles.typeButtonLabel}>{type.label}</div>
              <div className={styles.typeButtonForm}>{type.formType}</div>
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h3 className={styles.termsTitle}>
            {terms?.title || "Términos no configurados"}
          </h3>
          {terms ? (
            <div className={styles.versionBadge}>
              Versión {terms.version}
              {terms.updatedAt && (
                <span className={styles.versionDate}>
                  (Actualizado: {new Date(terms.updatedAt).toLocaleDateString()})
                </span>
              )}
            </div>
          ) : (
            <div className={styles.versionBadge}>Sin registro</div>
          )}
        </div>

        <button
          className={styles.editButton}
          onClick={() => setEditing(!editing)}
        >
          {editing ? "Cancelar" : creating ? "➕ Crear" : "✏️ Editar"}
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
              placeholder="Descripción adicional"
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
              {saving
                ? "Guardando..."
                : creating
                  ? "💾 Crear términos"
                  : "💾 Guardar cambios"}
            </button>
          </div>
        </div>
      ) : terms ? (
        <div className={styles.preview}>
          {terms.description && (
            <div className={styles.descriptionBox}>
              <p>{terms.description}</p>
            </div>
          )}

          <div className={styles.itemsPreview}>
            <p className={styles.declarationText}>Declaro que:</p>
            <ul>
              {terms.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.infoBox}>
            <p className={styles.infoText}>
              ℹ️ Estos términos se mostrarán en el modal correspondiente dentro del formulario.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.preview}>
          <div className={styles.infoBox}>
            <p className={styles.infoText}>
              No existen términos configurados para este tipo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}