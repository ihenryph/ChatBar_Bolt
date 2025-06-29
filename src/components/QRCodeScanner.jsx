import { useState, useRef, useEffect } from 'react';
import { processarQRCode } from '../utils/qrCodeUtils';

/**
 * Componente para escaneamento de QR Code
 * Será implementado quando a funcionalidade for ativada
 */
export default function QRCodeScanner({ onScanSuccess, onScanError, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Placeholder para implementação futura
  const iniciarCamera = async () => {
    try {
      setScanning(true);
      setError(null);
      
      // TODO: Implementar acesso à câmera
      // const stream = await navigator.mediaDevices.getUserMedia({ 
      //   video: { facingMode: 'environment' } 
      // });
      // streamRef.current = stream;
      // if (videoRef.current) {
      //   videoRef.current.srcObject = stream;
      // }
      
      // Por enquanto, simular erro para mostrar interface
      setTimeout(() => {
        setError("Funcionalidade de QR Code será implementada em breve");
        setScanning(false);
      }, 1000);
      
    } catch (err) {
      setError("Erro ao acessar câmera: " + err.message);
      setScanning(false);
      onScanError?.(err);
    }
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      pararCamera();
    };
  }, []);

  const handleManualInput = () => {
    // Simular entrada manual para teste
    const mesaTeste = prompt("Digite o número da mesa (temporário):");
    if (mesaTeste) {
      const dadosSimulados = {
        mesa: mesaTeste,
        estabelecimento: "ChatBar",
        timestamp: Date.now(),
        valido: true
      };
      onScanSuccess?.(dadosSimulados);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="glass-dark rounded-2xl p-6 w-full max-w-sm border border-cyan-500/30">
        <div className="text-center mb-6">
          <h2 className="font-orbitron text-xl font-bold text-neon mb-2">
            SCANNER QR CODE
          </h2>
          <p className="text-gray-300 text-sm font-mono">
            Escaneie o QR Code da mesa
          </p>
        </div>

        {/* Área do scanner */}
        <div className="relative mb-6">
          <div className="aspect-square bg-gray-800 rounded-xl border-2 border-dashed border-cyan-500/50 flex items-center justify-center">
            {scanning ? (
              <div className="text-center">
                <div className="loading-spinner mx-auto mb-2"></div>
                <p className="text-cyan-300 text-xs font-mono">ESCANEANDO...</p>
              </div>
            ) : error ? (
              <div className="text-center p-4">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-red-300 text-xs font-mono">{error}</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-2 opacity-50">📷</div>
                <p className="text-gray-400 text-xs font-mono">CÂMERA INATIVA</p>
              </div>
            )}
          </div>

          {/* Overlay de scan */}
          {scanning && (
            <div className="absolute inset-0 border-2 border-cyan-400 rounded-xl">
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="space-y-3">
          {!scanning ? (
            <button
              onClick={iniciarCamera}
              className="btn-futuristic w-full py-3 rounded-lg font-bold"
            >
              📷 INICIAR SCANNER
            </button>
          ) : (
            <button
              onClick={pararCamera}
              className="btn-futuristic bg-gradient-to-r from-red-600 to-pink-600 w-full py-3 rounded-lg font-bold"
            >
              ⏹️ PARAR SCANNER
            </button>
          )}

          {/* Entrada manual temporária */}
          <button
            onClick={handleManualInput}
            className="glass w-full py-3 rounded-lg font-medium text-sm border border-gray-600/30"
          >
            ⌨️ ENTRADA MANUAL (TEMP)
          </button>

          <button
            onClick={onClose}
            className="glass w-full py-3 rounded-lg font-medium text-sm border border-gray-600/30"
          >
            ❌ CANCELAR
          </button>
        </div>

        {/* Instruções */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400 font-mono">
            💡 Posicione o QR Code da mesa no centro da tela
          </p>
        </div>
      </div>
    </div>
  );
}