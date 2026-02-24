import {
  BookOpen,
  Target,
  Trophy,
  DollarSign,
  AlertCircle,
} from "lucide-react";

export default function Rules() {
  return (
    <div className="max-w-3xl mx-auto p-4 mt-6 mb-24">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-xl p-6 text-white shadow-lg mb-6 flex items-center gap-4">
        <BookOpen size={40} className="text-brand-100" />
        <div>
          <h2 className="text-2xl font-black">Regulamento Oficial</h2>
          <p className="text-brand-100 text-sm">
            Tudo o que você precisa saber para faturar o prêmio.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Pagamento */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
            <DollarSign className="text-green-600" /> Inscrição e Pagamento
          </h3>
          <p className="text-gray-600 mb-2">
            O valor da inscrição é de <strong>R$ 60,00</strong> por
            participante.
          </p>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-sm">
            <p className="font-bold text-green-800 mb-1">
              Faça o PIX para confirmar sua participação:
            </p>
            <p className="text-green-700 font-mono text-lg bg-white inline-block px-4 py-2 rounded border border-green-300 my-2 shadow-sm font-bold select-all">
              SUA-CHAVE-PIX-AQUI
            </p>
            <p className="text-green-600 text-xs mt-1">
              * Após o pagamento, o Admin vai atualizar seu status para "Pago"
              no sistema.
            </p>
          </div>
        </div>

        {/* Pontuação de Jogos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
            <Target className="text-blue-600" /> Pontuação dos Jogos
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-2">
                📊 Fase de Grupos
              </h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>
                  <strong>5 pontos:</strong> Placar exato (Na mosca!)
                </li>
                <li>
                  <strong>3 pontos:</strong> Acertar só o vencedor ou se foi
                  empate
                </li>
              </ul>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h4 className="font-bold text-orange-800 mb-2">🔥 Mata-Mata</h4>
              <ul className="text-sm text-orange-700 space-y-2">
                <li>
                  <strong>8 pontos:</strong> Placar exato (Na mosca!)
                </li>
                <li>
                  <strong>5 pontos:</strong> Acertar só o vencedor ou se foi
                  empate
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bolão de Ouro */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
            <Trophy className="text-yellow-500" /> Bolão de Ouro (Pódio)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Escolha os 3 melhores times da Copa na aba "Pódio". Os pontos são
            somados no final do torneio:
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold w-20 text-center">
                15 pts
              </span>{" "}
              Acertar o Campeão
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold w-20 text-center">
                10 pts
              </span>{" "}
              Acertar o Vice-Campeão
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold w-20 text-center">
                5 pts
              </span>{" "}
              Acertar o 3º Lugar
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold w-20 text-center">
                +10 pts
              </span>{" "}
              Bônus por acertar os 2 Finalistas exatos
            </li>
          </ul>
        </div>

        {/* Regras Gerais */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
            <AlertCircle className="text-red-500" /> Regras Gerais
          </h3>
          <ul className="text-sm text-gray-600 space-y-3 list-disc pl-5">
            <li>
              Os palpites devem ser feitos antes do horário oficial de início de
              cada partida.
            </li>
            <li>
              Partidas iniciadas serão{" "}
              <strong>bloqueadas automaticamente</strong> pelo sistema com um
              ícone de cadeado.
            </li>
            <li>
              No mata-mata, o placar que vale para o bolão é o do{" "}
              <strong>tempo normal (90 min)</strong>. Prorrogação e pênaltis não
              contam para o palpite do placar.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
