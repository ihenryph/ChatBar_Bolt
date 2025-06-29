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

  // Função para lidar com teclas pressionadas
  const handleKeyDown = (e) => {
    // ENTER sem SHIFT = quebra linha (comportamento padrão do textarea)
    // Não fazer nada especial, deixar o textarea quebrar linha naturalmente
    
    // Remover qualquer comportamento de envio com ENTER
    // A mensagem só será enviada clicando no botão
  };

  return (
    <div className="space-y-3">
      {/* Header do Chat mobile */}
      <div className="glass-blue rounded-xl p-3 text-center">
        <h2 className="font-orbitron text-lg font-bold text-neon mb-1">
          CANAL DE COMUNICAÇÃO
        </h2>
        <div className="flex items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-300">Mesa {user.table}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-300">{messages.length} msgs</span>
          </div>
        </div>
      </div>

      {/* Área de mensagens mobile */}
      <div className="glass-dark rounded-xl p-3 h-[60vh] overflow-y-auto space-y-2">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 opacity-30">💬</div>
            <p className="text-gray-400 text-sm font-mono">AGUARDANDO MENSAGENS...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine =
              msg.name.toLowerCase() === user.name.toLowerCase() &&
              msg.table === user.table;
            
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                {!isMine && (
                  <div className="glass w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-cyan-300 border border-cyan-500/30 flex-shrink-0">
                    {msg.table}
                  </div>
                )}
                
                {/* Balão da mensagem mobile */}
                <div
                  className={`relative max-w-[75%] p-3 rounded-xl transition-all duration-200 ${
                    isMine
                      ? "glass-blue text-white rounded-br-sm"
                      : "glass text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {!isMine && (
                    <div className="text-xs font-semibold text-neon-pink mb-1 font-orbitron">
                      {msg.name}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Timestamp mobile */}
                  <div className="text-xs text-gray-400 mt-1 font-mono">
                    {msg.timestamp?.toDate?.().toLocaleTimeString() || "..."}
                  </div>

                  {/* Indicador de própria mensagem */}
                  {isMine && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full border border-gray-900"></div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem mobile otimizado */}
      <form onSubmit={handleSend} className="glass-dark rounded-xl p-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // Auto-resize do textarea
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="input-futuristic w-full px-3 py-2 rounded-lg resize-none overflow-hidden leading-relaxed min-h-[44px] max-h-[120px] focus:outline-none text-sm"
              rows={1}
              style={{ 
                fontSize: '16px', // Evita zoom no iOS
                lineHeight: '1.5'
              }}
            />
          </div>
          
          <button 
            type="submit"
            className="btn-futuristic p-3 rounded-lg disabled:opacity-50 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            disabled={!newMessage.trim()}
          >
            <Send size={16} />
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          {/*<span className="font-mono">ENTER para quebra de linha</span>*/}
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
            <span>ATIVO</span>
          </div>
        </div>
      </form>
    </div>
  );
}