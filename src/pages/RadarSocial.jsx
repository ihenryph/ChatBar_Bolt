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
        return "border-green-400/50 bg-green-900/20";
      case "Comprometido":
        return "border-yellow-400/50 bg-yellow-900/20";
      case "Casado":
        return "border-red-400/50 bg-red-900/20";
      default:
        return "border-gray-400/50 bg-gray-900/20";
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
    <div className="space-y-4">
      {/* Header do Radar mobile */}
      <div className="glass-dark rounded-xl p-4 text-center">
        <h2 className="font-orbitron text-xl font-bold text-neon mb-2">
          RADAR SOCIAL
        </h2>
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 font-mono">
              {usuarios.length} DETECTADOS
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-cyan-400 rounded-full pulse-glow"></div>
            <span className="text-cyan-300 font-mono">VARREDURA ATIVA</span>
          </div>
        </div>
      </div>

      {usuarios.length === 0 ? (
        <div className="glass-dark rounded-xl p-8 text-center">
          <div className="text-6xl mb-4 opacity-30">📡</div>
          <h3 className="font-orbitron text-lg text-gray-400 mb-2">
            RADAR EM STANDBY
          </h3>
          <p className="text-gray-500 text-sm font-mono">
            Aguardando sinais...
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {usuarios.map((u, idx) => {
            const isCurrentUser = u.name === user.name && u.table === user.table;
            
            return (
              <div
                key={`${u.name}-${u.table}`}
                className={`glass-dark rounded-xl p-4 border-2 transition-all duration-300 relative overflow-hidden ${
                  isCurrentUser 
                    ? "border-cyan-400/50 bg-cyan-900/20" 
                    : getStatusColor(u.status)
                }`}
              >
                {/* Efeito de scan */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-orbitron font-bold text-white text-sm truncate">
                        {isCurrentUser ? `${u.name} [VOCÊ]` : u.name}
                      </span>
                      <div className="glass px-2 py-1 rounded-full text-xs font-mono flex-shrink-0">
                        Mesa {u.table}
                      </div>
                      {isCurrentUser && (
                        <div className="bg-cyan-500/30 px-2 py-1 rounded-full text-xs font-bold text-cyan-300 border border-cyan-400/50 flex-shrink-0">
                          SELF
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span className="text-lg">{getStatusIcon(u.status)}</span>
                      <span className="text-gray-300 font-mono">{u.status}</span>
                    </div>
                    
                    {u.interesses && (
                      <div className="text-xs">
                        <span className="text-gray-400 font-mono">INTERESSES: </span>
                        <span className="text-gray-300">{u.interesses}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mb-1 pulse-glow"></div>
                    <span className="text-xs text-green-300 font-mono block">ONLINE</span>
                    <span className="text-xs text-gray-500 font-mono">
                      ID: {String(idx + 1).padStart(3, '0')}
                    </span>
                  </div>
                </div>

                {/* Barra de sinal mobile */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-gray-400 font-mono">SINAL:</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-2 rounded-full ${
                          i < 4 ? 'bg-green-400' : 'bg-gray-600'
                        }`}
                        style={{
                          animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite`
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-green-300 font-mono">FORTE</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer informativo */}
      <div className="glass-dark rounded-xl p-3 text-center">
        <p className="text-xs text-gray-400 font-mono">
          💡 RADAR ATUALIZA AUTOMATICAMENTE • TEMPO REAL
        </p>
      </div>
    </div>
  );
}