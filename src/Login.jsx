import { useState } from "react";
import { supabase } from "./supabaseClient";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Controla se é Login ou Cadastro

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    let error = null;

    if (isSignUp) {
      // Criação de Conta
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      error = signUpError;
      if (!error) alert("Conta criada com sucesso! Você já está logado.");
    } else {
      // Login Normal
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = signInError;
    }

    if (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border-t-4 border-brand-500">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            DELLUT
          </h1>
          <p className="text-brand-500 font-medium tracking-widest text-xs uppercase mb-2">
            Engenharia & Consultoria
          </p>
          <h2 className="text-xl font-semibold text-gray-600 mt-6">
            {isSignUp ? "Criar Nova Conta" : "Acessar Bolão"}
          </h2>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {/* Campo E-mail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                placeholder="nome@dellut.com.br"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                placeholder="******"
              />
            </div>
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de 6 caracteres
              </p>
            )}
          </div>

          {/* Botão de Ação */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSignUp ? (
              "Cadastrar e Entrar"
            ) : (
              <>
                Entrar <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login/Cadastro */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isSignUp ? "Já tem uma conta?" : "Ainda não tem acesso?"}
          </p>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-brand-600 hover:text-brand-700 font-semibold text-sm mt-1 hover:underline"
          >
            {isSignUp ? "Fazer Login" : "Criar conta agora"}
          </button>
        </div>
      </div>
    </div>
  );
}
