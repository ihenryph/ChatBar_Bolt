import { useState, useEffect, useRef } from 'react';
import { onSnapshot, query, collection, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Hook personalizado para gerenciar conexões Firestore de forma otimizada
 */
export function useFirestoreCollection(collectionName, queryConstraints = [], options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const { 
    enableRealtime = true, 
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onDataChange 
  } = options;

  useEffect(() => {
    if (!enableRealtime) {
      setLoading(false);
      return;
    }

    let retryCount = 0;
    
    const setupListener = () => {
      try {
        const q = queryConstraints.length > 0 
          ? query(collection(db, collectionName), ...queryConstraints)
          : collection(db, collectionName);

        unsubscribeRef.current = onSnapshot(
          q,
          (snapshot) => {
            const newData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            setData(newData);
            setLoading(false);
            setError(null);
            retryCount = 0; // Reset retry count on success
            
            if (onDataChange) {
              onDataChange(newData);
            }
          },
          (err) => {
            console.error(`Erro no listener ${collectionName}:`, err);
            setError(err);
            
            if (onError) {
              onError(err);
            }

            // Retry logic
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Tentativa ${retryCount}/${maxRetries} para ${collectionName}`);
              setTimeout(setupListener, retryDelay * retryCount);
            } else {
              setLoading(false);
            }
          }
        );
      } catch (err) {
        console.error(`Erro ao configurar listener ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [collectionName, enableRealtime, maxRetries, retryDelay]);

  return { data, loading, error };
}

/**
 * Hook para gerenciar presença do usuário
 */
export function useUserPresence(user) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const presenceIntervalRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user && isOnline) {
      // Implementar lógica de presença aqui
      const updatePresence = async () => {
        try {
          // Atualizar presença no Firestore
        } catch (error) {
          console.error('Erro ao atualizar presença:', error);
        }
      };

      presenceIntervalRef.current = setInterval(updatePresence, 30000); // 30s
      updatePresence(); // Primeira atualização imediata

      return () => {
        if (presenceIntervalRef.current) {
          clearInterval(presenceIntervalRef.current);
        }
      };
    }
  }, [user, isOnline]);

  return { isOnline };
}