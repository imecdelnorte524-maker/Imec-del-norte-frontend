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
          <h3>Documentos PDF</h3>
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
          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleUpload} className={styles.docsUploadBox}>
            <label className={styles.docsUploadLabel}>
              <input
                className={styles.docsFileInput}
                type="file"
                accept="application/pdf"
                multiple
                onChange={(e) =>
                  setFiles(e.target.files ? Array.from(e.target.files) : [])
                }
                disabled={uploading}
              />
              <span className={styles.docsUploadHint}>
                Selecciona uno o varios PDF (manuales, fichas técnicas, etc.)
              </span>
            </label>

            {files.length > 0 && (
              <div className={styles.docsSelectedList}>
                {files.map((f) => (
                  <div
                    key={`${f.name}-${f.size}`}
                    className={styles.docsSelectedItem}
                  >
                    <span className={styles.docsFileName}>{f.name}</span>
                    <span className={styles.docsFileMeta}>
                      {formatBytes(f.size)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.docsUploadActions}>
              <button
                type="submit"
                className={styles.docsPrimaryButton}
                disabled={!canUpload}
              >
                {uploading ? "Subiendo..." : "Subir PDF"}
              </button>
            </div>
          </form>

          <div className={styles.docsListHeader}>
            <h4>Archivos cargados</h4>
            <button
              type="button"
              className={styles.docsSecondaryButton}
              onClick={loadDocs}
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          {loading ? (
            <p className={styles.loading}>Cargando documentos...</p>
          ) : docs.length === 0 ? (
            <p className={styles.noOrders}>No hay documentos PDF cargados.</p>
          ) : (
            <div className={styles.docsList}>
              {docs.map((doc) => (
                <div key={doc.id} className={styles.docsItem}>
                  <div className={styles.docsItemInfo}>
                    <div
                      className={styles.docsItemName}
                      title={doc.originalName}
                    >
                      {doc.originalName}
                    </div>
                    <div className={styles.docsItemMeta}>
                      <span>{formatBytes(doc.size)}</span>
                      <span>•</span>
                      <span>
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className={styles.docsItemActions}>
                    {/* Ver */}
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => handleView(doc)}
                      disabled={workingDocId === doc.id}
                      aria-label="Ver PDF"
                      title="Ver"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className={styles.iconSvg}
                        aria-hidden="true"
                      >
                        <path
                          fill="currentColor"
                          d="M12 5c5.5 0 9.6 4.3 10.9 6-1.3 1.7-5.4 6-10.9 6S2.4 12.7 1.1 11C2.4 9.3 6.5 5 12 5zm0 2C8 7 4.7 10 3.5 11 4.7 12 8 15 12 15s7.3-3 8.5-4C19.3 10 16 7 12 7zm0 1.5A2.5 2.5 0 1 1 9.5 11 2.5 2.5 0 0 1 12 8.5z"
                        />
                      </svg>
                    </button>

                    {/* Descargar */}
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => handleDownload(doc)}
                      disabled={workingDocId === doc.id}
                      aria-label="Descargar PDF"
                      title="Descargar"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className={styles.iconSvg}
                        aria-hidden="true"
                      >
                        <path
                          fill="currentColor"
                          d="M5 20h14v-2H5v2zm7-18v10.2l3.6-3.6L17 10l-5 5-5-5 1.4-1.4L11 12.2V2h1z"
                        />
                      </svg>
                    </button>

                    {/* Eliminar */}
                    {isAdmin && (
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.iconDanger}`}
                        onClick={() => handleDelete(doc.id)}
                        disabled={workingDocId === doc.id}
                        aria-label="Eliminar PDF"
                        title="Eliminar"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className={styles.iconSvg}
                          aria-hidden="true"
                        >
                          <path
                            fill="currentColor"
                            d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM7 9h2v10H7V9z"
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

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.docsSecondaryButton}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
