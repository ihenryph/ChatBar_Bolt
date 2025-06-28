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

export default function Paquera({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [curtidasFeitas, setCurtidasFeitas] = useState([]);
  const [curtidasRecebidas, setCurtidasRecebidas] = useState([]);
  const [matches, setMatches] = useState([]);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-dark rounded-2xl p-6 text-center">
        <h2 className="font-orbitron text-3xl font-bold text-neon-pink mb-3">
          MODO PAQUERA
        </h2>
        <p className="text-gray-300 font-mono">
          Sistema de Conexões Românticas • Protocolo Anônimo Ativo
        </p>
      </div>

      {/* Matches */}
      {matches.length > 0 && (
        <div className="glass rounded-2xl p-6 border-2 border-pink-400/50 bg-gradient-to-r from-pink-900/30 to-purple-900/30 hologram">
          <div className="text-center">
            <h3 className="font-orbitron text-2xl font-bold text-neon-pink mb-4 animate-pulse">
              🔥 CONEXÃO ESTABELECIDA!
            </h3>
            <div className="space-y-2">
              {matches.map((nome, idx) => (
                <div key={idx} className="glass-blue p-4 rounded-xl">
                  <p className="text-lg font-semibold">
                    💑 Match confirmado com <span className="text-neon-pink">{nome}</span>!
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista de usuários */}
      <div className="space-y-4">
        {usuarios.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center">
            <div className="text-8xl mb-6 opacity-30">💘</div>
            <h3 className="font-orbitron text-xl text-gray-400 mb-2">
              RADAR DE PAQUERA VAZIO
            </h3>
            <p className="text-gray-500 font-mono">
              Aguardando outras entidades se conectarem...
            </p>
          </div>
        ) : (
          <>
            <div className="glass-dark rounded-xl p-4 text-center">
              <p className="text-cyan-300 font-mono">
                {usuarios.length} {usuarios.length === 1 ? 'ENTIDADE DETECTADA' : 'ENTIDADES DETECTADAS'} PARA CONEXÃO
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {usuarios.map((u, idx) => {
                const jaCurtiu = curtidasFeitas.includes(u.name);
                const recebeuCurtida = curtidasRecebidas.includes(u.name);
                const isMatch = matches.includes(u.name);
                
                return (
                  <div
                    key={`${u.name}-${u.table}`}
                    className={`glass-dark rounded-2xl p-6 border-2 transition-all duration-500 hover-glow relative overflow-hidden ${
                      isMatch 
                        ? "border-pink-400/50 bg-pink-900/30 hologram" 
                        : getStatusColor(u.status)
                    }`}
                  >
                    {/* Efeito de scan para matches */}
                    {isMatch && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-pulse"></div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-orbitron text-lg font-bold text-white">
                            {u.name}
                          </span>
                          <div className="glass px-3 py-1 rounded-full text-xs font-mono">
                            SETOR {u.table}
                          </div>
                          {isMatch && (
                            <div className="bg-pink-500/30 px-2 py-1 rounded-full text-xs font-bold text-pink-300 border border-pink-400/50 animate-pulse">
                              MATCH!
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm mb-3">
                          <span className="text-2xl">{getStatusIcon(u.status)}</span>
                          <span className="text-gray-300 font-mono">{u.status || "Status não informado"}</span>
                        </div>

                        {recebeuCurtida && !isMatch && (
                          <div className="glass-blue p-2 rounded-lg mb-3">
                            <span className="text-sm text-pink-300 font-mono">
                              💖 ESTA ENTIDADE TE CURTIU!
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-center gap-3">
                        <button
                          onClick={() => handleCurtir(u.name)}
                          disabled={jaCurtiu}
                          className={`px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 relative overflow-hidden ${
                            jaCurtiu
                              ? "bg-gray-600/50 cursor-not-allowed text-gray-400 border border-gray-500/30"
                              : isMatch
                              ? "btn-futuristic bg-gradient-to-r from-pink-600 to-purple-600 animate-pulse"
                              : recebeuCurtida
                              ? "btn-futuristic bg-gradient-to-r from-purple-600 to-pink-600"
                              : "btn-futuristic"
                          }`}
                        >
                          {jaCurtiu ? "💖 ENVIADO" : recebeuCurtida ? "💜 RETRIBUIR" : "💖 CURTIR"}
                        </button>
                        
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-300 font-mono">ONLINE</span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de compatibilidade (simulada) */}
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-xs text-gray-400 font-mono">COMPATIBILIDADE:</span>
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
                      <span className="text-xs text-cyan-300 font-mono">
                        {isMatch ? '100%' : recebeuCurtida ? '85%' : `${Math.floor(Math.random() * 40) + 60}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer informativo */}
      <div className="glass-dark rounded-2xl p-4 text-center">
        <p className="text-xs text-gray-400 font-mono">
          💡 SISTEMA ANÔNIMO • CURTIDAS SÓ SÃO REVELADAS EM CASO DE MATCH
        </p>
      </div>
    </div>
  );
}