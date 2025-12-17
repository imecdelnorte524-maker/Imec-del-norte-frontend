// src/pages/SGSST.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';
import FormSelectionModal from '../components/sg-sst/FormSelectionModal';
import FormsList from '../components/sg-sst/FormsList';
import StatsCards from '../components/sg-sst/StastCards';
import AtsForm from '../components/sg-sst/AtsForm';
import HeightWorkForm from '../components/sg-sst/HeightWorkForm';
import PreoperationalForm from '../components/sg-sst/PreoperationalForm';
import FormDetailsModal from '../components/sg-sst/FormDetailsModal';
import { sgSstService } from '../api/sg-sst';
import type { SgSstForm, SgSstStats, FormType, AtsFormData, HeightWorkFormData, PreoperationalFormData } from '../interfaces/SgSstInterface';
import { 
  canViewModule, 
  // hasFullAccess, 
  hasOwnAccess, 
  getUserAccessLevel, 
  getDisplayRoleName,
  normalizeRoleName 
} from '../config/roles.config';
import styles from '../styles/pages/SgSstPage.module.css';

export default function SGSST() {
  const { user } = useAuth();
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<SgSstForm | null>(null);
  const [forms, setForms] = useState<SgSstForm[]>([]);
  const [stats, setStats] = useState<SgSstStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'ats' | 'height-work' | 'preoperational'>('dashboard');
  const [selectedFormType, setSelectedFormType] = useState<FormType | null>(null);

  // Verificaciones de roles
  const userRole = user?.role?.nombreRol;
  const normalizedRole = normalizeRoleName(userRole);
  const displayRoleName = getDisplayRoleName(userRole);
  const canAccessModule = canViewModule(userRole);
  const accessLevel = getUserAccessLevel(userRole);
  // const canViewAllForms = hasFullAccess(userRole);
  const canViewOwnForms = hasOwnAccess(userRole);
  const canSignAsSST = normalizedRole === 'SG-SST';
  const canCreateForms = canViewOwnForms; 

  // Debug: Verificar los valores de los roles


  useEffect(() => {
    if (canAccessModule) {
      loadData();
    }
  }, [canAccessModule]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Determinar qué formularios cargar según el rol
      const userId = canViewOwnForms ? user?.usuarioId : undefined;
      
      const [formsResponse, statsResponse] = await Promise.all([
        sgSstService.getAllForms(userId),
        sgSstService.getDashboardStats(userId)
      ]);

      if (formsResponse.success) {
        setForms(formsResponse.data || []);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data || null);
      }
    } catch (error) {
      console.error('Error cargando datos SG-SST:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSelect = (formType: FormType) => {
    setSelectedFormType(formType);
    setShowFormModal(false);
    
    switch (formType) {
      case 'ATS':
        setCurrentView('ats');
        break;
      case 'HEIGHT_WORK':
        setCurrentView('height-work');
        break;
      case 'PREOPERATIONAL':
        setCurrentView('preoperational');
        break;
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      let response;
      
      switch (selectedFormType) {
        case 'ATS':
          response = await sgSstService.createAts(formData as AtsFormData);
          break;
        case 'HEIGHT_WORK':
          response = await sgSstService.createHeightWork(formData as HeightWorkFormData);
          break;
        case 'PREOPERATIONAL':
          response = await sgSstService.createPreoperational(formData as PreoperationalFormData);
          break;
      }

      if (response?.success) {
        setCurrentView('dashboard');
        setSelectedFormType(null);
        loadData();
      }
    } catch (error) {
      console.error('❌ Error creando formulario:', error);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedFormType(null);
  };

  const handleFormClick = async (formId: number) => {
    try {
      const response = await sgSstService.getFormById(formId);
      if (response.success) {
        setSelectedForm(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error cargando formulario:', error);
    }
  };

  const handleFormSigned = () => {
    setShowDetailsModal(false);
    setSelectedForm(null);
    loadData();
  };

  const handleFormCreated = () => {
    loadData();
  };

  const getUserName = () => {
    if (!user) return 'Usuario';
    return `${user.nombre} ${user.apellido || ''}`.trim();
  };

  // Si el usuario no tiene acceso al módulo, mostrar mensaje
  if (!canAccessModule) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <div className={styles.accessDenied}>
            <div className={styles.accessDeniedIcon}>🚫</div>
            <h1 className={styles.accessDeniedTitle}>Acceso Denegado</h1>
            <p className={styles.accessDeniedMessage}>
              No tienes permisos para acceder al módulo de Gestión SG-SST.
            </p>
            <p className={styles.accessDeniedDetail}>
              Tu rol actual (<strong>{displayRoleName}</strong>) no está autorizado para ver este contenido.
            </p>
            <div className={styles.accessDebug}>
              <p><strong>Debug info:</strong></p>
              <p>Rol original: {userRole}</p>
              <p>Rol normalizado: {normalizedRole}</p>
              <p>Nivel de acceso: {accessLevel}</p>
            </div>
            <button 
              className={styles.accessDeniedButton}
              onClick={() => window.history.back()}
            >
              Volver Atrás
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getModeDescription = () => {
    if (normalizedRole === 'ADMINISTRADOR') {
      return '👑 Modo Administrador: Tienes acceso completo a todo';
    } else if (normalizedRole === 'SUPERVISOR') {
      return '👁️ Modo Supervisor: Puedes ver todos los formularios del sistema';
    } else if (normalizedRole === 'SECRETARIA') {
      return '📋 Modo Secretaria: Puedes ver todos los formularios del sistema';
    } else if (normalizedRole === 'SG-SST') {
      return '✍️ Modo SG-SST: Puedes firmar y aprobar formularios pendientes';
    } else if (normalizedRole === 'TECNICO') {
      return '🔧 Modo Técnico: Solo puedes ver y crear tus formularios';
    }
    return '';
  };

  const renderCurrentView = () => {
    const userName = getUserName();
    
    switch (currentView) {
      case 'ats':
        return (
          <AtsForm
            onSubmit={handleFormSubmit}
            onCancel={handleBackToDashboard}
            userId={user?.usuarioId || 0}
            createdBy={user?.usuarioId || 0}
          />
        );
      
      case 'height-work':
        return (
          <HeightWorkForm
            onSubmit={handleFormSubmit}
            onCancel={handleBackToDashboard}
            userId={user?.usuarioId || 0}
            createdBy={user?.usuarioId || 0}
          />
        );
      
      case 'preoperational':
        return (
          <PreoperationalForm
            onSubmit={handleFormSubmit}
            onCancel={handleBackToDashboard}
            userId={user?.usuarioId || 0}
            createdBy={user?.usuarioId || 0}
            userName={userName}
          />
        );
      
      case 'dashboard':
      default:
        return (
          <>
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <h1 className={styles.title}>Gestión SG-SST</h1>
                <p className={styles.subtitle}>
                  Sistema de Gestión de Seguridad y Salud en el Trabajo
                </p>
                {getModeDescription() && (
                  <p className={styles.userNote}>
                    {getModeDescription()}
                  </p>
                )}
              </div>
              <div className={styles.headerRight}>
                {canCreateForms && (
                  <button
                    className={styles.primaryButton}
                    onClick={() => setShowFormModal(true)}
                  >
                    + Nuevo Formulario
                  </button>
                )}
              </div>
            </div>

            {stats && <StatsCards stats={stats} />}

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {accessLevel === 'own' ? 'Mis Formularios' : 'Todos los Formularios'}
                </h2>
                <button 
                  className={styles.secondaryButton}
                  onClick={loadData}
                >
                  Actualizar
                </button>
              </div>
              
              {loading ? (
                <div className={styles.loading}>Cargando formularios...</div>
              ) : (
                <FormsList 
                  forms={forms} 
                  onFormClick={handleFormClick}
                  onFormCreated={handleFormCreated}
                  userRole={normalizedRole}
                  accessLevel={accessLevel}
                />
              )}
            </div>

            {showFormModal && (
              <FormSelectionModal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                onFormSelect={handleFormSelect}
              />
            )}

            {showDetailsModal && selectedForm && (
              <FormDetailsModal
                isOpen={showDetailsModal}
                form={selectedForm}
                onClose={() => {
                  setShowDetailsModal(false);
                  setSelectedForm(null);
                }}
                onFormSigned={handleFormSigned}
                canSignAsSST={canSignAsSST}
                currentUser={user}
              />
            )}
          </>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {renderCurrentView()}
      </div>
    </DashboardLayout>
  );
}