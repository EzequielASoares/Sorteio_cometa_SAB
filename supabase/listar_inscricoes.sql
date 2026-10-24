-- Execute este comando no SQL Editor do seu projeto no Supabase
-- para permitir que a rota protegida /admin busque os inscritos para o sorteio:

create or replace function public.listar_inscricoes()
returns setof jsonb
language sql
security definer
set search_path = public
as $$
  select to_jsonb(i)
  from public.inscricoes i;
$$;

grant execute on function public.listar_inscricoes() to anon, authenticated;
