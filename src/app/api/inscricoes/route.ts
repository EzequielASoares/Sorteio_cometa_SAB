const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InscricaoPayload = {
  nomeCompleto?: unknown;
  email?: unknown;
};

export async function POST(request: Request) {
  let payload: InscricaoPayload;

  try {
    payload = (await request.json()) as InscricaoPayload;
  } catch {
    return Response.json({ error: "Dados da inscrição inválidos." }, { status: 400 });
  }

  const nomeCompleto =
    typeof payload.nomeCompleto === "string"
      ? payload.nomeCompleto.trim().replace(/\s+/g, " ")
      : "";
  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

  if (nomeCompleto.length < 5 || nomeCompleto.split(" ").length < 2) {
    return Response.json(
      { error: "Informe seu nome e sobrenome completos." },
      { status: 400 },
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    console.error("Configuração do Supabase ausente.");
    return Response.json(
      { error: "O sistema de inscrições ainda não está configurado." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/registrar_inscricao`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${supabasePublishableKey}`,
        },
        body: JSON.stringify({
          p_nome_completo: nomeCompleto,
          p_email: email,
        }),
        cache: "no-store",
      },
    );

    if (response.ok) {
      return new Response(null, { status: 201 });
    }

    const details = (await response.json().catch(() => null)) as {
      code?: string;
    } | null;

    if (details?.code === "23505") {
      return Response.json(
        { error: "Este e-mail já está inscrito no sorteio." },
        { status: 409 },
      );
    }

    console.error("Falha ao salvar inscrição no Supabase:", details);
    return Response.json(
      { error: "Não foi possível registrar sua inscrição. Tente novamente." },
      { status: 502 },
    );
  } catch (error) {
    console.error("Erro ao conectar ao Supabase:", error);
    return Response.json(
      { error: "Não foi possível registrar sua inscrição. Tente novamente." },
      { status: 502 },
    );
  }
}
