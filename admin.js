import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  getFirestore, collection, query, orderBy, getDocs,
  onSnapshot, doc, updateDoc, deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ordersEl = document.getElementById('admin-orders');
const emptyEl = document.getElementById('admin-empty');

// Function to render orders
function renderOrders(ordersData) {
  ordersEl.innerHTML = '';

  if (ordersData.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  ordersData.forEach((orderInfo) => {
    const order = orderInfo.data || orderInfo;
    const docId = orderInfo.docId;
    const card = document.createElement('div');
    card.className = 'order-card' + (order.status === 'fulfilled' ? ' fulfilled' : '');

    const itemsHtml = (order.items || [])
      .map((i) => `<li>${i.qty} &times; ${i.name} <span class="order-item-section">${i.section}</span></li>`)
      .join('');

    const time = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : '';

    card.innerHTML = `
      <div class="order-card-header">
        <div>
          <span class="order-name">${order.customerName || 'Unknown'}</span>
          <span class="order-time">${time}</span>
        </div>
        <span class="order-status">${order.status === 'fulfilled' ? 'Fulfilled' : 'New'}</span>
      </div>
      <ul class="order-items">${itemsHtml}</ul>
      <div class="order-actions">
        <button class="order-toggle-btn">${order.status === 'fulfilled' ? 'Mark as New' : 'Mark Fulfilled'}</button>
        <button class="order-delete-btn">Delete</button>
      </div>
    `;

    if (docId) {
      card.querySelector('.order-toggle-btn').addEventListener('click', () => {
        updateDoc(doc(db, 'orders', docId), {
          status: order.status === 'fulfilled' ? 'new' : 'fulfilled'
        });
      });

      card.querySelector('.order-delete-btn').addEventListener('click', () => {
        if (confirm('Delete this order?')) {
          deleteDoc(doc(db, 'orders', docId));
        }
      });
    } else {
      // Local-only order (no Firebase doc ID)
      card.querySelector('.order-toggle-btn').disabled = true;
      card.querySelector('.order-delete-btn').disabled = true;
      card.classList.add('local-only');
    }

    ordersEl.appendChild(card);
  });
}

// Primary listener: real-time updates from Firebase
const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

onSnapshot(ordersQuery, (snapshot) => {
  const orders = [];
  snapshot.forEach((docSnap) => {
    orders.push({ docId: docSnap.id, data: docSnap.data() });
  });
  renderOrders(orders);
  console.log('✓ Firebase orders loaded:', orders.length);
}, (error) => {
  console.error('✗ Firebase listener error:', error.message);
  // Fallback: try loading local order log
  loadLocalOrderLog();
});

// Fallback: Load local order log if real-time fails
function loadLocalOrderLog() {
  const ORDER_LOG_KEY = 'abbads-order-log';
  try {
    const logs = JSON.parse(localStorage.getItem(ORDER_LOG_KEY)) || [];
    const successLogs = logs.filter(log => log.status === 'logged_success').reverse();
    if (successLogs.length > 0) {
      console.warn('Using local order log (Firebase unavailable)');
      renderOrders(successLogs);
    }
  } catch (e) {
    console.error('Failed to load local order log:', e);
  }
}
