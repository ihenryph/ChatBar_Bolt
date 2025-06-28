import { useEffect, useRef, useState } from "react";
import { db } from "../lib/firebase";
import { Send } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function ChatRoom({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp"));
    let previousLength = 0;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const lastMsg = msgs[msgs.length - 1];
      const isMine =
        lastMsg?.name?.toLowerCase() === user.name.toLowerCase() &&
        lastMsg?.table === user.table;

      if (previousLength && msgs.length > previousLength && !isMine) {
        const audio = new Audio("/notify.mp3");
        audio.play();
      }

      previousLength = msgs.length;
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;
    
    await addDoc(collection(db, "messages"), {
      text: newMessage,
      name: user.name,
      table: user.table,
      timestamp: serverTimestamp(),
    });
    setNewMessage("");

    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header do Chat */}
      <div className="glass-blue rounded-2xl p-4 text-center">
        <h1 className="font-orbitron text-2xl font-bold text-neon mb-2">
          CANAL DE COMUNICAÇÃO
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-300">Mesa {user.table} Conectada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-300">{messages.length} Mensagens</span>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="glass-dark rounded-2xl p-4 max-h-[70vh] overflow-y-auto space-y-3 relative">
        {/* Efeito de scan lines no chat */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent"></div>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-30">💬</div>
            <p className="text-gray-400 font-mono">CANAL AGUARDANDO TRANSMISSÕES...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine =
              msg.name.toLowerCase() === user.name.toLowerCase() &&
              msg.table === user.table;
            
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-3 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                {!isMine && (
                  <div className="glass w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-cyan-300 border border-cyan-500/30">
                    {msg.table}
                  </div>
                )}
                
                {/* Balão da mensagem */}
                <div
                  className={`relative max-w-[70%] p-4 rounded-2xl transition-all duration-300 hover-glow ${
                    isMine
                      ? "glass-blue text-white rounded-br-sm"
                      : "glass text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {!isMine && (
                    <div className="text-sm font-semibold text-neon-pink mb-2 font-orbitron">
                      {msg.name}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-400 mt-2 font-mono">
                    {msg.timestamp?.toDate?.().toLocaleTimeString() || "Enviando..."}
                  </div>

                  {/* Indicador de própria mensagem */}
                  {isMine && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-gray-900"></div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem */}
      <form onSubmit={handleSend} className="glass-dark rounded-2xl p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Digite sua mensagem..."
              className="input-futuristic w-full px-4 py-3 rounded-xl resize-none overflow-hidden leading-relaxed max-h-32 focus:outline-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500 font-mono">
              {newMessage.length}/500
            </div>
          </div>
          
          <button 
            type="submit"
            className="btn-futuristic p-4 rounded-xl hover-glow disabled:opacity-50"
            disabled={!newMessage.trim()}
          >
            <Send size={20} />
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
          <span className="font-mono">SHIFT + ENTER para nova linha</span>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
            <span>TRANSMISSÃO ATIVA</span>
          </div>
        </div>
      </form>
    </div>
  );
}