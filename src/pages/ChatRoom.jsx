import { useEffect, useRef, useState } from "react";
import { db } from "../lib/firebase";
import { Link } from "react-router-dom";
import ChatMessage from '../components/ChatMessage';
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
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-center">
          💬 ChatBar - Mesa {user.table}
        </h1>
        <div className="flex justify-between items-center mb-2">
  {/* <h1 className="text-2xl font-bold">💬 Chat26Bar - Mesa {user.table}</h1> */}
  
</div>
        
      </div>

    <div
    //className="bg-[rgba(255,255,255,0.05)] backdrop-blur text-black rounded-lg shadow p-4 max-h-[60vh] overflow-y-auto space-y-2"
className="text-black rounded-lg shadow p-4 max-h-[73vh] overflow-y-auto space-y-2"
  style={{
    backgroundImage: "url('/src/assets/bg.png')",
    backgroundSize: "cover",
    backgroundRepeat: "repeat",
    backgroundColor: "rgba(255, 255, 255, 0.6)", // branco com 60% opacidade
  }}>
  {/*className="text-black rounded-lg shadow p-4 max-h-[73vh] overflow-y-auto space-y-2 bg-[url('/src/assets/bg.png')] bg-repeat bg-cover"*/}

        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">Nenhuma mensagem ainda.</p>
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
                  <div className="w-8 h-8 bg-DimGrey-400 text-gray-300 text-base flex items-center justify-center rounded-full">
                    {msg.table} 
                  </div>
                )}
                {/*Balão Usuário*/}
                <div
                  className={`relative p-3 rounded-x1 max-w-[70%] text-base leading-snug ${
                    isMine
                      ? "text-white rounded-br-none"
                      : "bg-gray-900 text-white rounded-bl-none"
                  }`}
                >
                  {!isMine && (
                    <div className="text-base text-red-500 font-semibold mb-1">
                      {msg.name} {/* Nome da MESA no Balao de mensagem (Mesa {msg.table})*/}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>


                  {/* Cauda do balão */}
                  <div
                    className={`absolute bottom-1 ${
                      isMine
                        ? "right-0 translate-x-full border-t-[8px] border-t-transparent border-l-[8px] border-l-blue-600 border-b-[8px] border-b-transparent"
                        : "left-0 -translate-x-full border-t-[4px] border-t-transparent border-r-[8px] border-r-gray-900 border-b-[8px] border-b-transparent"
                    }`}
                  ></div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
        <form onSubmit={handleSend} className="flex gap-1">
  <textarea
    value={newMessage}
    onChange={(e) => {
      
      setNewMessage(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
      
    }}
    
    placeholder="Digite sua mensagem..."
    className="flex-1 px-3 py-4 rounded border border-gray-700 text-white bg-transparent resize-none overflow-hidden leading-snug max-h-40 focus:outline-none"
    rows={1}
    
  />
  <button className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600">
  <Send size={30} />
   </button>
</form>

     
      <div className="mt-2 text-center">
  
</div>

    </div>
  );
}
