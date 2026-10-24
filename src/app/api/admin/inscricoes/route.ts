type AdminAuthPayload = {
  username?: unknown;
  password?: unknown;
};

export type ParticipanteInscrito = {
  id: string;
  nomeCompleto: string;
  email: string;
  createdAt: string | null;
};

function normalizeRow(row: Record<string, unknown>, index: number): ParticipanteInscrito {
  const rawName =
    row.nome_completo ??
    row.nomeCompleto ??
    row.nome ??
    row.full_name ??
    "Participante";

  const rawEmail = row.email ?? "";
  const rawId = row.id ?? row.uuid ?? `${rawEmail}-${index}`;
  const rawDate =
    row.created_at ?? row.criado_em ?? row.data_inscricao ?? null;

  return {
    id: String(rawId),
    nomeCompleto: String(rawName).trim(),
    email: String(rawEmail).trim().toLowerCase(),
    createdAt: rawDate ? String(rawDate) : null,
  };
}

export async function POST(request: Request) {
  let payload: AdminAuthPayload;

  try {
    payload = (await request.json()) as AdminAuthPayload;
  } catch {
    return Response.json(
      { error: "Dados de autenticação inválidos." },
      { status: 400 },
    );
  }

  const username =
    typeof payload.username === "string" ? payload.username.trim() : "";
  const password =
    typeof payload.password === "string" ? payload.password : "";

  const expectedUser = process.env.ADMIN_USER || "cometa";
  const expectedPassword = process.env.ADMIN_PASSWORD || "cometa2026";

  if (username !== expectedUser || password !== expectedPassword) {
    return Response.json(
      { error: "Usuário ou senha incorretos." },
      { status: 401 },
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { error: "Configuração do Supabase ausente no servidor." },
      { status: 500 },
    );
  }

  try {
    // 1. Tenta buscar via RPC `listar_inscricoes` (funciona com a chave publishable/anon)
    const rpcResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/listar_inscricoes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({}),
        cache: "no-store",
      },
    );

    if (rpcResponse.ok) {
      const rawData = (await rpcResponse.json()) as Record<string, unknown>[];
      const participantes = (Array.isArray(rawData) ? rawData : []).map(
        (item, idx) => normalizeRow(item, idx),
      );
      return Response.json({ participantes }, { status: 200 });
    }

    // 2. Fallback: tenta buscar diretamente na tabela `inscricoes`
    const tableResponse = await fetch(
      `${supabaseUrl}/rest/v1/inscricoes?select=*`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: "no-store",
      },
    );

    if (tableResponse.ok) {
      const rawData = (await tableResponse.json()) as Record<string, unknown>[];
      const participantes = (Array.isArray(rawData) ? rawData : []).map(
        (item, idx) => normalizeRow(item, idx),
      );
      return Response.json({ participantes }, { status: 200 });
    }

    const rpcError = await rpcResponse.json().catch(() => null);
    console.error("Erro ao listar inscrições no Supabase:", rpcError);

    return Response.json(
      {
        error:
          "A função SQL `listar_inscricoes` ainda não foi criada no Supabase (ou a tabela está sem permissão de leitura). Execute o arquivo `supabase/listar_inscricoes.sql` no SQL Editor do Supabase.",
        needsSqlSetup: true,
      },
      { status: 502 },
    );
  } catch (error) {
    console.error("Erro ao conectar ao Supabase no painel admin:", error);
    return Response.json(
      { error: "Falha ao conectar com o banco de dados do Supabase." },
      { status: 502 },
    );
  }
}
