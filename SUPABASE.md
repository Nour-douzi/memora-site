# MEMORA — consignes Supabase et Vercel

Projet étudiant : boutique de cadeaux personnalisés. Devise : **DT (TND)**. Livraison de démonstration : **7 DT** si le sous-total catalogue est inférieur à 100 DT, **offerte** au-delà. Paiement **simulé** uniquement.

L’agent a préparé le code. **Vous** exécutez le SQL, configurez Auth, GitHub et Vercel. Un fichier `.sql` n’est jamais exécuté par le navigateur ni par Vercel.

## 1. Fichiers concernés

| Fichier | Rôle |
| --- | --- |
| `supabase-client.js` | URL + clé **publishable** + `createClient` |
| `supabase-shop.js` | Auth, catalogue, commandes, admin |
| `script.js` | Panier local, menu, budget |
| `supabase-setup.sql` | Tables `products`, `user_roles`, RLS, catalogue initial |
| `supabase-orders.sql` | Table `orders`, RLS, `create_demo_order`, `update_order_status` |
| `supabase-admin.sql` | Attribution manuelle du rôle admin |

## 2. Projet Supabase (à faire dans le tableau de bord)

1. Créez un projet personnel (`boutique-prenom`). Ne réutilisez pas EcoBox.
2. Connect → copiez **Project URL** et **Publishable key** (`sb_publishable_…`).
3. Collez-les dans `supabase-client.js` à la place des valeurs actuelles si besoin.
4. **Ne mettez jamais** une clé `sb_secret_`, `service_role` ou le mot de passe de la base dans le site.

Valeurs actuellement dans le projet :

- URL : `https://pbvgyjsyvfvzcusldaez.supabase.co`
- Clé : publishable déjà présente dans `supabase-client.js`

## 3. SQL Editor (ordre obligatoire)

1. `supabase-setup.sql` (base neuve).
2. `supabase-orders.sql` (relançable, ne supprime pas les commandes).
3. Table Editor : vérifier `products`, `user_roles`, `orders` avec **RLS activé**.
4. Après inscription + confirmation e-mail : `supabase-admin.sql` avec **votre UUID**.

Ne désactivez jamais RLS pour « corriger » une erreur.

## 4. Authentification

Authentication → URL Configuration :

- Site URL locale : `http://localhost:8000`
- Redirect URLs : `http://localhost:8000/**` et, après déploiement, `https://VOTRE-PROJET.vercel.app/**`

Parcours :

1. `signup.html` avec une adresse que vous consultez.
2. Lien dans l’e-mail (indésirables possibles).
3. `login.html` puis `compte.html`.
4. Authentication → Users → copier l’UUID.
5. Remplacer `VOTRE-UUID` dans `supabase-admin.sql` et exécuter.
6. Déconnexion / reconnexion : le lien **Admin** apparaît.

## 5. Pages à tester

- Visiteur : catalogue des produits **disponibles** uniquement ; pas de commandes ; checkout invite à se connecter.
- Client A : commande démo → historique ; panier vidé **seulement après succès**.
- Client B : ne voit pas les commandes de A ; ne peut changer ni rôle, ni prix, ni statut.
- Admin : CRUD produits (suppression avec confirmation) ; toutes les commandes ; changement de statut. Un conflit de version affiche un message.

Le panier est dans `localStorage` (`memora_cart`). Les prix de la commande sont **recalculés par la fonction SQL** à partir de `products`. Une coupure réseau au moment du clic réutilise la même clé d’idempotence : pas de doublon.

## 6. Vercel

1. Dépôt GitHub personnel.
2. Import Vercel, preset **Other**, pas de commande de build, racine = dossier de `index.html`.
3. Noter `https://….vercel.app`.
4. Ajouter cette URL dans Auth (étape 4).
5. Retester le parcours sur HTTPS.

## 7. Ce que l’agent n’a pas fait

- Exécuter le SQL dans votre projet.
- Confirmer votre e-mail.
- Vous promouvoir admin.
- Créer le dépôt GitHub ni le déploiement Vercel.
