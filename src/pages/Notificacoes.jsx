import { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs
} from "firebase/firestore";
import confetti from "canvas-confetti";

export default function Notificacoes({ user }) {
  const [match, setMatch] = useState(null);
  const [curtida, setCurtida] = useState(false);
  const [mensagemPrivada, setMensagemPrivada] = useState(null);
  const curtidasRecebidasRef = useRef(new Set());
  const mensagensRecebidasRef = useRef(new Set());

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
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const { de, texto } = change.doc.data();
          const msgId = change.doc.id;
          
          if (!mensagensRecebidasRef.current.has(msgId)) {
            mensagensRecebidasRef.current.add(msgId);
            tocarSom();
            setMensagemPrivada({ de, texto: texto.substring(0, 50) + (texto.length > 50 ? "..." : "") });
            setTimeout(() => setMensagemPrivada(null), 6000); // some após 6s
          }
        }
      });
    });

    return () => {
      unsubCurtidas();
      unsubMensagens();
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

      {/* Notificação de mensagem privada */}
      {mensagemPrivada && (
        <div className="fixed bottom-4 right-4 glass rounded-lg p-4 shadow-lg z-50 border border-pink-400/50 bg-gradient-to-r from-pink-900/80 to-purple-900/80 max-w-xs">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💬</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-pink-300 font-orbitron mb-1">
                {mensagemPrivada.de}
              </p>
              <p className="text-xs text-gray-200 font-mono truncate">
                {mensagemPrivada.texto}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Nova mensagem privada
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}