import { useState } from "react";
import { db } from "../lib/firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { registrarPresencaUsuario } from "../utils/userPresence";

export default function Entry({ onEnter }) {
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [status, setStatus] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = () => {
    if (adminCode === "admin123") {
      onEnter({ name: "Administrador", table: "admin", isAdmin: true });
    } else {
      alert("Código incorreto");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !table || !status) return;

    setLoading(true);

    try {
      const userData = { name, table, status };

      // Salvar no Firestore
      await setDoc(doc(db, "usuarios", name), {
        name,
        table,
        status,
        timestamp: serverTimestamp(),
        online: true
      });

      // Registrar presença instantânea em todas as coleções
      await registrarPresencaUsuario(userData);

      console.log("✅ Usuário logado e presença registrada:", name);
      
      // Fazer login
      onEnter(userData);
    } catch (error) {
      console.error("❌ Erro no login:", error);
      alert("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative">
      {/* Efeito de partículas flutuantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Container principal mobile-first */}
      <div className="glass-dark rounded-2xl p-6 w-full max-w-sm relative z-5 border-animated">
        {/* Logo/Título */}
        <div className="text-center mb-6">
          <h1 className="font-orbitron text-2x1 font-bold text-neon mb-2 float">
            CHATBAR
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto rounded-full"></div>
          <p className="text-gray-300 mt-3 text-sm">
            Entreterimento Casual
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Nome"
                className="input-futuristic w-full p-3 rounded-xl font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full pulse-glow"></div>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Mesa"
                className="input-futuristic w-full p-3 rounded-xl font-medium"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full pulse-glow"></div>
              </div>
            </div>

            <div className="relative">
              <select
                className="input-futuristic w-full p-3 rounded-xl font-medium appearance-none cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
              >
                <option value="" className="bg-gray-800">STATUS RELACIONAL</option>
                <option value="Solteiro" className="bg-gray-800">💚 DISPONÍVEL</option>
                <option value="Comprometido" className="bg-gray-800">💛 COMPROMETIDO</option>
                <option value="Casado" className="bg-gray-800">❤️ VINCULADO</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-futuristic w-full py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="loading-spinner"></div>
                CONECTANDO...
              </div>
            ) : (
              "INICIAR CONEXÃO"
            )}
          </button>
        </form>
        
        {/* Seção Admin */}
        <div className="mt-6 pt-4 border-t border-gray-600/30">
          <div className="text-center mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Acesso Administrativo</span>
          </div>
          
          <div className="space-y-2">
            <input
              type="password"
              placeholder="CÓDIGO DE ACESSO"
              className="input-futuristic w-full p-3 rounded-xl text-sm"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="w-full bg-gradient-to-r from-pink-600/80 to-purple-600/80 hover:from-pink-500 hover:to-purple-500 text-white py-3 rounded-xl font-medium text-sm transition-all duration-300 border border-pink-500/30 disabled:opacity-50"
              onClick={handleAdminLogin}
              disabled={loading}
            >
              PAINEL DE CONTROLE
            </button>
          </div>
        </div>

        {/* Indicadores de status */}
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            SISTEMA ONLINE
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            CONEXÃO SEGURA
          </div>
        </div>
      </div>

      {/* Rodapé futurístico */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 font-mono">
          CHATBAR v2.0 • PROJETO RAFAEL HENRIQUE N ALVES
        </p>
      </div>
    </div>
  );
}