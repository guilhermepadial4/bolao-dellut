import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import MatchCard from "./MatchCard";
import Ranking from "./Ranking";
import Admin from "./Admin";
import ChampionBets from "./ChampionBets";
import Rules from "./Rules";
import {
  LogOut,
  Trophy,
  Gamepad2,
  ShieldAlert,
  Medal,
  Filter,
  UserCircle,
  BookOpen,
} from "lucide-react";

function App() {
  const [session, setSession] = useState(null);
  const [matches, setMatches] = useState([]);
  const [view, setView] = useState("matches");
  const [matchFilter, setMatchFilter] = useState("all");
  const [hasProfile, setHasProfile] = useState(true);
  const [tempName, setTempName] = useState("");

  // NOVO: Estado para guardar o status do pagamento
  const [paymentStatus, setPaymentStatus] = useState("pending");

  const ADMIN_EMAIL = "guilherme@dellut.com.br";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchMatches();
        checkUserData(session);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchMatches();
        checkUserData(session);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // NOVO: Verifica o Perfil e o Pagamento ao mesmo tempo
  async function checkUserData(currentSession) {
    // 1. Verifica o Perfil (Nome)
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", currentSession.user.id)
      .maybeSingle();
    if (!profile) setHasProfile(false);
    else setHasProfile(true);

    // 2. Verifica o Pagamento
    const { data: payment } = await supabase
      .from("payments")
      .select("status")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();
    if (payment && payment.status === "paid") {
      setPaymentStatus("paid");
    } else {
      setPaymentStatus("pending");
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!tempName.trim()) return alert("Digite um nome válido!");
    const { error } = await supabase
      .from("profiles")
      .insert({ id: session.user.id, name: tempName.trim() });
    if (error) alert("Erro ao salvar nome: " + error.message);
    else setHasProfile(true);
  }

  async function fetchMatches() {
    const { data } = await supabase
      .from("matches")
      .select(
        `*, teams_home:home_team_id(name, flag_url), teams_away:away_team_id(name, flag_url)`,
      )
      .order("match_time", { ascending: true });
    setMatches(data || []);
  }

  const filteredMatches = matches.filter((match) => {
    if (matchFilter === "upcoming") return match.status === "scheduled";
    if (matchFilter === "finished") return match.status === "finished";
    if (matchFilter === "knockout") return match.phase === "knockout";
    return true;
  });

  if (!session) return <Login />;

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {!hasProfile && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <UserCircle size={64} className="mx-auto text-brand-500 mb-4" />
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              Bem-vindo(a)!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Como quer ser chamado no Ranking do Bolão?
            </p>
            <form onSubmit={handleSaveProfile}>
              <input
                type="text"
                placeholder="Ex: Guilherme Padial"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={20}
                className="w-full border border-gray-300 p-3 rounded-lg mb-4 text-center font-bold text-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <button
                type="submit"
                className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition shadow-md"
              >
                Salvar o Meu Nome
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm px-4 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">
          DELLUT <span className="text-brand-500 text-sm">BOLÃO</span>
        </h1>
        <div className="flex items-center gap-4">
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

      <main className="max-w-5xl mx-auto p-4">
        {/* Aviso global se estiver pendente */}
        {paymentStatus !== "paid" && view !== "rules" && view !== "admin" && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6 shadow-sm">
            <p className="text-red-700 text-sm font-bold">
              ⚠️ O seu pagamento está Pendente!
            </p>
            <p className="text-red-600 text-xs mt-1">
              Os seus palpites estão bloqueados. Vá ao menu "Regras" para ver a
              chave PIX da inscrição.
            </p>
          </div>
        )}

        {view === "matches" && (
          <>
            <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <div className="text-gray-400 mr-2">
                <Filter size={20} />
              </div>
              <button
                onClick={() => setMatchFilter("all")}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${matchFilter === "all" ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
              >
                Todos os Jogos
              </button>
              <button
                onClick={() => setMatchFilter("upcoming")}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${matchFilter === "upcoming" ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
              >
                Próximos
              </button>
              <button
                onClick={() => setMatchFilter("finished")}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${matchFilter === "finished" ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
              >
                Encerrados
              </button>
              <button
                onClick={() => setMatchFilter("knockout")}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${matchFilter === "knockout" ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
              >
                🔥 Mata-Mata
              </button>
            </div>
            {filteredMatches.length === 0 ? (
              <div className="text-center p-10 text-gray-400 bg-white rounded-xl border border-gray-200 border-dashed">
                <Gamepad2 size={48} className="mx-auto mb-4 opacity-20" />
                <p>Nenhum jogo encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* NOVO: Passando o paymentStatus para o MatchCard */}
                {filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    userId={session.user.id}
                    paymentStatus={paymentStatus}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {view === "ranking" && <Ranking />}
        {/* NOVO: Passando o paymentStatus para o Pódio */}
        {view === "champions" && (
          <ChampionBets session={session} paymentStatus={paymentStatus} />
        )}
        {view === "admin" && <Admin session={session} />}
        {view === "rules" && <Rules />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between px-2 py-3 md:justify-around md:pb-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
        <button
          onClick={() => setView("matches")}
          className={`flex flex-col items-center text-[10px] md:text-xs font-medium w-full ${view === "matches" ? "text-brand-600" : "text-gray-400"}`}
        >
          <Gamepad2 size={22} className="mb-1" /> Jogos
        </button>
        <button
          onClick={() => setView("champions")}
          className={`flex flex-col items-center text-[10px] md:text-xs font-medium w-full ${view === "champions" ? "text-yellow-500" : "text-gray-400"}`}
        >
          <Medal size={22} className="mb-1" /> Pódio
        </button>
        <button
          onClick={() => setView("ranking")}
          className={`flex flex-col items-center text-[10px] md:text-xs font-medium w-full ${view === "ranking" ? "text-brand-600" : "text-gray-400"}`}
        >
          <Trophy size={22} className="mb-1" /> Ranking
        </button>
        <button
          onClick={() => setView("rules")}
          className={`flex flex-col items-center text-[10px] md:text-xs font-medium w-full ${view === "rules" ? "text-brand-600" : "text-gray-400"}`}
        >
          <BookOpen size={22} className="mb-1" /> Regras
        </button>
      </div>
    </div>
  );
}

export default App;
