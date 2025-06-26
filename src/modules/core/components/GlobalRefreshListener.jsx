// src/modules/core/components/GlobalRefreshListener.jsx
import React from 'react';
import { useRefreshAllData } from '@/modules/core/hooks/useRefreshAllData';

const GlobalRefreshListener = () => {
  const { refreshAll } = useRefreshAllData();

  React.useEffect(() => {
    const handleRefresh = () => {
      refreshAll();
    };

    window.addEventListener('ipoupei:refresh-all-data', handleRefresh);
    
    return () => {
      window.removeEventListener('ipoupei:refresh-all-data', handleRefresh);
    };
  }, [refreshAll]);

  return null;
};

export default GlobalRefreshListener;