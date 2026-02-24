// src/components/sg-sst/forms/PreoperationalTemplateForm.tsx
import { useState } from "react";
import { sgSstService } from "../../../api/sg-sst";
import styles from "../../../styles/components/sg-sst/forms/PreoperationalTemplateForm.module.css";
import type {
  PreopChecklistParameterPayload,
  PreopChecklistTemplatePayload,
  PreopParamCategory,
} from "../../../interfaces/SgSstInterface";

const CATEGORIES: PreopParamCategory[] = [
  "safety",
  "functional",
  "visual",
  "operational",
  "electrical",
];

const INITIAL_TEMPLATE: PreopChecklistTemplatePayload = {
  toolType: "",
  toolCategory: "HERRAMIENTA",
  estimatedTime: 5,
  additionalInstructions: "",
  requiresTools: [],
  parameters: [],
};

// 👉 helper para el código siguiente
const getNextParameterCode = (
  params: PreopChecklistParameterPayload[],
  digits = 5, // 00021 -> 5 dígitos
): string => {
  const codesAsNumbers = params
    .map((p) =>
      p.parameterCode && /^\d+$/.test(p.parameterCode)
        ? parseInt(p.parameterCode, 10)
        : NaN,
    )
    .filter((n) => !Number.isNaN(n));

  const max = codesAsNumbers.length ? Math.max(...codesAsNumbers) : 0;
  const next = max + 1;

  return next.toString().padStart(digits, "0");
};

export default function PreoperationalTemplateForm() {
  const [template, setTemplate] =
    useState<PreopChecklistTemplatePayload>(INITIAL_TEMPLATE);

  const [requiresToolsText, setRequiresToolsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(
    null,
  );
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const handleParamChange = (
    index: number,
    field: keyof PreopChecklistParameterPayload,
    value: any,
  ) => {
    setTemplate((prev) => {
      const parameters = [...prev.parameters];
      parameters[index] = {
        ...parameters[index],
        [field]: value,
      };
      return { ...prev, parameters };
    });
  };

  const handleAddParameter = () => {
    setTemplate((prev) => {
      const nextCode = getNextParameterCode(prev.parameters);

      return {
        ...prev,
        parameters: [
          ...prev.parameters,
          {
            parameterCode: nextCode, // código auto
            parameter: "",
            description: "",
            category: "safety",
            required: true,
            critical: false,
            displayOrder: prev.parameters.length,
          },
        ],
      };
    });
  };

  const handleRemoveParameter = (index: number) => {
    setTemplate((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!template.toolType.trim() || !template.toolCategory.trim()) {
      setError("Nombre de herramienta y la categoria son obligatorios");
      return;
    }

    if (template.parameters.length === 0) {
      setError("Debe agregar al menos un parámetro");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: PreopChecklistTemplatePayload = {
        ...template,
        toolType: template.toolType.trim().toUpperCase(),
        toolCategory: template.toolCategory.trim().toUpperCase(),
        requiresTools: requiresToolsText
          ? requiresToolsText
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        parameters: template.parameters.map((p, idx) => ({
          ...p,
          displayOrder: p.displayOrder ?? idx,
        })),
      };

      let res;
      if (editingTemplateId) {
        // 🔹 Modo edición: actualizamos la plantilla existente
        res = await sgSstService.updatePreoperationalTemplate(
          editingTemplateId,
          payload,
        );
      } else {
        // 🔹 Modo creación: creamos una nueva plantilla
        res = await sgSstService.createPreoperationalTemplate(payload);
      }

      if (res.success) {
        setSuccess(
          editingTemplateId
            ? "Plantilla actualizada exitosamente"
            : "Plantilla creada exitosamente",
        );

        if (!editingTemplateId) {
          // Si era nueva, limpiamos todo
          setTemplate(INITIAL_TEMPLATE);
          setRequiresToolsText("");
          setEditingTemplateId(null);
        }
      } else {
        setError(res.message || "Error al guardar plantilla");
      }
    } catch (err: any) {
      console.error("Error guardando plantilla:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadTemplate = async () => {
    setError(null);
    setSuccess(null);

    const rawToolType = template.toolType.trim();
    if (!rawToolType) {
      setError("Ingresa un nombre de herramineta para buscar la plantilla");
      return;
    }

    setIsLoadingTemplate(true);
    try {
      const data = await sgSstService.getPreoperationalTemplate(
        rawToolType.toUpperCase(),
      );

      if (!data) {
        setEditingTemplateId(null);
        setError("No se encontró una plantilla para ese toolType");
        return;
      }

      // Guardamos el ID de la plantilla que vamos a editar
      setEditingTemplateId(data.id);

      // Pasamos los datos del backend al estado del formulario
      setTemplate({
        toolType: data.toolType,
        toolCategory: data.toolCategory,
        estimatedTime: data.estimatedTime,
        additionalInstructions: data.additionalInstructions || "",
        requiresTools: data.requiresTools || [],
        parameters: data.parameters.map((p) => ({
          parameterCode: p.parameterCode,
          parameter: p.parameter,
          description: p.description,
          category: p.category,
          required: p.required,
          critical: p.critical,
          displayOrder: p.displayOrder,
        })),
      });

      setRequiresToolsText((data.requiresTools || []).join(", "));
      setSuccess(
        "Plantilla cargada. Ahora puedes editar o agregar parámetros.",
      );
    } catch (err: any) {
      console.error("Error cargando plantilla:", err);
      setEditingTemplateId(null);
      setError(
        err.response?.data?.message ||
          "No se pudo cargar la plantilla para ese toolType",
      );
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {editingTemplateId
              ? "Editar Plantilla Preoperacional"
              : "Crear Plantilla Preoperacional"}
          </h1>
          <p className={styles.subtitle}>
            Define los parámetros de inspección para un tipo de herramienta.
          </p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* DATOS GENERALES */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Datos generales</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre de herramienta</label>
                <div className={styles.inputRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={template.toolType}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        toolType: e.target.value,
                      }))
                    }
                    placeholder="Ej: ESCALERA, PULIDORA, HERRAMIENTA GENERAL"
                  />

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleLoadTemplate}
                    disabled={isLoadingTemplate}
                  >
                    {isLoadingTemplate ? "Cargando..." : "Cargar plantilla"}
                  </button>
                </div>
                {editingTemplateId && (
                  <p className={styles.helperText}>
                    Editando plantilla existente (ID: {editingTemplateId})
                  </p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Categoría</label>
                <input
                  type="text"
                  className={styles.input}
                  value={template.toolCategory}
                  onChange={(e) =>
                    setTemplate((prev) => ({
                      ...prev,
                      toolCategory: e.target.value,
                    }))
                  }
                  placeholder="Ej: HERRAMIENTAS, INSTRUMENTOS"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tiempo estimado (minutos)
                </label>
                <input
                  type="number"
                  className={styles.input}
                  value={template.estimatedTime ?? 5}
                  onChange={(e) =>
                    setTemplate((prev) => ({
                      ...prev,
                      estimatedTime: Number(e.target.value) || 5,
                    }))
                  }
                />
              </div>

              {/* Si quieres usar requiresToolsText, descomenta esto */}
              {/* <div className={styles.formGroup}>
                <label className={styles.label}>
                  Herramientas requeridas (separadas por coma)
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={requiresToolsText}
                  onChange={(e) => setRequiresToolsText(e.target.value)}
                  placeholder="Guantes, Lentes, ..."
                />
              </div> */}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Instrucciones adicionales</label>
              <textarea
                className={styles.textarea}
                value={template.additionalInstructions || ""}
                onChange={(e) =>
                  setTemplate((prev) => ({
                    ...prev,
                    additionalInstructions: e.target.value,
                  }))
                }
              />
            </div>
          </section>

          {/* PARÁMETROS */}
          <section className={styles.section}>
            <div className={styles.paramsHeader}>
              <h2 className={styles.paramsTitle}>Parámetros del checklist</h2>
              <button
                type="button"
                className={styles.addParamButton}
                onClick={handleAddParameter}
              >
                + Agregar parámetro
              </button>
            </div>

            <div className={styles.paramsList}>
              {template.parameters.map((param, index) => (
                <div key={index} className={styles.paramCard}>
                  <div className={styles.paramHeader}>
                    <div>
                      <div className={styles.paramTitle}>
                        Parámetro #{index + 1}
                      </div>
                      <div className={styles.paramMeta}>
                        {param.parameterCode || "Sin código"} · Orden:{" "}
                        {param.displayOrder ?? index}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.removeParamButton}
                      onClick={() => handleRemoveParameter(index)}
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className={styles.paramBody}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Código (opcional)</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={param.parameterCode || ""}
                        onChange={(e) =>
                          handleParamChange(
                            index,
                            "parameterCode",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Parámetro *</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={param.parameter}
                        placeholder="Dato a ser evaluado"
                        onChange={(e) =>
                          handleParamChange(index, "parameter", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Descripción</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={param.description || ""}
                        onChange={(e) =>
                          handleParamChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Categoría</label>
                      <select
                        className={styles.select}
                        value={param.category}
                        onChange={(e) =>
                          handleParamChange(
                            index,
                            "category",
                            e.target.value as PreopParamCategory,
                          )
                        }
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Orden</label>
                      <input
                        type="number"
                        className={styles.input}
                        value={param.displayOrder ?? index}
                        onChange={(e) =>
                          handleParamChange(
                            index,
                            "displayOrder",
                            Number(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.paramFlags}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={param.required}
                        onChange={(e) =>
                          handleParamChange(index, "required", e.target.checked)
                        }
                      />
                      Requerido
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={param.critical}
                        onChange={(e) =>
                          handleParamChange(index, "critical", e.target.checked)
                        }
                      />
                      Crítico
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar plantilla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
