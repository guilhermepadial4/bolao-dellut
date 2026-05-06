import { Lock, AlertCircle, Pencil, CheckCircle2 } from "lucide-react";

export default function MatchCard({
  match,
  paymentStatus,
  homeScore,
  awayScore,
  points,
  onChangeHome,
  onChangeAway,
}) {
  const matchDate = new Date(match.match_time);
  const now = new Date();

  // Bloqueia se o jogo já começou/terminou OU se o usuário não pagou
  const isTimeLocked = now >= matchDate || match.status === "finished";
  const isPaymentLocked = paymentStatus !== "paid";
  const isLocked = isTimeLocked || isPaymentLocked;

  // Verifica se o usuário já preencheu os dois campos
  const isFilled = homeScore !== "" && awayScore !== "";
  // Verifica se está totalmente vazio (para chamar a atenção)
  const isEmpty = homeScore === "" || awayScore === "";

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border overflow-hidden relative transition-all ${
        isPaymentLocked
          ? "border-red-200"
          : !isLocked && isEmpty
            ? "border-brand-300 ring-1 ring-brand-100"
            : "border-gray-200"
      }`}
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
          className={`text-center text-xs font-semibold uppercase tracking-wide flex justify-center items-center gap-1 mb-4 ${
            isTimeLocked ? "text-red-500" : "text-gray-400"
          }`}
        >
          {matchDate.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          })}

          {isTimeLocked && (
            <Lock size={12} className="ml-1" title="Tempo Esgotado" />
          )}
          {isPaymentLocked && !isTimeLocked && (
            <AlertCircle
              size={12}
              className="ml-1 text-red-500"
              title="Pagamento Pendente"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center flex-1">
            <span className="text-4xl mb-2" title={match.teams_home?.name}>
              {match.teams_home?.flag}
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
              onChange={(e) => onChangeHome(e.target.value)}
              disabled={isLocked}
              placeholder="-"
              className={`w-12 h-14 text-center text-xl font-black rounded-lg border outline-none transition-all ${
                isLocked
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : isEmpty
                    ? "bg-brand-50 text-brand-700 border-brand-300 shadow-inner focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 placeholder:text-brand-300"
                    : "bg-white text-gray-800 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              }`}
            />
            <span className="text-gray-300 font-bold text-lg">X</span>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => onChangeAway(e.target.value)}
              disabled={isLocked}
              placeholder="-"
              className={`w-12 h-14 text-center text-xl font-black rounded-lg border outline-none transition-all ${
                isLocked
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : isEmpty
                    ? "bg-brand-50 text-brand-700 border-brand-300 shadow-inner focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-200 placeholder:text-brand-300"
                    : "bg-white text-gray-800 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              }`}
            />
          </div>

          <div className="flex flex-col items-center flex-1">
            <span className="text-4xl mb-2" title={match.teams_away?.name}>
              {match.teams_away?.flag}
            </span>
            <span className="font-bold text-gray-700 text-sm text-center line-clamp-1">
              {match.teams_away?.name}
            </span>
          </div>
        </div>

        {/* FEEDBACK VISUAL INTUITIVO */}
        {!isLocked && (
          <div className="mt-4 flex justify-center h-6">
            {isEmpty ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full animate-pulse border border-brand-100">
                <Pencil size={12} /> Toque para palpitar
              </span>
            ) : isFilled ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <CheckCircle2 size={14} className="text-green-500" /> Palpite
                preenchido
              </span>
            ) : null}
          </div>
        )}

        {/* RESULTADO FINAL (Aparece apenas quando o jogo acaba) */}
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
      </div>
    </div>
  );
}
