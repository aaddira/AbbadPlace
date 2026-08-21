import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  getFirestore, collection, query, orderBy,
  onSnapshot, doc, updateDoc, deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ordersEl = document.getElementById('admin-orders');
const emptyEl = document.getElementById('admin-empty');

const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

onSnapshot(ordersQuery, (snapshot) => {
  ordersEl.innerHTML = '';

  if (snapshot.empty) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  snapshot.forEach((docSnap) => {
    const order = docSnap.data();
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

    card.querySelector('.order-toggle-btn').addEventListener('click', () => {
      updateDoc(doc(db, 'orders', docSnap.id), {
        status: order.status === 'fulfilled' ? 'new' : 'fulfilled'
      });
    });

    card.querySelector('.order-delete-btn').addEventListener('click', () => {
      if (confirm('Delete this order?')) {
        deleteDoc(doc(db, 'orders', docSnap.id));
      }
    });

    ordersEl.appendChild(card);
  });
});
