import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import MatchCard from "./MatchCard";
import Ranking from "./Ranking";
import Admin from "./Admin";
import ChampionBets from "./ChampionBets"; // IMPORTAÇÃO NOVA AQUI
import { LogOut, Trophy, Gamepad2, ShieldAlert, Medal } from "lucide-react"; // Ícone Medal adicionado

function App() {
  const [session, setSession] = useState(null);
  const [matches, setMatches] = useState([]);
  const [view, setView] = useState("matches"); // 'matches', 'ranking', 'admin' ou 'champions'

  // E-mail oficial do administrador
  const ADMIN_EMAIL = "guilherme@dellut.com.br";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMatches();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMatches();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchMatches() {
    const { data } = await supabase
      .from("matches")
      .select(
        `*, teams_home:home_team_id(name, flag_url), teams_away:away_team_id(name, flag_url)`,
      )
      .order("match_time", { ascending: true });
    setMatches(data || []);
  }

  if (!session) return <Login />;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* HEADER */}
      <header className="bg-white shadow-sm px-4 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">
          DELLUT <span className="text-brand-500 text-sm">BOLÃO</span>
        </h1>

        <div className="flex items-center gap-4">
          {/* Botão de Admin protegido */}
          {session?.user?.email === ADMIN_EMAIL && (
            <button
              onClick={() => setView("admin")}
              className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-700 transition"
            >
              <ShieldAlert size={14} /> Admin
            </button>
          )}

          <button
            onClick={() => supabase.auth.signOut()}
            className="text-gray-400 hover:text-red-500 transition"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (Telas separadas corretamente) */}
      <main className="max-w-5xl mx-auto p-4">
        {view === "matches" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                userId={session.user.id}
              />
            ))}
          </div>
        )}

        {view === "ranking" && <Ranking />}

        {/* NOVA TELA DOS CAMPEÕES */}
        {view === "champions" && <ChampionBets session={session} />}

        {view === "admin" && <Admin session={session} />}
      </main>

      {/* MENU INFERIOR MOBILE (Agora com 3 botões) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-6 md:pb-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
        <button
          onClick={() => setView("matches")}
          className={`flex flex-col items-center text-xs font-medium w-full ${view === "matches" ? "text-brand-600" : "text-gray-400"}`}
        >
          <Gamepad2 size={24} className="mb-1" />
          Jogos
        </button>

        {/* BOTÃO NOVO DO PÓDIO */}
        <button
          onClick={() => setView("champions")}
          className={`flex flex-col items-center text-xs font-medium w-full ${view === "champions" ? "text-yellow-500" : "text-gray-400"}`}
        >
          <Medal size={24} className="mb-1" />
          Pódio
        </button>

        <button
          onClick={() => setView("ranking")}
          className={`flex flex-col items-center text-xs font-medium w-full ${view === "ranking" ? "text-brand-600" : "text-gray-400"}`}
        >
          <Trophy size={24} className="mb-1" />
          Ranking
        </button>
      </div>
    </div>
  );
}

export default App;
