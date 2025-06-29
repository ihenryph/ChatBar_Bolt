import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import ChatPrivado from "./ChatPrivado";

export default function Paquera({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [curtidasFeitas, setCurtidasFeitas] = useState([]);
  const [curtidasRecebidas, setCurtidasRecebidas] = useState([]);
  const [matches, setMatches] = useState([]);
  const [chatPrivadoAberto, setChatPrivadoAberto] = useState(null);

  useEffect(() => {
    // Buscar perfis em tempo real (exceto o próprio)
    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const outros = snapshot.docs
        .map((doc) => doc.data())
        .filter((u) => u.name !== user.name && u.online) // Só usuários online
        .sort((a, b) => {
          // Priorizar solteiros
          if (a.status === "Solteiro" && b.status !== "Solteiro") return -1;
          if (b.status === "Solteiro" && a.status !== "Solteiro") return 1;
          return 0;
        });
      setUsuarios(outros);
    });

    // Observar curtidas feitas por mim
    const unsubFeitas = onSnapshot(
      query(collection(db, "curtidas"), where("de", "==", user.name)),
      (snapshot) => {
        const feitas = snapshot.docs.map((doc) => doc.data().para);
        setCurtidasFeitas(feitas);
      }
    );

    // Observar curtidas que recebi
    const unsubRecebidas = onSnapshot(
      query(collection(db, "curtidas"), where("para", "==", user.name)),
      (snapshot) => {
        const recebidas = snapshot.docs.map((doc) => doc.data().de);
        setCurtidasRecebidas(recebidas);
      }
    );

    return () => {
      unsubUsuarios();
      unsubFeitas();
      unsubRecebidas();
    };
  }, [user.name]);

  // Match = pessoa que você curtiu e que também te curtiu
  useEffect(() => {
    const m = curtidasFeitas.filter((pessoa) =>
      curtidasRecebidas.includes(pessoa)
    );
    setMatches(m);
    console.log("🔥 Matches atualizados:", m); // Debug
  }, [curtidasFeitas, curtidasRecebidas]);

  const handleCurtir = async (alvo) => {
    if (curtidasFeitas.includes(alvo)) return;

    try {
      await addDoc(collection(db, "curtidas"), {
        de: user.name,
        para: alvo,
        timestamp: serverTimestamp(),
      });
      console.log(`💖 Curtida enviada para ${alvo}`);
    } catch (error) {
      console.error("Erro ao curtir:", error);
      alert("Erro ao enviar curtida. Tente novamente.");
    }
  };

  const abrirChatPrivado = (nomeMatch) => {
    console.log("💬 Abrindo chat privado com:", nomeMatch); // Debug
    setChatPrivadoAberto(nomeMatch);
  };

  const fecharChatPrivado = () => {
    setChatPrivadoAberto(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Solteiro":
        return "💚";
      case "Comprometido":
        return "💛";
      case "Casado":
        return "❤️";
      default:
        return "🤍";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Solteiro":
        return "border-green-400/50 bg-green-900/20";
      case "Comprometido":
        return "border-yellow-400/50 bg-yellow-900/20";
      case "Casado":
        return "border-red-400/50 bg-red-900/20";
      default:
        return "border-gray-400/50 bg-gray-900/20";
    }
  };

  // Se há chat privado aberto, mostrar apenas o chat
  if (chatPrivadoAberto) {
    return (
      <ChatPrivado 
        user={user} 
        match={chatPrivadoAberto} 
        onVoltar={fecharChatPrivado}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header mobile */}
      <div className="glass-dark rounded-xl p-4 text-center">
        <h2 className="font-orbitron text-xl font-bold text-neon-pink mb-2">
          MODO PAQUERA
        </h2>
        <p className="text-gray-300 text-xs font-mono">
          Sistema de Conexões • Protocolo Anônimo
        </p>
        {/* Debug info */}
        <div className="text-xs text-gray-500 mt-2">
          Curtidas feitas: {curtidasFeitas.length} | Recebidas: {curtidasRecebidas.length} | Matches: {matches.length}
        </div>
      </div>

      {/* Matches */}
      {matches.length > 0 && (
        <div className="glass rounded-xl p-4 border-2 border-pink-400/50 bg-gradient-to-r from-pink-900/30 to-purple-900/30">
          <div className="text-center mb-4">
            <h3 className="font-orbitron text-lg font-bold text-neon-pink mb-3">
              🔥 CONEXÕES ESTABELECIDAS!
            </h3>
          </div>
          
          <div className="space-y-3">
            {matches.map((nome, idx) => (
              <div key={idx} className="glass-blue p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold mb-1">
                      💑 Match com <span className="text-neon-pink">{nome}</span>!
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      Vocês se curtiram mutuamente
                    </p>
                  </div>
                  
                  <button
                    onClick={() => abrirChatPrivado(nome)}
                    className="btn-futuristic bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 rounded-lg font-bold text-xs hover-glow"
                  >
                    💬 CHAT PRIVADO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de usuários mobile */}
      <div className="space-y-3">
        {usuarios.length === 0 ? (
          <div className="glass-dark rounded-xl p-8 text-center">
            <div className="text-6xl mb-4 opacity-30">💘</div>
            <h3 className="font-orbitron text-lg text-gray-400 mb-2">
              RADAR VAZIO
            </h3>
            <p className="text-gray-500 text-sm font-mono">
              Aguardando conexões...
            </p>
          </div>
        ) : (
          <>
            <div className="glass-dark rounded-lg p-3 text-center">
              <p className="text-cyan-300 text-xs font-mono">
                {usuarios.length} {usuarios.length === 1 ? 'ENTIDADE DETECTADA' : 'ENTIDADES DETECTADAS'}
              </p>
            </div>
            
            {usuarios.map((u, idx) => {
              const jaCurtiu = curtidasFeitas.includes(u.name);
              const recebeuCurtida = curtidasRecebidas.includes(u.name);
              const isMatch = matches.includes(u.name);
              
              return (
                <div
                  key={`${u.name}-${u.table}`}
                  className={`glass-dark rounded-xl p-4 border-2 transition-all duration-300 relative overflow-hidden ${
                    isMatch 
                      ? "border-pink-400/50 bg-pink-900/30" 
                      : getStatusColor(u.status)
                  }`}
                >
                  {/* Efeito de scan para matches */}
                  {isMatch && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-pulse"></div>
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-orbitron font-bold text-white text-sm truncate">
                          {u.name}
                        </span>
                        <div className="glass px-2 py-1 rounded-full text-xs font-mono flex-shrink-0">
                          Mesa {u.table}
                        </div>
                        {isMatch && (
                          <div className="bg-pink-500/30 px-2 py-1 rounded-full text-xs font-bold text-pink-300 border border-pink-400/50 flex-shrink-0 animate-pulse">
                            MATCH! 🔥
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="text-lg">{getStatusIcon(u.status)}</span>
                        <span className="text-gray-300 font-mono">{u.status || "Status não informado"}</span>
                      </div>

                      {recebeuCurtida && !isMatch && (
                        <div className="glass-blue p-2 rounded-lg mb-2">
                          <span className="text-xs text-pink-300 font-mono">
                            💖 ESTA ENTIDADE TE CURTIU!
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      {isMatch ? (
                        <button
                          onClick={() => abrirChatPrivado(u.name)}
                          className="btn-futuristic bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 rounded-full font-bold text-xs animate-pulse hover-glow"
                        >
                          💬 CHAT
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCurtir(u.name)}
                          disabled={jaCurtiu}
                          className={`px-4 py-2 rounded-full font-bold text-xs transition-all duration-200 ${
                            jaCurtiu
                              ? "bg-gray-600/50 cursor-not-allowed text-gray-400 border border-gray-500/30"
                              : recebeuCurtida
                              ? "btn-futuristic bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse"
                              : "btn-futuristic"
                          }`}
                        >
                          {jaCurtiu ? "💖 ENVIADO" : recebeuCurtida ? "💜 RETRIBUIR" : "💖 CURTIR"}
                        </button>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-300 font-mono">ONLINE</span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de compatibilidade mobile */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-gray-400 font-mono flex-shrink-0">COMPAT:</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isMatch ? 'bg-gradient-to-r from-pink-500 to-purple-500' :
                          recebeuCurtida ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                          'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}
                        style={{ 
                          width: `${isMatch ? 100 : recebeuCurtida ? 85 : Math.floor(Math.random() * 40) + 60}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-cyan-300 font-mono flex-shrink-0">
                      {isMatch ? '100%' : recebeuCurtida ? '85%' : `${Math.floor(Math.random() * 40) + 60}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer informativo */}
      <div className="glass-dark rounded-xl p-3 text-center">
        <p className="text-xs text-gray-400 font-mono">
          💡 SISTEMA ANÔNIMO • CHAT PRIVADO LIBERADO APÓS MATCH
        </p>
      </div>
    </div>
  );
}