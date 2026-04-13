import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Trophy, Medal, Award, Save, Lock, AlertCircle } from "lucide-react";
import { useToast } from "./ToastContext"; // Importe o hook useToast

// NOVO: Recebemos o paymentStatus
export default function ChampionBets({ session, paymentStatus }) {
  const [teams, setTeams] = useState([]);
  const [bet, setBet] = useState({
    champion: "",
    runner_up: "",
    third_place: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const showToast = useToast(); // Use o hook useToast

  const isPaymentLocked = paymentStatus !== "paid";

  useEffect(() => {
    async function loadData() {
      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      setTeams(teamsData || []);

      const { data: existingBet } = await supabase
        .from("champion_bets")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (existingBet) {
        setBet({
          champion: existingBet.champion_id || "",
          runner_up: existingBet.runner_up_id || "",
          third_place: existingBet.third_place_id || "",
        });
      }
      setLoading(false);
    }
    loadData();
  }, [session]);

  async function handleSave(e) {
    e.preventDefault();
    if (isPaymentLocked) {
      showToast(
        "Pague a inscrição do bolão para registar o seu pódio!",
        "warning",
      );
      return;
    }
    if (!bet.champion || !bet.runner_up || !bet.third_place) {
      showToast("Por favor, selecione as três equipas!", "warning");
      return;
    }
    if (
      bet.champion === bet.runner_up ||
      bet.champion === bet.third_place ||
      bet.runner_up === bet.third_place
    ) {
      showToast("Não pode escolher a mesma equipa mais de uma vez!", "warning");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("champion_bets").upsert({
      user_id: session.user.id,
      champion_id: bet.champion,
      runner_up_id: bet.runner_up,
      third_place_id: bet.third_place,
    });
    setSaving(false);

    if (error) {
      showToast("Erro ao salvar: " + error.message, "error");
    } else {
      showToast("Pódio de Ouro salvo com sucesso! Boa sorte!", "success");
    }
  }

  if (loading)
    return (
      <div className="text-center p-10 font-bold text-gray-500">
        A carregar equipas... ⏳
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto p-4 mt-6 mb-24">
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg mb-8 text-center">
        <Trophy
          size={48}
          className="mx-auto mb-4 text-yellow-100 drop-shadow-md"
        />
        <h2 className="text-3xl font-black mb-2 tracking-tight">
          Bolão de Ouro
        </h2>
        <p className="text-yellow-100 text-sm">
          Acerte o pódio e garanta pontos extras preciosos!
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className={`p-6 rounded-xl shadow-md border space-y-6 ${isPaymentLocked ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}
      >
        {isPaymentLocked && (
          <div className="text-red-600 text-center font-bold text-sm bg-red-100 p-3 rounded-lg border border-red-200 mb-4 flex items-center justify-center gap-2">
            <AlertCircle size={18} /> Os seus palpites estão bloqueados por
            falta de pagamento.
          </div>
        )}

        {/* 1º Lugar */}
        <div className="relative bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="absolute -top-3 left-4 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Trophy size={12} /> Campeão (15 pts)
          </div>
          <select
            value={bet.champion}
            onChange={(e) => setBet({ ...bet, champion: e.target.value })}
            disabled={isPaymentLocked}
            className="w-full mt-2 p-3 bg-white border border-yellow-300 rounded-lg font-bold text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">Quem vai levantar a taça?</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag_url} {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2º Lugar */}
        <div className="relative bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="absolute -top-3 left-4 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Medal size={12} /> Vice-Campeão (10 pts)
          </div>
          <select
            value={bet.runner_up}
            onChange={(e) => setBet({ ...bet, runner_up: e.target.value })}
            disabled={isPaymentLocked}
            className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg font-bold text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">Quem amarga o 2º lugar?</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag_url} {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3º Lugar */}
        <div className="relative bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="absolute -top-3 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Award size={12} /> 3º Lugar (5 pts)
          </div>
          <select
            value={bet.third_place}
            onChange={(e) => setBet({ ...bet, third_place: e.target.value })}
            disabled={isPaymentLocked}
            className="w-full mt-2 p-3 bg-white border border-orange-300 rounded-lg font-bold text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">Quem ganha a disputa de 3º?</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag_url} {t.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPaymentLocked || saving}
          className={`w-full font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg mt-4 disabled:opacity-50 ${isPaymentLocked ? "bg-red-500 text-white cursor-not-allowed" : "bg-brand-600 text-white hover:bg-brand-700"}`}
        >
          {isPaymentLocked ? (
            <>
              <Lock size={24} /> Pagamento Pendente
            </>
          ) : saving ? (
            "A salvar..."
          ) : (
            <>
              <Save size={24} /> Salvar Pódio
            </>
          )}
        </button>
      </form>
    </div>
  );
}
