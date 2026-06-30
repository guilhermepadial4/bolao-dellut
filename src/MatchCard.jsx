import { Lock } from "lucide-react";

export default function MatchCard({
  match,
  homeScore,
  awayScore,
  points,
  onChangeHome,
  onChangeAway,
  isLockedOverride,
}) {
  const isLocked =
    isLockedOverride !== undefined
      ? isLockedOverride
      : new Date() > new Date(match.match_time) || match.status === "finished";

  const canEdit = !isLocked;

  const matchDate = new Date(match.match_time).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const renderTeamBadge = (team) => {
    if (team?.flag) {
      if (team.flag.startsWith("http")) {
        return (
          <img
            src={team.flag}
            alt={team.name}
            className="w-11 h-8 object-cover rounded-sm border border-gray-200 mb-2 shadow-sm"
          />
        );
      }
      return (
        <div className="w-11 h-8 bg-gray-50 rounded flex items-center justify-center text-2xl shadow-sm border border-gray-200 mb-2">
          {team.flag}
        </div>
      );
    }
    return (
      <div className="w-11 h-8 bg-gray-100 rounded flex items-center justify-center shadow-sm border border-gray-200 mb-2">
        <span className="text-[10px] font-black text-gray-400">
          {team?.name?.substring(0, 3).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative transition-all hover:shadow-md">
      {/* CABEÇALHO VERMELHO */}
      <div className="bg-brand-700 text-white text-center py-2 text-xs font-black tracking-wider flex items-center justify-center gap-2">
        <span className="text-base">🏆</span>
        {match.phase === "knockout"
          ? "MATA-MATA (5/3 PTS)"
          : "FASE DE GRUPOS (5/3 PTS)"}
      </div>

      <div className="p-4 flex-grow flex flex-col">
        {/* DATA E CADEADO */}
        <div className="text-center mb-4 flex items-center justify-center gap-2">
          <span className="text-brand-600 text-xs font-bold">{matchDate}</span>
          {isLocked && <Lock size={14} className="text-brand-600" />}
        </div>

        {/* ÁREA DOS TIMES E PLACAR */}
        <div className="flex items-center justify-between mb-6">
          {/* TIME DA CASA */}
          <div className="flex flex-col items-center flex-1 w-24">
            {renderTeamBadge(match.teams_home)}
            <span className="text-[10px] md:text-xs font-bold text-gray-700 text-center uppercase leading-tight">
              {match.teams_home?.name}
            </span>
          </div>

          {/* INPUTS DE PONTUAÇÃO */}
          <div className="flex items-center gap-2 md:gap-3 px-2">
            <input
              type="number"
              min="0"
              max="20"
              value={homeScore}
              onChange={(e) => onChangeHome(e.target.value)}
              disabled={!canEdit}
              className={`w-10 h-10 md:w-12 md:h-12 text-center text-lg md:text-xl font-black rounded-lg outline-none transition-all ${
                canEdit
                  ? "border-2 border-gray-300 focus:border-brand-500 text-gray-800 shadow-inner"
                  : "border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            />

            <span className="text-gray-300 font-black text-sm md:text-lg">
              X
            </span>

            <input
              type="number"
              min="0"
              max="20"
              value={awayScore}
              onChange={(e) => onChangeAway(e.target.value)}
              disabled={!canEdit}
              className={`w-10 h-10 md:w-12 md:h-12 text-center text-lg md:text-xl font-black rounded-lg outline-none transition-all ${
                canEdit
                  ? "border-2 border-gray-300 focus:border-brand-500 text-gray-800 shadow-inner"
                  : "border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            />
          </div>

          {/* TIME VISITANTE */}
          <div className="flex flex-col items-center flex-1 w-24">
            {renderTeamBadge(match.teams_away)}
            <span className="text-[10px] md:text-xs font-bold text-gray-700 text-center uppercase leading-tight">
              {match.teams_away?.name}
            </span>
          </div>
        </div>

        {/* RODAPÉ: RESULTADO OFICIAL E PONTOS */}
        <div className="mt-auto bg-gray-50 rounded-lg p-3 border border-gray-100">
          {match.status === "finished" ? (
            <div className="text-center mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                Resultado Oficial
              </span>
              <div className="flex justify-center items-center gap-2">
                <span className="font-black text-lg text-gray-800">
                  {match.home_score}
                </span>
                <span className="text-gray-400 text-xs font-bold">x</span>
                <span className="font-black text-lg text-gray-800">
                  {match.away_score}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Aguardando Jogo
              </span>
            </div>
          )}

          <div className="bg-green-50 text-green-700 font-bold text-xs text-center py-2 rounded border border-green-100">
            {points !== null ? `Ganhou: ${points} pts` : "Ganhou: 0 pts"}
          </div>
        </div>
      </div>
    </div>
  );
}
