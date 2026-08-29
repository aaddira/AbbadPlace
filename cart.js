import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const STORAGE_KEY = 'abbads-cart';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

let cart = loadCart();

const cartToggle = document.getElementById('cart-toggle');
const cartCount = document.getElementById('cart-count');
const cartOverlay = document.getElementById('cart-overlay');
const cartPanel = document.getElementById('cart-panel');
const cartClose = document.getElementById('cart-close');
const cartItemsEl = document.getElementById('cart-items');
const cartEmptyEl = document.getElementById('cart-empty');
const cartClearBtn = document.getElementById('cart-clear');
const cartCheckoutBtn = document.getElementById('cart-checkout');

const checkoutModal = document.getElementById('checkout-modal');
const checkoutSummary = document.getElementById('checkout-summary');
const checkoutName = document.getElementById('checkout-name');
const checkoutBack = document.getElementById('checkout-back');
const checkoutConfirm = document.getElementById('checkout-confirm');
const checkoutDone = document.getElementById('checkout-done');
const stepForm = document.getElementById('checkout-step-form');
const stepSuccess = document.getElementById('checkout-step-success');
const successName = document.getElementById('success-name');

function findItem(name, section) {
  return cart.find((c) => c.name === name && c.section === section);
}

function addToCart(name, section) {
  const existing = findItem(name, section);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, section, qty: 1 });
  }
  saveCart(cart);
  renderCart();
  openCart();
}

function changeQty(name, section, delta) {
  const item = findItem(name, section);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((c) => !(c.name === name && c.section === section));
  }
  saveCart(cart);
  renderCart();
}

function totalCount() {
  return cart.reduce((sum, c) => sum + c.qty, 0);
}

function renderCart() {
  cartCount.textContent = totalCount();
  cartItemsEl.innerHTML = '';

  if (cart.length === 0) {
    cartEmptyEl.style.display = 'block';
    cartCheckoutBtn.disabled = true;
  } else {
    cartEmptyEl.style.display = 'none';
    cartCheckoutBtn.disabled = false;
    cart.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="cart-item-name">${item.name}</span>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec">&minus;</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-action="inc">+</button>
        </div>
      `;
      li.querySelector('[data-action="dec"]').addEventListener('click', () => changeQty(item.name, item.section, -1));
      li.querySelector('[data-action="inc"]').addEventListener('click', () => changeQty(item.name, item.section, 1));
      cartItemsEl.appendChild(li);
    });
  }
}

function openCart() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('open');
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.add-btn');
  if (btn) {
    addToCart(btn.dataset.item, btn.dataset.section);
  }
});

cartToggle.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', () => {
  closeCart();
  closeCheckout();
});

cartClearBtn.addEventListener('click', () => {
  cart = [];
  saveCart(cart);
  renderCart();
});

function openCheckout() {
  checkoutSummary.innerHTML = '';
  cart.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.qty} × ${item.name}`;
    checkoutSummary.appendChild(li);
  });
  stepForm.hidden = false;
  stepSuccess.hidden = true;
  checkoutName.value = '';
  checkoutModal.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCheckout() {
  checkoutModal.classList.remove('open');
  if (!cartPanel.classList.contains('open')) {
    cartOverlay.classList.remove('open');
  }
}

cartCheckoutBtn.addEventListener('click', () => {
  closeCart();
  openCheckout();
});

checkoutBack.addEventListener('click', () => {
  closeCheckout();
  openCart();
});

checkoutConfirm.addEventListener('click', async () => {
  const name = checkoutName.value.trim();
  if (!name) {
    checkoutName.focus();
    return;
  }
  checkoutConfirm.disabled = true;
  checkoutConfirm.textContent = 'Placing order...';
  try {
    const orderData = {
      customerName: name,
      items: cart.map((c) => ({ name: c.name, section: c.section, qty: c.qty })),
      itemCount: totalCount(),
      status: 'new',
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);

    // Log order locally for recovery
    const orderLog = {
      timestamp: new Date().toISOString(),
      firestoreDocId: docRef.id,
      customerName: name,
      itemCount: totalCount(),
      items: cart.map((c) => ({ name: c.name, section: c.section, qty: c.qty })),
      status: 'logged_success'
    };
    logOrder(orderLog);
    console.log('✓ Order placed successfully:', orderLog);

    successName.textContent = `, ${name}`;
    stepForm.hidden = true;
    stepSuccess.hidden = false;
    cart = [];
    saveCart(cart);
    renderCart();
  } catch (err) {
    // Log failed order for recovery
    const errorLog = {
      timestamp: new Date().toISOString(),
      customerName: name,
      itemCount: totalCount(),
      items: cart.map((c) => ({ name: c.name, section: c.section, qty: c.qty })),
      status: 'failed',
      error: err.message
    };
    logOrder(errorLog);
    console.error('✗ Order failed:', errorLog);

    alert('Could not place order — please try again. (' + err.message + ')');
  } finally {
    checkoutConfirm.disabled = false;
    checkoutConfirm.textContent = 'Confirm Order';
  }
});

function logOrder(orderLog) {
  const ORDER_LOG_KEY = 'abbads-order-log';
  try {
    const logs = JSON.parse(localStorage.getItem(ORDER_LOG_KEY)) || [];
    logs.push(orderLog);
    // Keep only last 50 logs to prevent storage bloat
    if (logs.length > 50) logs.shift();
    localStorage.setItem(ORDER_LOG_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to log order:', e);
  }
}

checkoutDone.addEventListener('click', closeCheckout);

renderCart();
