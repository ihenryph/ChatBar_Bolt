import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export default function RadarSocial({ user }) {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    if (!user?.name || !user?.table) return;

    // Escuta mudanças em tempo real no radar
    const unsub = onSnapshot(collection(db, "radar"), (snapshot) => {
      const agora = Timestamp.now();
      const ativos = snapshot.docs
        .map((doc) => doc.data())
        .filter((u) => {
          // Considera ativo se foi visto nos últimos 15 segundos
          const diff = agora.seconds - (u.lastActive?.seconds || 0);
          return diff < 15 && u.online;
        })
        .sort((a, b) => {
          // Ordena por atividade mais recente
          const aTime = a.lastActive?.seconds || 0;
          const bTime = b.lastActive?.seconds || 0;
          return bTime - aTime;
        });

      setUsuarios(ativos);
    });

    return () => unsub();
  }, [user]);

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

  return (
    <div className="max-w-xl mx-auto bg-gray-800 p-4 rounded shadow space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">📡 Radar Social</h2>
        <p className="text-gray-300 text-sm">
          {usuarios.length} {usuarios.length === 1 ? 'pessoa online' : 'pessoas online'}
        </p>
      </div>

      {usuarios.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-2">Nenhum usuário online agora.</p>
          <p className="text-gray-500 text-sm">Seja o primeiro a aparecer no radar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {usuarios.map((u, idx) => {
            const isCurrentUser = u.name === user.name && u.table === user.table;
            
            return (
              <div
                key={`${u.name}-${u.table}`}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  isCurrentUser 
                    ? "border-blue-500 bg-blue-900/30 shadow-lg" 
                    : getStatusColor(u.status)
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg">
                        {isCurrentUser ? `${u.name} (Você)` : u.name}
                      </span>
                      <span className="text-sm bg-gray-700 px-2 py-1 rounded">
                        Mesa {u.table}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                          VOCÊ
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <span>{getStatusIcon(u.status)}</span>
                      <span className="text-gray-300">{u.status}</span>
                    </div>
                    
                    {u.interesses && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-400">🎯 Interesses: </span>
                        <span className="text-gray-300">{u.interesses}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400 mt-1 block">Online</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-700 rounded text-center">
        <p className="text-xs text-gray-400">
          💡 Dica: Seu status aparece automaticamente quando você está online!
        </p>
      </div>
    </div>
  );
}