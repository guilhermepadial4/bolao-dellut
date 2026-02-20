import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Save, Lock } from "lucide-react";

export default function MatchCard({ match, userId }) {
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [points, setPoints] = useState(null);

  // ==========================================
  // LÓGICA DE BLOQUEIO (TRAVA DE SEGURANÇA)
  // ==========================================
  const matchDate = new Date(match.match_time);
  const now = new Date();

  // Opção 1 (Ativa): Bloqueia exatamente na hora que o jogo começa
  const isLocked = now >= matchDate || match.status === "finished";

  // Opção 2: Se quiser bloquear EXATAMENTE 24 horas (1 dia) antes como diz seu regulamento,
  // apague a linha de cima e tire os comentários (//) da linha de baixo:
  // const isLocked = now >= new Date(matchDate.getTime() - 24 * 60 * 60 * 1000) || match.status === 'finished'

  useEffect(() => {
    async function fetchBet() {
      const { data } = await supabase
        .from("bets")
        .select("home_team_score, away_team_score, points")
        .eq("match_id", match.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setHomeScore(data.home_team_score);
        setAwayScore(data.away_team_score);
        setPoints(data.points);
      }
    }
    fetchBet();
  }, [match.id, userId]);

  async function handleSaveBet() {
    if (isLocked) {
      return alert(
        "Tempo esgotado! Este jogo já está bloqueado para palpites.",
      );
    }
    if (homeScore === "" || awayScore === "") {
      return alert("Preencha os dois placares!");
    }

    setSaving(true);
    const { error } = await supabase.from("bets").upsert({
      user_id: userId,
      match_id: match.id,
      home_team_score: parseInt(homeScore),
      away_team_score: parseInt(awayScore),
    });

    setSaving(false);
    if (error) alert("Erro ao salvar: " + error.message);
    else alert("Palpite salvo com sucesso!");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      {/* Etiqueta da Fase do Jogo */}
      <div
        className={`p-2 text-center text-xs font-bold uppercase tracking-wider text-white ${
          match.phase === "knockout" ? "bg-orange-500" : "bg-brand-600"
        }`}
      >
        {match.phase === "knockout"
          ? "🔥 Mata-Mata (8/5 pts)"
          : "📊 Fase de Grupos (5/3 pts)"}
      </div>

      <div className="p-5">
        {/* Data e Hora com Ícone de Cadeado se estiver bloqueado */}
        <div
          className={`text-center text-xs font-semibold uppercase tracking-wide flex justify-center items-center gap-1 mb-4 ${isLocked ? "text-red-500" : "text-gray-400"}`}
        >
          {matchDate.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
          {isLocked && <Lock size={12} className="ml-1" title="Bloqueado" />}
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Time Casa */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-3xl mb-2" title={match.teams_home?.name}>
              {match.teams_home?.flag_url}
            </span>
            <span className="font-bold text-gray-700 text-sm text-center line-clamp-1">
              {match.teams_home?.name}
            </span>
          </div>

          {/* Caixinhas de Placar */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={isLocked}
              className={`w-12 h-14 text-center text-xl font-black rounded-lg border ${isLocked ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-800 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"} outline-none transition`}
            />
            <span className="text-gray-300 font-bold text-lg">X</span>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={isLocked}
              className={`w-12 h-14 text-center text-xl font-black rounded-lg border ${isLocked ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-800 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"} outline-none transition`}
            />
          </div>

          {/* Time Visitante */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-3xl mb-2" title={match.teams_away?.name}>
              {match.teams_away?.flag_url}
            </span>
            <span className="font-bold text-gray-700 text-sm text-center line-clamp-1">
              {match.teams_away?.name}
            </span>
          </div>
        </div>

        {/* Mostra Resultado Oficial e Pontos ganhos se o jogo acabou */}
        {match.status === "finished" && (
          <div className="mt-4 bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
              Resultado Oficial
            </p>
            <p className="text-xl font-black text-gray-800 bg-white inline-block px-4 py-1 rounded border border-gray-100 shadow-sm">
              {match.home_score} <span className="text-gray-300 mx-1">x</span>{" "}
              {match.away_score}
            </p>
            <div className="mt-2 text-sm font-bold text-green-600 bg-green-50 py-1 rounded">
              Você ganhou: {points !== null ? points : 0} pts
            </div>
          </div>
        )}

        {/* Botão Salvar (Some se o jogo acabou, fica cinza se bloqueado) */}
        {match.status !== "finished" && (
          <button
            onClick={handleSaveBet}
            disabled={isLocked || saving}
            className={`w-full mt-5 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              isLocked
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                : "bg-brand-600 text-white hover:bg-brand-700 shadow-md"
            }`}
          >
            {isLocked ? (
              <>
                {" "}
                <Lock size={18} /> Aposta Encerrada{" "}
              </>
            ) : saving ? (
              "Salvando..."
            ) : (
              <>
                {" "}
                <Save size={18} /> Salvar Palpite{" "}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
