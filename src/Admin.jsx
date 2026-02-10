import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function Admin({ session }) {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para novo jogo
  const [newMatch, setNewMatch] = useState({ home: "", away: "", time: "" });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // Busca jogos
    const { data: matchesData } = await supabase
      .from("matches")
      .select(`*, teams_home:home_team_id(name), teams_away:away_team_id(name)`)
      .order("match_time", { ascending: false });

    // Busca times (para o select de criar jogo)
    const { data: teamsData } = await supabase.from("teams").select("*");

    setMatches(matchesData || []);
    setTeams(teamsData || []);
    setLoading(false);
  }

  // Função para criar jogo novo
  async function handleCreateMatch(e) {
    e.preventDefault();
    const { error } = await supabase.from("matches").insert({
      home_team_id: newMatch.home,
      away_team_id: newMatch.away,
      match_time: newMatch.time,
      status: "scheduled",
    });

    if (error) alert("Erro ao criar: " + error.message);
    else {
      alert("Jogo criado!");
      fetchData(); // Recarrega a lista
    }
  }

  // Função para atualizar placar e finalizar jogo
  async function handleUpdateScore(matchId, homeScore, awayScore) {
    if (!confirm("Tem certeza? Isso vai atualizar o ranking de todo mundo!"))
      return;

    const { error } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: "finished",
      })
      .eq("id", matchId);

    if (error) alert("Erro: " + error.message);
    else {
      alert("Placar atualizado e pontos calculados!");
      fetchData();
    }
  }

  // Verifica se é você mesmo (Segurança extra no Front)
  if (session?.user?.email !== "SEU_EMAIL_AQUI@dellut.com.br") {
    return (
      <div className="p-10 text-center text-red-600">Acesso Negado 🚫</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Painel Administrativo 🛠️
      </h2>

      {/* Formulário de Novo Jogo */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
        <h3 className="font-bold mb-4 text-gray-700">Adicionar Novo Jogo</h3>
        <form onSubmit={handleCreateMatch} className="flex gap-4 flex-wrap">
          <select
            className="p-2 border rounded"
            onChange={(e) => setNewMatch({ ...newMatch, home: e.target.value })}
          >
            <option>Time da Casa</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <span className="self-center font-bold">VS</span>

          <select
            className="p-2 border rounded"
            onChange={(e) => setNewMatch({ ...newMatch, away: e.target.value })}
          >
            <option>Visitante</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            className="p-2 border rounded"
            onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
          />

          <button
            type="submit"
            className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700"
          >
            Agendar
          </button>
        </form>
      </div>

      {/* Lista de Jogos para Editar */}
      <h3 className="font-bold mb-4 text-gray-700">Gerenciar Resultados</h3>
      <div className="space-y-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex items-center justify-between border p-4 rounded-lg hover:bg-gray-50"
          >
            <div className="text-sm">
              <span className="font-bold text-gray-800">
                {match.teams_home?.name}
              </span>
              <span className="mx-2 text-gray-400">vs</span>
              <span className="font-bold text-gray-800">
                {match.teams_away?.name}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(match.match_time).toLocaleString("pt-BR")} -{" "}
                {match.status}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={match.home_score ?? "-"}
                className="w-12 p-1 border rounded text-center"
                id={`home-${match.id}`}
              />
              <span>x</span>
              <input
                type="number"
                placeholder={match.away_score ?? "-"}
                className="w-12 p-1 border rounded text-center"
                id={`away-${match.id}`}
              />
              <button
                onClick={() => {
                  const h = document.getElementById(`home-${match.id}`).value;
                  const a = document.getElementById(`away-${match.id}`).value;
                  if (h && a) handleUpdateScore(match.id, h, a);
                }}
                className="bg-green-600 text-white text-xs px-3 py-2 rounded hover:bg-green-700"
              >
                Finalizar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
