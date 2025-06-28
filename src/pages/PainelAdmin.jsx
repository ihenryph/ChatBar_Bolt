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

  // Calcular atividade das mesas
  const calcularAtividadeMesas = () => {
    const atividadePorMesa = {};
    
    // Contar mensagens por mesa
    messages.forEach(msg => {
      if (msg.table) {
        atividadePorMesa[msg.table] = (atividadePorMesa[msg.table] || 0) + 1;
      }
    });

    // Contar curtidas por mesa
    curtidas.forEach(curtida => {
      const usuarioDe = usuarios.find(u => u.name === curtida.de);
      const usuarioPara = usuarios.find(u => u.name === curtida.para);
      
      if (usuarioDe) {
        atividadePorMesa[usuarioDe.table] = (atividadePorMesa[usuarioDe.table] || 0) + 0.5;
      }
      if (usuarioPara) {
        atividadePorMesa[usuarioPara.table] = (atividadePorMesa[usuarioPara.table] || 0) + 0.5;
      }
    });

    return Object.entries(atividadePorMesa)
      .map(([mesa, atividade]) => ({ mesa, atividade }))
      .sort((a, b) => b.atividade - a.atividade);
  };

  // Calcular perfis mais ativos
  const calcularPerfisAtivos = () => {
    const atividadePorUsuario = {};
    
    // Contar mensagens por usuário
    messages.forEach(msg => {
      if (msg.name) {
        atividadePorUsuario[msg.name] = (atividadePorUsuario[msg.name] || 0) + 1;
      }
    });

    // Contar curtidas enviadas
    curtidas.forEach(curtida => {
      atividadePorUsuario[curtida.de] = (atividadePorUsuario[curtida.de] || 0) + 1;
    });

    return Object.entries(atividadePorUsuario)
      .map(([nome, atividade]) => {
        const usuario = usuarios.find(u => u.name === nome);
        return { 
          nome, 
          atividade, 
          mesa: usuario?.table || 'N/A',
          status: usuario?.status || 'N/A'
        };
      })
      .sort((a, b) => b.atividade - a.atividade)
      .slice(0, 10); // Top 10
  };

  const mesasAtivas = calcularAtividadeMesas();
  const perfisAtivos = calcularPerfisAtivos();
  const maxAtividade = Math.max(...mesasAtivas.map(m => m.atividade), 1);

  // Calcular estatísticas gerais
  const totalMensagens = messages.length;
  const totalCurtidas = curtidas.length;
  const usuariosSolteiros = usuarios.filter(u => u.status === "Solteiro").length;
  const usuariosComprometidos = usuarios.filter(u => u.status === "Comprometido" || u.status === "Casado").length;

  return (
    <div className="min-h-screen text-white relative">
      {/* Efeito de partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${4 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Header Administrativo */}
      <header className="glass-dark border-b border-red-500/30 p-6 relative z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-orbitron text-3xl font-bold text-neon mb-2">
              PAINEL DE CONTROLE
            </h1>
            <p className="text-red-300 font-mono text-sm">
              SISTEMA ADMINISTRATIVO • ACESSO RESTRITO
            </p>
          </div>
          <button
            className="btn-futuristic bg-gradient-to-r from-red-600 to-pink-600 px-6 py-3 rounded-xl font-bold"
            onClick={() => window.location.reload()}
          >
            🚪 DESCONECTAR
          </button>
        </div>
      </header>

      {/* Navegação */}
      <nav className="glass p-4 m-6 rounded-2xl relative z-10">
        <div className="flex gap-2 flex-wrap justify-center">
          {[
            { id: "home", label: "📊 VISÃO GERAL", color: "blue" },
            { id: "votacao", label: "🎵 VOTAÇÃO", color: "green" },
            { id: "sorteio", label: "🎁 SORTEIO", color: "yellow" },
            { id: "radar", label: "📡 RADAR", color: "purple" }
          ].map((item) => (
            <button
              key={item.id}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 hover-glow ${
                tela === item.id 
                  ? `bg-${item.color}-500/30 text-${item.color}-300 border border-${item.color}-400/50` 
                  : "text-gray-300 hover:text-white"
              }`}
              onClick={() => setTela(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <section className="p-6 space-y-6 relative z-10">
        {tela === "home" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Clientes Online */}
            <div className="glass-dark rounded-2xl p-6 border border-cyan-500/30">
              <h2 className="font-orbitron text-xl font-bold text-neon mb-4 flex items-center gap-2">
                👥 ENTIDADES CONECTADAS
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </h2>
              {usuarios.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 opacity-30">👤</div>
                  <p className="text-gray-400 font-mono">NENHUMA ENTIDADE DETECTADA</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {usuarios.map((u, idx) => (
                    <div key={idx} className="glass p-4 rounded-xl border border-gray-600/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-cyan-300">{u.name}</span>
                        <div className="glass px-2 py-1 rounded-full text-xs">
                          SETOR {u.table}
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 space-y-1">
                        <p><span className="text-gray-400">STATUS:</span> {u.status}</p>
                        <p><span className="text-gray-400">CONEXÃO:</span> {u.timestamp?.toDate?.().toLocaleTimeString() || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Estatísticas Gerais */}
            <div className="glass-dark rounded-2xl p-6 border border-purple-500/30">
              <h2 className="font-orbitron text-xl font-bold text-neon-pink mb-4">
                📊 MÉTRICAS DO SISTEMA
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-blue p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-blue-300">{totalMensagens}</div>
                  <div className="text-sm text-blue-200 font-mono">TRANSMISSÕES</div>
                </div>
                <div className="glass p-4 rounded-xl text-center bg-pink-900/20 border border-pink-500/30">
                  <div className="text-3xl font-bold text-pink-300">{totalCurtidas}</div>
                  <div className="text-sm text-pink-200 font-mono">CONEXÕES</div>
                </div>
                <div className="glass p-4 rounded-xl text-center bg-green-900/20 border border-green-500/30">
                  <div className="text-3xl font-bold text-green-300">{usuariosSolteiros}</div>
                  <div className="text-sm text-green-200 font-mono">DISPONÍVEIS</div>
                </div>
                <div className="glass p-4 rounded-xl text-center bg-yellow-900/20 border border-yellow-500/30">
                  <div className="text-3xl font-bold text-yellow-300">{usuariosComprometidos}</div>
                  <div className="text-sm text-yellow-200 font-mono">VINCULADOS</div>
                </div>
              </div>
            </div>

            {/* Controle de Sorteio */}
            <div className="glass-dark rounded-2xl p-6 border border-yellow-500/30">
              <h2 className="font-orbitron text-xl font-bold text-yellow-300 mb-4">
                🎁 SISTEMA DE SORTEIO
              </h2>
              <div className="space-y-4">
                <div className="glass p-4 rounded-xl">
                  <p className="text-gray-300 font-mono">
                    PARTICIPANTES: <span className="text-yellow-300 font-bold">{sorteioData.participantes.length}</span>
                  </p>
                  {sorteioData.ganhador && (
                    <div className="mt-2 glass-blue p-3 rounded-lg">
                      <p className="text-green-300 font-mono">
                        🏆 VENCEDOR: {sorteioData.ganhador.name} (SETOR {sorteioData.ganhador.table})
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button 
                    className="btn-futuristic bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 rounded-xl flex-1"
                    onClick={handleSortear}
                  >
                    🎲 EXECUTAR SORTEIO
                  </button>
                  <button 
                    className="btn-futuristic bg-gradient-to-r from-red-600 to-pink-600 px-4 py-2 rounded-xl flex-1"
                    onClick={handleReiniciarSorteio}
                  >
                    🔄 REINICIAR
                  </button>
                </div>
              </div>
            </div>

            {/* Top 3 Mesas */}
            <div className="glass-dark rounded-2xl p-6 border border-orange-500/30">
              <h2 className="font-orbitron text-xl font-bold text-orange-300 mb-4">
                🔥 SETORES MAIS ATIVOS
              </h2>
              {mesasAtivas.length === 0 ? (
                <p className="text-gray-400 font-mono text-center py-4">NENHUMA ATIVIDADE DETECTADA</p>
              ) : (
                <div className="space-y-3">
                  {mesasAtivas.slice(0, 3).map((mesa, idx) => (
                    <div key={mesa.mesa} className="glass p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {idx === 0 && "🥇"} {idx === 1 && "🥈"} {idx === 2 && "🥉"}
                        </span>
                        <span className="font-mono text-gray-300">SETOR {mesa.mesa}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                            style={{ width: `${(mesa.atividade / maxAtividade) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-orange-400 font-bold font-mono">{mesa.atividade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tela === "votacao" && (
          <div className="glass-dark rounded-2xl p-8 border border-green-500/30">
            <h2 className="font-orbitron text-2xl font-bold text-green-300 mb-6 text-center">
              🎵 SISTEMA DE VOTAÇÃO
            </h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-30">🎵</div>
              <p className="text-gray-400 font-mono">MÓDULO EM DESENVOLVIMENTO</p>
              <p className="text-gray-500 text-sm mt-2">Monitoramento de votos será implementado aqui</p>
            </div>
          </div>
        )}

        {tela === "sorteio" && (
          <div className="space-y-6">
            <div className="glass-dark rounded-2xl p-8 border border-yellow-500/30">
              <h2 className="font-orbitron text-2xl font-bold text-yellow-300 mb-6 text-center">
                🎁 GERENCIAMENTO DE SORTEIOS
              </h2>
              
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Status do Sorteio */}
                <div className="glass p-6 rounded-xl border border-gray-600/30">
                  <h3 className="font-orbitron text-lg font-semibold mb-4 text-cyan-300">STATUS ATUAL</h3>
                  <div className="space-y-3">
                    <p className="text-gray-300 font-mono">
                      PARTICIPANTES: <span className="text-yellow-300 font-bold">{sorteioData.participantes.length}</span>
                    </p>
                    
                    {sorteioData.ganhador ? (
                      <div className="glass-blue p-4 rounded-lg border border-green-500/30">
                        <p className="text-green-300 font-mono">
                          🏆 VENCEDOR SELECIONADO:<br/>
                          <span className="text-white font-bold">{sorteioData.ganhador.name}</span> (SETOR {sorteioData.ganhador.table})
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 font-mono">AGUARDANDO EXECUÇÃO</p>
                    )}
                  </div>
                </div>

                {/* Lista de Participantes */}
                <div className="glass p-6 rounded-xl border border-gray-600/30">
                  <h3 className="font-orbitron text-lg font-semibold mb-4 text-cyan-300">ENTIDADES REGISTRADAS</h3>
                  {sorteioData.participantes.length === 0 ? (
                    <p className="text-gray-400 font-mono text-center py-4">NENHUM PARTICIPANTE</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {sorteioData.participantes.map((p, i) => (
                        <div key={i} className="glass p-3 rounded-lg flex items-center justify-between">
                          <span className="text-gray-300 font-mono">🧑 {p.name}</span>
                          <span className="text-cyan-300 text-sm">SETOR {p.table}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Controles */}
              <div className="flex gap-4 mt-6 justify-center">
                <button 
                  className="btn-futuristic bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-4 rounded-xl font-bold disabled:opacity-50"
                  onClick={handleSortear}
                  disabled={sorteioData.participantes.length === 0}
                >
                  🎲 EXECUTAR SORTEIO
                </button>
                <button 
                  className="btn-futuristic bg-gradient-to-r from-red-600 to-pink-600 px-8 py-4 rounded-xl font-bold"
                  onClick={handleReiniciarSorteio}
                >
                  🔄 REINICIAR SISTEMA
                </button>
              </div>
            </div>
          </div>
        )}

        {tela === "radar" && (
          <div className="space-y-6">
            {/* Mesas Mais Movimentadas */}
            <div className="glass-dark rounded-2xl p-8 border border-purple-500/30">
              <h2 className="font-orbitron text-2xl font-bold text-purple-300 mb-6 text-center">
                🔥 ANÁLISE DE ATIVIDADE POR SETOR
              </h2>
              
              {mesasAtivas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-30">📊</div>
                  <p className="text-gray-400 font-mono">NENHUMA ATIVIDADE REGISTRADA</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mesasAtivas.map((mesa, idx) => (
                    <div key={mesa.mesa} className="glass p-6 rounded-xl border border-gray-600/30">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-orbitron font-bold text-white">SETOR {mesa.mesa}</span>
                          {idx < 3 && (
                            <span className="text-2xl">
                              {idx === 0 && "🥇"} {idx === 1 && "🥈"} {idx === 2 && "🥉"}
                            </span>
                          )}
                        </div>
                        <span className="text-yellow-400 font-bold font-mono">{mesa.atividade} PONTOS</span>
                      </div>
                      
                      {/* Barra de progresso */}
                      <div className="w-full bg-gray-700 rounded-full h-4 mb-3">
                        <div 
                          className={`h-4 rounded-full transition-all duration-1000 ${
                            idx === 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 
                            idx === 1 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 
                            idx === 2 ? 'bg-gradient-to-r from-yellow-500 to-green-500' : 
                            'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${(mesa.atividade / maxAtividade) * 100}%` }}
                        ></div>
                      </div>
                      
                      {/* Indicador de calor */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 font-mono">NÍVEL DE ATIVIDADE:</span>
                        <span className={`font-bold font-mono ${
                          mesa.atividade >= maxAtividade * 0.8 ? 'text-red-400' :
                          mesa.atividade >= maxAtividade * 0.5 ? 'text-orange-400' :
                          mesa.atividade >= maxAtividade * 0.3 ? 'text-yellow-400' :
                          'text-blue-400'
                        }`}>
                          {mesa.atividade >= maxAtividade * 0.8 ? 'CRÍTICO 🔥' :
                           mesa.atividade >= maxAtividade * 0.5 ? 'ALTO 🌶️' :
                           mesa.atividade >= maxAtividade * 0.3 ? 'MÉDIO 🌤️' :
                           'BAIXO ❄️'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Perfis Mais Ativos */}
            <div className="glass-dark rounded-2xl p-8 border border-cyan-500/30">
              <h2 className="font-orbitron text-2xl font-bold text-cyan-300 mb-6 text-center">
                👑 RANKING DE ENTIDADES ATIVAS
              </h2>
              
              {perfisAtivos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-30">👤</div>
                  <p className="text-gray-400 font-mono">NENHUMA ATIVIDADE REGISTRADA</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {perfisAtivos.map((perfil, idx) => (
                    <div key={perfil.nome} className="glass p-6 rounded-xl border-l-4 border-cyan-500">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {idx < 3 && (
                            <span className="text-2xl">
                              {idx === 0 && "👑"} {idx === 1 && "🥈"} {idx === 2 && "🥉"}
                            </span>
                          )}
                          <span className="font-orbitron font-semibold text-white">{perfil.nome}</span>
                        </div>
                        <div className="glass-blue px-3 py-1 rounded-full text-sm font-mono">
                          {perfil.atividade} PTS
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-300 space-y-2">
                        <p><span className="text-gray-400">SETOR:</span> {perfil.mesa}</p>
                        <p><span className="text-gray-400">STATUS:</span> {perfil.status}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">ATIVIDADE:</span>
                          <div className="flex-1 bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                              style={{ 
                                width: `${Math.min((perfil.atividade / Math.max(...perfisAtivos.map(p => p.atividade))) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo da Atividade Social */}
            <div className="glass-dark rounded-2xl p-8 border border-green-500/30">
              <h2 className="font-orbitron text-2xl font-bold text-green-300 mb-6 text-center">
                📊 ANÁLISE COMPORTAMENTAL DO AMBIENTE
              </h2>
              
              <div className="grid gap-6 md:grid-cols-3 mb-6">
                <div className="glass-blue p-6 rounded-xl text-center">
                  <div className="text-4xl font-bold text-blue-300 font-mono">{totalMensagens}</div>
                  <div className="text-sm text-blue-200 font-mono">TRANSMISSÕES TOTAIS</div>
                </div>
                
                <div className="glass p-6 rounded-xl text-center bg-pink-900/20 border border-pink-500/30">
                  <div className="text-4xl font-bold text-pink-300 font-mono">{totalCurtidas}</div>
                  <div className="text-sm text-pink-200 font-mono">CONEXÕES ROMÂNTICAS</div>
                </div>
                
                <div className="glass p-6 rounded-xl text-center bg-green-900/20 border border-green-500/30">
                  <div className="text-4xl font-bold text-green-300 font-mono">{usuarios.length}</div>
                  <div className="text-sm text-green-200 font-mono">ENTIDADES ATIVAS</div>
                </div>
              </div>

              <div className="glass p-6 rounded-xl border border-gray-600/30">
                <h3 className="font-orbitron font-semibold mb-4 text-cyan-300">🎯 INSIGHTS DO AMBIENTE</h3>
                <div className="space-y-2 text-sm text-gray-300 font-mono">
                  {mesasAtivas.length > 0 && (
                    <p>🔥 SETOR {mesasAtivas[0].mesa} está dominando as comunicações!</p>
                  )}
                  {perfisAtivos.length > 0 && (
                    <p>👑 {perfisAtivos[0].nome} é a entidade mais ativa do ambiente</p>
                  )}
                  {usuariosSolteiros > usuariosComprometidos && (
                    <p>💚 Ambiente com predominância de entidades disponíveis - clima propício para conexões!</p>
                  )}
                  {totalCurtidas > totalMensagens * 0.3 && (
                    <p>💖 Alto índice de interações românticas detectado!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}