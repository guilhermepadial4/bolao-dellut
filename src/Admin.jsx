import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Trash2, Save, CalendarPlus, ShieldAlert } from "lucide-react";

export default function Admin({ session }) {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para novo jogo
  const [newMatch, setNewMatch] = useState({ home: "", away: "", time: "" });

  // --- CONFIGURAÇÃO ---
  // IMPORTANTE: Verifique se este e-mail é EXATAMENTE igual ao login
  const ADMIN_EMAIL = "guilherme@dellut.com.br";

  useEffect(() => {
    // Busca dados iniciais
    fetchData();
  }, []);

  async function fetchData() {
    // Busca jogos
    const { data: matchesData } = await supabase
      .from("matches")
      .select(`*, teams_home:home_team_id(name), teams_away:away_team_id(name)`)
      .order("match_time", { ascending: false });

    // Busca times
    const { data: teamsData } = await supabase.from("teams").select("*");

    setMatches(matchesData || []);
    setTeams(teamsData || []);
    setLoading(false);
  }

  // Criar Jogo
  async function handleCreateMatch(e) {
    e.preventDefault();
    if (!newMatch.home || !newMatch.away || !newMatch.time)
      return alert("Preencha todos os campos!");

    const { error } = await supabase.from("matches").insert({
      home_team_id: newMatch.home,
      away_team_id: newMatch.away,
      match_time: newMatch.time,
      status: "scheduled",
    });

    if (error) alert("Erro ao criar: " + error.message);
    else {
      alert("Jogo criado com sucesso!");
      fetchData();
    }
  }

  // Atualizar Placar e Finalizar
  async function handleUpdateScore(matchId, homeScore, awayScore) {
    if (
      !confirm("Tem certeza? Isso vai finalizar o jogo e atualizar o Ranking.")
    )
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
      alert("Placar atualizado!");
      fetchData();
    }
  }

  // Apagar Jogo
  async function handleDeleteMatch(id) {
    if (!confirm("Tem certeza que deseja apagar este jogo?")) return;
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) alert("Erro ao apagar: " + error.message);
    else fetchData();
  }

  // --- TELA DE DIAGNÓSTICO E SEGURANÇA ---
  if (loading)
    return <div className="p-10 text-center">Carregando painel...</div>;

  // Verifica se o e-mail bate com o admin definido
  if (session?.user?.email !== ADMIN_EMAIL) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-xl text-center shadow-lg">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-600 mb-6">
          Seu usuário não tem permissão de administrador.
        </p>

        <div className="bg-white p-4 rounded border border-gray-300 text-left text-sm">
          <p className="mb-2">
            <strong>E-mail Esperado (Código):</strong> <br />
            <code className="bg-gray-100 p-1 rounded">{ADMIN_EMAIL}</code>
          </p>

          <p>
            <strong>E-mail Logado (Você):</strong> <br />
            <code className="bg-blue-100 text-blue-800 p-1 rounded font-bold">
              {session?.user?.email}
            </code>
          </p>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Copie o "E-mail Logado" acima e atualize a variável{" "}
          <code>ADMIN_EMAIL</code> no código.
        </p>
      </div>
    );
  }

  // --- PAINEL PRINCIPAL ---
  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-xl shadow-md mt-6 mb-20">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <div className="bg-gray-800 p-2 rounded-lg text-white">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Painel Administrativo
          </h2>
          <p className="text-sm text-gray-500">Gerencie jogos e resultados</p>
        </div>
      </div>

      {/* Formulário de Novo Jogo */}
      <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-100 shadow-inner">
        <h3 className="font-bold mb-4 text-gray-700 flex items-center gap-2">
          <CalendarPlus size={20} /> Novo Agendamento
        </h3>
        <form
          onSubmit={handleCreateMatch}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Time Casa
            </label>
            <select
              className="w-full p-2 border rounded bg-white"
              onChange={(e) =>
                setNewMatch({ ...newMatch, home: e.target.value })
              }
            >
              <option value="">Selecionar...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Time Visitante
            </label>
            <select
              className="w-full p-2 border rounded bg-white"
              onChange={(e) =>
                setNewMatch({ ...newMatch, away: e.target.value })
              }
            >
              <option value="">Selecionar...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Data/Hora
            </label>
            <input
              type="datetime-local"
              className="w-full p-2 border rounded bg-white text-sm"
              onChange={(e) =>
                setNewMatch({ ...newMatch, time: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            className="bg-brand-600 text-white px-4 py-2.5 rounded font-bold hover:bg-brand-700 transition shadow-md"
          >
            Criar Jogo
          </button>
        </form>
      </div>

      {/* Lista de Jogos */}
      <h3 className="font-bold mb-4 text-gray-700 pl-2 border-l-4 border-brand-500">
        Jogos Cadastrados
      </h3>
      <div className="space-y-3">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex flex-col md:flex-row items-center justify-between border border-gray-200 p-4 rounded-lg hover:shadow-md transition bg-white"
          >
            {/* Informações */}
            <div className="flex-1 mb-4 md:mb-0 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-lg font-bold text-gray-800">
                <span>{match.teams_home?.name}</span>
                <span className="text-gray-300 text-sm">vs</span>
                <span>{match.teams_away?.name}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                {new Date(match.match_time).toLocaleString("pt-BR")} •{" "}
                {match.status === "finished" ? "Encerrado" : "Agendado"}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg justify-center">
              <input
                type="number"
                placeholder={match.home_score ?? "-"}
                className="w-12 h-10 p-1 border border-gray-300 rounded text-center font-bold"
                id={`home-${match.id}`}
                defaultValue={match.home_score}
              />
              <span className="text-gray-400 font-bold">:</span>
              <input
                type="number"
                placeholder={match.away_score ?? "-"}
                className="w-12 h-10 p-1 border border-gray-300 rounded text-center font-bold"
                id={`away-${match.id}`}
                defaultValue={match.away_score}
              />

              <button
                onClick={() => {
                  const h = document.getElementById(`home-${match.id}`).value;
                  const a = document.getElementById(`away-${match.id}`).value;
                  if (h !== "" && a !== "") handleUpdateScore(match.id, h, a);
                }}
                className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
                title="Salvar Resultado Final"
              >
                <Save size={18} />
              </button>

              <div className="w-px h-8 bg-gray-300 mx-1"></div>

              <button
                onClick={() => handleDeleteMatch(match.id)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition"
                title="Apagar Jogo"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {matches.length === 0 && (
          <p className="text-center text-gray-400 py-10">
            Nenhum jogo cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
