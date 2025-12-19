import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { users } from '../api/users';
import styles from '../styles/pages/UserProfilePage.module.css';

interface UserPhoto {
  id: number;
  url: string;
  createdAt: string;
}

export default function UserProfilePage() {
  const { user } = useAuth();

  const [photo, setPhoto] = useState<UserPhoto | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar foto actual (si existe)
  useEffect(() => {
    const loadPhoto = async () => {
      if (!user) return;
      try {
        setLoadingPhoto(true);
        setPhotoError(null);

        const data = await users.getUserPhoto(user.usuarioId);

        if (data && data.url) {
          setPhoto({
            id: data.id,
            url: data.url,
            createdAt: data.createdAt,
          });
        } else {
          setPhoto(null);
        }
      } catch (err: any) {
        console.error('Error cargando foto de usuario:', err);
        setPhotoError(err.message || 'Error al cargar la foto de perfil');
      } finally {
        setLoadingPhoto(false);
      }
    };

    loadPhoto();
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('La imagen no debe superar los 5MB');
      return;
    }

    try {
      setLoadingPhoto(true);
      setPhotoError(null);

      const uploaded = await users.uploadUserPhoto(user.usuarioId, file);
      const data = uploaded.data ?? uploaded;

      setPhoto({
        id: data.id,
        url: data.url,
        createdAt: data.createdAt,
      });
    } catch (err: any) {
      console.error('Error al subir foto de usuario:', err);
      setPhotoError(err.message || 'Error al subir la foto de perfil');
    } finally {
      setLoadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!user || !photo) return;

    const confirmDelete = window.confirm(
      '¿Seguro que deseas eliminar tu foto de perfil?',
    );
    if (!confirmDelete) return;

    try {
      setLoadingPhoto(true);
      setPhotoError(null);

      await users.deleteUserPhoto(user.usuarioId);
      setPhoto(null);
      setShowPhotoModal(false);
    } catch (err: any) {
      console.error('Error eliminando foto de usuario:', err);
      setPhotoError(err.message || 'Error al eliminar la foto de perfil');
    } finally {
      setLoadingPhoto(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className={styles.page}>
          <div className={styles.centerMessage}>
            No hay usuario autenticado.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${user.nombre} ${user.apellido}`.trim();
  const createdAt = new Date(user.fechaCreacion).toLocaleString();
  const initials =
    `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Mi Perfil</h1>
          <p>Consulta tu información y actualiza tu foto de perfil.</p>
        </header>

        <div className={styles.layout}>
          {/* Columna izquierda: foto + info básica */}
          <section className={styles.leftColumn}>
            <div className={styles.profileCard}>
              <div className={styles.photoSection}>
                {photo ? (
                  <img
                    src={photo.url}
                    alt="Foto de perfil"
                    className={styles.profilePhoto}
                    onClick={() => setShowPhotoModal(true)}
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    {initials}
                  </div>
                )}

                {loadingPhoto && (
                  <span className={styles.photoStatus}>
                    Procesando imagen...
                  </span>
                )}

                {photoError && (
                  <div className={styles.error}>{photoError}</div>
                )}

                <div className={styles.photoActions}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loadingPhoto}
                  >
                    {photo ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  {photo && (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleDeletePhoto}
                      disabled={loadingPhoto}
                    >
                      Eliminar foto
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.basicInfo}>
                <h2>{fullName || user.username}</h2>
                <p className={styles.role}>
                  {user.role?.nombreRol || 'Usuario'}
                </p>
                <p className={styles.email}>{user.email}</p>
              </div>
            </div>

            <div className={styles.metaCard}>
              <h3>Información de cuenta</h3>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Usuario:</span>
                <span className={styles.metaValue}>{user.username}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Estado:</span>
                <span className={styles.metaValue}>
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Registrado en:</span>
                <span className={styles.metaValue}>{createdAt}</span>
              </div>
            </div>
          </section>

          {/* Columna derecha: detalles */}
          <section className={styles.rightColumn}>
            <div className={styles.detailCard}>
              <h3>Datos personales</h3>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Nombre</span>
                  <span className={styles.detailValue}>
                    {fullName || '—'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tipo de documento</span>
                  <span className={styles.detailValue}>
                    {user.tipoCedula || '—'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Documento</span>
                  <span className={styles.detailValue}>
                    {user.cedula || '—'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Teléfono</span>
                  <span className={styles.detailValue}>
                    {user.telefono || '—'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Correo electrónico</span>
                  <span className={styles.detailValue}>{user.email}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Rol</span>
                  <span className={styles.detailValue}>
                    {user.role?.nombreRol || 'Usuario'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      {photo && showPhotoModal && (
        <div
          className={styles.photoModalOverlay}
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className={styles.photoModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.photoModalClose}
              onClick={() => setShowPhotoModal(false)}
            >
              ×
            </button>
            <img
              src={photo.url}
              alt="Foto de perfil ampliada"
              className={styles.photoModalImage}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}