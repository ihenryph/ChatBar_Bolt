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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-dark rounded-2xl p-6 text-center">
        <h2 className="font-orbitron text-3xl font-bold text-neon mb-3">
          SISTEMA DE VOTAÇÃO MUSICAL
        </h2>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 font-mono">
              {totalVotos} VOTOS REGISTRADOS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full pulse-glow"></div>
            <span className="text-purple-300 font-mono">VOTAÇÃO ATIVA</span>
          </div>
        </div>
      </div>

      {/* Status do usuário */}
      {voto && (
        <div className="glass rounded-2xl p-6 border-2 border-green-400/50 bg-green-900/20 hologram">
          <div className="text-center">
            <h3 className="font-orbitron text-xl font-bold text-green-300 mb-2 animate-pulse">
              ✅ VOTO CONFIRMADO!
            </h3>
            <p className="text-gray-300 font-mono">
              Obrigado por participar, <span className="text-neon">{user.name}</span>!
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lista de Músicas para Votar */}
        <div className="glass-dark rounded-2xl p-6">
          <h3 className="font-orbitron text-xl font-bold text-cyan-300 mb-6 text-center">
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
                  className={`w-full p-4 rounded-xl text-left transition-all duration-300 hover-glow relative overflow-hidden ${
                    jaVotou
                      ? "glass-blue border-2 border-green-400/50 bg-green-900/20"
                      : voto !== null
                      ? "glass opacity-50 cursor-not-allowed"
                      : "glass-dark border border-gray-600/30 hover:border-purple-400/50"
                  }`}
                >
                  {/* Efeito de scan para música votada */}
                  {jaVotou && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-orbitron text-lg font-bold text-white">
                          {musica.nome}
                        </span>
                        {jaVotou && (
                          <div className="bg-green-500/30 px-2 py-1 rounded-full text-xs font-bold text-green-300 border border-green-400/50 animate-pulse">
                            VOTADO!
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-300 space-y-1">
                        <p><span className="text-gray-400">ARTISTA:</span> {musica.artista}</p>
                        <p><span className="text-gray-400">GÊNERO:</span> {musica.genero}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="glass px-3 py-2 rounded-full text-sm font-mono">
                        {votosMusica} VOTOS
                      </div>
                      {loading && voto === null && (
                        <div className="loading-spinner mt-2"></div>
                      )}
                    </div>
                  </div>

                  {/* Barra de popularidade */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-gray-400 font-mono">POPULARIDADE:</span>
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
                    <span className="text-xs text-purple-300 font-mono">
                      {totalVotos > 0 ? Math.round((votosMusica / totalVotos) * 100) : 0}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ranking em Tempo Real */}
        <div className="glass-dark rounded-2xl p-6">
          <h3 className="font-orbitron text-xl font-bold text-yellow-300 mb-6 text-center">
            🏆 RANKING EM TEMPO REAL
          </h3>
          
          {totalVotos === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-30">🎵</div>
              <p className="text-gray-400 font-mono">AGUARDANDO PRIMEIROS VOTOS...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {estatisticas.map((musica, idx) => (
                <div
                  key={musica.id}
                  className={`glass p-4 rounded-xl border-l-4 transition-all duration-500 ${
                    idx === 0 ? 'border-yellow-400 bg-yellow-900/20' :
                    idx === 1 ? 'border-gray-400 bg-gray-900/20' :
                    idx === 2 ? 'border-orange-400 bg-orange-900/20' :
                    'border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {idx === 0 && "🥇"} {idx === 1 && "🥈"} {idx === 2 && "🥉"}
                        {idx > 2 && `${idx + 1}º`}
                      </span>
                      <div>
                        <span className="font-orbitron font-bold text-white block">
                          {musica.nome}
                        </span>
                        <span className="text-sm text-gray-400 font-mono">
                          {musica.artista}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`glass px-3 py-1 rounded-full text-sm font-mono ${
                        idx === 0 ? 'bg-yellow-500/30 text-yellow-300' :
                        'text-gray-300'
                      }`}>
                        {musica.votos} VOTOS
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${
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
                  
                  <div className="text-xs text-gray-400 mt-1 font-mono">
                    {Math.round((musica.votos / totalVotos) * 100)}% dos votos
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimos Votos */}
      {votos.length > 0 && (
        <div className="glass-dark rounded-2xl p-6">
          <h3 className="font-orbitron text-xl font-bold text-cyan-300 mb-4 text-center">
            📊 ÚLTIMOS VOTOS REGISTRADOS
          </h3>
          
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto">
            {votos.slice(0, 12).map((voto, idx) => (
              <div key={voto.id} className="glass p-3 rounded-lg border border-gray-600/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white text-sm">{voto.userName}</span>
                  <span className="text-xs text-gray-400 font-mono">Mesa {voto.userTable}</span>
                </div>
                <div className="text-sm text-gray-300">
                  <p className="font-mono">🎵 {voto.musicaNome}</p>
                  <p className="text-xs text-gray-400">{voto.artista}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer informativo */}
      <div className="glass-dark rounded-2xl p-4 text-center">
        <p className="text-xs text-gray-400 font-mono">
          💡 CADA USUÁRIO PODE VOTAR APENAS UMA VEZ • RESULTADOS EM TEMPO REAL
        </p>
      </div>
    </div>
  );
}