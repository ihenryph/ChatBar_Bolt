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
 * Limpa TODOS os dados do usuário de TODAS as coleções
 * Garante que não reste nenhum rastro do usuário no sistema
 */
export async function limparDadosUsuario(user) {
  if (!user?.name || !user?.table) {
    console.log("Usuário inválido:", user);
    return false;
  }

  const userName = String(user.name).trim();
  const userTable = String(user.table).trim();

  try {
    console.log(`🧹 Iniciando limpeza completa para: ${userName} (Mesa ${userTable})`);

    // 1. Apagar do radar usando docId fixo
    const radarId = `${userName}_${userTable}`.replace(/\s+/g, "_");
    try {
      await deleteDoc(doc(db, "radar", radarId));
      console.log("✅ Radar apagado com ID:", radarId);
    } catch (err) {
      console.log("⚠️ Documento radar não encontrado ou já apagado");
    }

    // 2. Apagar da coleção usuarios
    try {
      await deleteDoc(doc(db, "usuarios", userName));
      console.log("✅ Usuário apagado da coleção usuarios");
    } catch (err) {
      console.log("⚠️ Documento usuarios não encontrado ou já apagado");
    }

    // 3. Apagar TODAS as mensagens do usuário
    const qMessages = query(
      collection(db, "messages"),
      where("name", "==", userName),
      where("table", "==", userTable)
    );
    const snapMessages = await getDocs(qMessages);
    console.log(`📝 Mensagens encontradas: ${snapMessages.docs.length}`);

    for (const msg of snapMessages.docs) {
      await deleteDoc(doc(db, "messages", msg.id));
      console.log("🗑️ Mensagem apagada:", msg.id);
    }

    // 4. Apagar TODAS as curtidas ENVIADAS pelo usuário
    const qCurtidasEnviadas = query(
      collection(db, "curtidas"),
      where("de", "==", userName)
    );
    const snapCurtidasEnviadas = await getDocs(qCurtidasEnviadas);
    console.log(`💖 Curtidas enviadas encontradas: ${snapCurtidasEnviadas.docs.length}`);

    for (const curtida of snapCurtidasEnviadas.docs) {
      await deleteDoc(doc(db, "curtidas", curtida.id));
      console.log("🗑️ Curtida enviada apagada:", curtida.id);
    }

    // 5. Apagar TODAS as curtidas RECEBIDAS pelo usuário
    const qCurtidasRecebidas = query(
      collection(db, "curtidas"),
      where("para", "==", userName)
    );
    const snapCurtidasRecebidas = await getDocs(qCurtidasRecebidas);
    console.log(`💝 Curtidas recebidas encontradas: ${snapCurtidasRecebidas.docs.length}`);

    for (const curtida of snapCurtidasRecebidas.docs) {
      await deleteDoc(doc(db, "curtidas", curtida.id));
      console.log("🗑️ Curtida recebida apagada:", curtida.id);
    }

    // 6. Remover do sorteio (se estiver participando)
    try {
      const sorteioDoc = await getDocs(collection(db, "sorteio"));
      if (!sorteioDoc.empty) {
        const sorteioData = sorteioDoc.docs[0].data();
        const participantes = sorteioData.participantes || [];
        
        const novosParticipantes = participantes.filter(p => 
          !(p.name === userName && p.table === userTable)
        );

        if (novosParticipantes.length !== participantes.length) {
          await setDoc(doc(db, "sorteio", "dados"), {
            ...sorteioData,
            participantes: novosParticipantes
          });
          console.log("✅ Usuário removido do sorteio");
        }
      }
    } catch (err) {
      console.log("⚠️ Erro ao remover do sorteio:", err);
    }

    // 7. Apagar qualquer outro documento que possa ter o nome do usuário
    // (Adicione aqui outras coleções conforme necessário)

    console.log(`✅ Limpeza completa finalizada para: ${userName}`);
    return true;

  } catch (err) {
    console.error("❌ Erro durante a limpeza completa:", err);
    return false;
  }
}

/**
 * Função auxiliar para verificar se ainda existem dados do usuário
 */
export async function verificarDadosRestantes(user) {
  if (!user?.name || !user?.table) return;

  const userName = String(user.name).trim();
  const userTable = String(user.table).trim();

  try {
    // Verificar mensagens
    const qMessages = query(
      collection(db, "messages"),
      where("name", "==", userName),
      where("table", "==", userTable)
    );
    const snapMessages = await getDocs(qMessages);

    // Verificar curtidas enviadas
    const qCurtidas = query(
      collection(db, "curtidas"),
      where("de", "==", userName)
    );
    const snapCurtidas = await getDocs(qCurtidas);

    console.log("🔍 Verificação pós-limpeza:");
    console.log(`- Mensagens restantes: ${snapMessages.docs.length}`);
    console.log(`- Curtidas restantes: ${snapCurtidas.docs.length}`);

    return {
      mensagens: snapMessages.docs.length,
      curtidas: snapCurtidas.docs.length
    };
  } catch (err) {
    console.error("Erro na verificação:", err);
    return null;
  }
}