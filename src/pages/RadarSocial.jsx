// //NOVO PROJETO SEM CHAT

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export default function RadarSocial({ user }) {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    if (!user?.name || !user?.table) return;

    const userId = `${user.name}_${user.table}`.replace(/\s+/g, "_");
    const userRef = doc(db, "radar", userId);

    // Salva a presença inicial
    const salvarPresenca = async () => {
      await setDoc(userRef, {
        name: user.name,
        table: user.table,
        status: user.status || "Não informado",
        interesses: user.interesses || null,
        lastActive: serverTimestamp(),
      });
    };

    salvarPresenca(); // chamada inicial

    // Atualiza presença a cada 5 segundos
    const interval = setInterval(() => {
      setDoc(userRef, {
        name: user.name,
        table: user.table,
        status: user.status || "Não informado",
        interesses: user.interesses || null,
        lastActive: serverTimestamp(),
      });
    }, 5000);

    // Escuta mudanças em tempo real
    const unsub = onSnapshot(collection(db, "radar"), (snapshot) => {
      const agora = Timestamp.now();
      const ativos = snapshot.docs
        .map((doc) => doc.data())
        .filter((u) => {
          const diff = agora.seconds - (u.lastActive?.seconds || 0);
          return diff < 10;
        });

      setUsuarios(ativos);
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [user]);

  return (
    <div className="max-w-xl mx-auto bg-gray-800 p-4 rounded shadow space-y-4">
      <h2 className="text-2xl font-bold text-center mb-4">📡 Radar Social</h2>

      {usuarios.length === 0 ? (
        <p className="text-center text-gray-400">Nenhum usuário online agora.</p>
      ) : (
        <ul className="space-y-3">
          {usuarios.map((u, idx) => (
            <li
              key={idx}
              className={`p-3 rounded border ${
                u.status === "Solteiro(a)"
                  ? "border-green-500"
                  : u.status === "Casado(a)"
                  ? "border-red-500"
                  : "border-gray-500"
              }`}
            >
              <div className="font-semibold text-lg">
                {u.name} - Mesa {u.table}
              </div>
              <div>Status: {u.status}</div>
              {u.interesses && <div>🎯 Interesses: {u.interesses}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
