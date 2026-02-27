import { useEffect, useMemo, useState } from "react";
import styles from "../../../styles/pages/EquipmentDetailPage.module.css";
import api from "../../../api/axios";
import {
  addEquipmentDocumentRequest,
  deleteEquipmentDocumentRequest,
  getEquipmentDocumentsRequest,
} from "../../../api/equipment";
import type { EquipmentDocument } from "../../../interfaces/EquipmentInterfaces";
import { useAuth } from "../../../hooks/useAuth";

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return "-";
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1,
  );
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url);

function ensurePdfName(name: string) {
  const n = (name || "documento").trim();
  return n.toLowerCase().endsWith(".pdf") ? n : `${n}.pdf`;
}

/**
 * Descarga el PDF como arraybuffer y fuerza Blob application/pdf
 * - Si es URL absoluta (Cloudinary): fetch normal
 * - Si es URL relativa (backend protegido): axios con JWT (tu instancia `api`)
 */
async function getPdfBlob(url: string): Promise<Blob> {
  if (isAbsoluteUrl(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo obtener el PDF.");
    const buf = await res.arrayBuffer();
    return new Blob([buf], { type: "application/pdf" });
  }

  const res = await api.get(url, { responseType: "arraybuffer" });
  return new Blob([res.data], { type: "application/pdf" });
}

function openBlobInNewTab(blob: Blob) {
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

function downloadBlob(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = ensurePdfName(filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
}

export default function EquipmentDocumentsModal({
  isOpen,
  equipmentId,
  onClose,
}: {
  isOpen: boolean;
  equipmentId: number;
  onClose: () => void;
}) {
  const [docs, setDocs] = useState<EquipmentDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [workingDocId, setWorkingDocId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const { user } = useAuth();

  const isAdmin = user?.role.nombreRol === "Administrador";

  const canUpload = useMemo(
    () => files.length > 0 && !uploading,
    [files, uploading],
  );

  const loadDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await getEquipmentDocumentsRequest(equipmentId);
      setDocs(list);
    } catch {
      setError("Error al cargar documentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpload) return;

    const onlyPdf = files.every(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (!onlyPdf) {
      setError("Solo se permiten archivos PDF.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await Promise.all(
        files.map((f) => addEquipmentDocumentRequest(equipmentId, f)),
      );
      setFiles([]);
      await loadDocs();
    } catch {
      setError("Error al subir documento(s).");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!window.confirm("¿Eliminar este documento?")) return;
    try {
      setError(null);
      await deleteEquipmentDocumentRequest(docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      setError("Error al eliminar el documento.");
    }
  };

  const handleView = async (doc: EquipmentDocument) => {
    try {
      setWorkingDocId(doc.id);
      setError(null);

      // ✅ siempre abrir por blob para evitar que el navegador lo fuerce a descarga
      const blob = await getPdfBlob(doc.url);
      openBlobInNewTab(blob);
    } catch {
      setError("No se pudo abrir el PDF.");
    } finally {
      setWorkingDocId(null);
    }
  };

  const handleDownload = async (doc: EquipmentDocument) => {
    try {
      setWorkingDocId(doc.id);
      setError(null);

      const blob = await getPdfBlob(doc.downloadUrl || doc.url);
      downloadBlob(blob, doc.originalName || "documento.pdf");
    } catch {
      setError("No se pudo descargar el PDF.");
    } finally {
      setWorkingDocId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.docsModal}>
        <div className={styles.modalHeader}>
          <h3>
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            >
              <path
                fill="currentColor"
                d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .8-.7 1.5-1.5 1.5H8V9h2v2.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V4h2v5.5zM14 9h2V6h2v4h-4v6h-2V9z"
              />
            </svg>
            Documentos PDF
          </h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && (
            <div className={styles.error}>
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                style={{ marginRight: "6px" }}
              >
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Área de subida mejorada */}
          <div className={styles.docsUploadCard}>
            <form onSubmit={handleUpload}>
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={(e) =>
                    setFiles(e.target.files ? Array.from(e.target.files) : [])
                  }
                  disabled={uploading}
                  id="pdf-upload"
                  className={styles.fileInputHidden}
                />
                <label htmlFor="pdf-upload" className={styles.uploadLabel}>
                  <svg viewBox="0 0 24 24" width="32" height="32">
                    <path
                      fill="currentColor"
                      d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
                    />
                  </svg>
                  <span className={styles.uploadTitle}>
                    Haz clic para seleccionar o arrastra archivos
                  </span>
                  <span className={styles.uploadHint}>
                    PDFs únicamente (manuales, fichas técnicas, etc.)
                  </span>
                </label>
              </div>

              {files.length > 0 && (
                <div className={styles.selectedFiles}>
                  <div className={styles.selectedFilesHeader}>
                    <span>Archivos seleccionados ({files.length})</span>
                  </div>
                  <div className={styles.selectedFilesList}>
                    {files.map((f) => (
                      <div
                        key={`${f.name}-${f.size}`}
                        className={styles.selectedFileItem}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18">
                          <path
                            fill="currentColor"
                            d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .8-.7 1.5-1.5 1.5H8V9h2v2.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V4h2v5.5zM14 9h2V6h2v4h-4v6h-2V9z"
                          />
                        </svg>
                        <span className={styles.selectedFileName}>
                          {f.name}
                        </span>
                        <span className={styles.selectedFileSize}>
                          {formatBytes(f.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.uploadActions}>
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={!canUpload}
                    >
                      {uploading ? (
                        <>
                          <span className={styles.spinner}></span>
                          Subiendo...
                        </>
                      ) : (
                        "Subir PDFs"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Lista de documentos */}
          <div className={styles.docsListContainer}>
            <div className={styles.docsListHeader}>
              <h4>
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  style={{ marginRight: "6px" }}
                >
                  <path
                    fill="currentColor"
                    d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"
                  />
                </svg>
                Archivos cargados
              </h4>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={loadDocs}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Actualizando...
                  </>
                ) : (
                  "Actualizar"
                )}
              </button>
            </div>

            {loading ? (
              <div className={styles.loadingState}>
                <span className={styles.spinner}></span>
                <p>Cargando documentos...</p>
              </div>
            ) : docs.length === 0 ? (
              <div className={styles.emptyState}>
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path
                    fill="var(--gray-400)"
                    d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .8-.7 1.5-1.5 1.5H8V9h2v2.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V4h2v5.5zM14 9h2V6h2v4h-4v6h-2V9z"
                  />
                </svg>
                <p>No hay documentos PDF cargados.</p>
              </div>
            ) : (
              <div className={styles.docsList}>
                {docs.map((doc) => (
                  <div key={doc.id} className={styles.documentCard}>
                    <div className={styles.documentIcon}>
                      <svg viewBox="0 0 24 24" width="32" height="32">
                        <path
                          fill="#dc2626"
                          d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .8-.7 1.5-1.5 1.5H8V9h2v2.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V4h2v5.5zM14 9h2V6h2v4h-4v6h-2V9z"
                        />
                      </svg>
                    </div>

                    <div className={styles.documentInfo}>
                      <div
                        className={styles.documentName}
                        title={doc.originalName}
                      >
                        {doc.originalName}
                      </div>
                      <div className={styles.documentMeta}>
                        <span className={styles.documentSize}>
                          {formatBytes(doc.size)}
                        </span>
                        <span className={styles.documentDate}>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className={styles.documentActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => handleView(doc)}
                        disabled={workingDocId === doc.id}
                        title="Ver PDF"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path
                            fill="currentColor"
                            d="M12 5c5.5 0 9.6 4.3 10.9 6-1.3 1.7-5.4 6-10.9 6S2.4 12.7 1.1 11C2.4 9.3 6.5 5 12 5zm0 2C8 7 4.7 10 3.5 11 4.7 12 8 15 12 15s7.3-3 8.5-4C19.3 10 16 7 12 7zm0 1.5A2.5 2.5 0 1 1 9.5 11 2.5 2.5 0 0 1 12 8.5z"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => handleDownload(doc)}
                        disabled={workingDocId === doc.id}
                        title="Descargar"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path
                            fill="currentColor"
                            d="M5 20h14v-2H5v2zm7-18v10.2l3.6-3.6L17 10l-5 5-5-5 1.4-1.4L11 12.2V2h1z"
                          />
                        </svg>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.iconDanger}`}
                          onClick={() => handleDelete(doc.id)}
                          disabled={workingDocId === doc.id}
                          title="Eliminar"
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path
                              fill="currentColor"
                              d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
