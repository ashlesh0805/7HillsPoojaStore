// ===================================================
// 7 Hills Pooja Store Partner — Management Engine
// Zero Emojis: Crisp typography and SVG icons only.
// ===================================================

let appState = {
  orders: [],
  products: [],
  categories: [],
  appointments: [],
  activeTab: 'orders',
  activeOrderAlert: null,
  isAudioMuted: false
};

// ===================================================
// 1. PIN AUTHENTICATION
// ===================================================
const DEFAULT_PIN = '7777';

function initPinAuth() {
  const pinOverlay = document.getElementById('pin-lock-overlay');
  const d1 = document.getElementById('pin-d1');
  const d2 = document.getElementById('pin-d2');
  const d3 = document.getElementById('pin-d3');
  const d4 = document.getElementById('pin-d4');
  const errorMsg = document.getElementById('pin-error-msg');
  const btnSubmit = document.getElementById('btn-submit-pin');
  const btnLock = document.getElementById('btn-lock-portal');

  const digits = [d1, d2, d3, d4];

  // Check existing session
  if (sessionStorage.getItem('partner_auth') === 'true') {
    pinOverlay.style.display = 'none';
    loadAllData();
  } else {
    pinOverlay.style.display = 'flex';
    setTimeout(() => d1.focus(), 100);
  }

  digits.forEach((digit, index) => {
    digit.addEventListener('input', (e) => {
      errorMsg.textContent = '';
      if (digit.value.length === 1) {
        if (index < 3) {
          digits[index + 1].focus();
        } else {
          // Auto check on 4th digit
          verifyPin();
        }
      }
    });

    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !digit.value && index > 0) {
        digits[index - 1].focus();
      }
      if (e.key === 'Enter') {
        verifyPin();
      }
    });
  });

  function verifyPin() {
    const enteredPin = digits.map(d => d.value).join('');
    if (enteredPin.length < 4) {
      errorMsg.textContent = 'Please enter all 4 digits.';
      return;
    }

    if (enteredPin === DEFAULT_PIN) {
      sessionStorage.setItem('partner_auth', 'true');
      pinOverlay.style.display = 'none';
      showToast('Partner Portal Unlocked', 'success');
      loadAllData();
      initAudioOnFirstInteraction();
    } else {
      errorMsg.textContent = 'Incorrect PIN. Try 7777';
      digits.forEach(d => d.value = '');
      d1.focus();
    }
  }

  btnSubmit.addEventListener('click', verifyPin);

  btnLock.addEventListener('click', () => {
    sessionStorage.removeItem('partner_auth');
    digits.forEach(d => d.value = '');
    errorMsg.textContent = '';
    pinOverlay.style.display = 'flex';
    d1.focus();
    stopLoudBuzzer();
  });
}

// ===================================================
// 2. WEB AUDIO SYNTHESIZER LOUD ALARM BUZZER
// ===================================================
let audioCtx = null;
let buzzerInterval = null;
let isBuzzerRunning = false;

function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
}

function initAudioOnFirstInteraction() {
  const unlockAudio = () => {
    initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };
  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
}

function playSingleBeep(freq = 880, duration = 0.15, type = 'square') {
  try {
    initAudioContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Loud, sharp attack and decay
    gain.gain.setValueAtTime(0.7, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

function startLoudBuzzer() {
  if (isBuzzerRunning) return;
  isBuzzerRunning = true;
  initAudioContext();

  let toggle = false;
  // Two-tone piercing dispatch siren (880Hz / 620Hz)
  const runBuzzerCycle = () => {
    toggle = !toggle;
    const freq = toggle ? 920 : 660;
    playSingleBeep(freq, 0.14, 'sawtooth');
  };

  runBuzzerCycle();
  buzzerInterval = setInterval(runBuzzerCycle, 280);

  // Trigger device vibration if available
  if (navigator.vibrate) {
    navigator.vibrate([400, 150, 400, 150, 800]);
  }
}

function stopLoudBuzzer() {
  if (buzzerInterval) {
    clearInterval(buzzerInterval);
    buzzerInterval = null;
  }
  isBuzzerRunning = false;
}

// ===================================================
// 3. SERVER-SENT EVENTS (SSE) FOR REAL-TIME DISPATCH
// ===================================================
function initSseListener() {
  const statusPill = document.getElementById('sse-status-pill');
  const statusLabel = document.getElementById('sse-status-label');

  if (!window.EventSource) {
    statusLabel.textContent = 'SSE Not Supported';
    return;
  }

  const sse = new EventSource('/api/events');

  sse.onopen = () => {
    statusPill.className = 'status-pill online';
    statusLabel.textContent = 'Live Dispatch Active';
  };

  sse.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerEvent(data);
    } catch (e) {
      console.warn('SSE Parse error:', e);
    }
  };

  sse.onerror = () => {
    statusPill.className = 'status-pill';
    statusPill.style.background = 'rgba(239, 68, 68, 0.2)';
    statusPill.style.color = '#EF4444';
    statusLabel.textContent = 'Reconnecting Server...';
  };
}

function handleServerEvent(event) {
  if (event.type === 'NEW_ORDER') {
    const order = event.payload;
    showToast(`New Order Received: ${order.orderId}`, 'warning');
    // Prepend to orders list
    appState.orders.unshift(order);
    renderOrders();
    updateStats();
    // Trigger loud alert siren and modal!
    triggerNewOrderAlert(order);
  }

  if (event.type === 'PRODUCT_UPDATED' || event.type === 'PRODUCT_DELETED') {
    fetchProducts();
  }

  if (event.type === 'CATEGORY_UPDATED' || event.type === 'CATEGORY_DELETED') {
    fetchCategories();
  }

  if (event.type === 'ORDER_STATUS_CHANGED') {
    const { orderId, status } = event.payload;
    const ord = appState.orders.find(o => o.orderId === orderId);
    if (ord) {
      ord.status = status;
      renderOrders();
      updateStats();
    }
  }

  if (event.type === 'NEW_APPOINTMENT') {
    appState.appointments.unshift(event.payload);
    renderAppointments();
    showToast('New Priest Consultation Booked!', 'info');
  }
}

// ===================================================
// 4. LOUD ORDER ALERT MODAL & WHATSAPP
// ===================================================
function triggerNewOrderAlert(order) {
  appState.activeOrderAlert = order;
  startLoudBuzzer();

  const modal = document.getElementById('loud-alert-overlay');
  document.getElementById('alert-order-id').textContent = order.orderId || '7H-ORD';
  document.getElementById('alert-order-total').textContent = `₹${order.total || 0}`;
  document.getElementById('alert-order-customer').textContent = order.customerName || 'Devotee';
  document.getElementById('alert-order-phone').textContent = order.phone || '90979 99939';
  document.getElementById('alert-order-address').textContent = `${order.address || 'Beside Prasannanjaneya Temple, LB Nagar'} | Slot: ${order.deliveryName || 'Instant (45 Mins)'}`;

  const itemsContainer = document.getElementById('alert-items-list');
  itemsContainer.innerHTML = (order.items || []).map(item => `
    <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
      <span>${item.title} <strong style="color:var(--partner-gold);">x ${item.quantity}</strong></span>
      <span>₹${item.price * item.quantity}</span>
    </div>
  `).join('');

  // WhatsApp formatted receipt
  const whatsappUrl = generateWhatsAppOrderUrl(order);
  const waBtn = document.getElementById('btn-alert-whatsapp');
  waBtn.href = whatsappUrl;

  modal.style.display = 'flex';
}

function generateWhatsAppOrderUrl(order) {
  const itemsText = (order.items || []).map((it, idx) => 
    `${idx + 1}. ${it.title} x ${it.quantity} = Rs. ${it.price * it.quantity}`
  ).join('\n');

  const msg = 
`*7 HILLS POOJA STORE — ORDER DISPATCH*
====================================
*Order ID:* ${order.orderId || '7H-ORD'}
*Date:* ${order.date || new Date().toLocaleString()}
*Customer:* ${order.customerName || 'Devotee'}
*Phone:* ${order.phone || '90979 99939'}
*Delivery Address:* ${order.address || 'LB Nagar, Hyderabad'}
*Delivery Slot / Method:* ${order.deliveryName || 'Instant Delivery (45 Mins)'}

*ITEMS ORDERED:*
${itemsText}
------------------------------------
*Subtotal:* Rs. ${order.subtotal || order.total}
*Delivery Fee:* Rs. ${order.deliveryCost || 0}
*GRAND TOTAL:* Rs. ${order.total}
*Payment Method:* ${order.paymentMethod || 'UPI (Paid Online)'}
*Status:* ${order.status || 'Accepted'}
====================================
7 Hills Pooja Store
Beside Prasannanjaneya Swamy Temple, LB Nagar, Hyderabad
Phone: 90979 99939
Positive Energy in Every Item.`;

  return `https://wa.me/919097999939?text=${encodeURIComponent(msg)}`;
}

function initAlertModalEvents() {
  const modal = document.getElementById('loud-alert-overlay');
  const btnAccept = document.getElementById('btn-alert-accept');

  btnAccept.addEventListener('click', async () => {
    stopLoudBuzzer();
    modal.style.display = 'none';

    if (appState.activeOrderAlert) {
      await updateOrderStatus(appState.activeOrderAlert.orderId, 'Accepted');
      showToast(`Order ${appState.activeOrderAlert.orderId} Accepted!`, 'success');
      appState.activeOrderAlert = null;
    }
  });

  // Test buzzer button
  const btnTestBuzzer = document.getElementById('btn-test-buzzer');
  btnTestBuzzer.addEventListener('click', () => {
    if (isBuzzerRunning) {
      stopLoudBuzzer();
      btnTestBuzzer.querySelector('span').textContent = 'Test Buzzer';
    } else {
      startLoudBuzzer();
      btnTestBuzzer.querySelector('span').textContent = 'Stop Siren';
      setTimeout(() => {
        stopLoudBuzzer();
        btnTestBuzzer.querySelector('span').textContent = 'Test Buzzer';
      }, 4000);
    }
  });
}

// ===================================================
// 5. ORDERS MANAGEMENT & DISPATCH
// ===================================================
async function fetchOrders() {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      appState.orders = await res.json();
      renderOrders();
      updateStats();
    }
  } catch (e) {
    console.error('Failed to fetch orders:', e);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch('/api/orders/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: newStatus })
    });
    if (res.ok) {
      const ord = appState.orders.find(o => o.orderId === orderId);
      if (ord) ord.status = newStatus;
      renderOrders();
      updateStats();
      showToast(`Order status updated to: ${newStatus}`, 'info');
    }
  } catch (e) {
    showToast('Failed to update status', 'error');
  }
}

function renderOrders() {
  const container = document.getElementById('orders-container');
  const search = (document.getElementById('search-orders-input').value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('filter-order-status').value;

  let filtered = appState.orders.filter(ord => {
    if (statusFilter !== 'ALL' && ord.status !== statusFilter) return false;
    if (search) {
      const query = `${ord.orderId} ${ord.customerName || ''} ${ord.phone || ''} ${ord.address || ''}`.toLowerCase();
      if (!query.includes(search)) return false;
    }
    return true;
  });

  document.getElementById('tab-badge-orders').textContent = appState.orders.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--partner-muted);">
        <p>No orders found matching current filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(order => {
    const statusClass = (order.status || 'New Order').toLowerCase().split(' ')[0];
    const waUrl = generateWhatsAppOrderUrl(order);

    const itemsRows = (order.items || []).map(it => `
      <tr>
        <td>${it.title} <strong style="color:var(--partner-gold);">x${it.quantity}</strong></td>
        <td>₹${it.price * it.quantity}</td>
      </tr>
    `).join('');

    return `
      <div class="order-card ${order.status === 'New Order' ? 'new-order' : ''}" data-id="${order.orderId}">
        <div class="order-card-header">
          <div>
            <div class="order-id-title">${order.orderId}</div>
            <div class="order-time-stamp">${order.date || 'Today'}</div>
          </div>
          <span class="order-status-badge ${statusClass}">${order.status || 'New Order'}</span>
        </div>

        <div class="order-customer-box">
          <div><strong>Customer:</strong> ${order.customerName || 'Devotee'} (${order.phone || '90979 99939'})</div>
          <div><strong>Delivery:</strong> ${order.deliveryName || 'Instant (45 Mins)'}</div>
          <div><strong>Address:</strong> ${order.address || 'LB Nagar, Hyderabad'}</div>
        </div>

        <table class="order-items-table">
          <tbody>${itemsRows}</tbody>
        </table>

        <div class="order-total-row">
          <span>Grand Total (${order.paymentMethod || 'Paid'}):</span>
          <span>₹${order.total || 0}</span>
        </div>

        <div class="order-card-actions">
          <select class="partner-select btn-order-status" onchange="updateOrderStatus('${order.orderId}', this.value)">
            <option value="New Order" ${order.status === 'New Order' ? 'selected' : ''}>New Order</option>
            <option value="Accepted" ${order.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
            <option value="Packed" ${order.status === 'Packed' ? 'selected' : ''}>Packed</option>
            <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          </select>

          <a href="${waUrl}" target="_blank" class="btn-order-action btn-order-whatsapp" title="Send Bill on WhatsApp to 9097999939">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            <span>WhatsApp (9097999939)</span>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// ===================================================
// 6. CATALOG MANAGEMENT (EDITABLE PRODUCTS)
// ===================================================
async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      appState.products = await res.json();
      renderCatalog();
      updateStats();
    }
  } catch (e) {
    console.error('Failed to fetch products:', e);
  }
}

function renderCatalog() {
  const tbody = document.getElementById('catalog-table-body');
  const search = (document.getElementById('search-catalog-input').value || '').toLowerCase().trim();
  const categoryFilter = document.getElementById('filter-catalog-category').value;
  const stockFilter = document.getElementById('filter-catalog-stock').value;

  let filtered = appState.products.filter(p => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (stockFilter === 'IN_STOCK' && p.inStock === false) return false;
    if (stockFilter === 'OUT_OF_STOCK' && p.inStock !== false) return false;
    if (search) {
      const q = `${p.title} ${p.id} ${p.category}`.toLowerCase();
      if (!q.includes(search)) return false;
    }
    return true;
  });

  document.getElementById('tab-badge-catalog').textContent = appState.products.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:30px; color:var(--partner-muted);">
          No products found matching filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(prod => {
    const isInStock = prod.inStock !== false;
    const stockQty = typeof prod.stockQty === 'number' ? prod.stockQty : (isInStock ? 10 : 0);
    const stockClass = stockQty <= 0 ? 'stock-out' : (stockQty <= 3 ? 'stock-low' : 'stock-ok');
    const imgSource = prod.image ? (prod.image.startsWith('http') || prod.image.startsWith('uploads/') || prod.image.startsWith('data:') ? prod.image : `7HILLS WEBSITE FOR STOCK ITEMS/${prod.image}`) : '';

    return `
      <tr data-id="${prod.id}">
        <td>
          <div class="product-thumb-cell">
            <img src="${imgSource || 'image-coming-soon.svg'}" alt="${prod.title}" class="product-thumb-img" onerror="this.src='image-coming-soon.svg'">
            <div>
              <strong style="color:#FFF; display:block; font-size:13px;">${prod.title}</strong>
              <small style="color:var(--partner-muted); font-size:11px;">ID: ${prod.id}</small>
            </div>
          </div>
        </td>
        <td><span style="text-transform:capitalize; font-size:12px; color:var(--partner-gold);">${prod.category || 'General'}</span></td>
        <td><strong style="color:#FFF;">₹${prod.price}</strong></td>
        <td><span style="color:var(--partner-muted); text-decoration:line-through;">₹${prod.mrp || prod.price}</span></td>
        <td>
          <div class="stock-stepper-wrap" title="Partner view only: available units in stock">
            <button type="button" class="stock-step-btn" onclick="quickAdjustStock('${prod.id}', -1)" title="Decrease Stock by 1">-</button>
            <span class="partner-stock-badge ${stockClass}">
              ${stockQty} Units
            </span>
            <button type="button" class="stock-step-btn" onclick="quickAdjustStock('${prod.id}', 1)" title="Increase Stock by 1">+</button>
          </div>
        </td>
        <td>
          <button type="button" class="stock-toggle-pill ${isInStock ? 'in-stock' : 'out-of-stock'}" onclick="toggleProductStock('${prod.id}')">
            ${isInStock ? 'In Stock' : 'Out of Stock'}
          </button>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button type="button" class="action-icon-btn" onclick="openEditProductModal('${prod.id}')" title="Edit Product">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button type="button" class="action-icon-btn delete" onclick="deleteProduct('${prod.id}')" title="Delete Product">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function quickAdjustStock(id, delta) {
  const prod = appState.products.find(p => p.id === id);
  if (!prod) return;

  const currentStock = typeof prod.stockQty === 'number' ? prod.stockQty : (prod.inStock === false ? 0 : 10);
  const newStock = Math.max(0, currentStock + delta);
  prod.stockQty = newStock;
  prod.inStock = newStock > 0;

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prod)
    });
    if (res.ok) {
      renderCatalog();
      showToast(`${prod.title} stock updated: ${newStock} Units`, 'info');
    }
  } catch (e) {
    showToast('Failed to update stock quantity', 'error');
  }
}

async function toggleProductStock(id) {
  const prod = appState.products.find(p => p.id === id);
  if (!prod) return;

  const updatedStock = prod.inStock === false ? true : false;
  prod.inStock = updatedStock;
  if (!updatedStock) {
    prod.stockQty = 0;
  } else if (!prod.stockQty || prod.stockQty <= 0) {
    prod.stockQty = 10;
  }

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prod)
    });
    if (res.ok) {
      renderCatalog();
      showToast(`${prod.title} marked as ${updatedStock ? 'In Stock' : 'Out of Stock'}`, 'info');
    }
  } catch (e) {
    showToast('Failed to update stock status', 'error');
  }
}

function calculateDiscountPreview() {
  const mrpVal = parseFloat(document.getElementById('edit-prod-mrp').value) || 0;
  const priceVal = parseFloat(document.getElementById('edit-prod-price').value) || 0;
  const strikethroughEl = document.getElementById('mrp-strikethrough-preview');
  const discountBox = document.getElementById('pricing-discount-preview');

  if (strikethroughEl) {
    strikethroughEl.textContent = `₹${mrpVal}`;
  }

  if (discountBox) {
    if (mrpVal > priceVal && priceVal > 0) {
      const discountPercent = Math.round(((mrpVal - priceVal) / mrpVal) * 100);
      const savings = mrpVal - priceVal;
      discountBox.innerHTML = `
        <span>Customer Discount: <strong>${discountPercent}% OFF</strong></span>
        <span>Customer Saves: <strong>₹${savings}</strong></span>
      `;
      discountBox.style.background = 'rgba(16, 185, 129, 0.15)';
      discountBox.style.color = '#10B981';
    } else {
      discountBox.innerHTML = `<span>No Discount Applied (Selling Price equals or exceeds MRP)</span>`;
      discountBox.style.background = 'rgba(255, 255, 255, 0.05)';
      discountBox.style.color = 'var(--partner-muted)';
    }
  }
}

function initMediaUploadHandlers() {
  const btnCamera = document.getElementById('btn-trigger-camera');
  const btnGallery = document.getElementById('btn-trigger-gallery');
  const cameraInput = document.getElementById('camera-file-input');
  const galleryInput = document.getElementById('gallery-file-input');
  const previewImg = document.getElementById('edit-prod-preview');
  const imageInput = document.getElementById('edit-prod-image');

  if (btnCamera && cameraInput) {
    btnCamera.onclick = () => cameraInput.click();
    cameraInput.onchange = (e) => handleImageSelected(e.target.files[0]);
  }

  if (btnGallery && galleryInput) {
    btnGallery.onclick = () => galleryInput.click();
    galleryInput.onchange = (e) => handleImageSelected(e.target.files[0]);
  }

  async function handleImageSelected(file) {
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      if (previewImg) previewImg.src = base64Data;

      // Upload to server
      try {
        showToast('Uploading photo...', 'info');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: base64Data })
        });
        const json = await res.json();
        if (json.success) {
          if (imageInput) imageInput.value = json.url;
          showToast('Photo uploaded & saved!', 'success');
        } else {
          // Fallback to storing data URI if server upload fails
          if (imageInput) imageInput.value = base64Data;
        }
      } catch (err) {
        if (imageInput) imageInput.value = base64Data;
        showToast('Photo captured locally', 'info');
      }
    };
    reader.readAsDataURL(file);
  }
}

function openEditProductModal(id) {
  const prod = appState.products.find(p => p.id === id);
  if (!prod) return;

  populateCategoryDropdowns();

  document.getElementById('product-modal-title').textContent = 'Edit Product Catalog Item';
  document.getElementById('edit-prod-id').value = prod.id;
  document.getElementById('edit-prod-title').value = prod.title || '';
  document.getElementById('edit-prod-category').value = prod.category || prod.categoryId || (appState.categories[0]?.name || 'Pooja Samagri & Essentials');
  document.getElementById('edit-prod-stock').value = prod.inStock === false ? 'false' : 'true';
  const stockUnits = typeof prod.stockQty === 'number' ? prod.stockQty : (prod.inStock === false ? 0 : 10);
  document.getElementById('edit-prod-stock-qty').value = stockUnits;
  document.getElementById('edit-prod-price').value = prod.price || '';
  document.getElementById('edit-prod-mrp').value = prod.mrp || Math.round((prod.price || 100) * 1.3);
  document.getElementById('edit-prod-image').value = prod.image || '';
  document.getElementById('edit-prod-desc').value = prod.description || '';

  // Update preview image
  const previewImg = document.getElementById('edit-prod-preview');
  if (previewImg) {
    const imgSrc = prod.image ? (prod.image.startsWith('http') || prod.image.startsWith('uploads/') || prod.image.startsWith('data:') ? prod.image : `7HILLS WEBSITE FOR STOCK ITEMS/${prod.image}`) : 'image-coming-soon.svg';
    previewImg.src = imgSrc;
  }

  calculateDiscountPreview();
  document.getElementById('product-modal-overlay').style.display = 'flex';
}

function openAddProductModal() {
  populateCategoryDropdowns();

  document.getElementById('product-modal-title').textContent = 'Add New Product to Catalog';
  document.getElementById('edit-prod-id').value = `product_${Date.now()}`;
  document.getElementById('edit-prod-title').value = '';
  document.getElementById('edit-prod-category').value = appState.categories[0]?.name || 'Pooja Samagri & Essentials';
  document.getElementById('edit-prod-stock').value = 'true';
  document.getElementById('edit-prod-stock-qty').value = 15;
  document.getElementById('edit-prod-price').value = '';
  document.getElementById('edit-prod-mrp').value = '';
  document.getElementById('edit-prod-image').value = '';
  document.getElementById('edit-prod-desc').value = '';

  const previewImg = document.getElementById('edit-prod-preview');
  if (previewImg) previewImg.src = 'image-coming-soon.svg';

  calculateDiscountPreview();
  document.getElementById('product-modal-overlay').style.display = 'flex';
}

async function saveProductModal() {
  const id = document.getElementById('edit-prod-id').value;
  const title = document.getElementById('edit-prod-title').value.trim();
  const category = document.getElementById('edit-prod-category').value;
  let inStock = document.getElementById('edit-prod-stock').value === 'true';
  let stockQty = parseInt(document.getElementById('edit-prod-stock-qty').value, 10);
  if (isNaN(stockQty) || stockQty < 0) stockQty = 0;
  if (stockQty <= 0) inStock = false;

  const price = parseFloat(document.getElementById('edit-prod-price').value);
  const mrp = parseFloat(document.getElementById('edit-prod-mrp').value) || price;
  const image = document.getElementById('edit-prod-image').value.trim();
  const description = document.getElementById('edit-prod-desc').value.trim();

  if (!title || isNaN(price)) {
    showToast('Please enter title and valid selling price.', 'error');
    return;
  }

  // Find category metadata
  const catObj = appState.categories.find(c => c.name === category || c.id === category);
  const categoryId = catObj ? catObj.id : category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const payload = {
    id,
    title,
    category,
    categoryId,
    inStock,
    stockQty,
    price,
    mrp,
    image,
    description
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      document.getElementById('product-modal-overlay').style.display = 'none';
      showToast(`Product "${title}" saved! Available Stock: ${stockQty} Units`, 'success');
      fetchProducts();
    } else {
      showToast('Error saving product', 'error');
    }
  } catch (e) {
    showToast('Failed to connect to server', 'error');
  }
}

async function deleteProduct(id) {
  const prod = appState.products.find(p => p.id === id);
  const title = prod ? prod.title : id;

  if (!confirm(`Are you sure you want to delete "${title}" from the catalog?`)) {
    return;
  }

  try {
    const res = await fetch('/api/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      showToast(`Deleted "${title}"`, 'info');
      fetchProducts();
    }
  } catch (e) {
    showToast('Error deleting product', 'error');
  }
}

// ===================================================
// 6B. CATEGORIES MANAGEMENT (DYNAMIC CRUD & LIVE SYNC)
// ===================================================
async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      appState.categories = await res.json();
      renderCategories();
      populateCategoryDropdowns();
    }
  } catch (e) {
    console.error('Failed to fetch categories:', e);
  }
}

function renderCategories() {
  const tbody = document.getElementById('categories-table-body');
  if (!tbody) return;

  const search = (document.getElementById('search-categories-input')?.value || '').toLowerCase().trim();
  const badge = document.getElementById('tab-badge-categories');
  if (badge) badge.textContent = appState.categories.length;

  let filtered = appState.categories.filter(c => {
    if (!search) return true;
    const q = `${c.name} ${c.id} ${c.description || ''} ${(c.keywords || []).join(' ')}`.toLowerCase();
    return q.includes(search);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:30px; color:var(--partner-muted);">
          No categories found. Click "+ Add New Category" to create one.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(cat => {
    const prodCount = appState.products.filter(p => p.categoryId === cat.id || p.category === cat.name || p.category === cat.id).length;
    const imgSrc = cat.image ? (cat.image.startsWith('http') || cat.image.startsWith('uploads/') || cat.image.startsWith('data:') ? cat.image : `7HILLS WEBSITE FOR STOCK ITEMS/${cat.image}`) : 'image-coming-soon.svg';

    return `
      <tr data-id="${cat.id}">
        <td>
          <div class="cat-thumb-cell">
            <img src="${imgSrc}" alt="${cat.name}" class="cat-thumb-img" onerror="this.src='image-coming-soon.svg'">
            <div>
              <strong style="color:#FFF; display:block; font-size:13px;">${cat.name}</strong>
              <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:2px;">
                ${(cat.keywords || []).slice(0, 3).map(k => `<span class="badge-cat-tag">${k}</span>`).join('')}
              </div>
            </div>
          </div>
        </td>
        <td><code style="color:var(--partner-gold); font-size:12px; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:4px;">${cat.id}</code></td>
        <td><span style="color:var(--partner-muted); font-size:12px; text-transform:capitalize;">${cat.icon || 'temple'}</span></td>
        <td><span class="partner-stock-badge stock-ok">${prodCount} Items</span></td>
        <td style="max-width:280px; font-size:12px; color:var(--partner-muted); line-height:1.4;">${cat.description || 'Sacred collection'}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button type="button" class="action-icon-btn" onclick="openEditCategoryModal('${cat.id}')" title="Edit Category">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button type="button" class="action-icon-btn delete" onclick="deleteCategory('${cat.id}')" title="Delete Category">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function populateCategoryDropdowns() {
  const filterCat = document.getElementById('filter-catalog-category');
  const editProdCat = document.getElementById('edit-prod-category');

  if (filterCat) {
    const currentVal = filterCat.value;
    filterCat.innerHTML = `
      <option value="ALL">All Categories</option>
      ${appState.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
    `;
    if (currentVal && [...filterCat.options].some(o => o.value === currentVal)) {
      filterCat.value = currentVal;
    }
  }

  if (editProdCat) {
    const currentVal = editProdCat.value;
    editProdCat.innerHTML = appState.categories.map(c => `
      <option value="${c.name}">${c.name}</option>
    `).join('');
    if (currentVal && [...editProdCat.options].some(o => o.value === currentVal)) {
      editProdCat.value = currentVal;
    }
  }
}

function openAddCategoryModal() {
  document.getElementById('category-modal-title').textContent = 'Add New Category to Store';
  document.getElementById('edit-cat-is-edit').value = 'false';
  document.getElementById('edit-cat-name').value = '';
  document.getElementById('edit-cat-id').value = '';
  document.getElementById('edit-cat-id').readOnly = false;
  document.getElementById('edit-cat-icon').value = 'temple';
  document.getElementById('edit-cat-image').value = 'IMAGE (47).JPG';
  document.getElementById('edit-cat-keywords').value = '';
  document.getElementById('edit-cat-desc').value = '';
  document.getElementById('category-modal-overlay').style.display = 'flex';
}

function openEditCategoryModal(id) {
  const cat = appState.categories.find(c => c.id === id);
  if (!cat) return;

  document.getElementById('category-modal-title').textContent = 'Edit Category Details';
  document.getElementById('edit-cat-is-edit').value = 'true';
  document.getElementById('edit-cat-name').value = cat.name || '';
  document.getElementById('edit-cat-id').value = cat.id || '';
  document.getElementById('edit-cat-id').readOnly = true;
  document.getElementById('edit-cat-icon').value = cat.icon || 'temple';
  document.getElementById('edit-cat-image').value = cat.image || '';
  document.getElementById('edit-cat-keywords').value = (cat.keywords || []).join(', ');
  document.getElementById('edit-cat-desc').value = cat.description || '';
  document.getElementById('category-modal-overlay').style.display = 'flex';
}

async function saveCategoryModal() {
  const isEdit = document.getElementById('edit-cat-is-edit').value === 'true';
  const name = document.getElementById('edit-cat-name').value.trim();
  let id = document.getElementById('edit-cat-id').value.trim();
  const icon = document.getElementById('edit-cat-icon').value;
  const image = document.getElementById('edit-cat-image').value.trim();
  const keywordsRaw = document.getElementById('edit-cat-keywords').value;
  const description = document.getElementById('edit-cat-desc').value.trim();

  if (!name) {
    showToast('Please enter category name.', 'error');
    return;
  }

  if (!id) {
    id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim().toLowerCase()).filter(Boolean) : [name.toLowerCase()];

  const payload = {
    id,
    name,
    icon,
    image: image || 'IMAGE (47).JPG',
    keywords,
    description: description || `Authentic ${name} for sacred Hindu rituals.`
  };

  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      document.getElementById('category-modal-overlay').style.display = 'none';
      showToast(`Category "${name}" saved! Impacting live app.`, 'success');
      await fetchCategories();
    } else {
      showToast('Error saving category', 'error');
    }
  } catch (e) {
    showToast('Failed to connect to server', 'error');
  }
}

async function deleteCategory(id) {
  const cat = appState.categories.find(c => c.id === id);
  const name = cat ? cat.name : id;

  if (!confirm(`Are you sure you want to delete category "${name}"?\nThis will remove it from the customer app navigation and catalog!`)) {
    return;
  }

  try {
    const res = await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    if (res.ok) {
      showToast(`Deleted category "${name}"`, 'info');
      await fetchCategories();
    } else {
      showToast('Error deleting category', 'error');
    }
  } catch (e) {
    showToast('Failed to delete category', 'error');
  }
}

// ===================================================
// 7. APPOINTMENTS MANAGEMENT
// ===================================================
async function fetchAppointments() {
  try {
    const res = await fetch('/api/appointments');
    if (res.ok) {
      appState.appointments = await res.json();
      renderAppointments();
    }
  } catch (e) {
    console.error('Failed to fetch appointments:', e);
  }
}

function renderAppointments() {
  const container = document.getElementById('appointments-container');
  document.getElementById('tab-badge-appts').textContent = appState.appointments.length;

  if (appState.appointments.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--partner-muted);">
        <p>No priest consultation requests submitted yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appState.appointments.map(appt => `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <div class="order-id-title">${appt.name || 'Devotee'}</div>
          <div class="order-time-stamp">Booked: ${appt.date || 'Recent'}</div>
        </div>
        <span class="order-status-badge accepted">Consultation</span>
      </div>

      <div class="order-customer-box">
        <div><strong>Phone:</strong> ${appt.phone || '90979 99939'}</div>
        <div><strong>Gotram:</strong> ${appt.gotram || 'Shiva / Kashyapa'}</div>
        <div><strong>Pooja Required:</strong> ${appt.poojaType || 'Satyanarayana Swamy Vratam'}</div>
        <div><strong>Preferred Date/Time:</strong> ${appt.preferredTime || 'Morning Muhurtham'}</div>
      </div>

      <div class="order-card-actions">
        <a href="tel:${appt.phone || '9097999939'}" class="btn-order-action btn-order-status">
          Call Devotee
        </a>
        <a href="https://wa.me/91${appt.phone || '9097999939'}?text=Namaste%20from%207%20Hills%20Pooja%20Store%2C%20regarding%20your%20pooja%20consultation" target="_blank" class="btn-order-action btn-order-whatsapp">
          WhatsApp Devotee
        </a>
      </div>
    </div>
  `).join('');
}

// ===================================================
// 8. STORE STATS
// ===================================================
function updateStats() {
  const totalOrders = appState.orders.length;
  const pendingOrders = appState.orders.filter(o => o.status !== 'Delivered').length;
  const revenue = appState.orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const totalProducts = appState.products.length;

  document.getElementById('stat-total-orders').textContent = totalOrders;
  document.getElementById('stat-pending-orders').textContent = pendingOrders;
  document.getElementById('stat-total-revenue').textContent = `₹${revenue.toLocaleString('en-IN')}`;
  document.getElementById('stat-total-products').textContent = totalProducts;
}

// ===================================================
// 9. TAB NAVIGATION & EVENT LISTENERS
// ===================================================
function initTabs() {
  const tabs = document.querySelectorAll('.partner-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const tabKey = btn.getAttribute('data-tab');
      const targetView = document.getElementById(`view-${tabKey}`);
      if (targetView) targetView.classList.add('active');
      appState.activeTab = tabKey;
    });
  });

  // Filter & Search events
  document.getElementById('search-orders-input').addEventListener('input', renderOrders);
  document.getElementById('filter-order-status').addEventListener('change', renderOrders);
  document.getElementById('btn-refresh-orders').addEventListener('click', fetchOrders);

  document.getElementById('search-catalog-input').addEventListener('input', renderCatalog);
  document.getElementById('filter-catalog-category').addEventListener('change', renderCatalog);
  document.getElementById('filter-catalog-stock').addEventListener('change', renderCatalog);
  document.getElementById('btn-open-add-product').addEventListener('click', openAddProductModal);

  document.getElementById('btn-refresh-appts').addEventListener('click', fetchAppointments);

  // Category events
  const searchCatInp = document.getElementById('search-categories-input');
  if (searchCatInp) searchCatInp.addEventListener('input', renderCategories);

  const btnOpenAddCat = document.getElementById('btn-open-add-category');
  if (btnOpenAddCat) btnOpenAddCat.addEventListener('click', openAddCategoryModal);

  const btnCloseCat = document.getElementById('btn-close-category-modal');
  if (btnCloseCat) btnCloseCat.addEventListener('click', () => {
    document.getElementById('category-modal-overlay').style.display = 'none';
  });

  const btnCancelCat = document.getElementById('btn-cancel-category-modal');
  if (btnCancelCat) btnCancelCat.addEventListener('click', () => {
    document.getElementById('category-modal-overlay').style.display = 'none';
  });

  const btnSaveCat = document.getElementById('btn-save-category');
  if (btnSaveCat) btnSaveCat.addEventListener('click', saveCategoryModal);

  // Auto-slug generator for categories
  const catNameInput = document.getElementById('edit-cat-name');
  const catIdInput = document.getElementById('edit-cat-id');
  if (catNameInput && catIdInput) {
    catNameInput.addEventListener('input', () => {
      if (document.getElementById('edit-cat-is-edit').value !== 'true') {
        catIdInput.value = catNameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    });
  }

  // Modal events
  document.getElementById('btn-close-product-modal').addEventListener('click', () => {
    document.getElementById('product-modal-overlay').style.display = 'none';
  });
  document.getElementById('btn-cancel-product-modal').addEventListener('click', () => {
    document.getElementById('product-modal-overlay').style.display = 'none';
  });
  document.getElementById('btn-save-product').addEventListener('click', saveProductModal);
}

// Toast
function showToast(message, type = 'info') {
  const container = document.getElementById('partner-toast-container');
  const toast = document.createElement('div');
  toast.className = 'partner-toast';
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function loadAllData() {
  fetchOrders();
  fetchProducts();
  fetchCategories();
  fetchAppointments();
}

// Expose functions to global scope
window.updateOrderStatus = updateOrderStatus;
window.toggleProductStock = toggleProductStock;
window.quickAdjustStock = quickAdjustStock;
window.openEditProductModal = openEditProductModal;
window.openAddProductModal = openAddProductModal;
window.deleteProduct = deleteProduct;
window.openAddCategoryModal = openAddCategoryModal;
window.openEditCategoryModal = openEditCategoryModal;
window.saveCategoryModal = saveCategoryModal;
window.deleteCategory = deleteCategory;
window.renderCategories = renderCategories;
window.calculateDiscountPreview = calculateDiscountPreview;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initPinAuth();
  initTabs();
  initAlertModalEvents();
  initSseListener();
  initMediaUploadHandlers();
});
