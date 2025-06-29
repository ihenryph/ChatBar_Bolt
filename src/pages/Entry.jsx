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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900">
      {/* Container principal mobile-first */}
      <div className="glass-dark rounded-2xl p-6 w-full max-w-sm">
        {/* Logo/Título */}
        <div className="text-center mb-6">
          <h1 className="font-orbitron text-2xl font-bold text-neon mb-2">
            CHATBAR
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto rounded-full"></div>
          <p className="text-gray-300 mt-3 text-sm">
            Sistema de Comunicação
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="SEU NOME"
              className="input-futuristic w-full p-3 rounded-xl font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />

            <input
              type="text"
              placeholder="NÚMERO DA MESA"
              className="input-futuristic w-full p-3 rounded-xl font-medium"
              value={table}
              onChange={(e) => setTable(e.target.value)}
              disabled={loading}
            />

            <select
              className="input-futuristic w-full p-3 rounded-xl font-medium appearance-none cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              <option value="" className="bg-gray-800">STATUS RELACIONAL</option>
              <option value="Solteiro" className="bg-gray-800">💚 SOLTEIRO(A)</option>
              <option value="Comprometido" className="bg-gray-800">💛 COMPROMETIDO(A)</option>
              <option value="Casado" className="bg-gray-800">❤️ CASADO(A)</option>
            </select>
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
              "ENTRAR NO CHAT"
            )}
          </button>
        </form>
        
        {/* Seção Admin */}
        <div className="mt-6 pt-4 border-t border-gray-600/30">
          <div className="text-center mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Acesso Admin</span>
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
              className="w-full bg-gradient-to-r from-pink-600/80 to-purple-600/80 text-white py-3 rounded-xl font-medium text-sm transition-all duration-200 border border-pink-500/30 disabled:opacity-50"
              onClick={handleAdminLogin}
              disabled={loading}
            >
              PAINEL ADMIN
            </button>
          </div>
        </div>

        {/* Indicadores de status */}
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            ONLINE
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            SEGURO
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 font-mono">
          CHATBAR v2.0 • MOBILE
        </p>
      </div>
    </div>
  );
}