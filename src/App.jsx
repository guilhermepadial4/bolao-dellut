import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import MatchCard from "./MatchCard";
import Ranking from "./Ranking";
import Admin from "./Admin";
import { LogOut, Trophy, Gamepad2 } from "lucide-react";

function App() {
  const [session, setSession] = useState(null);
  const [matches, setMatches] = useState([]);
  const [view, setView] = useState("matches"); // 'matches' ou 'ranking'

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
      {" "}
      {/* pb-20 para o menu fixo não tapar conteúdo */}
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">
          DELLUT <span className="text-brand-500 text-sm">BOLÃO</span>
        </h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-gray-400 hover:text-red-500"
        >
          <LogOut size={20} />
        </button>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        {view === "matches" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                userId={session.user.id}
              />
            ))}
          </div>
        ) : (
          <Ranking />
        )}
      </main>
      {/* Menu Inferior Mobile (Tipo App) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-6 md:pb-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => setView("matches")}
          className={`flex flex-col items-center text-xs font-medium ${view === "matches" ? "text-brand-600" : "text-gray-400"}`}
        >
          <Gamepad2 size={24} className="mb-1" />
          Jogos
        </button>
        <button
          onClick={() => setView("ranking")}
          className={`flex flex-col items-center text-xs font-medium ${view === "ranking" ? "text-brand-600" : "text-gray-400"}`}
        >
          <Trophy size={24} className="mb-1" />
          Ranking
        </button>
      </div>
    </div>
  );
}

export default App;
