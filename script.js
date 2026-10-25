const menuButton = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const opened = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", opened ? "true" : "false");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}

const contactForm = document.querySelector("#contactForm");
const successMessage = document.querySelector("#successMessage");

if (contactForm && successMessage) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    successMessage.style.display = "block";
    contactForm.reset();
  });
}

const topButton = document.querySelector(".top");
if (topButton) {
  window.addEventListener("scroll", () => {
    topButton.classList.toggle("show", window.scrollY > 500);
  });
  topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

const budgetForm = document.querySelector("#budgetForm");
const budgetAmount = document.querySelector("#budgetAmount");
const budgetResult = document.querySelector("#budgetResult");

if (budgetForm && budgetAmount && budgetResult) {
  budgetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const budget = Number(budgetAmount.value);
    if (!budget || budget < 5) {
      budgetResult.className = "budget-result show";
      budgetResult.innerHTML = "<strong>Entrez un budget d'au moins 5 DT.</strong>";
      return;
    }

    let message = "";
    if (budget < 20) {
      message = "Petit budget : porte-clés personnalisé (environ 5–15 DT).";
    } else if (budget < 40) {
      message = "Budget moyen : mug personnalisé (environ 19–23 DT) + un petit accessoire.";
    } else if (budget < 70) {
      message = "Budget confort : bracelet personnalisé autour de 45 DT ou collier personnalisé autour de 65 DT.";
    } else if (budget < 100) {
      message = "Budget premium : coffret bloc-notes + stylo autour de 74 DT ou portefeuille personnalisé autour de 69 DT.";
    } else {
      message = "Budget élevé : un coffret avec plusieurs cadeaux personnalisés est possible.";
    }
    budgetResult.className = "budget-result show";
    budgetResult.innerHTML = "<strong>Suggestion MEMORA :</strong> " + message;
  });
}

const GROUPES = ["Tous", "Coffrets", "Bijoux", "Parfums", "Fleurs", "Chocolats", "Téléphones", "Tasses & gobelets", "Gâteaux", "Diplômes", "Accessoires", "Autres idées"];
const groupeActif = new URLSearchParams(location.search).get("groupe") || "Tous";
const entete = document.querySelector("header");
if (entete) {
  const nav = document.createElement("nav");
  nav.className = "catbar";
  nav.setAttribute("aria-label", "Groupes de produits");
  nav.innerHTML = GROUPES.map((g) =>
    `<a href="produits.html${g === "Tous" ? "" : "?groupe=" + encodeURIComponent(g)}" ${g === groupeActif ? 'aria-current="true"' : ""}>${g}</a>`
  ).join("");
  entete.after(nav);
}

const filtre = document.querySelector("#productFilter");
function appliquerFiltres() {
  const b = filtre ? filtre.value : "all";
  document.querySelectorAll(".product-card").forEach((c) => {
    const okG = groupeActif === "Tous" || c.dataset.group === groupeActif;
    const okB = b === "all" || c.dataset.category === b;
    c.style.display = okG && okB ? "" : "none";
  });
}
if (filtre) {
  filtre.addEventListener("change", appliquerFiltres);
  appliquerFiltres();
}

function getCart() {
  const cart = localStorage.getItem("memora_cart");
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem("memora_cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const countSpan = document.getElementById("cart-count");
  if (countSpan) countSpan.textContent = totalItems;
}

function addToCart(product) {
  const cart = getCart();
  const existingItem = cart.find((item) => item.id === product.id);
  if (existingItem) existingItem.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  saveCart(cart);
  alert("Produit ajouté au panier.");
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
});
