import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import confetti from "canvas-confetti";

export default function Sorteio({ user }) {
  const [participantes, setParticipantes] = useState([]);
  const [ganhador, setGanhador] = useState(null);
  const [jaParticipando, setJaParticipando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLoseMessage, setShowLoseMessage] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  useEffect(() => {
    // Observar dados do sorteio em tempo real
    const unsubscribe = onSnapshot(doc(db, "sorteio", "dados"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const novosParticipantes = data.participantes || [];
        const novoGanhador = data.ganhador || null;
        
        // DETECTAR REINÍCIO DO SORTEIO - Se não há ganhador e havia antes, foi reiniciado
        if (!novoGanhador && ganhador) {
          console.log("🔄 Sorteio reiniciado pelo admin - removendo notificações");
          // Remover TODAS as notificações instantaneamente
          setShowCelebration(false);
          setShowLoseMessage(false);
          setIsWinner(false);
          setGanhador(null);
          setParticipantes(novosParticipantes);
          setHistorico(data.historico || []);
          
          // Verificar se o usuário já está participando
          const jaEstaParticipando = novosParticipantes.some(
            p => p.name === user.name && p.table === user.table
          );
          setJaParticipando(jaEstaParticipando);
          return; // Sair da função para não processar mais nada
        }
        
        // Detectar se há um novo ganhador (apenas se não havia ganhador antes)
        if (novoGanhador && !ganhador) {
          console.log("🏆 Novo ganhador detectado:", novoGanhador);
          
          // Verificar se o usuário atual é o ganhador
          const euSouOGanhador = novoGanhador.name === user.name && novoGanhador.table === user.table;
          setIsWinner(euSouOGanhador);
          
          if (euSouOGanhador) {
            // Animação de vitória para o ganhador
            celebrarVitoria();
          } else {
            // Verificar se o usuário estava participando
            const estavaPariticipando = novosParticipantes.some(
              p => p.name === user.name && p.table === user.table
            );
            
            if (estavaPariticipando) {
              // Mostrar mensagem de "não foi dessa vez" para quem participou mas não ganhou
              mostrarMensagemDerrota();
            }
          }
        }
        
        setParticipantes(novosParticipantes);
        setGanhador(novoGanhador);
        setHistorico(data.historico || []);
        
        // Verificar se o usuário já está participando
        const jaEstaParticipando = novosParticipantes.some(
          p => p.name === user.name && p.table === user.table
        );
        setJaParticipando(jaEstaParticipando);
      } else {
        // Criar documento se não existir
        setDoc(doc(db, "sorteio", "dados"), {
          participantes: [],
          ganhador: null,
          historico: []
        });
      }
    });

    return () => unsubscribe();
  }, [user, ganhador]); // Manter ganhador como dependência para detectar mudanças

  const celebrarVitoria = () => {
    // Tocar som de vitória
    const audio = new Audio("/sounds/curtida.mp3");
    audio.play().catch(() => {
      console.log("Não foi possível tocar o som");
    });

    // Mostrar animação de celebração para o ganhador
    setShowCelebration(true);

    // Disparar confete múltiplas vezes
    const duration = 5000; // 5 segundos
    const end = Date.now() + duration;

    const frame = () => {
      // Confete dourado do lado esquerdo
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB']
      });

      // Confete dourado do lado direito
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB']
      });

      // Confete do centro
      confetti({
        particleCount: 50,
        angle: 90,
        spread: 100,
        origin: { x: 0.5, y: 0.3 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Remover animação após 5 segundos
    setTimeout(() => {
      setShowCelebration(false);
    }, 5000);
  };

  const mostrarMensagemDerrota = () => {
    // Tocar som mais suave para derrota
    const audio = new Audio("/sounds/curtida.mp3");
    audio.volume = 0.3; // Volume mais baixo
    audio.play().catch(() => {
      console.log("Não foi possível tocar o som");
    });

    // Mostrar mensagem de "não foi dessa vez"
    setShowLoseMessage(true);

    // Remover mensagem após 4 segundos
    setTimeout(() => {
      setShowLoseMessage(false);
    }, 4000);
  };

  const handleParticipar = async () => {
    if (jaParticipando || loading) return;

    setLoading(true);
    try {
      const sorteioRef = doc(db, "sorteio", "dados");
      const participante = { 
        name: user.name, 
        table: user.table,
        timestamp: new Date().toISOString()
      };
      
      await updateDoc(sorteioRef, {
        participantes: arrayUnion(participante),
      });
      
      console.log("✅ Participação registrada no sorteio");
    } catch (error) {
      console.error("Erro ao participar do sorteio:", error);
      alert("Erro ao participar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const calcularChances = () => {
    if (participantes.length === 0) return 0;
    return ((1 / participantes.length) * 100).toFixed(1);
  };

  return (
    <div className="space-y-4 relative">
      {/* Overlay de celebração para GANHADORES */}
      {showCelebration && isWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-4 animate-spin">🏆</div>
            <div className="glass-dark rounded-2xl p-6 border-4 border-yellow-400/80 bg-gradient-to-r from-yellow-900/90 to-orange-900/90">
              <h2 className="font-orbitron text-3xl font-bold text-yellow-300 mb-2 animate-pulse">
                PARABÉNS!
              </h2>
              <div className="text-6xl mb-4">🎉🎊🎉</div>
              <p className="text-white text-lg font-mono animate-pulse">
                VOCÊ GANHOU!
              </p>
              <p className="text-yellow-300 text-sm font-mono mt-2">
                Procure o garçom para retirar seu prêmio!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de "não foi dessa vez" para PERDEDORES */}
      {showLoseMessage && !isWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-pulse">😔</div>
            <div className="glass-dark rounded-2xl p-6 border-4 border-gray-400/80 bg-gradient-to-r from-gray-900/90 to-slate-900/90">
              <h2 className="font-orbitron text-2xl font-bold text-gray-300 mb-2">
                NÃO FOI DESSA VEZ
              </h2>
              <div className="text-4xl mb-4">😞💔😢</div>
              <p className="text-gray-300 text-lg font-mono">
                Mais sorte na próxima!
              </p>
              <p className="text-gray-400 text-sm font-mono mt-2">
                Continue participando dos próximos sorteios
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header mobile */}
      <div className="glass-dark rounded-xl p-4 text-center">
        <h2 className="font-orbitron text-xl font-bold text-neon mb-2">
          SORTEIO
        </h2>
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-300 font-mono">
              {participantes.length} PARTICIPANTES
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full pulse-glow"></div>
            <span className="text-green-300 font-mono">ATIVO</span>
          </div>
        </div>
      </div>

      {/* Status do Ganhador */}
      {ganhador && (
        <div className="glass rounded-xl p-6 border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-900/30 to-orange-900/30">
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="font-orbitron text-xl font-bold text-yellow-300 mb-3">
              GANHADOR SORTEADO!
            </h3>
            <div className="glass-blue p-4 rounded-lg border-2 border-yellow-400/50">
              <p className="text-lg font-bold text-white mb-1">
                {ganhador.name}
              </p>
              <p className="text-sm text-yellow-300 font-mono">
                MESA {ganhador.table}
              </p>
            </div>
            
            {/* Mensagem personalizada baseada se é o ganhador ou não */}
            {isWinner ? (
              <div className="mt-4 glass-blue p-3 rounded-lg border border-green-400/50 bg-green-900/20">
                <p className="text-green-300 font-bold text-sm animate-pulse">
                  🎉 VOCÊ É O GANHADOR! 🎉
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Procure o garçom para retirar seu prêmio!
                </p>
              </div>
            ) : (
              <div className="flex justify-center gap-2 mt-4 text-2xl">
                <span className="animate-bounce" style={{animationDelay: '0s'}}>🎉</span>
                <span className="animate-bounce" style={{animationDelay: '0.1s'}}>🎊</span>
                <span className="animate-bounce" style={{animationDelay: '0.2s'}}>🎉</span>
                <span className="animate-bounce" style={{animationDelay: '0.3s'}}>🎊</span>
                <span className="animate-bounce" style={{animationDelay: '0.4s'}}>🎉</span>
              </div>
            )}
            
            <p className="text-gray-300 mt-3 text-sm font-mono">
              Sorteado entre {participantes.length} participantes!
            </p>
          </div>
        </div>
      )}

      {/* Participação */}
      <div className="glass-dark rounded-xl p-4">
        <h3 className="font-orbitron font-bold text-cyan-300 mb-4 text-center text-sm">
          🎲 PARTICIPAR DO SORTEIO
        </h3>
        
        <div className="space-y-4">
          {/* Status do usuário */}
          <div className="glass p-3 rounded-lg border border-gray-600/30">
            <div className="flex items-center justify-between mb-2">
              <span className="font-orbitron font-bold text-white text-sm">{user.name}</span>
              <div className="glass px-2 py-1 rounded-full text-xs font-mono">
                Mesa {user.table}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${
                jaParticipando ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
              }`}></div>
              <span className={`font-mono text-xs ${
                jaParticipando ? 'text-green-300' : 'text-gray-400'
              }`}>
                {jaParticipando ? 'PARTICIPANDO' : 'NÃO PARTICIPANDO'}
              </span>
            </div>
            
            {jaParticipando && (
              <div className="text-xs text-gray-300">
                <p>🎯 Suas chances: <span className="text-yellow-300 font-bold">{calcularChances()}%</span></p>
              </div>
            )}
          </div>

          {/* Botão de participação */}
          <button
            onClick={handleParticipar}
            disabled={jaParticipando || loading}
            className={`w-full py-3 rounded-lg font-bold transition-all duration-200 ${
              jaParticipando
                ? "glass opacity-50 cursor-not-allowed text-gray-400"
                : "btn-futuristic"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="loading-spinner"></div>
                PROCESSANDO...
              </div>
            ) : jaParticipando ? (
              "✅ JÁ PARTICIPANDO"
            ) : (
              "🎲 PARTICIPAR"
            )}
          </button>

          {/* Informações do sorteio */}
          <div className="glass p-3 rounded-lg border border-purple-500/30">
            <h4 className="font-orbitron font-bold text-purple-300 mb-2 text-xs">📋 INFORMAÇÕES</h4>
            <div className="space-y-1 text-xs text-gray-300 font-mono">
              <p>🎁 PRÊMIO: Bebida grátis</p>
              <p>⏰ DURAÇÃO: Até o final da noite</p>
              <p>🎯 PARTICIPANTES: {participantes.length}</p>
              <p>📊 SUAS CHANCES: {jaParticipando ? `${calcularChances()}%` : '0%'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Participantes */}
      <div className="glass-dark rounded-xl p-4">
        <h3 className="font-orbitron font-bold text-yellow-300 mb-4 text-center text-sm">
          👥 PARTICIPANTES
        </h3>
        
        {participantes.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2 opacity-30">🎲</div>
            <p className="text-gray-400 text-sm font-mono">AGUARDANDO...</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {participantes.map((p, i) => {
              const isCurrentUser = p.name === user.name && p.table === user.table;
              const isWinnerUser = ganhador && ganhador.name === p.name && ganhador.table === p.table;
              
              return (
                <div
                  key={i}
                  className={`glass p-3 rounded-lg border transition-all duration-200 ${
                    isWinnerUser 
                      ? "border-yellow-400/80 bg-yellow-900/30 animate-pulse" 
                      : isCurrentUser 
                      ? "border-cyan-400/50 bg-cyan-900/20" 
                      : "border-gray-600/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isWinnerUser && <span className="text-lg animate-bounce">🏆</span>}
                      <span className="font-orbitron font-semibold text-white text-sm truncate">
                        {isCurrentUser ? `${p.name} [VOCÊ]` : p.name}
                        {isWinnerUser && " 🎉"}
                      </span>
                      {isCurrentUser && !isWinnerUser && (
                        <div className="bg-cyan-500/30 px-2 py-1 rounded-full text-xs font-bold text-cyan-300 border border-cyan-400/50 flex-shrink-0">
                          SELF
                        </div>
                      )}
                      {isWinnerUser && (
                        <div className="bg-yellow-500/30 px-2 py-1 rounded-full text-xs font-bold text-yellow-300 border border-yellow-400/50 flex-shrink-0 animate-pulse">
                          GANHADOR!
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="glass px-2 py-1 rounded-full text-xs font-mono">
                        Mesa {p.table}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                        #{String(i + 1).padStart(3, '0')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Histórico de Sorteios */}
      {historico.length > 0 && (
        <div className="glass-dark rounded-xl p-4">
          <h3 className="font-orbitron font-bold text-gray-300 mb-4 text-center text-sm">
            📜 HISTÓRICO
          </h3>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {historico.slice(-5).reverse().map((item, idx) => (
              <div key={idx} className="glass p-3 rounded-lg border border-gray-600/30">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">
                      🏆 {item.ganhador.name} (Mesa {item.ganhador.table})
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {new Date(item.data).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-300">
                      {item.totalParticipantes} participantes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer informativo */}
      <div className="glass-dark rounded-xl p-3 text-center">
        <p className="text-xs text-gray-400 font-mono">
          💡 UM USUÁRIO POR SORTEIO • RESULTADOS EM TEMPO REAL
        </p>
      </div>
    </div>
  );
}