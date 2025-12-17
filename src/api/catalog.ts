// src/api/catalog.ts - VERSIÓN FINAL
import api from './axios';

export const catalog = {
  getAvailableHerramientas: async () => {
    try {
      const response = await api.get('/tool');
      return response.data.data;
    } catch (error: any) {
      console.error('Error obteniendo herramientas:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener herramientas');
    }
  },

  getAvailableInsumos: async () => {
    try {
      const response = await api.get('/supplies');
      return response.data.data;
    } catch (error: any) {
      console.error('Error obteniendo insumos:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener insumos');
    }
  },

  // ✅ CORREGIDO: Crear herramienta con nueva estructura
  createHerramienta: async (herramientaData: any, file?: File) => {
    try {
      console.log('🚀 CREANDO HERRAMIENTA ====================');
      console.log('📦 Datos recibidos:', herramientaData);
      
      // Convertir valor unitario
      const valorUnitario = parseFloat(herramientaData.valorUnitario) || 0;
      
      console.log('💰 Valor unitario corregido:', valorUnitario);

      // Preparar datos para el backend NUEVO
      const datosParaEnviar = {
        nombre: herramientaData.nombre || '',
        marca: herramientaData.marca || '',
        serial: herramientaData.serial || '',
        modelo: herramientaData.modelo || '',
        caracteristicasTecnicas: herramientaData.caracteristicasTecnicas || '',
        observacion: herramientaData.observacion || '',
        tipo: herramientaData.tipo || 'Herramienta',
        estado: herramientaData.estado || 'Disponible',
        valorUnitario: valorUnitario,
        fotoUrl: herramientaData.fotoUrl || '',
        ubicacion: herramientaData.ubicacion || '',
        inventarioId: herramientaData.inventarioId || ''
      };

      console.log('📤 Enviando herramienta:', datosParaEnviar);

      // 1. Crear la herramienta (con foto si hay URL) - El inventario se crea automáticamente
      const response = await api.post('/tool', datosParaEnviar);
      console.log('✅ Herramienta base creada:', response.data);
      
      const herramientaCreada = response.data.data;
      
      // 2. Si hay archivo, subirlo usando el nuevo endpoint UNIFICADO
      if (file && herramientaCreada.herramientaId) {
        try {
          console.log('📤 Subiendo imagen para herramienta...');
          const formData = new FormData();
          formData.append('photo', file);
          
          await api.post(`/uploads/tool/${herramientaCreada.herramientaId}/photo`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('✅ Imagen subida exitosamente');
        } catch (imgError: any) {
          console.warn('⚠️ No se pudo subir la imagen:', imgError.message);
          console.log('ℹ️ La herramienta fue creada, pero sin imagen');
        }
      }
      
      return herramientaCreada;
    } catch (error: any) {
      console.error('❌ ERROR CREANDO HERRAMIENTA:', error);
      console.error('🔍 Detalles del error:', error.response?.data);
      
      if (error.response?.data?.message) {
        const messages = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(', ')
          : error.response.data.message;
        console.error('📢 Mensajes del backend:', messages);
        throw new Error(messages);
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Error al crear herramienta');
    }
  },

  // ✅ CORREGIDO: Crear insumo con nueva estructura (SIN STOCK)
  createInsumo: async (insumoData: any, file?: File) => {
    try {
      console.log('🚀 CREANDO INSUMO ====================');
      console.log('📦 Datos recibidos:', insumoData);
      
      // Convertir valores numéricos - ¡IMPORTANTE! Ya no usamos stock
      const valorUnitario = parseFloat(insumoData.valorUnitario) || 0;
      const stockMin = parseFloat(insumoData.stockMin) || 0;
      const cantidadInicial = parseFloat(insumoData.cantidadInicial) || 0; // NUEVO CAMPO
      
      console.log('✅ Valores convertidos:');
      console.log('   💰 valorUnitario:', valorUnitario);
      console.log('   ⚠️ stockMin:', stockMin);
      console.log('   📦 cantidadInicial:', cantidadInicial);
      
      // PREPARAR DATOS SEGÚN NUEVO BACKEND
      const datosParaEnviar = {
        nombre: insumoData.nombre || '',
        categoria: insumoData.categoria || 'General',
        unidadMedida: insumoData.unidadMedida || 'Unidad',
        stockMin: stockMin,
        valorUnitario: valorUnitario,
        estado: insumoData.estado || 'Disponible', // El backend lo ajustará automáticamente
        fotoUrl: insumoData.fotoUrl || '',
        cantidadInicial: cantidadInicial, // NUEVO: Cantidad en inventario
        ubicacion: insumoData.ubicacion || '', // NUEVO: Ubicación en inventario
        inventarioId: insumoData.inventarioId || ''
      };

      console.log('📤 Enviando insumo al nuevo backend:', datosParaEnviar);

      // 1. Crear el insumo - El inventario se crea AUTOMÁTICAMENTE con cantidadInicial
      const response = await api.post('/supplies', datosParaEnviar);
      console.log('✅ Insumo creado:', response.data);
      
      const insumoCreado = response.data.data;
      
      // 2. Si hay archivo, subirlo usando el nuevo endpoint UNIFICADO
      if (file && insumoCreado.insumoId) {
        try {
          console.log('📤 Subiendo imagen para insumo...');
          const formData = new FormData();
          formData.append('photo', file);
          
          await api.post(`/uploads/supplies/${insumoCreado.insumoId}/photo`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('✅ Imagen subida exitosamente');
        } catch (imgError: any) {
          console.warn('⚠️ No se pudo subir la imagen:', imgError.message);
          console.log('ℹ️ El insumo fue creado, pero sin imagen');
        }
      }
      
      return insumoCreado;
    } catch (error: any) {
      console.error('❌ ERROR CREANDO INSUMO:', error);
      console.error('🔍 Detalles del error:', error.response?.data);
      
      if (error.response?.data?.message) {
        const messages = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(', ')
          : error.response.data.message;
        console.error('📢 Mensajes del backend:', messages);
        throw new Error(messages);
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Error al crear insumo');
    }
  },

  // ✅ ACTUALIZADO: Subir imagen para herramienta (endpoint unificado)
  uploadHerramientaPhoto: async (herramientaId: number, file: File) => {
    try {
      console.log(`📤 Subiendo imagen para herramienta ${herramientaId}...`);
      
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await api.post(`/uploads/tool/${herramientaId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Imagen subida:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error subiendo imagen:', error);
      throw error;
    }
  },

  // ✅ ACTUALIZADO: Subir imagen para insumo (endpoint unificado)
  uploadInsumoPhoto: async (insumoId: number, file: File) => {
    try {
      console.log(`📤 Subiendo imagen para insumo ${insumoId}...`);
      
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await api.post(`/uploads/supplies/${insumoId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Imagen subida:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error subiendo imagen:', error);
      throw error;
    }
  },

  // ✅ NUEVO: Eliminar herramienta
  deleteHerramienta: async (herramientaId: number) => {
    try {
      console.log(`🗑️ Eliminando herramienta ${herramientaId}...`);
      
      const response = await api.delete(`/tool/${herramientaId}`);
      console.log('✅ Herramienta eliminada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error eliminando herramienta:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar herramienta');
    }
  },

  // ✅ NUEVO: Eliminar insumo
  deleteInsumo: async (insumoId: number) => {
    try {
      console.log(`🗑️ Eliminando insumo ${insumoId}...`);
      
      const response = await api.delete(`/supplies/${insumoId}`);
      console.log('✅ Insumo eliminado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error eliminando insumo:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar insumo');
    }
  }
};