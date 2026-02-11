// src/components/equipment/equipment-list/EquipmentFilters.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";

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
  // Regla: si hay 5 o menos clientes, usar <select>; si hay más, usar buscador
  const useSelect = clients.length <= 5;

  // Estado para el buscador de clientes
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Cuando cambia el cliente seleccionado desde fuera, reflejarlo en el input del buscador
  useEffect(() => {
    if (!useSelect && selectedClientId) {
      const c = clients.find((cl) => cl.idCliente === selectedClientId);
      if (c) {
        const label = c.nit ? `${c.nombre} (${c.nit})` : c.nombre;
        setClientSearchTerm(label);
      }
    }
    if (!selectedClientId && !loadingClients) {
      setClientSearchTerm("");
    }
  }, [useSelect, selectedClientId, clients, loadingClients]);

  const filteredClients = useMemo(() => {
    const term = clientSearchTerm.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => {
      const name = c.nombre?.toLowerCase() ?? "";
      const nit = c.nit?.toLowerCase() ?? "";
      return name.includes(term) || nit.includes(term);
    });
  }, [clientSearchTerm, clients]);

  const handleClientSearchInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setClientSearchTerm(e.target.value);
    setShowClientDropdown(true);
  };

  const handleClientSelectFromSearch = (client: ClientOption) => {
    const label = client.nit
      ? `${client.nombre} (${client.nit})`
      : client.nombre;

    setClientSearchTerm(label);
    setShowClientDropdown(false);

    // Simular evento de <select> para reutilizar handleClientChange del padre
    const syntheticEvent = {
      target: { value: String(client.idCliente) },
    } as React.ChangeEvent<HTMLSelectElement>;

    onClientChange(syntheticEvent);
  };

  const handleClientSearchBlur = () => {
    // pequeño delay para permitir el click en la opción
    setTimeout(() => setShowClientDropdown(false), 150);
  };

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
        ) : useSelect ? (
          // MODO SELECT: cuando hay 5 o menos clientes
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
        ) : (
          // MODO BUSCADOR: cuando hay más de 5 clientes
          <div className={styles.clientSearchWrapper}>
            <input
              type="text"
              placeholder={
                loadingClients
                  ? "Cargando empresas..."
                  : "Buscar empresa por nombre o NIT..."
              }
              value={clientSearchTerm}
              onChange={handleClientSearchInputChange}
              onFocus={() => setShowClientDropdown(true)}
              onBlur={handleClientSearchBlur}
              disabled={loadingClients}
              className={styles.clientSearchInput}
            />

            {showClientDropdown &&
              !loadingClients &&
              filteredClients.length > 0 && (
                <ul className={styles.clientSearchResults}>
                  {filteredClients.map((c) => (
                    <li
                      key={c.idCliente}
                      className={styles.clientSearchItem}
                      // onMouseDown para que no se dispare blur antes
                      onMouseDown={() => handleClientSelectFromSearch(c)}
                    >
                      <span className={styles.clientName}>{c.nombre}</span>
                      {c.nit && (
                        <span className={styles.clientNit}>NIT: {c.nit}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

            {showClientDropdown &&
              !loadingClients &&
              filteredClients.length === 0 && (
                <ul className={styles.clientSearchResults}>
                  <li className={styles.noResults}>
                    No se encontraron empresas
                  </li>
                </ul>
              )}
          </div>
        )}
      </div>

      <div className={styles.filterGroup}>
        <label>Búsqueda</label>
        <input
          type="text"
          placeholder="Buscar por código, Tipo de aire, Área o Subárea..."
          value={search}
          onChange={onSearchChange}
          disabled={loadingEquipment}
        />
      </div>
    </div>
  );
}