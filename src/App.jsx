import { useState, useEffect } from "react";
import ChatRoom from "./pages/ChatRoom";
import Votacao from "./pages/Votacao";
import Entry from "./pages/Entry";
import RadarSocial from "./pages/RadarSocial";
import Sorteio from "./pages/Sorteio";
import Profile from "./pages/Profile";
import Paquera from "./pages/Paquera";
import Drinks from "./pages/Drinks";
import Notificacoes from "./pages/Notificacoes";
import PainelAdmin from "./pages/PainelAdmin";
import { limparDadosUsuario, verificarDadosRestantes } from "./utils/limparDadosUsuario";
import { manterPresencaAtiva } from "./utils/userPresence";

function App() {
  const [user, setUser] = useState(null);
  const [telaAtual, setTelaAtual] = useState("chat");
  const [presenceInterval, setPresenceInterval] = useState(null);

  // Manter presença ativa quando usuário estiver logado
  useEffect(() => {
    if (user && !user.isAdmin) {
      const interval = manterPresencaAtiva(user);
      setPresenceInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [user]);

  // Função de logout com limpeza completa
  const handleLogout = async () => {
    if (!user) return;

    console.log("🚪 Iniciando processo de logout...");

    // Parar de manter presença ativa
    if (presenceInterval) {
      clearInterval(presenceInterval);
      setPresenceInterval(null);
    }

    // Limpar todos os dados do usuário
    const sucesso = await limparDadosUsuario(user);
    
    if (sucesso) {
      console.log("✅ Dados limpos com sucesso");
      
      // Verificar se ainda restam dados (opcional, para debug)
      const dadosRestantes = await verificarDadosRestantes(user);
      if (dadosRestantes) {
        console.log("🔍 Verificação final:", dadosRestantes);
      }
      
      alert("✅ Logout realizado. Todos os seus dados foram removidos.");
    } else {
      console.error("❌ Erro na limpeza dos dados");
      alert("⚠️ Erro ao limpar dados. Alguns dados podem ter permanecido.");
    }

    // Fazer logout
    setUser(null);
    setTelaAtual("chat");
  };

  if (!user) return <Entry onEnter={setUser} />;
 
  if (user?.isAdmin) {
    return <PainelAdmin />; 
  }

  return (
    <div className="min-h-screen min-h-dvh text-white relative max-w-md mx-auto bg-black/20">
      {/* Header e Menu fixos */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50 bg-black/80 backdrop-blur-md">
        {/* Header futurístico mobile-first */}
        <div className="glass-dark border-b border-cyan-500/30 p-3">
          <div className="text-center mb-3">
            <h1 className="font-orbitron text-xl font-bold text-neon">
              CHATBAR
            </h1>
            <div className="text-xs text-cyan-300 mt-1">
              <span className="text-neon-pink">{user.name}</span> • Mesa {user.table}
            </div>
          </div>

          {/* Navegação mobile em 2 linhas com alinhamento corrigido */}
          <div className="space-y-2">
            {/* Primeira linha - Funcionalidades principais */}
            <div className="grid grid-cols-4 gap-2">
              <button
                className={`px-2 py-2 rounded-full text-sm font-medium transition-all duration-300 hover-glow text-center ${
                  telaAtual === "chat" 
                    ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400/50" 
                    : "text-gray-300 hover:text-cyan-300"
                }`}
                onClick={() => setTelaAtual("chat")}
              >
                💬 Chat
              </button>
              <button
                className={`px-2 py-2 rounded-full text-sm font-medium transition-all duration-300 hover-glow text-center ${
                  telaAtual === "radar" 
                    ? "bg-yellow-500/30 text-yellow-300 border border-yellow-400/50" 
                    : "text-gray-300 hover:text-yellow-300"
                }`}
                onClick={() => setTelaAtual("radar")}
              >
                📡 Radar
              </button>
              <button
                className={`px-2 py-2 rounded-full text-sm font-medium transition-all duration-300 hover-glow text-center ${
                  telaAtual === "votacao" 
                    ? "bg-green-500/30 text-green-300 border border-green-400/50" 
                    : "text-gray-300 hover:text-green-300"
                }`}
                onClick={() => setTelaAtual("votacao")}
              >
                🎵 Música
              </button>
              <button
                className={`px-2 py-2 rounded-full text-sm font-medium transition-all duration-300 hover-glow text-center ${
                  telaAtual === "drinks" 
                    ? "bg-purple-500/30 text-purple-300 border border-purple-400/50" 
                    : "text-gray-300 hover:text-purple-300"
                }`}
                onClick={() => setTelaAtual("drinks")}
              >
                🍻 Drinks
              </button>
            </div>

            {/* Segunda linha - Funcionalidades secundárias */}
            <div className="grid grid-cols-4 gap-2">
              <button
                className={`px-2 py-2 rounded-full text-sm font-medium transition-all duration-300 hover-glow text-center ${
                  telaAtual === "paquera" 
                    ? "bg-rose-500/30 text-rose-300 border border-rose-400/50" 
                    : "text-gray-300 hover:text-rose-300"
                }`}
                onClick={() => setTelaAtual("paquera")}
              >
                💘 Paquera
              </button>
              <button
                className={`px-2 py-2 rounded-full text-sm font-medium transition-all duration-300 hover-glow text-center ${
                  telaAtual === "sorteio" 
                    ? "bg-pink-500/30 text-pink-300 border border-pink-400/50" 
                    : "text-gray-300 hover:text-pink-300"
                }`}
                onClick={() => setTelaAtual("sorteio")}
              >
                🎁 Sorteio
              </button>
              <button
                className={`px-2 py-2 rounded-full text-sm font-medium transition-all duration-300 hover-glow text-center ${
                  telaAtual === "perfil" 
                    ? "bg-blue-500/30 text-blue-300 border border-blue-400/50" 
                    : "text-gray-300 hover:text-blue-300"
                }`}
                onClick={() => setTelaAtual("perfil")}
              >
                👤 Perfil
              </button>
              <button
                className="px-2 py-2 rounded-full text-sm font-medium text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-all duration-300 text-center"
                onClick={handleLogout}
              >
                🚪 Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com padding-top para compensar o header fixo */}
      <div className="pt-[140px] p-3 pb-20 relative z-10 min-h-[calc(100vh-140px)] min-h-[calc(100dvh-140px)]">
        {telaAtual === "chat" && <ChatRoom user={user} />}
        {telaAtual === "votacao" && <Votacao user={user} />}
        {telaAtual === "radar" && <RadarSocial user={user} />}
        {telaAtual === "drinks" && <Drinks user={user} />}
        {telaAtual === "sorteio" && <Sorteio user={user} />}
        {telaAtual === "perfil" && (<Profile user={user} onBack={() => setTelaAtual("chat")}/>)}
        {telaAtual === "paquera" && <Paquera user={user} />}
      </div>

      {/* Notificações */}
      <Notificacoes user={user} />
    </div>
  );
}

export default App;