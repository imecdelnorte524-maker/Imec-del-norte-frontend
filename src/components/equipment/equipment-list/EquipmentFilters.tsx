"use client";

import type React from "react";

import styles from "../../../styles/components/equipment/equipment-list/EquipmentFilters.module.css";

interface ClientOption {
  idCliente: number;
  nombre: string;
  nit: string;
}

interface EquipmentFiltersProps {
  clients: ClientOption[];
  selectedClientId: number | 0;
  search: string;
  loadingClients: boolean;
  loadingEquipment: boolean;
  hasFixedClientFromRoute: boolean;
  fixedClientName?: string;
  fixedClientNit?: string;
  onClientChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EquipmentFilters({
  clients,
  selectedClientId,
  search,
  loadingClients,
  loadingEquipment,
  hasFixedClientFromRoute,
  fixedClientName,
  fixedClientNit,
  onClientChange,
  onSearchChange,
}: EquipmentFiltersProps) {
  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <label>Empresa</label>
        {loadingClients ? (
          <p>Cargando empresas...</p>
        ) : hasFixedClientFromRoute ? (
          <p className={styles.fixedClientText}>
            {clients[0]
              ? `${clients[0].nombre} (${clients[0].nit})`
              : fixedClientName
              ? `${fixedClientName} (${fixedClientNit || ""})`
              : "Cliente seleccionado"}
          </p>
        ) : (
          <select
            value={selectedClientId || 0}
            onChange={onClientChange}
            disabled={loadingClients}
          >
            <option value={0}>Seleccionar empresa...</option>
            {clients.map((c) => (
              <option key={c.idCliente} value={c.idCliente}>
                {c.nombre} ({c.nit})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.filterGroup}>
        <label>Búsqueda</label>
        <input
          type="text"
          placeholder="Buscar por código Tipo de aire, Área o Subárea..."
          value={search}
          onChange={onSearchChange}
          disabled={loadingEquipment}
        />
      </div>
    </div>
  );
}
