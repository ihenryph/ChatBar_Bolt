import { useState, useEffect } from "react";
import ChatRoom from "./pages/ChatRoom";
import Votacao from "./pages/Votacao";
import Entry from "./pages/Entry";
import RadarSocial from "./pages/RadarSocial";
import Sorteio from "./pages/Sorteio";
import Profile from "./pages/Profile";
import Paquera from "./pages/Paquera";
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
    <div className="bg-gray-900 min-h-screen text-white p-4">
      <div className="flex justify-center items-center mb-4">
        <div className="space-x-2">
          <button
            className="bg-blue-600 px-3 py-1 rounded"
            onClick={() => setTelaAtual("chat")}
          >
            Bate-Papo
          </button>
          <button
            className="bg-yellow-600 px-3 py-1 rounded"
            onClick={() => setTelaAtual("radar")}
          >
            Radar Social
          </button>
          <button
            className="bg-green-600 px-3 py-1 rounded"
            onClick={() => setTelaAtual("votacao")}
          >
            Votação
          </button>
          <button
            className="bg-purple-600 px-3 py-1 rounded"
            onClick={() => setTelaAtual("perfil")}
          >
            Meu Perfil
          </button>
          <button
            className="bg-pink-600 px-3 py-1 rounded"
            onClick={() => setTelaAtual("sorteio")}
          >
            Sorteio
          </button>
          <button
            className="bg-pink-400 px-3 py-1 rounded"
            onClick={() => setTelaAtual("paquera")}
          >
            Paquera
          </button>
          <button
            className="bg-red-600 px-3 py-1 rounded"
            onClick={handleLogout}
          >
            SAIR
          </button>
        </div>
      </div>

      {/* Exibe a tela selecionada */}
      {telaAtual === "chat" && <ChatRoom user={user} />}
      {telaAtual === "votacao" && <Votacao user={user} />}
      {telaAtual === "radar" && <RadarSocial user={user} />}
      {telaAtual === "sorteio" && <Sorteio user={user} />}
      {telaAtual === "perfil" && (<Profile user={user} onBack={() => setTelaAtual("chat")}/>)}
      {telaAtual === "paquera" && <Paquera user={user} />}
      <Notificacoes user={user} />
    </div>
  );
}

export default App;