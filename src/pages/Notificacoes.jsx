import { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  orderBy,
  limit
} from "firebase/firestore";
import confetti from "canvas-confetti";

export default function Notificacoes({ user }) {
  const [match, setMatch] = useState(null);
  const [curtida, setCurtida] = useState(false);
  const [mensagensPrivadas, setMensagensPrivadas] = useState([]);
  const [showMensagensBox, setShowMensagensBox] = useState(false);
  const [drinkRecebido, setDrinkRecebido] = useState(null);
  const curtidasRecebidasRef = useRef(new Set());
  const mensagensRecebidasRef = useRef(new Set());
  const drinksRecebidosRef = useRef(new Set());

  useEffect(() => {
    if (!user?.name) return;

    // Observar curtidas recebidas
    const qCurtidas = query(collection(db, "curtidas"), where("para", "==", user.name));
    const unsubCurtidas = onSnapshot(qCurtidas, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const { de } = change.doc.data();
          if (!curtidasRecebidasRef.current.has(de)) {
            curtidasRecebidasRef.current.add(de);
            tocarSom();
            dispararConfete();
            setCurtida(true);
            setTimeout(() => setCurtida(false), 5000); // some após 5s

            // Verifica match
            const q2 = query(
              collection(db, "curtidas"),
              where("de", "==", user.name),
              where("para", "==", de)
            );
            const resultado = await getDocs(q2);
            if (!resultado.empty) {
              setMatch(de);
              setTimeout(() => setMatch(null), 8000); // some após 8s
            }
          }
        }
      });
    });

    // Observar mensagens privadas recebidas
    const qMensagens = query(
      collection(db, "mensagens_privadas"), 
      where("para", "==", user.name)
    );
    const unsubMensagens = onSnapshot(qMensagens, (snapshot) => {
      const todasMensagens = [];
      
      // Processar todas as mensagens e ordenar no cliente
      snapshot.docs.forEach((doc) => {
        const { de, texto, timestamp } = doc.data();
        const msgId = doc.id;
        
        todasMensagens.push({
          id: msgId,
          de,
          texto: texto.substring(0, 50) + (texto.length > 50 ? "..." : ""),
          timestamp: timestamp?.toDate?.() || new Date(),
          isNew: !mensagensRecebidasRef.current.has(msgId)
        });
      });
      
      // Ordenar por timestamp (mais recentes primeiro) e limitar a 10
      const mensagensOrdenadas = todasMensagens
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
      
      // Verificar se há mensagens novas
      const novasMensagens = mensagensOrdenadas.filter(msg => msg.isNew);
      
      if (novasMensagens.length > 0) {
        // Marcar mensagens como recebidas e tocar som
        novasMensagens.forEach(msg => {
          mensagensRecebidasRef.current.add(msg.id);
        });
        tocarSom();
        setShowMensagensBox(true);
      }
      
      // Atualizar estado com todas as mensagens
      setMensagensPrivadas(mensagensOrdenadas.map(msg => ({
        ...msg,
        isNew: novasMensagens.some(nova => nova.id === msg.id)
      })));
    });
    
    // Observar apenas novas mensagens para notificações em tempo real
    const qNovasMensagens = query(
      collection(db, "mensagens_privadas"), 
      where("para", "==", user.name)
    );
    const unsubNovasMensagens = onSnapshot(qNovasMensagens, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const msgId = change.doc.id;
          if (!mensagensRecebidasRef.current.has(msgId)) {
            // Apenas tocar som para mensagens realmente novas
            // A atualização da lista será feita pelo listener principal
          }
        }
      });
    });

    // Observar drinks recebidos
    const qDrinks = query(
      collection(db, "drinks"), 
      where("para", "==", user.name),
      where("status", "==", "pendente")
    );
    const unsubDrinks = onSnapshot(qDrinks, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const drinkData = change.doc.data();
          const drinkId = change.doc.id;
          
          if (!drinksRecebidosRef.current.has(drinkId)) {
            drinksRecebidosRef.current.add(drinkId);
            tocarSom();
            dispararConfeteDrink();
            setDrinkRecebido({
              de: drinkData.anonimo ? "🎭 Admirador Secreto" : drinkData.de,
              drinkNome: drinkData.drinkNome,
              drinkEmoji: drinkData.drinkEmoji,
              preco: drinkData.preco,
              anonimo: drinkData.anonimo
            });
            setTimeout(() => setDrinkRecebido(null), 7000); // some após 7s
          }
        }
      });
    });

    return () => {
      unsubCurtidas();
      unsubMensagens();
      unsubNovasMensagens();
      unsubDrinks();
    };
  }, [user]);

  const tocarSom = () => {
    const audio = new Audio("/sounds/curtida.mp3");
    audio.play().catch(() => {});
  };

  const dispararConfete = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff69b4', '#ff1493', '#da70d6', '#ba55d3']
    });
  };

  const dispararConfeteDrink = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#ffd700', '#ffa500', '#ff6347', '#32cd32', '#1e90ff']
    });
  };

  const fecharMensagensBox = () => {
    setShowMensagensBox(false);
  };

  const marcarMensagemComoLida = (msgId) => {
    setMensagensPrivadas(prev => 
      prev.map(msg => 
        msg.id === msgId ? { ...msg, isNew: false } : msg
      )
    );
  };

  return (
    <>
      {/* Notificação de curtida */}
      {curtida && (
        <div className="fixed bottom-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce border border-purple-400/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">💖</span>
            <span className="text-sm font-mono">Você recebeu uma curtida!</span>
          </div>
        </div>
      )}

      {/* Notificação de match */}
      {match && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="glass rounded-2xl p-6 border-2 border-pink-400/50 bg-gradient-to-r from-pink-900/80 to-purple-900/80 text-center animate-pulse">
            <div className="text-6xl mb-4">💘</div>
            <h3 className="font-orbitron text-2xl font-bold text-neon-pink mb-2">
              MATCH!
            </h3>
            <p className="text-white font-mono">
              Você e <span className="text-neon-pink font-bold">{match}</span> se curtiram!
            </p>
            <p className="text-xs text-gray-300 mt-2 font-mono">
              Chat privado liberado! 💬
            </p>
          </div>
        </div>
      )}

      {/* Box estática de mensagens privadas */}
      {showMensagensBox && mensagensPrivadas.length > 0 && (
        <div className="fixed top-4 right-4 glass-dark rounded-xl p-4 shadow-lg z-40 border border-pink-400/50 bg-gradient-to-r from-pink-900/80 to-purple-900/80 max-w-sm w-80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="text-xl">💬</div>
              <h3 className="font-orbitron text-sm font-bold text-pink-300">
                MENSAGENS PRIVADAS
              </h3>
            </div>
            <button
              onClick={fecharMensagensBox}
              className="text-gray-400 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {mensagensPrivadas.map((msg) => (
              <div
                key={msg.id}
                className={`glass p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-pink-900/40 ${
                  msg.isNew 
                    ? "border-pink-400/80 bg-pink-900/30 animate-pulse" 
                    : "border-gray-600/30"
                }`}
                onClick={() => marcarMensagemComoLida(msg.id)}
              >
                <div className="flex items-start gap-2">
                  {msg.isNew && (
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse flex-shrink-0 mt-1"></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-pink-300 font-orbitron truncate">
                        {msg.de}
                      </p>
                      {msg.isNew && (
                        <span className="bg-pink-500/30 px-1 py-0.5 rounded text-xs font-bold text-pink-300 border border-pink-400/50">
                          NOVA
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-200 font-mono truncate">
                      {msg.texto}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-600/30">
            <p className="text-xs text-gray-400 text-center font-mono">
              💡 Clique em uma mensagem para marcar como lida
            </p>
          </div>
        </div>
      )}

      {/* Notificação de drink recebido */}
      {drinkRecebido && (
        <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="glass rounded-2xl p-6 border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-900/80 to-orange-900/80 text-center animate-bounce">
            <div className="text-6xl mb-4">{drinkRecebido.drinkEmoji}</div>
            <h3 className="font-orbitron text-xl font-bold text-yellow-300 mb-2">
              DRINK RECEBIDO!
            </h3>
            <p className="text-white font-mono mb-1">
              <span className="text-yellow-300 font-bold">{drinkRecebido.drinkNome}</span>
            </p>
            <p className="text-sm text-gray-300 font-mono mb-2">
              De: {drinkRecebido.de}
            </p>
            <p className="text-lg font-bold text-green-300">
              R$ {drinkRecebido.preco}
            </p>
            <p className="text-xs text-gray-300 mt-2 font-mono">
              {drinkRecebido.anonimo ? "🎭 Admirador secreto!" : "📢 Drink público!"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Vá para a aba Drinks para aceitar/recusar
            </p>
          </div>
        </div>
      )}
    </>
  );
}