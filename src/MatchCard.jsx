import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Save, CheckCircle2 } from "lucide-react";

export default function MatchCard({ match, userId }) {
  // Estado local para os inputs (gols casa e gols fora)
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Verifica se o jogo já passou
  const isLocked = new Date(match.match_time) < new Date();

  // Carrega palpite existente (se houver) ao montar o componente
  useEffect(() => {
    async function loadBet() {
      const { data } = await supabase
        .from("bets")
        .select("home_team_score, away_team_score")
        .eq("match_id", match.id)
        .eq("user_id", userId)
        .single();

      if (data) {
        setHomeScore(data.home_team_score);
        setAwayScore(data.away_team_score);
        setSaved(true);
      }
    }
    loadBet();
  }, [match.id, userId]);

  async function handleSave() {
    if (homeScore === "" || awayScore === "") return;
    setLoading(true);
    setSaved(false);

    // Salva ou Atualiza (Upsert)
    const { error } = await supabase.from("bets").upsert(
      {
        user_id: userId,
        match_id: match.id,
        home_team_score: parseInt(homeScore),
        away_team_score: parseInt(awayScore),
      },
      { onConflict: "user_id, match_id" },
    );

    setLoading(false);
    if (!error) setSaved(true);
    else alert("Erro ao salvar palpite");
  }

  return (
    <div className="bg-white rounded-xl shadow-md border-l-4 border-brand-500 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cabeçalho do Card: Data e Status */}
      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center text-xs text-gray-500">
        <span>
          {new Date(match.match_time).toLocaleString("pt-BR", {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {isLocked ? (
          <span className="text-red-600 font-bold uppercase">Encerrado</span>
        ) : (
          <span className="text-green-600 font-bold uppercase">Aberto</span>
        )}
      </div>

      <div className="p-4 flex flex-col items-center">
        {/* Placar e Times */}
        <div className="flex items-center justify-between w-full mb-6">
          {/* Time Casa */}
          <div className="flex flex-col items-center w-1/3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl mb-2 shadow-sm">
              {match.teams_home?.flag_url || "🏠"}
            </div>
            <span className="text-sm font-bold text-gray-800 text-center leading-tight">
              {match.teams_home?.name || "Time A"}
            </span>
          </div>

          {/* X e Inputs */}
          <div className="flex items-center justify-center space-x-2 w-1/3">
            <input
              type="number"
              value={homeScore}
              onChange={(e) => {
                setHomeScore(e.target.value);
                setSaved(false);
              }}
              disabled={isLocked}
              className="w-10 h-10 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-brand-500 focus:ring-brand-500 outline-none transition disabled:bg-gray-100"
            />
            <span className="text-gray-400 font-light">X</span>
            <input
              type="number"
              value={awayScore}
              onChange={(e) => {
                setAwayScore(e.target.value);
                setSaved(false);
              }}
              disabled={isLocked}
              className="w-10 h-10 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-brand-500 focus:ring-brand-500 outline-none transition disabled:bg-gray-100"
            />
          </div>

          {/* Time Visitante */}
          <div className="flex flex-col items-center w-1/3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl mb-2 shadow-sm">
              {match.teams_away?.flag_url || "✈️"}
            </div>
            <span className="text-sm font-bold text-gray-800 text-center leading-tight">
              {match.teams_away?.name || "Time B"}
            </span>
          </div>
        </div>

        {/* Botão de Salvar */}
        {!isLocked && (
          <button
            onClick={handleSave}
            disabled={loading || homeScore === "" || awayScore === ""}
            className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
              saved
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-brand-500 text-white hover:bg-brand-600 shadow-md"
            }`}
          >
            {loading ? (
              "Salvando..."
            ) : saved ? (
              <>
                {" "}
                <CheckCircle2 size={16} className="mr-1" /> Palpite Salvo{" "}
              </>
            ) : (
              <>
                {" "}
                <Save size={16} className="mr-1" /> Confirmar Palpite{" "}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
