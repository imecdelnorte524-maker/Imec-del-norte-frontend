import api from './axios';
import {
  ToolStatus,
  SupplyStatus,
  SupplyCategory,
  UnitOfMeasure,
  InventoryItemType
} from '../shared/enums/inventory.enum';

export const inventory = {
  // ✅ Obtener todo el inventario
  getAllInventory: async () => {
    try {
      console.log('🔄 Solicitando inventario al backend...');
      const response = await api.get('/inventory');

      console.log('✅ Respuesta recibida del backend:', response.data);

      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.error('❌ ERROR: Datos no son un array');
        return [];
      }

      // TRANSFORMAR los datos del nuevo backend
      const transformedData = response.data.data.map((item: any) => {
        // Determinar tipo basado en lo que viene del backend
        let tipo: InventoryItemType = item.insumoId ? 'insumo' : 'herramienta';
        let nombreItem = '';
        
        // Extraer información del item
        if (item.supply) {
          nombreItem = item.supply.nombre || 'Sin nombre';
        } else if (item.tool) {
          nombreItem = item.tool.nombre || 'Sin nombre';
        } else {
          nombreItem = item.nombreItem || 'Sin nombre';
        }

        // Convertir cantidadActual
        const cantidadActual = item.cantidadActual
          ? parseFloat(item.cantidadActual)
          : 0;

        // Crear objeto transformado
        const transformedItem: any = {
          inventarioId: item.inventarioId,
          insumoId: item.insumoId || undefined,
          herramientaId: item.herramientaId || undefined,
          cantidadActual: cantidadActual,
          ubicacion: item.ubicacion || '',
          fechaUltimaActualizacion: item.fechaUltimaActualizacion,
          tipo: tipo,
          nombreItem: nombreItem,
        };

        // Agregar información extendida si existe
        if (item.tool) {
          transformedItem.tool = {
            herramientaId: item.tool.herramientaId,
            nombre: item.tool.nombre,
            marca: item.tool.marca || '',
            serial: item.tool.serial || '',
            modelo: item.tool.modelo || '',
            estado: item.tool.estado as ToolStatus || ToolStatus.DISPONIBLE,
            valorUnitario: item.tool.valorUnitario ? parseFloat(item.tool.valorUnitario) : 0,
            fotoUrl: item.tool.fotoUrl || null,
          };
        }

        if (item.supply) {
          transformedItem.supply = {
            insumoId: item.supply.insumoId,
            nombre: item.supply.nombre,
            categoria: item.supply.categoria as SupplyCategory || SupplyCategory.GENERAL,
            unidadMedida: item.supply.unidadMedida as UnitOfMeasure || UnitOfMeasure.UNIDAD,
            estado: item.supply.estado as SupplyStatus || SupplyStatus.DISPONIBLE,
            stockMin: item.supply.stockMin ? parseFloat(item.supply.stockMin) : 0,
            valorUnitario: item.supply.valorUnitario ? parseFloat(item.supply.valorUnitario) : 0,
            fotoUrl: item.supply.fotoUrl || null,
          };
        }

        console.log('✨ Item transformado:', transformedItem);
        return transformedItem;
      });

      console.log('🎉 Inventario transformado:', transformedData);
      return transformedData;

    } catch (error: any) {
      console.error('❌ Error obteniendo inventario:', error);
      console.error('🔍 Detalles del error:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Error al obtener inventario');
    }
  },

  // ✅ Crear registro de inventario
  createInventory: async (data: {
    insumoId?: number;
    herramientaId?: number;
    cantidadActual?: number;
    ubicacion?: string
  }) => {
    try {
      console.log('📤 Creando inventario MANUAL:', data);

      // Validar que solo sea insumo (herramientas se crean automáticamente)
      if (data.herramientaId) {
        console.warn('⚠️ Las herramientas ya tienen inventario automático');
      }

      const response = await api.post('/inventory', data);
      console.log('✅ Inventario creado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creando inventario:', error);
      console.error('🔍 Detalles del error:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Error al crear registro de inventario');
    }
  },

  // ✅ Actualizar inventario
  updateInventory: async (id: number, data: any) => {
    try {
      const response = await api.patch(`/inventory/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error actualizando inventario:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar inventario');
    }
  },

  // ✅ Eliminar solo el inventario (sin item asociado)
  deleteInventory: async (id: number) => {
    try {
      const response = await api.delete(`/inventory/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error eliminando inventario:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar inventario');
    }
  },

  // ✅ Eliminar inventario y item asociado (COMPLETO)
  deleteInventoryAndItem: async (inventarioId: number): Promise<any> => {
    try {
      console.log(`🗑️ Solicitando eliminación completa para inventario ID: ${inventarioId}`);
      
      // Usar el endpoint de eliminación completa del backend
      const response = await api.delete(`/inventory/complete/${inventarioId}`);
      
      console.log('✅ Eliminación completa exitosa:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Error en eliminación completa:', error);
      
      // Proporcionar un mensaje de error más detallado
      if (error.response) {
        console.error('🔍 Detalles del error:', error.response.data);
        throw new Error(
          `Error del servidor (${error.response.status}): ${error.response.data.message || 'Error al eliminar'}`
        );
      } else if (error.request) {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
      } else {
        throw new Error('Error al procesar la solicitud de eliminación.');
      }
    }
  },

  // ✅ Buscar en inventario
  searchInventory: async (keyword: string) => {
    try {
      const response = await api.get('/inventory', {
        params: { search: keyword }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error buscando inventario:', error);
      throw new Error(error.response?.data?.message || 'Error al buscar inventario');
    }
  },

  // ✅ Obtener stock bajo
  getLowStock: async () => {
    try {
      const response = await api.get('/inventory', {
        params: { lowStock: true }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error obteniendo stock bajo:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener stock bajo');
    }
  },

  // ✅ Actualizar stock
  updateStock: async (id: number, cantidad: number) => {
    try {
      const response = await api.patch(`/inventory/${id}/stock`, { cantidad });
      return response.data;
    } catch (error: any) {
      console.error('Error actualizando stock:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar stock');
    }
  },
};