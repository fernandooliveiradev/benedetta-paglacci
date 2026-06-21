"use strict";

const WHATSAPP_NUMBER = "556291098611";
const STORAGE_KEY = "benedetta-paglacci-cart-v2";

const menuData = JSON.parse(document.querySelector("#menu-data").textContent);
const pizzaById = new Map(menuData.pizzas.map((pizza) => [pizza.id, pizza]));
const sizeById = new Map(menuData.sizes.map((size) => [size.id, size]));

const state = {
  cart: loadCart(),
  category: "all",
  search: "",
};

const elements = {
  cards: Array.from(document.querySelectorAll("[data-pizza-card]")),
  searchInput: document.querySelector("#searchInput"),
  categoryTabs: Array.from(document.querySelectorAll(".category-tab")),
  emptyMenu: document.querySelector("#emptyMenu"),
  cartDrawer: document.querySelector("#cartDrawer"),
  cartOverlay: document.querySelector("#cartOverlay"),
  openCartButton: document.querySelector("#openCartButton"),
  closeCartButton: document.querySelector("#closeCartButton"),
  openCartButtons: Array.from(document.querySelectorAll("[data-open-cart]")),
  mobileCartButton: document.querySelector("#mobileCartButton"),
  cartItems: document.querySelector("#cartItems"),
  emptyCart: document.querySelector("#emptyCart"),
  cartCounts: Array.from(document.querySelectorAll("[data-cart-count]")),
  cartItemSummary: document.querySelector("#cartItemSummary"),
  checkoutButton: document.querySelector("#checkoutButton"),
  checkoutForm: document.querySelector("#checkoutForm"),
  formStatus: document.querySelector("#formStatus"),
  toast: document.querySelector("#toast"),
  cep: document.querySelector("#cep"),
};

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && pizzaById.has(item.pizzaId) && sizeById.has(item.size) && item.quantity > 0);
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
}

function itemCount() {
  return state.cart.reduce((total, item) => total + item.quantity, 0);
}

function formatPrice(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function itemPrice(item) {
  const pizza = pizzaById.get(item.pizzaId);
  return pizza.prices[item.size] * item.quantity;
}

function cartTotal() {
  return state.cart.reduce((total, item) => total + itemPrice(item), 0);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function renderMenu() {
  const term = normalizeText(state.search.trim());
  let visibleCount = 0;

  elements.cards.forEach((card) => {
    const matchesCategory = state.category === "all" || card.dataset.category === state.category;
    const matchesSearch = !term || normalizeText(card.dataset.search).includes(term);
    const isVisible = matchesCategory && matchesSearch;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  elements.emptyMenu.hidden = visibleCount !== 0;
}

function addToCart(pizzaId, size) {
  const existing = state.cart.find((item) => item.pizzaId === pizzaId && item.size === size);
  if (existing) existing.quantity += 1;
  else state.cart.push({ pizzaId, size, quantity: 1 });

  saveCart();
  renderCart();
  const pizza = pizzaById.get(pizzaId);
  const sizeInfo = sizeById.get(size);
  showToast(`${pizza.name} - ${sizeInfo.label} adicionada ao carrinho.`);
}

function updateQuantity(pizzaId, size, delta) {
  const item = state.cart.find((entry) => entry.pizzaId === pizzaId && entry.size === size);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((entry) => !(entry.pizzaId === pizzaId && entry.size === size));
  }
  saveCart();
  renderCart();
}

function removeFromCart(pizzaId, size) {
  state.cart = state.cart.filter((item) => !(item.pizzaId === pizzaId && item.size === size));
  saveCart();
  renderCart();
}

function cartItemTemplate(item) {
  const pizza = pizzaById.get(item.pizzaId);
  const size = sizeById.get(item.size);
  if (!pizza || !size) return "";
  const unitPrice = pizza.prices[item.size];
  const lineTotal = unitPrice * item.quantity;

  return `
    <div class="cart-item">
      <div>
        <div class="cart-item-name">${pizza.name}</div>
        <div class="cart-item-size">${size.label} - ${size.detail}</div>
        <div class="cart-item-price">${formatPrice(unitPrice)} un. · ${formatPrice(lineTotal)}</div>
        <button type="button" class="remove-button" data-remove-pizza="${item.pizzaId}" data-size="${item.size}">Remover</button>
      </div>
      <div class="quantity-control" aria-label="Quantidade de ${pizza.name}">
        <button type="button" class="quantity-button" data-quantity="-1" data-pizza-id="${item.pizzaId}" data-size="${item.size}" aria-label="Diminuir quantidade">-</button>
        <strong class="min-w-5 text-center text-sm text-[var(--green)]">${item.quantity}</strong>
        <button type="button" class="quantity-button" data-quantity="1" data-pizza-id="${item.pizzaId}" data-size="${item.size}" aria-label="Aumentar quantidade">+</button>
      </div>
    </div>
  `;
}

function renderCart() {
  const count = itemCount();
  elements.cartItems.innerHTML = state.cart.map(cartItemTemplate).join("");
  elements.emptyCart.hidden = count > 0;
  elements.checkoutForm.hidden = count === 0;
  elements.checkoutButton.disabled = count === 0;
  elements.cartCounts.forEach((countElement) => {
    countElement.textContent = String(count);
  });
  elements.cartItemSummary.textContent = `${count} ${count === 1 ? "pizza" : "pizzas"} · ${formatPrice(cartTotal())}`;
  document.body.classList.toggle("has-cart-items", count > 0);
}

function openCart() {
  elements.cartOverlay.hidden = false;
  requestAnimationFrame(() => {
    elements.cartOverlay.classList.add("visible");
    elements.cartDrawer.classList.add("open");
  });
  elements.cartDrawer.setAttribute("aria-hidden", "false");
  elements.openCartButton.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
  window.setTimeout(() => elements.closeCartButton.focus(), 220);
}

function closeCart() {
  elements.cartOverlay.classList.remove("visible");
  elements.cartDrawer.classList.remove("open");
  elements.cartDrawer.setAttribute("aria-hidden", "true");
  elements.openCartButton.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  window.setTimeout(() => {
    elements.cartOverlay.hidden = true;
  }, 300);
}

function field(id) {
  return document.querySelector(`#${id}`);
}

function value(id) {
  return field(id).value.trim();
}

function setStatus(message) {
  elements.formStatus.textContent = message;
}

function validateCheckout() {
  const required = [
    ["customerName", "Informe seu nome."],
    ["customerPhone", "Informe seu WhatsApp."],
    ["cep", "Informe o CEP."],
    ["street", "Informe o endereço."],
    ["number", "Informe o número."],
    ["neighborhood", "Informe o bairro."],
    ["city", "Informe a cidade."],
    ["state", "Informe a UF."],
    ["payment", "Escolha a forma de pagamento."],
  ];

  for (const [id, message] of required) {
    const input = field(id);
    if (!input.value.trim()) {
      setStatus(message);
      input.focus();
      return false;
    }
  }

  const city = normalizeText(value("city"));
  const uf = value("state").toUpperCase();
  if (city !== "trindade" || uf !== "GO") {
    setStatus("Delivery: Trindade/GO.");
    field("city").focus();
    return false;
  }

  setStatus("");
  return true;
}

function buildMessage() {
  const items = state.cart.map((item) => {
    const pizza = pizzaById.get(item.pizzaId);
    const size = sizeById.get(item.size);
    return `- ${item.quantity}x ${pizza.name} - ${size.label} (${size.detail}) - ${formatPrice(itemPrice(item))}`;
  });

  return [
    "Benedetta Paglacci - Pedido",
    "",
    `Nome: ${value("customerName")}`,
    `WhatsApp: ${value("customerPhone")}`,
    "",
    "Pedido:",
    ...items,
    `Total: ${formatPrice(cartTotal())}`,
    "",
    "Entrega:",
    `${value("street")}, ${value("number")}`,
    value("complement") ? `Complemento: ${value("complement")}` : "",
    `Bairro: ${value("neighborhood")}`,
    `Cidade: ${value("city")}/${value("state").toUpperCase()}`,
    `CEP: ${value("cep")}`,
    "",
    `Pagar na Entrega: ${value("payment")}`,
  ].filter(Boolean).join("\n");
}

function checkout() {
  if (!state.cart.length || !validateCheckout()) return;
  const message = encodeURIComponent(buildMessage());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener,noreferrer");
}

function formatCep() {
  const digits = elements.cep.value.replace(/\D/g, "").slice(0, 8);
  elements.cep.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

async function lookupCep() {
  const cep = elements.cep.value.replace(/\D/g, "");
  if (cep.length !== 8) return;

  setStatus("Buscando endereço pelo CEP.");
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (data.erro) {
      setStatus("CEP não encontrado.");
      return;
    }

    field("street").value = data.logradouro || "";
    field("neighborhood").value = data.bairro || "";
    field("city").value = data.localidade || "";
    field("state").value = data.uf || "";
    setStatus("Delivery: Trindade/GO.");
  } catch {
    setStatus("Não foi possível buscar o CEP.");
  }
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-pizza]");
  const removeButton = event.target.closest("[data-remove-pizza]");
  const quantityButton = event.target.closest("[data-quantity]");

  if (addButton) {
    addToCart(addButton.dataset.addPizza, addButton.dataset.size);
    return;
  }

  if (quantityButton) {
    updateQuantity(quantityButton.dataset.pizzaId, quantityButton.dataset.size, Number(quantityButton.dataset.quantity));
    return;
  }

  if (removeButton) {
    removeFromCart(removeButton.dataset.removePizza, removeButton.dataset.size);
  }
});

elements.searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderMenu();
});

elements.categoryTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    elements.categoryTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    state.category = tab.dataset.category;
    renderMenu();
  });
});

elements.openCartButtons.forEach((button) => button.addEventListener("click", openCart));
elements.closeCartButton.addEventListener("click", closeCart);
elements.cartOverlay.addEventListener("click", closeCart);
elements.checkoutButton.addEventListener("click", checkout);
elements.cep.addEventListener("input", formatCep);
elements.cep.addEventListener("blur", lookupCep);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.cartDrawer.classList.contains("open")) closeCart();
});

renderMenu();
renderCart();
