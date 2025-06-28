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

export default function Sorteio({ user }) {
  const [participantes, setParticipantes] = useState([]);
  const [ganhador, setGanhador] = useState(null);
  const [jaParticipando, setJaParticipando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    // Observar dados do sorteio em tempo real
    const unsubscribe = onSnapshot(doc(db, "sorteio", "dados"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setParticipantes(data.participantes || []);
        setGanhador(data.ganhador || null);
        setHistorico(data.historico || []);
        
        // Verificar se o usuário já está participando
        const jaEstaParticipando = (data.participantes || []).some(
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
  }, [user]);

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

  const handleSortear = async () => {
    if (participantes.length === 0 || loading) return;

    setLoading(true);
    try {
      const escolhido = participantes[Math.floor(Math.random() * participantes.length)];
      const sorteioRef = doc(db, "sorteio", "dados");
      
      // Adicionar ao histórico
      const novoHistorico = [
        ...historico,
        {
          ganhador: escolhido,
          data: new Date().toISOString(),
          totalParticipantes: participantes.length
        }
      ];
      
      await updateDoc(sorteioRef, {
        ganhador: escolhido,
        historico: novoHistorico
      });
      
      console.log(`🏆 Ganhador sorteado: ${escolhido.name}`);
    } catch (error) {
      console.error("Erro ao sortear:", error);
      alert("Erro ao realizar sorteio. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (loading) return;
    
    const confirmar = window.confirm("Tem certeza que deseja reiniciar o sorteio? Todos os participantes serão removidos.");
    if (!confirmar) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "sorteio", "dados"), {
        participantes: [],
        ganhador: null,
      });
      
      console.log("🔄 Sorteio reiniciado");
    } catch (error) {
      console.error("Erro ao reiniciar sorteio:", error);
      alert("Erro ao reiniciar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const calcularChances = () => {
    if (participantes.length === 0) return 0;
    return ((1 / participantes.length) * 100).toFixed(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-dark rounded-2xl p-6 text-center">
        <h2 className="font-orbitron text-3xl font-bold text-neon mb-3">
          SISTEMA DE SORTEIO
        </h2>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-300 font-mono">
              {participantes.length} PARTICIPANTES
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full pulse-glow"></div>
            <span className="text-green-300 font-mono">SORTEIO ATIVO</span>
          </div>
        </div>
      </div>

      {/* Status do Ganhador */}
      {ganhador && (
        <div className="glass rounded-2xl p-8 border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 hologram">
          <div className="text-center">
            <h3 className="font-orbitron text-3xl font-bold text-yellow-300 mb-4 animate-pulse">
              🏆 TEMOS UM GANHADOR!
            </h3>
            <div className="glass-blue p-6 rounded-xl">
              <p className="text-2xl font-bold text-white mb-2">
                {ganhador.name}
              </p>
              <p className="text-lg text-yellow-300 font-mono">
                SETOR {ganhador.table}
              </p>
            </div>
            <p className="text-gray-300 mt-4 font-mono">
              Parabéns! Você foi sorteado entre {participantes.length} participantes!
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Participação */}
        <div className="glass-dark rounded-2xl p-6">
          <h3 className="font-orbitron text-xl font-bold text-cyan-300 mb-6 text-center">
            🎲 PARTICIPAR DO SORTEIO
          </h3>
          
          <div className="space-y-6">
            {/* Status do usuário */}
            <div className="glass p-4 rounded-xl border border-gray-600/30">
              <div className="flex items-center justify-between mb-3">
                <span className="font-orbitron font-bold text-white">{user.name}</span>
                <div className="glass px-3 py-1 rounded-full text-sm font-mono">
                  Mesa {user.table}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  jaParticipando ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
                }`}></div>
                <span className={`font-mono text-sm ${
                  jaParticipando ? 'text-green-300' : 'text-gray-400'
                }`}>
                  {jaParticipando ? 'PARTICIPANDO DO SORTEIO' : 'NÃO PARTICIPANDO'}
                </span>
              </div>
              
              {jaParticipando && (
                <div className="mt-3 text-sm text-gray-300">
                  <p>🎯 Suas chances: <span className="text-yellow-300 font-bold">{calcularChances()}%</span></p>
                </div>
              )}
            </div>

            {/* Botão de participação */}
            <button
              onClick={handleParticipar}
              disabled={jaParticipando || loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                jaParticipando
                  ? "glass opacity-50 cursor-not-allowed text-gray-400"
                  : "btn-futuristic hover-glow"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="loading-spinner"></div>
                  PROCESSANDO...
                </div>
              ) : jaParticipando ? (
                "✅ JÁ ESTÁ PARTICIPANDO"
              ) : (
                "🎲 PARTICIPAR DO SORTEIO"
              )}
            </button>

            {/* Informações do sorteio */}
            <div className="glass p-4 rounded-xl border border-purple-500/30">
              <h4 className="font-orbitron font-bold text-purple-300 mb-3">📋 INFORMAÇÕES</h4>
              <div className="space-y-2 text-sm text-gray-300 font-mono">
                <p>🎁 PRÊMIO: Bebida grátis</p>
                <p>⏰ DURAÇÃO: Até o final da noite</p>
                <p>🎯 PARTICIPANTES: {participantes.length}</p>
                <p>📊 SUAS CHANCES: {jaParticipando ? `${calcularChances()}%` : '0%'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Participantes */}
        <div className="glass-dark rounded-2xl p-6">
          <h3 className="font-orbitron text-xl font-bold text-yellow-300 mb-6 text-center">
            👥 PARTICIPANTES REGISTRADOS
          </h3>
          
          {participantes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-30">🎲</div>
              <p className="text-gray-400 font-mono">AGUARDANDO PARTICIPANTES...</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {participantes.map((p, i) => {
                const isCurrentUser = p.name === user.name && p.table === user.table;
                
                return (
                  <div
                    key={i}
                    className={`glass p-4 rounded-xl border transition-all duration-300 ${
                      isCurrentUser 
                        ? "border-cyan-400/50 bg-cyan-900/20" 
                        : "border-gray-600/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-orbitron font-semibold text-white">
                          {isCurrentUser ? `${p.name} [VOCÊ]` : p.name}
                        </span>
                        {isCurrentUser && (
                          <div className="bg-cyan-500/30 px-2 py-1 rounded-full text-xs font-bold text-cyan-300 border border-cyan-400/50">
                            SELF
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="glass px-3 py-1 rounded-full text-sm font-mono">
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
      </div>

      {/* Controles Administrativos (apenas para demonstração) */}
      <div className="glass-dark rounded-2xl p-6">
        <h3 className="font-orbitron text-xl font-bold text-red-300 mb-6 text-center">
          ⚙️ CONTROLES DO SORTEIO
        </h3>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleSortear}
            disabled={participantes.length === 0 || loading}
            className="btn-futuristic bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-4 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="loading-spinner"></div>
                SORTEANDO...
              </div>
            ) : (
              "🎲 REALIZAR SORTEIO"
            )}
          </button>
          
          <button
            onClick={handleReset}
            disabled={loading}
            className="btn-futuristic bg-gradient-to-r from-red-600 to-pink-600 px-8 py-4 rounded-xl font-bold disabled:opacity-50"
          >
            🔄 REINICIAR SORTEIO
          </button>
        </div>
      </div>

      {/* Histórico de Sorteios */}
      {historico.length > 0 && (
        <div className="glass-dark rounded-2xl p-6">
          <h3 className="font-orbitron text-xl font-bold text-gray-300 mb-6 text-center">
            📜 HISTÓRICO DE SORTEIOS
          </h3>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {historico.slice(-10).reverse().map((item, idx) => (
              <div key={idx} className="glass p-4 rounded-xl border border-gray-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      🏆 {item.ganhador.name} (Mesa {item.ganhador.table})
                    </p>
                    <p className="text-sm text-gray-400 font-mono">
                      {new Date(item.data).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
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
      <div className="glass-dark rounded-2xl p-4 text-center">
        <p className="text-xs text-gray-400 font-mono">
          💡 CADA USUÁRIO PODE PARTICIPAR APENAS UMA VEZ POR SORTEIO • RESULTADOS EM TEMPO REAL
        </p>
      </div>
    </div>
  );
}