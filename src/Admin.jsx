import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Trash2,
  Save,
  CalendarPlus,
  ShieldAlert,
  Trophy,
  Medal,
  Award,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function Admin({ session }) {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newMatch, setNewMatch] = useState({
    home: "",
    away: "",
    time: "",
    phase: "groups",
  });
  const [finalResult, setFinalResult] = useState({
    champion: "",
    runner_up: "",
    third_place: "",
  });

  // NOVO: Estado para a lista de usuários e pagamentos
  const [usersFinance, setUsersFinance] = useState([]);

  const ADMIN_EMAIL = "guilherme@dellut.com.br";

  useEffect(() => {
    if (session?.user?.email === ADMIN_EMAIL) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [session]);

  async function fetchData() {
    setLoading(true);

    const { data: matchesData } = await supabase
      .from("matches")
      .select(`*, teams_home:home_team_id(name), teams_away:away_team_id(name)`)
      .order("match_time", { ascending: false });

    const { data: teamsData } = await supabase
      .from("teams")
      .select("*")
      .order("name");

    const { data: settingsData } = await supabase
      .from("tournament_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    // NOVO: Busca a lista de usuários e o status de pagamento
    const { data: financeData } = await supabase.rpc(
      "get_admin_users_with_payments",
    );

    setMatches(matchesData || []);
    setTeams(teamsData || []);
    setUsersFinance(financeData || []);

    if (settingsData) {
      setFinalResult({
        champion: settingsData.champion_id || "",
        runner_up: settingsData.runner_up_id || "",
        third_place: settingsData.third_place_id || "",
      });
    }

    setLoading(false);
  }

  // --- FUNÇÕES FINANCEIRAS ---
  async function handleTogglePayment(userId, currentStatus) {
    const newStatus = currentStatus === "paid" ? "pending" : "paid";

    const { error } = await supabase.from("payments").upsert({
      user_id: userId,
      status: newStatus,
      updated_at: new Date(),
    });

    if (error) alert("Erro ao atualizar pagamento: " + error.message);
    else fetchData(); // Recarrega a lista para mostrar a cor atualizada
  }

  // --- FUNÇÕES DE JOGOS E RESULTADO (Mantidas) ---
  async function handleCreateMatch(e) {
    e.preventDefault();
    if (!newMatch.home || !newMatch.away || !newMatch.time)
      return alert("Preencha os times e a data!");

    const { error } = await supabase.from("matches").insert({
      home_team_id: newMatch.home,
      away_team_id: newMatch.away,
      match_time: newMatch.time,
      phase: newMatch.phase,
      status: "scheduled",
    });

    if (error) alert("Erro ao criar: " + error.message);
    else {
      alert("Jogo criado com sucesso!");
      fetchData();
    }
  }

  async function handleUpdateScore(matchId, homeScore, awayScore) {
    if (
      !confirm(
        "Confirmar resultado final? Isso vai calcular os pontos de todos.",
      )
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
      alert("Placar atualizado e pontos calculados!");
      fetchData();
    }
  }

  async function handleDeleteMatch(id) {
    if (
      !confirm(
        "Tem certeza que deseja apagar este jogo? Todos os palpites dele serão apagados!",
      )
    )
      return;
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) alert("Erro ao apagar: " + error.message);
    else fetchData();
  }

  async function handleSaveTournamentResult() {
    if (
      !confirm(
        "ATENÇÃO: Isso vai definir os campeões e distribuir MUITOS pontos no Ranking. Tem certeza?",
      )
    )
      return;
    const { error } = await supabase.from("tournament_settings").upsert({
      id: 1,
      champion_id: finalResult.champion || null,
      runner_up_id: finalResult.runner_up || null,
      third_place_id: finalResult.third_place || null,
    });
    if (error) alert("Erro ao salvar resultado final: " + error.message);
    else alert("🏆 Resultado da Copa salvo! O Ranking foi atualizado.");
  }

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse">Carregando painel...</div>
    );

  if (session?.user?.email !== ADMIN_EMAIL) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-xl text-center shadow-lg">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-600 mb-6">
          Você não tem permissão de administrador.
        </p>
      </div>
    );
  }

  // Conta quantos já pagaram para o resumo
  const paidCount = usersFinance.filter(
    (u) => u.payment_status === "paid",
  ).length;
  const totalCount = usersFinance.length;

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white rounded-xl shadow-md mt-6 mb-24">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-8 border-b pb-4">
        <div className="bg-gray-800 p-2 rounded-lg text-white">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Painel Administrativo
          </h2>
          <p className="text-sm text-gray-500">
            Gerencie jogos, pagamentos e resultados finais
          </p>
        </div>
      </div>

      {/* --- NOVA SEÇÃO: CONTROLE FINANCEIRO --- */}
      <div className="bg-blue-50 p-6 rounded-xl mb-10 border border-blue-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-blue-800 text-lg flex items-center gap-2">
            <DollarSign size={20} /> CONTROLE FINANCEIRO
          </h3>
          <div className="bg-white px-3 py-1 rounded-full text-sm font-bold text-blue-700 border border-blue-200 shadow-sm">
            Caixa: {paidCount} / {totalCount} pagaram (R$ {paidCount * 60},00)
          </div>
        </div>

        <p className="text-xs text-blue-700 mb-4">
          Clique no botão para marcar se o usuário já fez o Pix da inscrição.
        </p>

        <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
          {usersFinance.map((user, index) => (
            <div
              key={user.user_id}
              className={`flex items-center justify-between p-3 border-b border-blue-50 hover:bg-gray-50 transition ${index % 2 === 0 ? "bg-white" : "bg-blue-50/30"}`}
            >
              <div className="font-medium text-gray-700 text-sm">
                {user.email}
              </div>

              <button
                onClick={() =>
                  handleTogglePayment(user.user_id, user.payment_status)
                }
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm ${
                  user.payment_status === "paid"
                    ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                    : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                }`}
              >
                {user.payment_status === "paid" ? (
                  <>
                    <CheckCircle size={14} /> PAGO
                  </>
                ) : (
                  <>
                    <XCircle size={14} /> PENDENTE
                  </>
                )}
              </button>
            </div>
          ))}
          {usersFinance.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-400">
              Nenhum usuário cadastrado.
            </div>
          )}
        </div>
      </div>

      <hr className="my-8 border-gray-200" />

      {/* --- SEÇÃO: DEFINIÇÃO DO PÓDIO --- */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl mb-10 border border-yellow-200 shadow-sm">
        <h3 className="font-black text-yellow-800 text-lg mb-4 flex items-center gap-2">
          <Trophy size={20} /> RESULTADO FINAL DA COPA
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-bold text-yellow-600 uppercase mb-1 block flex items-center gap-1">
              <Trophy size={12} /> Campeão (1º)
            </label>
            <select
              className="w-full p-2 border border-yellow-300 rounded bg-white font-bold"
              value={finalResult.champion}
              onChange={(e) =>
                setFinalResult({ ...finalResult, champion: e.target.value })
              }
            >
              <option value="">Indefinido</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1">
              <Medal size={12} /> Vice-Campeão (2º)
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded bg-white font-bold"
              value={finalResult.runner_up}
              onChange={(e) =>
                setFinalResult({ ...finalResult, runner_up: e.target.value })
              }
            >
              <option value="">Indefinido</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-orange-600 uppercase mb-1 block flex items-center gap-1">
              <Award size={12} /> 3º Lugar
            </label>
            <select
              className="w-full p-2 border border-orange-300 rounded bg-white font-bold"
              value={finalResult.third_place}
              onChange={(e) =>
                setFinalResult({ ...finalResult, third_place: e.target.value })
              }
            >
              <option value="">Indefinido</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveTournamentResult}
          className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-700 transition w-full md:w-auto shadow-sm flex items-center justify-center gap-2"
        >
          <Save size={18} /> Salvar Resultado da Copa
        </button>
      </div>

      <hr className="my-8 border-gray-200" />

      {/* --- SEÇÃO: GERENCIAR JOGOS --- */}
      <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-100 shadow-inner">
        <h3 className="font-bold mb-4 text-gray-700 flex items-center gap-2">
          <CalendarPlus size={20} /> Novo Jogo
        </h3>
        <form
          onSubmit={handleCreateMatch}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Fase
            </label>
            <select
              className="w-full p-2 border border-brand-300 rounded bg-brand-50 font-bold text-brand-700 text-sm"
              onChange={(e) =>
                setNewMatch({ ...newMatch, phase: e.target.value })
              }
              value={newMatch.phase}
            >
              <option value="groups">Grupos</option>
              <option value="knockout">Mata-Mata</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">
              Casa
            </label>
            <select
              className="w-full p-2 border rounded bg-white text-sm"
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
              Visitante
            </label>
            <select
              className="w-full p-2 border rounded bg-white text-sm"
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
              Data
            </label>
            <input
              type="datetime-local"
              className="w-full p-2 border rounded bg-white text-xs"
              onChange={(e) =>
                setNewMatch({ ...newMatch, time: e.target.value })
              }
            />
          </div>
          <button
            type="submit"
            className="bg-brand-600 text-white px-4 py-2 rounded font-bold hover:bg-brand-700 transition shadow-md text-sm h-[38px]"
          >
            Criar
          </button>
        </form>
      </div>

      <h3 className="font-bold mb-4 text-gray-700 pl-2 border-l-4 border-brand-500">
        Lista de Jogos
      </h3>
      <div className="space-y-3">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex flex-col md:flex-row items-center justify-between border border-gray-200 p-4 rounded-lg hover:shadow-md transition bg-white"
          >
            <div className="flex-1 mb-4 md:mb-0 text-center md:text-left">
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${match.phase === "knockout" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
              >
                {match.phase === "knockout" ? "🔥 Mata-Mata" : "📊 Grupos"}
              </span>
              <div className="flex items-center justify-center md:justify-start gap-2 text-lg font-bold text-gray-800 mt-2">
                <span>{match.teams_home?.name}</span>
                <span className="text-gray-300 text-sm">vs</span>
                <span>{match.teams_away?.name}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                {new Date(match.match_time).toLocaleString("pt-BR")} •{" "}
                {match.status === "finished" ? "Encerrado" : "Agendado"}
              </div>
            </div>

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
                title="Salvar Placar"
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
      </div>
    </div>
  );
}
