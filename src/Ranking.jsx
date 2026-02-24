import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Trophy, Target, Medal } from "lucide-react";

export default function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRanking() {
      const { data, error } = await supabase.from("leaderboard").select("*");

      if (error) {
        console.error("Erro ao buscar ranking:", error);
        setError(error.message);
      } else {
        setRanking(data || []);
      }
      setLoading(false);
    }
    fetchRanking();
  }, []);

  if (loading)
    return (
      <div className="text-center p-10 text-gray-500 font-bold animate-pulse">
        Calculando pontos... ⏳
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center max-w-2xl mx-auto mt-10">
        <h2 className="text-red-700 font-bold text-xl mb-2">
          Ops! Deu ruim no Ranking
        </h2>
        <p className="text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-3xl mx-auto mt-6 mb-20">
      <div className="bg-brand-600 p-5 text-white flex items-center gap-3">
        <Trophy size={28} />
        <h2 className="text-2xl font-bold">Ranking Oficial</h2>
      </div>

      <div className="p-0">
        {ranking.map((user, index) => (
          <div
            key={user.user_id}
            className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-lg
                ${
                  index === 0
                    ? "bg-yellow-100 text-yellow-600 shadow-sm border border-yellow-200"
                    : index === 1
                      ? "bg-gray-200 text-gray-500 shadow-sm border border-gray-300"
                      : index === 2
                        ? "bg-orange-100 text-orange-600 shadow-sm border border-orange-200"
                        : "bg-gray-50 text-gray-400"
                }`}
              >
                {index + 1}º
              </div>

              <div>
                {/* AQUI ESTÁ A ATUALIZAÇÃO DO NOME */}
                <div className="font-bold text-gray-800 text-lg">
                  {user.user_name
                    ? user.user_name
                    : `Jogador ${user.user_id.substring(0, 5).toUpperCase()}`}
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <Target size={14} /> {user.exact_count} na mosca
                  </span>
                  <span className="flex items-center gap-1">
                    <Medal size={14} /> {user.group_points} pts Grupos
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black text-brand-600 leading-none">
                {user.total_points}
              </div>
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">
                Pontos
              </div>
            </div>
          </div>
        ))}

        {ranking.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            <Trophy size={48} className="mx-auto mb-4 opacity-20" />
            <p>Ainda não há palpites finalizados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
