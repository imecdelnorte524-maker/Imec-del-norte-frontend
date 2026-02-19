// src/hooks/useCompanyFilters.ts
import { useState, useEffect, useCallback } from "react";
import { clients } from "../api/clients";
import { useAuth } from "./useAuth";
import type { Client } from "../interfaces/ClientInterfaces";
import type { Area } from "../interfaces/AreaInterfaces";
import type { SubArea } from "../interfaces/SubAreaInterfaces";

interface SubAreaSelection {
  id: number;
  nombre: string;
  level: number;
}

export const useCompanyFilters = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para la empresa seleccionada con TODOS sus datos
  const [selectedCompany, setSelectedCompany] = useState<Client | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [subAreaHierarchy, setSubAreaHierarchy] = useState<SubAreaSelection[]>(
    [],
  );

  // Mapa de subáreas para navegación rápida
  const [subAreaMap, setSubAreaMap] = useState<Map<number, SubArea>>(new Map());

  // Cargar empresas según el rol del usuario
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        setError(null);

        let companiesData: Client[];

        if (user?.role?.nombreRol === "Cliente") {
          companiesData = await clients.getMyClients();
        } else {
          companiesData = await clients.getAllClients();
        }

        setCompanies(companiesData);
      } catch (err) {
        setError("Error al cargar empresas");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [user]);

  // Cargar datos COMPLETOS de la empresa seleccionada
  const loadCompanyDetails = useCallback(async (companyId: number) => {
    try {
      setLoading(true);
      const company = await clients.getClientById(companyId);

      // Verificar que las áreas existen
      if (!company.areas) {
        console.warn("La empresa no tiene áreas");
      }

      setSelectedCompany(company);

      // Construir mapa de subáreas para búsqueda rápida
      const map = new Map<number, SubArea>();
      company.areas?.forEach((area) => {
        if (area.subAreas && Array.isArray(area.subAreas)) {
          area.subAreas.forEach((subArea) => {
            map.set(subArea.idSubArea, subArea);
          });
        }
      });

      setSubAreaMap(map);
    } catch (err) {
      console.error("Error cargando detalles de la empresa:", err);
      setError("Error al cargar detalles de la empresa");
    } finally {
      setLoading(false);
    }
  }, []);

  // Manejar selección de empresa
  const handleCompanyChange = async (companyId: string) => {
    if (!companyId) {
      setSelectedCompany(null);
      setSelectedArea(null);
      setSubAreaHierarchy([]);
      setSubAreaMap(new Map());
      return;
    }

    await loadCompanyDetails(Number(companyId));
    setSelectedArea(null);
    setSubAreaHierarchy([]);
  };

  // Manejar selección de área
  const handleAreaChange = (areaId: string) => {
    if (!selectedCompany || !areaId) {
      setSelectedArea(null);
      setSubAreaHierarchy([]);
      return;
    }

    const area =
      selectedCompany.areas?.find((a) => a.idArea === Number(areaId)) || null;

    if (area) {

    }

    setSelectedArea(area);
    setSubAreaHierarchy([]);
  };

  // Función para obtener todas las subáreas de un nivel específico
  const getSubAreasByLevel = useCallback(
    (area: Area, currentPath: SubAreaSelection[]): SubArea[] => {
      if (!area.subAreas) return [];

      const currentLevel = currentPath.length;

      if (currentLevel === 0) {
        // Primer nivel: subáreas sin padre
        return area.subAreas.filter((sa) => !sa.parentSubAreaId);
      }

      const lastSelected = currentPath[currentPath.length - 1];
      return area.subAreas.filter(
        (sa) => sa.parentSubAreaId === lastSelected.id,
      );
    },
    [],
  );

  // Obtener subáreas del siguiente nivel (wrapper para mantener compatibilidad)
  const getNextLevelSubAreas = useCallback(
    (currentPath: SubAreaSelection[]): SubArea[] => {
      if (!selectedArea) return [];
      return getSubAreasByLevel(selectedArea, currentPath);
    },
    [selectedArea, getSubAreasByLevel],
  );

  // Manejar selección de subárea en cualquier nivel
  const handleSubAreaSelect = (level: number, subAreaId: number) => {
    if (!selectedArea || !selectedArea.subAreas) return;

    const selectedSubArea = selectedArea.subAreas.find(
      (sa) => sa.idSubArea === subAreaId,
    );

    if (!selectedSubArea) return;

    // Actualizar jerarquía
    const newHierarchy = subAreaHierarchy.slice(0, level);
    newHierarchy.push({
      id: selectedSubArea.idSubArea,
      nombre: selectedSubArea.nombreSubArea,
      level,
    });

    setSubAreaHierarchy(newHierarchy);
  };

  // Obtener la cadena completa de padres de una subárea
  const getSubAreaPath = useCallback(
    (subAreaId: number): number[] => {
      const path: number[] = [];
      let currentId: number | null = subAreaId;

      while (currentId) {
        path.unshift(currentId);
        const subArea = subAreaMap.get(currentId);
        currentId = subArea?.parentSubAreaId || null;
      }

      return path;
    },
    [subAreaMap],
  );

  // Verificar si una subárea está en la jerarquía seleccionada (ella o sus hijos)
  const isSubAreaInHierarchy = useCallback(
    (subAreaId: number): boolean => {
      if (subAreaHierarchy.length === 0) return false;

      const lastSelectedId = subAreaHierarchy[subAreaHierarchy.length - 1].id;

      // Si coincide con el último seleccionado
      if (subAreaId === lastSelectedId) return true;

      // Verificar si es hija del último seleccionado
      const subArea = subAreaMap.get(subAreaId);
      if (!subArea) return false;

      // Subir por la cadena de padres hasta encontrar el seleccionado
      let currentParentId = subArea.parentSubAreaId;
      while (currentParentId) {
        if (currentParentId === lastSelectedId) return true;
        const parent = subAreaMap.get(currentParentId);
        currentParentId = parent?.parentSubAreaId || undefined;
      }

      return false;
    },
    [subAreaHierarchy, subAreaMap],
  );

  // Verificar si un equipo coincide con los filtros seleccionados
  const matchesFilters = useCallback(
    (equipo: any): boolean => {
      if (!selectedCompany) return true;

      // Verificar área si está seleccionada
      if (selectedArea && equipo.area?.areaId !== selectedArea.idArea)
        return false;

      // Verificar jerarquía de subáreas
      if (subAreaHierarchy.length > 0) {
        if (!equipo.subArea) return false;
        return isSubAreaInHierarchy(equipo.subArea.subAreaId);
      }

      return true;
    },
    [selectedCompany, selectedArea, subAreaHierarchy, isSubAreaInHierarchy],
  );

  // Limpiar filtros
  const clearFilters = () => {
    setSelectedCompany(null);
    setSelectedArea(null);
    setSubAreaHierarchy([]);
    setSubAreaMap(new Map());
  };

  // Obtener áreas de la empresa seleccionada
  const companyAreas = selectedCompany?.areas || [];

  return {
    companies,
    loading,
    error,
    selectedCompany,
    selectedArea,
    subAreaHierarchy,
    getNextLevelSubAreas,
    handleCompanyChange,
    handleAreaChange,
    handleSubAreaSelect,
    clearFilters,
    matchesFilters,
    isClient: user?.role?.nombreRol === "Cliente",
    companyAreas,
    getSubAreaPath,
    isSubAreaInHierarchy,
  };
};
