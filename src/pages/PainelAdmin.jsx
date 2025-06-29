import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore";

export default function PainelAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [tela, setTela] = useState("home");
  const [sorteioData, setSorteioData] = useState({ participantes: [], ganhador: null });
  const [messages, setMessages] = useState([]);
  const [curtidas, setCurtidas] = useState([]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      const lista = querySnapshot.docs.map(doc => doc.data());
      setUsuarios(lista);
    };

    const fetchSorteio = async () => {
      try {
        const sorteioDoc = await getDocs(collection(db, "sorteio"));
        if (!sorteioDoc.empty) {
          const data = sorteioDoc.docs[0].data();
          setSorteioData({
            participantes: data.participantes || [],
            ganhador: data.ganhador || null
          });
        }
      } catch (error) {
        console.log("Erro ao buscar dados do sorteio:", error);
      }
    };

    // Observar mensagens em tempo real
    const unsubMessages = onSnapshot(
      query(collection(db, "messages"), orderBy("timestamp")),
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
      }
    );

    // Observar curtidas em tempo real
    const unsubCurtidas = onSnapshot(
      collection(db, "curtidas"),
      (snapshot) => {
        const curtidasList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCurtidas(curtidasList);
      }
    );

    fetchUsuarios();
    fetchSorteio();

    return () => {
      unsubMessages();
      unsubCurtidas();
    };
  }, []);

  const handleReiniciarSorteio = async () => {
    try {
      const sorteioRef = doc(db, "sorteio", "dados");
      await updateDoc(sorteioRef, {
        participantes: [],
        ganhador: null,
      });
      
      setSorteioData({ participantes: [], ganhador: null });
      alert("Sorteio reiniciado com sucesso!");
    } catch (error) {
      console.error("Erro ao reiniciar sorteio:", error);
      alert("Erro ao reiniciar sorteio. Tente novamente.");
    }
  };

  const handleSortear = async () => {
    if (sorteioData.participantes.length === 0) {
      alert("Não há participantes para sortear!");
      return;
    }

    try {
      const escolhido = sorteioData.participantes[Math.floor(Math.random() * sorteioData.participantes.length)];
      const sorteioRef = doc(db, "sorteio", "dados");
      
      await updateDoc(sorteioRef, {
        ganhador: escolhido,
      });
      
      setSorteioData(prev => ({ ...prev, ganhador: escolhido }));
      alert(`Ganhador sorteado: ${escolhido.name} da Mesa ${escolhido.table}!`);
    } catch (error) {
      console.error("Erro ao sortear:", error);
      alert("Erro ao realizar sorteio. Tente novamente.");
    }
  };

  // Calcular estatísticas gerais
  const totalMensagens = messages.length;
  const totalCurtidas = curtidas.length;
  const usuariosSolteiros = usuarios.filter(u => u.status === "Solteiro").length;
  const usuariosComprometidos = usuarios.filter(u => u.status === "Comprometido" || u.status === "Casado").length;

  return (
    <div className="min-h-screen text-white bg-gray-900">
      {/* Header Administrativo mobile */}
      <header className="glass-dark border-b border-red-500/30 p-4 sticky top-0 z-50">
        <div className="text-center">
          <h1 className="font-orbitron text-lg font-bold text-neon mb-1">
            PAINEL ADMIN
          </h1>
          <p className="text-red-300 font-mono text-xs">
            SISTEMA ADMINISTRATIVO
          </p>
        </div>
        <button
          className="btn-futuristic bg-gradient-to-r from-red-600 to-pink-600 px-4 py-2 rounded-lg font-bold text-xs mt-3 w-full"
          onClick={() => window.location.reload()}
        >
          🚪 DESCONECTAR
        </button>
      </header>

      {/* Navegação mobile */}
      <nav className="glass p-3 m-3 rounded-xl">
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {[
              { id: "home", label: "📊 GERAL", color: "blue" },
              { id: "sorteio", label: "🎁 SORTEIO", color: "yellow" },
              { id: "usuarios", label: "👥 USUÁRIOS", color: "green" }
            ].map((item) => (
              <button
                key={item.id}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  tela === item.id 
                    ? `bg-${item.color}-500/30 text-${item.color}-300 border border-${item.color}-400/50` 
                    : "text-gray-300 bg-gray-800/50"
                }`}
                onClick={() => setTela(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal mobile */}
      <section className="p-3 space-y-4">
        {tela === "home" && (
          <div className="space-y-4">
            {/* Estatísticas Gerais */}
            <div className="glass-dark rounded-xl p-4">
              <h2 className="font-orbitron font-bold text-neon-pink mb-4 text-center text-sm">
                📊 MÉTRICAS DO SISTEMA
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-blue p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-300">{totalMensagens}</div>
                  <div className="text-xs text-blue-200 font-mono">MENSAGENS</div>
                </div>
                <div className="glass p-3 rounded-lg text-center bg-pink-900/20 border border-pink-500/30">
                  <div className="text-2xl font-bold text-pink-300">{totalCurtidas}</div>
                  <div className="text-xs text-pink-200 font-mono">CURTIDAS</div>
                </div>
                <div className="glass p-3 rounded-lg text-center bg-green-900/20 border border-green-500/30">
                  <div className="text-2xl font-bold text-green-300">{usuariosSolteiros}</div>
                  <div className="text-xs text-green-200 font-mono">SOLTEIROS</div>
                </div>
                <div className="glass p-3 rounded-lg text-center bg-yellow-900/20 border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-300">{usuariosComprometidos}</div>
                  <div className="text-xs text-yellow-200 font-mono">VINCULADOS</div>
                </div>
              </div>
            </div>

            {/* Usuários Online */}
            <div className="glass-dark rounded-xl p-4">
              <h2 className="font-orbitron font-bold text-neon mb-3 text-sm">
                👥 ENTIDADES CONECTADAS ({usuarios.length})
              </h2>
              {usuarios.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2 opacity-30">👤</div>
                  <p className="text-gray-400 text-xs font-mono">NENHUMA ENTIDADE</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {usuarios.map((u, idx) => (
                    <div key={idx} className="glass p-3 rounded-lg border border-gray-600/30">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-cyan-300 text-sm">{u.name}</span>
                        <div className="glass px-2 py-1 rounded-full text-xs">
                          Mesa {u.table}
                        </div>
                      </div>
                      <div className="text-xs text-gray-300">
                        <p><span className="text-gray-400">STATUS:</span> {u.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tela === "sorteio" && (
          <div className="space-y-4">
            {/* Controle de Sorteio */}
            <div className="glass-dark rounded-xl p-4">
              <h2 className="font-orbitron font-bold text-yellow-300 mb-4 text-center text-sm">
                🎁 SISTEMA DE SORTEIO
              </h2>
              
              <div className="space-y-4">
                <div className="glass p-3 rounded-lg">
                  <p className="text-gray-300 text-sm font-mono">
                    PARTICIPANTES: <span className="text-yellow-300 font-bold">{sorteioData.participantes.length}</span>
                  </p>
                  {sorteioData.ganhador && (
                    <div className="mt-2 glass-blue p-3 rounded-lg">
                      <p className="text-green-300 text-xs font-mono">
                        🏆 VENCEDOR: {sorteioData.ganhador.name} (Mesa {sorteioData.ganhador.table})
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    className="btn-futuristic bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 rounded-lg flex-1 text-xs"
                    onClick={handleSortear}
                  >
                    🎲 SORTEAR
                  </button>
                  <button 
                    className="btn-futuristic bg-gradient-to-r from-red-600 to-pink-600 px-4 py-3 rounded-lg flex-1 text-xs"
                    onClick={handleReiniciarSorteio}
                  >
                    🔄 REINICIAR
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Participantes */}
            <div className="glass-dark rounded-xl p-4">
              <h3 className="font-orbitron font-bold text-cyan-300 mb-3 text-sm">
                PARTICIPANTES REGISTRADOS
              </h3>
              {sorteioData.participantes.length === 0 ? (
                <p className="text-gray-400 text-xs font-mono text-center py-4">NENHUM PARTICIPANTE</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sorteioData.participantes.map((p, i) => (
                    <div key={i} className="glass p-3 rounded-lg flex items-center justify-between">
                      <span className="text-gray-300 text-sm font-mono">🧑 {p.name}</span>
                      <span className="text-cyan-300 text-xs">Mesa {p.table}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tela === "usuarios" && (
          <div className="glass-dark rounded-xl p-4">
            <h2 className="font-orbitron font-bold text-green-300 mb-4 text-center text-sm">
              👥 LISTA COMPLETA DE USUÁRIOS
            </h2>
            
            {usuarios.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2 opacity-30">👤</div>
                <p className="text-gray-400 text-xs font-mono">NENHUM USUÁRIO CONECTADO</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {usuarios.map((u, idx) => (
                  <div key={idx} className="glass p-4 rounded-lg border border-gray-600/30">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-orbitron font-bold text-white text-sm block truncate">{u.name}</span>
                        <span className="text-xs text-gray-400">Mesa {u.table}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-300">ONLINE</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-300 space-y-1">
                      <p><span className="text-gray-400">STATUS:</span> {u.status}</p>
                      {u.interesses && (
                        <p><span className="text-gray-400">INTERESSES:</span> {u.interesses}</p>
                      )}
                      <p><span className="text-gray-400">CONEXÃO:</span> {u.timestamp?.toDate?.().toLocaleString() || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}