import { useState, useCallback } from 'react';

interface CrudState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export const useCrudOperations = <T, CreateDto, UpdateDto>(
  fetchData: () => Promise<T[]>,
  createItem: (data: CreateDto) => Promise<T>,
  updateItem: (id: number, data: UpdateDto) => Promise<T>,
  deleteItem: (id: number) => Promise<void>
) => {
  const [state, setState] = useState<CrudState<T>>({
    data: [],
    loading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await fetchData();
      setState({ data, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al cargar datos' 
      }));
    }
  }, [fetchData]);

  const create = useCallback(async (createData: CreateDto): Promise<T> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const newItem = await createItem(createData);
      await refresh();
      return newItem;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Error al crear item' 
      }));
      throw error;
    }
  }, [createItem, refresh]);

  const update = useCallback(async (id: number, updateData: UpdateDto): Promise<T> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const updatedItem = await updateItem(id, updateData);
      await refresh();
      return updatedItem;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Error al actualizar item' 
      }));
      throw error;
    }
  }, [updateItem, refresh]);

  const remove = useCallback(async (id: number): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await deleteItem(id);
      await refresh();
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Error al eliminar item' 
      }));
      throw error;
    }
  }, [deleteItem, refresh]);

  return {
    ...state,
    create,
    update,
    remove,
    refresh,
  };
};