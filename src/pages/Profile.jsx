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
    "Samba", "MPB", "Reggae", "Hip Hop", "Jazz", "Blues", "Country"
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
      <div className="max-w-2xl mx-auto">
        <div className="glass-dark rounded-2xl p-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-400 font-mono">CARREGANDO PERFIL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-dark rounded-2xl p-6 text-center">
        <h2 className="font-orbitron text-3xl font-bold text-neon mb-3">
          CONFIGURAÇÃO DE PERFIL
        </h2>
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-purple-300 font-mono">MODO EDIÇÃO</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-300 font-mono">{user.name} • Mesa {user.table}</span>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="glass-dark rounded-2xl p-8">
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="glass p-6 rounded-xl border border-cyan-500/30">
            <h3 className="font-orbitron text-lg font-bold text-cyan-300 mb-4">
              📋 INFORMAÇÕES BÁSICAS
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  IDENTIFICAÇÃO
                </label>
                <input
                  type="text"
                  value={form.name}
                  className="input-futuristic w-full p-3 rounded-xl opacity-50 cursor-not-allowed"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  SETOR
                </label>
                <input
                  type="text"
                  value={`Mesa ${form.table}`}
                  className="input-futuristic w-full p-3 rounded-xl opacity-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-mono text-gray-400 mb-2">
                STATUS RELACIONAL
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="input-futuristic w-full p-3 rounded-xl appearance-none cursor-pointer"
              >
                <option value="" className="bg-gray-800">Selecione seu status</option>
                <option value="Solteiro" className="bg-gray-800">💚 Solteiro(a)</option>
                <option value="Comprometido" className="bg-gray-800">💛 Comprometido(a)</option>
                <option value="Casado" className="bg-gray-800">❤️ Casado(a)</option>
              </select>
            </div>
          </div>

          {/* Interesses */}
          <div className="glass p-6 rounded-xl border border-green-500/30">
            <h3 className="font-orbitron text-lg font-bold text-green-300 mb-4">
              🎯 INTERESSES & HOBBIES
            </h3>
            
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                SEUS INTERESSES
              </label>
              <input
                type="text"
                name="interesses"
                value={form.interesses}
                onChange={handleChange}
                placeholder="Ex: dançar, conhecer pessoas, beber, conversar..."
                className="input-futuristic w-full p-3 rounded-xl"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-mono text-gray-400 mb-2">
                HUMOR ATUAL
              </label>
              <input
                type="text"
                name="humor"
                value={form.humor}
                onChange={handleChange}
                placeholder="Ex: animado, relaxado, querendo festa..."
                className="input-futuristic w-full p-3 rounded-xl"
              />
            </div>
          </div>

          {/* Gêneros Musicais */}
          <div className="glass p-6 rounded-xl border border-purple-500/30">
            <h3 className="font-orbitron text-lg font-bold text-purple-300 mb-4">
              🎵 PREFERÊNCIAS MUSICAIS
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {generosMusicaisOpcoes.map((genero) => (
                <button
                  key={genero}
                  type="button"
                  onClick={() => handleGeneroToggle(genero)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 hover-glow ${
                    form.generosMusicais.includes(genero)
                      ? "glass-blue border-2 border-purple-400/50 text-purple-300"
                      : "glass border border-gray-600/30 text-gray-300 hover:border-purple-400/30"
                  }`}
                >
                  {genero}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="glass p-6 rounded-xl border border-pink-500/30">
            <h3 className="font-orbitron text-lg font-bold text-pink-300 mb-4">
              📝 BIOGRAFIA PESSOAL
            </h3>
            
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-2">
                CONTE UM POUCO SOBRE VOCÊ
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows="4"
                placeholder="Fale sobre você, seus gostos, o que está procurando hoje..."
                className="input-futuristic w-full p-3 rounded-xl resize-none"
              />
              <div className="text-xs text-gray-500 mt-1 font-mono">
                {form.bio.length}/500 caracteres
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 glass-dark border border-gray-600/30 text-gray-300 py-4 rounded-xl font-bold hover-glow transition-all duration-300"
            disabled={saving}
          >
            🔙 VOLTAR
          </button>
          <button
            onClick={salvarPerfil}
            disabled={saving}
            className="flex-1 btn-futuristic py-4 rounded-xl font-bold disabled:opacity-50"
          >
            {saving ? (
              <div className="flex items-center justify-center gap-3">
                <div className="loading-spinner"></div>
                SALVANDO...
              </div>
            ) : (
              "💾 SALVAR PERFIL"
            )}
          </button>
        </div>
      </div>

      {/* Preview do Perfil */}
      <div className="glass-dark rounded-2xl p-6">
        <h3 className="font-orbitron text-lg font-bold text-cyan-300 mb-4 text-center">
          👁️ PREVIEW DO SEU PERFIL
        </h3>
        
        <div className="glass p-4 rounded-xl border border-gray-600/30">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-orbitron text-lg font-bold text-white">{form.name}</span>
            <div className="glass px-2 py-1 rounded-full text-xs font-mono">
              Mesa {form.table}
            </div>
            {form.status && (
              <div className="text-sm">
                {form.status === "Solteiro" && "💚"}
                {form.status === "Comprometido" && "💛"}
                {form.status === "Casado" && "❤️"}
                <span className="ml-1">{form.status}</span>
              </div>
            )}
          </div>
          
          {form.interesses && (
            <p className="text-sm text-gray-300 mb-2">
              <span className="text-gray-400">🎯 Interesses:</span> {form.interesses}
            </p>
          )}
          
          {form.humor && (
            <p className="text-sm text-gray-300 mb-2">
              <span className="text-gray-400">😊 Humor:</span> {form.humor}
            </p>
          )}
          
          {form.generosMusicais.length > 0 && (
            <p className="text-sm text-gray-300 mb-2">
              <span className="text-gray-400">🎵 Música:</span> {form.generosMusicais.join(", ")}
            </p>
          )}
          
          {form.bio && (
            <p className="text-sm text-gray-300">
              <span className="text-gray-400">📝 Bio:</span> {form.bio}
            </p>
          )}
        </div>
      </div>

      {/* Footer informativo */}
      <div className="glass-dark rounded-2xl p-4 text-center">
        <p className="text-xs text-gray-400 font-mono">
          💡 SEU PERFIL SERÁ VISÍVEL NO RADAR SOCIAL E MODO PAQUERA
        </p>
      </div>
    </div>
  );
}