/**
 * Utilitários para sistema de QR Code por mesa
 * Preparação para implementação futura
 */

/**
 * Gera dados para QR Code de uma mesa específica
 * @param {string} mesaNumero - Número da mesa
 * @param {string} estabelecimento - Nome do estabelecimento (opcional)
 * @returns {string} - String para gerar QR Code
 */
export function gerarDadosQRCode(mesaNumero, estabelecimento = "ChatBar") {
  const baseUrl = window.location.origin;
  const qrData = {
    mesa: mesaNumero,
    estabelecimento: estabelecimento,
    timestamp: Date.now(),
    url: `${baseUrl}?mesa=${mesaNumero}&auto=true`
  };
  
  return JSON.stringify(qrData);
}

/**
 * Processa dados do QR Code escaneado
 * @param {string} qrData - Dados do QR Code
 * @returns {object|null} - Dados processados ou null se inválido
 */
export function processarQRCode(qrData) {
  try {
    const dados = JSON.parse(qrData);
    
    if (!dados.mesa) {
      throw new Error("Mesa não especificada no QR Code");
    }
    
    return {
      mesa: dados.mesa,
      estabelecimento: dados.estabelecimento || "ChatBar",
      timestamp: dados.timestamp,
      valido: true
    };
  } catch (error) {
    console.error("Erro ao processar QR Code:", error);
    return null;
  }
}

/**
 * Verifica se o usuário chegou via QR Code
 * @returns {object|null} - Dados da mesa se chegou via QR Code
 */
export function verificarEntradaViaQRCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const mesa = urlParams.get('mesa');
  const auto = urlParams.get('auto');
  
  if (mesa && auto === 'true') {
    return {
      mesa: mesa,
      autoPreenchido: true
    };
  }
  
  return null;
}

/**
 * Limpa parâmetros de QR Code da URL
 */
export function limparParametrosQRCode() {
  const url = new URL(window.location);
  url.searchParams.delete('mesa');
  url.searchParams.delete('auto');
  window.history.replaceState({}, document.title, url.pathname);
}

/**
 * Valida número de mesa
 * @param {string} mesa - Número da mesa
 * @returns {boolean} - Se é válido
 */
export function validarMesa(mesa) {
  // Aceita números de 1 a 999
  const numero = parseInt(mesa);
  return !isNaN(numero) && numero >= 1 && numero <= 999;
}

// Configurações para QR Code (para uso futuro)
export const QR_CONFIG = {
  size: 256,
  level: 'M', // Nível de correção de erro
  margin: 4,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
};