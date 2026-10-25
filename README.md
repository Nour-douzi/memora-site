# MEMORA — boutique connectée (TP 3)

Site HTML/CSS/JS publié comme site statique. Auth et données : Supabase. Hébergement : Vercel. Voir `SUPABASE.md` pour les opérations manuelles.

## 1. Arborescence
- index.html : accueil
- produits.html : catalogue lu depuis Supabase
- produit-vedette.html : détail du coffret principal
- a-propos.html, contact.html
- signup.html, login.html, verification.html, compte.html
- panier.html, checkout.html, confirmation.html
- admin.html : produits et commandes (rôle admin)
- style.css, script.js, supabase-client.js, supabase-shop.js
- supabase-setup.sql, supabase-orders.sql, supabase-admin.sql
- SUPABASE.md : consignes adaptées au projet
- images/

## 1. Arborescence
- index.html : accueil
- produits.html : catalogue
- produit-vedette.html : détail du coffret principal
- a-propos.html : mission, clients, partenaires et canaux
- contact.html : formulaire de demande
- style.css : design responsive
- script.js : menu mobile, filtre, formulaire et retour en haut
- images/ : dossier prévu pour les vraies images du projet

## 2. Ouvrir le projet
Dans VS Code ou Cursor : File > Open Folder > choisir le dossier `memora-site`.

## 3. Méthode sans terminal
Ouvrir `index.html` dans un navigateur.

## 4. Méthode Live Server
Installer l'extension `Live Server`, ouvrir `index.html`, clic droit > Open with Live Server.

## 5. Méthode Python
Dans le terminal :
```text
python --version
python -m http.server 8000
```
Puis ouvrir :
`http://localhost:8000`

Pour arrêter :
`Ctrl + C`

## 6. Informations à compléter
Le BMC ne fournit pas :
- numéro WhatsApp réel ;
- adresse e-mail ;
- liens Instagram/TikTok réels ;
- adresse de l'entreprise ;
- tarifs fixes ;
- vraies photos des produits.

Ces éléments ne sont donc pas inventés dans le site.

## 7. Politique de prix
Le site propose un budgetateur : le client fixe son budget, puis MEMORA propose une catégorie de cadeaux compatible. Les exemples de prix sont basés sur des prix observés en Tunisie en octobre 2026. Ils doivent être revérifiés avant publication/commande, car les vendeurs peuvent modifier leurs tarifs.

## 8. Coordonnées ajoutées
- WhatsApp : 23 109 233
- Email : nourdouzi2007@gmail.com
- Instagram : @Douzi8314

Les images dans `images/` sont des illustrations originales servant de visuels de présentation. Elles ne prétendent pas représenter exactement le stock d'un fournisseur.
