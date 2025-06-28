import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Registra a presença do usuário em todas as coleções necessárias
 */
export async function registrarPresencaUsuario(user) {
  if (!user?.name || !user?.table) {
    console.error("Dados do usuário inválidos:", user);
    return false;
  }

  try {
    const userId = `${user.name}_${user.table}`.replace(/\s+/g, "_");
    
    // Registrar no radar social
    await setDoc(doc(db, "radar", userId), {
      name: user.name,
      table: user.table,
      status: user.status || "Não informado",
      interesses: user.interesses || null,
      lastActive: serverTimestamp(),
      online: true
    });

    // Registrar na coleção de usuários
    await setDoc(doc(db, "usuarios", user.name), {
      name: user.name,
      table: user.table,
      status: user.status || "Não informado",
      interesses: user.interesses || null,
      timestamp: serverTimestamp(),
      online: true
    });

    console.log("✅ Presença do usuário registrada:", user.name);
    return true;
  } catch (error) {
    console.error("❌ Erro ao registrar presença:", error);
    return false;
  }
}

/**
 * Mantém a presença do usuário ativa
 */
export function manterPresencaAtiva(user) {
  if (!user?.name || !user?.table) return null;

  const userId = `${user.name}_${user.table}`.replace(/\s+/g, "_");
  
  const interval = setInterval(async () => {
    try {
      await setDoc(doc(db, "radar", userId), {
        name: user.name,
        table: user.table,
        status: user.status || "Não informado",
        interesses: user.interesses || null,
        lastActive: serverTimestamp(),
        online: true
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao manter presença:", error);
    }
  }, 5000);

  return interval;
}