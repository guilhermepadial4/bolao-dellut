import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Trash2,
  Save,
  ShieldAlert,
  Trophy,
  DollarSign,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import { useToast } from "./ToastContext";

export default function Admin({ session }) {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersFinance, setUsersFinance] = useState([]);

  // ADICIONADO O CAMPO 'round' NO ESTADO INICIAL
  const [newMatch, setNewMatch] = useState({
    home: "",
    away: "",
    time: "",
    phase: "groups",
    round: "1",
  });

  const [finalResult, setFinalResult] = useState({
    champion: "",
    runner_up: "",
    third_place: "",
  });

  const [syncing, setSyncing] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const showToast = useToast();
  const ADMIN_EMAIL = "guilherme@dellut.com.br";

  const teamDictionary = {
    Brazil: "Brasil",
    Argentina: "Argentina",
    France: "França",
    Germany: "Alemanha",
    Spain: "Espanha",
    England: "Inglaterra",
    Portugal: "Portugal",
    Netherlands: "Holanda",
    Italy: "Itália",
    Belgium: "Bélgica",
    Uruguai: "Uruguai",
    Colombia: "Colômbia",
    Croatia: "Croácia",
    "United States": "Estados Unidos",
    Mexico: "México",
    Japan: "Japão",
    Morocco: "Marrocos",
    Senegal: "Senegal",
    Switzerland: "Suíça",
    "South Korea": "Coreia do Sul",
    Ecuador: "Equador",
    Canada: "Canadá",
    Cameroon: "Camarões",
    Ghana: "Gana",
    Serbia: "Sérvia",
    Poland: "Polônia",
    Australia: "Austrália",
    Iran: "Irã",
    "Saudi Arabia": "Arábia Saudita",
    "Costa Rica": "Costa Rica",
    Wales: "País de Gales",
    Tunisia: "Tunísia",
    Qatar: "Catar",
  };

  useEffect(() => {
    if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
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

  async function handleSyncWithAPI() {
    if (!apiKey) {
      showToast("Por favor, cole sua API Key do football-data.org!", "warning");
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch(
        "https://api.football-data.org/v4/competitions/2000/matches",
        { headers: { "X-Auth-Token": apiKey } },
      );

      const data = await response.json();
      if (data.errorCode) throw new Error(data.message);
      if (!data.matches) throw new Error("Nenhum jogo encontrado na API.");

      let updatedCount = 0;
      let createdCount = 0;

      for (const apiMatch of data.matches) {
        const homeNamePT =
          teamDictionary[apiMatch.homeTeam.name] || apiMatch.homeTeam.name;
        const awayNamePT =
          teamDictionary[apiMatch.awayTeam.name] || apiMatch.awayTeam.name;

        const homeTeam = teams.find(
          (t) => t.name.toLowerCase() === homeNamePT.toLowerCase(),
        );
        const awayTeam = teams.find(
          (t) => t.name.toLowerCase() === awayNamePT.toLowerCase(),
        );

        if (homeTeam && awayTeam) {
          const existingMatch = matches.find(
            (m) =>
              (m.home_team_id === homeTeam.id &&
                m.away_team_id === awayTeam.id) ||
              (m.home_team_id === awayTeam.id &&
                m.away_team_id === homeTeam.id),
          );

          const status =
            apiMatch.status === "FINISHED" ? "finished" : "scheduled";
          const matchData = {
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            match_time: apiMatch.utcDate,
            status: status,
            home_score: apiMatch.score.fullTime.home,
            away_score: apiMatch.score.fullTime.away,
            phase: apiMatch.stage === "GROUP_STAGE" ? "groups" : "knockout",
          };

          if (existingMatch) {
            if (
              existingMatch.status !== status ||
              existingMatch.home_score !== matchData.home_score
            ) {
              await supabase
                .from("matches")
                .update(matchData)
                .eq("id", existingMatch.id);
              updatedCount++;
            }
          } else {
            await supabase.from("matches").insert(matchData);
            createdCount++;
          }
        }
      }

      showToast(
        `Sincronizado! Criados: ${createdCount}, Atualizados: ${updatedCount}`,
        "success",
      );
      fetchData();
    } catch (error) {
      showToast("Erro na sincronização: " + error.message, "error");
    } finally {
      setSyncing(false);
    }
  }

  async function handleTogglePayment(userId, currentStatus) {
    const newStatus = currentStatus === "paid" ? "pending" : "paid";
    const { error } = await supabase
      .from("payments")
      .upsert({ user_id: userId, status: newStatus, updated_at: new Date() });
    if (error)
      showToast("Erro ao atualizar pagamento: " + error.message, "error");
    else {
      showToast("Status de pagamento atualizado!", "success");
      fetchData();
    }
  }

  async function handleCreateMatch(e) {
    e.preventDefault();
    if (!newMatch.home || !newMatch.away || !newMatch.time) {
      showToast("Preencha todos os campos para criar o jogo!", "warning");
      return;
    }

    const dataCorrigida = new Date(newMatch.time).toISOString();

    const { error } = await supabase.from("matches").insert({
      home_team_id: newMatch.home,
      away_team_id: newMatch.away,
      match_time: dataCorrigida,
      phase: newMatch.phase,
      status: "scheduled",
      round: parseInt(newMatch.round), // ADICIONADO A INSERÇÃO DA RODADA
    });

    if (error) showToast("Erro ao criar jogo: " + error.message, "error");
    else {
      showToast("Jogo criado com sucesso!", "success");
      fetchData();
      // RESETANDO COM O CAMPO ROUND
      setNewMatch({
        home: "",
        away: "",
        time: "",
        phase: "groups",
        round: "1",
      });
    }
  }

  async function handleUpdateScore(matchId, homeScore, awayScore) {
    if (!confirm("Confirmar resultado final?")) return;
    const { error } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: "finished",
      })
      .eq("id", matchId);
    if (error) showToast("Erro ao atualizar placar: " + error.message, "error");
    else {
      showToast("Placar atualizado com sucesso!", "success");
      fetchData();
    }
  }

  async function handleDeleteMatch(id) {
    if (!confirm("Apagar jogo?")) return;
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) showToast("Erro ao deletar jogo: " + error.message, "error");
    else {
      showToast("Jogo deletado com sucesso!", "success");
      fetchData();
    }
  }

  async function handleSaveTournamentResult() {
    if (!confirm("Salvar resultado da Copa?")) return;
    const { error } = await supabase.from("tournament_settings").upsert({
      id: 1,
      champion_id: finalResult.champion || null,
      runner_up_id: finalResult.runner_up || null,
      third_place_id: finalResult.third_place || null,
    });
    if (error)
      showToast("Erro ao salvar pódio final: " + error.message, "error");
    else showToast("🏆 Pódio final salvo com sucesso!", "success");
  }

  if (loading)
    return (
      <div className="text-center p-10 animate-pulse text-gray-500">
        Carregando painel...
      </div>
    );

  if (session?.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())
    return (
      <div className="text-center p-10 text-red-500 font-bold">
        Acesso Negado
      </div>
    );

  const paidCount = usersFinance.filter(
    (u) => u.payment_status === "paid",
  ).length;

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white rounded-xl shadow-md mt-6 mb-24">
      <div className="flex items-center gap-2 mb-8 border-b pb-4">
        <div className="bg-gray-800 p-2 rounded-lg text-white">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Painel Administrativo
          </h2>
          <p className="text-sm text-gray-500">Gerencie tudo por aqui</p>
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-xl mb-10 border border-indigo-200 shadow-sm">
        <h3 className="font-black text-indigo-800 text-lg flex items-center gap-2 mb-2">
          <UploadCloud size={20} /> AUTOMAÇÃO DE JOGOS
        </h3>
        <p className="text-xs text-indigo-700 mb-4">
          Não cadastre na mão! Cole sua chave da{" "}
          <strong>football-data.org</strong> abaixo para importar jogos e
          atualizar placares automaticamente.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Cole sua API Key aqui..."
            className="flex-1 p-2 border border-indigo-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            onClick={handleSyncWithAPI}
            disabled={syncing}
            className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {syncing ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <RefreshCw size={18} />
            )}
            {syncing ? "Buscando..." : "Sincronizar"}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl mb-10 border border-blue-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-blue-800 text-lg flex items-center gap-2">
            <DollarSign size={20} /> FINANCEIRO
          </h3>
          <div className="bg-white px-3 py-1 rounded-full text-sm font-bold text-blue-700 border border-blue-200">
            Caixa: R$ {paidCount * 60},00
          </div>
        </div>
        <div className="bg-white rounded-lg border border-blue-100 overflow-hidden max-h-60 overflow-y-auto">
          {usersFinance.map((user, i) => (
            <div
              key={user.user_id}
              className={`flex justify-between p-3 border-b ${i % 2 === 0 ? "bg-white" : "bg-blue-50/30"}`}
            >
              <span className="text-sm text-gray-700">{user.email}</span>
              <button
                onClick={() =>
                  handleTogglePayment(user.user_id, user.payment_status)
                }
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-transform active:scale-95 ${user.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}
              >
                {user.payment_status === "paid" ? "PAGO ✅" : "PENDENTE 💳"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 p-6 rounded-xl mb-10 border border-yellow-200">
        <h3 className="font-bold text-yellow-800 mb-4 flex gap-2">
          <Trophy size={20} /> RESULTADO FINAL
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <select
            className="p-2 border rounded text-xs outline-none"
            value={finalResult.champion}
            onChange={(e) =>
              setFinalResult({ ...finalResult, champion: e.target.value })
            }
          >
            <option value="">Campeão</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            className="p-2 border rounded text-xs outline-none"
            value={finalResult.runner_up}
            onChange={(e) =>
              setFinalResult({ ...finalResult, runner_up: e.target.value })
            }
          >
            <option value="">Vice</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            className="p-2 border rounded text-xs outline-none"
            value={finalResult.third_place}
            onChange={(e) =>
              setFinalResult({ ...finalResult, third_place: e.target.value })
            }
          >
            <option value="">3º Lugar</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSaveTournamentResult}
          className="bg-yellow-600 text-white w-full py-2 rounded font-bold text-sm hover:bg-yellow-700 transition"
        >
          Salvar Pódio
        </button>
      </div>

      <h3 className="font-bold mb-4 text-gray-700 pl-2 border-l-4 border-brand-500">
        Gerenciar Jogos
      </h3>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">
          Criação Manual
        </p>
        <form
          onSubmit={handleCreateMatch}
          className="flex flex-wrap gap-2 items-end"
        >
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] text-gray-500 font-bold ml-1">
              Fase
            </label>
            <select
              className="w-full p-2 border rounded text-xs outline-none focus:border-brand-500"
              onChange={(e) =>
                setNewMatch({ ...newMatch, phase: e.target.value })
              }
              value={newMatch.phase}
            >
              <option value="groups">Fase de Grupos</option>
              <option value="knockout">Mata-Mata</option>
            </select>
          </div>

          {/* ADICIONADO CAMPO DE RODADA AQUI */}
          <div className="flex-1 min-w-[80px]">
            <label className="text-[10px] text-gray-500 font-bold ml-1">
              Rodada
            </label>
            <select
              className="w-full p-2 border rounded text-xs outline-none focus:border-brand-500"
              onChange={(e) =>
                setNewMatch({ ...newMatch, round: e.target.value })
              }
              value={newMatch.round}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] text-gray-500 font-bold ml-1">
              Casa
            </label>
            <select
              className="w-full p-2 border rounded text-xs outline-none focus:border-brand-500"
              onChange={(e) =>
                setNewMatch({ ...newMatch, home: e.target.value })
              }
              value={newMatch.home}
            >
              <option value="">Equipe Casa...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] text-gray-500 font-bold ml-1">
              Visitante
            </label>
            <select
              className="w-full p-2 border rounded text-xs outline-none focus:border-brand-500"
              onChange={(e) =>
                setNewMatch({ ...newMatch, away: e.target.value })
              }
              value={newMatch.away}
            >
              <option value="">Equipe Visitante...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] text-gray-500 font-bold ml-1">
              Data e Hora
            </label>
            <input
              type="datetime-local"
              className="w-full p-2 border rounded text-xs outline-none focus:border-brand-500"
              onChange={(e) =>
                setNewMatch({ ...newMatch, time: e.target.value })
              }
              value={newMatch.time}
            />
          </div>
          <button
            type="submit"
            className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-brand-700 transition h-8 self-end mb-[2px]"
          >
            Criar Jogo
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex items-center justify-between border p-3 rounded bg-white shadow-sm"
          >
            <div className="text-xs">
              <span className="font-bold text-gray-700 block">
                {match.teams_home?.name} x {match.teams_away?.name}
              </span>
              <div className="text-gray-400 mt-1 flex items-center gap-2">
                <span>
                  {new Date(match.match_time).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${match.phase === "knockout" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {match.phase === "knockout" ? "Mata-Mata" : "Fase de Grupos"}
                </span>
                {/* Opcional: exibir a rodada aqui também */}
                {match.round && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                    Rodada {match.round}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-10 border text-center font-bold outline-none focus:border-brand-500 rounded"
                defaultValue={match.home_score}
                id={`h-${match.id}`}
              />
              <input
                type="number"
                className="w-10 border text-center font-bold outline-none focus:border-brand-500 rounded"
                defaultValue={match.away_score}
                id={`a-${match.id}`}
              />
              <button
                onClick={() =>
                  handleUpdateScore(
                    match.id,
                    document.getElementById(`h-${match.id}`).value,
                    document.getElementById(`a-${match.id}`).value,
                  )
                }
                className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200 transition"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => handleDeleteMatch(match.id)}
                className="bg-red-50 text-red-400 p-2 rounded hover:bg-red-100 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
