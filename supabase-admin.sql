-- MEMORA — attribution du rôle administrateur
-- 1. Créez et confirmez un compte sur le site (signup.html).
-- 2. Dans Supabase : Authentication → Users, copiez l'UUID.
-- 3. Remplacez VOTRE-UUID ci-dessous, puis exécutez ce script dans SQL Editor.
-- Ne jamais attribuer ce rôle depuis le navigateur.

insert into public.user_roles (user_id, role)
values ('VOTRE-UUID', 'admin')
on conflict (user_id) do update set role = excluded.role;
