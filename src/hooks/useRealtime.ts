// src/hooks/useRealtime.ts
import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSocketEvent } from './useSocketEvent';
import { useQueryClient } from '@tanstack/react-query';

// Mapeo de entidades a sus queryKeys
const entityKeys = {
  workOrders: 'workOrders',
  equipment: 'equipment',
  clients: 'clients',
  inventory: 'inventory',
  users: 'users',
  roles: 'roles',
  supplies: 'supplies',
  tools: 'tools',
  areas: 'areas',
  subAreas: 'subAreas',
  notifications: 'notifications',
} as const;

type EntityType = keyof typeof entityKeys;

interface RealtimeConfig {
  enabled?: boolean;
  entities?: EntityType[];
  onEvent?: (entity: string, action: string, data: any) => void;
}

export function useRealtime(config: RealtimeConfig = {}) {
  const {
    enabled = true,
    entities = Object.keys(entityKeys) as EntityType[],
    onEvent,
  } = config;

  const socket = useSocket();
  const queryClient = useQueryClient();

  // Función para invalidar queries de una entidad
  const invalidateEntity = (entity: string, id?: number | string) => {
    const key = entityKeys[entity as EntityType];
    if (!key) return;

    // Invalidar lista
    queryClient.invalidateQueries({ queryKey: [key] });

    // Invalidar detalle si hay ID
    if (id) {
      queryClient.invalidateQueries({ queryKey: [key, id] });
    }
  };

  // Escuchar entity.updated (evento genérico)
  useSocketEvent<any>(socket, "entity.updated", (data) => {
    if (!enabled) return;
    if (!entities.includes(data.entity)) return;    
    invalidateEntity(data.entity, data.data?.id);
    onEvent?.(data.entity, data.action, data.data);
  });

  // Escuchar eventos específicos de cada entidad
  useEffect(() => {
    if (!socket || !enabled) return;

    const handlers: Array<{ event: string; entity: EntityType }> = [
      // WorkOrders
      { event: 'workOrders.created', entity: 'workOrders' },
      { event: 'workOrders.updated', entity: 'workOrders' },
      { event: 'workOrders.deleted', entity: 'workOrders' },
      { event: 'workOrders.statusUpdated', entity: 'workOrders' },
      { event: 'workOrders.assigned', entity: 'workOrders' },
      
      // Equipment
      { event: 'equipment.created', entity: 'equipment' },
      { event: 'equipment.updated', entity: 'equipment' },
      { event: 'equipment.deleted', entity: 'equipment' },
      
      // Clients
      { event: 'clients.created', entity: 'clients' },
      { event: 'clients.updated', entity: 'clients' },
      { event: 'clients.deleted', entity: 'clients' },
      
      // Inventory
      { event: 'inventory.created', entity: 'inventory' },
      { event: 'inventory.updated', entity: 'inventory' },
      { event: 'inventory.deleted', entity: 'inventory' },
      
      // Users
      { event: 'users.created', entity: 'users' },
      { event: 'users.updated', entity: 'users' },
      { event: 'users.deleted', entity: 'users' },
      
      // Supplies
      { event: 'supplies.created', entity: 'supplies' },
      { event: 'supplies.updated', entity: 'supplies' },
      { event: 'supplies.deleted', entity: 'supplies' },
      
      // Tools
      { event: 'tools.created', entity: 'tools' },
      { event: 'tools.updated', entity: 'tools' },
      { event: 'tools.deleted', entity: 'tools' },
    ];

    const cleanup: Array<() => void> = [];

    handlers.forEach(({ event, entity }) => {
      if (!entities.includes(entity)) return;

      const handler = (data: any) => {
        invalidateEntity(entity, data.id || data.ordenId || data.equipmentId);
        onEvent?.(entity, event, data);
      };

      socket.on(event, handler);
      cleanup.push(() => socket.off(event, handler));
    });

    return () => {
      cleanup.forEach(clean => clean());
    };
  }, [socket, enabled, entities, onEvent]);

  // Función para forzar recarga manual
  const refreshEntity = (entity: EntityType, id?: number | string) => {
    invalidateEntity(entity, id);
  };

  return { refreshEntity };
}