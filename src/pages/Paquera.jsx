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
        return "border-green-500 bg-green-900/20";
      case "Comprometido":
        return "border-yellow-500 bg-yellow-900/20";
      case "Casado":
        return "border-red-500 bg-red-900/20";
      default:
        return "border-gray-500 bg-gray-900/20";
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-gray-800 p-4 rounded shadow space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">💘 Modo Paquera</h2>
        <p className="text-gray-300 text-sm mt-1">
          Curta perfis anonimamente e descubra se deu match!
        </p>
      </div>

      {/* Matches */}
      {matches.length > 0 && (
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-4 rounded-lg text-center animate-pulse">
          <h3 className="text-xl font-bold mb-2">🔥 Deu Match!</h3>
          <div className="space-y-1">
            {matches.map((nome, idx) => (
              <p key={idx} className="text-lg">💑 Você combinou com <strong>{nome}</strong>!</p>
            ))}
          </div>
        </div>
      )}

      {/* Lista de usuários */}
      <div className="space-y-3">
        {usuarios.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-2">Nenhum outro usuário online.</p>
            <p className="text-gray-500 text-sm">Aguarde outros usuários entrarem no chat!</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-gray-300 text-sm">
                {usuarios.length} {usuarios.length === 1 ? 'pessoa disponível' : 'pessoas disponíveis'} para paquera
              </p>
            </div>
            
            {usuarios.map((u, idx) => {
              const jaCurtiu = curtidasFeitas.includes(u.name);
              const recebeuCurtida = curtidasRecebidas.includes(u.name);
              const isMatch = matches.includes(u.name);
              
              return (
                <div
                  key={`${u.name}-${u.table}`}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    isMatch 
                      ? "border-pink-500 bg-pink-900/30 shadow-lg" 
                      : getStatusColor(u.status)
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-lg">{u.name}</span>
                        <span className="text-sm bg-gray-700 px-2 py-1 rounded">
                          Mesa {u.table}
                        </span>
                        {isMatch && (
                          <span className="text-xs bg-pink-600 px-2 py-1 rounded animate-pulse">
                            MATCH!
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <span>{getStatusIcon(u.status)}</span>
                        <span className="text-gray-300">{u.status || "Status não informado"}</span>
                      </div>

                      {recebeuCurtida && !isMatch && (
                        <div className="text-sm text-pink-400 mb-2">
                          💖 Esta pessoa te curtiu!
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleCurtir(u.name)}
                        disabled={jaCurtiu}
                        className={`px-4 py-2 rounded-full transition-all duration-300 ${
                          jaCurtiu
                            ? "bg-gray-500 cursor-not-allowed text-gray-300"
                            : isMatch
                            ? "bg-pink-600 hover:bg-pink-700 text-white animate-pulse"
                            : recebeuCurtida
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-pink-600 hover:bg-pink-700 text-white"
                        }`}
                      >
                        {jaCurtiu ? "💖 Curtido" : recebeuCurtida ? "💜 Curtir de volta" : "💖 Curtir"}
                      </button>
                      
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-700 rounded text-center">
        <p className="text-xs text-gray-400">
          💡 Dica: As curtidas são anônimas até dar match!
        </p>
      </div>
    </div>
  );
}