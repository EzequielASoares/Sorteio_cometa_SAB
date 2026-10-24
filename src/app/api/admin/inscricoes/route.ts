import { timingSafeEqual } from "node:crypto";

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
function credentialsMatch(value: string, expectedValue: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expectedValue);

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
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

  const expectedUser = process.env.ADMIN_USER;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    console.error("Credenciais do painel administrativo não configuradas.");
    return Response.json(
      { error: "O acesso administrativo ainda não está configurado." },
      { status: 500 },
    );
  }

  if (
    !credentialsMatch(username, expectedUser) ||
    !credentialsMatch(password, expectedPassword)
  ) {
    return Response.json(
      { error: "Usuário ou senha incorretos." },
      { status: 401 },
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return Response.json(
      {
        error:
          "A chave secreta do Supabase ainda não foi configurada no servidor.",
      },
      { status: 500 },
    );
  }

  try {
    const tableResponse = await fetch(
      `${supabaseUrl}/rest/v1/inscricoes?select=id,nome_completo,email,criado_em&order=criado_em.desc`,
      {
        method: "GET",
        headers: {
          apikey: supabaseSecretKey,
          Authorization: `Bearer ${supabaseSecretKey}`,
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

    const tableError = await tableResponse.json().catch(() => null);
    console.error("Erro ao listar inscrições no Supabase:", tableError);

    return Response.json(
      {
        error:
          "Não foi possível carregar as inscrições do banco de dados.",
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
