import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Limpa os dados do usuário nas coleções que você quiser.
 * Atualmente: radar
 */

import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export async function limparDadosUsuario(user) {
  if (!user?.name || !user?.table) {
    console.log("Usuário inválido:", user);
    return false;
  }

  const userName = String(user.name).trim().toLowerCase();
  const userTable = String(user.table).trim();

  try {
    // Apagar do radar usando docId fixo
    const radarId = `${userName}_${userTable}`.replace(/\s+/g, "_");
    await deleteDoc(doc(db, "radar", radarId));
    console.log("✅ Radar apagado com ID:", radarId);

    // Apagar mensagens do usuário
    const qMessages = query(
      collection(db, "messages"),
      where("name", "==", user.name),
      where("table", "==", user.table)
    );
    const snapMessages = await getDocs(qMessages);

    console.log("Mensagens encontradas:", snapMessages.docs.length);

    for (const msg of snapMessages.docs) {
      await deleteDoc(doc(db, "messages", msg.id));
      console.log("🧹 Apagada mensagem:", msg.id);
    }

    return true;
  } catch (err) {
    console.error("❌ Erro ao apagar dados:", err);
    return false;
  }
}



// export async function limparDadosUsuario(user) {
//   if (!user?.name || !user?.table) return false;

//   try {
    
//     const userId = `${user.name}_${user.table}`.replace(/\s+/g, "_");
// await deleteDoc(doc(db, "radar", userId));
// console.log("✅ Apagado com ID fixo:", userId);

//     // Aqui você pode apagar de outras coleções, se quiser:
//     // ex: usuários, notificações, etc

//     console.log("✅ Dados do usuário apagados.");
//     return true;
//   } catch (err) {
//     console.error("❌ Erro ao apagar dados do usuário:", err);
//     return false;
//   }
// }
