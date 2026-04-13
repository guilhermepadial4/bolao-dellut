import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Save, Lock, AlertCircle } from "lucide-react";
import { useToast } from "./ToastContext"; // Importe o hook useToast

// NOVO: Recebemos o paymentStatus
export default function MatchCard({ match, userId, paymentStatus }) {
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [points, setPoints] = useState(null);

  const showToast = useToast(); // Use o hook useToast

  const matchDate = new Date(match.match_time);
  const now = new Date();

  const isTimeLocked = now >= matchDate || match.status === "finished";
  const isPaymentLocked = paymentStatus !== "paid";

  // O jogo fica bloqueado se o tempo passou OU se não pagou
  const isLocked = isTimeLocked || isPaymentLocked;

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
    if (isPaymentLocked) {
      showToast(
        "Faça o pagamento da inscrição para libertar os seus palpites!",
        "warning",
      );
      return;
    }
    if (isTimeLocked) {
      showToast("Tempo esgotado! Este jogo já está bloqueado.", "warning");
      return;
    }
    if (homeScore === "" || awayScore === "") {
      showToast("Preencha os dois placares!", "warning");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("bets").upsert({
      user_id: userId,
      match_id: match.id,
      home_team_score: parseInt(homeScore),
      away_team_score: parseInt(awayScore),
    });
    setSaving(false);
    if (error) {
      showToast("Erro ao salvar: " + error.message, "error");
    } else {
      showToast("Palpite salvo com sucesso!", "success");
    }
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border overflow-hidden relative ${isPaymentLocked ? "border-red-200" : "border-gray-200"}`}
    >
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
        <div
          className={`text-center text-xs font-semibold uppercase tracking-wide flex justify-center items-center gap-1 mb-4 ${isTimeLocked ? "text-red-500" : "text-gray-400"}`}
        >
          {matchDate.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
          {isTimeLocked && (
            <Lock size={12} className="ml-1" title="Tempo Esgotado" />
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center flex-1">
            <span className="text-3xl mb-2" title={match.teams_home?.name}>
              {match.teams_home?.flag_url}
            </span>
            <span className="font-bold text-gray-700 text-sm text-center line-clamp-1">
              {match.teams_home?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={isLocked}
              className={`w-12 h-14 text-center text-xl font-black rounded-lg border ${isLocked ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-800 border-gray-300 focus:border-brand-500"} outline-none`}
            />
            <span className="text-gray-300 font-bold text-lg">X</span>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={isLocked}
              className={`w-12 h-14 text-center text-xl font-black rounded-lg border ${isLocked ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-800 border-gray-300 focus:border-brand-500"} outline-none`}
            />
          </div>

          <div className="flex flex-col items-center flex-1">
            <span className="text-3xl mb-2" title={match.teams_away?.name}>
              {match.teams_away?.flag_url}
            </span>
            <span className="font-bold text-gray-700 text-sm text-center line-clamp-1">
              {match.teams_away?.name}
            </span>
          </div>
        </div>

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
              Ganhou: {points !== null ? points : 0} pts
            </div>
          </div>
        )}

        {match.status !== "finished" && (
          <button
            onClick={handleSaveBet}
            disabled={isLocked || saving}
            className={`w-full mt-5 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              isPaymentLocked
                ? "bg-red-50 text-red-600 border border-red-200 cursor-not-allowed"
                : isTimeLocked
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-brand-600 text-white hover:bg-brand-700 shadow-md"
            }`}
          >
            {isPaymentLocked ? (
              <>
                {" "}
                <AlertCircle size={18} /> Pendente{" "}
              </>
            ) : isTimeLocked ? (
              <>
                {" "}
                <Lock size={18} /> Encerrado{" "}
              </>
            ) : saving ? (
              "Salvando..."
            ) : (
              <>
                {" "}
                <Save size={18} /> Salvar{" "}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
