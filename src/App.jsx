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
  Save,
  Clock,
} from "lucide-react";
import { useToast } from "./ToastContext";
import logo from "./images/logo-dellut-removebg-preview.png";

function App() {
  const [session, setSession] = useState(null);
  const [matches, setMatches] = useState([]);
  const [bets, setBets] = useState({});
  const [savingAll, setSavingAll] = useState(false);
  const [view, setView] = useState("matches");
  const [matchFilter, setMatchFilter] = useState("upcoming");
  const [hasProfile, setHasProfile] = useState(true);
  const [tempName, setTempName] = useState("");
  const [userName, setUserName] = useState("");
  const [loadingApp, setLoadingApp] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // <-- NOVO ESTADO AQUI

  const showToast = useToast();

  // ─── LÓGICA DE RODADAS E FECHAMENTO (REGRA 12h) ──────────────────
  const getRoundInfo = (match) => {
    if (match.phase === "knockout") {
      return { name: "🔥 Mata-Mata", deadline: new Date(match.match_time) };
    }

    const d = new Date(match.match_time);
    const m = d.getMonth() + 1;
    const day = d.getDate();

    if (m === 6) {
      if (day >= 11 && day <= 17) {
        return {
          name: "Rodada 1",
          deadline: new Date(2026, 5, 11, 12, 0, 0),
        };
      }
      if (day >= 18 && day <= 23) {
        return {
          name: "Rodada 2",
          deadline: new Date(2026, 5, 18, 12, 0, 0),
        };
      }
      if (day >= 24 && day <= 30) {
        return {
          name: "Rodada 3",
          deadline: new Date(2026, 5, 24, 12, 0, 0),
        };
      }
    }

    return { name: "Fase de Grupos", deadline: new Date(match.match_time) };
  };
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    async function loadAllData(currentSession) {
      if (!currentSession) {
        if (isMounted) setLoadingApp(false);
        return;
      }

      try {
        await Promise.all([fetchMatches(), checkUserData(currentSession)]);
        await fetchBets(currentSession.user.id);
      } catch (err) {
        console.error("Erro no carregamento dos dados:", err);
      } finally {
        if (isMounted) setLoadingApp(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) {
        setSession(initialSession);
        loadAllData(initialSession);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        if (newSession) {
          setLoadingApp(true);
          loadAllData(newSession);
        } else {
          setMatches([]);
          setBets({});
          setHasProfile(true);
          setUserName("");
          setIsAdmin(false);
          setView("matches");
          setLoadingApp(false);
        }
      }
    });

    const safetyTimer = setTimeout(() => {
      if (isMounted && loadingApp) setLoadingApp(false);
    }, 4000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  async function checkUserData(currentSession) {
    const userId = currentSession.user.id;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, is_admin") // <-- AGORA PUXA A COLUNA DO BANCO
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError);
      setHasProfile(true);
      setIsAdmin(false);
    } else if (!profile) {
      setHasProfile(false);
      setUserName("");
      setIsAdmin(false);
    } else {
      setHasProfile(true);
      setUserName(profile.name);
      setIsAdmin(profile.is_admin === true); // <-- SALVA SE É ADMIN
    }
  }

  async function fetchMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select(
        `*, teams_home:home_team_id(name, flag), teams_away:away_team_id(name, flag)`,
      )
      .order("match_time", { ascending: true });

    if (error) {
      console.error("Erro ao buscar partidas:", error);
      return;
    }
    setMatches(data || []);
  }

  async function fetchBets(userId) {
    const { data, error } = await supabase
      .from("bets")
      .select("match_id, home_team_score, away_team_score, points")
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao buscar apostas:", error);
      return;
    }

    const betsMap = {};
    (data || []).forEach((bet) => {
      betsMap[bet.match_id] = {
        home: bet.home_team_score ?? "",
        away: bet.away_team_score ?? "",
        points: bet.points ?? null,
      };
    });
    setBets(betsMap);
  }

  async function handleSaveAllBets() {
    const now = new Date();

    const betsToSave = filteredMatches
      .filter((match) => {
        const roundInfo = getRoundInfo(match);
        const isOpen = now < roundInfo.deadline && match.status !== "finished";
        const bet = bets[match.id];
        return (
          isOpen &&
          bet &&
          bet.home !== "" &&
          bet.away !== "" &&
          !isNaN(parseInt(bet.home, 10)) &&
          !isNaN(parseInt(bet.away, 10))
        );
      })
      .map((match) => ({
        user_id: session.user.id,
        match_id: match.id,
        home_team_score: Math.max(0, parseInt(bets[match.id].home, 10)),
        away_team_score: Math.max(0, parseInt(bets[match.id].away, 10)),
      }));

    if (betsToSave.length === 0) {
      showToast(
        "Nenhum palpite novo para salvar ou o prazo dessa rodada já fechou!",
        "warning",
      );
      return;
    }

    setSavingAll(true);
    const { error } = await supabase
      .from("bets")
      .upsert(betsToSave, { onConflict: "user_id,match_id" });
    setSavingAll(false);

    if (error) {
      showToast("Erro ao salvar palpites: " + error.message, "error");
    } else {
      showToast(
        `${betsToSave.length} palpite(s) salvo(s) com sucesso! ✅`,
        "success",
      );
      await fetchBets(session.user.id);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    const name = tempName.trim();
    if (!name) {
      showToast("Digite um nome válido para o seu perfil!", "warning");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: session.user.id, name });
    if (error) showToast("Erro ao salvar nome: " + error.message, "error");
    else {
      setHasProfile(true);
      setUserName(name);
      showToast("Nome salvo com sucesso!", "success");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const filteredMatches = matches.filter((match) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDateObj = new Date(match.match_time);
    const matchDay = new Date(
      matchDateObj.getFullYear(),
      matchDateObj.getMonth(),
      matchDateObj.getDate(),
    );

    const isFinished = match.status === "finished" || matchDay < today;

    if (matchFilter === "upcoming") return !isFinished;
    if (matchFilter === "finished") return isFinished;
    if (matchFilter === "knockout") return match.phase === "knockout";

    return true;
  });

  const hasUnsavedBets = filteredMatches.some((match) => {
    const now = new Date();
    const roundInfo = getRoundInfo(match);
    const isOpen = now < roundInfo.deadline && match.status !== "finished";
    const bet = bets[match.id];
    return isOpen && bet && bet.home !== "" && bet.away !== "";
  });

  const matchesGroupedByRound = filteredMatches.reduce((groups, match) => {
    const roundInfo = getRoundInfo(match);
    const roundName = roundInfo.name;

    if (!groups[roundName]) {
      groups[roundName] = { matches: [], deadline: roundInfo.deadline };
    }
    groups[roundName].matches.push(match);
    return groups;
  }, {});

  if (loadingApp) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-bold text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <div className="min-h-screen bg-gray-100 pb-36">
      {!hasProfile && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <UserCircle size={64} className="mx-auto text-brand-500 mb-4" />
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              Bem-vindo(a)!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Como quer ser chamado no Ranking?
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
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">BOLÃO</h1>
            <p className="text-xs text-gray-500">
              {userName ? `Jogador: ${userName}` : session.user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* VERIFICAÇÃO SE É ADMIN DE VERDADE 👇 */}
          {isAdmin && (
            <button
              onClick={() => setView("admin")}
              className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-700 transition"
            >
              <ShieldAlert size={14} /> Admin
            </button>
          )}
          <div className="flex flex-col items-end">
            <button
              onClick={handleLogout}
              className="mt-1 text-gray-400 hover:text-red-500 transition"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 flex flex-col min-h-[80vh]">
        <div className="flex-grow">
          {view === "matches" && (
            <>
              <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <div className="text-gray-400 mr-2">
                  <Filter size={20} />
                </div>
                {[
                  { key: "all", label: "Todos os Jogos", orange: false },
                  { key: "upcoming", label: "Próximos", orange: false },
                  { key: "finished", label: "Encerrados", orange: false },
                  { key: "knockout", label: "🔥 Mata-Mata", orange: true },
                ].map(({ key, label, orange }) => (
                  <button
                    key={key}
                    onClick={() => setMatchFilter(key)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${matchFilter === key ? (orange ? "bg-orange-500 text-white" : "bg-brand-600 text-white") : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filteredMatches.length === 0 ? (
                <div className="text-center p-10 text-gray-400 bg-white rounded-xl border border-gray-200 border-dashed">
                  <Gamepad2 size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Nenhum jogo encontrado.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {Object.entries(matchesGroupedByRound).map(
                    ([roundName, roundData]) => (
                      <div key={roundName} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col bg-brand-100 text-brand-800 px-5 py-2.5 rounded-xl shadow-sm border border-brand-200">
                            <div className="flex items-center gap-2">
                              <Trophy size={18} className="text-brand-600" />
                              <h3 className="text-sm font-black uppercase tracking-wide">
                                {roundName}
                              </h3>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-brand-600 font-bold">
                              <Clock size={12} />
                              <span>
                                {roundName.includes("Rodada")
                                  ? `Encerra dia ${roundData.deadline.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às 12:00`
                                  : "Encerra no horário do jogo"}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 border-t-2 border-gray-200 border-dashed"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {roundData.matches.map((match) => {
                            const now = new Date();
                            const rInfo = getRoundInfo(match);
                            const isLocked =
                              now > rInfo.deadline ||
                              match.status === "finished";

                            return (
                              <MatchCard
                                key={match.id}
                                match={match}
                                isLockedOverride={isLocked}
                                homeScore={bets[match.id]?.home ?? ""}
                                awayScore={bets[match.id]?.away ?? ""}
                                points={bets[match.id]?.points ?? null}
                                onChangeHome={(val) =>
                                  setBets((prev) => ({
                                    ...prev,
                                    [match.id]: {
                                      ...prev[match.id],
                                      home: val,
                                    },
                                  }))
                                }
                                onChangeAway={(val) =>
                                  setBets((prev) => ({
                                    ...prev,
                                    [match.id]: {
                                      ...prev[match.id],
                                      away: val,
                                    },
                                  }))
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </>
          )}

          {view === "ranking" && <Ranking />}
          {view === "champions" && <ChampionBets session={session} />}
          {view === "admin" && <Admin session={session} isAdmin={isAdmin} />}
          {view === "rules" && <Rules />}
        </div>

        <div className="mt-12 mb-4 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Bolão Dellut. Criado e
            administrado por{" "}
            <a
              href="https://www.linkedin.com/in/guilhermepadial/"
              target="_blank"
              className="font-bold text-gray-500 hover:text-brand-600 transition-colors"
            >
              Guilherme Padial
            </a>
            .
          </p>
        </div>
      </main>

      {view === "matches" && hasUnsavedBets && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-30 px-4 pointer-events-none">
          <button
            onClick={handleSaveAllBets}
            disabled={savingAll}
            className="pointer-events-auto bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-black text-base py-4 px-10 rounded-full shadow-2xl flex items-center gap-3 transition-all disabled:opacity-60"
          >
            <Save size={20} />
            {savingAll ? "Salvando..." : "Salvar Todos os Palpites"}
          </button>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between px-2 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
        <button
          onClick={() => setView("matches")}
          className={`flex flex-col items-center text-xs font-medium w-full py-1 ${view === "matches" ? "text-brand-600" : "text-gray-400"}`}
        >
          <Gamepad2 size={22} className="mb-1" /> Jogos
        </button>
        <button
          onClick={() => setView("champions")}
          className={`flex flex-col items-center text-xs font-medium w-full py-1 ${view === "champions" ? "text-yellow-500" : "text-gray-400"}`}
        >
          <Medal size={22} className="mb-1" /> Pódio
        </button>
        <button
          onClick={() => setView("ranking")}
          className={`flex flex-col items-center text-xs font-medium w-full py-1 ${view === "ranking" ? "text-brand-600" : "text-gray-400"}`}
        >
          <Trophy size={22} className="mb-1" /> Ranking
        </button>
        <button
          onClick={() => setView("rules")}
          className={`flex flex-col items-center text-xs font-medium w-full py-1 ${view === "rules" ? "text-brand-600" : "text-gray-400"}`}
        >
          <BookOpen size={22} className="mb-1" /> Regras
        </button>
      </div>
    </div>
  );
}

export default App;
