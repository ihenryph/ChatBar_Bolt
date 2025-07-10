/**
 * Constantes da aplicação
 */

// Configurações de rate limiting
export const RATE_LIMITS = {
  MESSAGES_PER_MINUTE: 20,
  ACTIONS_PER_MINUTE: 50,
  LIKES_PER_MINUTE: 10,
  VOTES_PER_HOUR: 5
};

// Configurações de cache
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
  USER_PRESENCE_TTL: 30 * 1000, // 30 segundos
  MESSAGES_TTL: 2 * 60 * 1000, // 2 minutos
  MAX_CACHE_SIZE: 100
};

// Configurações de performance
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  SCROLL_DEBOUNCE: 100,
  TYPING_DEBOUNCE: 1000
};

// Limites de validação
export const VALIDATION_LIMITS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_TABLE_NUMBER: 1,
  MAX_TABLE_NUMBER: 999,
  MAX_MESSAGE_LENGTH: 500,
  MAX_BIO_LENGTH: 500,
  MAX_INTERESTS_LENGTH: 200,
  MAX_MOOD_LENGTH: 100,
  MAX_MUSIC_GENRES: 10
};

// Status de relacionamento válidos
export const RELATIONSHIP_STATUS = {
  SINGLE: 'Solteiro',
  TAKEN: 'Comprometido',
  MARRIED: 'Casado'
};

// Gêneros musicais disponíveis
export const MUSIC_GENRES = [
  'Rock', 'Pop', 'Sertanejo', 'Funk', 'Eletrônica',
  'Samba', 'MPB', 'Reggae', 'Hip Hop', 'Jazz',
  'Blues', 'Country', 'R&B', 'Indie', 'Metal'
];

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  SOUND_VOLUME: 0.3,
  DISPLAY_DURATION: 5000,
  MAX_NOTIFICATIONS: 3
};

// Configurações de conexão
export const CONNECTION_CONFIG = {
  PRESENCE_UPDATE_INTERVAL: 30000, // 30 segundos
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 1000,
  OFFLINE_RETRY_DELAY: 5000
};

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  RATE_LIMIT_ERROR: 'Muitas tentativas. Aguarde um momento.',
  GENERIC_ERROR: 'Algo deu errado. Tente novamente.',
  OFFLINE_ERROR: 'Você está offline. Algumas funcionalidades podem não funcionar.'
};

// Configurações de PWA
export const PWA_CONFIG = {
  THEME_COLOR: '#111827',
  BACKGROUND_COLOR: '#111827',
  DISPLAY: 'standalone',
  ORIENTATION: 'portrait'
};