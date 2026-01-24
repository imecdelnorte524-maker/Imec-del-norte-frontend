// src/hooks/useInventory.ts
import { useState, useEffect } from "react";
import { inventory as inventoryAPI } from "../api/inventory";
import { toolsApi } from "../api/tools";
import { suppliesApi } from "../api/supplies";
import { warehouses as warehousesApi } from "../api/warehouses";
import { unitMeasureApi } from "../api/unit-measure";
import type {
  Inventory,
  Herramienta,
  Insumo,
  Warehouse,
  UnitMeasure,
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

  useEffect(() => {
    if (!inventory.length) {
      setFilteredInventory([]);
      return;
    }

    let filtered = inventory;
    if (filter === "herramientas") {
      filtered = inventory.filter((item) => !!item.herramientaId);
    } else if (filter === "insumos") {
      filtered = inventory.filter((item) => !!item.insumoId);
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
        const data = await toolsApi.getAvailableHerramientas();
        setHerramientas(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar las herramientas");
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
        const data = await suppliesApi.getAvailableInsumos();
        setInsumos(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar los insumos");
        playErrorSound();
      } finally {
        setLoading(false);
      }
    };
    loadInsumos();
  }, []);

  return { insumos, loading, error };
};

// Hook para acciones de inventario
export const useInventoryActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateInsumoQuantity = async (id: number, cantidadActual: number) => {
    setLoading(true);
    try {
      await inventoryAPI.updateStock(id, cantidadActual);
      return true;
    } catch (err: any) {
      setError(err.message);
      playErrorSound();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateHerramientaLocation = async (id: number, data: any) => {
    setLoading(true);
    try {
      await inventoryAPI.updateInventory(id, data);
      return true;
    } catch (err: any) {
      setError(err.message);
      playErrorSound();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteInventoryItem = async (id: number) => {
    setLoading(true);
    try {
      await inventoryAPI.deleteInventory(id);
      return true;
    } catch (err: any) {
      setError(err.message);
      playErrorSound();
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
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

  const createHerramienta = async (data: any, file?: File) => {
    setLoading(true);
    try {
      return await toolsApi.createHerramienta(data, file);
    } catch (err: any) {
      setError(err.message);
      playErrorSound();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createInsumo = async (data: any, file?: File) => {
    setLoading(true);
    try {
      return await suppliesApi.createInsumo(data, file);
    } catch (err: any) {
      setError(err.message);
      playErrorSound();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createHerramienta, createInsumo, loading, error };
};

// Hook para obtener bodegas
export const useWarehouses = (includeInactive = false) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await warehousesApi.getAll(includeInactive);
      setWarehouses(data);
    } catch (err) {
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  return { warehouses, loading, refetch: loadWarehouses };
};

// Hook para obtener unidades de medida
export const useUnitMeasures = () => {
  const [units, setUnits] = useState<UnitMeasure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    unitMeasureApi
      .getAll()
      .then(setUnits)
      .catch(() => playErrorSound())
      .finally(() => setLoading(false));
  }, []);

  return { units, loading };
};