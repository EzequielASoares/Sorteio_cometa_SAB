"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Trophy,
  RefreshCw,
  LogOut,
  Users,
  Search,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  Dices,
  Trash2,
  Mail,
} from "lucide-react";
import type { ParticipanteInscrito } from "../api/admin/inscricoes/route";

type GanhadorHistorico = {
  ordem: number;
  participante: ParticipanteInscrito;
  horario: string;
};

const SQL_SETUP_SNIPPET = `create or replace function public.listar_inscricoes()
returns setof jsonb
language sql
security definer
set search_path = public
as $$
  select to_jsonb(i)
  from public.inscricoes i;
$$;

grant execute on function public.listar_inscricoes() to anon, authenticated;`;

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 3) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 3)}***@${domain}`;
}

export default function AdminSorteioPage() {
  // Estados de Autenticação
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsSqlSetup, setNeedsSqlSetup] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Estados do Sorteador
  const [participantes, setParticipantes] = useState<ParticipanteInscrito[]>(
    [],
  );
  const [ganhadorAtual, setGanhadorAtual] =
    useState<ParticipanteInscrito | null>(null);
  const [nomeEmRoleta, setNomeEmRoleta] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [historico, setHistorico] = useState<GanhadorHistorico[]>([]);
  const [naoRepetirGanhador, setNaoRepetirGanhador] = useState(true);
  const [ocultarParcialEmail, setOcultarParcialEmail] = useState(false);
  const [busca, setBusca] = useState("");
  const [mostrarListaInscritos, setMostrarListaInscritos] = useState(false);

  const fetchInscritos = async (user: string, pass: string) => {
    setIsLoading(true);
    setAuthError(null);
    setNeedsSqlSetup(false);

    try {
      const response = await fetch("/api/admin/inscricoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });

      const data = (await response.json().catch(() => null)) as {
        participantes?: ParticipanteInscrito[];
        error?: string;
        needsSqlSetup?: boolean;
      } | null;

      if (response.status === 401) {
        setIsAuthenticated(false);
        setAuthError(data?.error ?? "Usuário ou senha incorretos.");
        return;
      }

      if (!response.ok) {
        // Autenticou com sucesso, mas falta criar a RPC no Supabase ou houve falha de rede
        setIsAuthenticated(true);
        setNeedsSqlSetup(Boolean(data?.needsSqlSetup));
        setAuthError(
          data?.error ?? "Não foi possível carregar os inscritos do banco.",
        );
        return;
      }

      setParticipantes(data?.participantes ?? []);
      setIsAuthenticated(true);
    } catch {
      setAuthError("Erro de conexão ao tentar comunicar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setAuthError("Preencha o usuário e a senha de administrador.");
      return;
    }
    await fetchInscritos(username, password);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setParticipantes([]);
    setGanhadorAtual(null);
    setHistorico([]);
    setAuthError(null);
    setNeedsSqlSetup(false);
  };

  // Lista elegível para o sorteio
  const candidatosDisponiveis = useMemo(() => {
    if (!naoRepetirGanhador) return participantes;
    const idsSorteados = new Set(historico.map((h) => h.participante.id));
    return participantes.filter((p) => !idsSorteados.has(p.id));
  }, [participantes, historico, naoRepetirGanhador]);

  // Filtro de busca na tabela de inscritos
  const participantesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return participantes;
    return participantes.filter(
      (p) =>
        p.nomeCompleto.toLowerCase().includes(termo) ||
        p.email.toLowerCase().includes(termo),
    );
  }, [participantes, busca]);

  const handleSortear = () => {
    if (isDrawing || candidatosDisponiveis.length === 0) return;

    setIsDrawing(true);
    setGanhadorAtual(null);

    // Escolha aleatória criptograficamente segura quando disponível
    const pool = candidatosDisponiveis;
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const winnerIndex = randomBuffer[0] % pool.length;
    const escolhido = pool[winnerIndex];

    // Efeito visual de roleta antes de revelar o ganhador
    let ticks = 0;
    const maxTicks = 22;
    const interval = setInterval(() => {
      const randomPreview = pool[Math.floor(Math.random() * pool.length)];
      setNomeEmRoleta(randomPreview.nomeCompleto);
      ticks += 1;

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setNomeEmRoleta(null);
        setGanhadorAtual(escolhido);
        setHistorico((prev) => [
          {
            ordem: prev.length + 1,
            participante: escolhido,
            horario: new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          },
          ...prev,
        ]);
        setIsDrawing(false);
      }
    }, 85);
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SETUP_SNIPPET);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#002b49] via-brand-blue to-[#003457] text-white relative overflow-x-hidden">
      {/* Fundo espacial */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="absolute -top-24 -left-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-brand-blue-light/40 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 sm:w-[28rem] sm:h-[28rem] rounded-full bg-brand-accent/15 blur-3xl" />
        <div className="absolute top-28 left-0 w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_16px_4px_rgba(212,160,23,0.7)] animate-comet opacity-70" />
      </div>

      {/* Cabeçalho */}
      <header className="relative z-20 w-full border-b border-white/10 bg-[#002b49]/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 p-0.5 flex items-center justify-center shrink-0">
              <Image
                src="/images/logo.png"
                alt="Logo Cometa Nordestino"
                width={48}
                height={48}
                className="w-full h-full object-contain drop-shadow-md"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-space-grotesk font-bold text-base sm:text-lg md:text-xl tracking-tight text-white leading-tight">
                Cometa Nordestino
              </span>
              <span className="font-space-mono text-[10px] sm:text-xs text-brand-accent tracking-wider uppercase">
                PAINEL DO SORTEADOR
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-brand-accent" />
              <span>Página de Inscrição</span>
            </Link>

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-brand-accent" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!isAuthenticated ? (
          /* TELA DE LOGIN FIXO */
          <div className="w-full max-w-md mx-auto">
            <div className="bg-surface text-text-primary rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-accent" />

              <div className="flex flex-col items-center text-center space-y-2 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-blue-pale text-brand-blue flex items-center justify-center shadow-sm">
                  <Lock className="w-7 h-7" />
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-brand-blue-pale text-brand-blue font-space-mono text-[11px] font-bold uppercase tracking-wider">
                  Acesso Restrito
                </span>
                <h1 className="font-space-grotesk font-bold text-2xl sm:text-3xl text-brand-blue">
                  Login do Sorteador
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary">
                  Entre com as credenciais da equipe para realizar o sorteio com
                  base nos inscritos do banco de dados.
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm"
                >
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-user"
                    className="block text-xs sm:text-sm font-semibold text-text-primary"
                  >
                    Usuário
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-muted">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="admin-user"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="Digite o usuário"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (authError) setAuthError(null);
                      }}
                      className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-xl bg-surface-alt border border-slate-200 text-base text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-pass"
                    className="block text-xs sm:text-sm font-semibold text-text-primary"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-muted">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <input
                      id="admin-pass"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="Digite a senha"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authError) setAuthError(null);
                      }}
                      className="w-full pl-11 pr-11 py-3 min-h-[48px] rounded-xl bg-surface-alt border border-slate-200 text-base text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-brand-blue cursor-pointer"
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[52px] mt-2 py-3.5 px-6 rounded-xl bg-brand-blue hover:bg-brand-blue-light active:scale-[0.99] disabled:opacity-70 text-white font-space-grotesk font-bold text-base shadow-lg shadow-brand-blue/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Verificando acesso...</span>
                    </>
                  ) : (
                    <>
                      <span>Acessar Sorteador</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* PAINEL DO SORTEADOR AUTENTICADO */
          <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8">
            {/* Aviso caso precise rodar a função RPC no Supabase */}
            {needsSqlSetup && (
              <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h2 className="font-space-grotesk font-bold text-base sm:text-lg text-amber-950">
                      Configuração rápida no Supabase necessária (1 passo)
                    </h2>
                    <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                      Como a tabela{" "}
                      <code className="font-mono font-bold">
                        public.inscricoes
                      </code>{" "}
                      está protegida contra leitura direta, cole e execute o
                      comando SQL abaixo no <strong>SQL Editor</strong> do seu
                      Supabase e depois clique em{" "}
                      <strong>&ldquo;Recarregar Inscritos&rdquo;</strong>:
                    </p>
                  </div>
                </div>

                <div className="relative bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-sans font-medium transition-colors cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                  <pre className="pr-24 leading-relaxed">
                    {SQL_SETUP_SNIPPET}
                  </pre>
                </div>

                <button
                  type="button"
                  onClick={() => fetchInscritos(username, password)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-space-grotesk font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  <span>Já executei no Supabase • Recarregar Inscritos</span>
                </button>
              </div>
            )}

            {/* Barra de Status e Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-space-mono uppercase tracking-wider text-sky-200/80">
                    Total no Banco
                  </p>
                  <p className="font-space-grotesk font-extrabold text-2xl sm:text-3xl text-white mt-0.5">
                    {participantes.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-brand-accent">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-space-mono uppercase tracking-wider text-sky-200/80">
                    Aptos para Sorteio
                  </p>
                  <p className="font-space-grotesk font-extrabold text-2xl sm:text-3xl text-brand-accent mt-0.5">
                    {candidatosDisponiveis.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                  <Dices className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-space-mono uppercase tracking-wider text-sky-200/80">
                    Sorteados Agora
                  </p>
                  <p className="font-space-grotesk font-extrabold text-2xl sm:text-3xl text-emerald-400 mt-0.5">
                    {historico.length}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchInscritos(username, password)}
                  disabled={isLoading}
                  title="Sincronizar inscritos com o banco de dados"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-space-grotesk font-bold text-white transition-all cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-brand-accent ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {/* Card Principal do Sorteio */}
            <div className="bg-surface text-text-primary rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-5 sm:p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-accent" />

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-blue-pale text-brand-blue font-space-mono text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-brand-accent" />
                  <span>SORTEADOR OFICIAL • COMETA NORDESTINO</span>
                </div>

                {/* Visor do Sorteio (Estado Inicial / Roleta / Ganhador) */}
                <div className="w-full max-w-2xl min-h-[190px] sm:min-h-[220px] rounded-2xl bg-gradient-to-b from-surface-alt to-brand-blue-pale/40 border-2 border-dashed border-brand-blue/20 p-6 sm:p-8 flex flex-col items-center justify-center transition-all">
                  {isDrawing ? (
                    <div className="space-y-3 animate-pulse">
                      <span className="inline-block px-3 py-1 rounded-full bg-brand-accent/20 text-brand-blue font-space-mono text-xs font-bold uppercase tracking-widest">
                        Sorteando participante...
                      </span>
                      <p className="font-space-grotesk font-extrabold text-2xl sm:text-4xl text-brand-blue break-words">
                        {nomeEmRoleta}
                      </p>
                    </div>
                  ) : ganhadorAtual ? (
                    <div className="space-y-3 w-full">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-accent/20 text-brand-accent flex items-center justify-center mx-auto shadow-sm">
                        <Trophy className="w-8 h-8 sm:w-9 sm:h-9 text-[#b8860b]" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-space-mono text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>GANHADOR(A) SORTEADO(A)!</span>
                      </span>
                      <h2 className="font-space-grotesk font-extrabold text-2xl sm:text-4xl md:text-5xl text-brand-blue tracking-tight break-words">
                        {ganhadorAtual.nomeCompleto}
                      </h2>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-text-secondary font-mono text-xs sm:text-sm break-all">
                        <Mail className="w-4 h-4 text-brand-blue shrink-0" />
                        <span>
                          {ocultarParcialEmail
                            ? maskEmail(ganhadorAtual.email)
                            : ganhadorAtual.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-center">
                      <Dices className="w-12 h-12 text-brand-blue/40 mx-auto" />
                      <h2 className="font-space-grotesk font-bold text-lg sm:text-xl text-brand-blue">
                        {participantes.length === 0
                          ? "Nenhum inscrito encontrado no momento"
                          : "Pronto para realizar o sorteio!"}
                      </h2>
                      <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
                        {participantes.length === 0
                          ? "Assim que os participantes se inscreverem na página inicial, clique em Atualizar."
                          : `Temos ${candidatosDisponiveis.length} participante(s) disponível(is) para o sorteio agora.`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Opções Rápidas */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-text-secondary">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={naoRepetirGanhador}
                      onChange={(e) => setNaoRepetirGanhador(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span>Não repetir ganhadores já sorteados</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ocultarParcialEmail}
                      onChange={(e) =>
                        setOcultarParcialEmail(e.target.checked)
                      }
                      className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span>Ocultar parte do e-mail (Modo Telão)</span>
                  </label>
                </div>

                {/* Botão Principal de Sortear */}
                <button
                  type="button"
                  onClick={handleSortear}
                  disabled={isDrawing || candidatosDisponiveis.length === 0}
                  className="w-full max-w-md min-h-[56px] py-4 px-8 rounded-2xl bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-blue hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-space-grotesk font-extrabold text-lg sm:text-xl shadow-xl shadow-brand-blue/30 flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <Sparkles className="w-6 h-6 text-brand-accent" />
                  <span>
                    {isDrawing
                      ? "Sorteando..."
                      : ganhadorAtual
                        ? "Sortear Próximo Ganhador(a)"
                        : "Realizar Sorteio Agora"}
                  </span>
                </button>
              </div>
            </div>

            {/* Histórico de Sorteados na Sessão */}
            {historico.length > 0 && (
              <div className="bg-surface text-text-primary rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-brand-accent" />
                    <h3 className="font-space-grotesk font-bold text-lg text-brand-blue">
                      Ganhadores Sorteados ({historico.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHistorico([]);
                      setGanhadorAtual(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer self-start sm:self-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Limpar histórico da sessão</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-200">
                  {historico.map((item) => (
                    <div
                      key={`${item.ordem}-${item.participante.id}`}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-brand-accent/20 text-brand-blue font-space-mono font-bold text-xs flex items-center justify-center shrink-0">
                          #{item.ordem}
                        </span>
                        <div>
                          <p className="font-space-grotesk font-bold text-sm sm:text-base text-text-primary">
                            {item.participante.nomeCompleto}
                          </p>
                          <p className="font-mono text-xs text-text-secondary break-all">
                            {ocultarParcialEmail
                              ? maskEmail(item.participante.email)
                              : item.participante.email}
                          </p>
                        </div>
                      </div>
                      <span className="font-space-mono text-xs text-text-muted">
                        Sorteado às {item.horario}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Todos os Inscritos no Banco */}
            <div className="bg-surface text-text-primary rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-space-grotesk font-bold text-lg text-brand-blue">
                    Participantes Inscritos ({participantes.length})
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Lista sincronizada diretamente com o banco de dados no
                    Supabase.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarListaInscritos((prev) => !prev)}
                  className="px-4 py-2 rounded-xl bg-brand-blue-pale text-brand-blue font-space-grotesk font-bold text-xs sm:text-sm hover:brightness-95 transition-all cursor-pointer self-start sm:self-auto"
                >
                  {mostrarListaInscritos
                    ? "Ocultar lista de inscritos"
                    : "Ver lista de inscritos"}
                </button>
              </div>

              {mostrarListaInscritos && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="relative">
                    <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar participante por nome ou e-mail..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-alt border border-slate-200 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>

                  {participantesFiltrados.length === 0 ? (
                    <p className="text-center py-6 text-sm text-text-muted">
                      Nenhum participante encontrado.
                    </p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-200 pr-1">
                      {participantesFiltrados.map((p, idx) => (
                        <div
                          key={p.id}
                          className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-space-mono text-xs text-text-muted w-6">
                              {idx + 1}.
                            </span>
                            <span className="font-semibold text-text-primary">
                              {p.nomeCompleto}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-brand-blue break-all pl-8 sm:pl-0">
                            {ocultarParcialEmail
                              ? maskEmail(p.email)
                              : p.email}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Rodapé */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#00223a]/80 backdrop-blur-md py-4 px-4 sm:px-6 text-center text-xs text-sky-100/70">
        Projeto Cometa Nordestino • Painel Administrativo do Sorteador
      </footer>
    </div>
  );
}
