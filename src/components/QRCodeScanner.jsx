import { useState, useRef, useEffect } from 'react';
import { X, Camera, Flashlight } from 'lucide-react';

export default function QRCodeScanner({ onScanSuccess, onScanError, onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Solicitar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Câmera traseira
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Verificar se tem flash
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setHasFlash(capabilities.torch === true);

      // Iniciar scanner (simulado - em produção usaria uma lib como jsQR)
      startQRScanning();

    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setError('Erro ao acessar a câmera. Verifique as permissões.');
      setIsScanning(false);
      onScanError?.(err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const toggleFlash = async () => {
    if (!streamRef.current || !hasFlash) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !flashOn }]
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Erro ao controlar flash:', err);
    }
  };

  const startQRScanning = () => {
    // Simulação de scanner QR - em produção usaria jsQR ou similar
    const interval = setInterval(() => {
      // Simular detecção de QR Code para teste
      // Em produção, aqui seria feita a análise do frame do vídeo
      
      // Para teste, vamos simular um QR Code após 3 segundos
      setTimeout(() => {
        const qrCodeSimulado = "5"; // Mesa 5 como exemplo
        handleQRDetected(qrCodeSimulado);
        clearInterval(interval);
      }, 3000);
    }, 100);

    scannerRef.current = interval;
  };

  const handleQRDetected = (qrData) => {
    console.log('QR Code detectado:', qrData);
    
    // Processar dados do QR Code
    const resultado = processarQRCode(qrData);
    
    if (resultado.valido) {
      onScanSuccess?.(resultado);
      handleClose();
    } else {
      setError(resultado.erro || 'QR Code inválido');
    }
  };

  const processarQRCode = (qrData) => {
    try {
      // Verificar se é um número de mesa válido
      const mesa = parseInt(qrData);
      if (!isNaN(mesa) && mesa >= 1 && mesa <= 999) {
        return {
          mesa: mesa.toString(),
          viaQRCode: true,
          valido: true
        };
      }

      // Verificar se é uma URL com parâmetro de mesa
      if (qrData.includes('mesa=') || qrData.includes('table=')) {
        const url = new URL(qrData);
        const mesaParam = url.searchParams.get('mesa') || url.searchParams.get('table');
        const mesaNum = parseInt(mesaParam);
        
        if (!isNaN(mesaNum) && mesaNum >= 1 && mesaNum <= 999) {
          return {
            mesa: mesaNum.toString(),
            viaQRCode: true,
            valido: true
          };
        }
      }

      return {
        valido: false,
        erro: 'QR Code não contém informações válidas de mesa'
      };

    } catch (error) {
      return {
        valido: false,
        erro: 'Erro ao processar QR Code'
      };
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      clearInterval(scannerRef.current);
    }
    stopCamera();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="glass-dark p-4 flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-lg font-bold text-white">
            SCANNER QR CODE
          </h2>
          <p className="text-xs text-gray-300 font-mono">
            Aponte para o QR Code da mesa
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasFlash && (
            <button
              onClick={toggleFlash}
              className={`p-2 rounded-lg transition-all duration-200 ${
                flashOn 
                  ? 'bg-yellow-500/30 text-yellow-300' 
                  : 'glass text-gray-300'
              }`}
            >
              <Flashlight size={20} />
            </button>
          )}
          
          <button
            onClick={handleClose}
            className="glass p-2 rounded-lg text-gray-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Área do Scanner */}
      <div className="flex-1 relative overflow-hidden">
        {/* Vídeo da câmera */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Overlay de scanning */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Frame de scanning */}
          <div className="relative">
            <div className="w-64 h-64 border-2 border-cyan-400 rounded-lg relative">
              {/* Cantos do frame */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-cyan-400 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-cyan-400 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-cyan-400 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-cyan-400 rounded-br-lg"></div>
              
              {/* Linha de scan animada */}
              {isScanning && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
              )}
            </div>
            
            {/* Instruções */}
            <div className="text-center mt-4">
              <p className="text-white font-mono text-sm">
                {isScanning ? 'ESCANEANDO...' : 'POSICIONE O QR CODE'}
              </p>
              <p className="text-gray-400 font-mono text-xs mt-1">
                Mantenha o código dentro do quadro
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de status */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className={`glass-dark rounded-lg px-4 py-2 border ${
            isScanning 
              ? 'border-green-400/50 bg-green-900/20' 
              : 'border-red-400/50 bg-red-900/20'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isScanning ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`}></div>
              <span className={`text-xs font-mono ${
                isScanning ? 'text-green-300' : 'text-red-300'
              }`}>
                {isScanning ? 'CÂMERA ATIVA' : 'CÂMERA INATIVA'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer com erro ou instruções */}
      <div className="glass-dark p-4">
        {error ? (
          <div className="glass rounded-lg p-3 border border-red-500/50 bg-red-900/20">
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-lg">⚠️</span>
              <div>
                <p className="text-red-300 font-mono text-sm font-bold">ERRO</p>
                <p className="text-red-200 text-xs">{error}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setError(null);
                startCamera();
              }}
              className="btn-futuristic w-full mt-3 py-2 text-xs"
            >
              🔄 TENTAR NOVAMENTE
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400 font-mono">
              <div className="flex items-center gap-1">
                <Camera size={14} />
                <span>SCANNER ATIVO</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span>AGUARDANDO QR CODE</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              💡 Certifique-se de que há boa iluminação
            </p>
          </div>
        )}
      </div>
    </div>
  );
}