import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PreoperationalFormData, CheckValue } from '../../interfaces/SgSstInterface';
import { catalog } from '../../api/catalog';
import { sgSstService } from '../../api/sg-sst';
import SignaturePad from './SignaturePad';
import { useChecklistForm } from '../../hooks/useToolChecklists';
import styles from '../../styles/components/sg-sst/PreoperationalForm.module.css';

interface Tool {
  herramienta_id: number;
  nombre: string;
  marca?: string;
  serial?: string;
  modelo?: string;
  tipo: string;
  estado: string;
  caracteristicasTecnicas?: string;
  observacion?: string;
  valorUnitario?: number;
  fotoUrl?: string;
}

interface PreoperationalFormProps {
  onSubmit: (data: PreoperationalFormData) => void;
  onCancel: () => void;
  userId: number;
  createdBy: number;
  userName: string;
}

export default function PreoperationalForm({ 
  onSubmit, 
  onCancel, 
  userId, 
  createdBy, 
  userName 
}: PreoperationalFormProps) {
  const navigate = useNavigate();
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [signatureData, setSignatureData] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Usar el hook de checklist
  const {
    checklistItems,
    initializeChecklist,
    updateItemValue,
    updateItemObservations,
    validateCurrentChecklist,
    getCurrentStats,
    isChecklistComplete
  } = useChecklistForm();

  const [formData, setFormData] = useState<Omit<PreoperationalFormData, 'signatureData' | 'signerType' | 'userName'>>({
    toolName: '',
    checks: [],
    userId,
    createdBy,
  });

  // Redirigir al listado de reportes
  const redirectToReportsList = () => {
    setTimeout(() => {
      navigate('/sg-sst');
    }, 2000);
  };

  // Validar si el formulario está completo
  const isFormValid = useMemo(() => {
    const hasSelectedTool = !!selectedTool;
    const checklistValid = checklistItems.length > 0 && isChecklistComplete();
    const hasSignature = !!signatureData;
    const hasAcceptedTerms = privacyAccepted;

    return hasSelectedTool && checklistValid && hasSignature && hasAcceptedTerms;
  }, [selectedTool, checklistItems, isChecklistComplete, signatureData, privacyAccepted]);

  const getValidationErrors = () => {
    const errors = [];

    if (!selectedTool) errors.push('Selección de herramienta');
    
    if (checklistItems.length === 0) {
      errors.push('Checklist preoperacional');
    } else {
      const validation = validateCurrentChecklist();
      if (!validation.isValid) {
        if (validation.missingRequired.length > 0) {
          errors.push(`Complete los parámetros requeridos (${validation.missingRequired.length} pendientes)`);
        }
        if (validation.criticalIssues.length > 0) {
          errors.push(`${validation.criticalIssues.length} problema(s) crítico(s) encontrado(s)`);
        }
      }
    }

    if (!signatureData) errors.push('Firma del técnico');
    if (!privacyAccepted) errors.push('Aceptación de términos de seguridad');

    return errors;
  };

  // Verificar si una sección está completa
  const getSectionStatus = (sectionNumber: number) => {
    switch (sectionNumber) {
      case 1: // Selección de herramienta
        return !!selectedTool;
      case 2: // Checklist
        return checklistItems.length > 0 && isChecklistComplete();
      case 3: // Firma
        return !!signatureData;
      case 4: // Términos
        return privacyAccepted;
      default:
        return true;
    }
  };

  // Cargar herramientas
  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoadingTools(true);
      setError('');

      const toolList = await catalog.getAvailableHerramientas();
      setTools(toolList || []);

    } catch (error: any) {
      console.error('Error cargando herramientas:', error);
      setError(error.message || 'Error al cargar la lista de herramientas');
      setTools([]);
    } finally {
      setLoadingTools(false);
    }
  };

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    
    // Inicializar checklist dinámico según el tipo de herramienta
    const { items } = initializeChecklist(tool.nombre);
    
    // Actualizar formData
    setFormData(prev => ({
      ...prev,
      toolName: tool.nombre,
      checks: items.map(item => ({
        parameter: item.parameter,
        value: item.value,
        observations: item.observations
      }))
    }));
  };

  const handleCheckChange = (parameterId: string, value: CheckValue) => {
    updateItemValue(parameterId, value);
    
    // Actualizar formData
    setFormData(prev => ({
      ...prev,
      checks: checklistItems.map(item => ({
        parameter: item.parameter,
        value: item.value,
        observations: item.observations
      }))
    }));
  };

  const handleObservationsChange = (parameterId: string, observations: string) => {
    updateItemObservations(parameterId, observations);
    
    // Actualizar formData
    setFormData(prev => ({
      ...prev,
      checks: checklistItems.map(item => ({
        parameter: item.parameter,
        value: item.value,
        observations: item.observations
      }))
    }));
  };

  const handleSignatureSave = (signature: string) => {
    setSignatureData(signature);
  };

  const handleSignatureClear = () => {
    setSignatureData('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      const errors = getValidationErrors();
      alert(`Por favor complete los siguientes campos antes de enviar:\n\n• ${errors.join('\n• ')}`);
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const submitData: PreoperationalFormData = {
        ...formData,
        signatureData,
        signerType: 'TECHNICIAN' as const,
        userName: userName
      };

      console.log('📤 Enviando Checklist Preoperacional:', submitData);

      const result = await sgSstService.createPreoperationalWithSignature(submitData as any);
      console.log('✅ Checklist Preoperacional creado:', result);

      setSuccessMessage('¡Checklist preoperacional guardado exitosamente! Redirigiendo al listado de reportes...');
      
      if (onSubmit) {
        await onSubmit(submitData);
      }

      redirectToReportsList();

    } catch (error: any) {
      console.error('Error enviando Checklist Preoperacional:', error);
      
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Error al guardar el checklist: ${errorMessage}`);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'disponible': return styles.statusAvailable;
      case 'en uso': return styles.statusInUse;
      case 'en mantenimiento': return styles.statusMaintenance;
      case 'dañado': return styles.statusDamaged;
      case 'activo': return styles.statusAvailable;
      case 'inactivo': return styles.statusMaintenance;
      default: return styles.statusUnknown;
    }
  };

  // Obtener estadísticas y validación
  const checklistStats = getCurrentStats();
  const validation = validateCurrentChecklist();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onCancel}>
          ← Volver
        </button>
        <h1 className={styles.title}>Checklist Preoperacional</h1>

        <div className={`${styles.validationIndicator} ${isFormValid ? styles.valid : styles.invalid}`}>
          {isFormValid ? '✓ Formulario completo' : '✗ Formulario incompleto'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successText}>
              <strong>¡Éxito!</strong>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* SECCIÓN 1: SELECCIÓN DE HERRAMIENTA */}
        <div className={`${styles.section} ${!getSectionStatus(1) ? styles.sectionIncomplete : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>1. Selección de Herramienta</h2>
            {getSectionStatus(1) && <span className={styles.sectionStatus}>✓</span>}
            {!getSectionStatus(1) && <span className={styles.requiredIndicator}> (Seleccione un herramienta)</span>}
          </div>

          {error && !successMessage && <div className={styles.error}>{error}</div>}

          {loadingTools ? (
            <div className={styles.loading}>Cargando herramientas disponibles...</div>
          ) : tools.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay herramientas disponibles en el inventario.</p>
              <button type="button" className={styles.refreshButton} onClick={loadTools}>
                Reintentar
              </button>
            </div>
          ) : (
            <div className={styles.equipmentGrid}>
              {tools.map((tool) => (
                <div
                  key={tool.herramienta_id}
                  className={`${styles.equipmentCard} ${selectedTool?.herramienta_id === tool.herramienta_id ? styles.selected : ''
                    }`}
                  onClick={() => handleToolSelect(tool)}
                >
                  <div className={styles.equipmentHeader}>
                    <h3 className={styles.equipmentName}>{tool.nombre}</h3>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(tool.estado)}`}>
                      {tool.estado}
                    </span>
                  </div>

                  <div className={styles.equipmentDetails}>
                    {tool.marca && (
                      <div className={styles.detail}>
                        <strong>Marca:</strong> {tool.marca}
                      </div>
                    )}
                    {tool.modelo && (
                      <div className={styles.detail}>
                        <strong>Modelo:</strong> {tool.modelo}
                      </div>
                    )}
                    {tool.serial && (
                      <div className={styles.detail}>
                        <strong>Serial:</strong> {tool.serial}
                      </div>
                    )}
                    <div className={styles.detail}>
                      <strong>Tipo:</strong> {tool.tipo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECCIÓN 2: CHECKLIST PREOPERACIONAL */}
        {selectedTool && checklistItems.length > 0 && (
          <div className={`${styles.section} ${!getSectionStatus(2) ? styles.sectionIncomplete : ''}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleContainer}>
                <h2 className={styles.sectionTitle}>
                  2. Checklist Preoperacional - {selectedTool.nombre}
                </h2>
                <div className={styles.statsContainer}>
                  <span className={styles.statsText}>
                    {checklistStats.completed}/{checklistStats.total} completados
                    {checklistStats.criticalWithIssues > 0 && (
                      <span className={styles.criticalStats}> • {checklistStats.criticalWithIssues} crítico(s)</span>
                    )}
                  </span>
                </div>
              </div>
              <div className={styles.sectionStatusContainer}>
                {getSectionStatus(2) && <span className={styles.sectionStatus}>✓</span>}
                {!getSectionStatus(2) && <span className={styles.requiredIndicator}>Completar</span>}
              </div>
            </div>

            <div className={styles.checklist}>
              {checklistItems.map((check, index) => (
                <div key={check.parameterId} className={`${styles.checkItem} ${check.critical ? styles.checkItemCritical : ''}`}>
                  <div className={styles.checkHeader}>
                    <div className={styles.checkQuestion}>
                      <span className={styles.questionNumber}>{index + 1}.</span>
                      <div className={styles.questionContent}>
                        <span className={styles.questionText}>{check.parameter}</span>
                        {check.critical && (
                          <span className={styles.criticalLabel}>⚠️ CRÍTICO</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.checkControls}>
                    <div className={styles.valueOptions}>
                      {(['GOOD', 'BAD'] as CheckValue[]).map((value) => (
                        <label key={value} className={styles.valueOption}>
                          <input
                            type="radio"
                            name={`check-${check.parameterId}`}
                            value={value}
                            checked={check.value === value}
                            onChange={(e) => handleCheckChange(check.parameterId, e.target.value as CheckValue)}
                            required={check.required}
                          />
                          <span className={styles.valueLabel}>
                            {value === 'GOOD' ? '✅ BUENO' : '❌ MALO'}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className={styles.observations}>
                      <textarea
                        placeholder={check.critical && check.value === 'BAD' 
                          ? "Observaciones obligatorias..." 
                          : "Observaciones (opcional)..."}
                        value={check.observations || ''}
                        onChange={(e) => handleObservationsChange(check.parameterId, e.target.value)}
                        className={styles.observationsInput}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Advertencia de problemas críticos */}
            {validation.criticalIssues.length > 0 && (
              <div className={styles.warningBox}>
                <div className={styles.warningHeader}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <strong>Atención: {validation.criticalIssues.length} problema(s) crítico(s) encontrado(s)</strong>
                </div>
                <p>No utilice el herramienta hasta que se resuelvan estos problemas.</p>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 3: FIRMA DEL TÉCNICO */}
        {selectedTool && checklistItems.length > 0 && (
          <div className={`${styles.section} ${!getSectionStatus(3) ? styles.sectionIncomplete : ''}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>3. Firma del Técnico</h2>
              {getSectionStatus(3) && <span className={styles.sectionStatus}>✓</span>}
              {!getSectionStatus(3) && <span className={styles.requiredIndicator}> (Requerida)</span>}
            </div>
            <p className={styles.sectionSubtitle}>
              {userName}, firme en el área inferior para confirmar la verificación del herramienta
            </p>

            <SignaturePad
              onSignatureSave={handleSignatureSave}
              onClear={handleSignatureClear}
            />

            {signatureData && (
              <div className={styles.signaturePreview}>
                <strong>Firma guardada:</strong>
                <img
                  src={signatureData}
                  alt="Firma del técnico"
                  className={styles.signatureImage}
                />
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 4: TÉRMINOS Y CONDICIONES */}
        <div className={`${styles.section} ${!getSectionStatus(4) ? styles.sectionIncomplete : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>4. Términos y Condiciones</h2>
            {getSectionStatus(4) && <span className={styles.sectionStatus}>✓</span>}
            {!getSectionStatus(4) && <span className={styles.requiredIndicator}> (Requerida)</span>}
          </div>
          <div className={styles.termsBox}>
            <p>Declaro que:</p>
            <ul className={styles.termsList}>
              <li>He verificado el estado del herramienta/herramienta según el checklist.</li>
              <li>Los resultados de la inspección son veraces y completos.</li>
              <li>Reportaré cualquier anomalía encontrada al supervisor inmediato.</li>
              <li>No utilizaré herramienta en mal estado o con deficiencias identificadas.</li>
              <li>Acepto seguir los procedimientos establecidos para uso de herramientas.</li>
            </ul>
          </div>
          <label className={styles.privacyCheckbox}>
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              required
            />
            <span className={styles.checkboxLabel}>
              Confirmo que he realizado la verificación preoperacional y acepto los términos establecidos. *
            </span>
          </label>
        </div>

        {/* Botones de acción */}
        <div className={styles.formActions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="submit"
            className={`${styles.submitButton} ${!isFormValid ? styles.submitButtonDisabled : ''}`}
            disabled={isSubmitting || !isFormValid || !!successMessage}
          >
            {isSubmitting ? 'Guardando...' : (
              successMessage ? '✅ Guardado' : (
                isFormValid ? '✅ Guardar Checklist' : 'Completar formulario primero'
              )
            )}
          </button>
        </div>

        {/* Mensaje de validación */}
        {!isFormValid && !successMessage && (
          <div className={styles.validationMessage}>
            <strong>⚠️ Complete los siguientes campos:</strong>
            <ul>
              {getValidationErrors().map((error, index) => (
                <li key={index}> {error}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}