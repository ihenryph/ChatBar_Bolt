import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";

export default function Drinks({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [drinksEnviados, setDrinksEnviados] = useState([]);
  const [drinksRecebidos, setDrinksRecebidos] = useState([]);
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saldoVirtual, setSaldoVirtual] = useState(50); // Saldo inicial fictício

  const tiposDrinks = [
    { id: 1, nome: "Cerveja", preco: 8, emoji: "🍺", cor: "yellow" },
    { id: 2, nome: "Caipirinha", preco: 12, emoji: "🍹", cor: "green" },
    { id: 3, nome: "Whisky", preco: 25, emoji: "🥃", cor: "orange" },
    { id: 4, nome: "Vinho", preco: 18, emoji: "🍷", cor: "red" },
    { id: 5, nome: "Champagne", preco: 35, emoji: "🍾", cor: "purple" },
    { id: 6, nome: "Shot", preco: 6, emoji: "🥂", cor: "pink" }
  ];

  useEffect(() => {
    // Buscar usuários online (exceto o próprio)
    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const outros = snapshot.docs
        .map((doc) => doc.data())
        .filter((u) => u.name !== user.name && u.online)
        .sort((a, b) => {
          if (a.status === "Solteiro" && b.status !== "Solteiro") return -1;
          if (b.status === "Solteiro" && a.status !== "Solteiro") return 1;
          return 0;
        });
      setUsuarios(outros);
    });

    // Observar drinks enviados por mim (removido orderBy para evitar erro de índice)
    const unsubEnviados = onSnapshot(
      query(
        collection(db, "drinks"),
        where("de", "==", user.name)
      ),
      (snapshot) => {
        const enviados = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          // Ordenar no cliente por timestamp (mais recente primeiro)
          .sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return b.timestamp.toMillis() - a.timestamp.toMillis();
          });
        setDrinksEnviados(enviados);
      }
    );

    // Observar drinks recebidos por mim (removido orderBy para evitar erro de índice)
    const unsubRecebidos = onSnapshot(
      query(
        collection(db, "drinks"),
        where("para", "==", user.name)
      ),
      (snapshot) => {
        const recebidos = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          // Ordenar no cliente por timestamp (mais recente primeiro)
          .sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return b.timestamp.toMillis() - a.timestamp.toMillis();
          });
        setDrinksRecebidos(recebidos);
      }
    );

    return () => {
      unsubUsuarios();
      unsubEnviados();
      unsubRecebidos();
    };
  }, [user.name]);

  const handleEnviarDrink = async (drink, anonimo = false) => {
    if (!selectedUser || loading || saldoVirtual < drink.preco) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "drinks"), {
        de: user.name,
        para: selectedUser.name,
        mesaDe: user.table,
        mesaPara: selectedUser.table,
        drinkId: drink.id,
        drinkNome: drink.nome,
        drinkEmoji: drink.emoji,
        preco: drink.preco,
        anonimo: anonimo,
        status: "pendente", // pendente, aceito, recusado
        timestamp: serverTimestamp(),
      });

      // Atualizar saldo virtual (simulação)
      setSaldoVirtual(prev => prev - drink.preco);

      // Fechar modal
      setShowDrinkModal(false);
      setSelectedUser(null);

      console.log(`🍻 Drink enviado: ${drink.nome} para ${selectedUser.name}`);
    } catch (error) {
      console.error("Erro ao enviar drink:", error);
      alert("Erro ao enviar drink. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleAceitarDrink = async (drinkId) => {
    try {
      await updateDoc(doc(db, "drinks", drinkId), {
        status: "aceito",
        aceitoEm: serverTimestamp()
      });
      console.log("✅ Drink aceito!");
    } catch (error) {
      console.error("Erro ao aceitar drink:", error);
    }
  };

  const handleRecusarDrink = async (drinkId) => {
    try {
      await updateDoc(doc(db, "drinks", drinkId), {
        status: "recusado",
        recusadoEm: serverTimestamp()
      });
      console.log("❌ Drink recusado");
    } catch (error) {
      console.error("Erro ao recusar drink:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Solteiro": return "border-green-400/50 bg-green-900/20";
      case "Comprometido": return "border-yellow-400/50 bg-yellow-900/20";
      case "Casado": return "border-red-400/50 bg-red-900/20";
      default: return "border-gray-400/50 bg-gray-900/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Solteiro": return "💚";
      case "Comprometido": return "💛";
      case "Casado": return "❤️";
      default: return "🤍";
    }
  };

  const getDrinkColor = (cor) => {
    const cores = {
      yellow: "border-yellow-400/50 bg-yellow-900/20",
      green: "border-green-400/50 bg-green-900/20",
      orange: "border-orange-400/50 bg-orange-900/20",
      red: "border-red-400/50 bg-red-900/20",
      purple: "border-purple-400/50 bg-purple-900/20",
      pink: "border-pink-400/50 bg-pink-900/20"
    };
    return cores[cor] || "border-gray-400/50 bg-gray-900/20";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-dark rounded-xl p-4 text-center">
        <h2 className="font-orbitron text-xl font-bold text-neon mb-2">
          SISTEMA DE DRINKS
        </h2>
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 font-mono">
              SALDO: R$ {saldoVirtual}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full pulse-glow"></div>
            <span className="text-purple-300 font-mono">
              {drinksRecebidos.filter(d => d.status === "pendente").length} PENDENTES
            </span>
          </div>
        </div>
      </div>

      {/* Drinks Recebidos Pendentes */}
      {drinksRecebidos.filter(d => d.status === "pendente").length > 0 && (
        <div className="glass rounded-xl p-4 border-2 border-purple-400/50 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
          <h3 className="font-orbitron text-lg font-bold text-purple-300 mb-3 text-center">
            🍻 DRINKS RECEBIDOS!
          </h3>
          
          <div className="space-y-3">
            {drinksRecebidos
              .filter(d => d.status === "pendente")
              .map((drink) => (
                <div key={drink.id} className="glass-blue p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{drink.drinkEmoji}</span>
                      <div>
                        <p className="font-semibold text-white text-sm">
                          {drink.drinkNome}
                        </p>
                        <p className="text-xs text-gray-300">
                          {drink.anonimo ? "🎭 Admirador Secreto" : `De: ${drink.de} (Mesa ${drink.mesaDe})`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-300">R$ {drink.preco}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAceitarDrink(drink.id)}
                      className="btn-futuristic bg-gradient-to-r from-green-600 to-emerald-600 flex-1 py-2 rounded-lg text-xs"
                    >
                      ✅ ACEITAR
                    </button>
                    <button
                      onClick={() => handleRecusarDrink(drink.id)}
                      className="btn-futuristic bg-gradient-to-r from-red-600 to-pink-600 flex-1 py-2 rounded-lg text-xs"
                    >
                      ❌ RECUSAR
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="glass-dark rounded-xl p-4">
        <h3 className="font-orbitron text-lg font-bold text-cyan-300 mb-4 text-center">
          🎯 ENVIAR DRINK PARA
        </h3>
        
        {usuarios.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4 opacity-30">🍻</div>
            <p className="text-gray-400 text-sm font-mono">NENHUM USUÁRIO ONLINE</p>
          </div>
        ) : (
          <div className="space-y-3">
            {usuarios.map((u, idx) => (
              <div
                key={`${u.name}-${u.table}`}
                className={`glass-dark rounded-xl p-4 border-2 transition-all duration-300 ${getStatusColor(u.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-orbitron font-bold text-white text-sm truncate">
                        {u.name}
                      </span>
                      <div className="glass px-2 py-1 rounded-full text-xs font-mono flex-shrink-0">
                        Mesa {u.table}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span className="text-lg">{getStatusIcon(u.status)}</span>
                      <span className="text-gray-300 font-mono">{u.status}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setShowDrinkModal(true);
                    }}
                    className="btn-futuristic bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg text-xs"
                  >
                    🍻 ENVIAR DRINK
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Seleção de Drink */}
      {showDrinkModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass-dark rounded-2xl p-6 w-full max-w-sm border border-purple-500/30">
            <div className="text-center mb-4">
              <h3 className="font-orbitron text-lg font-bold text-purple-300 mb-2">
                🍻 ESCOLHER DRINK
              </h3>
              <p className="text-gray-300 text-sm">
                Para: <span className="text-neon-pink">{selectedUser.name}</span> (Mesa {selectedUser.table})
              </p>
            </div>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {tiposDrinks.map((drink) => (
                <div
                  key={drink.id}
                  className={`glass p-3 rounded-lg border ${getDrinkColor(drink.cor)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{drink.emoji}</span>
                      <span className="font-semibold text-white text-sm">{drink.nome}</span>
                    </div>
                    <span className="text-lg font-bold text-green-300">R$ {drink.preco}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEnviarDrink(drink, false)}
                      disabled={loading || saldoVirtual < drink.preco}
                      className="btn-futuristic flex-1 py-2 rounded-lg text-xs disabled:opacity-50"
                    >
                      📢 PÚBLICO
                    </button>
                    <button
                      onClick={() => handleEnviarDrink(drink, true)}
                      disabled={loading || saldoVirtual < drink.preco}
                      className="btn-futuristic bg-gradient-to-r from-gray-600 to-gray-700 flex-1 py-2 rounded-lg text-xs disabled:opacity-50"
                    >
                      🎭 ANÔNIMO
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDrinkModal(false);
                  setSelectedUser(null);
                }}
                className="glass flex-1 py-3 rounded-lg text-sm border border-gray-600/30"
              >
                ❌ CANCELAR
              </button>
            </div>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-400 font-mono">
                💰 SEU SALDO: R$ {saldoVirtual}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Drinks */}
      <div className="space-y-4">
        {/* Drinks Enviados */}
        {drinksEnviados.length > 0 && (
          <div className="glass-dark rounded-xl p-4">
            <h3 className="font-orbitron font-bold text-blue-300 mb-3 text-sm">
              📤 DRINKS ENVIADOS
            </h3>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {drinksEnviados.slice(0, 5).map((drink) => (
                <div key={drink.id} className="glass p-3 rounded-lg border border-gray-600/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg">{drink.drinkEmoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">
                          {drink.drinkNome} → {drink.para}
                        </p>
                        <p className="text-xs text-gray-400">
                          {drink.anonimo ? "🎭 Anônimo" : "📢 Público"} • R$ {drink.preco}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                        drink.status === "aceito" ? "bg-green-500/30 text-green-300" :
                        drink.status === "recusado" ? "bg-red-500/30 text-red-300" :
                        "bg-yellow-500/30 text-yellow-300"
                      }`}>
                        {drink.status === "aceito" ? "✅ ACEITO" :
                         drink.status === "recusado" ? "❌ RECUSADO" :
                         "⏳ PENDENTE"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drinks Recebidos (Histórico) */}
        {drinksRecebidos.filter(d => d.status !== "pendente").length > 0 && (
          <div className="glass-dark rounded-xl p-4">
            <h3 className="font-orbitron font-bold text-green-300 mb-3 text-sm">
              📥 HISTÓRICO RECEBIDOS
            </h3>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {drinksRecebidos
                .filter(d => d.status !== "pendente")
                .slice(0, 5)
                .map((drink) => (
                  <div key={drink.id} className="glass p-3 rounded-lg border border-gray-600/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-lg">{drink.drinkEmoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">
                            {drink.drinkNome} de {drink.anonimo ? "🎭 Anônimo" : drink.de}
                          </p>
                          <p className="text-xs text-gray-400">
                            R$ {drink.preco}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                          drink.status === "aceito" ? "bg-green-500/30 text-green-300" :
                          "bg-red-500/30 text-red-300"
                        }`}>
                          {drink.status === "aceito" ? "✅ ACEITO" : "❌ RECUSADO"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer informativo */}
      <div className="glass-dark rounded-xl p-3 text-center">
        <p className="text-xs text-gray-400 font-mono">
          💡 SISTEMA VIRTUAL • DRINKS PODEM SER ACEITOS OU RECUSADOS
        </p>
      </div>
    </div>
  );
}