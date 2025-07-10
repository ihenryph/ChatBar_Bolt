/**
 * Utilitários para otimização de performance
 */

// Debounce para evitar muitas chamadas seguidas
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle para limitar frequência de execução
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Cache simples para dados
class SimpleCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 minutos default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();

// Lazy loading para componentes
export function lazyLoad(importFunc, fallback = null) {
  const LazyComponent = React.lazy(importFunc);
  
  return function WrappedComponent(props) {
    return (
      <React.Suspense fallback={fallback || <div>Carregando...</div>}>
        <LazyComponent {...props} />
      }
      </React.Suspense>
    );
  };
}

// Otimização de imagens
export function optimizeImage(url, width = 400, quality = 80) {
  if (!url) return '';
  
  // Se for uma URL do Pexels, adicionar parâmetros de otimização
  if (url.includes('pexels.com')) {
    return `${url}?auto=compress&cs=tinysrgb&w=${width}&q=${quality}`;
  }
  
  return url;
}

// Monitoramento de performance
export class PerformanceMonitor {
  static measurements = new Map();
  
  static start(label) {
    this.measurements.set(label, performance.now());
  }
  
  static end(label) {
    const startTime = this.measurements.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      this.measurements.delete(label);
      return duration;
    }
  }
  
  static measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
}

// Detecção de dispositivo
export function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  return {
    isMobile,
    isIOS,
    isAndroid,
    isDesktop: !isMobile,
    supportsTouch: 'ontouchstart' in window,
    connectionType: navigator.connection?.effectiveType || 'unknown'
  };
}

// Otimização de scroll
export function optimizeScroll(element, callback) {
  let ticking = false;
  
  function updateCallback() {
    callback();
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateCallback);
      ticking = true;
    }
  }
  
  element.addEventListener('scroll', requestTick, { passive: true });
  
  return () => {
    element.removeEventListener('scroll', requestTick);
  };
}