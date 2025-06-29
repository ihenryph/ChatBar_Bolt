import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

export default function Votacao({ user }) {
  const [musicas] = useState([
    { id: 1, nome: "Evidências", artista: "Chitãozinho & Xororó", genero: "Sertanejo" },
    { id: 2, nome: "Garota de Ipanema", artista: "Tom Jobim", genero: "Bossa Nova" },
    { id: 3, nome: "Ai Se Eu Te Pego", artista: "Michel Teló", genero: "Sertanejo" },
    { id: 4, nome: "Bohemian Rhapsody", artista: "Queen", genero: "Rock" },
    { id: 5, nome: "Despacito", artista: "Luis Fonsi", genero: "Pop Latino" }
  ]);
  
  const [voto, setVoto] = useState(null);
  const [votos, setVotos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Observar votos em tempo real
    const unsubscribe = onSnapshot(
      query(collection(db, "votos"), orderBy("timestamp", "desc")),
      (snapshot) => {
        const votosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVotos(votosData);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleVotar = async (musica) => {
    if (voto !== null || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "votos"), {
        musicaId: musica.id,
        musicaNome: musica.nome,
        artista: musica.artista,
        genero: musica.genero,
        userName: user.name,
        userTable: user.table,
        timestamp: serverTimestamp()
      });
      
      setVoto(musica.id);
      console.log(`🎵 Voto registrado para: ${musica.nome}`);
    } catch (error) {
      console.error("Erro ao votar:", error);
      alert("Erro ao registrar voto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas dos votos
  const calcularEstatisticas = () => {
    const contagem = {};
    votos.forEach(voto => {
      contagem[voto.musicaId] = (contagem[voto.musicaId] || 0) + 1;
    });
    
    return musicas.map(musica => ({
      ...musica,
      votos: contagem[musica.id] || 0
    })).sort((a, b) => b.votos - a.votos);
  };

  const estatisticas = calcularEstatisticas();
  const totalVotos = votos.length;
  const maxVotos = Math.max(...estatisticas.map(m => m.votos), 1);

  return (
    <div className="space-y-4">
      {/* Header mobile */}
      <div className="glass-dark rounded-xl p-4 text-center">
        <h2 className="font-orbitron text-xl font-bold text-neon mb-2">
          VOTAÇÃO MUSICAL
        </h2>
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 font-mono">
              {totalVotos} VOTOS
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full pulse-glow"></div>
            <span className="text-purple-300 font-mono">ATIVO</span>
          </div>
        </div>
      </div>

      {/* Status do usuário */}
      {voto && (
        <div className="glass rounded-xl p-4 border-2 border-green-400/50 bg-green-900/20">
          <div className="text-center">
            <h3 className="font-orbitron text-lg font-bold text-green-300 mb-1">
              ✅ VOTO CONFIRMADO!
            </h3>
            <p className="text-gray-300 text-sm font-mono">
              Obrigado, <span className="text-neon">{user.name}</span>!
            </p>
          </div>
        </div>
      )}

      {/* Lista de Músicas para Votar */}
      <div className="glass-dark rounded-xl p-4">
        <h3 className="font-orbitron text-lg font-bold text-cyan-300 mb-4 text-center">
          🎵 SELECIONE SUA MÚSICA
        </h3>
        
        <div className="space-y-3">
          {musicas.map((musica) => {
            const jaVotou = voto === musica.id;
            const votosMusica = estatisticas.find(m => m.id === musica.id)?.votos || 0;
            
            return (
              <button
                key={musica.id}
                onClick={() => handleVotar(musica)}
                disabled={voto !== null || loading}
                className={`w-full p-3 rounded-xl text-left transition-all duration-200 relative overflow-hidden ${
                  jaVotou
                    ? "glass-blue border-2 border-green-400/50 bg-green-900/20"
                    : voto !== null
                    ? "glass opacity-50 cursor-not-allowed"
                    : "glass-dark border border-gray-600/30"
                }`}
              >
                {/* Efeito de scan para música votada */}
                {jaVotou && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-orbitron font-bold text-white text-sm truncate">
                        {musica.nome}
                      </span>
                      {jaVotou && (
                        <div className="bg-green-500/30 px-2 py-1 rounded-full text-xs font-bold text-green-300 border border-green-400/50 flex-shrink-0">
                          VOTADO!
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-300 space-y-1">
                      <p><span className="text-gray-400">ARTISTA:</span> {musica.artista}</p>
                      <p><span className="text-gray-400">GÊNERO:</span> {musica.genero}</p>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="glass px-2 py-1 rounded-full text-xs font-mono">
                      {votosMusica}
                    </div>
                  </div>
                </div>

                {/* Barra de popularidade mobile */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400 font-mono flex-shrink-0">POP:</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        jaVotou ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ 
                        width: `${totalVotos > 0 ? (votosMusica / maxVotos) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-purple-300 font-mono flex-shrink-0">
                    {totalVotos > 0 ? Math.round((votosMusica / totalVotos) * 100) : 0}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ranking em Tempo Real mobile */}
      <div className="glass-dark rounded-xl p-4">
        <h3 className="font-orbitron text-lg font-bold text-yellow-300 mb-4 text-center">
          🏆 RANKING
        </h3>
        
        {totalVotos === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2 opacity-30">🎵</div>
            <p className="text-gray-400 text-sm font-mono">AGUARDANDO VOTOS...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {estatisticas.slice(0, 5).map((musica, idx) => (
              <div
                key={musica.id}
                className={`glass p-3 rounded-lg border-l-4 transition-all duration-500 ${
                  idx === 0 ? 'border-yellow-400 bg-yellow-900/20' :
                  idx === 1 ? 'border-gray-400 bg-gray-900/20' :
                  idx === 2 ? 'border-orange-400 bg-orange-900/20' :
                  'border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg flex-shrink-0">
                      {idx === 0 && "🥇"} {idx === 1 && "🥈"} {idx === 2 && "🥉"}
                      {idx > 2 && `${idx + 1}º`}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-orbitron font-bold text-white text-sm block truncate">
                        {musica.nome}
                      </span>
                      <span className="text-xs text-gray-400 font-mono truncate block">
                        {musica.artista}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className={`glass px-2 py-1 rounded-full text-xs font-mono ${
                      idx === 0 ? 'bg-yellow-500/30 text-yellow-300' :
                      'text-gray-300'
                    }`}>
                      {musica.votos}
                    </div>
                  </div>
                </div>

                {/* Barra de progresso mobile */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      idx === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      idx === 2 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                      'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                    style={{ 
                      width: `${(musica.votos / maxVotos) * 100}%` 
                    }}
                  ></div>
                </div>
                
                <div className="text-xs text-gray-400 font-mono">
                  {Math.round((musica.votos / totalVotos) * 100)}% dos votos
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer informativo */}
      <div className="glass-dark rounded-xl p-3 text-center">
        <p className="text-xs text-gray-400 font-mono">
          💡 UM VOTO POR USUÁRIO • RESULTADOS EM TEMPO REAL
        </p>
      </div>
    </div>
  );
}