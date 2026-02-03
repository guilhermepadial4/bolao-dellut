import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Trophy, Medal } from "lucide-react";

export default function Ranking() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  async function fetchRanking() {
    // Busca da view 'leaderboard' e pega o e-mail do usuário também
    const { data, error } = await supabase
      .from("leaderboard")
      .select("total_points, user_id");

    if (error) {
      console.error(error);
    } else {
      // Precisamos buscar os e-mails (que ficam em outra tabela protegida)
      // Como simplificação, vamos assumir que pegamos apenas os pontos por enquanto
      // Em produção, usaríamos uma tabela 'profiles' pública.

      // MOCK VISUAL: Vamos enriquecer com dados fakes se não tiver perfil público
      // Na Dellut real, criaríamos a tabela 'profiles' vinculada ao auth.
      setUsers(data);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Trophy className="text-yellow-500" /> Classificação
      </h2>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {users.map((user, index) => (
            <div
              key={user.user_id}
              className={`flex items-center p-4 border-b last:border-0 ${index === 0 ? "bg-yellow-50" : ""}`}
            >
              <div className="font-bold text-gray-500 w-8 text-center">
                {index === 0
                  ? "🥇"
                  : index === 1
                    ? "🥈"
                    : index === 2
                      ? "🥉"
                      : index + 1}
              </div>
              <div className="flex-1 ml-4">
                <p className="font-bold text-gray-800 text-sm">
                  {/* Como não criamos tabela de perfil, mostraremos ID abreviado ou "Você" */}
                  Usuário Dellut ...{user.user_id.slice(0, 4)}
                </p>
              </div>
              <div className="font-bold text-brand-600 text-lg">
                {user.total_points} pts
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Ninguém pontuou ainda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
