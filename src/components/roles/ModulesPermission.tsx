// src/components/roles/ModulesPermission.tsx
import { useEffect, useMemo, useState } from "react";
import type { FC } from "react";
import type { Rol } from "../../interfaces/RolesInterfaces";
import type { Module as ModuleInterface } from "../../interfaces/ModulesInterfaces";
import { modulesApi } from "../../api/modules";
import { rolesApi } from "../../api/roles";
import styles from "../../styles/components/roles/ModulesPermission.module.css";

interface Props {
  isOpen: boolean;
  role: Rol | null;
  onClose: () => void;
  onSaved?: () => void; // callback después de guardar (opcional)
}

const ModulesPermission: FC<Props> = ({ isOpen, role, onClose, onSaved }) => {
  const [modules, setModules] = useState<ModuleInterface[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // Cargar módulos y módulos del rol cuando se abra para un rol específico
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [allModules, roleModules] = await Promise.all([
          modulesApi.getAllModules(),
          role ? rolesApi.getRoleModules(role.rolId) : Promise.resolve([]),
        ]);
        if (!mounted) return;
        setModules(allModules || []);
        setSelected(new Set((roleModules || []).map((m) => m.moduloId)));
      } catch (err: any) {
        console.error("Error cargando módulos/permissions:", err);
        if (mounted) setError(err?.message || "Error cargando módulos");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, role]);

  // Filtrado de módulos por búsqueda
  const filteredModules = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((m) =>
      `${m.nombreModulo} ${m.descripcion || ""}`.toLowerCase().includes(q)
    );
  }, [modules, filter]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredModules.forEach((m) => next.add(m.moduloId));
      return next;
    });
  };

  const clearVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredModules.forEach((m) => next.delete(m.moduloId));
      return next;
    });
  };

  const handleSave = async () => {
    if (!role) return;
    setSaving(true);
    setError(null);
    try {
      await rolesApi.setRoleModules(role.rolId, Array.from(selected));
      if (onSaved) {
        try { onSaved(); } catch (_) {}
      }
      onClose();
    } catch (err: any) {
      console.error("Error guardando permisos:", err);
      setError(err?.message || "Error guardando permisos");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.title}>
            <span className={styles.emoji}>⚙️</span>
            <div>
              <h2>{role ? `Permisos — ${role.nombreRol}` : "Permisos"}</h2>
              <p className={styles.subtitle}>Marca los módulos a los que este rol tiene acceso</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
              ✖
            </button>
          </div>
        </header>

        <div className={styles.controls}>
          <input
            type="search"
            placeholder="Buscar módulos..."
            className={styles.search}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className={styles.quickActions}>
            <button className={styles.smallBtn} onClick={selectAllVisible} type="button">Seleccionar visibles</button>
            <button className={styles.smallBtnGhost} onClick={clearVisible} type="button">Limpiar visibles</button>
          </div>
        </div>

        <main className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Cargando módulos...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <div className={styles.list}>
              {filteredModules.length === 0 && (
                <div className={styles.empty}>No hay módulos que coincidan.</div>
              )}
              {filteredModules.map((m) => (
                <label key={m.moduloId} className={styles.item}>
                  <div className={styles.itemLeft}>
                    <input
                      type="checkbox"
                      checked={selected.has(m.moduloId)}
                      onChange={() => toggle(m.moduloId)}
                      className={styles.checkbox}
                    />
                    <div className={styles.meta}>
                      <div className={styles.nameRow}>
                        <span className={styles.name}>{m.nombreModulo}</span>
                        <span className={styles.badge}>{m.activo ? "activo" : "inactivo"}</span>
                      </div>
                      {m.descripcion && <div className={styles.desc}>{m.descripcion}</div>}
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <small className={styles.route}>{m.rutaFrontend || "-"}</small>
                  </div>
                </label>
              ))}
            </div>
          )}
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            <button className={styles.ghostBtn} onClick={onClose} type="button">Cancelar</button>
          </div>
          <div className={styles.footerRight}>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
              type="button"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ModulesPermission;