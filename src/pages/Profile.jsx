import { useEffect, useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Profile({ user, onBack }) {
  const [form, setForm] = useState({
    name: user.name || "",
    table: user.table || "",
    status: user.status || "",
    interesses: "",
    bio: "",
    generosMusicais: [],
    humor: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const userRef = doc(db, "usuarios", user.name);

  const generosMusicaisOpcoes = [
    "Rock", "Pop", "Sertanejo", "Funk", "Eletrônica", 
    "Samba", "MPB", "Reggae", "Hip Hop", "Jazz"
  ];

  // Carrega os dados do Firestore
  useEffect(() => {
    async function fetchData() {
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm(prev => ({
            ...prev,
            status: data.status || "",
            interesses: data.interesses || "",
            bio: data.bio || "",
            generosMusicais: data.generosMusicais || [],
            humor: data.humor || ""
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGeneroToggle = (genero) => {
    setForm(prev => ({
      ...prev,
      generosMusicais: prev.generosMusicais.includes(genero)
        ? prev.generosMusicais.filter(g => g !== genero)
        : [...prev.generosMusicais, genero]
    }));
  };

  const salvarPerfil = async () => {
    setSaving(true);
    try {
      await setDoc(userRef, {
        ...form,
        timestamp: new Date()
      }, { merge: true });

      alert("✅ Perfil atualizado com sucesso!");
      onBack();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("❌ Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass-dark rounded-xl p-8 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-400 font-mono">CARREGANDO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header mobile */}
      <div className="glass-dark rounded-xl p-4 text-center">
        <h2 className="font-orbitron text-xl font-bold text-neon mb-2">
          PERFIL
        </h2>
        <div className="flex items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-purple-300 font-mono">EDIÇÃO</span>
          </div>
          <span className="text-cyan-300 font-mono">{user.name} • Mesa {user.table}</span>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="glass-dark rounded-xl p-4">
        <h3 className="font-orbitron font-bold text-cyan-300 mb-3 text-sm">
          📋 INFORMAÇÕES BÁSICAS
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              IDENTIFICAÇÃO
            </label>
            <input
              type="text"
              value={form.name}
              className="input-futuristic w-full p-3 rounded-lg opacity-50 cursor-not-allowed text-sm"
              disabled
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              SETOR
            </label>
            <input
              type="text"
              value={`Mesa ${form.table}`}
              className="input-futuristic w-full p-3 rounded-lg opacity-50 cursor-not-allowed text-sm"
              disabled
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              STATUS RELACIONAL
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="input-futuristic w-full p-3 rounded-lg appearance-none cursor-pointer text-sm"
            >
              <option value="" className="bg-gray-800">Selecione</option>
              <option value="Solteiro" className="bg-gray-800">💚 Solteiro(a)</option>
              <option value="Comprometido" className="bg-gray-800">💛 Comprometido(a)</option>
              <option value="Casado" className="bg-gray-800">❤️ Casado(a)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interesses */}
      <div className="glass-dark rounded-xl p-4">
        <h3 className="font-orbitron font-bold text-green-300 mb-3 text-sm">
          🎯 INTERESSES & HUMOR
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              SEUS INTERESSES
            </label>
            <input
              type="text"
              name="interesses"
              value={form.interesses}
              onChange={handleChange}
              placeholder="Ex: dançar, conhecer pessoas, beber..."
              className="input-futuristic w-full p-3 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              HUMOR ATUAL
            </label>
            <input
              type="text"
              name="humor"
              value={form.humor}
              onChange={handleChange}
              placeholder="Ex: animado, relaxado, festa..."
              className="input-futuristic w-full p-3 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Gêneros Musicais */}
      <div className="glass-dark rounded-xl p-4">
        <h3 className="font-orbitron font-bold text-purple-300 mb-3 text-sm">
          🎵 PREFERÊNCIAS MUSICAIS
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {generosMusicaisOpcoes.map((genero) => (
            <button
              key={genero}
              type="button"
              onClick={() => handleGeneroToggle(genero)}
              className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                form.generosMusicais.includes(genero)
                  ? "glass-blue border-2 border-purple-400/50 text-purple-300"
                  : "glass border border-gray-600/30 text-gray-300"
              }`}
            >
              {genero}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="glass-dark rounded-xl p-4">
        <h3 className="font-orbitron font-bold text-pink-300 mb-3 text-sm">
          📝 BIOGRAFIA
        </h3>
        
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1">
            CONTE SOBRE VOCÊ
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows="3"
            placeholder="Fale sobre você, seus gostos..."
            className="input-futuristic w-full p-3 rounded-lg resize-none text-sm"
          />
          <div className="text-xs text-gray-500 mt-1 font-mono">
            {form.bio.length}/500 caracteres
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 glass-dark border border-gray-600/30 text-gray-300 py-3 rounded-lg font-bold transition-all duration-200"
          disabled={saving}
        >
          🔙 VOLTAR
        </button>
        <button
          onClick={salvarPerfil}
          disabled={saving}
          className="flex-1 btn-futuristic py-3 rounded-lg font-bold disabled:opacity-50"
        >
          {saving ? (
            <div className="flex items-center justify-center gap-2">
              <div className="loading-spinner"></div>
              SALVANDO...
            </div>
          ) : (
            "💾 SALVAR"
          )}
        </button>
      </div>

      {/* Preview do Perfil */}
      <div className="glass-dark rounded-xl p-4">
        <h3 className="font-orbitron font-bold text-cyan-300 mb-3 text-sm text-center">
          👁️ PREVIEW
        </h3>
        
        <div className="glass p-3 rounded-lg border border-gray-600/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-orbitron font-bold text-white text-sm">{form.name}</span>
            <div className="glass px-2 py-1 rounded-full text-xs font-mono">
              Mesa {form.table}
            </div>
            {form.status && (
              <div className="text-xs">
                {form.status === "Solteiro" && "💚"}
                {form.status === "Comprometido" && "💛"}
                {form.status === "Casado" && "❤️"}
                <span className="ml-1">{form.status}</span>
              </div>
            )}
          </div>
          
          {form.interesses && (
            <p className="text-xs text-gray-300 mb-1">
              <span className="text-gray-400">🎯 Interesses:</span> {form.interesses}
            </p>
          )}
          
          {form.humor && (
            <p className="text-xs text-gray-300 mb-1">
              <span className="text-gray-400">😊 Humor:</span> {form.humor}
            </p>
          )}
          
          {form.generosMusicais.length > 0 && (
            <p className="text-xs text-gray-300 mb-1">
              <span className="text-gray-400">🎵 Música:</span> {form.generosMusicais.join(", ")}
            </p>
          )}
          
          {form.bio && (
            <p className="text-xs text-gray-300">
              <span className="text-gray-400">📝 Bio:</span> {form.bio}
            </p>
          )}
        </div>
      </div>

      {/* Footer informativo */}
      <div className="glass-dark rounded-xl p-3 text-center">
        <p className="text-xs text-gray-400 font-mono">
          💡 PERFIL VISÍVEL NO RADAR E PAQUERA
        </p>
      </div>
    </div>
  );
}