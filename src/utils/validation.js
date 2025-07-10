/**
 * Utilitários de validação e sanitização
 */

// Validação de entrada do usuário
export function validateUserInput(name, table, status) {
  const errors = [];
  
  // Validar nome
  if (!name || typeof name !== 'string') {
    errors.push('Nome é obrigatório');
  } else if (name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  } else if (name.trim().length > 50) {
    errors.push('Nome deve ter no máximo 50 caracteres');
  } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) {
    errors.push('Nome deve conter apenas letras e espaços');
  }
  
  // Validar mesa
  if (!table || typeof table !== 'string') {
    errors.push('Mesa é obrigatória');
  } else {
    const tableNum = parseInt(table.trim());
    if (isNaN(tableNum) || tableNum < 1 || tableNum > 999) {
      errors.push('Mesa deve ser um número entre 1 e 999');
    }
  }
  
  // Validar status
  const validStatuses = ['Solteiro', 'Comprometido', 'Casado'];
  if (!status || !validStatuses.includes(status)) {
    errors.push('Status deve ser: Solteiro, Comprometido ou Casado');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitizar texto para evitar XSS
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 500); // Limita tamanho
}

// Validar mensagem de chat
export function validateMessage(text) {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Mensagem não pode estar vazia' };
  }
  
  const sanitized = sanitizeText(text);
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'Mensagem não pode estar vazia' };
  }
  
  if (sanitized.length > 500) {
    return { isValid: false, error: 'Mensagem muito longa (máximo 500 caracteres)' };
  }
  
  // Verificar spam (muitos caracteres repetidos)
  if (/(.)\1{10,}/.test(sanitized)) {
    return { isValid: false, error: 'Mensagem contém spam' };
  }
  
  return { isValid: true, sanitized };
}

// Rate limiting simples
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(userId) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove requests antigas
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    
    return true;
  }
  
  getRemainingRequests(userId) {
    const userRequests = this.requests.get(userId) || [];
    const now = Date.now();
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

export const messageLimiter = new RateLimiter(20, 60000); // 20 mensagens por minuto
export const actionLimiter = new RateLimiter(50, 60000); // 50 ações por minuto

// Validar dados do perfil
export function validateProfile(profileData) {
  const errors = [];
  
  if (profileData.bio && profileData.bio.length > 500) {
    errors.push('Bio deve ter no máximo 500 caracteres');
  }
  
  if (profileData.interesses && profileData.interesses.length > 200) {
    errors.push('Interesses deve ter no máximo 200 caracteres');
  }
  
  if (profileData.humor && profileData.humor.length > 100) {
    errors.push('Humor deve ter no máximo 100 caracteres');
  }
  
  if (profileData.generosMusicais && profileData.generosMusicais.length > 10) {
    errors.push('Máximo 10 gêneros musicais');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Detectar conteúdo inadequado (lista básica)
const inappropriateWords = [
  // Adicione palavras inadequadas aqui
  'spam', 'teste_palavra_inadequada'
];

export function containsInappropriateContent(text) {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  return inappropriateWords.some(word => lowerText.includes(word));
}

// Validar URL (para futuras funcionalidades)
export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}