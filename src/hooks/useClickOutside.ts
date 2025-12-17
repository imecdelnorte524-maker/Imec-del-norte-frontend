// src/hooks/useClickOutside.ts
import { useEffect, useRef } from 'react';

const useClickOutside = (callback: () => void, excludeSelectors: string[] = []) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Verificar si el clic fue en un elemento excluido
      const isExcluded = excludeSelectors.some(selector => {
        const element = (event.target as Element).closest(selector);
        return element !== null;
      });

      if (isExcluded) {
        return;
      }

      if (ref.current && !ref.current.contains(target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [callback, excludeSelectors]);

  return ref;
};

export default useClickOutside;