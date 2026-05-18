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
} from "lucide-react";
import { useToast } from "./ToastContext";
import logo from "./images/logo-dellut-removebg-preview.png";

function App() {
  const [session, setSession] = useState(null);
  const [matches, setMatches] = useState([]);
  const [bets, setBets] = useState({});
  const [savingAll, setSavingAll] = useState(false);
  const [view, setView] = useState("matches");
  const [matchFilter, setMatchFilter] = useState("all");
  const [hasProfile, setHasProfile] = useState(true);
  const [tempName, setTempName] = useState("");
  const [userName, setUserName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [pixKey, setPixKey] = useState("");
  const [loadingApp, setLoadingApp] = useState(true);

  const showToast = useToast();
  const ADMIN_EMAIL = "guilherme@dellut.com.br";

  useEffect(() => {
    let isMounted = true;

    async function loadAllData(currentSession) {
      if (!currentSession) {
        if (isMounted) setLoadingApp(false);
        return;
      }

      try {
        await Promise.all([
          fetchMatches(),
          checkUserData(currentSession),
          fetchPixKey(),
        ]);
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
          setPaymentStatus("pending");
          setHasProfile(true);
          setUserName("");
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

  async function fetchPixKey() {
    try {
      const { data, error } = await supabase
        .from("tournament_settings")
        .select("pix_key")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data?.pix_key) {
        setPixKey(data.pix_key);
      }
    } catch (e) {
      console.warn("Sem chave PIX encontrada", e);
    }
  }

  async function checkUserData(currentSession) {
    const userId = currentSession.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError);
      setHasProfile(true);
    } else if (!profile) {
      setHasProfile(false);
      setUserName("");
    } else {
      setHasProfile(true);
      setUserName(profile.name);
    }

    // 🔓 MODO DE TESTES MANTIDO
    setPaymentStatus("paid");
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
    if (paymentStatus !== "paid") {
      showToast(
        "Faça o pagamento da inscrição para liberar seus palpites!",
        "warning",
      );
      return;
    }

    const now = new Date();

    const betsToSave = filteredMatches
      .filter((match) => {
        const matchDate = new Date(match.match_time);
        const isOpen = now < matchDate && match.status !== "finished";
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
        "Nenhum palpite novo para salvar. Preencha os placares dos jogos abertos!",
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
      await fetchBets(session.user.id);
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

    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      name,
    });

    if (error) {
      showToast("Erro ao salvar nome: " + error.message, "error");
    } else {
      setHasProfile(true);
      setUserName(name);
      showToast("Nome salvo com sucesso!", "success");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const filteredMatches = matches.filter((match) => {
    if (matchFilter === "upcoming") return match.status === "scheduled";
    if (matchFilter === "finished") return match.status === "finished";
    if (matchFilter === "knockout") return match.phase === "knockout";
    return true;
  });

  const hasUnsavedBets = filteredMatches.some((match) => {
    const now = new Date();
    const matchDate = new Date(match.match_time);
    const isOpen = now < matchDate && match.status !== "finished";
    const bet = bets[match.id];
    return isOpen && bet && bet.home !== "" && bet.away !== "";
  });

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
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">BOLÃO</h1>
            <p className="text-xs text-gray-500">
              {userName
                ? `Jogador: ${userName}`
                : session.user.email || "Jogador"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* CORREÇÃO DO EMAIL MAIÚSCULO/MINÚSCULO AQUI 👇 */}
          {session?.user?.email?.toLowerCase() ===
            ADMIN_EMAIL.toLowerCase() && (
            <button
              onClick={() => setView("admin")}
              className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-700 transition"
            >
              <ShieldAlert size={14} /> Admin
            </button>
          )}
          <div className="flex flex-col items-end">
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                paymentStatus === "paid"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {paymentStatus === "paid" ? "Pago ✅" : "Pendente 💳"}
            </span>
            <button
              onClick={handleLogout}
              className="mt-1 text-gray-400 hover:text-red-500 transition"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 flex flex-col min-h-[80vh]">
        <div className="flex-grow">
          {paymentStatus !== "paid" && view !== "rules" && view !== "admin" && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6 shadow-sm">
              <p className="text-red-700 text-sm font-bold">
                ⚠️ O seu pagamento está Pendente!
              </p>
              <p className="text-red-600 text-xs mt-1">
                Os seus palpites estão bloqueados. Vá ao menu{" "}
                <button
                  onClick={() => setView("rules")}
                  className="underline font-bold"
                >
                  Regras
                </button>{" "}
                para ver a chave PIX da inscrição.
              </p>
            </div>
          )}

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
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                      matchFilter === key
                        ? orange
                          ? "bg-orange-500 text-white"
                          : "bg-brand-600 text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      paymentStatus={paymentStatus}
                      homeScore={bets[match.id]?.home ?? ""}
                      awayScore={bets[match.id]?.away ?? ""}
                      points={bets[match.id]?.points ?? null}
                      onChangeHome={(val) =>
                        setBets((prev) => ({
                          ...prev,
                          [match.id]: { ...prev[match.id], home: val },
                        }))
                      }
                      onChangeAway={(val) =>
                        setBets((prev) => ({
                          ...prev,
                          [match.id]: { ...prev[match.id], away: val },
                        }))
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {view === "ranking" && <Ranking />}
          {view === "champions" && (
            <ChampionBets session={session} paymentStatus={paymentStatus} />
          )}
          {view === "admin" && <Admin session={session} />}
          {view === "rules" && <Rules pixKey={pixKey} />}
        </div>

        <div className="mt-12 mb-4 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Bolão Dellut. Criado e
            administrado por{" "}
            <a
              href="https://www.linkedin.com/in/seu-perfil"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-gray-500 hover:text-brand-600 hover:underline transition-colors"
            >
              Guilherme Padial
            </a>
            .
          </p>
        </div>
      </main>

      {/* Botão global de salvar */}
      {view === "matches" && paymentStatus === "paid" && hasUnsavedBets && (
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

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between px-2 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
        <button
          onClick={() => setView("matches")}
          className={`flex flex-col items-center text-xs font-medium w-full py-1 ${
            view === "matches" ? "text-brand-600" : "text-gray-400"
          }`}
        >
          <Gamepad2 size={22} className="mb-1" /> Jogos
        </button>
        <button
          onClick={() => setView("champions")}
          className={`flex flex-col items-center text-xs font-medium w-full py-1 ${
            view === "champions" ? "text-yellow-500" : "text-gray-400"
          }`}
        >
          <Medal size={22} className="mb-1" /> Pódio
        </button>
        <button
          onClick={() => setView("ranking")}
          className={`flex flex-col items-center text-xs font-medium w-full py-1 ${
            view === "ranking" ? "text-brand-600" : "text-gray-400"
          }`}
        >
          <Trophy size={22} className="mb-1" /> Ranking
        </button>
        <button
          onClick={() => setView("rules")}
          className={`flex flex-col items-center text-xs font-medium w-full py-1 ${
            view === "rules" ? "text-brand-600" : "text-gray-400"
          }`}
        >
          <BookOpen size={22} className="mb-1" /> Regras
        </button>
      </div>
    </div>
  );
}

export default App;
