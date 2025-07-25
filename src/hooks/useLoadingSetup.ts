import { useEffect } from 'react';
import { useLoading } from '../contexts/LoadingContext';
import authService from '../services/auth';
import { setChatLoadingWrapper } from '../services/chat';
import { setMessageLoadingWrapper } from '../services/message';
import { setAdminLoadingWrapper } from '../services/admin';

export const useLoadingSetup = () => {
  const { withLoading } = useLoading();

  useEffect(() => {
    // Set up loading wrappers for all services
    authService.setLoadingWrapper(withLoading);
    setChatLoadingWrapper(withLoading);
    setMessageLoadingWrapper(withLoading);
    setAdminLoadingWrapper(withLoading);
  }, [withLoading]);
}; 