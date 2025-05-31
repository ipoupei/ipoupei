// src/utils/lazyLoading.js
import { lazy } from 'react';

// Lazy loading para componentes pesados
export const LazyContasModal = lazy(() => import('../Components/ContasModal'));
export const LazyCategoriasModal = lazy(() => import('../Components/CategoriasModal'));
export const LazyCartoesModal = lazy(() => import('../Components/CartoesModal'));
export const LazyTransferenciasModal = lazy(() => import('../Components/TransferenciasModal'));

// src/hooks/useVirtualization.js
import { useMemo } from 'react';

export const useVirtualization = (items, containerHeight = 400, itemHeight = 60) => {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const bufferCount = 5;
    const totalVisibleItems = visibleCount + bufferCount;
    
    return (startIndex = 0) => {
      const endIndex = Math.min(startIndex + totalVisibleItems, items.length);
      return items.slice(startIndex, endIndex);
    };
  }, [items, containerHeight, itemHeight]);
};

// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// src/utils/memoizedCalculations.js
import { useMemo } from 'react';

export const useTransacaoCalculations = (transacoes) => {
  return useMemo(() => {
    const totals = transacoes.reduce(
      (acc, transacao) => {
        if (transacao.tipo === 'receita') {
          acc.receitas += transacao.valor;
        } else if (transacao.tipo === 'despesa') {
          acc.despesas += transacao.valor;
        }
        return acc;
      },
      { receitas: 0, despesas: 0 }
    );

    return {
      ...totals,
      saldo: totals.receitas - totals.despesas,
      totalTransacoes: transacoes.length
    };
  }, [transacoes]);
};

// src/Components/OptimizedTransacaoList.jsx
import React, { memo, useMemo, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import TransacaoItem from './TransacaoItem';

const TransacaoRowRenderer = memo(({ index, style, data }) => {
  const { transacoes, onEdit, onDelete, onMarkAsCompleted } = data;
  const transacao = transacoes[index];

  return (
    <div style={style}>
      <TransacaoItem
        transacao={transacao}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkAsCompleted={onMarkAsCompleted}
      />
    </div>
  );
});

const OptimizedTransacaoList = memo(({ 
  transacoes = [], 
  loading, 
  onEdit, 
  onDelete, 
  onMarkAsCompleted 
}) => {
  const [listHeight] = useState(600);
  const itemHeight = 80;

  const memoizedData = useMemo(() => ({
    transacoes,
    onEdit: useCallback(onEdit, []),
    onDelete: useCallback(onDelete, []),
    onMarkAsCompleted: useCallback(onMarkAsCompleted, [])
  }), [transacoes, onEdit, onDelete, onMarkAsCompleted]);

  if (loading) {
    return (
      <div className="transacoes-loading">
        <div className="loading-spinner"></div>
        <p>Carregando transações...</p>
      </div>
    );
  }

  if (transacoes.length === 0) {
    return (
      <div className="transacoes-empty">
        <p>Nenhuma transação encontrada</p>
      </div>
    );
  }

  return (
    <List
      height={listHeight}
      itemCount={transacoes.length}
      itemSize={itemHeight}
      itemData={memoizedData}
      overscanCount={5}
    >
      {TransacaoRowRenderer}
    </List>
  );
});

export default OptimizedTransacaoList;

// src/utils/webWorkers.js - Para cálculos pesados
// worker.js
self.onmessage = function(e) {
  const { transacoes, type } = e.data;
  
  switch (type) {
    case 'CALCULATE_TOTALS':
      const totals = transacoes.reduce((acc, t) => {
        if (t.tipo === 'receita') acc.receitas += t.valor;
        else if (t.tipo === 'despesa') acc.despesas += t.valor;
        return acc;
      }, { receitas: 0, despesas: 0 });
      
      self.postMessage({
        type: 'TOTALS_CALCULATED',
        data: {
          ...totals,
          saldo: totals.receitas - totals.despesas
        }
      });
      break;
      
    case 'FILTER_TRANSACTIONS':
      const { filters } = e.data;
      const filtered = transacoes.filter(t => {
        if (filters.tipo && filters.tipo !== 'todas' && t.tipo !== filters.tipo) return false;
        if (filters.categoriaId && t.categoria_id !== filters.categoriaId) return false;
        if (filters.contaId && t.conta_id !== filters.contaId) return false;
        return true;
      });
      
      self.postMessage({
        type: 'TRANSACTIONS_FILTERED',
        data: filtered
      });
      break;
  }
};

// src/hooks/useWebWorker.js
import { useEffect, useRef, useCallback } from 'react';

export const useWebWorker = (workerScript) => {
  const workerRef = useRef(null);
  const callbacksRef = useRef({});

  useEffect(() => {
    workerRef.current = new Worker(workerScript);
    
    workerRef.current.onmessage = (e) => {
      const { type, data } = e.data;
      if (callbacksRef.current[type]) {
        callbacksRef.current[type](data);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [workerScript]);

  const postMessage = useCallback((message, callback) => {
    if (callback) {
      callbacksRef.current[message.type] = callback;
    }
    workerRef.current?.postMessage(message);
  }, []);

  return { postMessage };
};

// src/utils/cacheManager.js
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100;
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move para o final (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove o mais antigo
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

export const cache = new CacheManager();

// src/utils/imageOptimization.js
export const optimizeImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// src/utils/preloadRoutes.js
export const preloadRoute = (routeComponent) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routeComponent;
  document.head.appendChild(link);
};

// Uso em componente:
// useEffect(() => {
//   preloadRoute('/dashboard');
//   preloadRoute('/transacoes');
// }, []);