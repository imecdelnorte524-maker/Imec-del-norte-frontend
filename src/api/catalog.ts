// src/api/catalog.ts
import api from './axios';

export const catalog = {
  getAvailableHerramientas: async () => {
    try {
      const response = await api.get('/tool');
      return response.data.data;
    } catch (error: any) {
      console.error('Error obteniendo herramientas:', error);
      throw new Error(
        error.response?.data?.message || 'Error al obtener herramientas',
      );
    }
  },

  getAvailableInsumos: async () => {
    try {
      const response = await api.get('/supplies');
      return response.data.data;
    } catch (error: any) {
      console.error('Error obteniendo insumos:', error);
      throw new Error(
        error.response?.data?.message || 'Error al obtener insumos',
      );
    }
  },

  // Crear herramienta + subir imagen a Cloudinary (opcional)
  createHerramienta: async (herramientaData: any, file?: File) => {
    try {
      console.log('🚀 CREANDO HERRAMIENTA ====================');
      console.log('📦 Datos recibidos:', herramientaData);

      const valorUnitario = parseFloat(herramientaData.valorUnitario) || 0;
      console.log('💰 Valor unitario corregido:', valorUnitario);

      const datosParaEnviar = {
        nombre: herramientaData.nombre || '',
        marca: herramientaData.marca || '',
        serial: herramientaData.serial || '',
        modelo: herramientaData.modelo || '',
        caracteristicasTecnicas:
          herramientaData.caracteristicasTecnicas || '',
        observacion: herramientaData.observacion || '',
        tipo: herramientaData.tipo || 'Herramienta',
        estado: herramientaData.estado || 'Disponible',
        valorUnitario,
        ubicacion: herramientaData.ubicacion || '',
      };

      console.log('📤 Enviando herramienta (JSON):', datosParaEnviar);

      // 1. Crear herramienta (el inventario se crea automáticamente)
      const response = await api.post('/tool', datosParaEnviar);
      console.log('✅ Herramienta base creada:', response.data);

      const herramientaCreada = response.data.data;

      // 2. Si hay archivo, subirlo a Cloudinary via /images/tool/:id
      if (file && herramientaCreada.herramientaId) {
        try {
          console.log('📤 Subiendo imagen para herramienta a /images/tool/...');

          const formData = new FormData();
          formData.append('file', file);

          await api.post(
            `/images/tool/${herramientaCreada.herramientaId}`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            },
          );

          console.log('✅ Imagen subida exitosamente (Cloudinary)');
        } catch (imgError: any) {
          console.warn('⚠️ No se pudo subir la imagen:', imgError?.message);
          console.log(
            'ℹ️ La herramienta fue creada, pero sin imagen (Cloudinary)',
          );
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

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Error al crear herramienta',
      );
    }
  },

  // Crear insumo + subir imagen a Cloudinary (opcional)
  createInsumo: async (insumoData: any, file?: File) => {
    try {
      console.log('🚀 CREANDO INSUMO ====================');
      console.log('📦 Datos recibidos:', insumoData);

      const valorUnitario = parseFloat(insumoData.valorUnitario) || 0;
      const stockMin = parseFloat(insumoData.stockMin) || 0;
      const cantidadInicial =
        parseFloat(insumoData.cantidadInicial) || 0;

      console.log('✅ Valores convertidos:');
      console.log('   💰 valorUnitario:', valorUnitario);
      console.log('   ⚠️ stockMin:', stockMin);
      console.log('   📦 cantidadInicial:', cantidadInicial);

      const datosParaEnviar = {
        nombre: insumoData.nombre || '',
        categoria: insumoData.categoria || 'General',
        unidadMedida: insumoData.unidadMedida || 'Unidad',
        stockMin,
        valorUnitario,
        estado: insumoData.estado || 'Disponible',
        cantidadInicial,
        ubicacion: insumoData.ubicacion || '',
      };

      console.log('📤 Enviando insumo al backend:', datosParaEnviar);

      // 1. Crear insumo (inventario se crea con cantidadInicial)
      const response = await api.post('/supplies', datosParaEnviar);
      console.log('✅ Insumo creado:', response.data);

      const insumoCreado = response.data.data;

      // 2. Si hay archivo, subirlo a Cloudinary via /images/supply/:id
      if (file && insumoCreado.insumoId) {
        try {
          console.log('📤 Subiendo imagen para insumo a /images/supply/...');

          const formData = new FormData();
          formData.append('file', file);

          await api.post(
            `/images/supply/${insumoCreado.insumoId}`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            },
          );

          console.log('✅ Imagen subida exitosamente (Cloudinary)');
        } catch (imgError: any) {
          console.warn('⚠️ No se pudo subir la imagen:', imgError?.message);
          console.log(
            'ℹ️ El insumo fue creado, pero sin imagen (Cloudinary)',
          );
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

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Error al crear insumo',
      );
    }
  },

  // Subir imagen para herramienta (uso adicional si lo necesitas)
  uploadHerramientaPhoto: async (herramientaId: number, file: File) => {
    try {
      console.log(`📤 Subiendo imagen para herramienta ${herramientaId}...`);

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        `/images/tool/${herramientaId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      console.log('✅ Imagen subida:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error subiendo imagen:', error);
      throw error;
    }
  },

  // Subir imagen para insumo (uso adicional si lo necesitas)
  uploadInsumoPhoto: async (insumoId: number, file: File) => {
    try {
      console.log(`📤 Subiendo imagen para insumo ${insumoId}...`);

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        `/images/supply/${insumoId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      console.log('✅ Imagen subida:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error subiendo imagen:', error);
      throw error;
    }
  },

  deleteHerramienta: async (herramientaId: number) => {
    try {
      console.log(`🗑️ Eliminando herramienta ${herramientaId}...`);

      const response = await api.delete(`/tool/${herramientaId}`);
      console.log('✅ Herramienta eliminada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error eliminando herramienta:', error);
      throw new Error(
        error.response?.data?.message || 'Error al eliminar herramienta',
      );
    }
  },

  deleteInsumo: async (insumoId: number) => {
    try {
      console.log(`🗑️ Eliminando insumo ${insumoId}...`);

      const response = await api.delete(`/supplies/${insumoId}`);
      console.log('✅ Insumo eliminado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error eliminando insumo:', error);
      throw new Error(
        error.response?.data?.message || 'Error al eliminar insumo',
      );
    }
  },
};