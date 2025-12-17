// src/hooks/useClients.ts
import { useState, useEffect } from 'react';
import { clients as clientsAPI } from '../api/clients';
import type { 
  Client, 
  CreateClientDto, 
  UpdateClientDto,
  CreateAreaDto,
  CreateSubAreaDto 
} from '../interfaces/ClientInterfaces';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar todos los clientes
  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientsAPI.getAllClients();
      setClients(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al inicializar
  useEffect(() => {
    loadClients();
  }, []);

  // ✅ CREAR CLIENTE - Con actualización en tiempo real
  const createClient = async (clientData: CreateClientDto) => {
    try {
      setError(null);
      const newClient = await clientsAPI.createClient(clientData);
      
      // 🔄 ACTUALIZAR lista localmente sin recargar
      setClients(prev => [newClient, ...prev]);
      
      return newClient;
    } catch (err: any) {
      setError(err.message || 'Error al crear cliente');
      throw err;
    }
  };

  // ✅ ACTUALIZAR CLIENTE - Con actualización en tiempo real
  const updateClient = async (id: number, clientData: UpdateClientDto) => {
    try {
      setError(null);
      const updatedClient = await clientsAPI.updateClient(id, clientData);
      
      // 🔄 ACTUALIZAR lista localmente
      setClients(prev => prev.map(client => 
        client.idCliente === id ? updatedClient : client
      ));
      
      return updatedClient;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar cliente');
      throw err;
    }
  };

  // ✅ ELIMINAR CLIENTE - Con actualización en tiempo real
  const deleteClient = async (id: number) => {
    try {
      setError(null);
      await clientsAPI.deleteClient(id);
      
      // 🔄 ACTUALIZAR lista localmente
      setClients(prev => prev.filter(client => client.idCliente !== id));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar cliente');
      throw err;
    }
  };

  // ✅ CREAR ÁREA - Con actualización en tiempo real
  const createArea = async (areaData: CreateAreaDto) => {
    try {
      setError(null);
      const newArea = await clientsAPI.createArea(areaData);
      
      // 🔄 ACTUALIZAR cliente específico en la lista
      setClients(prev => prev.map(client => {
        if (client.idCliente === areaData.clienteId) {
          const updatedAreas = [...(client.areas || []), newArea];
          return { ...client, areas: updatedAreas };
        }
        return client;
      }));
      
      return newArea;
    } catch (err: any) {
      setError(err.message || 'Error al crear área');
      throw err;
    }
  };

  // ✅ CREAR SUBÁREA - Con actualización en tiempo real
  const createSubArea = async (subAreaData: CreateSubAreaDto) => {
    try {
      setError(null);
      const newSubArea = await clientsAPI.createSubArea(subAreaData);
      
      // Buscar el área para saber a qué cliente pertenece
      const areas = await clientsAPI.getAllAreas();
      const area = areas.find((a: { idArea: number; }) => a.idArea === subAreaData.areaId);
      
      if (area) {
        // 🔄 ACTUALIZAR lista localmente para el cliente específico
        setClients(prev => prev.map(client => {
          if (client.idCliente === area.clienteId) {
            const updatedAreas = client.areas?.map(a => {
              if (a.idArea === area.idArea) {
                const updatedSubAreas = [...(a.subAreas || []), newSubArea];
                return { ...a, subAreas: updatedSubAreas };
              }
              return a;
            });
            return { ...client, areas: updatedAreas };
          }
          return client;
        }));
      }
      
      return newSubArea;
    } catch (err: any) {
      setError(err.message || 'Error al crear subárea');
      throw err;
    }
  };

  // ✅ OBTENER ÁREAS DE UN CLIENTE (para autocomplete)
  const getAreasByClient = async (clientId: number) => {
    try {
      return await clientsAPI.getAllAreas(clientId);
    } catch (err: any) {
      console.error('Error obteniendo áreas:', err);
      return [];
    }
  };

  // ✅ BUSCAR CLIENTE POR ID
  const getClientById = async (id: number) => {
    try {
      return await clientsAPI.getClientById(id);
    } catch (err: any) {
      console.error('Error obteniendo cliente:', err);
      throw err;
    }
  };

  const refreshClients = async () => {
    await loadClients();
  };

  return {
    // Estado
    clients,
    loading,
    error,
    
    // Acciones CRUD
    refreshClients,
    createClient,
    updateClient,
    deleteClient,
    createArea,
    createSubArea,
    getAreasByClient,
    getClientById,
    
    // Para limpiar errores
    setError: (error: string | null) => setError(error),
  };
};