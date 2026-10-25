var groupeActif = new URLSearchParams(location.search).get("groupe") || "Tous";
const SHOP = {
  page: document.body?.dataset?.page || "",
  session: null,
  isAdmin: false,
};

function money(value) {
  const n = Number(value) || 0;
  return n.toFixed(2).replace(".", ",") + " DT";
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showFlash(el, message, kind) {
  if (!el) return;
  el.className = "flash " + (kind || "info");
  el.textContent = message;
  el.hidden = false;
}

function frenchError(err) {
  const raw = String(err?.message || err || "");
  if (/AUTH_REQUIRED/i.test(raw)) return "Connectez-vous pour passer une commande.";
  if (/EMPTY_CART/i.test(raw)) return "Le panier est vide.";
  if (/UNAVAILABLE_PRODUCT/i.test(raw)) return "Un article du panier n'est plus disponible.";
  if (/INVALID_FORM/i.test(raw)) return "Vérifiez le nom, le téléphone, l'adresse et la ville.";
  if (/INVALID_QUANTITY/i.test(raw)) return "Quantité invalide.";
  if (/FORBIDDEN/i.test(raw)) return "Action réservée à l'administrateur.";
  if (/CONFLICT/i.test(raw)) return "Cette commande a été modifiée ailleurs. Rechargez la liste.";
  if (/Failed to fetch|NetworkError|TypeError/i.test(raw)) return "Réseau indisponible. Réessayez : la commande ne sera pas dupliquée.";
  if (/Invalid login credentials/i.test(raw)) return "E-mail ou mot de passe incorrect.";
  if (/Email not confirmed/i.test(raw)) return "Confirmez d'abord votre e-mail (lien reçu dans votre boîte).";
  if (/already registered/i.test(raw)) return "Un compte existe déjà avec cet e-mail.";
  return raw || "Une erreur s'est produite.";
}

async function getSession() {
  const { data } = await sb.auth.getSession();
  SHOP.session = data.session || null;
  return SHOP.session;
}

async function refreshRole() {
  SHOP.isAdmin = false;
  if (!SHOP.session) return false;
  const { data, error } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", SHOP.session.user.id)
    .maybeSingle();
  if (error) return false;
  SHOP.isAdmin = data?.role === "admin";
  return SHOP.isAdmin;
}

function updateNavAuth() {
  const account = document.getElementById("nav-account");
  const adminItem = document.getElementById("nav-admin");
  if (account) {
    if (SHOP.session) {
      account.href = "compte.html";
      account.textContent = "Compte";
    } else {
      account.href = "login.html";
      account.textContent = "Connexion";
    }
  }
  if (adminItem) {
    adminItem.hidden = !SHOP.isAdmin;
  }
}

sb.auth.onAuthStateChange(async (_event, session) => {
  SHOP.session = session;
  await refreshRole();
  updateNavAuth();
});

async function loadProducts() {
  const { data, error } = await sb
    .from("products")
    .select("id,name,description,price,image,category,product_group,available")
    .order("product_group", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

function renderCatalog(products) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  if (!products || !products.length) {
      grid.innerHTML = '<p class="empty-state">Aucun cadeau disponible pour le moment.</p>';
      return;
  }

  grid.innerHTML = products.map(p => {
      // تنظيف السعر واستخراج الرقم المفرد
      let priceStr = String(p.price || 0);
      if (priceStr.includes('-')) {
          priceStr = priceStr.split('-')[0].trim();
      }
      let cleanPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;

      return `
      <article class="card product-card" data-id="${p.id}" data-category="${escapeHtml(p.category || "")}" data-group="${escapeHtml(p.product_group || "")}">
          <img class="product-photo" src="${escapeHtml(p.image || "")}" alt="${escapeHtml(p.name)}" loading="lazy">
          <div class="product-body">
              <span class="tag">${escapeHtml(p.product_group || "Cadeau")}</span>
              <h3>${escapeHtml(p.name)}</h3>
              <p>${escapeHtml(p.description || "")}</p>
              <div class="price-real">${money(cleanPrice)}</div>
              <div class="source-note">Prix catalogue MEMORA.</div>
              <button type="button" class="btn add-to-cart-btn" 
                  data-id="${p.id}" 
                  data-name="${escapeHtml(p.name)}" 
                  data-price="${cleanPrice}" 
                  data-image="${escapeHtml(p.image || "")}">
                  Ajouter au panier
              </button>
          </div>
      </article>`;
  }).join("");

  if (typeof appliquerFiltres === "function") appliquerFiltres();
}

function bindCatalogButtons() {
  document.getElementById("productGrid")?.addEventListener("click", (event) => {
    const btn = event.target.closest(".add-to-cart-btn");
    if (!btn) return;
    addToCart({
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
      image: btn.dataset.image,
    });
  });
}

function renderCartPage() {
  const container = document.getElementById("cart-container");
  if (!container) return;
  const cart = getCart();
  if (!cart.length) {
      container.innerHTML = `
          <div class="empty-state">
              <p>Votre panier est vide.</p>
              <a class="btn" href="produits.html">Découvrir les cadeaux</a>
          </div>`;
      return;
  }
  
  let total = 0;
  const rows = cart.map((item, index) => {
      let priceStr = String(item.price || 0);
      if (priceStr.includes('-')) {
          priceStr = priceStr.split('-')[0].trim();
      }
      let cleanPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      let qty = parseInt(item.quantity || 1, 10);
      
      const sub = cleanPrice * qty;
      total += sub;
      
      return `<tr>
          <td><div class="cart-item"><img src="${escapeHtml(item.image || "")}" alt=""><span>${escapeHtml(item.name)}</span></div></td>
          <td>${money(cleanPrice)}</td>
          <td>
              <button type="button" class="qty-btn" data-act="minus" data-index="${index}">-</button>
              <span>${qty}</span>
              <button type="button" class="qty-btn" data-act="plus" data-index="${index}">+</button>
          </td>
          <td>${money(sub)}</td>
          <td><button type="button" class="btn secondary qty-btn" data-act="remove" data-index="${index}">Supprimer</button></td>
      </tr>`;
  }).join("");

  container.innerHTML = `
      <table class="shop-table">
          <thead><tr><th>Produit</th><th>Prix</th><th>Quantité</th><th>Sous-total</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
      </table>
      <div class="cart-summary">
          <h3>Total général : <span id="cart-total">${money(total)}</span></h3>
          <a href="checkout.html" class="btn">Passer la commande</a>
      </div>`;
}



function bindCartActions() {
  document.getElementById("cart-container")?.addEventListener("click", (event) => {
    const btn = event.target.closest(".qty-btn");
    if (!btn) return;
    const cart = getCart();
    const index = Number(btn.dataset.index);
    if (btn.dataset.act === "plus") cart[index].quantity += 1;
    if (btn.dataset.act === "minus") cart[index].quantity -= 1;
    if (btn.dataset.act === "remove" || cart[index]?.quantity <= 0) cart.splice(index, 1);
    saveCart(cart);
    renderCartPage();
  });
}

function renderCheckoutSummary() {
  const box = document.getElementById("checkout-summary");
  if (!box) return;
  const cart = getCart();
  const flash = document.getElementById("checkoutFlash");
  const submit = document.querySelector("#checkoutForm button[type=submit]");
  if (!cart.length) {
    box.innerHTML = "<p>Votre panier est vide.</p>";
    if (submit) submit.disabled = true;
    return;
  }
  let total = 0;
  box.innerHTML = "<ul class='summary-list'>" + cart.map((item) => {
    const sub = (Number(item.price) || 0) * item.quantity;
    total += sub;
    return `<li><span>${escapeHtml(item.name)} × ${item.quantity}</span><strong>${money(sub)}</strong></li>`;
  }).join("") + `</ul><p><strong>Estimation : ${money(total)}</strong></p>
    <p class="small">Montants indicatifs du panier. La base recalcule les prix à partir du catalogue.</p>`;
  if (flash && !SHOP.session) {
    showFlash(flash, "Connectez-vous avant de commander.", "info");
  }
}

async function submitCheckout(event) {
  event.preventDefault();
  const flash = document.getElementById("checkoutFlash");
  const submit = event.target.querySelector("button[type=submit]");
  const cart = getCart();
  if (!SHOP.session) {
    showFlash(flash, "Connectez-vous pour passer une commande.", "error");
    window.location.href = "login.html?next=checkout.html";
    return;
  }
  if (!cart.length) {
    showFlash(flash, "Le panier est vide.", "error");
    return;
  }
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const city = document.getElementById("custCity").value.trim();
  const payment = document.querySelector("input[name=payment]:checked")?.value || "simulation";
  if (name.length < 2 || phone.length < 8 || address.length < 4 || city.length < 2) {
    showFlash(flash, "Formulaire incomplet : nom, téléphone, adresse et ville sont obligatoires.", "error");
    return;
  }

  let key = sessionStorage.getItem("memora_order_key");
  if (!key) {
    key = crypto.randomUUID();
    sessionStorage.setItem("memora_order_key", key);
  }

  submit.disabled = true;
  showFlash(flash, "Enregistrement de la commande de démonstration…", "info");
  try {
    const { data, error } = await sb.rpc("create_demo_order", {
      p_items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
      p_customer_name: name,
      p_phone: phone,
      p_address: address,
      p_city: city,
      p_payment_method: payment,
      p_idempotency_key: key,
    });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.code || "Erreur commande");
    saveCart([]);
    sessionStorage.removeItem("memora_order_key");
    const id = data.order?.id;
    window.location.href = "confirmation.html?id=" + encodeURIComponent(id);
  } catch (err) {
    showFlash(flash, frenchError(err), "error");
    submit.disabled = false;
  }
}

async function renderAccount() {
  const identity = document.getElementById("accountIdentity");
  const list = document.getElementById("orderHistory");
  const flash = document.getElementById("accountFlash");
  if (!SHOP.session) {
    window.location.href = "login.html?next=compte.html";
    return;
  }
  identity.innerHTML = `
    <p><strong>E-mail :</strong> ${escapeHtml(SHOP.session.user.email)}</p>
    <p><strong>Identifiant :</strong> ${escapeHtml(SHOP.session.user.id)}</p>
    <p><strong>Rôle :</strong> ${SHOP.isAdmin ? "administrateur" : "client"}</p>
    <button type="button" class="btn secondary" id="logoutBtn">Se déconnecter</button>`;
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await sb.auth.signOut();
    window.location.href = "index.html";
  });

  const { data, error } = await sb
    .from("orders")
    .select("id,created_at,status,total,items")
    .order("created_at", { ascending: false });
  if (error) {
    showFlash(flash, frenchError(error), "error");
    return;
  }
  if (!data.length) {
    list.innerHTML = '<p class="empty-state">Aucune commande pour le moment.</p>';
    return;
  }
  list.innerHTML = data.map((o) => `
    <article class="card order-card">
      <p><strong>Commande</strong> ${escapeHtml(o.id.slice(0, 8))} · ${new Date(o.created_at).toLocaleString("fr-TN")}</p>
      <p>Statut : <strong>${escapeHtml(o.status)}</strong> · Total : ${money(o.total)}</p>
      <ul>${(o.items || []).map((it) => `<li>${escapeHtml(it.name)} × ${it.quantity}</li>`).join("")}</ul>
    </article>`).join("");
}

async function renderConfirmation() {
  const box = document.getElementById("confirmationBox");
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    box.innerHTML = "<p>Aucune commande à afficher.</p>";
    return;
  }
  const { data, error } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  if (error || !data) {
    box.innerHTML = "<p>Commande introuvable (connectez-vous avec le compte qui l'a passée).</p>";
    return;
  }
  box.innerHTML = `
    <p>Paiement simulé : aucun débit n'a été effectué.</p>
    <p><strong>Référence :</strong> ${escapeHtml(data.id)}</p>
    <p><strong>Total enregistré par la base :</strong> ${money(data.total)} (dont livraison ${money(data.shipping)})</p>
    <p><strong>Statut :</strong> ${escapeHtml(data.status)}</p>
    <p><a class="btn" href="compte.html">Voir mon historique</a></p>`;
}

async function renderAdmin() {
  const flash = document.getElementById("adminFlash");
  if (!SHOP.session) {
    window.location.href = "login.html?next=admin.html";
    return;
  }
  if (!SHOP.isAdmin) {
    document.getElementById("adminApp").innerHTML = "<p>Cette page est réservée à l'administrateur.</p>";
    return;
  }

  const products = await sb.from("products").select("*").order("name");
  const productBox = document.getElementById("adminProducts");
  if (products.error) {
    showFlash(flash, frenchError(products.error), "error");
  } else if (!products.data.length) {
    productBox.innerHTML = '<p class="empty-state">Catalogue vide.</p>';
  } else {
    productBox.innerHTML = `<table class="shop-table"><thead><tr><th>Nom</th><th>Prix</th><th>Groupe</th><th>Dispo</th><th></th></tr></thead><tbody>
      ${products.data.map((p) => `<tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${money(p.price)}</td>
        <td>${escapeHtml(p.product_group || "")}</td>
        <td>${p.available ? "oui" : "non"}</td>
        <td>
          <button type="button" class="btn secondary admin-edit" data-id="${p.id}">Modifier</button>
          <button type="button" class="btn secondary admin-del" data-id="${p.id}" data-name="${escapeHtml(p.name)}">Supprimer</button>
        </td>
      </tr>`).join("")}
    </tbody></table>`;
  }

  const orders = await sb.from("orders").select("*").order("created_at", { ascending: false });
  const orderBox = document.getElementById("adminOrders");
  if (orders.error) {
    showFlash(flash, frenchError(orders.error), "error");
  } else if (!orders.data.length) {
    orderBox.innerHTML = '<p class="empty-state">Aucune commande.</p>';
  } else {
    orderBox.innerHTML = orders.data.map((o) => `
      <article class="card order-card">
        <p>${escapeHtml(o.customer_name)} · ${escapeHtml(o.city)} · ${new Date(o.created_at).toLocaleString("fr-TN")}</p>
        <p>${money(o.total)} · client ${escapeHtml(o.user_id.slice(0, 8))}…</p>
        <label>Statut
          <select class="status-select" data-id="${o.id}" data-version="${o.version}">
            ${["en_attente","confirmee","expediee","livree","annulee"].map((s) =>
              `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </label>
      </article>`).join("");
  }
}

function fillProductForm(product) {
  document.getElementById("prodId").value = product?.id || "";
  document.getElementById("prodName").value = product?.name || "";
  document.getElementById("prodDesc").value = product?.description || "";
  document.getElementById("prodPrice").value = product?.price ?? "";
  document.getElementById("prodImage").value = product?.image || "";
  document.getElementById("prodCategory").value = product?.category || "moyen";
  document.getElementById("prodGroup").value = product?.product_group || "Coffrets";
  document.getElementById("prodAvailable").checked = product ? !!product.available : true;
}

async function saveProduct(event) {
  event.preventDefault();
  const flash = document.getElementById("adminFlash");
  const payload = {
    name: document.getElementById("prodName").value.trim(),
    description: document.getElementById("prodDesc").value.trim(),
    price: Number(document.getElementById("prodPrice").value),
    image: document.getElementById("prodImage").value.trim(),
    category: document.getElementById("prodCategory").value,
    product_group: document.getElementById("prodGroup").value.trim(),
    available: document.getElementById("prodAvailable").checked,
  };
  if (!payload.name || !(payload.price >= 0)) {
    showFlash(flash, "Nom et prix sont obligatoires.", "error");
    return;
  }
  const id = document.getElementById("prodId").value;
  const query = id
    ? sb.from("products").update(payload).eq("id", id)
    : sb.from("products").insert(payload);
  const { error } = await query;
  if (error) {
    showFlash(flash, frenchError(error), "error");
    return;
  }
  showFlash(flash, id ? "Produit modifié." : "Produit ajouté.", "ok");
  fillProductForm(null);
  await renderAdmin();
}

async function bindAdmin() {
  document.getElementById("productForm")?.addEventListener("submit", saveProduct);
  document.getElementById("resetProduct")?.addEventListener("click", () => fillProductForm(null));
  document.getElementById("adminProducts")?.addEventListener("click", async (event) => {
    const edit = event.target.closest(".admin-edit");
    const del = event.target.closest(".admin-del");
    if (edit) {
      const { data } = await sb.from("products").select("*").eq("id", edit.dataset.id).single();
      fillProductForm(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (del) {
      if (!confirm("Supprimer « " + del.dataset.name + " » ?")) return;
      const { error } = await sb.from("products").delete().eq("id", del.dataset.id);
      const flash = document.getElementById("adminFlash");
      if (error) showFlash(flash, frenchError(error), "error");
      else {
        showFlash(flash, "Produit supprimé.", "ok");
        await renderAdmin();
      }
    }
  });
  document.getElementById("adminOrders")?.addEventListener("change", async (event) => {
    const select = event.target.closest(".status-select");
    if (!select) return;
    const flash = document.getElementById("adminFlash");
    const { data, error } = await sb.rpc("update_order_status", {
      p_id: select.dataset.id,
      p_status: select.value,
      p_version: Number(select.dataset.version),
    });
    if (error) {
      showFlash(flash, frenchError(error), "error");
      await renderAdmin();
      return;
    }
    if (!data?.ok && data?.code === "CONFLICT") {
      showFlash(flash, "Changement concurrent : le statut a déjà été modifié. Liste rechargée.", "error");
      await renderAdmin();
      return;
    }
    showFlash(flash, "Statut mis à jour.", "ok");
    await renderAdmin();
  });
}

async function handleSignup(event) {
  event.preventDefault();
  const flash = document.getElementById("authFlash");
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const firstName = document.getElementById("signupFirst").value.trim();
  if (password.length < 6) {
    showFlash(flash, "Le mot de passe doit contenir au moins 6 caractères.", "error");
    return;
  }
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: location.origin + "/verification.html",
      data: { first_name: firstName },
    },
  });
  if (error) {
    showFlash(flash, frenchError(error), "error");
    return;
  }
  window.location.href = "verification.html";
}

async function handleLogin(event) {
  event.preventDefault();
  const flash = document.getElementById("authFlash");
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    showFlash(flash, frenchError(error), "error");
    return;
  }
  const next = new URLSearchParams(location.search).get("next") || "compte.html";
  window.location.href = next;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await getSession();
    await refreshRole();
    updateNavAuth();
  } catch (err) {
    console.warn(err);
  }

  const page = document.body.dataset.page;
  if (page === "produits") {
    const flash = document.getElementById("catalogFlash");
    try {
      const products = await loadProducts();
      renderCatalog(products);
      bindCatalogButtons();
      if (!products.length) showFlash(flash, "Catalogue vide : le script SQL n'a peut-être pas été exécuté.", "info");
    } catch (err) {
      showFlash(flash, frenchError(err), "error");
    }
  }
  if (page === "panier") {
    renderCartPage();
    bindCartActions();
  }
  if (page === "checkout") {
    renderCheckoutSummary();
    document.getElementById("checkoutForm")?.addEventListener("submit", submitCheckout);
  }
  if (page === "signup") {
    document.getElementById("signupForm")?.addEventListener("submit", handleSignup);
  }
  if (page === "login") {
    if (SHOP.session) window.location.href = "compte.html";
    document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  }
  if (page === "compte") await renderAccount();
  if (page === "confirmation") await renderConfirmation();
  if (page === "admin") {
    await bindAdmin();
    await renderAdmin();
  }
  if (page === "verification") {
    const params = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace("#", "?"));
    if (params.get("code") || hash.get("type") === "signup" || hash.get("access_token")) {
      const el = document.getElementById("verifyStatus");
      if (el) el.textContent = "Adresse confirmée. Vous pouvez vous connecter.";
    }
  }
});
