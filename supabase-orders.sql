-- MEMORA — commandes de démonstration
-- Relançable : ne supprime pas les commandes existantes.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'en_attente'
    check (status in ('en_attente', 'confirmee', 'expediee', 'livree', 'annulee')),
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  payment_method text not null,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping numeric(12,2) not null check (shipping >= 0),
  total numeric(12,2) not null check (total >= 0),
  items jsonb not null,
  idempotency_key uuid not null unique,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Pas d'INSERT / UPDATE / DELETE direct : uniquement via les fonctions.

grant select on public.orders to authenticated;

create or replace function public.create_demo_order(
  p_items jsonb,
  p_customer_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_payment_method text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_existing public.orders;
  v_item jsonb;
  v_product public.products;
  v_qty integer;
  v_pid uuid;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 7.00;
  v_order public.orders;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_idempotency_key is null then
    raise exception 'IDEMPOTENCY_REQUIRED';
  end if;

  select * into v_existing
  from public.orders
  where idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object('ok', true, 'duplicate', true, 'order', to_jsonb(v_existing));
  end if;

  if p_customer_name is null or length(trim(p_customer_name)) < 2
     or p_phone is null or length(trim(p_phone)) < 8
     or p_address is null or length(trim(p_address)) < 4
     or p_city is null or length(trim(p_city)) < 2 then
    raise exception 'INVALID_FORM';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_pid := (v_item->>'id')::uuid;
    exception when others then
      raise exception 'INVALID_PRODUCT';
    end;

    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_qty < 1 or v_qty > 20 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select * into v_product from public.products where id = v_pid;
    if not found or v_product.available is not true then
      raise exception 'UNAVAILABLE_PRODUCT';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'price', v_product.price,
      'quantity', v_qty,
      'image', v_product.image
    ));
  end loop;

  if v_subtotal >= 100 then
    v_shipping := 0;
  end if;

  insert into public.orders (
    user_id, customer_name, phone, address, city, payment_method,
    subtotal, shipping, total, items, idempotency_key
  ) values (
    v_user, trim(p_customer_name), trim(p_phone), trim(p_address), trim(p_city),
    coalesce(nullif(trim(p_payment_method), ''), 'simulation'),
    v_subtotal, v_shipping, v_subtotal + v_shipping, v_lines, p_idempotency_key
  )
  returning * into v_order;

  return jsonb_build_object('ok', true, 'duplicate', false, 'order', to_jsonb(v_order));
exception
  when unique_violation then
    select * into v_existing from public.orders where idempotency_key = p_idempotency_key;
    return jsonb_build_object('ok', true, 'duplicate', true, 'order', to_jsonb(v_existing));
end;
$$;

create or replace function public.update_order_status(
  p_id uuid,
  p_status text,
  p_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if p_status not in ('en_attente', 'confirmee', 'expediee', 'livree', 'annulee') then
    raise exception 'INVALID_STATUS';
  end if;

  update public.orders
  set status = p_status, version = version + 1
  where id = p_id and version = p_version
  returning * into v_order;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'CONFLICT');
  end if;

  return jsonb_build_object('ok', true, 'order', to_jsonb(v_order));
end;
$$;

revoke all on function public.create_demo_order(jsonb, text, text, text, text, text, uuid) from public;
revoke all on function public.update_order_status(uuid, text, integer) from public;
grant execute on function public.create_demo_order(jsonb, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.update_order_status(uuid, text, integer) to authenticated;
