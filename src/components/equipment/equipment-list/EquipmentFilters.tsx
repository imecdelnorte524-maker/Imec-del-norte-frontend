import { useEffect, useMemo, useState, useCallback, useRef } from "react";

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
  // NUEVO: indica si el usuario logueado es de rol Cliente
  isClientUser?: boolean;
}

// Función para normalizar texto (quitar tildes y caracteres especiales)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quita tildes
    .replace(/[^\w\s]/g, ""); // Quita caracteres especiales
};

// Función mejorada de búsqueda flexible
const matchesSearch = (text: string, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(searchTerm);

  // División del término de búsqueda en palabras
  const searchWords = normalizedSearch
    .split(/\s+/)
    .filter((word) => word.length > 0);

  // Si el término de búsqueda tiene múltiples palabras, verificar que todas coincidan
  if (searchWords.length > 1) {
    return searchWords.every((word) => normalizedText.includes(word));
  }

  // Búsqueda simple
  return normalizedText.includes(normalizedSearch);
};

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
  isClientUser = false, // por defecto false para roles no cliente
}: EquipmentFiltersProps) {
  // Regla: si hay 5 o menos clientes, usar <select>; si hay más, usar buscador
  const useSelect = clients.length <= 5;

  // Estado para el buscador de clientes
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cuando cambia el cliente seleccionado desde fuera, reflejarlo en el input del buscador
  useEffect(() => {
    // Para roles NO cliente, mantener comportamiento actual
    if (!isClientUser && !useSelect && selectedClientId) {
      const c = clients.find((cl) => cl.idCliente === selectedClientId);
      if (c) {
        const label = c.nit ? `${c.nombre} (${c.nit})` : c.nombre;
        setClientSearchTerm(label);
      }
    }
    if (!selectedClientId && !loadingClients && !isClientUser) {
      setClientSearchTerm("");
    }
  }, [useSelect, selectedClientId, clients, loadingClients, isClientUser]);

  // Filtrado mejorado de clientes (solo afecta al buscador de empresas)
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return clients;

    return clients.filter((c) => {
      const nombre = c.nombre || "";
      const nit = c.nit || "";
      const textoCompleto = `${nombre} ${nit}`;

      // Búsqueda flexible que encuentra coincidencias parciales
      return matchesSearch(textoCompleto, clientSearchTerm);
    });
  }, [clientSearchTerm, clients]);

  // Función para resaltar el texto coincidente
  const highlightMatch = (
    text: string,
    searchTerm: string,
  ): React.ReactNode => {
    if (!searchTerm.trim() || !text) return text;

    const normalizedText = normalizeText(text);
    const normalizedSearch = normalizeText(searchTerm);

    if (!normalizedText.includes(normalizedSearch)) return text;

    // Encontrar la posición de la coincidencia en el texto original
    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerSearch);

    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <mark className={styles.highlight}>
          {text.substring(index, index + searchTerm.length)}
        </mark>
        {text.substring(index + searchTerm.length)}
      </>
    );
  };

  const handleClientSearchInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setClientSearchTerm(e.target.value);
    setShowClientDropdown(true);
  };

  const handleClientSelectFromSearch = useCallback(
    (client: ClientOption) => {
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
    },
    [onClientChange],
  );

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <label htmlFor="cliente">Empresa</label>

        {loadingClients ? (
          <p className={styles.loadingText}>Cargando empresas...</p>
        ) : isClientUser ? (
          // 🔹 MODO SOLO LECTURA PARA USUARIO CLIENTE:
          // Mostrar solo la empresa a la que pertenece, sin selector
          <p className={styles.fixedClientText}>
            {clients.length > 0
              ? `${clients[0].nombre} (${clients[0].nit})`
              : fixedClientName
                ? `${fixedClientName}${
                    fixedClientNit ? ` (${fixedClientNit})` : ""
                  }`
                : "Empresa asignada"}
          </p>
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
            id="cliente"
            value={selectedClientId || 0}
            onChange={onClientChange}
            disabled={loadingClients}
            className={styles.select}
            aria-label="Seleccionar empresa"
          >
            <option value={0}>Seleccionar empresa...</option>
            {clients.map((c) => (
              <option key={c.idCliente} value={c.idCliente}>
                {c.nombre} ({c.nit})
              </option>
            ))}
          </select>
        ) : (
          // MODO BUSCADOR MEJORADO: cuando hay más de 5 clientes
          <div className={styles.clientSearchWrapper} ref={dropdownRef}>
            <input
              type="text"
              id="cliente-search"
              placeholder={
                loadingClients
                  ? "Cargando empresas..."
                  : "Buscar empresa por nombre o NIT... (ej: 'producción' encuentra 'planta de producción')"
              }
              value={clientSearchTerm}
              onChange={handleClientSearchInputChange}
              onFocus={() => setShowClientDropdown(true)}
              disabled={loadingClients}
              className={styles.clientSearchInput}
              autoComplete="off"
              aria-label="Buscar empresa"
              aria-expanded={showClientDropdown}
              aria-controls="client-search-results"
            />

            {showClientDropdown && !loadingClients && (
              <ul
                id="client-search-results"
                className={styles.clientSearchResults}
                role="listbox"
                aria-label="Resultados de búsqueda de empresas"
              >
                {filteredClients.length > 0 ? (
                  filteredClients.map((c) => (
                    <li
                      key={c.idCliente}
                      className={styles.clientSearchItem}
                      onMouseDown={() => handleClientSelectFromSearch(c)}
                      role="option"
                      aria-selected={c.idCliente === selectedClientId}
                    >
                      <span className={styles.clientName}>
                        {highlightMatch(c.nombre, clientSearchTerm)}
                      </span>
                      {c.nit && (
                        <span className={styles.clientNit}>
                          NIT: {highlightMatch(c.nit, clientSearchTerm)}
                        </span>
                      )}
                    </li>
                  ))
                ) : (
                  <li className={styles.noResults} role="status">
                    No se encontraron empresas para "{clientSearchTerm}"
                  </li>
                )}

                {/* Sugerencias cuando hay pocos resultados */}
                {filteredClients.length > 0 && filteredClients.length < 3 && (
                  <li className={styles.suggestion}>
                    <small>
                      💡 Prueba con términos más cortos o sin tildes
                    </small>
                  </li>
                )}
              </ul>
            )}

            {/* Contador de resultados (opcional) */}
            {clientSearchTerm && !loadingClients && (
              <div className={styles.resultCount}>
                {filteredClients.length}{" "}
                {filteredClients.length === 1
                  ? "empresa encontrada"
                  : "empresas encontradas"}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="busqueda">Búsqueda</label>
        <input
          id="busqueda"
          type="text"
          placeholder="Buscar por código, tipo de aire, área o subárea..."
          value={search}
          onChange={onSearchChange}
          disabled={loadingEquipment}
          className={styles.searchInput}
        />

        {/* Sugerencia de búsqueda flexible para el campo principal */}
        {search && (
          <small className={styles.searchHint}>
            Buscando: "{search}" (coincidencias parciales y sin tildes)
          </small>
        )}
      </div>
    </div>
  );
}
