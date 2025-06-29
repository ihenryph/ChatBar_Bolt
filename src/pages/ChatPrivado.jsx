import { useEffect, useRef, useState } from "react";
import { db } from "../lib/firebase";
import { Send, ArrowLeft, Heart } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  doc,
  setDoc,
} from "firebase/firestore";

export default function ChatPrivado({ user, match, onVoltar }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Criar ID único para o chat (sempre na mesma ordem)
  const chatId = [user.name, match].sort().join("_");

  useEffect(() => {
    // Criar/atualizar documento do chat privado
    const criarChatPrivado = async () => {
      try {
        await setDoc(doc(db, "chats_privados", chatId), {
          participantes: [user.name, match],
          criadoEm: serverTimestamp(),
          ultimaAtividade: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.error("Erro ao criar chat privado:", error);
      }
    };

    criarChatPrivado();

    // Observar mensagens do chat privado
    const q = query(
      collection(db, "mensagens_privadas"),
      where("chatId", "==", chatId),
      orderBy("timestamp")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Tocar som para mensagens novas (que não são minhas)
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.de !== user.name && messages.length > 0) {
        const audio = new Audio("/sounds/curtida.mp3");
        audio.play().catch(() => {});
      }

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId, user.name, match]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "mensagens_privadas"), {
        chatId: chatId,
        texto: newMessage,
        de: user.name,
        para: match,
        timestamp: serverTimestamp(),
      });

      // Atualizar última atividade do chat
      await setDoc(doc(db, "chats_privados", chatId), {
        ultimaAtividade: serverTimestamp(),
      }, { merge: true });

      setNewMessage("");

      const textarea = document.querySelector("textarea");
      if (textarea) {
        textarea.style.height = "auto";
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header do Chat Privado */}
      <div className="glass rounded-xl p-4 border-2 border-pink-400/50 bg-gradient-to-r from-pink-900/30 to-purple-900/30">
        <div className="flex items-center gap-3">
          <button
            onClick={onVoltar}
            className="glass p-2 rounded-lg hover-glow transition-all duration-200"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="text-pink-400 animate-pulse" size={16} />
              <h2 className="font-orbitron text-lg font-bold text-neon-pink">
                CHAT PRIVADO
              </h2>
              <Heart className="text-pink-400 animate-pulse" size={16} />
            </div>
            <p className="text-xs text-gray-300 font-mono">
              Conversa com <span className="text-neon-pink">{match}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-pink-300 font-mono">MATCH</span>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="glass-dark rounded-xl p-3 flex-1 overflow-y-auto space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4 opacity-30">💕</div>
            <h3 className="font-orbitron text-lg text-pink-400 mb-2">
              INÍCIO DA CONVERSA
            </h3>
            <p className="text-gray-400 text-sm font-mono">
              Vocês deram match! Que tal começar uma conversa?
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.de === user.name;
            
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                {!isMine && (
                  <div className="glass w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-pink-300 border border-pink-500/30 flex-shrink-0">
                    💕
                  </div>
                )}
                
                {/* Balão da mensagem privada */}
                <div
                  className={`relative max-w-[75%] p-3 rounded-xl transition-all duration-200 ${
                    isMine
                      ? "bg-gradient-to-r from-pink-600/80 to-purple-600/80 text-white rounded-br-sm border border-pink-400/30"
                      : "glass text-gray-100 rounded-bl-sm border border-purple-400/30"
                  }`}
                >
                  {!isMine && (
                    <div className="text-xs font-semibold text-pink-300 mb-1 font-orbitron">
                      {msg.de}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {msg.texto}
                  </p>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-300 mt-1 font-mono opacity-70">
                    {msg.timestamp?.toDate?.().toLocaleTimeString() || "..."}
                  </div>

                  {/* Indicador de própria mensagem */}
                  {isMine && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-pink-400 rounded-full border border-gray-900"></div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem privada */}
      <form onSubmit={handleSend} className="glass rounded-xl p-3 border border-pink-500/30">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Digite sua mensagem privada..."
              className="input-futuristic w-full px-3 py-2 rounded-lg resize-none overflow-hidden leading-relaxed max-h-24 focus:outline-none text-sm border border-pink-400/30"
              rows={1}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
          </div>
          
          <button 
            type="submit"
            className="btn-futuristic bg-gradient-to-r from-pink-600 to-purple-600 p-3 rounded-lg disabled:opacity-50 flex-shrink-0"
            disabled={!newMessage.trim() || loading}
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          <span className="font-mono">SHIFT + ENTER para quebra</span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-pink-400 rounded-full animate-pulse"></div>
            <span>CHAT PRIVADO ATIVO</span>
          </div>
        </div>
      </form>
    </div>
  );
}