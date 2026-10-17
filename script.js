
// Menu mobile
const menuButton = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const opened = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", opened ? "true" : "false");
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}


// Formulaire de contact : démonstration sans serveur
const contactForm = document.querySelector("#contactForm");
const successMessage = document.querySelector("#successMessage");

if (contactForm && successMessage) {
  contactForm.addEventListener("submit", event => {
    event.preventDefault();
    successMessage.style.display = "block";
    contactForm.reset();
  });
}

// Bouton retour en haut
const topButton = document.querySelector(".top");
if (topButton) {
  window.addEventListener("scroll", () => {
    topButton.classList.toggle("show", window.scrollY > 500);
  });
  topButton.addEventListener("click", () => window.scrollTo({top: 0, behavior: "smooth"}));
}

// Recommandation selon le budget du client
const budgetForm = document.querySelector("#budgetForm");
const budgetAmount = document.querySelector("#budgetAmount");
const budgetResult = document.querySelector("#budgetResult");

if (budgetForm && budgetAmount && budgetResult) {
  budgetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const budget = Number(budgetAmount.value);
    if (!budget || budget < 5) {
      budgetResult.className = "budget-result show";
      budgetResult.innerHTML = "<strong>Entre un budget d'au moins 5 DT.</strong>";
      return;
    }

    let message = "";
    if (budget < 20) {
      message = "Petit budget : porte-clés personnalisé (environ 5–15 DT). Il reste possible d'ajouter une petite carte ou un emballage selon le coût choisi.";
    } else if (budget < 40) {
      message = "Budget moyen : mug personnalisé (environ 19–23 DT) + un petit accessoire, selon les options et l'emballage.";
    } else if (budget < 70) {
      message = "Budget confort : bracelet personnalisé autour de 45 DT ou collier personnalisé autour de 65 DT.";
    } else if (budget < 100) {
      message = "Budget premium : coffret bloc-notes + stylo autour de 74 DT ou portefeuille personnalisé autour de 69 DT, avec emballage selon le budget restant.";
    } else {
      message = "Budget élevé : nous pouvons composer un coffret avec plusieurs cadeaux personnalisés. Le montant final dépend des produits, de la personnalisation et de la livraison.";
    }
    budgetResult.className = "budget-result show";
    budgetResult.innerHTML = "<strong>Suggestion MEMORA :</strong> " + message +
      "<div class='source-note'>Les fourchettes sont basées sur des prix actuellement observés chez des vendeurs tunisiens ; le prix final MEMORA doit être confirmé avant commande.</div>";
  });
}


// Barre des groupes de produits (insérée sous l'en-tête de chaque page)
const GROUPES=["Tous","Coffrets","Bijoux","Parfums","Fleurs","Chocolats","Téléphones","Tasses & gobelets","Gâteaux","Diplômes","Accessoires","Autres idées"];
const groupeActif=new URLSearchParams(location.search).get("groupe")||"Tous";
const entete=document.querySelector("header");
if(entete){
  const nav=document.createElement("nav");nav.className="catbar";nav.setAttribute("aria-label","Groupes de produits");
  nav.innerHTML=GROUPES.map(g=>`<a href="produits.html${g==="Tous"?"":"?groupe="+encodeURIComponent(g)}" ${g===groupeActif?'aria-current="true"':""}>${g}</a>`).join("");
  entete.after(nav);
}
// Filtres combinés : groupe (barre) + budget (liste)
const filtre=document.querySelector("#productFilter");
function appliquerFiltres(){
  const b=filtre?filtre.value:"all";
  document.querySelectorAll(".product-card").forEach(c=>{
    const okG=groupeActif==="Tous"||c.dataset.group===groupeActif;
    const okB=b==="all"||c.dataset.category===b;
    c.style.display=(okG&&okB)?"":"none";
  });
}
if(filtre){filtre.addEventListener("change",appliquerFiltres);appliquerFiltres();}
