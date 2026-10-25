-- MEMORA — catalogue et rôles
-- À exécuter une fois, dans SQL Editor, sur une base neuve.
-- Ce fichier n'est pas lu par le navigateur ni par Vercel.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  image text,
  category text,
  product_group text,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.products enable row level security;
alter table public.user_roles enable row level security;

drop policy if exists products_select on public.products;
create policy products_select on public.products
for select
to anon, authenticated
using (available = true or public.is_admin());

drop policy if exists products_insert on public.products;
create policy products_insert on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists products_update on public.products;
create policy products_update on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists products_delete on public.products;
create policy products_delete on public.products
for delete
to authenticated
using (public.is_admin());

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Aucune politique d'écriture : le rôle admin s'attribue uniquement dans SQL Editor.

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.user_roles to authenticated;

insert into public.products (name, description, price, image, category, product_group, available)
select * from (values
  ('Parfum J''adore', 'Flacon de parfum doré posé devant son coffret. Personnalisation possible selon la demande.', 400.00, 'images/parfum-jadore.jpg', 'premium', 'Parfums', true),
  ('Parfum My Way', 'Flacon de parfum violet posé sur un tissu clair. Personnalisation possible selon la demande.', 350.00, 'images/parfum-my-way.jpg', 'premium', 'Parfums', true),
  ('Parfum Acqua di Giò', 'Flacon de parfum noir pour homme. Personnalisation possible selon la demande.', 340.00, 'images/parfum-acqua.jpg', 'premium', 'Parfums', true),
  ('Parfum N°5 et roses', 'Flacon de parfum entouré de roses blanches. Personnalisation possible selon la demande.', 460.00, 'images/parfum-chanel.jpg', 'premium', 'Parfums', true),
  ('Collection de parfums', 'Plusieurs flacons de parfum disposés sur un tissu blanc. Personnalisation possible selon la demande.', 225.00, 'images/parfums-collection.jpg', 'premium', 'Parfums', true),
  ('Huiles parfumées', 'Flacons d''huile parfumée entourés de petites fleurs. Personnalisation possible selon la demande.', 32.50, 'images/huiles-parfumees.jpg', 'moyen', 'Parfums', true),
  ('Tablettes de chocolat', 'Tablettes de chocolat noir, au lait et blanc dans des assiettes. Personnalisation possible selon la demande.', 14.00, 'images/chocolats-tablettes.jpg', 'petit', 'Chocolats', true),
  ('Éclats de chocolat', 'Éclats de chocolat noir et blanc sur fond clair. Personnalisation possible selon la demande.', 17.50, 'images/chocolats-eclats.jpg', 'petit', 'Chocolats', true),
  ('Fleurs du marché', 'Bouquets de roses rouges et de fleurs séchées. Personnalisation possible selon la demande.', 55.00, 'images/fleurs-marche.jpg', 'moyen', 'Fleurs', true),
  ('Roses colorées', 'Roses rouges, jaunes et orange en bouquets. Personnalisation possible selon la demande.', 62.50, 'images/fleurs-roses.jpg', 'moyen', 'Fleurs', true),
  ('Bouquet pastel', 'Bouquet de fleurs roses et blanches emballé de papier. Personnalisation possible selon la demande.', 70.00, 'images/bouquet-pastel.jpg', 'moyen', 'Fleurs', true),
  ('Roses roses et mauves', 'Gros bouquet de roses roses et mauves. Personnalisation possible selon la demande.', 95.00, 'images/bouquet-roses-mauves.jpg', 'premium', 'Fleurs', true),
  ('Bouquet bleu', 'Main tenant un bouquet de fleurs bleues. Personnalisation possible selon la demande.', 55.00, 'images/bouquet-bleu.jpg', 'moyen', 'Fleurs', true),
  ('Bouquet de chrysanthèmes', 'Bouquet rose avec gypsophile posé sur une table. Personnalisation possible selon la demande.', 47.50, 'images/bouquet-chrysanthemes.jpg', 'moyen', 'Fleurs', true),
  ('Smartphone en photo', 'Main tenant un smartphone pour photographier la mer. Personnalisation possible selon la demande.', 950.00, 'images/telephone-mer.jpg', 'premium', 'Téléphones', true),
  ('Samsung Galaxy bleu', 'Téléphone Samsung bleu tenu devant des palmes. Personnalisation possible selon la demande.', 3000.00, 'images/samsung-bleu.jpg', 'premium', 'Téléphones', true),
  ('iPhone avec coque rose', 'iPhone dans une coque rose tenu à la main. Personnalisation possible selon la demande.', 2900.00, 'images/iphone-rose.jpg', 'premium', 'Téléphones', true),
  ('iPhone blanc', 'Dos d''un iPhone blanc à triple capteur photo. Personnalisation possible selon la demande.', 4250.00, 'images/iphone-blanc.jpg', 'premium', 'Téléphones', true),
  ('Samsung pliable', 'Main tenant un téléphone Samsung pliable ouvert. Personnalisation possible selon la demande.', 2500.00, 'images/samsung-flip.jpg', 'premium', 'Téléphones', true),
  ('Samsung Galaxy Note', 'Téléphone Samsung bleu clair sur fond sombre. Personnalisation possible selon la demande.', 1500.00, 'images/samsung-note.jpg', 'premium', 'Téléphones', true),
  ('Collier doré en goutte', 'Collier doré à pendentif en goutte sur un buste. Personnalisation possible selon la demande.', 75.00, 'images/collier-or-buste.jpg', 'premium', 'Bijoux', true),
  ('Collier sur nacre', 'Collier délicat posé sur un coquillage nacré. Personnalisation possible selon la demande.', 50.00, 'images/collier-nacre.jpg', 'moyen', 'Bijoux', true),
  ('Bracelet en écrin', 'Bracelet doré dans un écrin blanc. Personnalisation possible selon la demande.', 45.00, 'images/bracelet-ecrin.jpg', 'moyen', 'Bijoux', true),
  ('Écharpe en tricot', 'Longue écharpe en tricot multicolore. Personnalisation possible selon la demande.', 35.00, 'images/echarpe-tricot.jpg', 'moyen', 'Accessoires', true),
  ('Cravate bleue', 'Cravate bleue à motifs sur fond blanc. Personnalisation possible selon la demande.', 30.00, 'images/cravate-bleue.jpg', 'moyen', 'Accessoires', true),
  ('Coffret de cravates', 'Coffret ouvert contenant des cravates et des foulards. Personnalisation possible selon la demande.', 85.00, 'images/coffret-cravates.jpg', 'premium', 'Accessoires', true),
  ('Voiture noire', 'Voiture noire élégante. Personnalisation possible selon la demande.', 0.00, 'images/voiture-noire.jpg', NULL, 'Autres idées', false),
  ('Jeu de tour en bois', 'Jeu de tour en bois coloré. Personnalisation possible selon la demande.', 32.50, 'images/jeu-tour.jpg', 'moyen', 'Autres idées', true),
  ('Manette de jeu', 'Mains tenant une manette sous une lumière violette. Personnalisation possible selon la demande.', 195.00, 'images/manette-jeu.jpg', 'premium', 'Autres idées', true),
  ('Coffret cadeau rose', 'Coffret hexagonal rose noué d''un ruban bleu. Personnalisation possible selon la demande.', 60.00, 'images/coffret-cadeau-rose.jpg', 'moyen', 'Coffrets', true),
  ('Cadeau fleuri en papier kraft', 'Cadeau emballé en papier kraft, décoré de roses et d''un ruban blanc. Personnalisation possible selon la demande.', 35.00, 'images/coffret-fleurs.jpg', 'moyen', 'Coffrets', true),
  ('Bague dorée ajourée', 'Bague dorée sertie sur un tissu satiné rose. Personnalisation possible selon la demande.', 40.00, 'images/bague-doree.jpg', 'moyen', 'Bijoux', true),
  ('Pendentif vert et doré', 'Pendentif ovale vert ciselé avec chaîne dorée. Personnalisation possible selon la demande.', 57.50, 'images/pendentif-vert.jpg', 'moyen', 'Bijoux', true),
  ('Pendentif en cristal', 'Pendentif argenté orné d''une pierre rectangulaire. Personnalisation possible selon la demande.', 65.00, 'images/pendentif-diamant.jpg', 'moyen', 'Bijoux', true),
  ('Colliers dorés superposés', 'Trois chaînes dorées dont une avec un petit pendentif en coquillage. Personnalisation possible selon la demande.', 45.00, 'images/colliers-dores.jpg', 'moyen', 'Bijoux', true),
  ('Toque et diplôme', 'Mains tenant une toque de diplômé et un diplôme noué d''un ruban rouge. Personnalisation possible selon la demande.', 22.50, 'images/diplome-toque.jpg', 'petit', 'Diplômes', true),
  ('Trois diplômes à ruban rouge', 'Trois diplômés tenant leurs diplômes roulés avec des rubans rouges. Personnalisation possible selon la demande.', 20.00, 'images/diplomes-rubans.jpg', 'petit', 'Diplômes', true),
  ('Gâteau pastel bleu et mauve', 'Gâteau décoré de crème bleue et mauve sur un plateau en bois. Personnalisation possible selon la demande.', 57.50, 'images/gateau-bleu.jpg', 'moyen', 'Gâteaux', true),
  ('Gâteau d''anniversaire fleuri', 'Jeune femme souriante devant un gâteau d''anniversaire avec bougie étincelante. Personnalisation possible selon la demande.', 185.00, 'images/gateau-anniversaire.jpg', 'premium', 'Gâteaux', true),
  ('Bagues en écrin', 'Deux bagues dans leurs écrins en forme de cœur. Personnalisation possible selon la demande.', 55.00, 'images/bijoux-bagues.jpg', 'moyen', 'Bijoux', true),
  ('Tasse fleurie et son café', 'Tasse et soucoupe à fleurs peintes remplie de café. Personnalisation possible selon la demande.', 30.00, 'images/tasse-fleurie-cafe.jpg', 'moyen', 'Tasses & gobelets', true),
  ('Duo de tasses en verre', 'Deux latte dans des tasses en verre sur un plateau en bois. Personnalisation possible selon la demande.', 37.50, 'images/cafe-latte-verre.jpg', 'moyen', 'Tasses & gobelets', true),
  ('Gobelet bleu calligraphié', 'Gobelet bleu orné de calligraphie arabe. Personnalisation possible selon la demande.', 10.00, 'images/gobelet-bleu-calligraphie.jpg', 'petit', 'Tasses & gobelets', true),
  ('Gobelet noir calligraphié', 'Gobelet noir orné de calligraphie arabe. Personnalisation possible selon la demande.', 10.00, 'images/gobelet-noir-calligraphie.jpg', 'petit', 'Tasses & gobelets', true),
  ('Café noir du matin', 'Tasse de café noir près d''un ordinateur portable. Personnalisation possible selon la demande.', 15.00, 'images/cafe-noir-ordinateur.jpg', 'petit', 'Tasses & gobelets', true),
  ('Porte-clés personnalisé', 'Un petit cadeau personnalisable avec un prénom, une photo ou un message selon le modèle.', 10.00, 'images/keychain.svg', 'petit', 'Accessoires', true),
  ('Mug personnalisé', 'Mug avec photo ou texte, adapté à un anniversaire, une fête ou une attention personnelle.', 21.00, 'images/mug.svg', 'moyen', 'Tasses & gobelets', true),
  ('Bracelet personnalisé', 'Un cadeau personnel pour un couple, un ami ou un membre de la famille.', 45.00, 'images/bracelet.svg', 'moyen', 'Bijoux', true),
  ('Collier personnalisé', 'Collier personnalisable, notamment avec photo ou gravure selon le modèle.', 70.00, 'images/collier.svg', 'premium', 'Bijoux', true),
  ('Coffret bloc-notes + stylo', 'Une idée élégante pour un cadeau personnel ou professionnel.', 74.00, 'images/coffret-stylo.svg', 'premium', 'Coffrets', true),
  ('Portefeuille personnalisé', 'Un cadeau utile et personnalisé, adapté notamment aux cadeaux pour homme.', 69.00, 'images/portefeuille.svg', 'premium', 'Accessoires', true)
) as v(name, description, price, image, category, product_group, available)
where not exists (select 1 from public.products);
