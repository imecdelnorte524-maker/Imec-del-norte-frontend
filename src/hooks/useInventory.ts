// src/hooks/useInventory.ts
import { useState, useEffect } from "react";
import { inventory as inventoryAPI } from "../api/inventory";
import { catalog } from "../api/catalog";
import type {
  Inventory,
  Herramienta,
  Insumo,
} from "../interfaces/InventoryInterfaces";
import { playErrorSound } from "../utils/sounds";

// Hook para obtener todo el inventario
export const useInventory = (filter?: "todos" | "herramientas" | "insumos") => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getAllInventory();
      setInventory(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar el inventario");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Aplicar filtro
  useEffect(() => {
    if (!inventory.length) return;

    let filtered = inventory;

    if (filter === "herramientas") {
      filtered = inventory.filter(
        (item) =>
          item.herramientaId !== null && item.herramientaId !== undefined
      );
    } else if (filter === "insumos") {
      filtered = inventory.filter(
        (item) => item.insumoId !== null && item.insumoId !== undefined
      );
    }

    setFilteredInventory(filtered);
  }, [inventory, filter]);

  const refetch = () => {
    loadInventory();
  };

  return { inventory: filteredInventory, loading, error, refetch };
};

// Hook para catálogo de herramientas disponibles
export const useAvailableHerramientas = () => {
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHerramientas = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await catalog.getAvailableHerramientas();
        setHerramientas(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar las herramientas disponibles");
        playErrorSound();
      } finally {
        setLoading(false);
      }
    };

    loadHerramientas();
  }, []);

  return { herramientas, loading, error };
};

// Hook para catálogo de insumos disponibles
export const useAvailableInsumos = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInsumos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await catalog.getAvailableInsumos();
        setInsumos(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar los insumos disponibles");
        playErrorSound();
      } finally {
        setLoading(false);
      }
    };

    loadInsumos();
  }, []);

  return { insumos, loading, error };
};

// Hook para acciones de inventario - VERSIÓN SIMPLIFICADA
export const useInventoryActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ❌ FUNCIONES OBSOLETAS - Mantener para compatibilidad pero con advertencia
  const addHerramienta = async () => {
    console.warn(
      "⚠️ addHerramienta es obsoleto: Las herramientas ya crean inventario automáticamente"
    );
    throw new Error(
      "Esta función está obsoleta. Use createHerramienta en su lugar."
    );
  };

  const addInsumo = async () => {
    console.warn(
      "⚠️ addInsumo es obsoleto: Los insumos ya crean inventario automáticamente"
    );
    throw new Error(
      "Esta función está obsoleta. Use createInsumo en su lugar."
    );
  };

  // ✅ FUNCIONES ACTIVAS
  const updateInsumoQuantity = async (id: number, cantidadActual: number) => {
    setLoading(true);
    setError(null);

    try {
      await inventoryAPI.updateStock(id, cantidadActual);
      return true;
    } catch (err: any) {
      setError(err.message || "Error al actualizar cantidad");
      playErrorSound();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateHerramientaLocation = async (
    id: number,
    data: { ubicacion?: string; estado?: string }
  ) => {
    setLoading(true);
    setError(null);

    try {
      await inventoryAPI.updateInventory(id, data);
      return true;
    } catch (err: any) {
      setError(err.message || "Error al actualizar herramienta");
      playErrorSound();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteInventoryItem = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      await inventoryAPI.deleteInventory(id);
      return true;
    } catch (err: any) {
      setError(err.message || "Error al eliminar item");
      playErrorSound();
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    // ❌ OBSOLETOS (solo para compatibilidad)
    addHerramienta,
    addInsumo,
    // ✅ ACTIVOS
    updateInsumoQuantity,
    updateHerramientaLocation,
    deleteInventoryItem,
    loading,
    error,
  };
};

// Hook para crear nuevos items en catálogo
export const useCatalogActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createHerramienta = async (
    data: Omit<Herramienta, "herramientaId" | "fechaRegistro">,
    file?: File
  ) => {
    setLoading(true);
    setError(null);

    try {
      const nuevaHerramienta = await catalog.createHerramienta(data, file);
      return nuevaHerramienta;
    } catch (err: any) {
      console.error("❌ Error en createHerramienta (hook):", err);
      setError(err.message || "Error al crear herramienta");
      playErrorSound();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createInsumo = async (
    data: Omit<Insumo, "insumoId" | "fechaRegistro">,
    file?: File
  ) => {
    setLoading(true);
    setError(null);

    try {
      const nuevoInsumo = await catalog.createInsumo(data, file);
      return nuevoInsumo;
    } catch (err: any) {
      console.error("❌ Error en createInsumo (hook):", err);
      setError(err.message || "Error al crear insumo");
      playErrorSound();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createHerramienta,
    createInsumo,
    loading,
    error,
  };
};
