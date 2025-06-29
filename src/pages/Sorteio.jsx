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

  const calcularChances = () => {
    if (participantes.length === 0) return 0;
    return ((1 / participantes.length) * 100).toFixed(1);
  };

  return (
    <div className="space-y-4">
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
            <h3 className="font-orbitron text-xl font-bold text-yellow-300 mb-3">
              🏆 GANHADOR!
            </h3>
            <div className="glass-blue p-4 rounded-lg">
              <p className="text-lg font-bold text-white mb-1">
                {ganhador.name}
              </p>
              <p className="text-sm text-yellow-300 font-mono">
                MESA {ganhador.table}
              </p>
            </div>
            <p className="text-gray-300 mt-3 text-sm font-mono">
              Parabéns! Sorteado entre {participantes.length} participantes!
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
              
              return (
                <div
                  key={i}
                  className={`glass p-3 rounded-lg border transition-all duration-200 ${
                    isCurrentUser 
                      ? "border-cyan-400/50 bg-cyan-900/20" 
                      : "border-gray-600/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-orbitron font-semibold text-white text-sm truncate">
                        {isCurrentUser ? `${p.name} [VOCÊ]` : p.name}
                      </span>
                      {isCurrentUser && (
                        <div className="bg-cyan-500/30 px-2 py-1 rounded-full text-xs font-bold text-cyan-300 border border-cyan-400/50 flex-shrink-0">
                          SELF
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