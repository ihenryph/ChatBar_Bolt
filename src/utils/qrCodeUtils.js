/**
 * Utilitários para processamento de QR Code
 */

/**
 * Verifica se o usuário chegou via QR Code analisando a URL
 * Formato esperado: ?mesa=5 ou ?table=5
 */
export function verificarEntradaViaQRCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const mesa = urlParams.get('mesa') || urlParams.get('table');
  
  if (mesa) {
    const numeroMesa = parseInt(mesa);
    if (!isNaN(numeroMesa) && numeroMesa >= 1 && numeroMesa <= 999) {
      return {
        mesa: numeroMesa.toString(),
        viaQRCode: true
      };
    }
  }
  
  return null;
}

/**
 * Limpa os parâmetros de QR Code da URL após o processamento
 */
export function limparParametrosQRCode() {
  const url = new URL(window.location);
  url.searchParams.delete('mesa');
  url.searchParams.delete('table');
  
  // Atualiza a URL sem recarregar a página
  window.history.replaceState({}, document.title, url.pathname);
}

/**
 * Valida se o número da mesa é válido
 */
export function validarMesa(mesa) {
  const numero = parseInt(mesa);
  return !isNaN(numero) && numero >= 1 && numero <= 999;
}

/**
 * Gera URL com QR Code para uma mesa específica
 * (Útil para administradores gerarem QR Codes)
 */
export function gerarURLQRCode(numeroMesa) {
  const baseURL = window.location.origin;
  return `${baseURL}?mesa=${numeroMesa}`;
}

/**
 * Processa dados do QR Code escaneado
 */
export function processarQRCodeEscaneado(qrData) {
  try {
    // Se for uma URL completa
    if (qrData.startsWith('http')) {
      const url = new URL(qrData);
      const mesa = url.searchParams.get('mesa') || url.searchParams.get('table');
      
      if (mesa && validarMesa(mesa)) {
        return {
          mesa: mesa.toString(),
          viaQRCode: true,
          valido: true
        };
      }
    }
    
    // Se for apenas o número da mesa
    if (validarMesa(qrData)) {
      return {
        mesa: qrData.toString(),
        viaQRCode: true,
        valido: true
      };
    }
    
    return {
      valido: false,
      erro: 'QR Code inválido'
    };
    
  } catch (error) {
    return {
      valido: false,
      erro: 'Erro ao processar QR Code'
    };
  }
}