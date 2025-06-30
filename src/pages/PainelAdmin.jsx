import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, updateDoc, onSnapshot, query, orderBy, setDoc } from "firebase/firestore";

export default function PainelAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [tela, setTela] = useState("home");
  const [sorteioData, setSorteioData] = useState({ participantes: [], ganhador: null });
  const [messages, setMessages] = useState([]);
  const [curtidas, setCurtidas] = useState([]);
  const [votos, setVotos] = useState([]);
  const [drinks, setDrinks] = useState([]);

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

    // Observar votos em tempo real
    const unsubVotos = onSnapshot(
      query(collection(db, "votos"), orderBy("timestamp", "desc")),
      (snapshot) => {
        const votosList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVotos(votosList);
      }
    );

    // Observar drinks em tempo real
    const unsubDrinks = onSnapshot(
      query(collection(db, "drinks"), orderBy("timestamp", "desc")),
      (snapshot) => {
        const drinksList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDrinks(drinksList);
      }
    );

    fetchUsuarios();
    fetchSorteio();

    return () => {
      unsubMessages();
      unsubCurtidas();
      unsubVotos();
      unsubDrinks();
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

    // Contar votos por mesa
    votos.forEach(voto => {
      if (voto.userTable) {
        atividadePorMesa[voto.userTable] = (atividadePorMesa[voto.userTable] || 0) + 0.3;
      }
    });

    // Contar drinks por mesa
    drinks.forEach(drink => {
      if (drink.mesaDe) {
        atividadePorMesa[drink.mesaDe] = (atividadePorMesa[drink.mesaDe] || 0) + 0.8;
      }
      if (drink.mesaPara) {
        atividadePorMesa[drink.mesaPara] = (atividadePorMesa[drink.mesaPara] || 0) + 0.8;
      }
    });

    return Object.entries(atividadePorMesa)
      .map(([mesa, atividade]) => ({ mesa, atividade: Math.round(atividade * 10) / 10 }))
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

    // Contar votos
    votos.forEach(voto => {
      if (voto.userName) {
        atividadePorUsuario[voto.userName] = (atividadePorUsuario[voto.userName] || 0) + 0.5;
      }
    });

    // Contar drinks enviados
    drinks.forEach(drink => {
      if (drink.de) {
        atividadePorUsuario[drink.de] = (atividadePorUsuario[drink.de] || 0) + 1.5;
      }
    });

    return Object.entries(atividadePorUsuario)
      .map(([nome, atividade]) => {
        const usuario = usuarios.find(u => u.name === nome);
        return { 
          nome, 
          atividade: Math.round(atividade * 10) / 10, 
          mesa: usuario?.table || 'N/A',
          status: usuario?.status || 'N/A'
        };
      })
      .sort((a, b) => b.atividade - a.atividade)
      .slice(0, 10); // Top 10
  };

  // Calcular estatísticas de votação
  const calcularEstatisticasVotacao = () => {
    const contagem = {};
    votos.forEach(voto => {
      contagem[voto.musicaNome] = (contagem[voto.musicaNome] || 0) + 1;
    });
    
    return Object.entries(contagem)
      .map(([musica, votos]) => ({ musica, votos }))
      .sort((a, b) => b.votos - a.votos)
      .slice(0, 5); // Top 5
  };

  // Calcular estatísticas de drinks
  const calcularEstatisticasDrinks = () => {
    const totalDrinks = drinks.length;
    const drinksAceitos = drinks.filter(d => d.status === "aceito").length;
    const drinksRecusados = drinks.filter(d => d.status === "recusado").length;
    const drinksPendentes = drinks.filter(d => d.status === "pendente").length;
    const drinksAnonimos = drinks.filter(d => d.anonimo).length;
    
    const valorTotal = drinks.reduce((total, drink) => total + (drink.preco || 0), 0);
    
    return {
      total: totalDrinks,
      aceitos: drinksAceitos,
      recusados: drinksRecusados,
      pendentes: drinksPendentes,
      anonimos: drinksAnonimos,
      valorTotal: valorTotal
    };
  };

  const mesasAtivas = calcularAtividadeMesas();
  const perfisAtivos = calcularPerfisAtivos();
  const musicasPopulares = calcularEstatisticasVotacao();
  const estatisticasDrinks = calcularEstatisticasDrinks();
  const maxAtividade = Math.max(...mesasAtivas.map(m => m.atividade), 1);

  // Calcular estatísticas gerais
  const totalMensagens = messages.length;
  const totalCurtidas = curtidas.length;
  const totalVotos = votos.length;
  const totalDrinks = drinks.length;
  const usuariosSolteiros = usuarios.filter(u => u.status === "Solteiro").length;
  const usuariosComprometidos = usuarios.filter(u => u.status === "Comprometido" || u.status === "Casado").length;

  return (
    <div className="min-h-screen text-white relative max-w-md mx-auto bg-black/20">
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
      <header className="glass-dark border-b border-red-500/30 p-4 sticky top-0 z-50">
        <div className="text-center">
          <h1 className="font-orbitron text-xl font-bold text-neon mb-1">
            PAINEL DE CONTROLE
          </h1>
          <p className="text-red-300 font-mono text-xs">
            SISTEMA ADMINISTRATIVO • ACESSO RESTRITO
          </p>
        </div>
        <button
          className="btn-futuristic bg-gradient-to-r from-red-600 to-pink-600 px-4 py-2 rounded-lg font-bold text-xs mt-3 w-full"
          onClick={() => window.location.reload()}
        >
          🚪 DESCONECTAR
        </button>
      </header>

      {/* Navegação em 2 linhas */}
      <nav className="glass p-3 m-3 rounded-xl relative z-10">
        <div className="space-y-2">
          {/* Primeira linha - Funcionalidades principais */}
          <div className="grid grid-cols-3 gap-2">
            <button
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-glow text-center ${
                tela === "home" 
                  ? "bg-blue-500/30 text-blue-300 border border-blue-400/50" 
                  : "text-gray-300 bg-gray-800/50 hover:text-white"
              }`}
              onClick={() => setTela("home")}
            >
              📊 VISÃO GERAL
            </button>
            <button
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-glow text-center ${
                tela === "radar" 
                  ? "bg-purple-500/30 text-purple-300 border border-purple-400/50" 
                  : "text-gray-300 bg-gray-800/50 hover:text-white"
              }`}
              onClick={() => setTela("radar")}
            >
              📡 RADAR SOCIAL
            </button>
            <button
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-glow text-center ${
                tela === "votacao" 
                  ? "bg-green-500/30 text-green-300 border border-green-400/50" 
                  : "text-gray-300 bg-gray-800/50 hover:text-white"
              }`}
              onClick={() => setTela("votacao")}
            >
              🎵 VOTAÇÃO
            </button>
          </div>

          {/* Segunda linha - Funcionalidades secundárias */}
          <div className="grid grid-cols-3 gap-2">
            <button
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-glow text-center ${
                tela === "drinks" 
                  ? "bg-orange-500/30 text-orange-300 border border-orange-400/50" 
                  : "text-gray-300 bg-gray-800/50 hover:text-white"
              }`}
              onClick={() => setTela("drinks")}
            >
              🍻 DRINKS
            </button>
            <button
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-glow text-center ${
                tela === "sorteio" 
                  ? "bg-yellow-500/30 text-yellow-300 border border-yellow-400/50" 
                  : "text-gray-300 bg-gray-800/50 hover:text-white"
              }`}
              onClick={() => setTela("sorteio")}
            >
              🎁 SORTEIO
            </button>
            <button
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-glow text-center ${
                tela === "usuarios" 
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400/50" 
                  : "text-gray-300 bg-gray-800/50 hover:text-white"
              }`}
              onClick={() => setTela("usuarios")}
            >
              👥 USUÁRIOS
            </button>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <section className="p-3 space-y-4 relative z-10">
        {tela === "home" && (
          <div className="space-y-4">
            {/* Estatísticas Gerais */}
            <div className="glass-dark rounded-xl p-4 border border-purple-500/30">
              <h2 className="font-orbitron font-bold text-neon-pink mb-4 text-center text-sm">
                📊 MÉTRICAS DO SISTEMA
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-blue p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-300">{totalMensagens}</div>
                  <div className="text-xs text-blue-200 font-mono">TRANSMISSÕES</div>
                </div>
                <div className="glass p-3 rounded-lg text-center bg-pink-900/20 border border-pink-500/30">
                  <div className="text-2xl font-bold text-pink-300">{totalCurtidas}</div>
                  <div className="text-xs text-pink-200 font-mono">CONEXÕES</div>
                </div>
                <div className="glass p-3 rounded-lg text-center bg-green-900/20 border border-green-500/30">
                  <div className="text-2xl font-bold text-green-300">{totalVotos}</div>
                  <div className="text-xs text-green-200 font-mono">VOTOS</div>
                </div>
                <div className="glass p-3 rounded-lg text-center bg-orange-900/20 border border-orange-500/30">
                  <div className="text-2xl font-bold text-orange-300">{totalDrinks}</div>
                  <div className="text-xs text-orange-200 font-mono">DRINKS</div>
                </div>
              </div>
            </div>

            {/* Estatísticas de Drinks */}
            <div className="glass-dark rounded-xl p-4 border border-orange-500/30">
              <h2 className="font-orbitron font-bold text-orange-300 mb-3 text-sm">
                🍻 SISTEMA DE DRINKS
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="glass p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-300">{estatisticasDrinks.aceitos}</div>
                  <div className="text-xs text-green-200 font-mono">ACEITOS</div>
                </div>
                <div className="glass p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-red-300">{estatisticasDrinks.recusados}</div>
                  <div className="text-xs text-red-200 font-mono">RECUSADOS</div>
                </div>
                <div className="glass p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-yellow-300">{estatisticasDrinks.pendentes}</div>
                  <div className="text-xs text-yellow-200 font-mono">PENDENTES</div>
                </div>
                <div className="glass p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-purple-300">{estatisticasDrinks.anonimos}</div>
                  <div className="text-xs text-purple-200 font-mono">ANÔNIMOS</div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <div className="text-lg font-bold text-orange-300">
                  R$ {estatisticasDrinks.valorTotal}
                </div>
                <div className="text-xs text-orange-200 font-mono">VALOR TOTAL</div>
              </div>
            </div>

            {/* Top 3 Mesas Mais Ativas */}
            <div className="glass-dark rounded-xl p-4 border border-cyan-500/30">
              <h2 className="font-orbitron font-bold text-cyan-300 mb-3 text-sm">
                🔥 TOP 3 MESAS MAIS ATIVAS
              </h2>
              {mesasAtivas.length === 0 ? (
                <p className="text-gray-400 text-xs font-mono text-center py-4">NENHUMA ATIVIDADE DETECTADA</p>
              ) : (
                <div className="space-y-2">
                  {mesasAtivas.slice(0, 3).map((mesa, idx) => (
                    <div key={mesa.mesa} className="glass p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {idx === 0 && "🥇"} {idx === 1 && "🥈"} {idx === 2 && "🥉"}
                        </span>
                        <span className="font-mono text-gray-300 text-sm">MESA {mesa.mesa}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                            style={{ width: `${(mesa.atividade / maxAtividade) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-orange-400 font-bold text-xs font-mono">{mesa.atividade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Usuários Online */}
            <div className="glass-dark rounded-xl p-4 border border-yellow-500/30">
              <h2 className="font-orbitron font-bold text-yellow-300 mb-3 text-sm flex items-center gap-2">
                👥 ENTIDADES CONECTADAS
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </h2>
              {usuarios.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2 opacity-30">👤</div>
                  <p className="text-gray-400 text-xs font-mono">NENHUMA ENTIDADE DETECTADA</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {usuarios.slice(0, 8).map((u, idx) => (
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
                  {usuarios.length > 8 && (
                    <div className="text-center text-xs text-gray-400 font-mono">
                      ... e mais {usuarios.length - 8} usuários
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seção de Drinks */}
        {tela === "drinks" && (
          <div className="space-y-4">
            {/* Estatísticas Detalhadas de Drinks */}
            <div className="glass-dark rounded-xl p-4 border border-orange-500/30">
              <h2 className="font-orbitron font-bold text-orange-300 mb-4 text-center text-sm">
                🍻 ANÁLISE COMPLETA DE DRINKS
              </h2>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="glass-blue p-3 rounded-lg text-center">
                  <div className="text-xl font-bold text-green-300">{estatisticasDrinks.aceitos}</div>
                  <div className="text-xs text-green-200 font-mono">ACEITOS</div>
                </div>
                <div className="glass p-3 rounded-lg text-center bg-red-900/20 border border-red-500/30">
                  <div className="text-xl font-bold text-red-300">{estatisticasDrinks.recusados}</div>
                  <div className="text-xs text-red-200 font-mono">RECUSADOS</div>
                </div>
                <div className="glass p-3 rounded-lg text-center bg-yellow-900/20 border border-yellow-500/30">
                  <div className="text-xl font-bold text-yellow-300">{estatisticasDrinks.pendentes}</div>
                  <div className="text-xs text-yellow-200 font-mono">PENDENTES</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="glass p-3 rounded-lg text-center bg-purple-900/20 border border-purple-500/30">
                  <div className="text-xl font-bold text-purple-300">{estatisticasDrinks.anonimos}</div>
                  <div className="text-xs text-purple-200 font-mono">ANÔNIMOS</div>
                </div>
                <div className="glass p-3 rounded-lg text-center bg-green-900/20 border border-green-500/30">
                  <div className="text-xl font-bold text-green-300">R$ {estatisticasDrinks.valorTotal}</div>
                  <div className="text-xs text-green-200 font-mono">VALOR TOTAL</div>
                </div>
              </div>
            </div>

            {/* Últimos Drinks */}
            <div className="glass-dark rounded-xl p-4 border border-blue-500/30">
              <h3 className="font-orbitron font-bold text-blue-300 mb-3 text-center text-xs">
                📊 ÚLTIMOS DRINKS
              </h3>
              
              {drinks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 opacity-30">🍻</div>
                  <p className="text-gray-400 text-xs font-mono">NENHUM DRINK REGISTRADO</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {drinks.slice(0, 15).map((drink) => (
                    <div key={drink.id} className="glass p-3 rounded-lg border border-gray-600/30">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-lg">{drink.drinkEmoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white truncate">
                              {drink.drinkNome} • R$ {drink.preco}
                            </p>
                            <p className="text-xs text-gray-400">
                              {drink.anonimo ? "🎭 Anônimo" : drink.de} → {drink.para}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                            drink.status === "aceito" ? "bg-green-500/30 text-green-300" :
                            drink.status === "recusado" ? "bg-red-500/30 text-red-300" :
                            "bg-yellow-500/30 text-yellow-300"
                          }`}>
                            {drink.status === "aceito" ? "✅" :
                             drink.status === "recusado" ? "❌" : "⏳"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Mesa {drink.mesaDe} → Mesa {drink.mesaPara}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Outras seções mantidas iguais... */}
        {tela === "radar" && (
          <div className="space-y-4">
            {/* Análise de Atividade por Mesa */}
            <div className="glass-dark rounded-xl p-4 border border-purple-500/30">
              <h2 className="font-orbitron font-bold text-purple-300 mb-4 text-center text-sm">
                🔥 ANÁLISE DE ATIVIDADE POR MESA
              </h2>
              
              {mesasAtivas.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 opacity-30">📊</div>
                  <p className="text-gray-400 text-xs font-mono">NENHUMA ATIVIDADE REGISTRADA</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mesasAtivas.map((mesa, idx) => (
                    <div key={mesa.mesa} className="glass p-4 rounded-lg border border-gray-600/30">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-orbitron font-bold text-white text-sm">MESA {mesa.mesa}</span>
                          {idx < 3 && (
                            <span className="text-lg">
                              {idx === 0 && "🥇"} {idx === 1 && "🥈"} {idx === 2 && "🥉"}
                            </span>
                          )}
                        </div>
                        <span className="text-yellow-400 font-bold text-xs font-mono">{mesa.atividade} PONTOS</span>
                      </div>
                      
                      {/* Barra de progresso */}
                      <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                        <div 
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            idx === 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 
                            idx === 1 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 
                            idx === 2 ? 'bg-gradient-to-r from-yellow-500 to-green-500' : 
                            'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${(mesa.atividade / maxAtividade) * 100}%` }}
                        ></div>
                      </div>
                      
                      {/* Indicador de calor */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400 font-mono">NÍVEL:</span>
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

            {/* Ranking de Usuários Mais Ativos */}
            <div className="glass-dark rounded-xl p-4 border border-cyan-500/30">
              <h2 className="font-orbitron font-bold text-cyan-300 mb-4 text-center text-sm">
                👑 RANKING DE USUÁRIOS ATIVOS
              </h2>
              
              {perfisAtivos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 opacity-30">👤</div>
                  <p className="text-gray-400 text-xs font-mono">NENHUMA ATIVIDADE REGISTRADA</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {perfisAtivos.slice(0, 5).map((perfil, idx) => (
                    <div key={perfil.nome} className="glass p-3 rounded-lg border-l-4 border-cyan-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {idx < 3 && (
                            <span className="text-lg">
                              {idx === 0 && "👑"} {idx === 1 && "🥈"} {idx === 2 && "🥉"}
                            </span>
                          )}
                          <span className="font-orbitron font-semibold text-white text-sm">{perfil.nome}</span>
                        </div>
                        <div className="glass-blue px-2 py-1 rounded-full text-xs font-mono">
                          {perfil.atividade} PTS
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-300 space-y-1">
                        <p><span className="text-gray-400">MESA:</span> {perfil.mesa}</p>
                        <p><span className="text-gray-400">STATUS:</span> {perfil.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Insights do Ambiente */}
            <div className="glass-dark rounded-xl p-4 border border-green-500/30">
              <h2 className="font-orbitron font-bold text-green-300 mb-4 text-center text-sm">
                🎯 INSIGHTS DO AMBIENTE
              </h2>
              
              <div className="space-y-2 text-xs text-gray-300 font-mono">
                {mesasAtivas.length > 0 && (
                  <p className="glass p-2 rounded">🔥 Mesa {mesasAtivas[0].mesa} está dominando as comunicações!</p>
                )}
                {perfisAtivos.length > 0 && (
                  <p className="glass p-2 rounded">👑 {perfisAtivos[0].nome} é o usuário mais ativo do ambiente</p>
                )}
                {usuariosSolteiros > usuariosComprometidos && (
                  <p className="glass p-2 rounded">💚 Ambiente com predominância de solteiros - clima propício para conexões!</p>
                )}
                {totalCurtidas > totalMensagens * 0.3 && (
                  <p className="glass p-2 rounded">💖 Alto índice de interações românticas detectado!</p>
                )}
                {totalVotos > usuarios.length * 0.5 && (
                  <p className="glass p-2 rounded">🎵 Boa participação na votação musical!</p>
                )}
                {totalDrinks > usuarios.length * 0.3 && (
                  <p className="glass p-2 rounded">🍻 Sistema de drinks está sendo bem utilizado!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tela === "votacao" && (
          <div className="space-y-4">
            {/* Estatísticas de Votação */}
            <div className="glass-dark rounded-xl p-4 border border-green-500/30">
              <h2 className="font-orbitron font-bold text-green-300 mb-4 text-center text-sm">
                🎵 ANÁLISE DE VOTAÇÃO MUSICAL
              </h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="glass-blue p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-300">{totalVotos}</div>
                  <div className="text-xs text-blue-200 font-mono">VOTOS TOTAIS</div>
                </div>
                <div className="glass p-3 rounded-lg text-center bg-purple-900/20 border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-300">{musicasPopulares.length}</div>
                  <div className="text-xs text-purple-200 font-mono">MÚSICAS VOTADAS</div>
                </div>
              </div>

              {/* Ranking de Músicas */}
              {musicasPopulares.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 opacity-30">🎵</div>
                  <p className="text-gray-400 text-xs font-mono">NENHUM VOTO REGISTRADO</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-orbitron font-bold text-yellow-300 text-xs text-center">🏆 TOP MÚSICAS</h3>
                  {musicasPopulares.map((musica, idx) => (
                    <div key={musica.musica} className="glass p-3 rounded-lg border border-gray-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {idx === 0 && "🥇"} {idx === 1 && "🥈"} {idx === 2 && "🥉"}
                            {idx > 2 && `${idx + 1}º`}
                          </span>
                          <span className="font-orbitron font-bold text-white text-sm">{musica.musica}</span>
                        </div>
                        <div className="glass px-2 py-1 rounded-full text-xs font-mono">
                          {musica.votos} votos
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            idx === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                            idx === 2 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                            'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ 
                            width: `${(musica.votos / Math.max(...musicasPopulares.map(m => m.votos))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Últimos Votos */}
            {votos.length > 0 && (
              <div className="glass-dark rounded-xl p-4 border border-blue-500/30">
                <h3 className="font-orbitron font-bold text-blue-300 mb-3 text-center text-xs">
                  📊 ÚLTIMOS VOTOS
                </h3>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {votos.slice(0, 10).map((voto, idx) => (
                    <div key={voto.id} className="glass p-2 rounded-lg border border-gray-600/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{voto.userName}</span>
                        <span className="text-gray-400 font-mono">Mesa {voto.userTable}</span>
                      </div>
                      <div className="text-xs text-gray-300 mt-1">
                        <p>🎵 {voto.musicaNome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tela === "sorteio" && (
          <div className="space-y-4">
            {/* Controle de Sorteio */}
            <div className="glass-dark rounded-xl p-4 border border-yellow-500/30">
              <h2 className="font-orbitron font-bold text-yellow-300 mb-4 text-center text-sm">
                🎁 GERENCIAMENTO DE SORTEIOS
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
                    🎲 EXECUTAR SORTEIO
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
            <div className="glass-dark rounded-xl p-4 border border-cyan-500/30">
              <h3 className="font-orbitron font-bold text-cyan-300 mb-3 text-sm">
                👥 PARTICIPANTES REGISTRADOS
              </h3>
              {sorteioData.participantes.length === 0 ? (
                <p className="text-gray-400 text-xs font-mono text-center py-4">NENHUM PARTICIPANTE</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
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
          <div className="glass-dark rounded-xl p-4 border border-cyan-500/30">
            <h2 className="font-orbitron font-bold text-cyan-300 mb-4 text-center text-sm">
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