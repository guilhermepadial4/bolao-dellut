import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Trophy, Medal, Award, Save } from "lucide-react";

export default function ChampionBets({ session }) {
  const [teams, setTeams] = useState([]);
  const [bet, setBet] = useState({
    champion: "",
    runner_up: "",
    third_place: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      // 1. Busca todos os times para preencher o select
      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      setTeams(teamsData || []);

      // 2. Busca se o usuário já tem um palpite salvo
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

    // Validação básica
    if (!bet.champion || !bet.runner_up || !bet.third_place) {
      return alert("Por favor, selecione os três times!");
    }
    if (
      bet.champion === bet.runner_up ||
      bet.champion === bet.third_place ||
      bet.runner_up === bet.third_place
    ) {
      return alert("Você não pode escolher o mesmo time mais de uma vez!");
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
      alert("Erro ao salvar: " + error.message);
    } else {
      alert("Palpite de Ouro salvo com sucesso! Boa sorte!");
    }
  }

  if (loading)
    return (
      <div className="text-center p-10 font-bold text-gray-500">
        Carregando times... ⏳
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto p-4 mt-6 mb-24">
      {/* Cabeçalho da Tela */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg mb-8 text-center">
        <Trophy
          size={48}
          className="mx-auto mb-4 text-yellow-100 drop-shadow-md"
        />
        <h2 className="text-3xl font-black mb-2 tracking-tight">
          Bolão de Ouro
        </h2>
        <p className="text-yellow-100 text-sm">
          Acerte o pódio e garanta pontos extras preciosos no fim da Copa!
        </p>
      </div>

      {/* Formulário de Palpites */}
      <form
        onSubmit={handleSave}
        className="bg-white p-6 rounded-xl shadow-md border border-gray-100 space-y-6"
      >
        {/* 1º Lugar - Campeão */}
        <div className="relative bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="absolute -top-3 left-4 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Trophy size={12} /> Campeão (15 pts)
          </div>
          <select
            value={bet.champion}
            onChange={(e) => setBet({ ...bet, champion: e.target.value })}
            className="w-full mt-2 p-3 bg-white border border-yellow-300 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-yellow-500 outline-none"
          >
            <option value="">Quem vai levantar a taça?</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag_url} {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2º Lugar - Vice */}
        <div className="relative bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="absolute -top-3 left-4 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Medal size={12} /> Vice-Campeão (10 pts)
          </div>
          <select
            value={bet.runner_up}
            onChange={(e) => setBet({ ...bet, runner_up: e.target.value })}
            className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-gray-400 outline-none"
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
          <div className="absolute -top-3 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Award size={12} /> 3º Lugar (5 pts)
          </div>
          <select
            value={bet.third_place}
            onChange={(e) => setBet({ ...bet, third_place: e.target.value })}
            className="w-full mt-2 p-3 bg-white border border-orange-300 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="">Quem ganha a disputa de 3º?</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flag_url} {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Botão de Salvar */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-600 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-700 transition shadow-lg mt-4 disabled:opacity-50"
        >
          <Save size={24} />
          {saving ? "Salvando..." : "Salvar Palpite de Ouro"}
        </button>
      </form>
    </div>
  );
}
