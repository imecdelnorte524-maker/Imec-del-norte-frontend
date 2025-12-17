import { useState, useEffect, useMemo } from 'react';
import type { AtsFormData } from '../../interfaces/SgSstInterface';
import type { Usuario, Rol } from '../../interfaces/UserInterfaces';
import type { Client, Area, SubArea } from '../../interfaces/ClientInterfaces';
import { users } from '../../api/users';
import { sgSstService } from '../../api/sg-sst';
import { clients } from '../../api/clients';
import SignaturePad from './SignaturePad';
import styles from '../../styles/components/sg-sst/AtsForm.module.css';

interface AtsFormProps {
  onSubmit: (data: AtsFormData) => void;
  onCancel: () => void;
  userId: number;
  createdBy: number;
}

export default function AtsForm({ onSubmit, onCancel, userId, createdBy }: AtsFormProps) {
  const [dateString, setDateString] = useState<string>(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState<Omit<AtsFormData, 'date' | 'signatureData' | 'signerType' | 'userName'>>({
    workerName: '',
    position: '',
    area: '',
    subArea: '',
    workToPerform: '',
    location: '',
    startTime: '',
    endTime: '',
    observations: '',
    selectedRisks: {},
    requiredPpe: {},
    userId,
    createdBy,
  });

  const [userIdentification, setUserIdentification] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [availableAreas, setAvailableAreas] = useState<Area[]>([]);
  const [availableSubAreas, setAvailableSubAreas] = useState<SubArea[]>([]);
  const [clientSearch, setClientSearch] = useState<string>('');
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState<boolean>(false);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [clientSearchLoading, setClientSearchLoading] = useState<boolean>(false);

  const [signatureData, setSignatureData] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [suggestions, setSuggestions] = useState<Usuario[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const riskCategories = {
    fisicos: ['Ruidos', 'Temperaturas extremas', 'Vibraciones', 'Presiones anormales'],
    quimicos: ['Gases y vapores', 'Polvos inorgánicos', 'Polvos orgánicos', 'Humos', 'Neblinas'],
    biomecanicos: ['Posiciones forzadas', 'Sobre esfuerzo', 'Fatiga'],
    locativos: ['Pisos', 'Techos', 'Iluminación', 'Almacenamiento', 'Muros', 'Orden y limpieza'],
    mecanicos: ['Herramientas', 'Máquinas', 'Equipos'],
    electricos: ['Puestas a tierra', 'Instalaciones en mal estado', 'Instalaciones recargadas'],
    transito: ['Colisiones', 'Obstáculos', 'Desplazamientos', 'Atropellamientos'],
    biologicos: ['Virus', 'Hongos', 'Bacterias'],
    psicosociales: ['Excesos de responsabilidad', 'Problemas familiares', 'Trabajo bajo presión', 'Monotonía y rutina', 'Problemas laborales'],
    naturales: ['Terremotos', 'Volcánicos']
  };

  const ppeOptions = [
    'ARNÉS DE SEGURIDAD',
    'ROPA DE TRABAJO',
    'PROTECCIÓN RESPIRATORIA',
    'BOTAS DE SEGURIDAD',
    'CASCO',
    'GAFAS',
    'GUANTES DE PROTECCIÓN',
    'MASCARILLA'
  ];

  const toolOptions = [
    'MARTILLO',
    'DESTORNILLADOR',
    'LLAVE INGLESA',
    'ALICATES',
    'SIERRA',
    'TALADRO',
    'LLAVE DE TUBO',
    'CINTA MÉTRICA',
    'NIVEL',
    'ESCALERA',
    'ANDAMIO',
    'EQUIPO DE SOLDADURA',
    'COMPRESOR',
    'MÁQUINA DE CORTE',
    'EQUIPO DE ELEVACIÓN'
  ];

  const isFormValid = useMemo(() => {
    const requiredFields = [
      formData.workerName?.trim(),
      userIdentification?.trim(),
      formData.position?.trim(),
      selectedClient,
      formData.workToPerform?.trim(),
      formData.location?.trim(),
      formData.startTime,
      formData.endTime,
      dateString
    ];

    const allRequiredFieldsFilled = requiredFields.every(field =>
      field !== undefined && field !== null && field !== ''
    );

    const hasSelectedRisks = Object.keys(formData.selectedRisks || {}).length > 0 &&
      Object.values(formData.selectedRisks).some(risks => Array.isArray(risks) && risks.length > 0);

    const hasSelectedPPE = Object.values(formData.requiredPpe || {}).some(value => value === true);

    const hasSignature = !!signatureData;
    const hasAcceptedTerms = privacyAccepted;

    return allRequiredFieldsFilled &&
      hasSelectedRisks &&
      hasSelectedPPE &&
      hasSignature &&
      hasAcceptedTerms;
  }, [formData, dateString, signatureData, privacyAccepted, userIdentification, selectedClient]);

  const getValidationErrors = () => {
    const errors = [];

    if (!formData.workerName?.trim()) errors.push('Nombre del trabajador');
    if (!userIdentification?.trim()) errors.push('Cédula del trabajador');
    if (!formData.position?.trim()) errors.push('Cargo');
    if (!selectedClient) errors.push('Cliente');
    if (!formData.workToPerform?.trim()) errors.push('Descripción del trabajo');
    if (!formData.location?.trim()) errors.push('Ubicación');
    if (!formData.startTime) errors.push('Hora de inicio');
    if (!formData.endTime) errors.push('Hora de fin');
    if (!dateString) errors.push('Fecha');

    if (Object.keys(formData.selectedRisks || {}).length === 0 ||
      !Object.values(formData.selectedRisks).some(risks => Array.isArray(risks) && risks.length > 0)) {
      errors.push('Al menos un riesgo seleccionado');
    }

    if (!Object.values(formData.requiredPpe || {}).some(value => value === true)) {
      errors.push('Al menos un EPP o herramienta seleccionado');
    }

    if (!signatureData) errors.push('Firma');
    if (!privacyAccepted) errors.push('Aceptación de términos de seguridad');

    return errors;
  };

  useEffect(() => {
    loadUsersAndRoles();
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadAreasByClient(selectedClient.idCliente);
    } else {
      setAvailableAreas([]);
      setAvailableSubAreas([]);
    }
  }, [selectedClient]);

  const loadUsersAndRoles = async () => {
    try {
      setIsLoading(true);
      const [usuariosData, rolesData] = await Promise.all([
        users.getAllUsers(),
        users.getAllRoles()
      ]);

      setUsuarios(usuariosData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar la lista de usuarios y roles');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const clientsData = await clients.getAllClients();
      setClientsList(clientsData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      alert('Error al cargar la lista de clientes');
    }
  };

  const loadAreasByClient = async (clientId: number) => {
    try {
      setIsLoading(true);
      const areasData = await clients.getAllAreas(clientId);
      setAvailableAreas(areasData);
      setAvailableSubAreas([]);
      
      setFormData(prev => ({
        ...prev,
        area: '',
        subArea: ''
      }));
    } catch (error) {
      console.error('Error cargando áreas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubAreasByArea = async (areaId: number) => {
    try {
      const subAreasData = await clients.getAllSubAreas(areaId);
      setAvailableSubAreas(subAreasData);
      
      setFormData(prev => ({
        ...prev,
        subArea: ''
      }));
    } catch (error) {
      console.error('Error cargando subáreas:', error);
    }
  };

  const handleClientSearch = (value: string) => {
    setClientSearch(value);
    
    if (value.length > 1) {
      setClientSearchLoading(true);
      const filtered = clientsList.filter(client =>
        client.nombre.toLowerCase().includes(value.toLowerCase()) ||
        client.nit.toLowerCase().includes(value.toLowerCase())
      );
      setClientSuggestions(filtered.slice(0, 8));
      setShowClientSuggestions(true);
      setClientSearchLoading(false);
    } else {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.nombre);
    setShowClientSuggestions(false);
  };

  const handleWorkerNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, workerName: value }));

    if (value.length > 1) {
      const filtered = usuarios.filter(usuario =>
        `${usuario.nombre} ${usuario.apellido}`.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
      
      if (filtered.length === 1) {
        const usuario = filtered[0];
        if (usuario.cedula) {
          setUserIdentification(usuario.cedula || '');
        }
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectUser = (usuario: Usuario) => {
    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
    setFormData(prev => ({
      ...prev,
      workerName: nombreCompleto,
      position: usuario.role?.nombreRol || ''
    }));
    
    if (usuario.cedula) {
      setUserIdentification(usuario.cedula || '');
    }
    
    setShowSuggestions(false);
  };

  const handleAreaChange = (areaId: string) => {
    const area = availableAreas.find(a => a.idArea.toString() === areaId);
    setFormData(prev => ({
      ...prev,
      area: area?.nombreArea || '',
      subArea: ''
    }));
    
    if (areaId) {
      loadSubAreasByArea(parseInt(areaId));
    } else {
      setAvailableSubAreas([]);
    }
  };

  const handleSubAreaChange = (subAreaId: string) => {
    const subArea = availableSubAreas.find(sa => sa.idSubArea.toString() === subAreaId);
    setFormData(prev => ({
      ...prev,
      subArea: subArea?.nombreSubArea || ''
    }));
  };

  const handleRiskToggle = (category: string, risk: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRisks: {
        ...prev.selectedRisks,
        [category]: prev.selectedRisks?.[category]?.includes(risk)
          ? prev.selectedRisks[category].filter((r: string) => r !== risk)
          : [...(prev.selectedRisks?.[category] || []), risk]
      }
    }));
  };

  const handlePpeToolToggle = (item: string) => {
    setFormData(prev => ({
      ...prev,
      requiredPpe: {
        ...prev.requiredPpe,
        [item]: !prev.requiredPpe?.[item]
      }
    }));
  };

  const handleInputChange = (field: keyof Omit<AtsFormData, 'date' | 'signatureData' | 'signerType' | 'userName'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (value: string) => {
    setDateString(value);
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

    try {
      const dateValue = dateString || new Date().toISOString().split('T')[0];

      const atsData = {
        workerName: formData.workerName,
        workerIdentification: userIdentification,
        position: formData.position,
        clientId: selectedClient?.idCliente,
        clientName: selectedClient?.nombre,
        area: formData.area,
        subArea: formData.subArea,
        workToPerform: formData.workToPerform,
        location: formData.location,
        startTime: formData.startTime,
        endTime: formData.endTime,
        date: dateValue,
        observations: formData.observations,
        selectedRisks: formData.selectedRisks || {},
        requiredPpe: formData.requiredPpe || {},
        userId: formData.userId,
        createdBy: formData.createdBy,
      };

      const atsResult = await sgSstService.createAts(atsData as any);

      const formId = atsResult.data.form.id;

      const signData = {
        signatureData: signatureData,
        signerType: 'TECHNICIAN' as const,
        userId: formData.userId,
        userName: formData.workerName
      };

      await sgSstService.signForm(formId, signData);

      if (onSubmit) {
        const submitData = {
          ...formData,
          workerIdentification: userIdentification,
          clientId: selectedClient?.idCliente,
          clientName: selectedClient?.nombre,
          subArea: formData.subArea,
          date: dateValue,
          selectedRisks: formData.selectedRisks || {},
          requiredPpe: formData.requiredPpe || {},
          signatureData: signatureData,
          signerType: 'TECHNICIAN' as const,
          userName: formData.workerName
        };
        onSubmit(submitData as AtsFormData);
      }

      alert('ATS creado y firmado exitosamente');
      onCancel();

    } catch (error: any) {
      console.error('❌ ERROR en el proceso:', error);
      console.error('❌ RESPONSE DATA:', error.response?.data);

      if (error.response?.data?.message) {
        const errorMessages = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(', ')
          : error.response.data.message;
        alert(`Error: ${errorMessages}`);
      } else {
        alert('Error al crear el ATS');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSectionStatus = (sectionNumber: number) => {
    switch (sectionNumber) {
      case 1:
        return formData.workerName?.trim() && userIdentification?.trim() && formData.position?.trim();
      case 2:
        return selectedClient;
      case 3:
        return dateString && formData.startTime && formData.endTime &&
          formData.location?.trim() && formData.workToPerform?.trim();
      case 4:
        return Object.values(formData.selectedRisks || {}).some(risks =>
          Array.isArray(risks) && risks.length > 0
        );
      case 5:
        return Object.values(formData.requiredPpe || {}).some(value => value === true);
      case 6:
        return !!signatureData;
      case 7:
        return privacyAccepted;
      default:
        return true;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onCancel}>
          ← Volver
        </button>
        <h1 className={styles.title}>Análisis de Trabajo Seguro (ATS)</h1>

        <div className={`${styles.validationIndicator} ${isFormValid ? styles.valid : styles.invalid}`}>
          {isFormValid ? '✓ Formulario completo' : '✗ Formulario incompleto'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* SECCIÓN 1: INFORMACIÓN DEL TRABAJADOR */}
        <div className={`${styles.section} ${!getSectionStatus(1) ? styles.sectionIncomplete : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>1. Información del Trabajador</h2>
            {getSectionStatus(1) && <span className={styles.sectionStatus}>✓</span>}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nombre del Trabajador *
                {!formData.workerName?.trim() && <span className={styles.requiredIndicator}> (Requerido)</span>}
              </label>
              <div className={styles.autocompleteContainer}>
                <input
                  type="text"
                  className={`${styles.input} ${!formData.workerName?.trim() ? styles.inputError : ''}`}
                  value={formData.workerName}
                  onChange={(e) => handleWorkerNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onFocus={() => {
                    if (formData.workerName.length > 1) {
                      setShowSuggestions(true);
                    }
                  }}
                  required
                  placeholder="Escriba para buscar..."
                />
                {isLoading && (
                  <div className={styles.loadingIndicator}>Cargando...</div>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className={styles.suggestionsList}>
                    {suggestions.map((usuario) => (
                      <div
                        key={usuario.usuarioId}
                        className={styles.suggestionItem}
                        onClick={() => handleSelectUser(usuario)}
                      >
                        <div className={styles.suggestionName}>
                          {usuario.nombre} {usuario.apellido}
                        </div>
                        <div className={styles.suggestionRole}>
                          {usuario.role?.nombreRol}
                        </div>
                        <div className={styles.suggestionId}>
                          Cédula: {usuario.cedula || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Cédula del Trabajador *
                {!userIdentification?.trim() && <span className={styles.requiredIndicator}> (Requerido)</span>}
              </label>
              <input
                type="text"
                className={`${styles.input} ${!userIdentification?.trim() ? styles.inputError : ''}`}
                value={userIdentification}
                onChange={(e) => setUserIdentification(e.target.value)}
                placeholder="Número de cédula"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Cargo *
                {!formData.position?.trim() && <span className={styles.requiredIndicator}> (Requerido)</span>}
              </label>
              <select
                className={`${styles.input} ${!formData.position?.trim() ? styles.inputError : ''}`}
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                required
              >
                <option value="">Seleccione un cargo</option>
                {roles.map((rol) => (
                  <option key={rol.rolId} value={rol.nombreRol}>
                    {rol.nombreRol}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: INFORMACIÓN DEL CLIENTE */}
        <div className={`${styles.section} ${!getSectionStatus(2) ? styles.sectionIncomplete : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>2. Información del Cliente</h2>
            {getSectionStatus(2) && <span className={styles.sectionStatus}>✓</span>}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Cliente *
                {!selectedClient && <span className={styles.requiredIndicator}> (Requerido)</span>}
              </label>
              <div className={styles.clientAutocompleteContainer}>
                <div className={styles.clientSearchWrapper}>
                  <input
                    type="text"
                    className={`${styles.input} ${!selectedClient ? styles.inputError : ''}`}
                    value={clientSearch}
                    onChange={(e) => handleClientSearch(e.target.value)}
                    onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                    onFocus={() => {
                      if (clientSearch.length > 1) {
                        setShowClientSuggestions(true);
                      }
                    }}
                    required
                    placeholder="Buscar cliente por nombre o NIT..."
                  />
                  {clientSearchLoading && (
                    <div className={styles.clientLoadingIndicator}>Buscando...</div>
                  )}
                  {!clientSearchLoading && clientSearch && (
                    <button
                      type="button"
                      className={styles.clearClientButton}
                      onClick={() => {
                        setClientSearch('');
                        setSelectedClient(null);
                        setAvailableAreas([]);
                        setAvailableSubAreas([]);
                        setFormData(prev => ({ ...prev, area: '', subArea: '' }));
                      }}
                      title="Limpiar búsqueda"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {showClientSuggestions && clientSuggestions.length > 0 && (
                  <div className={styles.clientSuggestionsList}>
                    <div className={styles.clientSuggestionsHeader}>
                      <span>Clientes encontrados:</span>
                      <small>{clientSuggestions.length} resultados</small>
                    </div>
                    {clientSuggestions.map((client) => (
                      <div
                        key={client.idCliente}
                        className={styles.clientSuggestionItem}
                        onClick={() => handleSelectClient(client)}
                      >
                        <div className={styles.clientSuggestionName}>
                          <strong>{client.nombre}</strong>
                        </div>
                        <div className={styles.clientSuggestionInfo}>
                          <span className={styles.clientNit}>NIT: {client.nit}</span>
                          <span className={styles.clientContact}>Contacto: {client.contacto}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedClient && (
                <div className={styles.selectedClientCard}>
                  <div className={styles.clientCardHeader}>
                    <h3 className={styles.clientCardTitle}>{selectedClient.nombre}</h3>
                    <button
                      type="button"
                      className={styles.changeClientButton}
                      onClick={() => {
                        setSelectedClient(null);
                        setClientSearch('');
                      }}
                    >
                      Cambiar
                    </button>
                  </div>
                  <div className={styles.clientCardDetails}>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>NIT:</span>
                      <span className={styles.detailValue}>{selectedClient.nit}</span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Contacto:</span>
                      <span className={styles.detailValue}>{selectedClient.contacto}</span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Email:</span>
                      <span className={styles.detailValue}>{selectedClient.email}</span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Teléfono:</span>
                      <span className={styles.detailValue}>{selectedClient.telefono}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Área <span className={styles.optionalIndicator}> (Opcional)</span>
              </label>
              <select
                className={styles.input}
                value={availableAreas.find(a => a.nombreArea === formData.area)?.idArea || ''}
                onChange={(e) => handleAreaChange(e.target.value)}
                disabled={!selectedClient || availableAreas.length === 0}
              >
                <option value="">{selectedClient ? 'Seleccione un área (opcional)' : 'Seleccione un cliente primero'}</option>
                {availableAreas.map((area) => (
                  <option key={area.idArea} value={area.idArea}>
                    {area.nombreArea}
                  </option>
                ))}
              </select>
              {selectedClient && availableAreas.length === 0 && !isLoading && (
                <div className={styles.clientInfoMessage}>
                  Este cliente no tiene áreas registradas
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Sub-Área <span className={styles.optionalIndicator}> (Opcional)</span>
              </label>
              <select
                className={styles.input}
                value={availableSubAreas.find(sa => sa.nombreSubArea === formData.subArea)?.idSubArea || ''}
                onChange={(e) => handleSubAreaChange(e.target.value)}
                disabled={!formData.area || availableSubAreas.length === 0}
              >
                <option value="">{formData.area ? 'Seleccione una sub-área (opcional)' : 'Seleccione un área primero'}</option>
                {availableSubAreas.map((subArea) => (
                  <option key={subArea.idSubArea} value={subArea.idSubArea}>
                    {subArea.nombreSubArea}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* RESTANTE DEL FORMULARIO SE MANTIENE IGUAL */}
        {/* SECCIÓN 3: INFORMACIÓN DEL TRABAJO */}
        <div className={`${styles.section} ${!getSectionStatus(3) ? styles.sectionIncomplete : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>3. Información del Trabajo</h2>
            {getSectionStatus(3) && <span className={styles.sectionStatus}>✓</span>}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Fecha *
                {!dateString && <span className={styles.requiredIndicator}> (Requerido)</span>}
              </label>
              <input
                type="date"
                className={`${styles.input} ${!dateString ? styles.inputError : ''}`}
                value={dateString}
                onChange={(e) => handleDateChange(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Hora de Inicio *
                {!formData.startTime && <span className={styles.requiredIndicator}> (Requerido)</span>}
              </label>
              <input
                type="time"
                className={`${styles.input} ${!formData.startTime ? styles.inputError : ''}`}
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Hora de Fin *
                {!formData.endTime && <span className={styles.requiredIndicator}> (Requerido)</span>}
              </label>
              <input
                type="time"
                className={`${styles.input} ${!formData.endTime ? styles.inputError : ''}`}
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Ubicación *
                {!formData.location?.trim() && <span className={styles.requiredIndicator}> (Requerido)</span>}
              </label>
              <input
                type="text"
                className={`${styles.input} ${!formData.location?.trim() ? styles.inputError : ''}`}
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ej: Planta 1, Oficina 204, etc."
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Descripción del Trabajo *
              {!formData.workToPerform?.trim() && <span className={styles.requiredIndicator}> (Requerido)</span>}
            </label>
            <textarea
              className={`${styles.textarea} ${!formData.workToPerform?.trim() ? styles.textareaError : ''}`}
              value={formData.workToPerform}
              onChange={(e) => handleInputChange('workToPerform', e.target.value)}
              rows={3}
              required
              placeholder="Describa detalladamente el trabajo a realizar..."
            />
          </div>
        </div>

        {/* SECCIÓN 4: IDENTIFICACIÓN DE RIESGOS */}
        <div className={`${styles.section} ${!getSectionStatus(4) ? styles.sectionIncomplete : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>4. Identificación de Riesgos / Peligros</h2>
            {getSectionStatus(4) && <span className={styles.sectionStatus}>✓</span>}
            {!getSectionStatus(4) && <span className={styles.requiredIndicator}> (Seleccione al menos uno)</span>}
          </div>
          <p className={styles.sectionSubtitle}>Seleccione los riesgos a los que se encuentra expuesto:</p>

          <div className={styles.riskCategories}>
            {Object.entries(riskCategories).map(([category, risks]) => (
              <div key={category} className={styles.riskCategory}>
                <h3 className={styles.riskCategoryTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div className={styles.risksGrid}>
                  {risks.map((risk) => (
                    <label key={risk} className={styles.riskCheckbox}>
                      <input
                        type="checkbox"
                        checked={formData.selectedRisks?.[category]?.includes(risk) || false}
                        onChange={() => handleRiskToggle(category, risk)}
                      />
                      <span className={styles.checkboxLabel}>{risk}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 5: EPP Y HERRAMIENTAS REQUERIDAS */}
        <div className={`${styles.section} ${!getSectionStatus(5) ? styles.sectionIncomplete : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>5. Equipo y Herramientas Requeridas</h2>
            {getSectionStatus(5) && <span className={styles.sectionStatus}>✓</span>}
            {!getSectionStatus(5) && <span className={styles.requiredIndicator}> (Seleccione al menos uno)</span>}
          </div>

          {/* Subsección: Equipo de Protección Personal */}
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Equipo de Protección Personal (EPP)</h3>
            <div className={styles.ppeGrid}>
              {ppeOptions.map((ppe) => (
                <label key={ppe} className={styles.ppeCheckbox}>
                  <input
                    type="checkbox"
                    checked={formData.requiredPpe?.[ppe] || false}
                    onChange={() => handlePpeToolToggle(ppe)}
                  />
                  <span className={styles.ppeLabel}>{ppe}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Subsección: Herramientas */}
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Herramientas</h3>
            <div className={styles.toolsGrid}>
              {toolOptions.map((tool) => (
                <label key={tool} className={styles.toolCheckbox}>
                  <input
                    type="checkbox"
                    checked={formData.requiredPpe?.[tool] || false}
                    onChange={() => handlePpeToolToggle(tool)}
                  />
                  <span className={styles.toolLabel}>{tool}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Campo para otras herramientas */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Otras herramientas o equipos (opcional)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Escriba herramientas adicionales separadas por coma"
              onChange={(e) => {
                const tools = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                const newTools = tools.reduce((acc, tool) => ({ ...acc, [tool]: true }), {});
                setFormData(prev => ({
                  ...prev,
                  requiredPpe: { ...prev.requiredPpe, ...newTools }
                }));
              }}
            />
          </div>
        </div>

        {/* SECCIÓN 6: OBSERVACIONES */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>6. Observaciones Adicionales</h2>
            <span className={styles.optionalIndicator}> (Opcional)</span>
          </div>
          <textarea
            className={styles.textarea}
            value={formData.observations}
            onChange={(e) => handleInputChange('observations', e.target.value)}
            rows={4}
            placeholder="Observaciones adicionales sobre el trabajo, condiciones especiales, recomendaciones, etc..."
          />
        </div>

        {/* SECCIÓN 7: FIRMA */}
        <div className={`${styles.section} ${!getSectionStatus(6) ? styles.sectionIncomplete : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>7. Firma del Trabajador</h2>
            {getSectionStatus(6) && <span className={styles.sectionStatus}>✓</span>}
            {!getSectionStatus(6) && <span className={styles.requiredIndicator}> (Requerida)</span>}
          </div>
          <p className={styles.sectionSubtitle}>
            {formData.workerName || 'Trabajador'}, firme en el área inferior para confirmar el análisis de seguridad
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
                alt="Firma del trabajador"
                className={styles.signatureImage}
              />
            </div>
          )}
        </div>

        {/* SECCIÓN 8: TÉRMINOS Y CONDICIONES */}
        <div className={`${styles.section} ${!getSectionStatus(7) ? styles.sectionIncomplete : ''}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>8. Términos y Condiciones</h2>
            {getSectionStatus(7) && <span className={styles.sectionStatus}>✓</span>}
            {!getSectionStatus(7) && <span className={styles.requiredIndicator}> (Requerida)</span>}
          </div>
          <div className={styles.termsBox}>
            <p>Declaro que:</p>
            <ul className={styles.termsList}>
              <li>He leído y comprendido las instrucciones de seguridad.</li>
              <li>He identificado los riesgos asociados al trabajo.</li>
              <li>Cuento con el herramienta de protección personal necesario.</li>
              <li>Conozco los procedimientos de emergencia.</li>
              <li>Acepto realizar el trabajo de acuerdo a los estándares de seguridad.</li>
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
              Confirmo que he leído y acepto los términos y condiciones de seguridad. *
            </span>
          </label>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className={styles.formActions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="submit"
            className={`${styles.submitButton} ${!isFormValid ? styles.submitButtonDisabled : ''}`}
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? 'Guardando...' : (
              isFormValid ? '✅ Guardar ATS' : 'Completar formulario primero'
            )}
          </button>
        </div>

        {/* Mensaje de validación */}
        {!isFormValid && (
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