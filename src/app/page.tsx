"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  User,
  Mail,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Globe,
  ShieldCheck,
} from "lucide-react";

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const INSTAGRAM_URL = "https://www.instagram.com/cometanordestino/";
const OFFICIAL_SITE_URL = "https://cometanordestino.ect.ufrn.br";

export default function SorteioInscricaoPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [visitedInstagram, setVisitedInstagram] = useState(false);
  const [confirmedFollow, setConfirmedFollow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      return "Por favor, informe seu nome completo.";
    }
    if (trimmedName.split(/\s+/).length < 2 || trimmedName.length < 5) {
      return "Digite seu nome e sobrenome completos para o sorteio.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return "Por favor, insira um endereço de e-mail válido.";
    }

    if (!confirmedFollow) {
      return "Confirme que você segue o @cometanordestino no Instagram para validar sua participação.";
    }

    return null;
  };

  const handleInstagramClick = () => {
    setVisitedInstagram(true);
    setConfirmedFollow(true);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inscricoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeCompleto: fullName,
          email,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(
          payload?.error ??
            "Não foi possível registrar sua inscrição. Tente novamente.",
        );
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("Não foi possível registrar sua inscrição. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#002b49] via-brand-blue to-[#003457] text-white relative overflow-x-hidden">
      {/* Elementos decorativos espaciais / Cometa Nordestino */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        {/* Brilhos de fundo */}
        <div className="absolute -top-24 -left-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-brand-blue-light/40 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 sm:w-[28rem] sm:h-[28rem] rounded-full bg-brand-accent/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full bg-sky-400/10 blur-3xl" />

        {/* Estrelas sutis */}
        <span className="hidden sm:block absolute top-24 left-[12%] w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
        <span className="absolute top-16 right-[18%] w-1 h-1 rounded-full bg-brand-accent/80 animate-pulse" />
        <span className="absolute bottom-28 left-[8%] w-1.5 h-1.5 rounded-full bg-brand-accent/60 animate-pulse" />
        <span className="hidden md:block absolute top-1/2 left-[48%] w-1 h-1 rounded-full bg-white/40" />

        {/* Cometa animado */}
        <div className="absolute top-28 left-0 w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_16px_4px_rgba(212,160,23,0.7)] animate-comet opacity-70" />
        <div className="absolute top-2/3 left-0 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_12px_3px_rgba(255,255,255,0.6)] animate-comet-delayed opacity-50" />
      </div>

      {/* Cabeçalho Responsivo */}
      <header className="relative z-20 w-full border-b border-white/10 bg-[#002b49]/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          <a
            href={OFFICIAL_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none"
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 p-0.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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
                UFRN • UEFS • IFBA
              </span>
            </div>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={OFFICIAL_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Globe className="w-4 h-4 text-brand-accent" />
              <span>Site Oficial</span>
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleInstagramClick}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <InstagramIcon className="w-4 h-4 shrink-0" />
              <span>@cometanordestino</span>
            </a>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Coluna Esquerda: Identidade Visual e Chamada do Projeto */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5 sm:space-y-6">
            {/* Logo em Destaque */}
            <div className="relative flex flex-col items-center lg:items-start">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-sm p-2 border border-white/20 shadow-2xl animate-float">
                <Image
                  src="/images/logo.png"
                  alt="Emblema Cometa Nordestino"
                  width={160}
                  height={160}
                  className="w-full h-full object-contain drop-shadow-xl"
                  priority
                />
              </div>

              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-accent/20 border border-brand-accent/40 text-brand-accent font-space-mono text-xs sm:text-sm font-bold tracking-wide">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>SORTEIO OFICIAL • COMETA NORDESTINO</span>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 max-w-xl">
              <h1 className="font-space-grotesk font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.1] text-white">
                Inscreva-se e concorra no nosso{" "}
                <span className="text-brand-accent underline decoration-brand-accent/40 decoration-wavy underline-offset-8">
                  Sorteio!
                </span>
              </h1>
            </div>

            {/* Passos rápidos — visíveis tanto no mobile quanto no desktop */}
            <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
              <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5 p-3 sm:p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm text-left">
                <span className="w-7 h-7 rounded-lg bg-brand-accent text-[#002b49] font-space-mono font-bold text-xs flex items-center justify-center shrink-0">
                  01
                </span>
                <div>
                  <p className="font-space-grotesk font-bold text-xs sm:text-sm text-white">
                    Seus Dados
                  </p>
                  <p className="text-xs text-sky-100/80">
                    Nome completo e e-mail
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5 p-3 sm:p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm text-left">
                <span className="w-7 h-7 rounded-lg bg-brand-accent text-[#002b49] font-space-mono font-bold text-xs flex items-center justify-center shrink-0">
                  02
                </span>
                <div>
                  <p className="font-space-grotesk font-bold text-xs sm:text-sm text-white">
                    Siga no Insta
                  </p>
                  <p className="text-xs text-sky-100/80">@cometanordestino</p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5 p-3 sm:p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm text-left">
                <span className="w-7 h-7 rounded-lg bg-brand-accent text-[#002b49] font-space-mono font-bold text-xs flex items-center justify-center shrink-0">
                  03
                </span>
                <div>
                  <p className="font-space-grotesk font-bold text-xs sm:text-sm text-white">
                    Boa Sorte!
                  </p>
                  <p className="text-xs text-sky-100/80">
                    Inscrição confirmada
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Card do Formulário de Inscrição */}
          <div className="lg:col-span-6 w-full max-w-lg mx-auto lg:max-w-none">
            <div className="bg-surface text-text-primary rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-5 sm:p-8 md:p-9 relative overflow-hidden">
              {/* Barra superior com as cores da marca */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-accent" />

              {!isSubmitted ? (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-5 sm:space-y-6"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-brand-blue-pale text-brand-blue font-space-mono text-xs font-bold">
                        INSCRIÇÃO GRATUITA
                      </span>
                      <span className="text-xs text-text-muted font-medium">
                        * Campos obrigatórios
                      </span>
                    </div>
                    <h2 className="font-space-grotesk font-bold text-xl sm:text-2xl text-brand-blue pt-1">
                      Dados do Participante
                    </h2>
                    <p className="text-xs sm:text-sm text-text-secondary">
                      Preencha corretamente para que possamos entrar em contato
                      caso você seja sorteado(a).
                    </p>
                  </div>

                  {/* Alerta de erro de validação */}
                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm"
                    >
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Campo: Nome Completo */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="fullName"
                      className="block text-xs sm:text-sm font-semibold text-text-primary"
                    >
                      Nome completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-muted">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Ex.: Maria Clara da Silva"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full pl-11 pr-4 py-3 sm:py-3.5 min-h-[48px] rounded-xl bg-surface-alt border border-slate-200 text-base text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Campo: E-mail Completo */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="block text-xs sm:text-sm font-semibold text-text-primary"
                    >
                      Seu melhor e-mail <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-muted">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        required
                        autoComplete="email"
                        placeholder="Ex.: seu.email@exemplo.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full pl-11 pr-4 py-3 sm:py-3.5 min-h-[48px] rounded-xl bg-surface-alt border border-slate-200 text-base text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Card de Ação: Instagram Cometa Nordestino */}
                  <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-brand-blue-pale/80 via-white to-amber-50/60 border border-brand-blue/15 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <InstagramIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-space-mono font-bold uppercase tracking-wider text-brand-blue">
                            Requisito do Sorteio
                          </span>
                          <h3 className="font-space-grotesk font-bold text-sm sm:text-base text-text-primary leading-snug">
                            Siga o @cometanordestino
                          </h3>
                        </div>
                      </div>

                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleInstagramClick}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-space-grotesk font-bold text-xs sm:text-sm bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md hover:brightness-110 active:scale-[0.99] transition-all shrink-0"
                      >
                        <span>Abrir Instagram</span>
                        <ExternalLink className="w-4 h-4 shrink-0" />
                      </a>
                    </div>

                    {/* Checkbox de confirmação de seguidor */}
                    <label className="flex items-start gap-3 pt-2 border-t border-brand-blue/10 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={confirmedFollow}
                        onChange={(e) => {
                          setConfirmedFollow(e.target.checked);
                          if (error) setError(null);
                        }}
                        className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer shrink-0"
                      />
                      <span className="text-xs sm:text-sm text-text-secondary group-hover:text-text-primary transition-colors leading-snug">
                        Já sigo (ou cliquei acima para seguir) o perfil oficial{" "}
                        <strong className="text-brand-blue font-semibold">
                          @cometanordestino
                        </strong>{" "}
                        no Instagram.
                        {visitedInstagram && (
                          <span className="ml-1.5 inline-flex items-center gap-1 text-emerald-700 font-medium">
                            • Link acessado ✓
                          </span>
                        )}
                      </span>
                    </label>
                  </div>

                  {/* Botão Principal de Envio */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[52px] py-3.5 px-6 rounded-xl bg-brand-blue hover:bg-brand-blue-light active:scale-[0.99] disabled:opacity-70 text-white font-space-grotesk font-bold text-base sm:text-lg shadow-lg shadow-brand-blue/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Registrando sua inscrição...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmar participação no sorteio</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-text-muted text-center">
                    <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
                    <span>
                      Seus dados serão utilizados exclusivamente para o sorteio
                      do projeto Cometa Nordestino.
                    </span>
                  </p>
                </form>
              ) : (
                /* Tela de Confirmação de Inscrição */
                <div className="py-4 sm:py-6 text-center space-y-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-space-mono text-xs font-bold">
                      INSCRIÇÃO CONFIRMADA!
                    </span>
                    <h2 className="font-space-grotesk font-extrabold text-2xl sm:text-3xl text-brand-blue">
                      Você está participando!
                    </h2>
                    <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto">
                      Boa sorte! Confira abaixo o resumo da sua inscrição no
                      sorteio do <strong>Cometa Nordestino</strong>:
                    </p>
                  </div>

                  <div className="bg-surface-alt border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-left space-y-2.5 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/70 pb-2.5">
                      <span className="text-text-muted font-medium">
                        Participante:
                      </span>
                      <span className="font-semibold text-text-primary break-words">
                        {fullName.trim()}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/70 pb-2.5">
                      <span className="text-text-muted font-medium">
                        E-mail cadastrado:
                      </span>
                      <span className="font-mono text-brand-blue font-medium break-all">
                        {email.trim()}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-text-muted font-medium">
                        Instagram oficial:
                      </span>
                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-pink-600 hover:underline"
                      >
                        <span>@cometanordestino</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-center pt-2">
                    <a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl font-space-grotesk font-bold text-sm bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md hover:brightness-110 flex items-center justify-center gap-2 transition-all"
                    >
                      <InstagramIcon className="w-4 h-4" />
                      <span>Ver Instagram do Projeto</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé Institucional Responsivo */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#00223a]/80 backdrop-blur-md py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="Cometa Nordestino"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
            <p className="text-xs sm:text-sm text-sky-100/80">
              <strong className="text-white font-space-grotesk">
                Projeto Cometa Nordestino
              </strong>{" "}
              • Extensão Universitária (ECT/UFRN, UEFS e IFBA)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-sky-100/80">
            <a
              href={OFFICIAL_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-accent transition-colors underline underline-offset-4"
            >
              cometanordestino.ect.ufrn.br
            </a>
            <span className="opacity-40">•</span>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-brand-accent transition-colors font-medium"
            >
              <InstagramIcon className="w-3.5 h-3.5" />
              <span>@cometanordestino</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
