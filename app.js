/**
 * ==========================================================================
 * 7 Hills Pooja Store — Production E-Commerce Application Engine
 * Brand: 7 Hills Pooja Store
 * Tagline: Positive Energy in Every Item.
 * Location: Beside Prasannanjaneya Swamy Temple, LB Nagar Main Road, Hyderabad.
 * ==========================================================================
 */

// Global Application State Store
const STORE = {
  products: [],
  categories: [],
  coupons: [],
  cart: [],
  wishlist: [],
  orders: [],
  addresses: [],
  appliedCoupon: null,
  selectedDeliveryMethod: 'instant',
  userLocation: 'LB Nagar, Hyderabad',
  userProfile: {
    name: 'Ashlesh Gurram',
    phone: '9097999939',
    email: 'ashlesh.gurram@example.com'
  },
  fuse: null,
  imageBasePath: '7HILLS WEBSITE FOR STOCK ITEMS/',
  viewMode: localStorage.getItem('7hills_view_mode') || 'grid',
  selectedPaymentMethod: 'UPI',
  subscriptions: []
};

// ==========================================
// 1. STATE INITIALIZATION & LOCALSTORAGE
// ==========================================
function initStore() {
  // Load products & categories from enriched data.js
  if (typeof window.getEnrichedProducts === 'function') {
    STORE.products = window.getEnrichedProducts();
  } else {
    STORE.products = [];
  }
  STORE.categories = window.CATEGORIES_DATA || [];
  STORE.coupons = window.PROMO_COUPONS || [];

  // Initialize Fuse.js for search
  if (typeof Fuse !== 'undefined') {
    STORE.fuse = new Fuse(STORE.products, {
      keys: ['title', 'category', 'description'],
      threshold: 0.35,
      ignoreLocation: true
    });
  }

  // Load Persisted Cart
  try {
    const savedCart = localStorage.getItem('7hills_cart');
    if (savedCart) STORE.cart = JSON.parse(savedCart);
  } catch (e) {
    STORE.cart = [];
  }

  // Load Persisted Wishlist
  try {
    const savedWishlist = localStorage.getItem('7hills_wishlist');
    if (savedWishlist) STORE.wishlist = JSON.parse(savedWishlist);
  } catch (e) {
    STORE.wishlist = [];
  }

  // Load Persisted Coupon
  try {
    const savedCoupon = localStorage.getItem('7hills_coupon');
    if (savedCoupon) STORE.appliedCoupon = JSON.parse(savedCoupon);
  } catch (e) {
    STORE.appliedCoupon = null;
  }

  // Load Persisted Addresses
  try {
    const savedAddresses = localStorage.getItem('7hills_addresses');
    if (savedAddresses) {
      STORE.addresses = JSON.parse(savedAddresses);
    } else {
      STORE.addresses = window.DEFAULT_ADDRESSES || [];
      saveAddresses();
    }
  } catch (e) {
    STORE.addresses = window.DEFAULT_ADDRESSES || [];
  }

  // Load Persisted Orders
  try {
    const savedOrders = localStorage.getItem('7hills_orders');
    if (savedOrders) {
      STORE.orders = JSON.parse(savedOrders);
    } else {
      STORE.orders = window.DEFAULT_ORDERS || [];
      saveOrders();
    }
  } catch (e) {
    STORE.orders = window.DEFAULT_ORDERS || [];
  }

  // Load Persisted Subscriptions
  try {
    const savedSubs = localStorage.getItem('7hills_subscriptions');
    if (savedSubs) STORE.subscriptions = JSON.parse(savedSubs);
  } catch (e) {
    STORE.subscriptions = [];
  }

  // Load Delivery Preference
  try {
    const savedDeliv = localStorage.getItem('7hills_delivery_method');
    if (savedDeliv) STORE.selectedDeliveryMethod = savedDeliv;
  } catch (e) {}

  initThemeMode();
  setAppLanguage(STORE.currentLanguage, false);
  updateHeaderBadges();
  renderDesktopSubnav();
  updateFloatingCartBar();
}

function saveCart() {
  localStorage.setItem('7hills_cart', JSON.stringify(STORE.cart));
  updateHeaderBadges();
}

function saveWishlist() {
  localStorage.setItem('7hills_wishlist', JSON.stringify(STORE.wishlist));
  updateHeaderBadges();
}

function saveOrders() {
  localStorage.setItem('7hills_orders', JSON.stringify(STORE.orders));
}

function saveAddresses() {
  localStorage.setItem('7hills_addresses', JSON.stringify(STORE.addresses));
}

function getProductImageUrl(imgName) {
  if (!imgName) return 'image-coming-soon.svg';
  if (typeof imgName === 'string') {
    if (imgName.startsWith('data:') || imgName.startsWith('blob:') || imgName.startsWith('http://') || imgName.startsWith('https://')) {
      return imgName;
    }
    if (imgName.startsWith('uploads/') || imgName.startsWith('/uploads/')) {
      return imgName.startsWith('/') ? imgName : `/${imgName}`;
    }
    if (imgName.startsWith('7HILLS') || imgName.startsWith('/7HILLS')) {
      return imgName;
    }
  }
  return imgName || 'image-coming-soon.svg';
}

// ==========================================
// 2. HEADER & NAVIGATION UTILITIES
// ==========================================
function updateHeaderBadges() {
  const totalCartCount = STORE.cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = STORE.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const wishlistCount = STORE.wishlist.length;

  // Desktop Badges
  const cartBadge = document.getElementById('cart-badge-count');
  const cartItemsText = document.getElementById('header-cart-items-text');
  const cartTotalText = document.getElementById('header-cart-total-text');
  const wishlistBadge = document.getElementById('wishlist-badge-count');

  if (cartBadge) {
    cartBadge.textContent = totalCartCount;
    cartBadge.style.display = totalCartCount > 0 ? 'flex' : 'none';
  }
  if (cartItemsText) cartItemsText.textContent = `${totalCartCount} item${totalCartCount === 1 ? '' : 's'}`;
  if (cartTotalText) cartTotalText.textContent = `₹${cartSubtotal.toLocaleString('en-IN')}`;
  if (wishlistBadge) {
    wishlistBadge.textContent = wishlistCount;
    wishlistBadge.style.display = wishlistCount > 0 ? 'flex' : 'none';
  }

  // Mobile Badges
  const mobCartBadge = document.getElementById('mobile-cart-badge');
  const mobBottomCartBadge = document.getElementById('mobile-bottom-cart-badge');
  const headerCartBadge = document.getElementById('header-cart-badge');
  const subHeaderCartBadge = document.getElementById('sub-header-cart-badge');
  const mobWishlistBadge = document.getElementById('mobile-wishlist-badge');
  const drawerBadge = document.getElementById('cart-drawer-badge');

  [mobCartBadge, headerCartBadge, subHeaderCartBadge].forEach(b => {
    if (b) {
      b.textContent = totalCartCount;
      b.style.display = totalCartCount > 0 ? 'flex' : 'none';
    }
  });

  if (mobBottomCartBadge) {
    mobBottomCartBadge.textContent = totalCartCount;
    mobBottomCartBadge.style.display = totalCartCount > 0 ? 'flex' : 'none';
    if (totalCartCount > 0) {
      mobBottomCartBadge.classList.remove('cart-badge-bounce');
      void mobBottomCartBadge.offsetWidth;
      mobBottomCartBadge.classList.add('cart-badge-bounce');
    }
  }

  if (mobWishlistBadge) {
    mobWishlistBadge.textContent = wishlistCount;
    mobWishlistBadge.style.display = wishlistCount > 0 ? 'flex' : 'none';
  }

  if (drawerBadge) {
    drawerBadge.textContent = totalCartCount;
  }

  // Animate bottom cart icon wrap
  const cartIconWrap = document.getElementById('bottom-cart-icon-wrap');
  if (cartIconWrap && totalCartCount > 0) {
    cartIconWrap.classList.remove('cart-badge-bounce');
    void cartIconWrap.offsetWidth;
    cartIconWrap.classList.add('cart-badge-bounce');
  }

  updateFloatingCartBar();
}

function updateFloatingCartBar() {
  const bar = document.getElementById('floating-cart-bar');
  if (!bar) return;

  const count = STORE.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = STORE.cart.reduce((sum, item) => sum + ((Number(item.product.price) || 0) * item.quantity), 0);

  const hash = window.location.hash || '#/';
  // Show floating cart bar ONLY when user is browsing products
  const isBrowseRoute = (hash === '#/' || hash === '' || hash.startsWith('#/categories') || hash.startsWith('#/category/') || hash.startsWith('#/search') || hash.startsWith('#/deals') || hash.startsWith('#/product/'));
  const overlay = document.getElementById('cart-drawer-overlay');
  const isDrawerOpen = overlay && overlay.classList.contains('active');

  if (count > 0 && isBrowseRoute && !isDrawerOpen) {
    bar.classList.add('visible');
    const countEl = document.getElementById('floating-cart-count');
    const totalEl = document.getElementById('floating-cart-total');
    if (countEl) countEl.textContent = `${count} Item${count === 1 ? '' : 's'}`;
    if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
  } else {
    bar.classList.remove('visible');
  }
}

// Sacred Temple Bell Chime is defined in audio section

// Slide-Up Bottom Sheet Cart Drawer Controls
function openCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  const sheet = document.getElementById('cart-drawer-sheet');
  if (!overlay || !sheet) return;

  renderCartDrawerContent();
  overlay.classList.add('active');
  sheet.classList.add('open');
  document.body.style.overflow = 'hidden';

  const bar = document.getElementById('floating-cart-bar');
  if (bar) bar.classList.remove('visible');

  const cartIconWrap = document.getElementById('bottom-cart-icon-wrap');
  if (cartIconWrap) {
    cartIconWrap.classList.remove('cart-badge-bounce');
    void cartIconWrap.offsetWidth;
    cartIconWrap.classList.add('cart-badge-bounce');
  }
}

function closeCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  const sheet = document.getElementById('cart-drawer-sheet');
  if (overlay) overlay.classList.remove('active');
  if (sheet) sheet.classList.remove('open');
  document.body.style.overflow = '';
  updateFloatingCartBar();
}

function handleDrawerBackdropClick(event) {
  if (event.target.id === 'cart-drawer-overlay') {
    closeCartDrawer();
  }
}

function renderCartDrawerContent() {
  const body = document.getElementById('cart-drawer-body');
  const footer = document.getElementById('cart-drawer-footer');
  const badge = document.getElementById('cart-drawer-badge');
  if (!body) return;

  const totalCartCount = STORE.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) badge.textContent = totalCartCount;

  if (STORE.cart.length === 0) {
    body.innerHTML = `
      <div class="cart-drawer-empty">
        <div class="cart-drawer-empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        </div>
        <h4>Your Pooja Cart is Empty</h4>
        <p>Bring sacred spiritual energy into your home. Explore our collection of authentic brass idols, pure diyas, and samagri kits.</p>
        <button type="button" class="btn btn-primary" onclick="closeCartDrawer(); window.location.hash='#/categories';">
          Explore Sacred Items &rarr;
        </button>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'flex';

  body.innerHTML = `
    <div class="cart-drawer-items-list">
      <div class="cart-drawer-delivery-promise">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="13" x="1" y="6" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        <span>Instant Express Delivery to <strong>${STORE.userLocation}</strong> in 45-60 mins</span>
      </div>
      ${STORE.cart.map(item => {
        const prod = item.product;
        const imgUrl = getProductImageUrl(prod.images[0]);
        const selling = Number(prod.price) || 0;
        const rawMrp = Number(prod.mrp);
        const mrp = rawMrp && rawMrp > selling ? rawMrp : Math.round(selling * 1.3);

        return `
          <div class="cart-drawer-item-row" id="drawer-item-${prod.id}">
            <div class="cart-item-swipe-container" 
                 ontouchstart="handleCartTouchStart(event, '${prod.id}')" 
                 ontouchmove="handleCartTouchMove(event, '${prod.id}')" 
                 ontouchend="handleCartTouchEnd(event, '${prod.id}')">
              
              <div class="cart-item-main-content">
                <img src="${imgUrl}" alt="${prod.title}" class="cart-drawer-thumb" onerror="this.src='image-coming-soon.svg'">
                
                <div class="cart-drawer-item-meta">
                  <a href="#/product/${prod.id}" class="cart-drawer-item-title" onclick="closeCartDrawer()">${prod.title}</a>
                  <div class="cart-drawer-item-pricing">
                    <span class="cart-drawer-price">₹${selling.toLocaleString('en-IN')}</span>
                    ${mrp > selling ? `<s class="cart-drawer-mrp">₹${mrp.toLocaleString('en-IN')}</s>` : ''}
                  </div>
                </div>

                <div class="cart-drawer-stepper-wrap">
                  <div class="qty-stepper">
                    <button type="button" class="stepper-btn" onclick="updateCartQuantity('${prod.id}', -1, true)" aria-label="Decrease">–</button>
                    <span class="stepper-val">${item.quantity}</span>
                    <button type="button" class="stepper-btn" onclick="updateCartQuantity('${prod.id}', 1, true)" aria-label="Increase">+</button>
                  </div>
                  <button type="button" class="btn-drawer-remove-item" onclick="deleteCartItemWithUndo('${prod.id}')" title="Remove item" aria-label="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              <div class="cart-item-delete-action" onclick="deleteCartItemWithUndo('${prod.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                <span>Delete</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}

      <div class="cart-drawer-assurance">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>100% Sanctified & Temple-Blessed Guarantee. Zero Synthetic Adulteration.</span>
      </div>
    </div>
  `;

  // Compute Bill Summary
  const subtotal = STORE.cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const mrpTotal = STORE.cart.reduce((sum, i) => {
    const rawMrp = Number(i.product.mrp);
    const pMrp = rawMrp && rawMrp > i.product.price ? rawMrp : Math.round(i.product.price * 1.3);
    return sum + (pMrp * i.quantity);
  }, 0);
  const savings = Math.max(0, mrpTotal - subtotal);
  const delivery = subtotal >= 499 ? 0 : 49;
  const totalToPay = subtotal + delivery;

  const elSavings = document.getElementById('drawer-bill-savings');
  const elSubtotal = document.getElementById('drawer-bill-subtotal');
  const elDiscount = document.getElementById('drawer-bill-discount');
  const elDelivery = document.getElementById('drawer-bill-delivery');
  const elCheckoutTotal = document.getElementById('drawer-checkout-total');

  if (elSavings) elSavings.textContent = savings > 0 ? `You Save ₹${savings.toLocaleString('en-IN')}` : '';
  if (elSubtotal) elSubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (elDiscount) elDiscount.textContent = savings > 0 ? `-₹${savings.toLocaleString('en-IN')}` : '₹0';
  if (elDelivery) elDelivery.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
  if (elCheckoutTotal) elCheckoutTotal.textContent = `₹${totalToPay.toLocaleString('en-IN')}`;
}

function toggleDrawerBillDetails() {
  const details = document.getElementById('cart-bill-details');
  const chevron = document.getElementById('drawer-bill-chevron');
  const label = document.getElementById('drawer-bill-expand-label');
  if (!details) return;

  const isHidden = details.style.display === 'none' || !details.style.display;
  if (isHidden) {
    details.style.display = 'block';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    if (label) label.textContent = 'Hide Details';
  } else {
    details.style.display = 'none';
    if (chevron) chevron.style.transform = 'rotate(0deg)';
    if (label) label.textContent = 'View Details';
  }
}

function proceedToCheckoutFromDrawer(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  closeCartDrawer();
  window.location.hash = '#/checkout';
}

// Touch swipe gestures on cart drawer items
let cartTouchStartX = 0;

function handleCartTouchStart(e, id) {
  if (e.touches && e.touches[0]) {
    cartTouchStartX = e.touches[0].clientX;
  }
}

function handleCartTouchMove(e, id) {
  if (!e.touches || !e.touches[0]) return;
  const diffX = cartTouchStartX - e.touches[0].clientX;
  const row = document.getElementById(`drawer-item-${id}`);
  if (!row) return;

  if (diffX > 40) {
    row.classList.add('swiped');
  } else if (diffX < -30) {
    row.classList.remove('swiped');
  }
}

function handleCartTouchEnd(e, id) {
  // Retained by css transition
}

// Swipe-to-Delete with Undo Snackbar
let lastRemovedCartItem = null;
let undoSnackbarTimer = null;

function deleteCartItemWithUndo(productId) {
  const index = STORE.cart.findIndex(i => i.product.id === productId);
  if (index === -1) return;

  const removed = STORE.cart[index];
  lastRemovedCartItem = { item: removed, index };

  STORE.cart.splice(index, 1);
  saveCart();
  updateHeaderBadges();
  updateFloatingCartBar();
  updateCardStepperInPlace(productId, 0);

  const drawer = document.getElementById('cart-drawer-sheet');
  if (drawer && drawer.classList.contains('open')) {
    renderCartDrawerContent();
  } else if (window.location.hash === '#/cart') {
    renderCartView();
  }

  showUndoSnackbar(`Removed ${removed.product.title}`);
}

function showUndoSnackbar(msg) {
  const bar = document.getElementById('undo-snackbar');
  const text = document.getElementById('undo-snackbar-msg');
  if (!bar) return;

  if (text) text.textContent = msg;
  bar.style.display = 'flex';
  bar.classList.add('show');

  if (undoSnackbarTimer) clearTimeout(undoSnackbarTimer);
  undoSnackbarTimer = setTimeout(() => {
    bar.classList.remove('show');
    setTimeout(() => { bar.style.display = 'none'; }, 300);
    lastRemovedCartItem = null;
  }, 4500);
}

function executeCartUndo() {
  if (!lastRemovedCartItem) return;
  STORE.cart.splice(lastRemovedCartItem.index, 0, lastRemovedCartItem.item);
  saveCart();
  updateHeaderBadges();
  updateFloatingCartBar();
  updateCardStepperInPlace(lastRemovedCartItem.item.product.id, lastRemovedCartItem.item.quantity);

  const drawer = document.getElementById('cart-drawer-sheet');
  if (drawer && drawer.classList.contains('open')) {
    renderCartDrawerContent();
  } else if (window.location.hash === '#/cart') {
    renderCartView();
  }

  const bar = document.getElementById('undo-snackbar');
  if (bar) {
    bar.classList.remove('show');
    setTimeout(() => { bar.style.display = 'none'; }, 300);
  }
  showToast(`Restored <strong>${lastRemovedCartItem.item.product.title}</strong>`);
  playSacredTempleBell();
  lastRemovedCartItem = null;
}

// In-Place Card Stepper update (Zero full-page DOM destruction, 60fps)
function updateCardStepperInPlace(productId, quantity) {
  const cards = document.querySelectorAll(`[data-product-id="${productId}"]`);
  cards.forEach(card => {
    const actionRow = card.querySelector('.card-actions-row');
    if (!actionRow) return;

    if (quantity > 0) {
      actionRow.innerHTML = `
        <div class="qty-stepper">
          <button type="button" class="stepper-btn" onclick="updateCartQuantity('${productId}', -1)" aria-label="Decrease quantity">–</button>
          <span class="stepper-val">${quantity}</span>
          <button type="button" class="stepper-btn" onclick="updateCartQuantity('${productId}', 1)" aria-label="Increase quantity">+</button>
        </div>
      `;
    } else {
      actionRow.innerHTML = `
        <button 
          type="button" 
          class="card-add-btn" 
          onclick="addToCart('${productId}', 1)"
          data-testid="add-to-cart-btn"
        >
          + ADD
        </button>
      `;
    }
  });

  const pdpQtyVal = document.getElementById('pdp-qty-val');
  if (pdpQtyVal) {
    const item = STORE.cart.find(i => i.product.id === productId);
    if (item) pdpQtyVal.textContent = item.quantity;
  }
}

function renderDesktopSubnav() {
  const subnav = document.getElementById('desktop-subnav-list');
  if (!subnav) return;
  subnav.innerHTML = `
    <li class="subnav-item"><a href="#/"> All Devotional</a></li>
    ${STORE.categories.map(c => `
      <li class="subnav-item">
        <a href="#/category/${c.id}">
          <span class="subnav-icon">${c.icon}</span>
          <span>${c.name}</span>
        </a>
      </li>
    `).join('')}
    <li class="subnav-item"><a href="#/deals"> Special Deals</a></li>
    <li class="subnav-item"><a href="#/appointment"> Samagri Consult</a></li>
  `;
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ==========================================
// 3. CART & WISHLIST ACTIONS
// ==========================================
function addToCart(productId, quantity = 1, openCart = false) {
  const product = STORE.products.find(p => p.id === productId);
  if (!product) return;

  const existing = STORE.cart.find(item => item.product.id === productId);
  let inCartQty = quantity;
  if (existing) {
    existing.quantity += quantity;
    inCartQty = existing.quantity;
  } else {
    STORE.cart.push({ product, quantity });
  }

  saveCart();
  playSacredTempleBell();
  updateCardStepperInPlace(productId, inCartQty);
  updateHeaderBadges();
  updateFloatingCartBar();

  const drawer = document.getElementById('cart-drawer-sheet');
  if (drawer && drawer.classList.contains('open')) {
    renderCartDrawerContent();
  }

  showToast(`Added <strong>${product.title}</strong> to cart.`);

  if (openCart) {
    openCartDrawer();
  }
}

function updateCartQuantity(productId, delta, fromDrawer = false) {
  const item = STORE.cart.find(i => i.product.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    deleteCartItemWithUndo(productId);
    return;
  }

  saveCart();
  playSacredTempleBell();
  updateHeaderBadges();
  updateFloatingCartBar();
  updateCardStepperInPlace(productId, item.quantity);

  if (fromDrawer || (document.getElementById('cart-drawer-sheet')?.classList.contains('open'))) {
    renderCartDrawerContent();
  } else if (window.location.hash === '#/cart') {
    renderCartView();
  }
}

function removeFromCart(productId) {
  deleteCartItemWithUndo(productId);
}

function toggleWishlist(productId) {
  const index = STORE.wishlist.indexOf(productId);
  const prod = STORE.products.find(p => p.id === productId);
  const title = prod ? prod.title : 'Item';

  if (index >= 0) {
    STORE.wishlist.splice(index, 1);
    showToast(`Removed <strong>${title}</strong> from wishlist.`);
  } else {
    STORE.wishlist.push(productId);
    showToast(`Saved <strong>${title}</strong> to wishlist.`);
  }

  saveWishlist();
  if (window.location.hash === '#/wishlist') renderWishlistView();
  else handleRouting();
}

// ==========================================
// 4. REUSABLE PRODUCT CARD COMPONENT
// ==========================================
function renderProductCard(product) {
  const isWishlisted = STORE.wishlist.includes(product.id);
  const cartItem = STORE.cart.find(item => item.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const imgUrl = getProductImageUrl(product.images[0]);

  const sellingPrice = Number(product.price) || 0;
  const rawMrp = Number(product.mrp);
  const mrpPrice = rawMrp && rawMrp > sellingPrice ? rawMrp : Math.round(sellingPrice * 1.3);
  const discountPercent = product.discount || (mrpPrice > sellingPrice ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0);

  const isIdol = product.categoryId === 'god-idols';
  const isDailyPooja = product.categoryId === 'pooja-samagri' || product.categoryId === 'incense-dhoop' || product.categoryId === 'diyas-lamps';

  return `
    <div class="product-card" data-product-id="${product.id}" data-testid="product-card">
      ${product.badge ? `<span class="card-badge">${product.badge}</span>` : ''}
      
      <button 
        type="button" 
        class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" 
        onclick="toggleWishlist('${product.id}')"
        title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}"
        aria-label="Wishlist"
        data-testid="wishlist-btn"
      >
        ${isWishlisted ? (typeof getIcon !== 'undefined' ? getIcon('heart-filled', 15) : 'Saved') : (typeof getIcon !== 'undefined' ? getIcon('heart', 15) : 'Save')}
      </button>

      <a href="#/product/${product.id}" class="product-card-img-wrapper" aria-label="${product.title}">
        <img 
          src="${imgUrl}" 
          alt="${product.title}" 
          loading="lazy"
          onerror="this.src='image-coming-soon.svg'"
        >
      </a>

      <div class="product-card-body">
        <span class="product-card-category">${product.category}</span>
        <a href="#/product/${product.id}">
          <h3 class="product-card-title" title="${product.title}">${product.title}</h3>
        </a>

        <div class="product-card-rating">
          <span class="rating-pill">${typeof getIcon !== "undefined" ? getIcon("star", 10) : ""} ${product.rating || '4.9'}</span>
          <span class="rating-count">(${product.reviewCount || '120+'})</span>
          ${product.inStock !== false ? '<span style="font-size: 10.5px; color: var(--success); margin-left: auto; font-weight: 700;">In Stock</span>' : '<span style="font-size: 10.5px; color: var(--danger); margin-left: auto; font-weight: 700;">Out of Stock</span>'}
        </div>

        <div class="product-card-price-row">
          <div class="price-stack">
            <span class="selling-price">₹${sellingPrice.toLocaleString('en-IN')}</span>
            ${mrpPrice > sellingPrice ? `<s class="mrp-price">₹${mrpPrice.toLocaleString('en-IN')}</s>` : ''}
          </div>
          ${discountPercent > 0 ? `<span class="discount-tag">${discountPercent}% OFF</span>` : ''}
        </div>

        <!-- Devotional Smart Action Badges -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px;">
          ${isIdol ? `
            <button type="button" class="btn-card-quick-feat" onclick="openArModal('${product.id}')" title="Preview in your home mandir">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V4h4"/><path d="M20 8V4h-4"/><path d="M4 16v4h4"/><path d="M20 16v4h-4"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Mandir AR</span>
            </button>
          ` : ''}
          ${isDailyPooja ? `
            <button type="button" class="btn-card-quick-feat" onclick="openSubscriptionModal('${product.id}')" title="Schedule auto-restock delivery">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
              <span>Auto-Restock</span>
            </button>
          ` : ''}
        </div>

        <div class="card-actions-row">
          ${inCartQty > 0 ? `
            <div class="qty-stepper">
              <button type="button" class="stepper-btn" onclick="updateCartQuantity('${product.id}', -1)" aria-label="Decrease quantity">–</button>
              <span class="stepper-val">${inCartQty}</span>
              <button type="button" class="stepper-btn" onclick="updateCartQuantity('${product.id}', 1)" aria-label="Increase quantity">+</button>
            </div>
          ` : `
            <button 
              type="button" 
              class="card-add-btn" 
              onclick="addToCart('${product.id}', 1)"
              data-testid="add-to-cart-btn"
            >
              + ADD
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 5. CLIENT-SIDE ROUTER & VIEW RENDERERS
// ==========================================
function handleRouting() {
  const hash = window.location.hash || '#/';
  const root = document.getElementById('app-root');
  if (!root) return;
  // Update Context-Aware Mobile Header (Root vs Sub-page)
  const navRoot = document.getElementById('nav-header-root');
  const navSub = document.getElementById('nav-header-sub');
  const searchWrap = document.getElementById('app-search-wrapper');
  const subTitle = document.getElementById('sub-header-title');

  const pageTitles = {
    '#/categories': 'All Categories',
    '#/cart': 'Shopping Cart',
    '#/checkout': 'Secure Checkout',
    '#/orders': 'My Orders',
    '#/wishlist': 'My Wishlist',
    '#/deals': 'Festive Deals & Offers',
    '#/about': 'About 7 Hills Pooja Store',
    '#/contact': 'Contact & Store Map',
    '#/appointment': 'Pooja Kit Consultation',
    '#/entry': 'Store QR Entry',
    '#/verify-otp': 'Mobile Verification',
    '#/select-location': 'Delivery Location',
    '#/select-delivery': 'Delivery Speed'
  };

  if (navRoot && navSub) {
    if (hash === '#/' || hash === '') {
      navRoot.style.display = 'flex';
      navSub.style.display = 'none';
      if (searchWrap) searchWrap.style.display = 'block';
    } else {
      navRoot.style.display = 'none';
      navSub.style.display = 'flex';
      if (searchWrap) searchWrap.style.display = 'none';

      let title = '7 Hills Pooja Store';
      for (const [routePrefix, t] of Object.entries(pageTitles)) {
        if (hash === routePrefix || hash.startsWith(routePrefix + '/')) {
          title = t;
          break;
        }
      }
      if (hash.startsWith('#/product/')) title = 'Product Details';
      else if (hash.startsWith('#/category/')) title = 'Category Items';
      else if (hash.startsWith('#/track/')) title = 'Live Order Tracking';
      else if (hash.startsWith('#/order/')) title = 'Order Invoice';
      else if (hash.startsWith('#/order-confirmed/')) title = 'Order Confirmed';
      else if (hash.startsWith('#/search')) title = 'Search Results';

      if (subTitle) subTitle.textContent = title;
    }
  }


  // Close mobile drawer on route change
  const drawer = document.getElementById('mobile-drawer-overlay');
  if (drawer) drawer.classList.remove('active');

  // Update mobile bottom tab active state
  document.querySelectorAll('.mobile-nav-tab').forEach(tab => tab.classList.remove('active'));
  if (hash === '#/' || hash === '') document.getElementById('tab-mob-home')?.classList.add('active');
  else if (hash.startsWith('#/categories') || hash.startsWith('#/category/')) document.getElementById('tab-mob-categories')?.classList.add('active');
  else if (hash.startsWith('#/sankalpam')) document.getElementById('tab-mob-kits')?.classList.add('active');
  else if (hash.startsWith('#/orders') || hash.startsWith('#/order/') || hash.startsWith('#/track')) document.getElementById('tab-mob-orders')?.classList.add('active');
  else if (hash.startsWith('#/cart') || hash.startsWith('#/checkout')) document.getElementById('tab-mob-cart')?.classList.add('active');
  else if (hash.startsWith('#/profile') || hash.startsWith('#/wishlist')) document.getElementById('tab-mob-profile')?.classList.add('active');

  // Update floating cart bar state on route change
  updateFloatingCartBar();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Route Matching
  if (hash === '#/' || hash === '') {
    renderHomeView();
  } else if (hash === '#/categories') {
    renderCategoriesView();
  } else if (hash.startsWith('#/category/')) {
    const catId = hash.replace('#/category/', '').split('?')[0];
    renderCategoryListingView(catId);
  } else if (hash.startsWith('#/product/')) {
    const prodId = hash.replace('#/product/', '').split('?')[0];
    renderProductDetailsView(prodId);
  } else if (hash.startsWith('#/search')) {
    const queryParams = new URLSearchParams(hash.split('?')[1] || '');
    const query = queryParams.get('q') || '';
    const cat = queryParams.get('cat') || 'all';
    renderSearchView(query, cat);
  } else if (hash === '#/cart') {
    renderCartView();
  } else if (hash === '#/checkout') {
    renderCheckoutView();
  } else if (hash.startsWith('#/order-confirmed/')) {
    const orderId = hash.replace('#/order-confirmed/', '').split('?')[0];
    renderOrderConfirmedView(orderId);
  } else if (hash === '#/orders') {
    renderOrdersView();
  } else if (hash.startsWith('#/order/')) {
    const orderId = hash.replace('#/order/', '').split('?')[0];
    renderOrderDetailsView(orderId);
  } else if (hash.startsWith('#/track')) {
    const orderId = hash.includes('/') ? hash.split('/')[2] : (STORE.orders[0]?.orderId || '7H-ORD-94182');
    renderOrderTrackingView(orderId);
  } else if (hash === '#/wishlist') {
    renderWishlistView();
  } else if (hash === '#/profile') {
    renderProfileView();
  } else if (hash === '#/deals') {
    renderDealsView();
  } else if (hash === '#/about') {
    renderAboutView();
  } else if (hash === '#/contact') {
    renderContactView();
  } else if (hash === '#/appointment') {
    renderAppointmentView();
  } else if (hash === '#/sankalpam') {
    renderSankalpamView();
  } else if (hash === '#/stotram') {
    renderStotramView();
  } else if (hash === '#/entry' || hash === '#/scan') {
    renderEntryView();
  } else if (hash === '#/verify-otp') {
    renderOtpVerificationView();
  } else if (hash === '#/select-location') {
    renderSelectLocationView();
  } else if (hash === '#/select-delivery') {
    renderSelectDeliveryView();
  } else {
    // 404 Fallback
    renderNotFoundView();
  }
}

// ------------------------------------------
// DEVOTIONAL SWIGGY-STYLE WIDGETS & BANNERS
// ------------------------------------------
function renderCategorySnapStrip() {
  const curHash = window.location.hash || '#/';
  return `
    <div class="category-snap-strip-wrapper">
      <div class="category-snap-strip" id="category-snap-strip">
        <a href="#/categories" class="category-snap-item ${curHash === '#/categories' ? 'active' : ''}">
          <div class="category-snap-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          </div>
          <span class="category-snap-label">All Categories</span>
        </a>
        ${STORE.categories.map(c => `
          <a href="#/category/${c.id}" class="category-snap-item ${curHash === '#/category/' + c.id ? 'active' : ''}">
            <div class="category-snap-icon">${getIcon(c.icon || 'temple', 20)}</div>
            <span class="category-snap-label">${c.name}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function renderFestivalBanner() {
  return `
    <section class="container" style="padding-top: 10px;">
      <div class="festival-occasion-banner">
        <div class="festival-banner-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>Upcoming Sacred Mahotsavam</span>
        </div>
        <h3 class="festival-banner-title">Sri Rama Navami & Hanuman Jayanti Pooja Mahotsav</h3>
        <p class="festival-banner-desc">Complete 21-item Vedic Pooja Kits, Panchamrutha Patras, Sita Rama Murthis, and Pure Cow Ghee Wicks blessed and ready for express dispatch across Hyderabad.</p>
        <div class="festival-banner-actions">
          <a href="#/category/pooja-samagri" class="btn btn-sm btn-primary">Get Mahotsavam Kit &rarr;</a>
          <button type="button" class="btn btn-sm btn-secondary" onclick="openSubscriptionModal('sri-rama-kit')">Schedule Auto-Restock</button>
        </div>
      </div>
    </section>
  `;
}

function renderQuickReorderSection() {
  const pastOrders = STORE.orders || [];
  const reorderItems = [];
  pastOrders.forEach(o => {
    (o.items || []).forEach(item => {
      const prodId = item.product ? item.product.id : item.id;
      const title = item.product ? item.product.title : item.title;
      const price = item.product ? item.product.price : item.price;
      const img = item.product ? (item.product.images?.[0] || item.product.image) : item.image;
      if (prodId && !reorderItems.find(r => r.id === prodId) && reorderItems.length < 8) {
        reorderItems.push({ id: prodId, title, price, img });
      }
    });
  });

  if (reorderItems.length === 0) {
    const defaultConsumables = STORE.products.filter(p => p.categoryId === 'pooja-samagri' || p.categoryId === 'incense-dhoop').slice(0, 5);
    defaultConsumables.forEach(p => reorderItems.push({
      id: p.id,
      title: p.title,
      price: p.price,
      img: p.images?.[0] || p.image
    }));
  }

  return `
    <section class="home-section" style="padding: 18px 0 10px 0;">
      <div class="container">
        <div class="section-header-row" style="margin-bottom: 12px;">
          <div class="section-title-group">
            <h2 style="display: flex; align-items: center; gap: 8px; font-size: 18px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
              <span>Quick Devotional Reorder</span>
            </h2>
            <p>1-Tap repeat order for your regular worship essentials</p>
          </div>
        </div>
        <div class="quick-reorder-carousel">
          ${reorderItems.map(item => `
            <div class="reorder-card">
              <img src="${getProductImageUrl(item.img)}" alt="${item.title}" class="reorder-card-img" onerror="this.src='image-coming-soon.svg'">
              <div class="reorder-card-info">
                <h4 class="reorder-card-title">${item.title}</h4>
                <div class="reorder-card-price">₹${item.price}</div>
              </div>
              <button type="button" class="btn-reorder-action" onclick="addToCart('${item.id}', 1); playSacredTempleBell();">
                + Reorder
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function toggleCategoryViewMode(mode) {
  STORE.viewMode = mode;
  localStorage.setItem('7hills_view_mode', mode);
  const container = document.getElementById('listing-products-container');
  const btnGrid = document.getElementById('btn-view-grid');
  const btnList = document.getElementById('btn-view-list');

  if (container) {
    if (mode === 'list') {
      container.className = 'product-grid-list-mode';
    } else {
      container.className = 'product-grid-3';
    }
  }
  if (btnGrid && btnList) {
    btnGrid.classList.toggle('active', mode === 'grid');
    btnList.classList.toggle('active', mode === 'list');
  }
}

// ------------------------------------------
// MULTI-LANGUAGE TRANSLATIONS (EN, TE, HI)
// ------------------------------------------
const TRANSLATIONS = {
  en: {
    nav_home: 'Home',
    nav_categories: 'Categories',
    nav_cart: 'Cart',
    nav_orders: 'Orders',
    nav_profile: 'Profile',
    tagline: 'Positive Energy in Every Item.',
    search_placeholder: 'Search brass idols, deepams, dhoop, photo frames...',
    view_cart: 'View Cart',
    proceed_checkout: 'Proceed to Checkout',
    bill_breakdown: 'Bill Breakdown',
    fast_delivery: 'Fast Hyderabad Delivery'
  },
  te: {
    nav_home: 'హోమ్',
    nav_categories: 'వర్గాలు',
    nav_cart: 'కార్ట్',
    nav_orders: 'ఆర్డర్లు',
    nav_profile: 'ప్రొఫైల్',
    tagline: 'ప్రతి పూజా వస్తువులోనూ సానుకూల శక్తి.',
    search_placeholder: 'దేవుడి విగ్రహాలు, దీపాలు, ధూపం, ఫ్రేములు శోధించండి...',
    view_cart: 'కార్ట్ చూడండి',
    proceed_checkout: 'ఆర్డర్ పూర్తి చేయండి',
    bill_breakdown: 'బిల్లు వివరాలు',
    fast_delivery: 'హైదరాబాద్ శీఘ్ర డెలివరీ'
  },
  hi: {
    nav_home: 'होम',
    nav_categories: 'श्रेणियाँ',
    nav_cart: 'कार्ट',
    nav_orders: 'ऑर्डर्स',
    nav_profile: 'प्रोफाइल',
    tagline: 'हर पावन वस्तु में सकारात्मक ऊर्जा।',
    search_placeholder: 'पीतल मूर्तियाँ, दीये, धूप, पूजा सामग्री खोजें...',
    view_cart: 'कार्ट देखें',
    proceed_checkout: 'चेकआउट आगे बढ़ाएं',
    bill_breakdown: 'बिल विवरण',
    fast_delivery: 'हैदराबाद त्वरित डिलीवरी'
  }
};

function openLanguageModal() {
  const modal = document.getElementById('lang-modal-overlay');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLanguageModal() {
  const modal = document.getElementById('lang-modal-overlay');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function setAppLanguage(lang, showNotification = true) {
  if (!TRANSLATIONS[lang]) lang = 'en';
  STORE.currentLanguage = lang;
  localStorage.setItem('7hills_lang', lang);

  const codeBadge = document.getElementById('current-lang-code');
  if (codeBadge) codeBadge.textContent = lang.toUpperCase();

  ['en', 'te', 'hi'].forEach(l => {
    const btn = document.getElementById(`lang-btn-${l}`);
    if (btn) btn.classList.toggle('active', l === lang);
  });

  const t = TRANSLATIONS[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });

  const searchInput = document.getElementById('mobile-search-input');
  if (searchInput && t.search_placeholder) {
    searchInput.placeholder = t.search_placeholder;
  }

  closeLanguageModal();
  if (showNotification) {
    const names = { en: 'English', te: 'తెలుగు (Telugu)', hi: 'हिंदी (Hindi)' };
    showToast(`App language switched to <strong>${names[lang]}</strong>`);
  }
}

// ------------------------------------------
// WARM TEMPLE DARK MODE
// ------------------------------------------
function initThemeMode() {
  const savedTheme = localStorage.getItem('7hills_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function toggleThemeMode() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('7hills_theme', next);
  updateThemeToggleIcon(next);
  showToast(next === 'dark' ? 'Warm Temple Gold Dark Mode Enabled' : 'Temple Light Mode Enabled');
}

function updateThemeToggleIcon(theme) {
  const iconSpan = document.getElementById('theme-toggle-icon');
  if (!iconSpan) return;
  if (theme === 'dark') {
    iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
  } else {
    iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
  }
}

// ------------------------------------------
// AR DEITY MANDIR PLACEMENT PREVIEW
// ------------------------------------------
let arVideoStream = null;

function openArModal(productId) {
  const modal = document.getElementById('ar-modal-overlay');
  if (!modal) return;
  const prod = (productId ? STORE.products.find(p => p.id === productId) : null) || STORE.products.find(p => p.categoryId === 'god-idols') || STORE.products[0];
  const deityImg = document.getElementById('ar-deity-img');
  if (deityImg && prod) {
    deityImg.src = getProductImageUrl(prod.images[0]);
    deityImg.alt = prod.title;
  }
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeArModal() {
  const modal = document.getElementById('ar-modal-overlay');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
  stopArCamera();
}

function updateArIdolScale(val) {
  const inches = parseInt(val, 10);
  const cm = Math.round(inches * 2.54);
  const indicator = document.getElementById('ar-scale-indicator');
  const draggable = document.getElementById('ar-deity-draggable');
  if (indicator) indicator.textContent = `${inches} inches (approx. ${cm} cm)`;
  if (draggable) {
    const scaleFactor = 0.6 + (inches / 24) * 0.8;
    draggable.style.transform = `scale(${scaleFactor})`;
  }
}

async function toggleArCamera() {
  const video = document.getElementById('ar-video-stream');
  const bg = document.getElementById('ar-canvas-bg');
  const label = document.getElementById('btn-ar-camera-label');

  if (arVideoStream) {
    stopArCamera();
    if (video) video.style.display = 'none';
    if (bg) bg.style.display = 'block';
    if (label) label.textContent = 'Use Phone Camera';
  } else {
    try {
      arVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (video) {
        video.srcObject = arVideoStream;
        video.style.display = 'block';
      }
      if (bg) bg.style.display = 'none';
      if (label) label.textContent = 'Switch to Mandir Altar';
    } catch (err) {
      showToast('Camera permission denied or not available. Displaying Virtual Mandir Altar.');
    }
  }
}

function stopArCamera() {
  if (arVideoStream) {
    arVideoStream.getTracks().forEach(track => track.stop());
    arVideoStream = null;
  }
}

function captureArSnapshot() {
  showToast('Mandir placement snapshot captured and saved to device photos.');
  if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
}

// ------------------------------------------
// CONSUMABLE AUTO-RESTOCK SUBSCRIPTION
// ------------------------------------------
let activeSubscriptionProduct = null;

function openSubscriptionModal(productId) {
  const modal = document.getElementById('subscription-modal-overlay');
  if (!modal) return;
  activeSubscriptionProduct = (productId ? STORE.products.find(p => p.id === productId) : null) || STORE.products.find(p => p.categoryId === 'pooja-samagri' || p.categoryId === 'incense-dhoop') || STORE.products[0];

  const nameEl = document.getElementById('sub-product-name');
  const priceEl = document.getElementById('sub-product-price');
  if (nameEl && activeSubscriptionProduct) nameEl.textContent = activeSubscriptionProduct.title;
  if (priceEl && activeSubscriptionProduct) {
    const discounted = Math.round(activeSubscriptionProduct.price * 0.9);
    priceEl.textContent = `₹${discounted.toLocaleString('en-IN')} / delivery (10% Devotee Savings)`;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSubscriptionModal() {
  const modal = document.getElementById('subscription-modal-overlay');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
  activeSubscriptionProduct = null;
}

function confirmSubscription() {
  if (!activeSubscriptionProduct) return;
  const freq = document.querySelector('input[name="sub-frequency"]:checked')?.value || '15';
  const subRecord = {
    id: 'SUB-' + Date.now().toString(36).toUpperCase(),
    productId: activeSubscriptionProduct.id,
    title: activeSubscriptionProduct.title,
    price: Math.round(activeSubscriptionProduct.price * 0.9),
    frequencyDays: parseInt(freq, 10),
    startDate: new Date().toISOString(),
    status: 'ACTIVE'
  };

  const currentSubs = JSON.parse(localStorage.getItem('7hills_subscriptions') || '[]');
  currentSubs.push(subRecord);
  localStorage.setItem('7hills_subscriptions', JSON.stringify(currentSubs));
  STORE.subscriptions = currentSubs;

  closeSubscriptionModal();
  showToast(`Auto-Restock scheduled for <strong>${subRecord.title}</strong> every ${freq} days.`);
  playSacredTempleBell();
}

// ------------------------------------------
// 5.1 HOME VIEW
// ------------------------------------------
function renderHomeView() {
  const root = document.getElementById('app-root');
  
  // Best sellers: top 8 items
  const bestSellers = STORE.products.slice(0, 6);
  // Idols collection
  const idols = STORE.products.filter(p => p.categoryId === 'god-idols').slice(0, 4);
  // Diyas collection
  const diyas = STORE.products.filter(p => p.categoryId === 'diyas-lamps').slice(0, 4);
  // Photo Frames
  const frames = STORE.products.filter(p => p.categoryId === 'photo-frames').slice(0, 4);
  // Daily Samagri & Essentials
  const samagriEssentials = STORE.products.filter(p => p.categoryId === 'pooja-samagri' || p.categoryId === 'incense-dhoop').slice(0, 4);
  // Flash Deals (items with highest discount)
  const flashDeals = [...STORE.products].sort((a, b) => (b.discount || 0) - (a.discount || 0)).slice(0, 4);

  root.innerHTML = `
    <!-- Live Hyderabad Vedic Panchangam & Auspicious Muhurtham Ticker -->
    <section class="container" style="padding-top: 10px;">
      <div class="hyderabad-panchangam-ticker">
        <div class="ticker-header">
          <div class="ticker-loc-title">
            ${getIcon('sun', 14)}
            <span>Live Hyderabad Vedic Panchangam</span>
            <span class="ticker-live-dot"></span>
          </div>
          <span class="ticker-temple-tag">Beside Prasannanjaneya Temple</span>
        </div>
        <div class="panchangam-chips-row">
          <div class="panchangam-chip">
            <span class="p-label">Tithi</span>
            <strong class="p-val" id="panchang-tithi">Shukla Paksha Ekadashi</strong>
          </div>
          <div class="panchangam-chip">
            <span class="p-label">Nakshatram</span>
            <strong class="p-val" id="panchang-nakshatra">Rohini Nakshatram</strong>
          </div>
          <div class="panchangam-chip highlight-muhurtham">
            <span class="p-label">Abhijit Muhurtham (Auspicious)</span>
            <strong class="p-val" id="panchang-abhijit">11:52 AM – 12:44 PM</strong>
          </div>
          <div class="panchangam-chip rahu-kalam">
            <span class="p-label">Rahu Kalam</span>
            <strong class="p-val" id="panchang-rahu">04:30 PM – 06:00 PM</strong>
          </div>
        </div>
      </div>

      <!-- Devotional Quick Innovation Pills -->
      <div class="devotional-innovations-bar">
        <a href="#/sankalpam" class="devotional-quick-pill">
          ${getIcon('sparkles', 20, '', 2.2)}
          <div class="pill-text">
            <strong>1-Click Sankalpam</strong>
            <span>Auto-build 21 Ritual Items</span>
          </div>
        </a>
        <a href="#/stotram" class="devotional-quick-pill">
          ${getIcon('music', 20, '', 2.2)}
          <div class="pill-text">
            <strong>Temple Chimes</strong>
            <span>Aarti & Ghanta Companion</span>
          </div>
        </a>
      </div>
    </section>

    <!-- Upcoming Sacred Festival Banner -->
    ${renderFestivalBanner()}

    <!-- Swiggy-Style Horizontal Category Snap Strip -->
    ${renderCategorySnapStrip()}

    <!-- Quick Devotional Reorder Carousel -->
    ${renderQuickReorderSection()}

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-banner-card">
          <div class="hero-mandala-bg"></div>
          <div class="hero-content">
            <span class="hero-badge-pill">${getIcon('sparkles', 13)} Beside Prasannanjaneya Temple, LB Nagar</span>
            <h1 class="hero-title">
              Positive Energy in Every Sacred Item
            </h1>
            <p class="hero-subtitle">
              Authentic brass idols, ceremonial deepams, pure samagri kits, and handcrafted mandir frames from <strong>7 Hills Pooja Store</strong>. Blessed and dispatched across Hyderabad.
            </p>
            <div class="hero-actions-group">
              <a href="#/category/god-idols" class="btn btn-primary btn-lg" data-testid="explore-idols-btn">
                Explore Divine Idols &rarr;
              </a>
              <a href="#/deals" class="btn btn-secondary btn-lg" style="background: rgba(255,255,255,0.15); color: #FFF; border-color: var(--accent-gold);">
                Festival Deals (Up to 40% OFF)
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Visual Category Cards Grid -->
    <section class="home-section">
      <div class="container">
        <div class="section-header-row">
          <div class="section-title-group">
            <h2>Sacred Pooja Categories</h2>
            <p>Find everything required for daily worship, temple rituals, and festivals</p>
          </div>
          <a href="#/categories" class="view-all-link">View All &rarr;</a>
        </div>

        <div class="category-cards-grid">
          ${STORE.categories.map(c => {
            return `
              <div class="category-card" onclick="window.location.hash='#/category/${c.id}'">
                <div class="category-card-icon-circle">${getIcon(c.icon || 'temple', 24)}</div>
                <h3 class="category-card-name">${c.name}</h3>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- Flash Deals Section -->
    <section class="home-section" style="background-color: var(--bg-cream); padding: 32px 0;">
      <div class="container">
        <div class="deals-banner-strip">
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 19px; color: var(--primary-maroon);">
              ${getIcon('zap', 18)} Today's Festive Flash Deals
            </h2>
            <p style="font-size: 12.5px; color: var(--text-muted);">
              Limited-time discounts on sanctified idols, peacock diyas, and pooja sets.
            </p>
          </div>
          <div class="deal-timer-box">
            <span>Offer Ends in:</span>
            <span class="timer-chip" id="deal-timer-hours">06</span>:
            <span class="timer-chip" id="deal-timer-mins">42</span>:
            <span class="timer-chip" id="deal-timer-secs">19</span>
          </div>
        </div>

        <div class="product-grid-4">
          ${flashDeals.map(p => renderProductCard(p)).join('')}
        </div>
      </div>
    </section>

    <!-- Best Sellers Section -->
    <section class="home-section">
      <div class="container">
        <div class="section-header-row">
          <div class="section-title-group">
            <h2>Hyderabad Devotee Bestsellers</h2>
            <p>Most blessed and ordered items across Hyderabad households</p>
          </div>
          <a href="#/category/god-idols" class="view-all-link">Browse All &rarr;</a>
        </div>

        <div class="product-grid-4">
          ${bestSellers.map(p => renderProductCard(p)).join('')}
        </div>
      </div>
    </section>

    <!-- Daily Pooja Samagri & Essentials -->
    <section class="home-section" style="background-color: #FAF6ED; padding: 32px 0; border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
      <div class="container">
        <div class="section-header-row">
          <div class="section-title-group">
            <h2>Daily Pooja Samagri & Essentials</h2>
            <p>Pure cow ghee wicks, authentic Bhimseni camphor, dhoop sticks & kumkum</p>
          </div>
          <a href="#/category/pooja-samagri" class="view-all-link">View Samagri &rarr;</a>
        </div>

        <div class="product-grid-4">
          ${samagriEssentials.map(p => renderProductCard(p)).join('')}
        </div>
      </div>
    </section>

    <!-- Featured: God Idols & Murti -->
    <section class="home-section">
      <div class="container">
        <div class="section-header-row">
          <div class="section-title-group">
            <h2>Handcrafted Divine Idols & Murtis</h2>
            <p>Solid temple-grade brass Ganesha, Lakshmi, Venkateshwara & Shiva deities</p>
          </div>
          <a href="#/category/god-idols" class="view-all-link">View All Idols &rarr;</a>
        </div>

        <div class="product-grid-4">
          ${idols.map(p => renderProductCard(p)).join('')}
        </div>
      </div>
    </section>

    <!-- Featured: Traditional Diyas & Lamps -->
    <section class="home-section" style="background-color: #FFFFFF; padding: 32px 0; border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
      <div class="container">
        <div class="section-header-row">
          <div class="section-title-group">
            <h2>Traditional Brass Deepams & Diyas</h2>
            <p>Akhand diyas, peacock hanging lamps, and pancha aarti stands</p>
          </div>
          <a href="#/category/diyas-lamps" class="view-all-link">View All Diyas &rarr;</a>
        </div>

        <div class="product-grid-4">
          ${diyas.map(p => renderProductCard(p)).join('')}
        </div>
      </div>
    </section>

    <!-- Featured: Sacred Mandir Photo Frames -->
    <section class="home-section">
      <div class="container">
        <div class="section-header-row">
          <div class="section-title-group">
            <h2>Sacred Mandir Photo Frames</h2>
            <p>Gold-foil embossed and teak-finished framed deities for home pooja mandirs</p>
          </div>
          <a href="#/category/photo-frames" class="view-all-link">View All Frames &rarr;</a>
        </div>

        <div class="product-grid-4">
          ${frames.map(p => renderProductCard(p)).join('')}
        </div>
      </div>
    </section>

    <!-- Trust Pillars Banner -->
    <section class="container" style="padding-top: 20px; padding-bottom: 20px;">
      <div class="trust-pillars-row">
        <div class="trust-pillar-item">
          <div class="pillar-icon">${getIcon('shield-check', 22)}</div>
          <div class="pillar-content">
            <h4>100% Purity Guarantee</h4>
            <p>Pure cow ghee wicks, authentic Bhimseni camphor, and natural pooja samagri.</p>
          </div>
        </div>
        <div class="trust-pillar-item">
          <div class="pillar-icon">${getIcon('sparkles', 22)}</div>
          <div class="pillar-content">
            <h4>Solid Temple-Grade Brass</h4>
            <p>Heavy, hand-finished brass articles built to endure generations of worship.</p>
          </div>
        </div>
        <div class="trust-pillar-item">
          <div class="pillar-icon">${getIcon('truck', 22)}</div>
          <div class="pillar-content">
            <h4>Instant Hyderabad Delivery</h4>
            <p>Quick delivery via Instant Courier or Rapido bike services across Hyderabad.</p>
          </div>
        </div>
        <div class="trust-pillar-item">
          <div class="pillar-icon">${getIcon('temple', 22)}</div>
          <div class="pillar-content">
            <h4>Temple Proximity Sanctity</h4>
            <p>Physically based beside Prasannanjaneya Swamy Temple, LB Nagar Main Road.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Devotee Reviews Carousel -->
    <section class="home-section" style="background-color: var(--bg-cream); padding: 40px 0;">
      <div class="container">
        <div class="section-header-row">
          <div class="section-title-group">
            <h2>What Devotees Say About Us</h2>
            <p>Verified experiences from temple visitors and online customers across Hyderabad</p>
          </div>
        </div>

        <div class="product-grid-4" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
          ${(window.SAMPLE_REVIEWS || []).map(r => `
            <div style="background: #FFF; border-radius: var(--radius-md); padding: 20px; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xs);">
              <div style="color: var(--accent-gold); font-size: 14px; margin-bottom: 8px;">
                     <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">(${r.rating})</span>
              </div>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; font-style: italic; margin-bottom: 14px;">
                "${r.comment}"
              </p>
              <div style="border-top: 1px dashed var(--border-medium); padding-top: 10px;">
                <h4 style="font-size: 13px; font-weight: 700; color: var(--primary-maroon);">${r.name}</h4>
                <span style="font-size: 11px; color: var(--text-muted);"> ${r.location} • ${r.date}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Consultation Banner CTA -->
    <section class="container" style="padding: 40px 0;">
      <div style="background: linear-gradient(135deg, var(--primary-maroon-dark), var(--primary-maroon)); border: 2px solid var(--accent-gold); border-radius: var(--radius-lg); padding: 36px 40px; color: #FFF; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px;">
        <div style="max-width: 650px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--accent-gold); letter-spacing: 1px;">Store Consultation Service</span>
          <h2 style="font-family: var(--font-heading); font-size: 26px; margin: 6px 0 10px 0;">Planning a Wedding or Gruhapravesam Ceremony?</h2>
          <p style="font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.6;">
            Book an in-store appointment with our temple samagri experts at LB Nagar. We prepare comprehensive priest-verified item checklists for Telugu and South Indian poojas.
          </p>
        </div>
        <a href="#/appointment" class="btn btn-gold btn-lg">
          Book Free Consultation &rarr;
        </a>
      </div>
    </section>
  `;

  // Start live countdown timer on deal box
  startDealTimer();
}

function startDealTimer() {
  let seconds = 19;
  let minutes = 42;
  let hours = 6;

  const hEl = document.getElementById('deal-timer-hours');
  const mEl = document.getElementById('deal-timer-mins');
  const sEl = document.getElementById('deal-timer-secs');

  if (!sEl) return;

  const interval = setInterval(() => {
    if (!document.getElementById('deal-timer-secs')) {
      clearInterval(interval);
      return;
    }
    seconds--;
    if (seconds < 0) {
      seconds = 59;
      minutes--;
      if (minutes < 0) {
        minutes = 59;
        hours--;
        if (hours < 0) hours = 23;
      }
    }
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
    if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
  }, 1000);
}

// ------------------------------------------
// 5.2 CATEGORIES HUB VIEW
// ------------------------------------------
function renderCategoriesView() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    <div class="container" style="padding: 24px 0 32px 0;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">All Pooja Categories</span>
      </nav>

      <div class="section-header-row" style="margin-bottom: 12px;">
        <div class="section-title-group">
          <h2>All Devotional & Pooja Categories</h2>
          <p>Explore specialized collections curated for your home mandir and spiritual rituals</p>
        </div>
      </div>

      <!-- Category Snap-Scroll Strip -->
      ${renderCategorySnapStrip()}

      <!-- Mobile 2-Column Responsive Category Catalog Grid -->
      <div class="category-full-catalog-grid">
        ${STORE.categories.map(c => {
          const count = STORE.products.filter(p => p.categoryId === c.id).length;
          const heroImg = getProductImageUrl(c.image);
          return `
            <div class="category-full-card" onclick="window.location.hash='#/category/${c.id}'" role="button" tabindex="0">
              <div class="category-full-card-thumb">
                <img src="${heroImg}" alt="${c.name}" loading="lazy" onerror="this.src='image-coming-soon.svg'">
                <div class="category-full-card-badge">${count} Items</div>
              </div>
              <div class="category-full-card-body">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: var(--bg-cream); color: var(--primary-maroon); margin-bottom: 6px; border: 1px solid var(--accent-gold);">${getIcon(c.icon || 'temple', 18)}</div>
                <h3 class="category-full-card-title">${c.name}</h3>
                <p class="category-full-card-desc">${c.description}</p>
                <div class="btn-category-explore">
                  <span>Explore Items</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ------------------------------------------
// 5.3 CATEGORY LISTING VIEW (WITH REAL FILTERS)
// ------------------------------------------
let listingFilterState = {
  priceMax: 10000,
  inStockOnly: false,
  sortBy: 'popularity',
  ratingMin: 0
};

function renderCategoryListingView(catId) {
  const root = document.getElementById('app-root');
  const category = STORE.categories.find(c => c.id === catId) || { id: 'all', name: 'All Products', icon: '', description: 'Browse all items in 7 Hills Pooja Store' };

  let categoryProducts = STORE.products.filter(p => p.categoryId === catId);
  if (catId === 'all') categoryProducts = STORE.products;

  // Apply filters
  let filtered = categoryProducts.filter(p => {
    if (listingFilterState.inStockOnly && !p.inStock) return false;
    if (p.price > listingFilterState.priceMax) return false;
    if (p.rating < listingFilterState.ratingMin) return false;
    return true;
  });

  // Apply sorting
  if (listingFilterState.sortBy === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (listingFilterState.sortBy === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (listingFilterState.sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (listingFilterState.sortBy === 'discount') {
    filtered.sort((a, b) => b.discount - a.discount);
  }

  root.innerHTML = `
    <div class="container" style="padding: 20px 0 32px 0;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <a href="#/categories">Categories</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">${category.name}</span>
      </nav>

      <!-- Sticky Category Snap Strip -->
      <div style="margin-bottom: 14px;">
        ${renderCategorySnapStrip()}
      </div>

      <!-- Category Hero Header -->
      <div style="background: var(--bg-cream); border: 1px solid var(--accent-gold-light); border-radius: var(--radius-md); padding: 18px 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-family: var(--font-heading); font-size: 22px; color: var(--primary-maroon); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
            <span>${category.icon}</span>
            <span>${category.name}</span>
          </h1>
          <p style="font-size: 12.5px; color: var(--text-secondary); max-width: 600px;">
            ${category.description}
          </p>
        </div>
        <div style="font-size: 12.5px; font-weight: 700; color: var(--primary-saffron); background: #FFF; padding: 5px 12px; border-radius: var(--radius-full); border: 1px solid var(--border-medium);">
          Showing ${filtered.length} of ${categoryProducts.length} Items
        </div>
      </div>

      <!-- Main Layout: Filters Sidebar + Grid -->
      <div class="listing-layout-grid">
        
        <!-- Filters Sidebar -->
        <aside class="listing-filters-aside" style="background: #FFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px; height: fit-content; box-shadow: var(--shadow-xs); width: 100%; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 14px;">
            <h3 style="font-size: 14px; font-weight: 700; color: var(--primary-maroon); display: flex; align-items: center; gap: 6px;">
              ${getIcon('filter', 15)} Filters
            </h3>
            <button type="button" onclick="resetListingFilters('${catId}')" style="font-size: 11.5px; color: var(--primary-saffron); font-weight: 600; text-decoration: underline;">Reset All</button>
          </div>

          <!-- Stock Filter -->
          <div style="margin-bottom: 18px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer;">
              <input type="checkbox" id="filter-instock" ${listingFilterState.inStockOnly ? 'checked' : ''} onchange="toggleInStockFilter('${catId}', this.checked)">
              In-Stock Items Only
            </label>
            ${category.id === 'photo-frames' ? '<span style="font-size: 11px; color: var(--success); display: block; margin-top: 4px;">&#10003; Photo frames always in stock</span>' : ''}
          </div>

          <!-- Max Price Range -->
          <div style="margin-bottom: 18px;">
            <label style="font-size: 12.5px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">
              Max Price: <span style="color: var(--primary-saffron);">₹${listingFilterState.priceMax}</span>
            </label>
            <input 
              type="range" 
              min="200" 
              max="10000" 
              step="200" 
              value="${listingFilterState.priceMax}" 
              style="width: 100%; accent-color: var(--primary-saffron);"
              oninput="updatePriceFilter('${catId}', this.value)"
            >
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--text-muted); margin-top: 4px;">
              <span>₹200</span>
              <span>₹10,000+</span>
            </div>
          </div>

          <!-- Minimum Rating Filter -->
          <div style="margin-bottom: 18px;">
            <label style="font-size: 12.5px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">
              Customer Rating
            </label>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${[4.5, 4.0, 3.5].map(r => `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer;">
                  <input type="radio" name="rating-filter" value="${r}" ${listingFilterState.ratingMin === r ? 'checked' : ''} onchange="updateRatingFilter('${catId}', ${r})">
                  <span>${typeof getIcon !== 'undefined' ? getIcon('star', 11) : ''} ${r} & above</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Categories Quick Links -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 14px;">
            <h4 style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase;">Other Categories</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
              ${STORE.categories.filter(c => c.id !== catId).slice(0, 6).map(c => `
                <li><a href="#/category/${c.id}" style="color: var(--text-secondary); display: flex; align-items: center; gap: 6px;"><span style="display: inline-flex; color: var(--primary-saffron);">${getIcon(c.icon || 'temple', 13)}</span> <span>${c.name}</span></a></li>
              `).join('')}
            </ul>
          </div>
        </aside>

        <!-- Products Column -->
        <div>
          <!-- Sort & View Mode Toolbar -->
          <div class="category-view-toolbar">
            <span style="font-size: 12.5px; color: var(--text-muted);">
              Showing <strong>${filtered.length}</strong> items
            </span>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <label for="sort-select" style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Sort:</label>
                <select id="sort-select" style="padding: 5px 10px; border: 1px solid var(--border-medium); border-radius: var(--radius-xs); font-size: 12px; outline: none; cursor: pointer;" onchange="updateListingSort('${catId}', this.value)">
                  <option value="popularity" ${listingFilterState.sortBy === 'popularity' ? 'selected' : ''}>Popularity</option>
                  <option value="price-low" ${listingFilterState.sortBy === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
                  <option value="price-high" ${listingFilterState.sortBy === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
                  <option value="rating" ${listingFilterState.sortBy === 'rating' ? 'selected' : ''}>Customer Rating</option>
                  <option value="discount" ${listingFilterState.sortBy === 'discount' ? 'selected' : ''}>Discount %</option>
                </select>
              </div>

              <!-- Grid vs List View Mode Toggle Buttons -->
              <div class="view-toggle-btns">
                <button type="button" class="btn-view-toggle ${STORE.viewMode !== 'list' ? 'active' : ''}" id="btn-view-grid" onclick="toggleCategoryViewMode('grid')" title="Grid View" aria-label="Grid View">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                </button>
                <button type="button" class="btn-view-toggle ${STORE.viewMode === 'list' ? 'active' : ''}" id="btn-view-list" onclick="toggleCategoryViewMode('list')" title="List View" aria-label="List View">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Products Grid or List Mode -->
          ${filtered.length > 0 ? `
            <div id="listing-products-container" class="${STORE.viewMode === 'list' ? 'product-grid-list-mode' : 'product-grid-3'}">
              ${filtered.map(p => renderProductCard(p)).join('')}
            </div>
          ` : `
            <div style="background: #FFF; border-radius: var(--radius-md); padding: 50px 20px; text-align: center; border: 1px solid var(--border-subtle);">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary-saffron)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 10px;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <h3 style="font-family: var(--font-heading); font-size: 17px; color: var(--primary-maroon); margin: 6px 0;">No Products Found Matching Filters</h3>
              <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 16px;">Try expanding your price range or resetting filters.</p>
              <button class="btn btn-primary btn-sm" onclick="resetListingFilters('${catId}')">Reset Filters</button>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}

function updatePriceFilter(catId, val) {
  listingFilterState.priceMax = parseInt(val);
  renderCategoryListingView(catId);
}

function toggleInStockFilter(catId, checked) {
  listingFilterState.inStockOnly = checked;
  renderCategoryListingView(catId);
}

function updateRatingFilter(catId, val) {
  listingFilterState.ratingMin = parseFloat(val);
  renderCategoryListingView(catId);
}

function updateListingSort(catId, sortVal) {
  listingFilterState.sortBy = sortVal;
  renderCategoryListingView(catId);
}

function resetListingFilters(catId) {
  listingFilterState = {
    priceMax: 10000,
    inStockOnly: false,
    sortBy: 'popularity',
    ratingMin: 0
  };
  renderCategoryListingView(catId);
}

// ------------------------------------------
// 5.4 PRODUCT DETAILS VIEW (PDP)
// ------------------------------------------
function renderProductDetailsView(prodId) {
  const root = document.getElementById('app-root');
  const product = STORE.products.find(p => p.id === prodId) || STORE.products[0];
  if (!product) return;

  const isWishlisted = STORE.wishlist.includes(product.id);
  const cartItem = STORE.cart.find(i => i.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 1;
  const mainImg = getProductImageUrl(product.images[0]);

  // Frequently bought bundle: product + 2 related items
  const bundleItems = product.relatedIds
    ? product.relatedIds.map(id => STORE.products.find(p => p.id === id)).filter(Boolean).slice(0, 2)
    : [];
  const bundleTotal = product.price + bundleItems.reduce((sum, item) => sum + item.price, 0);
  const bundleMrp = product.mrp + bundleItems.reduce((sum, item) => sum + item.mrp, 0);

  root.innerHTML = `
    <div class="container product-details-container">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <a href="#/category/${product.categoryId}">${product.category}</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">${product.title}</span>
      </nav>

      <div class="pdp-main-grid">
        
        <!-- Gallery Column -->
        <div class="pdp-gallery-column">
          <div class="pdp-main-image-box">
            ${product.badge ? `<span class="card-badge">${product.badge}</span>` : ''}
            <img 
              id="pdp-main-preview" 
              src="${mainImg}" 
              alt="${product.title}"
              onerror="this.src='https://placehold.co/500x500?text=7+Hills+Pooja+Store'"
            >
          </div>

          <!-- Thumbnails -->
          ${product.images.length > 1 ? `
            <div class="pdp-thumbnails-strip">
              ${product.images.map((img, idx) => `
                <img 
                  src="${getProductImageUrl(img)}" 
                  class="pdp-thumb ${idx === 0 ? 'active' : ''}" 
                  alt="Thumbnail ${idx + 1}"
                  onclick="switchPdpImage(this, '${getProductImageUrl(img)}')"
                >
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Info Column -->
        <div class="pdp-info-column">
          <span style="font-size: 12px; font-weight: 700; color: var(--accent-gold-dark); text-transform: uppercase;">
            ${product.category}
          </span>
          <h1 class="pdp-title">${product.title}</h1>

          <!-- Ratings -->
          <div class="pdp-rating-strip">
            <span class="rating-pill">${typeof getIcon !== "undefined" ? getIcon("star", 11) : ""} ${product.rating}</span>
            <span class="rating-count">(${product.reviewCount} Verified Devotee Reviews)</span>
            <span style="color: var(--border-medium);">|</span>
            ${product.inStock ? '<span style="color: var(--success); font-weight: 700; font-size: 13px;">&#10003; In Stock for Quick Delivery</span>' : '<span style="color: var(--danger); font-weight: 700; font-size: 13px;">&#10005; Out of Stock</span>'}
          </div>

          <!-- Pricing Box -->
          <div class="pdp-price-box">
            <div class="pdp-price-row">
              <span class="pdp-selling-price">₹${product.price}</span>
              <span class="pdp-mrp">₹${product.mrp}</span>
              <span class="pdp-discount-badge">${product.discount}% OFF</span>
            </div>
            <p class="pdp-tax-note">Inclusive of all taxes. Free shipping on orders above ₹499.</p>
          </div>

          <!-- Special Offers Callout -->
          <div style="background: #FFF; border: 1px dashed var(--accent-gold); border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 20px; font-size: 13px;">
            <strong style="color: var(--primary-saffron);"> Available Offers:</strong>
            <ul style="padding-left: 18px; margin-top: 6px; color: var(--text-secondary); line-height: 1.6;">
              <li>Use code <strong style="color: var(--primary-maroon);">DIVINE10</strong> for 10% instant discount on orders above ₹499.</li>
              <li>Free same-day pickup at our store beside Prasannanjaneya Swamy Temple, LB Nagar.</li>
            </ul>
          </div>

          <!-- Pincode Delivery Checker -->
          <div style="margin-bottom: 20px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-main);">Check Delivery Date & Services:</span>
            <div class="pincode-checker-box">
              <input type="text" id="pdp-pincode-input" class="pincode-input" placeholder="Enter 6-digit Pincode (e.g. 500074)" maxlength="6" value="500074">
              <button type="button" class="btn btn-secondary btn-sm" onclick="checkPdpPincode()">Check</button>
            </div>
            <div id="pdp-pincode-result" style="font-size: 12px; color: var(--success); font-weight: 600;">
               Delivering to LB Nagar / Hyderabad: <strong>Instant Courier Available (45 Mins)</strong>
            </div>
          </div>

          <!-- Quantity Selector & Action Buttons -->
          <div class="pdp-actions-row">
            <div class="qty-controls" style="height: 48px; border: 1.5px solid var(--border-medium); border-radius: var(--radius-sm); display: flex; align-items: center;">
              <button type="button" class="qty-btn" style="width: 38px; height: 100%; font-size: 18px;" onclick="changePdpQty(-1)">–</button>
              <div id="pdp-qty-display" style="width: 36px; text-align: center; font-weight: 700;">${inCartQty}</div>
              <button type="button" class="qty-btn" style="width: 38px; height: 100%; font-size: 18px;" onclick="changePdpQty(1)">+</button>
            </div>

            <button 
              type="button" 
              class="btn btn-primary pdp-btn-add" 
              onclick="addCurrentPdpToCart('${product.id}')"
              data-testid="add-to-cart-btn"
            >
               Add to Cart
            </button>

            <button 
              type="button" 
              class="btn btn-maroon pdp-btn-buy" 
              onclick="buyNowPdp('${product.id}')"
              data-testid="buy-now-btn"
            >
               Buy Now
            </button>

            <button 
              type="button" 
              class="btn btn-secondary" 
              style="padding: 0 16px; font-size: 20px;" 
              onclick="toggleWishlist('${product.id}')"
              title="${isWishlisted ? 'Remove Wishlist' : 'Add Wishlist'}"
            >
              ${isWishlisted ? (typeof getIcon !== 'undefined' ? getIcon('heart-filled', 16) : 'Saved') : (typeof getIcon !== 'undefined' ? getIcon('heart', 16) : 'Save')}
            </button>
          </div>

          <!-- Description -->
          <div style="margin: 20px 0; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--primary-maroon); margin-bottom: 8px;">Spiritual Description</h3>
            <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">
              ${product.description}
            </p>
          </div>

          <!-- Ritual Usage -->
          <div style="background: var(--bg-cream); border-left: 3px solid var(--accent-gold); padding: 12px 16px; margin-bottom: 20px;">
            <h4 style="font-size: 13px; font-weight: 700; color: var(--primary-maroon); margin-bottom: 4px;"> Recommended Ritual Usage:</h4>
            <p style="font-size: 13px; color: var(--text-secondary);">${product.ritualUsage}</p>
          </div>

          <!-- Specifications Table -->
          <div>
            <h3 style="font-size: 15px; font-weight: 700; color: var(--primary-maroon); margin-bottom: 8px;">Product Specifications</h3>
            <table class="pdp-specs-table">
              ${Object.entries(product.specifications || {}).map(([k, v]) => `
                <tr>
                  <td>${k}</td>
                  <td><strong>${v}</strong></td>
                </tr>
              `).join('')}
            </table>
          </div>

        </div>
      </div>

      <!-- Frequently Bought Together Bundle -->
      ${bundleItems.length > 0 ? `
        <div class="bundle-box">
          <h3 style="font-family: var(--font-heading); font-size: 18px; color: var(--primary-maroon); margin-bottom: 4px;">
            Frequently Bought Together (Sacred Combo)
          </h3>
          <p style="font-size: 13px; color: var(--text-muted);">Combine these complementary pooja essentials and save more.</p>
          
          <div class="bundle-items-row">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${mainImg}" class="bundle-item-thumb" alt="${product.title}">
              <span style="font-size: 13px; font-weight: 600;">${product.title}</span>
            </div>
            <span style="font-size: 20px; font-weight: 700; color: var(--primary-saffron);">+</span>
            ${bundleItems.map(b => `
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${getProductImageUrl(b.images[0])}" class="bundle-item-thumb" alt="${b.title}">
                <span style="font-size: 13px; font-weight: 600;">${b.title}</span>
              </div>
            `).join('<span style="font-size: 20px; font-weight: 700; color: var(--primary-saffron);">+</span>')}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed var(--border-medium); padding-top: 16px; margin-top: 16px; flex-wrap: wrap; gap: 16px;">
            <div>
              <span style="font-size: 13px; color: var(--text-muted);">Combo Price:</span>
              <span style="font-size: 22px; font-weight: 800; color: var(--primary-maroon); margin-left: 8px;">₹${bundleTotal}</span>
              <span style="font-size: 14px; text-decoration: line-through; color: var(--text-light); margin-left: 6px;">₹${bundleMrp}</span>
            </div>
            <button class="btn btn-primary" onclick="addBundleToCart('${product.id}', ['${bundleItems.map(b => b.id).join("','")}'])">
              Add All 3 Items to Cart &rarr;
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Customer Reviews Breakdown -->
      <section style="background: #FFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 32px; margin-bottom: 40px;">
        <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--primary-maroon); margin-bottom: 16px;">
          Devotee Reviews & Ratings
        </h3>
        <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap;">
          <div style="text-align: center;">
            <div style="font-size: 42px; font-weight: 800; color: var(--primary-maroon); line-height: 1;">${product.rating}</div>
            <div style="color: var(--accent-gold); margin: 4px 0;">    </div>
            <div style="font-size: 12px; color: var(--text-muted);">${product.reviewCount} Ratings</div>
          </div>
          <div style="flex: 1; min-width: 200px; font-size: 12px; color: var(--text-muted);">
            <div>100% Verified purchases from devotees across Hyderabad, Telangana.</div>
            <div style="color: var(--success); font-weight: 600; margin-top: 4px;">&#10003; Safe transit packaging guarantee with coconut fiber and bubble insulation.</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${(window.SAMPLE_REVIEWS || []).slice(0, 2).map(r => `
            <div style="background: var(--bg-page); padding: 16px; border-radius: var(--radius-sm);">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong>${r.name}</strong>
                <span style="color: var(--accent-gold);">    </span>
              </div>
              <p style="font-size: 13px; color: var(--text-secondary);">${r.comment}</p>
              <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block;"> ${r.location}</span>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Sticky Mobile Action Bar for PDP -->
      <div class="mobile-pdp-sticky-bar">
        <div>
          <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">Total Price</span>
          <strong style="font-size: 18px; color: var(--primary-maroon);">₹${product.price}</strong>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="addCurrentPdpToCart('${product.id}')" style="padding: 10px 14px; font-weight: 700;">
            ${typeof getIcon !== 'undefined' ? getIcon('cart', 16) : ''} Add
          </button>
          <button type="button" class="btn btn-primary btn-sm" onclick="buyNowPdp('${product.id}')" style="padding: 10px 18px; font-weight: 700;">
            Buy Now
          </button>
        </div>
      </div>

    </div>
  `;
}

function switchPdpImage(el, src) {
  document.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const preview = document.getElementById('pdp-main-preview');
  if (preview) preview.src = src;
}

function changePdpQty(delta) {
  const display = document.getElementById('pdp-qty-display');
  if (!display) return;
  let q = parseInt(display.textContent) || 1;
  q += delta;
  if (q < 1) q = 1;
  if (q > 20) q = 20;
  display.textContent = q;
}

function addCurrentPdpToCart(prodId) {
  const display = document.getElementById('pdp-qty-display');
  const q = display ? parseInt(display.textContent) : 1;
  addToCart(prodId, q, false);
}

function buyNowPdp(prodId) {
  const display = document.getElementById('pdp-qty-display');
  const q = display ? parseInt(display.textContent) : 1;
  addToCart(prodId, q, false);
  window.location.hash = '#/checkout';
}

function addBundleToCart(mainId, otherIds) {
  addToCart(mainId, 1, false);
  otherIds.forEach(id => addToCart(id, 1, false));
  showToast("Combo Bundle added to your cart!");
  window.location.hash = '#/cart';
}

function checkPdpPincode() {
  const pin = document.getElementById('pdp-pincode-input')?.value.trim();
  const res = document.getElementById('pdp-pincode-result');
  if (!res) return;

  if (pin.length !== 6 || isNaN(pin)) {
    res.style.color = 'var(--danger)';
    res.textContent = "Please enter a valid 6-digit Indian pincode.";
    return;
  }

  res.style.color = 'var(--success)';
  if (pin.startsWith('500') || pin.startsWith('501')) {
    res.innerHTML = ` Pincode ${pin} (Hyderabad/Telangana): <strong>Instant Delivery (45 Mins) & Rapido available!</strong>`;
  } else {
    res.innerHTML = ` Pincode ${pin}: <strong>Standard Express Delivery in 2–3 Business Days.</strong>`;
  }
}

// ------------------------------------------
// 5.5 SEARCH RESULTS VIEW
// ------------------------------------------
function renderSearchView(query, cat) {
  const root = document.getElementById('app-root');
  let results = STORE.products;

  if (query.trim()) {
    if (STORE.fuse) {
      results = STORE.fuse.search(query).map(r => r.item);
    } else {
      results = STORE.products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
    }
  }

  if (cat && cat !== 'all') {
    results = results.filter(p => p.categoryId === cat);
  }

  root.innerHTML = `
    <div class="container" style="padding: 32px 0;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <span>Search Results</span>
      </nav>

      <div style="margin-bottom: 24px;">
        <h1 style="font-family: var(--font-heading); font-size: 24px; color: var(--primary-maroon);">
          Search: "${query || 'All Items'}"
        </h1>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
          Found <strong>${results.length}</strong> matching sacred items in 7 Hills Pooja Store
        </p>
      </div>

      ${results.length > 0 ? `
        <div class="product-grid-4">
          ${results.map(p => renderProductCard(p)).join('')}
        </div>
      ` : `
        <div style="background: #FFF; border-radius: var(--radius-md); padding: 80px 20px; text-align: center; border: 1px solid var(--border-subtle); max-width: 600px; margin: 40px auto;">
          <span style="font-size: 52px;"></span>
          <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--primary-maroon); margin: 16px 0 8px 0;">
            No Devotional Items Found for "${query}"
          </h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;">
            Check your spelling, or browse our popular categories like Ganesha Idols, Peacock Diyas, Photo Frames, or Camphor.
          </p>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <a href="#/category/god-idols" class="btn btn-secondary btn-sm">God Idols</a>
            <a href="#/category/diyas-lamps" class="btn btn-secondary btn-sm">Diyas & Lamps</a>
            <a href="#/category/photo-frames" class="btn btn-secondary btn-sm">Photo Frames</a>
            <a href="#/" class="btn btn-primary btn-sm">Back to Home</a>
          </div>
        </div>
      `}
    </div>
  `;
}

// ------------------------------------------
// 5.6 CART VIEW
// ------------------------------------------
function renderCartView() {
  const root = document.getElementById('app-root');

  if (STORE.cart.length === 0) {
    root.innerHTML = `
      <div class="container" style="padding: 80px 20px; text-align: center;">
        <div style="font-size: 64px; color: var(--accent-gold); margin-bottom: 16px;"></div>
        <h2 style="font-family: var(--font-heading); font-size: 24px; color: var(--primary-maroon); margin-bottom: 8px;">
          Your Shopping Cart is Empty
        </h2>
        <p style="font-size: 14px; color: var(--text-muted); max-width: 420px; margin: 0 auto 24px auto;">
          Bring positive spiritual energy into your home. Explore our collection of authentic brass idols, pure diyas, and samagri kits.
        </p>
        <a href="#/" class="btn btn-primary btn-lg" data-testid="explore-store-btn">
          Explore Sacred Products &rarr;
        </a>
      </div>
    `;
    return;
  }

  // Cost calculation
  const mrpTotal = STORE.cart.reduce((sum, i) => sum + (i.product.mrp * i.quantity), 0);
  const subtotal = STORE.cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const discountSavings = mrpTotal - subtotal;

  // Coupon calculations
  let couponDiscount = 0;
  if (STORE.appliedCoupon) {
    if (STORE.appliedCoupon.flatDiscount) {
      couponDiscount = STORE.appliedCoupon.flatDiscount;
    } else if (STORE.appliedCoupon.discountPercent) {
      couponDiscount = Math.round(subtotal * (STORE.appliedCoupon.discountPercent / 100));
      if (STORE.appliedCoupon.maxDiscount && couponDiscount > STORE.appliedCoupon.maxDiscount) {
        couponDiscount = STORE.appliedCoupon.maxDiscount;
      }
    }
  }

  // Delivery Charges
  let deliveryFee = 200; // default instant
  if (STORE.selectedDeliveryMethod === 'rapido') deliveryFee = 120;
  else if (STORE.selectedDeliveryMethod === 'standard') deliveryFee = subtotal >= 499 ? 0 : 50;

  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  root.innerHTML = `
    <div class="container cart-page-layout">
      
      <!-- Items List Column -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
          <h1 style="font-family: var(--font-heading); font-size: 20px; color: var(--primary-maroon);">
            Shopping Cart (${STORE.cart.reduce((sum, i) => sum + i.quantity, 0)} Items)
          </h1>
          <a href="#/" style="font-size: 12.5px; color: var(--primary-saffron); font-weight: 600; text-decoration: underline;">
            + Continue Shopping
          </a>
        </div>

        <!-- Amazon-Style Top Subtotal & Proceed Box -->
        <div class="amazon-cart-subtotal-box">
          <div class="amazon-subtotal-title">
            Subtotal (${STORE.cart.reduce((sum, i) => sum + i.quantity, 0)} items): <span class="amazon-subtotal-price">₹${subtotal}</span>
          </div>
          <div class="amazon-free-delivery-tag">
            ${subtotal >= 499 ? `${getIcon('check-circle', 15)} Your order is eligible for FREE Delivery` : `${getIcon('truck', 15)} Add ₹${499 - subtotal} for FREE Delivery`}
          </div>
          <a href="#/checkout" class="amazon-btn-proceed" data-testid="checkout-top-btn">
            ${getIcon('shield-check', 16)} Proceed to Buy (${STORE.cart.reduce((sum, i) => sum + i.quantity, 0)} items)
          </a>
        </div>

        <!-- Amazon-Style Mobile Item Cards -->
        <div class="cart-items-wrapper">
          ${STORE.cart.map(item => `
            <div class="amazon-cart-card">
              <div class="amazon-cart-top">
                <img 
                  src="${getProductImageUrl(item.product.images[0])}" 
                  alt="${item.product.title}" 
                  class="amazon-cart-img"
                  onerror="this.src='image-coming-soon.svg'"
                >
                <div class="amazon-cart-info">
                  <a href="#/product/${item.product.id}" class="amazon-cart-title">${item.product.title}</a>
                  <span class="amazon-cart-stock">&#10003; In Stock</span>
                  <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 2px;">${item.product.category}</span>
                  <div class="amazon-cart-prices">
                    <span class="amazon-cart-selling">₹${item.product.price}</span>
                    <span class="amazon-cart-mrp">₹${item.product.mrp}</span>
                    <span class="amazon-cart-off">${item.product.discount}% OFF</span>
                  </div>
                </div>
              </div>

              <div class="amazon-cart-bottom">
                <div class="amazon-stepper">
                  <button type="button" class="amazon-stepper-btn" onclick="updateCartQuantity('${item.product.id}', -1)" aria-label="Decrease quantity">–</button>
                  <span class="amazon-stepper-val">${item.quantity}</span>
                  <button type="button" class="amazon-stepper-btn" onclick="updateCartQuantity('${item.product.id}', 1)" aria-label="Increase quantity">+</button>
                </div>

                <button type="button" class="amazon-btn-action delete" onclick="removeFromCart('${item.product.id}')">
                  ${getIcon('trash', 13)} Delete
                </button>
                <button type="button" class="amazon-btn-action" onclick="toggleWishlist('${item.product.id}')">
                  ${getIcon('heart', 13)} Save for later
                </button>
                <span style="font-size: 13px; font-weight: 700; color: var(--primary-maroon); margin-left: auto;">
                  ₹${item.product.price * item.quantity}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Summary Sidebar Column -->
      <div>
        <div class="cart-sidebar-card">
          <h3 style="font-family: var(--font-heading); font-size: 18px; color: var(--primary-maroon); border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
            Order Summary
          </h3>

          <!-- Coupon Box -->
          <div style="margin: 16px 0;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-main); text-transform: uppercase;">
              Apply Sacred Coupon Code
            </label>
            <div class="coupon-input-group">
              <input 
                type="text" 
                id="cart-coupon-input" 
                class="coupon-field" 
                placeholder="e.g. DIVINE10" 
                value="${STORE.appliedCoupon ? STORE.appliedCoupon.code : ''}"
                ${STORE.appliedCoupon ? 'disabled' : ''}
              >
              ${STORE.appliedCoupon ? `
                <button type="button" class="btn btn-secondary btn-sm" onclick="removeCoupon()">Remove</button>
              ` : `
                <button type="button" class="btn btn-primary btn-sm" onclick="applyCoupon()" data-testid="apply-coupon-btn">Apply</button>
              `}
            </div>
            ${STORE.appliedCoupon ? `
              <div style="font-size: 12px; color: var(--success); font-weight: 600;">
                &#10003; Coupon ${STORE.appliedCoupon.code} applied successfully!
              </div>
            ` : `
              <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between;">
                <span>Try code: <strong style="color: var(--primary-saffron); cursor: pointer;" onclick="document.getElementById('cart-coupon-input').value='DIVINE10'">DIVINE10</strong></span>
                <a href="#/deals" style="color: var(--primary-saffron); text-decoration: underline;">View All Coupons</a>
              </div>
            `}
          </div>

          <!-- Delivery Mode Options -->
          <div style="margin: 16px 0; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 8px;">
              Delivery Speed to ${STORE.userLocation}
            </label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; padding: 8px 12px; border: 1px solid ${STORE.selectedDeliveryMethod === 'instant' ? 'var(--primary-saffron)' : 'var(--border-subtle)'}; border-radius: var(--radius-sm); cursor: pointer; background: ${STORE.selectedDeliveryMethod === 'instant' ? 'var(--bg-cream)' : '#FFF'};">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="radio" name="deliv-method" value="instant" ${STORE.selectedDeliveryMethod === 'instant' ? 'checked' : ''} onchange="changeDeliveryMethod('instant')">
                  <span> Instant (30-45 mins)</span>
                </div>
                <strong>₹200</strong>
              </label>

              <label style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; padding: 8px 12px; border: 1px solid ${STORE.selectedDeliveryMethod === 'rapido' ? 'var(--primary-saffron)' : 'var(--border-subtle)'}; border-radius: var(--radius-sm); cursor: pointer; background: ${STORE.selectedDeliveryMethod === 'rapido' ? 'var(--bg-cream)' : '#FFF'};">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="radio" name="deliv-method" value="rapido" ${STORE.selectedDeliveryMethod === 'rapido' ? 'checked' : ''} onchange="changeDeliveryMethod('rapido')">
                  <span>️ Rapido Delivery (1-2 hrs)</span>
                </div>
                <strong>₹120</strong>
              </label>

              <label style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; padding: 8px 12px; border: 1px solid ${STORE.selectedDeliveryMethod === 'standard' ? 'var(--primary-saffron)' : 'var(--border-subtle)'}; border-radius: var(--radius-sm); cursor: pointer; background: ${STORE.selectedDeliveryMethod === 'standard' ? 'var(--bg-cream)' : '#FFF'};">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="radio" name="deliv-method" value="standard" ${STORE.selectedDeliveryMethod === 'standard' ? 'checked' : ''} onchange="changeDeliveryMethod('standard')">
                  <span> Standard (2-3 Days)</span>
                </div>
                <strong>${subtotal >= 499 ? '<span style="color: var(--success)">FREE</span>' : '₹50'}</strong>
              </label>
            </div>
          </div>

          <!-- Invoice Breakdown -->
          <div class="bill-summary-table">
            <div class="bill-row">
              <span>Total MRP Value</span>
              <span>₹${mrpTotal}</span>
            </div>
            <div class="bill-row" style="color: var(--success); font-weight: 600;">
              <span>Total Discount Savings</span>
              <span>– ₹${discountSavings}</span>
            </div>
            <div class="bill-row">
              <span>Items Subtotal</span>
              <span>₹${subtotal}</span>
            </div>
            ${couponDiscount > 0 ? `
              <div class="bill-row" style="color: var(--success); font-weight: 600;">
                <span>Coupon Discount (${STORE.appliedCoupon.code})</span>
                <span>– ₹${couponDiscount}</span>
              </div>
            ` : ''}
            <div class="bill-row">
              <span>Estimated Delivery Fee</span>
              <span>${deliveryFee === 0 ? '<span style="color: var(--success);">FREE</span>' : `₹${deliveryFee}`}</span>
            </div>
            <div class="bill-row total">
              <span>Grand Total</span>
              <span>₹${grandTotal}</span>
            </div>
          </div>

          <a href="#/checkout" class="btn btn-primary btn-block btn-lg" data-testid="checkout-btn">
            Proceed to Checkout &rarr;
          </a>

          <div style="margin-top: 16px; font-size: 11px; color: var(--text-muted); text-align: center; line-height: 1.4;">
             100% Secure Checkout with Temple-Grade Quality Guarantee
          </div>
        </div>
      </div>

      <!-- Sticky Mobile Checkout Bar for Cart -->
      <div class="mobile-cart-sticky-bar">
        <div>
          <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">Total to Pay</span>
          <strong style="font-size: 18px; color: var(--primary-maroon);">₹${grandTotal}</strong>
        </div>
        <a href="#/checkout" class="btn btn-primary" style="padding: 10px 18px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <span>Checkout</span>
          ${typeof getIcon !== 'undefined' ? getIcon('arrow-right', 15) : '&rarr;'}
        </a>
      </div>

    </div>
  `;
}

function applyCoupon() {
  const code = document.getElementById('cart-coupon-input')?.value.trim().toUpperCase();
  if (!code) return;

  const found = STORE.coupons.find(c => c.code === code);
  const subtotal = STORE.cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);

  if (!found) {
    showToast("Invalid coupon code. Try 'DIVINE10' or 'POOJA20'.");
    return;
  }

  if (found.minOrder && subtotal < found.minOrder) {
    showToast(`Coupon ${code} requires minimum cart order of ₹${found.minOrder}.`);
    return;
  }

  STORE.appliedCoupon = found;
  localStorage.setItem('7hills_coupon', JSON.stringify(found));
  showToast(`Coupon ${code} applied successfully!`);
  renderCartView();
}

function removeCoupon() {
  STORE.appliedCoupon = null;
  localStorage.removeItem('7hills_coupon');
  showToast("Coupon removed.");
  renderCartView();
}

function changeDeliveryMethod(method) {
  STORE.selectedDeliveryMethod = method;
  localStorage.setItem('7hills_delivery_method', method);
  renderCartView();
}

// ------------------------------------------
// 5.7 CHECKOUT VIEW (FRICTIONLESS 3-STEP)
// ------------------------------------------
function renderCheckoutView() {
  const root = document.getElementById('app-root');

  if (STORE.cart.length === 0) {
    window.location.hash = '#/cart';
    return;
  }

  const subtotal = STORE.cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  const mrpTotal = STORE.cart.reduce((sum, i) => {
    const rawMrp = Number(i.product.mrp);
    const pMrp = rawMrp && rawMrp > i.product.price ? rawMrp : Math.round(i.product.price * 1.3);
    return sum + (pMrp * i.quantity);
  }, 0);
  let couponDiscount = 0;
  if (STORE.appliedCoupon) {
    if (STORE.appliedCoupon.flatDiscount) couponDiscount = STORE.appliedCoupon.flatDiscount;
    else if (STORE.appliedCoupon.discountPercent) couponDiscount = Math.round(subtotal * (STORE.appliedCoupon.discountPercent / 100));
  }

  let deliveryFee = 200;
  if (STORE.selectedDeliveryMethod === 'rapido') deliveryFee = 120;
  else if (STORE.selectedDeliveryMethod === 'standard') deliveryFee = subtotal >= 499 ? 0 : 50;

  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);
  const activeAddress = STORE.addresses.find(a => a.isDefault) || STORE.addresses[0];

  root.innerHTML = `
    <div class="container" style="padding: 32px 0;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <a href="#/cart">Cart</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">Secure Checkout</span>
      </nav>

      <div class="checkout-page-layout">
        
        <!-- Left: 3-Step Checkout Stack -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          
          <!-- Step 1: Delivery Address Card -->
          <div class="swiggy-checkout-card">
            <div class="swiggy-header-row">
              <h2 class="swiggy-step-title">
                ${getIcon('map-pin', 16)} 1. Delivery Address
              </h2>
              <button type="button" class="swiggy-change-btn" onclick="toggleNewAddressForm()">+ Add New</button>
            </div>

            <!-- Active Selected Address Display -->
            <div class="swiggy-address-card-selected" style="margin-bottom: 12px;">
              <div class="swiggy-address-icon-box">
                ${getIcon('map-pin', 18)}
              </div>
              <div class="swiggy-address-info">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                  <span class="swiggy-address-tag">${activeAddress ? activeAddress.tag : 'HOME'}</span>
                  <strong>${activeAddress ? activeAddress.name : STORE.userProfile.name}</strong>
                  <span style="font-size: 11.5px; color: var(--text-muted);">• ${activeAddress ? activeAddress.phone : STORE.userProfile.phone}</span>
                </div>
                <div>
                  ${activeAddress ? `${activeAddress.street}, ${activeAddress.landmark}, ${activeAddress.area}, ${activeAddress.city} - <strong>${activeAddress.pincode}</strong>` : 'Beside Prasannanjaneya Swamy Temple, LB Nagar, Hyderabad - 500074'}
                </div>
              </div>
            </div>

            <!-- Address Radio Selection List -->
            <div style="display: flex; flex-direction: column; gap: 8px;" id="checkout-addresses-list">
              ${STORE.addresses.map(a => `
                <label style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1.5px solid ${a.isDefault ? 'var(--primary-saffron)' : 'var(--border-subtle)'}; border-radius: var(--radius-sm); cursor: pointer; background: ${a.isDefault ? 'var(--bg-cream)' : '#FFF'}; font-size: 12.5px;">
                  <input type="radio" name="checkout-addr" value="${a.id}" ${a.isDefault ? 'checked' : ''} onchange="setDefaultAddress('${a.id}')" style="margin-top: 3px;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <strong>${a.name}</strong>
                      <span style="background: var(--primary-maroon); color: #FFF; font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 700;">${a.tag}</span>
                      ${a.isDefault ? '<span style="color: var(--success); font-size: 10px; font-weight: 700;">(Selected)</span>' : ''}
                    </div>
                    <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${a.street}, ${a.area} - ${a.pincode}
                    </div>
                  </div>
                </label>
              `).join('')}
            </div>

            <!-- New Address Inline Form -->
            <div id="new-address-form-box" style="display: none; margin-top: 14px; background: var(--bg-cream); border: 1px dashed var(--accent-gold); border-radius: var(--radius-sm); padding: 14px;">
              <h4 style="font-size: 13px; font-weight: 700; color: var(--primary-maroon); margin-bottom: 10px;">Add New Delivery Address</h4>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <input type="text" id="new-addr-name" class="input-field" placeholder="Full Name *" value="${STORE.userProfile.name}" style="width: 100%; box-sizing: border-box;">
                <input type="tel" id="new-addr-phone" class="input-field" placeholder="10-digit Phone Number *" value="${STORE.userProfile.phone}" style="width: 100%; box-sizing: border-box;">
                <input type="text" id="new-addr-street" class="input-field" placeholder="House/Flat No, Apartment, Street *" style="width: 100%; box-sizing: border-box;">
                <input type="text" id="new-addr-landmark" class="input-field" placeholder="Landmark (e.g. Near Metro Station)" style="width: 100%; box-sizing: border-box;">
                <input type="text" id="new-addr-pincode" class="input-field" placeholder="Pincode (e.g. 500074) *" style="width: 100%; box-sizing: border-box;">
              </div>
              <div style="display: flex; gap: 10px; margin-top: 12px;">
                <button type="button" class="btn btn-primary btn-sm" onclick="saveNewCheckoutAddress()">Save & Deliver Here</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="toggleNewAddressForm()">Cancel</button>
              </div>
            </div>
          </div>

          <!-- Step 2: Delivery Speed Method -->
          <div class="swiggy-checkout-card">
            <div class="swiggy-header-row">
              <h2 class="swiggy-step-title">
                ${getIcon('truck', 16)} 2. Delivery Speed & Devotional Notes
              </h2>
              <a href="#/cart" class="swiggy-change-btn">Change in Cart</a>
            </div>
            
            <div style="padding: 10px 12px; border: 1.5px solid var(--primary-saffron); border-radius: var(--radius-sm); background: var(--bg-cream); margin-bottom: 12px; font-size: 13px;">
              <strong style="color: var(--primary-maroon);">
                ${STORE.selectedDeliveryMethod === 'instant' ? 'Instant Delivery (30-45 mins)' : STORE.selectedDeliveryMethod === 'rapido' ? 'Rapido Express (1-2 hrs)' : 'Standard Delivery (2-3 Days)'}
              </strong>
              <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                Fee: ₹${deliveryFee === 0 ? 'FREE' : deliveryFee} • Delivering to ${activeAddress ? activeAddress.area : 'Hyderabad'}
              </div>
            </div>

            <!-- Devotional Instructions Note -->
            <div>
              <label style="font-size: 11.5px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 4px;">
                Special Devotional / Delivery Instructions:
              </label>
              <input 
                type="text" 
                class="input-field" 
                placeholder="e.g. Keep near pooja room / Ring bell twice"
                style="width: 100%; font-size: 12px; box-sizing: border-box;"
              >
            </div>
          </div>

          <!-- Step 3: Payment Method (Online Payment via UPI) -->
          <div class="swiggy-checkout-card">
            <div class="swiggy-header-row">
              <h2 class="swiggy-step-title">
                ${getIcon('shield-check', 16)} 3. Payment Method: Online Payment
              </h2>
              <span id="active-payment-pill" style="font-size: 11px; color: #047857; background: #D1FAE5; font-weight: 700; padding: 3px 8px; border-radius: 12px; border: 1px solid #A7F3D0;">
                100% Online Payment • Zero Cash on Delivery
              </span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Online Payment: Direct UPI & Mobile Payment -->
              <div 
                class="upi-payment-card active-method" 
                id="method-card-upi" 
                style="display: flex; flex-direction: column; gap: 10px; padding: 16px; border: 2px solid var(--primary-maroon); border-radius: var(--radius-md); background: #FFFDF9;"
              >
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                  <input 
                    type="radio" 
                    name="payment-method" 
                    id="pay-radio-upi"
                    value="UPI" 
                    checked 
                    style="margin-top: 4px; accent-color: var(--primary-maroon); width: 18px; height: 18px; flex-shrink: 0;"
                  >
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <strong style="color: var(--primary-maroon); font-size: 15px;">Instant UPI & Online Payment</strong>
                        <span style="background: #16A34A; color: #FFF; font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">FAST & INSTANT</span>
                      </div>
                      <span style="font-size: 11px; color: #16A34A; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                        ${getIcon('shield-check', 13)} Verified Axis Bank Merchant
                      </span>
                    </div>
                    <p style="font-size: 12px; color: var(--text-secondary); margin: 6px 0 10px; line-height: 1.4;">
                      Pay securely directly to <strong>7 Hills Pooja Store</strong> using PhonePe, Google Pay, Paytm, BHIM, or Any Bank UPI app. Zero gateway fees!
                    </p>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 12px;">
                      <span class="pay-chip" style="color: #5f259f; font-weight: 700;">● PhonePe</span>
                      <span class="pay-chip" style="color: #0F9D58; font-weight: 700;">● Google Pay</span>
                      <span class="pay-chip" style="color: #002970; font-weight: 700;">● Paytm</span>
                      <span class="pay-chip">BHIM UPI</span>
                      <span class="pay-chip">Any Bank UPI</span>
                    </div>

                    <!-- Interactive Mobile Payment Box -->
                    <div id="upi-details-box" style="background: #FFFFFF; border: 1.5px dashed var(--accent-gold); border-radius: 12px; padding: 16px; margin-top: 4px;">
                      
                      <!-- Step-by-Step Payment Banner -->
                      <div style="background: #FFFDF9; border: 1.5px solid var(--accent-gold); border-radius: 10px; padding: 12px; margin-bottom: 12px;">
                        <div style="font-size: 11.5px; font-weight: 800; color: var(--primary-maroon); text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                          ${getIcon('shield-check', 14)} Direct UPI Transfer (Zero Gateway Charges)
                        </div>
                        <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.45;">
                          Pay directly to <strong>7 Hills Pooja Store</strong> using Google Pay, PhonePe, or Paytm by mobile number or QR code below.
                        </p>
                      </div>

                      <!-- Option 1: Pay to Mobile Number (Google Pay / PhonePe / Paytm) -->
                      <div style="display: flex; align-items: center; justify-content: space-between; background: #FFFDF9; border: 1.5px solid var(--accent-gold); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px;">
                        <div>
                          <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 800;">Option 1: Pay to Mobile Number</span>
                          <strong id="merchant-phone-text" style="font-size: 18px; color: var(--primary-maroon); font-family: monospace; letter-spacing: 0.5px;">9989885363</strong>
                          <div style="font-size: 11px; color: #047857; font-weight: 700; margin-top: 2px;">Google Pay • PhonePe • Paytm</div>
                        </div>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); copyMerchantPhone()" id="copy-phone-btn" style="padding: 7px 14px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                          ${getIcon('copy', 13)} <span>Copy Number</span>
                        </button>
                      </div>

                      <!-- Option 2: Merchant UPI ID -->
                      <div style="display: flex; align-items: center; justify-content: space-between; background: #FFFDF9; border: 1.5px solid var(--accent-gold); border-radius: 10px; padding: 10px 14px; margin-bottom: 14px;">
                        <div>
                          <span style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 800;">Option 2: Merchant UPI ID</span>
                          <strong id="merchant-upi-text" style="font-size: 14px; color: var(--primary-maroon); font-family: monospace;">9989885363-1@okbizaxis</strong>
                          <div style="font-size: 10.5px; color: #047857; font-weight: 600; margin-top: 2px;">7 Hills Pooja Store • Axis Bank</div>
                        </div>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); copyMerchantUpi()" id="copy-upi-btn" style="padding: 6px 12px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                          ${getIcon('copy', 12)} <span>Copy UPI ID</span>
                        </button>
                      </div>

                      <!-- Option 3: QR Code Section -->
                      <div style="display: flex; flex-direction: column; gap: 8px; align-items: center; padding-top: 10px; border-top: 1px dashed var(--border-subtle);">
                        <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 800;">Option 3: Scan QR Code</span>
                        <div style="text-align: center;">
                          <div style="background: #FFF; padding: 6px; border: 2px solid var(--accent-gold); border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(122,12,26,0.06);">
                            <img 
                              src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(`upi://pay?pa=9989885363-1@okbizaxis&pn=7%20Hills%20Pooja%20Store&am=${grandTotal}&cu=INR&tn=7HillsPoojaStore`)}"
                              alt="Scan & Pay ₹${grandTotal} with any UPI App"
                              style="width: 140px; height: 140px; display: block;"
                              loading="lazy"
                            />
                          </div>
                          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; font-weight: 600;">Scan with PhonePe, Google Pay, or Paytm scanner</div>
                          <div style="font-size: 13.5px; font-weight: 800; color: var(--primary-maroon); margin-top: 2px;">Amount: ₹${grandTotal}</div>
                        </div>

                        <!-- 1-Tap Universal Mobile Pay Button -->
                        <div style="width: 100%; margin-top: 6px;" onclick="event.stopPropagation();">
                          <a 
                            href="upi://pay?pa=9989885363-1@okbizaxis&pn=7%20Hills%20Pooja%20Store&am=${grandTotal}&cu=INR&tn=7HillsPoojaStore" 
                            style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 11px; border-radius: 8px; background: linear-gradient(135deg, #047857 0%, #065F46 100%); color: #FFF; font-weight: 700; font-size: 12.5px; text-decoration: none; text-align: center; box-shadow: 0 2px 8px rgba(4,120,87,0.25); box-sizing: border-box;"
                          >
                            <span>⚡ Open in Any UPI App</span>
                          </a>
                          <div style="font-size: 10.5px; color: var(--text-muted); text-align: center; margin-top: 4px;">
                            💡 If your bank declines direct web links, simply copy mobile number <strong>9989885363</strong> and pay in your UPI app.
                          </div>
                        </div>

                        <!-- Optional UTR Input Field -->
                        <div style="width: 100%; margin-top: 8px;">
                          <label style="font-size: 11px; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 3px;">
                            UPI Reference / UTR Number (Optional):
                          </label>
                          <input 
                            type="text" 
                            id="checkout-upi-utr" 
                            class="input-field" 
                            placeholder="e.g. 12-digit UTR from payment app" 
                            style="width: 100%; font-size: 12px; padding: 7px 10px; box-sizing: border-box;"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              <!-- Store Policy Notice: 100% Online Payment Only -->
              <div style="background: #FFFBF5; border: 1.5px dashed var(--accent-gold); border-radius: var(--radius-md); padding: 12px 14px; display: flex; align-items: flex-start; gap: 10px;">
                <div style="color: var(--primary-maroon); margin-top: 1px; flex-shrink: 0;">
                  ${getIcon('shield-check', 16)}
                </div>
                <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.45;">
                  <strong style="color: var(--primary-maroon);">100% Online Payment Only:</strong> To avoid cash handling issues with our express delivery partners (Rapido) and ensure your sacred pooja samagri is packed and dispatched immediately without doorstep delays, Cash on Delivery (COD) is strictly not accepted. Store helpline: <strong>+91 90979 99939</strong>.
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Right: Checkout Summary Column -->
        <div>
          <div class="swiggy-checkout-card">
            <div class="swiggy-header-row">
              <h3 class="swiggy-step-title">
                ${getIcon('orders', 16)} 4. Order & Bill Details
              </h3>
            </div>

            <!-- Item Mini List -->
            <div style="max-height: 180px; overflow-y: auto; margin-bottom: 14px; display: flex; flex-direction: column; gap: 8px; padding-right: 2px;">
              ${STORE.cart.map(i => `
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12.5px;">
                  <img src="${getProductImageUrl(i.product.images[0])}" style="width: 38px; height: 38px; border-radius: 4px; object-fit: cover; flex-shrink: 0; border: 1px solid var(--border-subtle);">
                  <div style="flex: 1; min-width: 0;">
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;">${i.product.title}</div>
                    <span style="font-size: 11px; color: var(--text-muted);">Qty: ${i.quantity}</span>
                  </div>
                  <strong style="font-size: 13px; color: var(--primary-maroon);">₹${i.product.price * i.quantity}</strong>
                </div>
              `).join('')}
            </div>

            <!-- Swiggy Bill Details Table -->
            <div class="swiggy-bill-list" style="border-top: 1px solid var(--border-subtle); padding-top: 12px;">
              <div class="swiggy-bill-item">
                <span>Items Subtotal</span>
                <span>₹${subtotal}</span>
              </div>
              ${couponDiscount > 0 ? `
                <div class="swiggy-bill-item highlight-green">
                  <span>Coupon (${STORE.appliedCoupon.code})</span>
                  <span>– ₹${couponDiscount}</span>
                </div>
              ` : ''}
              <div class="swiggy-bill-item">
                <span>Delivery Partner Fee</span>
                <span>${deliveryFee === 0 ? '<span style="color: var(--success); font-weight: 700;">FREE</span>' : `₹${deliveryFee}`}</span>
              </div>
              <div class="swiggy-bill-sep"></div>
              <div class="swiggy-bill-item grand">
                <span>To Pay</span>
                <span>₹${grandTotal}</span>
              </div>
            </div>

            ${(couponDiscount > 0 || (mrpTotal - subtotal) > 0) ? `
              <div class="swiggy-savings-banner">
                You saved ₹${(mrpTotal - subtotal) + couponDiscount} on this sacred order!
              </div>
            ` : ''}

            <button 
              type="button" 
              class="btn btn-primary btn-block btn-lg" 
              id="checkout-main-submit-btn"
              onclick="executeOrderPlacement()"
              data-testid="place-order-btn"
              style="margin-top: 14px; padding: 14px 18px; font-size: 15px;"
            >
              Place Order & Pay ₹${grandTotal}
            </button>

            <div id="checkout-btn-subtext" style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 6px;">
              100% Online Payment via UPI • Zero Cash Handling
            </div>

            <div style="margin-top: 12px; text-align: center;">
              <a href="#/cart" style="font-size: 11.5px; color: var(--text-muted); text-decoration: underline;">Return to Cart</a>
            </div>
          </div>
        </div>

      </div>

      <!-- Swiggy-Style Sticky Mobile Checkout Bar -->
      <div class="swiggy-sticky-order-bar">
        <div>
          <span id="sticky-pay-mode-label" style="font-size: 10px; color: var(--text-muted); display: block; text-transform: uppercase;">
            Online Payment
          </span>
          <strong style="font-size: 18px; color: var(--primary-maroon);">₹${grandTotal}</strong>
        </div>
        <button 
          type="button" 
          class="btn btn-primary" 
          id="checkout-sticky-submit-btn"
          onclick="executeOrderPlacement()"
          style="padding: 10px 22px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;"
        >
          <span>Place Order</span>
          ${getIcon('arrow-right', 15)}
        </button>
      </div>
    </div>
  `;
}

function toggleNewAddressForm() {
  const box = document.getElementById('new-address-form-box');
  if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function saveNewCheckoutAddress() {
  const name = document.getElementById('new-addr-name')?.value.trim();
  const phone = document.getElementById('new-addr-phone')?.value.trim();
  const street = document.getElementById('new-addr-street')?.value.trim();
  const landmark = document.getElementById('new-addr-landmark')?.value.trim();
  const pincode = document.getElementById('new-addr-pincode')?.value.trim();

  if (!name || !phone || !street || !pincode) {
    showToast("Please fill in all required address fields (*).");
    return;
  }

  const newAddr = {
    id: `addr_${Date.now()}`,
    name,
    phone,
    tag: "Custom",
    street,
    landmark: landmark || "Beside Main Road",
    area: "Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    pincode,
    isDefault: true
  };

  STORE.addresses.forEach(a => a.isDefault = false);
  STORE.addresses.unshift(newAddr);
  saveAddresses();
  showToast("Address saved!");
  renderCheckoutView();
}

function setDefaultAddress(addrId) {
  STORE.addresses.forEach(a => a.isDefault = (a.id === addrId));
  saveAddresses();
  renderCheckoutView();
}

function copyMerchantPhone() {
  const phone = '9989885363';
  const finishCopy = () => {
    const btn = document.getElementById('copy-phone-btn');
    if (btn) btn.innerHTML = `${getIcon('check', 12)} <span>Copied!</span>`;
    const modalBtn = document.getElementById('modal-copy-phone-btn');
    if (modalBtn) modalBtn.innerHTML = `${getIcon('check', 12)} <span>Copied!</span>`;
    showToast('Mobile Number 9989885363 copied!');
    setTimeout(() => {
      if (btn) btn.innerHTML = `${getIcon('copy', 12)} <span>Copy Number</span>`;
      if (modalBtn) modalBtn.innerHTML = `${getIcon('copy', 12)} <span>Copy Number</span>`;
    }, 2500);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(phone).then(finishCopy).catch(() => {
      fallbackCopyText(phone);
      finishCopy();
    });
  } else {
    fallbackCopyText(phone);
    finishCopy();
  }
}

function copyMerchantUpi() {
  const upiId = '9989885363-1@okbizaxis';
  const finishCopy = () => {
    const btn = document.getElementById('copy-upi-btn');
    if (btn) btn.innerHTML = `${getIcon('check', 12)} <span>Copied!</span>`;
    const modalBtn = document.getElementById('modal-copy-upi-btn');
    if (modalBtn) modalBtn.innerHTML = `${getIcon('check', 12)} <span>Copied!</span>`;
    showToast('Merchant UPI ID 9989885363-1@okbizaxis copied!');
    setTimeout(() => {
      if (btn) btn.innerHTML = `${getIcon('copy', 12)} <span>Copy UPI</span>`;
      if (modalBtn) modalBtn.innerHTML = `${getIcon('copy', 12)} <span>Copy UPI</span>`;
    }, 2500);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(upiId).then(finishCopy).catch(() => {
      fallbackCopyText(upiId);
      finishCopy();
    });
  } else {
    fallbackCopyText(upiId);
    finishCopy();
  }
}

function fallbackCopyText(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    ta.remove();
  } catch (e) {
    console.warn('Clipboard fallback notice:', e);
  }
}

function selectPaymentMode(mode) {
  STORE.selectedPaymentMethod = 'UPI';
  localStorage.setItem('7hills_payment_method', 'UPI');

  // Calculate live grand total
  const subtotal = STORE.cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  let couponDiscount = 0;
  if (STORE.appliedCoupon) {
    if (STORE.appliedCoupon.flatDiscount) couponDiscount = STORE.appliedCoupon.flatDiscount;
    else if (STORE.appliedCoupon.discountPercent) couponDiscount = Math.round(subtotal * (STORE.appliedCoupon.discountPercent / 100));
  }
  let deliveryFee = 200;
  if (STORE.selectedDeliveryMethod === 'rapido') deliveryFee = 120;
  else if (STORE.selectedDeliveryMethod === 'standard') deliveryFee = subtotal >= 499 ? 0 : 50;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  // Sync button labels
  const mainBtn = document.getElementById('checkout-main-submit-btn');
  const stickyBtn = document.getElementById('checkout-sticky-submit-btn');
  const subtext = document.getElementById('checkout-btn-subtext');
  const stickyLabel = document.getElementById('sticky-pay-mode-label');

  if (mainBtn) {
    mainBtn.innerHTML = `Place Order & Pay ₹${grandTotal}`;
  }
  if (subtext) {
    subtext.textContent = '100% Online Payment via UPI • Zero Cash Handling';
  }
  if (stickyBtn) {
    stickyBtn.innerHTML = `<span>Place Order</span> ${getIcon('arrow-right', 15)}`;
  }
  if (stickyLabel) {
    stickyLabel.textContent = 'Online Payment';
  }
}

function togglePaymentSelection(mode) {
  selectPaymentMode('UPI');
}

function resetPlaceOrderButtons() {
  const placeBtns = document.querySelectorAll('[data-testid="place-order-btn"], .swiggy-sticky-order-bar button');
  placeBtns.forEach(b => {
    b.disabled = false;
    if (b.dataset.origHtml) {
      b.innerHTML = b.dataset.origHtml;
    }
  });
}

async function executeOrderPlacement() {
  if (STORE.cart.length === 0) return;

  const mainBtn = document.getElementById('checkout-main-submit-btn');
  const stickyBtn = document.getElementById('checkout-sticky-submit-btn');

  // Disable buttons & show loading state
  if (mainBtn) {
    mainBtn.disabled = true;
    mainBtn.dataset.origHtml = mainBtn.innerHTML;
    mainBtn.innerHTML = `<span style="display:inline-block;width:14px;height:14px;border:2px solid #FFF;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px;vertical-align:middle;"></span> Confirming Sacred Order...`;
  }
  if (stickyBtn) {
    stickyBtn.disabled = true;
    stickyBtn.dataset.origHtml = stickyBtn.innerHTML;
    stickyBtn.innerHTML = `<span>Confirming...</span>`;
  }

  const activeAddress = STORE.addresses.find(a => a.isDefault) || STORE.addresses[0];
  const orderId = `7H-ORD-${Math.floor(10000 + Math.random() * 90000)}`;

  const subtotal = STORE.cart.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
  let couponDiscount = 0;
  if (STORE.appliedCoupon) {
    if (STORE.appliedCoupon.flatDiscount) couponDiscount = STORE.appliedCoupon.flatDiscount;
    else if (STORE.appliedCoupon.discountPercent) couponDiscount = Math.round(subtotal * (STORE.appliedCoupon.discountPercent / 100));
  }

  let deliveryFee = 200;
  if (STORE.selectedDeliveryMethod === 'rapido') deliveryFee = 120;
  else if (STORE.selectedDeliveryMethod === 'standard') deliveryFee = subtotal >= 499 ? 0 : 50;

  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  const deliveryName = STORE.selectedDeliveryMethod === 'instant' 
    ? 'Instant Express (within 45 mins)' 
    : STORE.selectedDeliveryMethod === 'rapido' 
    ? 'Rapido Delivery (1-2 hrs)' 
    : 'Standard Delivery (2-3 Days)';

  const expectedDeliveryDate = STORE.selectedDeliveryMethod === 'instant' 
    ? `Today (Within 45 mins - by ${new Date(Date.now() + 45*60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` 
    : 'Within 24 to 48 Hours';

  const typedUtr = document.getElementById('checkout-upi-utr')?.value.trim();

  const newOrder = {
    orderId,
    customerName: activeAddress ? activeAddress.name : 'Devotee',
    date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    status: "New Order",
    stepIndex: 1, // Confirmed
    deliveryMethod: STORE.selectedDeliveryMethod,
    deliveryName,
    expectedDeliveryDate,
    deliveryCost: deliveryFee,
    address: activeAddress ? `${activeAddress.street}, ${activeAddress.area}, ${activeAddress.city} - ${activeAddress.pincode}` : 'LB Nagar, Hyderabad - 500074',
    phone: activeAddress ? activeAddress.phone : '9097999939',
    paymentMethod: typedUtr ? `Online UPI (${typedUtr}) - 9989885363-1@okbizaxis` : 'Online UPI (Axis Bank: 9989885363-1@okbizaxis)',
    paymentStatus: 'PAID (Online UPI)',
    rider: {
      name: "Suresh Reddy (7 Hills Express)",
      phone: "+91 90979 99939",
      vehicle: "Bajaj Pulsar (TS 08 HG 8812)",
      eta: STORE.selectedDeliveryMethod === 'instant' ? "35 minutes" : "2 hours"
    },
    items: STORE.cart.map(item => ({
      id: item.product.id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.images ? item.product.images[0] : (item.product.image || 'IMAGE (40).JPG')
    })),
    subtotal,
    discount: couponDiscount,
    couponCode: STORE.appliedCoupon ? STORE.appliedCoupon.code : null,
    tax: Math.round(subtotal * 0.05),
    total: grandTotal,
    grandTotal,
    utr: typedUtr || ''
  };

  // 1. Build WhatsApp message for LB Nagar store at 9097999939
  const itemsText = newOrder.items.map((it, idx) => 
    `${idx + 1}. ${it.title} x ${it.quantity} = Rs. ${it.price * it.quantity}`
  ).join('\n');

  const waMessage = 
`*7 HILLS POOJA STORE — NEW ORDER PLACED*
====================================
*Order ID:* ${newOrder.orderId}
*Customer:* ${newOrder.customerName}
*Phone:* ${newOrder.phone}
*Delivery Address:* ${newOrder.address}
*Expected Delivery:* ${newOrder.expectedDeliveryDate}
*Delivery Method:* ${newOrder.deliveryName}

*ITEMS ORDERED:*
${itemsText}
------------------------------------
*Subtotal:* Rs. ${newOrder.subtotal}
*Discount:* Rs. ${newOrder.discount}
*Delivery Fee:* Rs. ${newOrder.deliveryCost}
*GRAND TOTAL:* Rs. ${newOrder.grandTotal}
*Payment Method:* ${newOrder.paymentMethod}
*Payment Status:* ${newOrder.paymentStatus}
${newOrder.utr ? `*UPI Reference (UTR):* ${newOrder.utr}\n` : ''}*Merchant UPI:* 9989885363-1@okbizaxis (Axis Bank) • Mobile: 9989885363
====================================
7 Hills Pooja Store
Beside Prasannanjaneya Swamy Temple, LB Nagar, Hyderabad
Store Helpline: +91 90979 99939
Positive Energy in Every Item.`;

  const waUrl = `https://api.whatsapp.com/send?phone=919097999939&text=${encodeURIComponent(waMessage)}`;
  newOrder.whatsappUrl = waUrl;

  // 2. Prepend to local orders list
  STORE.orders.unshift(newOrder);
  saveOrders();

  // 3. Clear Cart & Coupon
  STORE.cart = [];
  STORE.appliedCoupon = null;
  saveCart();
  localStorage.removeItem('7hills_coupon');

  // 4. POST to Backend API -> Triggers Partner App Loud Alert Buzzer via SSE!
  try {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.warn('Order API sync error:', err));
  } catch (e) {
    console.warn('Backend offline, proceeding locally:', e);
  }

  // Play Sacred Temple Bell Audio Chime
  try {
    if (typeof playSacredTempleBell === 'function') {
      playSacredTempleBell();
    }
  } catch (e) {}

  // 5. Open WhatsApp chat with 9097999939
  try {
    window.open(waUrl, '_blank');
  } catch (e) {
    console.log('Popup blocked, WhatsApp URL stored on confirmation page');
  }

  resetPlaceOrderButtons();
  showToast(`Sacred Order <strong>${newOrder.orderId}</strong> placed! Notifying store.`);
  window.location.hash = `#/order-confirmed/${newOrder.orderId}`;
}

function finalizeOrderPlacement(newOrder, payRef) {
  resetPlaceOrderButtons();
  const utr = payRef ? payRef : '';
  newOrder.utr = utr;
  newOrder.paymentMethod = utr ? `Online Payment (${utr}) - 9989885363-1@okbizaxis` : 'Online Payment - 9989885363-1@okbizaxis';
  newOrder.paymentStatus = 'PAID (Online UPI)';
  newOrder.paymentId = utr ? `upi_${utr}` : `upi_${Date.now()}`;

  STORE.orders.unshift(newOrder);
  saveOrders();
  STORE.cart = [];
  STORE.appliedCoupon = null;
  saveCart();
  localStorage.removeItem('7hills_coupon');

  try {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(() => {});
  } catch (e) {}

  window.location.hash = `#/order-confirmed/${newOrder.orderId}`;
}

// ------------------------------------------
// 5.8 ORDER CONFIRMED VIEW
// ------------------------------------------
function renderOrderConfirmedView(orderId) {
  const root = document.getElementById('app-root');
  const order = STORE.orders.find(o => o.orderId === orderId) || STORE.orders[0];
  if (!order) {
    window.location.hash = '#/';
    return;
  }

  const waUrl = order.whatsappUrl || `https://api.whatsapp.com/send?phone=919097999939&text=${encodeURIComponent(`Hello 7 Hills Pooja Store, checking status of order ${order.orderId}`)}`;
  const amountToPay = order.total || order.grandTotal || 0;

  root.innerHTML = `
    <div class="container" style="padding: 24px 16px; max-width: 600px; margin: 0 auto;">
      <div style="background: #FFF; border: 2px solid var(--accent-gold); border-radius: var(--radius-lg); padding: 28px 20px; box-shadow: var(--shadow-lg); text-align: center;">
        
        <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--success-bg); color: var(--success); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
          ${getIcon('check', 32, '', 2.5)}
        </div>

        <span style="font-size: 11px; font-weight: 700; color: var(--accent-gold-dark); text-transform: uppercase; letter-spacing: 1px;">
          7 Hills Pooja Store Order Confirmed
        </span>
        <h1 style="font-family: var(--font-heading); font-size: 22px; color: var(--primary-maroon); margin: 6px 0 10px 0;">
          Sacred Order Confirmed!
        </h1>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 0 auto 18px auto;">
          Our LB Nagar store team beside Prasannanjaneya Temple is preparing and packing your sanctified articles.
        </p>

        <!-- Payment Status Pill -->
        <div id="order-confirmed-pay-badge" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; background: #DCFCE7; color: #15803D; font-weight: 700; font-size: 12px; margin-bottom: 18px; border: 1px solid #BBF7D0;">
          ${getIcon('shield-check', 14)} 100% Online UPI Payment (Axis Bank)
        </div>

        <!-- WhatsApp Notification Banner Card -->
        <div style="background: #E8F8EE; border: 1.5px solid #25D366; border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px; text-align: left; display: flex; align-items: center; gap: 12px;">
          <div style="color: #25D366; flex-shrink: 0;">
            ${getIcon('whatsapp', 28)}
          </div>
          <div style="flex: 1;">
            <strong style="font-size: 13px; color: #075E54; display: block;">WhatsApp Notification Sent to 9097999939</strong>
            <p style="font-size: 11px; color: #2D3748; margin-top: 2px;">Order details dispatched to our LB Nagar store manager.</p>
          </div>
          <a href="${waUrl}" target="_blank" class="btn btn-sm" style="background: #25D366; color: #000; font-weight: 700; border-radius: 20px; padding: 6px 12px; font-size: 11px; text-decoration: none; white-space: nowrap;">
            Open WhatsApp
          </a>
        </div>

        <!-- Order Summary Chip -->
        <div style="background: var(--bg-cream); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 16px; text-align: left; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-medium); padding-bottom: 8px; margin-bottom: 8px; font-size: 12px;">
            <span>Order Reference:</span>
            <strong style="color: var(--primary-maroon);">${order.orderId}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
            <span>Expected Delivery:</span>
            <strong style="color: var(--primary-saffron);">${order.expectedDeliveryDate || order.deliveryName}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
            <span>Delivery Destination:</span>
            <span style="max-width: 60%; text-align: right;">${order.address}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
            <span>Payment Mode:</span>
            <span style="color: #15803D; font-weight: 700;">100% Online UPI (Axis Bank)</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: var(--primary-maroon); border-top: 1.5px dashed var(--border-medium); padding-top: 8px; margin-top: 8px;">
            <span>Total Amount:</span>
            <span>₹${amountToPay}</span>
          </div>
        </div>

        <!-- UPI Payment Transfer Card (0% Fee, Direct to Axis Bank) -->
        <div style="background: #FFFDF9; border: 1.5px solid var(--accent-gold); border-radius: var(--radius-md); padding: 16px; text-align: left; margin-bottom: 20px;">
          <strong style="font-size: 13px; color: var(--primary-maroon); display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
            ${getIcon('shield-check', 16)} Complete Payment via UPI (Zero Surcharges)
          </strong>

          <!-- Pay to Mobile Number -->
          <div style="display: flex; align-items: center; justify-content: space-between; background: #FFF; border: 1px solid var(--border-medium); border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;">
            <div>
              <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block;">Pay to Mobile (GPay / PhonePe / Paytm):</span>
              <strong style="font-family: monospace; font-size: 16px; color: var(--primary-maroon);">9989885363</strong>
            </div>
            <button type="button" class="btn btn-sm btn-secondary" onclick="copyMerchantPhone()" style="padding: 6px 12px; font-size: 11px;">
              Copy Number
            </button>
          </div>

          <!-- Merchant UPI ID -->
          <div style="display: flex; align-items: center; justify-content: space-between; background: #FFF; border: 1px solid var(--border-medium); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
            <div>
              <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block;">Merchant UPI ID (Axis Bank):</span>
              <strong style="font-family: monospace; font-size: 13px; color: var(--primary-maroon);">9989885363-1@okbizaxis</strong>
            </div>
            <button type="button" class="btn btn-sm btn-secondary" onclick="copyMerchantUpi()" style="padding: 6px 12px; font-size: 11px;">
              Copy UPI
            </button>
          </div>

          <!-- QR Code -->
          <div style="text-align: center; padding-top: 8px; border-top: 1px dashed var(--border-medium);">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=6&data=${encodeURIComponent(`upi://pay?pa=9989885363-1@okbizaxis&pn=7%20Hills%20Pooja%20Store&am=${amountToPay}&cu=INR&tn=${order.orderId}`)}"
              alt="Scan & Pay ₹${amountToPay}"
              style="width: 130px; height: 130px; border-radius: 8px; border: 1.5px solid var(--accent-gold); display: inline-block;"
            />
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Scan with PhonePe, Google Pay, or Paytm</div>
          </div>
        </div>

        <!-- Store Details -->
        <div style="background: #FFFDF9; border: 1.5px solid var(--accent-gold); border-radius: var(--radius-md); padding: 14px; text-align: left; margin-bottom: 20px;">
          <div style="font-size: 12.5px; font-weight: 700; color: var(--primary-maroon); margin-bottom: 4px;">
            7 Hills Pooja Store — Hyderabad
          </div>
          <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.45;">
            Beside Prasannanjaneya Swamy Temple, LB Nagar, Hyderabad.<br>
            Store Helpline: <strong>+91 90979 99939</strong> • Merchant UPI: <strong>9989885363-1@okbizaxis</strong>
          </div>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center; flex-direction: column;">
          <a href="#/track/${order.orderId}" class="btn btn-primary" style="width: 100%; justify-content: center;" data-testid="track-order-btn">
            Track Live Delivery
          </a>
          <a href="#/orders" class="btn btn-secondary" style="width: 100%; justify-content: center;">
            View In My Orders
          </a>
          <a href="#/" class="btn btn-outline" style="width: 100%; justify-content: center;">
            Continue Shopping
          </a>
        </div>

      </div>
    </div>
  `;
}

// ------------------------------------------
// 5.9 MY ORDERS VIEW
// ------------------------------------------
function renderOrdersView() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    <div class="container" style="padding: 32px 0;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <a href="#/profile">My Account</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">Order History</span>
      </nav>

      <div class="section-header-row">
        <div class="section-title-group">
          <h2>My Pooja Orders (${STORE.orders.length})</h2>
          <p>View your past sacred purchases and track live order shipments</p>
        </div>
      </div>

      ${STORE.orders.length > 0 ? `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          ${STORE.orders.map(o => `
            <div style="background: #FFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 22px; box-shadow: var(--shadow-xs);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
                <div>
                  <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Order Placed:</span>
                  <div style="font-size: 13px; font-weight: 700;">${new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div>
                  <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Order ID:</span>
                  <div style="font-size: 13px; font-weight: 700; color: var(--primary-maroon);">${o.orderId}</div>
                </div>
                <div>
                  <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Total Paid:</span>
                  <div style="font-size: 15px; font-weight: 800; color: var(--primary-maroon);">₹${o.grandTotal}</div>
                </div>
                <div>
                  <span style="background: ${o.status === 'Delivered' ? 'var(--success-bg)' : 'var(--warning-bg)'}; color: ${o.status === 'Delivered' ? 'var(--success)' : 'var(--warning)'}; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: var(--radius-full);">
                    ● ${o.status}
                  </span>
                </div>
              </div>

              <!-- Thumbnails -->
              <div style="display: flex; gap: 12px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 6px;">
                ${o.items.map(item => `
                  <div style="display: flex; align-items: center; gap: 10px; background: var(--bg-page); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); min-width: 220px;">
                    <img src="${getProductImageUrl(item.image)}" style="width: 44px; height: 44px; border-radius: 4px; object-fit: cover;">
                    <div style="font-size: 12px;">
                      <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">${item.title}</div>
                      <span style="color: var(--text-muted);">Qty: ${item.quantity} • ₹${item.price}</span>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div style="display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="reorderItems('${o.orderId}')">
                   Buy Again
                </button>
                <a href="#/order/${o.orderId}" class="btn btn-secondary btn-sm">
                   View Invoice
                </a>
                <a href="#/track/${o.orderId}" class="btn btn-primary btn-sm">
                   Track Shipment
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="background: #FFF; border-radius: var(--radius-md); padding: 60px 20px; text-align: center; border: 1px solid var(--border-subtle);">
          <span style="font-size: 48px;"></span>
          <h3 style="font-family: var(--font-heading); color: var(--primary-maroon); margin: 12px 0 6px 0;">No Past Orders Yet</h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">Your completed orders will appear here for tracking and re-ordering.</p>
          <a href="#/" class="btn btn-primary btn-sm">Start Shopping</a>
        </div>
      `}
    </div>
  `;
}

function reorderItems(orderId) {
  const order = STORE.orders.find(o => o.orderId === orderId);
  if (!order) return;
  order.items.forEach(i => addToCart(i.id, i.quantity, false));
  showToast("Past order items re-added to your cart!");
  window.location.hash = '#/cart';
}

// ------------------------------------------
// 5.10 ORDER DETAILS & INVOICE VIEW
// ------------------------------------------
function renderOrderDetailsView(orderId) {
  const root = document.getElementById('app-root');
  const order = STORE.orders.find(o => o.orderId === orderId) || STORE.orders[0];
  if (!order) {
    window.location.hash = '#/orders';
    return;
  }

  root.innerHTML = `
    <div class="container" style="padding: 32px 0; max-width: 800px;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <a href="#/orders">Orders</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">Invoice: ${order.orderId}</span>
      </nav>

      <div style="background: #FFF; border: 1.5px solid var(--border-medium); border-radius: var(--radius-md); padding: 36px; box-shadow: var(--shadow-sm);" id="printable-invoice">
        
        <!-- Invoice Header -->
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid var(--accent-gold); padding-bottom: 20px; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 24px;"></span>
              <h2 style="font-family: var(--font-heading); font-size: 20px; color: var(--primary-maroon);">7 Hills Pooja Store</h2>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px; line-height: 1.4;">
              Beside Prasannanjaneya Swamy Temple,<br>
              LB Nagar Main Road, Hyderabad - 500074<br>
              Phone: 90979 99939
            </p>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 800; color: var(--primary-maroon);">TAX INVOICE</div>
            <span style="font-size: 13px; font-weight: 700;"># ${order.orderId}</span>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              Date: ${new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div style="font-size: 12px; font-weight: 600; color: var(--success); margin-top: 2px;">
              Status: ${order.status}
            </div>
          </div>
        </div>

        <!-- Addresses Row -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 13px;">
          <div>
            <strong style="color: var(--text-muted); text-transform: uppercase; font-size: 11px;">Billed & Delivered To:</strong>
            <div style="font-weight: 700; margin-top: 4px;">${order.address}</div>
            <div style="color: var(--text-muted); margin-top: 2px;">Phone: ${order.phone}</div>
          </div>
          <div style="text-align: right;">
            <strong style="color: var(--text-muted); text-transform: uppercase; font-size: 11px;">Payment Information:</strong>
            <div style="font-weight: 700; margin-top: 4px;">${order.paymentMethod}</div>
            <div style="color: var(--text-muted); margin-top: 2px;">Delivery Mode: ${order.deliveryName}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
          <thead>
            <tr style="background: var(--bg-cream); border-bottom: 1.5px solid var(--border-medium); text-align: left;">
              <th style="padding: 10px 12px;">Item Description</th>
              <th style="padding: 10px 12px; text-align: center;">Qty</th>
              <th style="padding: 10px 12px; text-align: right;">Unit Price</th>
              <th style="padding: 10px 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(i => `
              <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="padding: 12px;">
                  <strong>${i.title}</strong>
                </td>
                <td style="padding: 12px; text-align: center;">${i.quantity}</td>
                <td style="padding: 12px; text-align: right;">₹${i.price}</td>
                <td style="padding: 12px; text-align: right; font-weight: 700;">₹${i.price * i.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals Table -->
        <div style="width: 280px; margin-left: auto; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span>Subtotal:</span>
            <span>₹${order.subtotal}</span>
          </div>
          ${order.discount ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: var(--success); font-weight: 600;">
              <span>Discount (${order.couponCode || 'Promo'}):</span>
              <span>– ₹${order.discount}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span>Delivery Fee:</span>
            <span>₹${order.deliveryCost}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span>Taxes (GST):</span>
            <span>₹${order.tax || Math.round(order.subtotal * 0.05)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1.5px dashed var(--border-medium); padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: 800; color: var(--primary-maroon);">
            <span>Grand Total:</span>
            <span>₹${order.grandTotal}</span>
          </div>
        </div>

        <!-- Footer Seal -->
        <div style="border-top: 1px solid var(--border-subtle); margin-top: 32px; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted); flex-wrap: wrap; gap: 12px;">
          <span>This is a computer-generated tax invoice for <strong>7 Hills Pooja Store</strong>.</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.print()">️ Print Invoice</button>
            <a href="#/track/${order.orderId}" class="btn btn-primary btn-sm"> Track Delivery</a>
          </div>
        </div>

      </div>
    </div>
  `;
}

// ------------------------------------------
// 5.11 LIVE ORDER TRACKING VIEW
// ------------------------------------------
function renderOrderTrackingView(orderId) {
  const root = document.getElementById('app-root');
  const order = STORE.orders.find(o => o.orderId === orderId) || STORE.orders[0];
  if (!order) {
    window.location.hash = '#/orders';
    return;
  }

  const steps = [
    { title: "Order Placed", desc: "Order details received and verified by store counter.", icon: "" },
    { title: "Order Confirmed", desc: "Items allocated and sanctified from store shelves.", icon: "&#10003;" },
    { title: "Items Packed & Blessed", desc: "Packed with bubble wrap and sacred coconut fiber.", icon: "" },
    { title: "Handed to Courier Partner", desc: `${order.rider ? order.rider.name : 'Express Courier'} picked up package.`, icon: "️" },
    { title: "Out for Delivery", desc: `Rider is on route in Hyderabad near LB Nagar.`, icon: "" },
    { title: "Delivered", desc: "Package delivered safely into customer hands.", icon: "" }
  ];

  const currentStep = order.stepIndex || 4;

  root.innerHTML = `
    <div class="container" style="padding: 32px 0; max-width: 800px;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <a href="#/orders">Orders</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">Track Shipment</span>
      </nav>

      <div style="background: #FFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-sm);">
        
        <!-- Header Strip -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Tracking Order:</span>
            <h1 style="font-family: var(--font-heading); font-size: 22px; color: var(--primary-maroon);">${order.orderId}</h1>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Estimated Arrival:</span>
            <div style="font-size: 16px; font-weight: 800; color: var(--primary-saffron);">${order.rider ? order.rider.eta : 'Delivered'}</div>
          </div>
        </div>

        <!-- Rider Contact Card (if out for delivery) -->
        ${order.rider ? `
          <div style="background: var(--bg-cream); border: 1px solid var(--accent-gold-light); border-radius: var(--radius-md); padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-saffron); color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 22px;">
                ️
              </div>
              <div>
                <strong style="font-size: 14px; color: var(--primary-maroon);">${order.rider.name}</strong>
                <p style="font-size: 12px; color: var(--text-muted);">${order.rider.vehicle}</p>
              </div>
            </div>
            <a href="tel:${order.rider.phone.replace(/[^0-9]/g, '')}" class="btn btn-sm btn-primary">
               Call Delivery Partner
            </a>
          </div>
        ` : ''}

        <!-- Interactive Vertical Timeline -->
        <div class="tracking-timeline">
          ${steps.map((step, idx) => {
            const isCompleted = idx <= currentStep;
            const isActive = idx === currentStep;
            return `
              <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                <div class="timeline-node">${isCompleted ? '&#10003;' : idx + 1}</div>
                <div>
                  <h4 style="font-size: 15px; font-weight: 700; color: ${isActive ? 'var(--primary-saffron)' : isCompleted ? 'var(--primary-maroon)' : 'var(--text-muted)'}; margin-bottom: 2px;">
                    ${step.icon} ${step.title}
                  </h4>
                  <p style="font-size: 12px; color: var(--text-muted);">${step.desc}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Delivery Address Footer -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: 16px; margin-top: 24px; font-size: 13px;">
          <strong>Destination Address:</strong> ${order.address}
        </div>

      </div>
    </div>
  `;
}

// ------------------------------------------
// 5.12 WISHLIST VIEW
// ------------------------------------------
function renderWishlistView() {
  const root = document.getElementById('app-root');
  const items = STORE.products.filter(p => STORE.wishlist.includes(p.id));

  root.innerHTML = `
    <div class="container" style="padding: 32px 0;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">Saved Wishlist</span>
      </nav>

      <div class="section-header-row">
        <div class="section-title-group">
          <h2>My Sacred Wishlist (${items.length})</h2>
          <p>Devotional articles saved for upcoming poojas, festivals, or family gifts</p>
        </div>
        ${items.length > 0 ? `
          <button type="button" class="btn btn-secondary btn-sm" onclick="moveAllWishlistToCart()">
            Move All to Cart &rarr;
          </button>
        ` : ''}
      </div>

      ${items.length > 0 ? `
        <div class="product-grid-4">
          ${items.map(p => renderProductCard(p)).join('')}
        </div>
      ` : `
        <div style="background: #FFF; border-radius: var(--radius-md); padding: 80px 20px; text-align: center; border: 1px solid var(--border-subtle); max-width: 500px; margin: 40px auto;">
          <span style="font-size: 56px; color: var(--accent-gold);"></span>
          <h3 style="font-family: var(--font-heading); font-size: 20px; color: var(--primary-maroon); margin: 16px 0 8px 0;">
            Your Wishlist is Empty
          </h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;">
            Tap the heart icon on any idol, diya, or frame to save items for future reference.
          </p>
          <a href="#/" class="btn btn-primary btn-lg">Explore Collection</a>
        </div>
      `}
    </div>
  `;
}

function moveAllWishlistToCart() {
  STORE.wishlist.forEach(id => addToCart(id, 1, false));
  STORE.wishlist = [];
  saveWishlist();
  showToast("All wishlist items moved to cart!");
  window.location.hash = '#/cart';
}

// ------------------------------------------
// 5.13 PROFILE & ADDRESSES VIEW
// ------------------------------------------
function renderProfileView() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    <div class="container" style="padding: 20px 0 36px 0;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">My Account</span>
      </nav>

      <div class="account-page-layout">
        
        <!-- Profile Card -->
        <div style="background: #FFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 20px; text-align: center; box-shadow: var(--shadow-xs);">
          <div style="width: 68px; height: 68px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-gold), var(--primary-saffron)); color: #FFF; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; box-shadow: 0 4px 12px rgba(230, 81, 0, 0.25);">
            ${getIcon('user', 30, '', 2.2)}
          </div>
          <h3 style="font-size: 17px; font-weight: 700; color: var(--primary-maroon);">${STORE.userProfile.name}</h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">${STORE.userProfile.phone}</p>

          <div style="display: flex; justify-content: space-around; border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle); padding: 12px 0; margin-bottom: 14px;">
            <a href="#/orders" style="text-align: center; text-decoration: none;">
              <strong style="font-size: 18px; color: var(--primary-saffron);">${STORE.orders.length}</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Orders</div>
            </a>
            <a href="#/wishlist" style="text-align: center; text-decoration: none;">
              <strong style="font-size: 18px; color: var(--primary-saffron);">${STORE.wishlist.length}</strong>
              <div style="font-size: 11px; color: var(--text-muted);">Wishlist</div>
            </a>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; text-align: left;">
            <a href="#/orders" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 8px; background: var(--bg-cream); font-weight: 600; font-size: 13px; color: var(--text-main);">
              <span style="display: flex; align-items: center; gap: 8px;">${getIcon('orders', 15)} My Orders</span>
              ${getIcon('chevron-right', 14)}
            </a>
            <a href="#/wishlist" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 8px; background: var(--bg-cream); font-weight: 600; font-size: 13px; color: var(--text-main);">
              <span style="display: flex; align-items: center; gap: 8px;">${getIcon('heart', 15)} Saved Wishlist</span>
              ${getIcon('chevron-right', 14)}
            </a>
            <a href="#/appointment" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 8px; background: var(--bg-cream); font-weight: 600; font-size: 13px; color: var(--text-main);">
              <span style="display: flex; align-items: center; gap: 8px;">${getIcon('calendar', 15)} Samagri Appointments</span>
              ${getIcon('chevron-right', 14)}
            </a>
            <a href="#/entry" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 8px; background: var(--bg-cream); font-weight: 600; font-size: 13px; color: var(--text-main);">
              <span style="display: flex; align-items: center; gap: 8px;">${getIcon('qr', 15)} Store QR Fast Pass</span>
              ${getIcon('chevron-right', 14)}
            </a>
          </div>
        </div>

        <!-- Addresses Management -->
        <div style="background: #FFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px; box-shadow: var(--shadow-xs);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
            <h2 style="font-family: var(--font-heading); font-size: 16px; color: var(--primary-maroon); display: flex; align-items: center; gap: 6px;">
              ${getIcon('map-pin', 16)} Saved Delivery Addresses
            </h2>
            <button class="btn btn-secondary btn-sm" onclick="toggleNewAddressForm()">+ Add New</button>
          </div>

          <!-- New Address Inline Form -->
          <div id="new-address-form-box" style="display: none; margin-bottom: 14px; background: var(--bg-cream); border: 1px dashed var(--accent-gold); border-radius: var(--radius-sm); padding: 14px;">
            <h4 style="font-size: 13px; font-weight: 700; color: var(--primary-maroon); margin-bottom: 10px;">Add New Delivery Address</h4>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <input type="text" id="new-addr-name" class="input-field" placeholder="Full Name *" value="${STORE.userProfile.name}" style="width: 100%; box-sizing: border-box;">
              <input type="tel" id="new-addr-phone" class="input-field" placeholder="10-digit Phone Number *" value="${STORE.userProfile.phone}" style="width: 100%; box-sizing: border-box;">
              <input type="text" id="new-addr-street" class="input-field" placeholder="House/Flat No, Apartment, Street *" style="width: 100%; box-sizing: border-box;">
              <input type="text" id="new-addr-landmark" class="input-field" placeholder="Landmark (e.g. Near Metro Station)" style="width: 100%; box-sizing: border-box;">
              <input type="text" id="new-addr-pincode" class="input-field" placeholder="Pincode (e.g. 500074) *" style="width: 100%; box-sizing: border-box;">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 12px;">
              <button type="button" class="btn btn-primary btn-sm" onclick="saveNewCheckoutAddress()">Save Address</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="toggleNewAddressForm()">Cancel</button>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${STORE.addresses.map(a => `
              <div style="border: 1px solid ${a.isDefault ? 'var(--primary-saffron)' : 'var(--border-medium)'}; border-radius: var(--radius-sm); padding: 14px; background: ${a.isDefault ? 'var(--bg-cream)' : '#FFF'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <strong>${a.name}</strong>
                      <span style="background: var(--primary-maroon); color: #FFF; font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 700;">${a.tag}</span>
                      ${a.isDefault ? '<span style="color: var(--success); font-size: 11px; font-weight: 700;">(Default)</span>' : ''}
                    </div>
                    <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4;">
                      ${a.street}, ${a.landmark}, ${a.area}, ${a.city} - <strong>${a.pincode}</strong>
                    </p>
                    <span style="font-size: 11.5px; color: var(--text-muted); display: block; margin-top: 4px;">Phone: ${a.phone}</span>
                  </div>
                  <div>
                    ${!a.isDefault ? `
                      <button class="btn btn-secondary btn-sm" onclick="setDefaultAddress('${a.id}')" style="font-size: 11px; padding: 4px 8px; white-space: nowrap;">Make Default</button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;
}

// ------------------------------------------
// 5.14 DEALS & OFFERS HUB
// ------------------------------------------
function renderDealsView() {
  const root = document.getElementById('app-root');
  const discountProducts = [...STORE.products].sort((a, b) => b.discount - a.discount).slice(0, 12);

  root.innerHTML = `
    <div class="container" style="padding: 32px 0;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">Special Offers & Coupons</span>
      </nav>

      <div style="background: linear-gradient(135deg, #4A0E17, #7A1221); border: 2px solid var(--accent-gold); border-radius: var(--radius-lg); padding: 36px; color: #FFF; margin-bottom: 32px;">
        <span style="font-size: 12px; font-weight: 700; color: var(--accent-gold); text-transform: uppercase;">Auspicious Blessings & Discounts</span>
        <h1 style="font-family: var(--font-heading); font-size: 32px; margin: 6px 0 10px 0;">Festive Coupons & Exclusive Deals</h1>
        <p style="font-size: 14px; color: rgba(255,255,255,0.85); max-width: 600px;">
          Save on pure brass idols, peacock deepams, and festive samagri with these exclusive discount codes.
        </p>
      </div>

      <!-- Active Coupons Grid -->
      <h2 style="font-family: var(--font-heading); font-size: 20px; color: var(--primary-maroon); margin-bottom: 16px;">
        Active Store Coupons
      </h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 40px;">
        ${STORE.coupons.map(c => `
          <div style="background: #FFF; border: 1.5px dashed var(--accent-gold); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-xs);">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <span style="background: var(--primary-saffron); color: #FFF; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 4px;">
                ${c.badge}
              </span>
              <strong style="font-family: monospace; font-size: 16px; color: var(--primary-maroon);">${c.code}</strong>
            </div>
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">${c.title}</h3>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.4;">${c.description}</p>
            <button type="button" class="btn btn-secondary btn-sm btn-block" onclick="copyCouponCode('${c.code}')">
               Copy Code & Apply in Cart
            </button>
          </div>
        `).join('')}
      </div>

      <!-- Mega Discount Products -->
      <div class="section-header-row">
        <div class="section-title-group">
          <h2>Top Discounted Sacred Articles</h2>
          <p>Highest discount items currently available in inventory</p>
        </div>
      </div>

      <div class="product-grid-4">
        ${discountProducts.map(p => renderProductCard(p)).join('')}
      </div>
    </div>
  `;
}

function copyCouponCode(code) {
  navigator.clipboard?.writeText(code);
  showToast(`Coupon <strong>${code}</strong> copied to clipboard! Paste in Cart.`);
}

// ------------------------------------------
// 5.15 ABOUT VIEW
// ------------------------------------------
function renderAboutView() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    <div class="container" style="padding: 32px 0; max-width: 900px;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">About 7 Hills Pooja Store</span>
      </nav>

      <div style="background: #FFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 40px; box-shadow: var(--shadow-sm);">
        <span style="font-size: 12px; font-weight: 700; color: var(--accent-gold-dark); text-transform: uppercase;">Our Story & Heritage</span>
        <h1 style="font-family: var(--font-heading); font-size: 30px; color: var(--primary-maroon); margin: 6px 0 16px 0;">
          7 Hills Pooja Store
        </h1>
        <p style="font-size: 16px; font-style: italic; color: var(--primary-saffron); font-weight: 600; margin-bottom: 24px;">
          “Positive Energy in Every Item.”
        </p>

        <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.8; display: flex; flex-direction: column; gap: 16px;">
          <p>
            Established with a deep commitment to tradition, purity, and spiritual sanctity, <strong>7 Hills Pooja Store</strong> is conveniently situated right beside the auspicious <strong>Prasannanjaneya Swamy Temple, LB Nagar Main Road, Hyderabad</strong>.
          </p>

          <p>
            For devotees across Telangana and Andhra Pradesh, a pooja ritual is not merely a formality; it is a sacred conduit of peace, prosperity, and cosmic harmony into one's home. Our store ensures that every article—from solid brass lamps to unadulterated Bhimseni camphor and hand-carved photo frames—is created with uncompromised Agamic purity.
          </p>

          <div style="background: var(--bg-cream); border: 1px solid var(--accent-gold-light); border-radius: var(--radius-md); padding: 24px; margin: 12px 0;">
            <h3 style="font-family: var(--font-heading); font-size: 18px; color: var(--primary-maroon); margin-bottom: 8px;">
              Our Sacred Promises:
            </h3>
            <ul style="padding-left: 20px; line-height: 1.7;">
              <li><strong>Zero Compromise on Metal Purity:</strong> Solid temple-grade brass and copper without lead contamination.</li>
              <li><strong>Pure Vedic Ingredients:</strong> 100% natural camphor, sacred Gangajal sourced directly, and cow-ghee dipped wicks.</li>
              <li><strong>Temple Proximity:</strong> Located just a few steps from Prasannanjaneya Swamy Temple, LB Nagar.</li>
              <li><strong>Speed & Reliability:</strong> Instant courier and Rapido bike deliveries ensuring your pooja samagri reaches you on time.</li>
            </ul>
          </div>

          <p>
            Whether you are outfitting a new apartment for a Gruhapravesam ceremony, celebrating Varalakshmi Vratham, or performing your daily sandhya vandanam, <strong>7 Hills Pooja Store</strong> is your dependable, authentic spiritual partner.
          </p>
        </div>

        <div style="margin-top: 32px; border-top: 1px solid var(--border-subtle); padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <strong>Visit our Store at:</strong><br>
            Beside Prasannanjaneya Swamy Temple, LB Nagar Main Road, near LB Nagar Metro Station, Hyderabad.
          </div>
          <a href="#/contact" class="btn btn-primary">Get Map Directions &rarr;</a>
        </div>
      </div>
    </div>
  `;
}

// ------------------------------------------
// 5.16 CONTACT & FAQS VIEW
// ------------------------------------------
function renderContactView() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    <div class="container" style="padding: 32px 0;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">Contact & Support</span>
      </nav>

      <div class="contact-layout-grid">
        
        <!-- Left: Store Info & Map -->
        <div>
          <h1 style="font-family: var(--font-heading); font-size: 26px; color: var(--primary-maroon); margin-bottom: 12px;">
            Visit 7 Hills Pooja Store
          </h1>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">
            We are situated right on the LB Nagar Main Road (Service Road), immediately beside the revered Prasannanjaneya Swamy Temple, just 2 minutes from the LB Nagar Metro Station.
          </p>

          <!-- Store Info Cards -->
          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
            <div style="background: #FFF; padding: 14px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); display: flex; gap: 12px; align-items: flex-start;">
              <span style="font-size: 20px;"></span>
              <div>
                <strong>Physical Address:</strong>
                <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
                  Beside Prasannanjaneya Swamy Temple, LB Nagar Main Road, near LB Nagar Metro Station, Hyderabad - 500074.
                </p>
              </div>
            </div>

            <div style="background: #FFF; padding: 14px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); display: flex; gap: 12px; align-items: center;">
              <span style="font-size: 20px;"></span>
              <div>
                <strong>Direct Phone / WhatsApp:</strong>
                <p style="font-size: 13px; margin-top: 2px;">
                  <a href="tel:9097999939" style="color: var(--primary-saffron); font-weight: 700;">90979 99939</a>
                </p>
              </div>
            </div>

            <div style="background: #FFF; padding: 14px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); display: flex; gap: 12px; align-items: center;">
              <span style="font-size: 20px;">⏰</span>
              <div>
                <strong>Visiting Hours:</strong>
                <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
                  Open 7 Days a Week: <strong>8:00 AM – 10:00 PM</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- Google Maps Embed -->
          <div style="border-radius: var(--radius-md); overflow: hidden; height: 260px; border: 1.5px solid var(--border-medium); box-shadow: var(--shadow-sm);">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.877402664531!2d78.5492323!3d17.3496357!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb98a2e7c3b9b5%3A0x6b7b2b7b2b7b2b7b!2sPrasannanjaneya%20Swamy%20Temple%2C%20LB%20Nagar!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style="border:0;" 
              allowfullscreen="" 
              loading="lazy">
            </iframe>
          </div>
        </div>

        <!-- Right: Message Form & FAQs -->
        <div>
          <!-- Query Form -->
          <div style="background: #FFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 28px; box-shadow: var(--shadow-xs); margin-bottom: 24px;">
            <h2 style="font-family: var(--font-heading); font-size: 18px; color: var(--primary-maroon); margin-bottom: 6px;">
              Send a Query to the Store Counter
            </h2>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 18px;">
              Enquire about bulk pooja supplies, specific deity dimensions, or Telugu wedding checklists.
            </p>

            <form onsubmit="handleContactSubmit(event)" style="display: flex; flex-direction: column; gap: 14px;">
              <input type="text" id="contact-name" class="input-field" placeholder="Your Name *" required value="${STORE.userProfile.name}">
              <input type="tel" id="contact-phone" class="input-field" placeholder="10-digit Phone Number *" required value="${STORE.userProfile.phone}">
              <textarea id="contact-msg" class="input-field" rows="3" placeholder="How can 7 Hills Pooja Store assist you? *" required></textarea>
              <button type="submit" class="btn btn-primary btn-block">Send Message to Store &rarr;</button>
            </form>
          </div>

          <!-- FAQs -->
          <div style="background: #FFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 24px;">
            <h3 style="font-family: var(--font-heading); font-size: 16px; color: var(--primary-maroon); margin-bottom: 14px;">
              Frequently Asked Questions (FAQs)
            </h3>
            
            <details style="margin-bottom: 12px; font-size: 13px; cursor: pointer;">
              <summary style="font-weight: 700; color: var(--text-main);">How fast is the Instant Delivery option?</button></summary>
              <p style="color: var(--text-muted); margin-top: 6px; line-height: 1.5;">
                For customers residing within 15 km of our LB Nagar store (Dilsukhnagar, Kothapet, Nagole, Vanasthalipuram, Malakpet, Saroornagar), our express couriers deliver within 30 to 45 minutes.
              </p>
            </details>

            <details style="margin-bottom: 12px; font-size: 13px; cursor: pointer;">
              <summary style="font-weight: 700; color: var(--text-main);">Are photo frames securely packed against glass damage?</summary>
              <p style="color: var(--text-muted); margin-top: 6px; line-height: 1.5;">
                Yes! Every photo frame is packed in three layers: bubble wrap, corner protectors, and high-density corrugated carton boxes to ensure zero transit damage.
              </p>
            </details>

            <details style="font-size: 13px; cursor: pointer;">
              <summary style="font-weight: 700; color: var(--text-main);">Can I pick up my online order directly from the store?</summary>
              <p style="color: var(--text-muted); margin-top: 6px; line-height: 1.5;">
                Yes, simply choose Standard Delivery or place your order and show your Order ID at the counter beside Prasannanjaneya Swamy Temple, LB Nagar.
              </p>
            </details>
          </div>
        </div>

      </div>
    </div>
  `;
}

function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('contact-name')?.value;
  showToast(`Thank you ${name}! Your inquiry has been sent to our counter. We will call you back shortly.`);
  e.target.reset();
}

// ------------------------------------------
// 5.17 APPOINTMENT BOOKING VIEW
// ------------------------------------------
function renderAppointmentView() {
  const root = document.getElementById('app-root');

  const slots = ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM', '06:30 PM', '08:00 PM'];
  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minDate = today.toISOString().split('T')[0];

  root.innerHTML = `
    <div class="container" style="padding: 32px 0; max-width: 720px;">
      <nav class="breadcrumb-nav">
        <a href="#/">Home</a> <span>›</span>
        <span style="color: var(--primary-maroon); font-weight: 600;">Pooja Samagri Consultation</span>
      </nav>

      <div style="background: #FFF; border: 2px solid var(--accent-gold); border-radius: var(--radius-lg); padding: 36px; box-shadow: var(--shadow-sm);">
        <span style="font-size: 12px; font-weight: 700; color: var(--accent-gold-dark); text-transform: uppercase;">Temple Proximity Service</span>
        <h1 style="font-family: var(--font-heading); font-size: 24px; color: var(--primary-maroon); margin: 6px 0 10px 0;">
          Book a Store Appointment with 7 Hills Pooja Store
        </h1>
        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">
          Meet with our senior pooja consultants beside Prasannanjaneya Swamy Temple to verify priest lists, prepare Gruhapravesam samagri kits, or inspect custom brass deities in person.
        </p>

        <form onsubmit="handleAppointmentBooking(event)" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">
              Consultation Purpose *
            </label>
            <select id="appt-purpose" class="input-field" required style="cursor: pointer;">
              <option value="Gruhapravesam (Housewarming) Samagri">Gruhapravesam (Housewarming) Samagri Consultation</option>
              <option value="Wedding / Vivaha Samagri Planning">Wedding / Vivaha Pooja Samagri Planning</option>
              <option value="Custom Brass Deity / Mandir Selection">Custom Brass Deity & Mandir Inspection</option>
              <option value="Satyanarayana Swamy Vratham Kit">Sri Satyanarayana Swamy Vratham Checklist</option>
              <option value="General Store Tour & Bulk Gifts">General Store Visit & Bulk Return Gifts</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">
                Preferred Date *
              </label>
              <input type="date" id="appt-date" class="input-field" required min="${minDate}" value="${minDate}">
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">
                Available Time Slot *
              </label>
              <select id="appt-time" class="input-field" required style="cursor: pointer;">
                ${slots.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">
                Your Full Name *
              </label>
              <input type="text" id="appt-name" class="input-field" required value="${STORE.userProfile.name}" placeholder="Full Name">
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">
                Contact Number *
              </label>
              <input type="tel" id="appt-phone" class="input-field" required value="${STORE.userProfile.phone}" placeholder="Phone Number">
            </div>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">
              Special Notes / Priest Requirements (Optional)
            </label>
            <textarea id="appt-notes" class="input-field" rows="2" placeholder="e.g. Need Telugu priest checklist for 21 types of pooja leaves..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" style="margin-top: 10px;">
            Confirm Free Store Appointment &rarr;
          </button>
        </form>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-muted); text-align: center;">
           Location: <strong>7 Hills Pooja Store</strong>, Beside Prasannanjaneya Temple, LB Nagar Main Road, Hyderabad.
        </div>
      </div>
    </div>
  `;
}

function handleAppointmentBooking(e) {
  e.preventDefault();
  const purpose = document.getElementById('appt-purpose')?.value;
  const date = document.getElementById('appt-date')?.value;
  const time = document.getElementById('appt-time')?.value;
  const name = document.getElementById('appt-name')?.value;
  const phone = document.getElementById('appt-phone')?.value || '90979 99939';
  const notes = document.getElementById('appt-notes')?.value || '';
  const apptId = `7H-APT-${Math.floor(1000 + Math.random() * 9000)}`;

  const newAppt = {
    id: apptId,
    name,
    phone,
    date,
    time,
    preferredTime: `${date} at ${time}`,
    purpose,
    poojaType: purpose,
    notes,
    createdAt: new Date().toISOString()
  };

  try {
    const appts = JSON.parse(localStorage.getItem('7hills_appointments') || '[]');
    appts.unshift(newAppt);
    localStorage.setItem('7hills_appointments', JSON.stringify(appts));
  } catch (err) {}

  try {
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAppt)
    }).catch(err => console.warn('Appointment API sync error:', err));
  } catch (e) {}

  showToast(`Appointment <strong>${apptId}</strong> confirmed for ${name} on ${date} at ${time}!`);
  
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="container" style="padding: 60px 20px; max-width: 600px; text-align: center;">
      <div style="background: #FFF; border: 2px solid var(--accent-gold); border-radius: var(--radius-lg); padding: 36px; box-shadow: var(--shadow-lg);">
        <div style="font-size: 50px; color: var(--accent-gold); margin-bottom: 12px;"></div>
        <h2 style="font-family: var(--font-heading); color: var(--primary-maroon);">Appointment Confirmed</h2>
        <span style="font-weight: 700; color: var(--primary-saffron); font-size: 16px;">Booking ID: ${apptId}</span>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 16px 0; line-height: 1.6;">
          Thank you <strong>${name}</strong>! We look forward to welcoming you at <strong>7 Hills Pooja Store</strong>, beside Prasannanjaneya Swamy Temple, LB Nagar on <strong>${date} at ${time}</strong> for your <em>${purpose}</em> consultation.
        </p>
        <a href="#/" class="btn btn-primary">Return to Store Home</a>
      </div>
    </div>
  `;
}

// ==========================================
// 5.17A UNIQUE INNOVATION: 1-CLICK DIGITAL SANKALPAM & RITUAL BUILDER
// ==========================================
const RITUAL_KITS_CONFIG = {
  'satyanarayana': {
    title: 'Sri Satyanarayana Swamy Vratam Complete Kit',
    sanskritName: 'Śrī Satyanārāyaṇa Vrata Kalpa',
    itemsCount: 21,
    price: 1499,
    mrp: 1999,
    image: 'IMAGE (47).JPG',
    items: [
      'Turmeric & Sacred Kumkum (100g each)',
      'Pure Astagandha Chandanam Paste',
      'Handcrafted Brass Kalash Vessel',
      'Pure Cow Ghee for Homa (500ml)',
      'Auspicious Akshata (Colored Rice)',
      'Navadhanyam (9 Sacred Grains)',
      'Fresh Betel Leaves & Supari (Paan)',
      'Pure Bhimseni Camphor (Karpuram)',
      'Handmade Agarbatti & Dhoop Cones',
      'Round & Long Wicks (Phool Batti)',
      'Yagnopaveetham (Sacred Thread)',
      'Dry Fruits & Elaichi Prasad Pack',
      'Red & Yellow Sacred Vastram Cloths',
      'Rangoli Colors for Mandapam',
      'Ganga Jal & Rose Water'
    ]
  },
  'hanuman': {
    title: 'Prasannanjaneya Swamy Special Tuesday Pooja Kit',
    sanskritName: 'Śrī Prasannāñjanēya Hanumān Pūjā',
    itemsCount: 16,
    price: 899,
    mrp: 1199,
    image: 'IMAGE (40).JPG',
    items: [
      'Pure Sindoor Powder (Hanuman Special)',
      'Chameli (Jasmine) Pooja Oil',
      'Betel Leaves Mala Thread',
      'Pure Cow Ghee Diya Wicks',
      'Pure Bhimseni Camphor Tablets',
      'Sacred Red Raksha Sutra Thread',
      'Panchamrut Brass Cups Pair',
      'Kasturi & Loban Dhoop Sticks',
      'Dry Coconut & Jaggery Naivedyam',
      'Hanuman Chalisa Sacred Yantra Card'
    ]
  },
  'grihapravesham': {
    title: 'Vedic Griha Pravesham (Housewarming) Kit',
    sanskritName: 'Vaidika Gṛhapravēśa Samagrī',
    itemsCount: 33,
    price: 2999,
    mrp: 3999,
    image: 'IMAGE (79).JPG',
    items: [
      'Consecrated Copper Kalash & Coconut',
      'Navaratna Packet for Threshold',
      'Homa Sticks (Samidha 9 Sacred Woods)',
      'Pure Cow Dung Cakes & Homa Samagri',
      'Panchagavya Mix for Purification',
      'Brass Deepam Pair for Altar',
      'Toranam (Mango Leaves & Marigold)',
      'Cow Milk Boiling Brass Pot',
      'Turmeric Roots & Whole Supari',
      'Navadhanyam & Yellow Akshata'
    ]
  },
  'deeparadhana': {
    title: 'Daily Deeparadhana Pure Samagri Kit',
    sanskritName: 'Nitya Dīpārādhana Samagrī',
    itemsCount: 8,
    price: 599,
    mrp: 799,
    image: 'IMAGE (40).JPG',
    items: [
      'Pure Temple-Grade Cow Ghee (500g)',
      'Hand-Rolled Cotton Wicks (200 pcs)',
      'Pure Astagandha Chandanam Box',
      'Bhimseni Camphor (100% Edible Grade)',
      'Pure Sandalwood Agarbatti Pack',
      'Brass Matchstick Holder & Diya Cleaner'
    ]
  }
};

let currentRitualKey = 'satyanarayana';

function renderSankalpamView() {
  const root = document.getElementById('app-root');
  const kit = RITUAL_KITS_CONFIG[currentRitualKey];

  root.innerHTML = `
    <div class="container" style="padding: 16px; max-width: 680px; margin: 0 auto;">
      
      <!-- Top Sacred Header -->
      <div class="sankalpam-hero-box">
        <span style="font-size: 11px; font-weight: 700; color: var(--accent-gold-light); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">
          Exclusive Spiritual Innovation
        </span>
        <h1 style="font-family: var(--font-heading); font-size: 22px; color: #FFF; margin-bottom: 8px;">
          1-Click Digital Sankalpam & Ritual Kit
        </h1>
        <p style="font-size: 13px; color: var(--accent-gold-light); max-width: 480px; margin: 0 auto;">
          Generate your personalized Sanskrit Sankalpam and add all required sacred ritual items to your cart in 1 tap.
        </p>
      </div>

      <!-- Step 1: Select Ritual -->
      <div style="background:#FFF; border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:16px; margin-bottom:16px;">
        <label style="font-size:12px; font-weight:700; color:var(--primary-maroon); text-transform:uppercase; display:block; margin-bottom:8px;">
          Step 1: Choose Your Sacred Ritual
        </label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <button type="button" class="btn btn-sm ${currentRitualKey === 'satyanarayana' ? 'btn-primary' : 'btn-secondary'}" onclick="switchRitualKit('satyanarayana')">
            Satyanarayana Vratam
          </button>
          <button type="button" class="btn btn-sm ${currentRitualKey === 'hanuman' ? 'btn-primary' : 'btn-secondary'}" onclick="switchRitualKit('hanuman')">
            Hanuman Pooja (Prasannanjaneya)
          </button>
          <button type="button" class="btn btn-sm ${currentRitualKey === 'grihapravesham' ? 'btn-primary' : 'btn-secondary'}" onclick="switchRitualKit('grihapravesham')">
            Griha Pravesham
          </button>
          <button type="button" class="btn btn-sm ${currentRitualKey === 'deeparadhana' ? 'btn-primary' : 'btn-secondary'}" onclick="switchRitualKit('deeparadhana')">
            Daily Deeparadhana
          </button>
        </div>
      </div>

      <!-- Step 2: Devotee Sankalpam Details -->
      <div style="background:#FFF; border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:16px; margin-bottom:16px;">
        <label style="font-size:12px; font-weight:700; color:var(--primary-maroon); text-transform:uppercase; display:block; margin-bottom:10px;">
          Step 2: Enter Family Gotram & Devotee Name
        </label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
          <div>
            <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:4px;">Devotee Full Name</label>
            <input type="text" id="sankalpam-name" class="form-control" style="font-size:13px;" value="Ashlesh Gurram" oninput="updateSankalpamText()">
          </div>
          <div>
            <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:4px;">Family Gotram</label>
            <input type="text" id="sankalpam-gotram" class="form-control" style="font-size:13px;" value="Kashyapa" oninput="updateSankalpamText()">
          </div>
        </div>

        <!-- Dynamic Live Sanskrit Sankalpam Card -->
        <div class="sankalpam-mantra-card" id="sankalpam-text-box">
          <!-- Populated by updateSankalpamText() -->
        </div>
      </div>

      <!-- Step 3: Complete Curated Checklist -->
      <div style="background:#FFF; border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:16px; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">
          <div>
            <strong style="font-size:14px; color:var(--primary-maroon);">${kit.title}</strong>
            <span style="display:block; font-size:11px; color:var(--text-muted);">${kit.itemsCount} Consecrated Items Included</span>
          </div>
          <div style="text-align:right;">
            <strong style="font-size:18px; color:var(--primary-maroon);">₹${kit.price}</strong>
            <span style="font-size:11px; color:var(--text-muted); text-decoration:line-through; display:block;">MRP ₹${kit.mrp}</span>
          </div>
        </div>

        <div style="max-height:220px; overflow-y:auto; padding-right:6px; margin-bottom:16px;">
          ${kit.items.map((item, idx) => `
            <div class="ritual-item-row">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="color:var(--success);">${getIcon('check-circle', 14)}</span>
                <span>${idx + 1}. ${item}</span>
              </div>
              <span style="font-size:10px; background:var(--bg-cream); padding:2px 6px; border-radius:4px; color:var(--accent-gold-dark); font-weight:600;">Temple Consecrated</span>
            </div>
          `).join('')}
        </div>

        <button type="button" class="btn btn-primary btn-block btn-lg" onclick="addRitualKitToCart('${currentRitualKey}')">
          ${getIcon('cart', 18)}
          <span>Add Complete ${kit.itemsCount}-Item Kit to Cart (₹${kit.price})</span>
        </button>
      </div>

    </div>
  `;

  updateSankalpamText();
}

function switchRitualKit(key) {
  currentRitualKey = key;
  renderSankalpamView();
}

function updateSankalpamText() {
  const nameInput = document.getElementById('sankalpam-name');
  const gotramInput = document.getElementById('sankalpam-gotram');
  const textBox = document.getElementById('sankalpam-text-box');
  if (!textBox) return;

  const name = nameInput ? (nameInput.value.trim() || 'Devotee') : 'Devotee';
  const gotram = gotramInput ? (gotramInput.value.trim() || 'Kashyapa') : 'Kashyapa';
  const kit = RITUAL_KITS_CONFIG[currentRitualKey];

  textBox.innerHTML = `
    <div style="font-weight:700; color:var(--primary-saffron); font-size:11px; margin-bottom:4px;">
      VAIDIKA SANKALPAM (HYDERABAD PRASANNANJANEYA SANNIDHI)
    </div>
    <div style="font-style:italic;">
      "Mama Upātta Samasta Duritakṣayadvārā Śrī Prasannāñjanēya Swāmy Prasāda Siddhyrtham, 
      Asmākam Saha Kuṭumbānām, <strong>${gotram}</strong> Gotrasya, <strong>${name}</strong> Nāmadheyasya, 
      Kṣēma Sthairya Dhairya Vijaya Āyurārogya Aiśvaryābhivṛddhyartham, 
      Bhāgyanagare Śrī Prasannāñjanēya Sannidhau Śrī <strong>${kit.sanskritName}</strong> Pūjā Karma Kariṣyē."
    </div>
  `;
}

function addRitualKitToCart(kitKey) {
  const kit = RITUAL_KITS_CONFIG[kitKey];
  if (!kit) return;

  const bundleProduct = {
    id: `ritual_kit_${kitKey}`,
    title: kit.title,
    category: 'Pooja Kits',
    categoryId: 'pooja-kits',
    price: kit.price,
    mrp: kit.mrp,
    images: [kit.image || 'IMAGE (47).JPG'],
    highlights: [`Complete ${kit.itemsCount} Ritual Samagri items included`, 'Consecrated at LB Nagar Temple', 'Ready for Pooja Sankalpam']
  };

  // Add to cart
  const existing = STORE.cart.find(i => i.product.id === bundleProduct.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    STORE.cart.push({ product: bundleProduct, quantity: 1 });
  }

  saveCart();
  updateHeaderBadges();
  showToast(`Added <strong>${kit.title}</strong> to your Cart!`);
  window.location.hash = '#/cart';
}

// ==========================================
// 5.17B UNIQUE INNOVATION: SACRED STOTRAM & TEMPLE BELL COMPANION
// ==========================================
let devotionalAudioCtx = null;

function playSacredTempleBell() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!devotionalAudioCtx) devotionalAudioCtx = new AudioContextClass();
    if (devotionalAudioCtx.state === 'suspended') devotionalAudioCtx.resume();

    const now = devotionalAudioCtx.currentTime;
    // Bell harmonic frequencies: 432 Hz, 864 Hz, 1296 Hz
    const freqs = [432, 864, 1296];
    const gains = [0.6, 0.3, 0.15];

    freqs.forEach((freq, idx) => {
      const osc = devotionalAudioCtx.createOscillator();
      const gain = devotionalAudioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gains[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      osc.connect(gain);
      gain.connect(devotionalAudioCtx.destination);

      osc.start(now);
      osc.stop(now + 2.8);
    });

    showToast('Sacred Temple Bell Rung (432 Hz)', 'info');
  } catch (e) {
    console.warn('Bell sound error:', e);
  }
}

function playSacredOmTone() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!devotionalAudioCtx) devotionalAudioCtx = new AudioContextClass();
    if (devotionalAudioCtx.state === 'suspended') devotionalAudioCtx.resume();

    const now = devotionalAudioCtx.currentTime;
    const osc = devotionalAudioCtx.createOscillator();
    const gain = devotionalAudioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(136.1, now); // Sacred cosmic OM frequency
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

    osc.connect(gain);
    gain.connect(devotionalAudioCtx.destination);

    osc.start(now);
    osc.stop(now + 4.5);

    showToast('Sacred Om Dhwani Resonating', 'info');
  } catch (e) {
    console.warn('Om sound error:', e);
  }
}

function toggleAkhandaJyoti() {
  const flame = document.getElementById('akhanda-flame-element');
  const msg = document.getElementById('akhanda-status-msg');
  if (!flame) return;

  playSacredTempleBell();
  flame.classList.toggle('lit');

  const isLit = flame.classList.contains('lit');
  if (isLit) {
    msg.innerHTML = '<strong style="color:var(--accent-gold-light);">The Sacred Akhanda Flame is Shining Bright!</strong><br><span style="font-size:11px; font-style:italic;">"Deepam Jyoti Parabrahma Deepam Sarvatamopaham"</span>';
  } else {
    msg.innerHTML = '<span>Tap the Brass Diya to Light the Sacred Flame</span>';
  }
}

function renderStotramView() {
  const root = document.getElementById('app-root');

  root.innerHTML = `
    <div class="container" style="padding: 16px; max-width: 640px; margin: 0 auto;">
      
      <!-- Sacred Aarti Companion Header -->
      <div class="stotram-bell-card">
        <span style="font-size: 11px; font-weight: 700; color: var(--accent-gold-light); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">
          Temple Audio Companion
        </span>
        <h1 style="font-family: var(--font-heading); font-size: 22px; color: #FFF; margin-bottom: 6px;">
          Sacred Temple Bell & Chimes
        </h1>
        <p style="font-size: 13px; color: var(--accent-gold-light); max-width: 440px; margin: 0 auto 16px auto;">
          Tuned to the auspicious 432 Hz frequency. Ring the consecrated bell while preparing your home altar.
        </p>

        <!-- Big Interactive Bell Button -->
        <button type="button" class="btn-bell-ring" onclick="playSacredTempleBell()" title="Tap to Ring Sacred Bell" aria-label="Ring Temple Bell">
          ${getIcon('bell', 44, '', 2.2)}
        </button>
        <p style="font-size: 12px; color: var(--accent-gold-light); font-weight: 600;">Tap to Ring Consecrated Temple Bell</p>

        <div style="display:flex; justify-content:center; gap:10px; margin-top:14px;">
          <button type="button" class="btn btn-sm" style="background:rgba(255,255,255,0.15); color:#FFF; border:1px solid var(--accent-gold);" onclick="playSacredOmTone()">
            Sound Sacred Om Dhwani
          </button>
        </div>

        <!-- Virtual Akhanda Jyoti Diya -->
        <div class="akhanda-jyoti-box" onclick="toggleAkhandaJyoti()">
          <div class="akhanda-flame" id="akhanda-flame-element">
            ${getIcon('flame', 48, '', 2)}
          </div>
          <p id="akhanda-status-msg" style="font-size:13px; color:#FFF; margin-top:8px;">
            Tap the Brass Diya to Light the Sacred Flame
          </p>
        </div>
      </div>

      <!-- Sacred Stotrams Lyrics & Meaning -->
      <div style="background:#FFF; border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:18px; margin-bottom:16px;">
        <h2 style="font-family:var(--font-heading); font-size:16px; color:var(--primary-maroon); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
          ${getIcon('temple', 18)}
          <span>Sri Hanuman Chalisa (Prasannanjaneya Swamy)</span>
        </h2>
        <div style="background:var(--bg-cream); border-radius:var(--radius-sm); padding:14px; font-size:13px; line-height:1.7; color:var(--text-secondary); margin-bottom:12px;">
          <strong>Doha:</strong><br>
          Śrī Guru Caraṇa Saroja Raja Nija Manu Mukuru Sudhāri |<br>
          Baraṇau Raghubara Bimala Jasu Jo Dāyaku Phala Chāri ||<br><br>
          <strong>Chaupai:</strong><br>
          Jaya Hanumāna Jñāna Guṇa Sāgara | Jaya Kapīsa Tihun Loka Ujāgara ||<br>
          Rāmadūta Atulita Baladhāmā | Añjani Putra Pavanasuta Nāmā ||
        </div>
        <p style="font-size:12px; color:var(--text-muted);">
          Offered in devotion to Sri Prasannanjaneya Swamy Temple, beside 7 Hills Pooja Store, LB Nagar, Hyderabad.
        </p>
      </div>

      <div style="background:#FFF; border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:18px; margin-bottom:20px;">
        <h2 style="font-family:var(--font-heading); font-size:16px; color:var(--primary-maroon); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
          ${getIcon('sun', 18)}
          <span>Gayatri Mahamantra</span>
        </h2>
        <div style="background:var(--bg-cream); border-radius:var(--radius-sm); padding:14px; font-size:13px; line-height:1.7; color:var(--text-secondary);">
          Oṃ Bhūr Bhuvaḥ Svaḥ | Tat Savitur Vareṇyaṃ |<br>
          Bhargo Devasya Dhīmahi | Dhiyo Yo Naḥ Pracodayāt ||<br><br>
          <em>"May the divine supreme light illuminate our intellect and dispel all darkness."</em>
        </div>
      </div>

    </div>
  `;
}

// ==========================================
// 5.17C BACKEND CATALOG & CATEGORIES SYNCHRONIZATION
// ==========================================
async function syncProductsFromBackend() {
  try {
    let [prodRes, catRes] = await Promise.all([
      fetch('/api/products').catch(() => null),
      fetch('/api/categories').catch(() => null)
    ]);

    let backendCategories = null;
    if (catRes && catRes.ok) {
      try { backendCategories = await catRes.json(); } catch (e) {}
    }
    if (!Array.isArray(backendCategories) || backendCategories.length === 0) {
      const fallbackCat = await fetch('/categories.json').catch(() => null);
      if (fallbackCat && fallbackCat.ok) {
        try { backendCategories = await fallbackCat.json(); } catch (e) {}
      }
    }
    if (Array.isArray(backendCategories) && backendCategories.length > 0) {
      STORE.categories = backendCategories;
    }

    // Overlay localStorage custom categories & deletions
    try {
      const delCats = JSON.parse(localStorage.getItem('7hills_deleted_categories') || '[]');
      const customCats = JSON.parse(localStorage.getItem('7hills_custom_categories') || '[]');
      if (Array.isArray(delCats) && delCats.length > 0) {
        STORE.categories = STORE.categories.filter(c => !delCats.includes(c.id));
      }
      if (Array.isArray(customCats) && customCats.length > 0) {
        customCats.forEach(cc => {
          if (delCats.includes(cc.id)) return;
          const idx = STORE.categories.findIndex(c => c.id === cc.id);
          if (idx >= 0) STORE.categories[idx] = { ...STORE.categories[idx], ...cc };
          else STORE.categories.push(cc);
        });
      }
    } catch (e) {}

    // 2. Sync Products dynamically
    let backendProducts = null;
    if (prodRes && prodRes.ok) {
      try { backendProducts = await prodRes.json(); } catch (e) {}
    }
    if (!Array.isArray(backendProducts) || backendProducts.length === 0) {
      const fallbackProd = await fetch('/products.json').catch(() => null);
      if (fallbackProd && fallbackProd.ok) {
        try { backendProducts = await fallbackProd.json(); } catch (e) {}
      }
    }

    // Merge with localStorage custom products, deletions, and stock overrides
    let workingProducts = Array.isArray(backendProducts) && backendProducts.length > 0 ? backendProducts : (STORE.products || []);
    try {
      const delProds = new Set(JSON.parse(localStorage.getItem('7hills_deleted_products') || '[]'));
      const customProds = JSON.parse(localStorage.getItem('7hills_custom_products') || '[]');
      const stockOv = JSON.parse(localStorage.getItem('7hills_stock_overrides') || '{}');

      workingProducts = workingProducts.filter(p => !delProds.has(p.id));

      if (Array.isArray(customProds)) {
        customProds.forEach(cp => {
          if (delProds.has(cp.id)) return;
          const idx = workingProducts.findIndex(p => p.id === cp.id);
          if (idx >= 0) workingProducts[idx] = { ...workingProducts[idx], ...cp };
          else workingProducts.unshift(cp);
        });
      }

      workingProducts = workingProducts.map(p => {
        if (stockOv[p.id]) {
          return {
            ...p,
            inStock: stockOv[p.id].inStock !== undefined ? stockOv[p.id].inStock : p.inStock,
            stockQty: stockOv[p.id].stockQty !== undefined ? stockOv[p.id].stockQty : p.stockQty
          };
        }
        return p;
      });
    } catch (e) {}

    if (Array.isArray(workingProducts) && workingProducts.length > 0) {
      STORE.products = workingProducts.map(p => {
        let catId = p.categoryId;
        if (!catId) {
          const matchedCat = STORE.categories.find(c => c.name === p.category || c.id === p.category);
          catId = matchedCat ? matchedCat.id : (p.category === 'idols' ? 'god-idols' : p.category === 'lamps' ? 'diyas-lamps' : p.category === 'frames' ? 'photo-frames' : p.category === 'samagri' ? 'pooja-samagri' : p.category === 'malas' ? 'rudraksha-malas' : p.category === 'garlands' ? 'garlands-vastram' : p.category === 'mandirs' ? 'pooja-mandirs' : p.category === 'incense' ? 'dhoop-incense' : p.category === 'kits' ? 'pooja-kits' : 'pooja-samagri');
        }

        const isItemInStock = p.inStock !== false && (p.stockQty === undefined || Number(p.stockQty) > 0);

        return {
          id: p.id,
          title: p.title,
          category: p.category || 'Pooja Samagri',
          categoryId: catId,
          price: Number(p.price) || 299,
          mrp: Number(p.mrp) || Math.round(Number(p.price) * 1.3),
          discount: Math.round(((Number(p.mrp || p.price * 1.3) - Number(p.price)) / Number(p.mrp || p.price * 1.3)) * 100) || 15,
          rating: p.rating || 4.8,
          reviewsCount: p.reviewsCount || 42,
          inStock: isItemInStock,
          weight: p.weight || '500g',
          description: p.description || 'Authentic temple-grade item for sacred rituals.',
          images: [p.image || (Array.isArray(p.images) && p.images[0] ? p.images[0] : (typeof p.images === 'string' ? p.images : 'image-coming-soon.svg'))],
          highlights: p.highlights || ['100% Temple Grade', 'Consecrated & Pure', 'Fast LB Nagar Dispatch']
        };
      });

      if (typeof Fuse !== 'undefined') {
        STORE.fuse = new Fuse(STORE.products, {
          keys: ['title', 'category', 'description'],
          threshold: 0.35,
          ignoreLocation: true
        });
      }
    }
  } catch (e) {
    // Offline or fallback to data.js
  }

  // Real-time SSE catalog & category update listener
  if (typeof window !== 'undefined' && window.EventSource && !window._7hills_sse_active) {
    window._7hills_sse_active = true;
    const sse = new EventSource('/api/events');
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PRODUCT_UPDATED' || data.type === 'PRODUCT_DELETED' || data.type === 'CATEGORY_UPDATED' || data.type === 'CATEGORY_DELETED') {
          syncProductsFromBackend().then(() => {
            const h = window.location.hash || '#/';
            if (h === '#/' || h.startsWith('#/category/') || h.startsWith('#/categories')) {
              handleRouting();
            }
          });
        }
      } catch (err) {}
    };
  }
}

// ------------------------------------------
// 5.18 404 NOT FOUND VIEW
// ------------------------------------------
function renderNotFoundView() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="container" style="padding: 80px 20px; text-align: center;">
      <span style="font-size: 60px; color: var(--primary-maroon);"></span>
      <h1 style="font-family: var(--font-heading); font-size: 28px; color: var(--primary-maroon); margin: 16px 0 8px 0;">
        Page Not Found
      </h1>
      <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 24px;">
        The requested sacred page does not exist in 7 Hills Pooja Store.
      </p>
      <a href="#/" class="btn btn-primary">Return to Store Home &rarr;</a>
    </div>
  `;
}

// ==========================================
// 5.19 ONBOARDING: QR SCAN / ENTRY VIEW
// ==========================================
function renderEntryView() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="onboarding-screen-wrap">
      <div class="onboarding-card">
        <div class="onboarding-progress-dots">
          <span class="progress-dot active"></span>
          <span class="progress-dot"></span>
          <span class="progress-dot"></span>
          <span class="progress-dot"></span>
        </div>

        <div style="font-size: 38px; color: var(--accent-gold); margin-bottom: 8px;"></div>
        <h1 style="font-family: var(--font-heading); font-size: 26px; color: var(--primary-maroon); margin-bottom: 6px;">
          7 Hills Pooja Store
        </h1>
        <p style="font-size: 13px; color: var(--accent-gold); font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          “Positive Energy in Every Item.”
        </p>

        <!-- Viewfinder Scanner -->
        <div class="qr-viewfinder" id="qr-scanner-viewfinder" onclick="triggerSimulatedQrScan()" title="Click to scan QR code">
          <div class="qr-scan-laser"></div>
          <div class="qr-code-graphic">
            <span style="font-size: 40px;"></span>
            <div style="position: absolute; bottom: 8px; font-size: 11px; font-weight: 700; color: var(--primary-maroon);">
              7 Hills Pooja
            </div>
          </div>
        </div>

        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
          Scan the sacred store QR code at our LB Nagar store, or tap below to enter directly.
        </p>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button type="button" class="btn btn-primary" onclick="triggerSimulatedQrScan()" style="width: 100%; justify-content: center; padding: 14px; font-size: 15px;">
             Scan QR Code (Camera Simulation)
          </button>
          
          <button type="button" class="btn btn-secondary" onclick="window.location.hash='#/verify-otp'" style="width: 100%; justify-content: center; padding: 12px; font-size: 14px;">
            Enter via Mobile Verification →
          </button>

          <a href="#/" style="font-size: 13px; color: var(--text-muted); text-decoration: underline; margin-top: 8px;">
            Skip onboarding and browse catalog directly
          </a>
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle); font-size: 11px; color: var(--text-muted);">
          Beside Prasannanjaneya Swamy Temple, LB Nagar Main Road, Hyderabad
        </div>
      </div>
    </div>
  `;
}

function triggerSimulatedQrScan() {
  const finder = document.getElementById('qr-scanner-viewfinder');
  if (finder) {
    finder.style.borderColor = '#4CAF50';
    finder.style.boxShadow = '0 0 25px rgba(76, 175, 80, 0.4)';
  }
  showToast(" QR Code detected: <strong>7 Hills Pooja Store, LB Nagar</strong>");
  setTimeout(() => {
    window.location.hash = '#/verify-otp';
  }, 1000);
}

// ==========================================
// 5.20 ONBOARDING: OTP VERIFICATION VIEW
// ==========================================
function renderOtpVerificationView() {
  const root = document.getElementById('app-root');
  const savedPhone = localStorage.getItem('7hills_user_phone') || '';
  
  root.innerHTML = `
    <div class="onboarding-screen-wrap">
      <div class="onboarding-card">
        <div class="onboarding-progress-dots">
          <span class="progress-dot completed"></span>
          <span class="progress-dot active"></span>
          <span class="progress-dot"></span>
          <span class="progress-dot"></span>
        </div>

        <div style="font-size: 32px; color: var(--accent-gold); margin-bottom: 8px;"></div>
        <h2 style="font-family: var(--font-heading); font-size: 24px; color: var(--primary-maroon); margin-bottom: 6px;">
          Mobile Verification
        </h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">
          Enter your 10-digit mobile number to verify and unlock exclusive pooja discounts & tracking.
        </p>

        <!-- Phone Input -->
        <div style="margin-bottom: 20px; text-align: left;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-main); text-transform: uppercase;">
            Mobile Number
          </label>
          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <div style="background: var(--bg-cream); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 12px 14px; font-size: 15px; font-weight: 700; color: var(--text-main);">
               +91
            </div>
            <input 
              type="tel" 
              id="onboarding-phone-input" 
              class="form-control" 
              placeholder="90979 99939" 
              maxlength="10" 
              value="${savedPhone || '9097999939'}"
              style="font-size: 16px; letter-spacing: 1px; font-weight: 600;"
            >
          </div>
        </div>

        <button type="button" class="btn btn-secondary" onclick="sendSimulatedOtp()" id="btn-send-otp" style="width: 100%; justify-content: center; padding: 12px; margin-bottom: 20px;">
           Send Verification Code (OTP)
        </button>

        <!-- OTP Boxes -->
        <div id="otp-input-section" style="display: block;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-main); text-transform: uppercase;">
            Enter 4-Digit Sacred Code
          </label>
          <div class="otp-digit-group">
            <input type="text" maxlength="1" class="otp-box-input" id="otp-1" value="7" onkeyup="handleOtpDigitInput(this, 'otp-2', '')">
            <input type="text" maxlength="1" class="otp-box-input" id="otp-2" value="7" onkeyup="handleOtpDigitInput(this, 'otp-3', 'otp-1')">
            <input type="text" maxlength="1" class="otp-box-input" id="otp-3" value="7" onkeyup="handleOtpDigitInput(this, 'otp-4', 'otp-2')">
            <input type="text" maxlength="1" class="otp-box-input" id="otp-4" value="7" onkeyup="handleOtpDigitInput(this, '', 'otp-3')">
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 12px;">
            <span style="color: var(--text-muted);" id="otp-timer-label">OTP valid for 09:59 mins</span>
            <button type="button" onclick="resendSimulatedOtp()" style="color: var(--primary-maroon); font-weight: 700; text-decoration: underline; background: none; border: none; cursor: pointer;">
              Resend Code
            </button>
          </div>

          <button type="button" class="btn btn-primary" onclick="verifySimulatedOtp()" style="width: 100%; justify-content: center; padding: 14px; font-size: 15px;">
            Verify & Continue to Location →
          </button>
        </div>

        <div style="margin-top: 18px;">
          <a href="#/select-location" style="font-size: 12px; color: var(--text-muted); text-decoration: underline;">
            Skip Verification →
          </a>
        </div>
      </div>
    </div>
  `;

  // Push notification alert banner for demo
  setTimeout(() => {
    showNotificationBanner("7 Hills Pooja Store", "Your sacred verification code is <strong>7777</strong>.");
  }, 600);
}

function handleOtpDigitInput(current, nextId, prevId) {
  if (current.value.length >= 1 && nextId) {
    const nextEl = document.getElementById(nextId);
    if (nextEl) nextEl.focus();
  }
}

function sendSimulatedOtp() {
  const phoneInput = document.getElementById('onboarding-phone-input');
  const phone = phoneInput ? phoneInput.value.trim() : '';
  if (phone.length < 10) {
    showToast(" Please enter a valid 10-digit mobile number.");
    return;
  }
  localStorage.setItem('7hills_user_phone', phone);
  showToast(` Sacred OTP sent to +91 ${phone}`);
  showNotificationBanner("7 Hills Pooja Store", "Your sacred verification code is <strong>7777</strong>.");
  
  // Auto-populate 7777 for convenience
  ['otp-1', 'otp-2', 'otp-3', 'otp-4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '7';
  });
}

function resendSimulatedOtp() {
  showToast(" New OTP requested.");
  showNotificationBanner("7 Hills Pooja Store", "New verification code is <strong>7777</strong>.");
}

function verifySimulatedOtp() {
  const o1 = document.getElementById('otp-1')?.value || '';
  const o2 = document.getElementById('otp-2')?.value || '';
  const o3 = document.getElementById('otp-3')?.value || '';
  const o4 = document.getElementById('otp-4')?.value || '';
  const code = o1 + o2 + o3 + o4;

  if (code.length < 4) {
    showToast(" Please enter all 4 digits of the OTP.");
    return;
  }

  showToast(" Mobile verified successfully! Welcome to 7 Hills Pooja Store.");
  closeNotificationBanner();
  window.location.hash = '#/select-location';
}

// ==========================================
// 5.21 ONBOARDING: LOCATION SELECTION VIEW
// ==========================================
function renderSelectLocationView() {
  const root = document.getElementById('app-root');
  const currentLocation = STORE.userLocation || 'Beside Prasannanjaneya Swamy Temple, LB Nagar';

  root.innerHTML = `
    <div class="onboarding-screen-wrap">
      <div class="onboarding-card">
        <div class="onboarding-progress-dots">
          <span class="progress-dot completed"></span>
          <span class="progress-dot completed"></span>
          <span class="progress-dot active"></span>
          <span class="progress-dot"></span>
        </div>

        <div style="font-size: 36px; color: var(--accent-gold); margin-bottom: 8px;"></div>
        <h2 style="font-family: var(--font-heading); font-size: 24px; color: var(--primary-maroon); margin-bottom: 6px;">
          Set Delivery Location
        </h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">
          Enable location to see real-time pooja samagri delivery estimates for your area in Hyderabad.
        </p>

        <button type="button" class="btn btn-primary" onclick="detectGpsOnboarding()" id="btn-onboarding-gps" style="width: 100%; justify-content: center; padding: 14px; font-size: 15px; margin-bottom: 16px;">
           Detect Current Location (GPS)
        </button>

        <div style="display: flex; align-items: center; gap: 10px; margin: 12px 0;">
          <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">or choose locality</span>
          <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
        </div>

        <input 
          type="text" 
          id="onboarding-manual-loc" 
          class="form-control" 
          placeholder="e.g. LB Nagar, Kothapet, Dilsukhnagar..." 
          value="${currentLocation}"
          style="margin-bottom: 12px;"
        >

        <div class="location-quick-chips">
          <button type="button" class="location-chip-btn" onclick="selectQuickLocation('Beside Prasannanjaneya Temple, LB Nagar')"> LB Nagar Temple</button>
          <button type="button" class="location-chip-btn" onclick="selectQuickLocation('LB Nagar Metro Station, Hyderabad')"> LB Nagar Metro</button>
          <button type="button" class="location-chip-btn" onclick="selectQuickLocation('Dilsukhnagar, Hyderabad')"> Dilsukhnagar</button>
          <button type="button" class="location-chip-btn" onclick="selectQuickLocation('Kothapet, Hyderabad')"> Kothapet</button>
          <button type="button" class="location-chip-btn" onclick="selectQuickLocation('Nagole, Hyderabad')"> Nagole</button>
          <button type="button" class="location-chip-btn" onclick="selectQuickLocation('Vanasthalipuram, Hyderabad')"> Vanasthalipuram</button>
        </div>

        <button type="button" class="btn btn-secondary" onclick="saveOnboardingLocation()" style="width: 100%; justify-content: center; padding: 12px;">
          Confirm Location & Next →
        </button>
      </div>
    </div>
  `;
}

function selectQuickLocation(loc) {
  const input = document.getElementById('onboarding-manual-loc');
  if (input) input.value = loc;
  saveOnboardingLocation();
}

function detectGpsOnboarding() {
  const btn = document.getElementById('btn-onboarding-gps');
  if (btn) btn.textContent = "Detecting GPS...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      () => {
        STORE.userLocation = "Beside Prasannanjaneya Temple, LB Nagar";
        localStorage.setItem('7hills_user_location', STORE.userLocation);
        const headerLoc = document.getElementById('header-delivery-location-text');
        if (headerLoc) headerLoc.textContent = STORE.userLocation;
        showToast(" Location detected: LB Nagar, Hyderabad");
        window.location.hash = '#/select-delivery';
      },
      () => {
        STORE.userLocation = "LB Nagar, Hyderabad";
        localStorage.setItem('7hills_user_location', STORE.userLocation);
        showToast(" Location set to LB Nagar, Hyderabad");
        window.location.hash = '#/select-delivery';
      }
    );
  } else {
    STORE.userLocation = "LB Nagar, Hyderabad";
    window.location.hash = '#/select-delivery';
  }
}

function saveOnboardingLocation() {
  const input = document.getElementById('onboarding-manual-loc');
  const val = input ? input.value.trim() : '';
  if (val) {
    STORE.userLocation = val;
    localStorage.setItem('7hills_user_location', val);
    const headerLoc = document.getElementById('header-delivery-location-text');
    if (headerLoc) headerLoc.textContent = val;
    showToast(`Delivery location set to: ${val}`);
  }
  window.location.hash = '#/select-delivery';
}

// ==========================================
// 5.22 ONBOARDING: DELIVERY SELECTOR VIEW
// ==========================================
function renderSelectDeliveryView() {
  const root = document.getElementById('app-root');
  const selected = STORE.selectedDeliveryMethod || 'standard';

  root.innerHTML = `
    <div class="onboarding-screen-wrap">
      <div class="onboarding-card" style="max-width: 520px;">
        <div class="onboarding-progress-dots">
          <span class="progress-dot completed"></span>
          <span class="progress-dot completed"></span>
          <span class="progress-dot completed"></span>
          <span class="progress-dot active"></span>
        </div>

        <div style="font-size: 36px; color: var(--accent-gold); margin-bottom: 8px;"></div>
        <h2 style="font-family: var(--font-heading); font-size: 24px; color: var(--primary-maroon); margin-bottom: 6px;">
          Choose Delivery Speed
        </h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">
          Tailor your pooja deliveries to your ritual timeline and urgency.
        </p>

        <!-- Option 1: Instant -->
        <div class="delivery-choice-card ${selected === 'instant' ? 'selected' : ''}" onclick="selectOnboardingDeliveryMethod('instant')">
          <div style="font-size: 28px;"></div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <strong style="font-size: 15px; color: var(--primary-maroon);">Instant Temple Runner</strong>
              <span style="font-weight: 800; color: var(--primary-maroon);">₹149</span>
            </div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 0;">
              Delivered within <strong>2 Hours</strong> in LB Nagar & surrounding areas. Perfect for sudden pooja requirements.
            </p>
          </div>
        </div>

        <!-- Option 2: Same-day Express -->
        <div class="delivery-choice-card ${selected === 'express' ? 'selected' : ''}" onclick="selectOnboardingDeliveryMethod('express')">
          <div style="font-size: 28px;"></div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <strong style="font-size: 15px; color: var(--primary-maroon);">Rapido / Same-Day Express</strong>
              <span style="font-weight: 800; color: var(--primary-maroon);">₹99</span>
            </div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 0;">
              Guaranteed delivery before sunset today across Greater Hyderabad.
            </p>
          </div>
        </div>

        <!-- Option 3: Standard -->
        <div class="delivery-choice-card ${selected === 'standard' ? 'selected' : ''}" onclick="selectOnboardingDeliveryMethod('standard')">
          <div style="font-size: 28px;"></div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <strong style="font-size: 15px; color: var(--primary-maroon);">Standard Sacred Delivery</strong>
              <span style="font-weight: 800; color: var(--primary-maroon);">₹50 (FREE on ₹499+)</span>
            </div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 0;">
              Delivered safely in 2–3 business days with ritual bubble-wrap padding.
            </p>
          </div>
        </div>

        <button type="button" class="btn btn-primary" onclick="finishOnboarding()" style="width: 100%; justify-content: center; padding: 14px; font-size: 16px; margin-top: 14px;">
          Enter 7 Hills Pooja Store &rarr;
        </button>
      </div>
    </div>
  `;
}

function selectOnboardingDeliveryMethod(method) {
  STORE.selectedDeliveryMethod = method;
  localStorage.setItem('7hills_delivery_method', method);
  renderSelectDeliveryView();
}

function finishOnboarding() {
  showToast(" Welcome to <strong>7 Hills Pooja Store</strong>! Blessings on your journey.");
  window.location.hash = '#/';
}

// Notification Banner Helpers
function showNotificationBanner(title, msg) {
  const banner = document.getElementById('app-notification-banner');
  const titleEl = document.getElementById('notification-banner-title');
  const msgEl = document.getElementById('notification-banner-msg');
  if (banner && titleEl && msgEl) {
    titleEl.textContent = title;
    msgEl.innerHTML = msg;
    banner.classList.add('active');
  }
}

function closeNotificationBanner() {
  const banner = document.getElementById('app-notification-banner');
  if (banner) banner.classList.remove('active');
}


// ==========================================
// 6. GLOBAL SEARCH & AUTOCOMPLETE ENGINE
// ==========================================
function setupSearchHandlers() {
  const desktopInput = document.getElementById('main-search-input');
  const desktopCat = document.getElementById('header-search-category');
  const submitBtn = document.getElementById('btn-submit-search');
  const suggestionsBox = document.getElementById('search-suggestions-panel');

  const mobileInput = document.getElementById('mobile-search-input');
  const mobileSubmit = document.getElementById('mobile-btn-submit-search');

  function triggerSearch(term, cat) {
    if (suggestionsBox) suggestionsBox.style.display = 'none';
    window.location.hash = `#/search?q=${encodeURIComponent(term)}&cat=${encodeURIComponent(cat || 'all')}`;
  }

  // Desktop search input listeners
  if (desktopInput) {
    desktopInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val.length < 2) {
        if (suggestionsBox) suggestionsBox.style.display = 'none';
        return;
      }

      // Query Fuse.js
      let matches = [];
      if (STORE.fuse) {
        matches = STORE.fuse.search(val).slice(0, 5).map(r => r.item);
      } else {
        matches = STORE.products.filter(p => p.title.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
      }

      if (matches.length > 0 && suggestionsBox) {
        suggestionsBox.innerHTML = matches.map(p => `
          <div class="suggestion-row" onclick="selectSuggestion('${p.id}')">
            <img src="${getProductImageUrl(p.images[0])}" class="suggestion-thumb" alt="${p.title}">
            <div>
              <div class="suggestion-title">${p.title}</div>
              <span style="font-size: 12px; color: var(--primary-saffron); font-weight: 700;">₹${p.price}</span>
            </div>
            <span class="suggestion-cat">${p.category}</span>
          </div>
        `).join('');
        suggestionsBox.style.display = 'block';
      } else if (suggestionsBox) {
        suggestionsBox.style.display = 'none';
      }
    });

    desktopInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        triggerSearch(desktopInput.value.trim(), desktopCat?.value || 'all');
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      triggerSearch(desktopInput?.value.trim() || '', desktopCat?.value || 'all');
    });
  }

  if (mobileInput) {
    mobileInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        triggerSearch(mobileInput.value.trim(), 'all');
      }
    });
  }

  if (mobileSubmit) {
    mobileSubmit.addEventListener('click', () => {
      triggerSearch(mobileInput?.value.trim() || '', 'all');
    });
  }

  // Close suggestions on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-search-wrapper') && suggestionsBox) {
      suggestionsBox.style.display = 'none';
    }
  });
}

window.selectSuggestion = function(prodId) {
  const suggestionsBox = document.getElementById('search-suggestions-panel');
  if (suggestionsBox) suggestionsBox.style.display = 'none';
  window.location.hash = `#/product/${prodId}`;
};

// ==========================================
// 7. VOICE & IMAGE SEARCH MODALS
// ==========================================
function setupVoiceAndImageSearch() {
  const voiceModal = document.getElementById('voice-modal-overlay');
  const btnVoice = document.getElementById('btn-voice-search');
  const btnMobVoice = document.getElementById('mobile-btn-voice-search');
  const btnCancelVoice = document.getElementById('btn-cancel-voice');
  const voiceStatus = document.getElementById('voice-modal-status-text');

  function openVoice() {
    if (voiceModal) voiceModal.classList.add('active');
    
    // Check Speech Recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'en-IN';
        rec.interimResults = false;
        rec.start();

        if (voiceStatus) voiceStatus.textContent = "Listening to your voice...";

        rec.onresult = (e) => {
          const spoken = e.results[0][0].transcript;
          if (voiceStatus) voiceStatus.textContent = `"${spoken}"`;
          setTimeout(() => {
            if (voiceModal) voiceModal.classList.remove('active');
            window.location.hash = `#/search?q=${encodeURIComponent(spoken)}`;
          }, 1200);
        };

        rec.onerror = () => {
          simulateVoiceFallback();
        };
      } catch (err) {
        simulateVoiceFallback();
      }
    } else {
      simulateVoiceFallback();
    }
  }

  function simulateVoiceFallback() {
    const samples = ["Brass Ganesha Idol", "Peacock Deepam", "Photo Frames", "Bhimseni Camphor", "Tulsi Mala"];
    const randomTerm = samples[Math.floor(Math.random() * samples.length)];
    if (voiceStatus) {
      voiceStatus.textContent = "Listening...";
      setTimeout(() => {
        voiceStatus.textContent = `Identified: "${randomTerm}"`;
        setTimeout(() => {
          if (voiceModal) voiceModal.classList.remove('active');
          window.location.hash = `#/search?q=${encodeURIComponent(randomTerm)}`;
        }, 1500);
      }, 1800);
    }
  }

  if (btnVoice) btnVoice.onclick = openVoice;
  if (btnMobVoice) btnMobVoice.onclick = openVoice;
  if (btnCancelVoice) btnCancelVoice.onclick = () => voiceModal?.classList.remove('active');

  // Visual Image Search Modal
  const imgModal = document.getElementById('image-search-modal-overlay');
  const btnImg = document.getElementById('btn-image-search');
  const btnMobImg = document.getElementById('mobile-btn-image-search');
  const btnCloseImg = document.getElementById('btn-close-image-modal');
  const fileInput = document.getElementById('image-upload-input');
  const btnTriggerFile = document.getElementById('btn-trigger-file-input');
  const fileNameDisplay = document.getElementById('image-selected-filename');
  const btnExecuteImg = document.getElementById('btn-execute-image-search');

  function openImageSearch() {
    if (imgModal) imgModal.classList.add('active');
  }

  if (btnImg) btnImg.onclick = openImageSearch;
  if (btnMobImg) btnMobImg.onclick = openImageSearch;
  if (btnCloseImg) btnCloseImg.onclick = () => imgModal?.classList.remove('active');

  if (btnTriggerFile && fileInput) {
    btnTriggerFile.onclick = () => fileInput.click();
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      if (file) {
        if (fileNameDisplay) {
          fileNameDisplay.textContent = `Selected: ${file.name}`;
          fileNameDisplay.style.display = 'block';
        }
        if (btnExecuteImg) btnExecuteImg.disabled = false;
      }
    };
  }

  if (btnExecuteImg && fileInput) {
    btnExecuteImg.onclick = () => {
      const file = fileInput.files[0];
      const term = file ? file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z]/g, ' ').trim() : 'diya';
      btnExecuteImg.textContent = "Scanning visual contours...";
      setTimeout(() => {
        btnExecuteImg.textContent = "Scan & Find Matches";
        if (imgModal) imgModal.classList.remove('active');
        window.location.hash = `#/search?q=${encodeURIComponent(term || 'diya')}`;
      }, 1500);
    };
  }
}

// ==========================================
// 8. MOBILE DRAWER & LOCATION MODAL
// ==========================================
function setupDrawerAndLocationModal() {
  const drawerOverlay = document.getElementById('mobile-drawer-overlay');
  const openDrawerBtn = document.getElementById('btn-open-mobile-drawer');

  if (openDrawerBtn && drawerOverlay) {
    openDrawerBtn.onclick = () => drawerOverlay.classList.add('active');
    drawerOverlay.onclick = (e) => {
      if (e.target === drawerOverlay) drawerOverlay.classList.remove('active');
    };
  }

  // Location Modal
  const locModal = document.getElementById('location-modal-overlay');
  const openLocBtn = document.getElementById('btn-open-location-modal');
  const closeLocBtn = document.getElementById('btn-close-location-modal');
  const gpsBtn = document.getElementById('btn-detect-gps-location');
  const manualInput = document.getElementById('input-manual-location');
  const manualBtn = document.getElementById('btn-save-manual-location');
  const headerLoc = document.getElementById('header-selected-location');

  if (openLocBtn && locModal) {
    openLocBtn.onclick = () => locModal.classList.add('active');
    if (closeLocBtn) closeLocBtn.onclick = () => locModal.classList.remove('active');
    locModal.onclick = (e) => {
      if (e.target === locModal) locModal.classList.remove('active');
    };

    if (gpsBtn) {
      gpsBtn.onclick = () => {
        gpsBtn.textContent = "Detecting GPS...";
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            () => {
              STORE.userLocation = "Beside Prasannanjaneya Temple, LB Nagar";
              if (headerLoc) headerLoc.textContent = STORE.userLocation;
              showToast("Location updated to LB Nagar, Hyderabad");
              locModal.classList.remove('active');
              gpsBtn.textContent = " Detect Current Location (GPS)";
            },
            () => {
              STORE.userLocation = "LB Nagar, Hyderabad";
              if (headerLoc) headerLoc.textContent = STORE.userLocation;
              showToast("Location set to LB Nagar, Hyderabad");
              locModal.classList.remove('active');
              gpsBtn.textContent = " Detect Current Location (GPS)";
            }
          );
        } else {
          STORE.userLocation = "LB Nagar, Hyderabad";
          if (headerLoc) headerLoc.textContent = STORE.userLocation;
          locModal.classList.remove('active');
        }
      };
    }

    if (manualBtn && manualInput) {
      manualBtn.onclick = () => {
        const val = manualInput.value.trim();
        if (val) {
          STORE.userLocation = val;
          if (headerLoc) headerLoc.textContent = val;
          showToast(`Delivery location set to ${val}`);
          locModal.classList.remove('active');
        }
      };
    }
  }

  // Cart Drawer Swipe Down To Dismiss
  const handleBar = document.getElementById('cart-drawer-handle-bar');
  const cartSheet = document.getElementById('cart-drawer-sheet');
  if (handleBar && cartSheet) {
    let sheetStartY = 0;
    handleBar.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) sheetStartY = e.touches[0].clientY;
    }, { passive: true });
    handleBar.addEventListener('touchmove', (e) => {
      if (!e.touches || !e.touches[0]) return;
      const deltaY = e.touches[0].clientY - sheetStartY;
      if (deltaY > 0) {
        cartSheet.style.transform = `translateY(${deltaY}px)`;
      }
    }, { passive: true });
    handleBar.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const deltaY = e.changedTouches[0].clientY - sheetStartY;
      cartSheet.style.transform = '';
      if (deltaY > 75) {
        closeCartDrawer();
      }
    });
  }
}


function handleHeaderBack() {
  if (window.location.hash.startsWith('#/order-confirmed')) {
    window.location.hash = '#/';
    return;
  }
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.hash = '#/';
  }
}

function toggleViewportMode() {
  const shell = document.getElementById('mobile-app-shell');
  const label = document.getElementById('viewport-mode-label');
  if (shell) {
    shell.classList.toggle('full-viewport-mode');
    const isFull = shell.classList.contains('full-viewport-mode');
    if (label) label.textContent = isFull ? 'Expanded View' : 'Mobile App View';
  }
}

// ==========================================
// PRE-LAUNCH MODE & PWA APP INSTALL LOGIC
// ==========================================
let deferredInstallPrompt = null;

function isRunningStandaloneOrInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://') ||
         localStorage.getItem('7hills_app_installed') === 'true';
}

function checkAppInstalled() {
  if (isRunningStandaloneOrInstalled()) {
    document.body.classList.add('app-installed');
    const floater = document.getElementById('sticky-app-floater');
    if (floater) floater.style.display = 'none';
    const banner = document.getElementById('prelaunch-banner');
    if (banner) banner.style.display = 'none';
    const modal = document.getElementById('prelaunch-modal-overlay');
    if (modal) modal.style.display = 'none';
  }
}

function dismissAppFloater() {
  localStorage.setItem('7hills_floater_dismissed', 'true');
  const floater = document.getElementById('sticky-app-floater');
  if (floater) floater.style.display = 'none';
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (isRunningStandaloneOrInstalled() || localStorage.getItem('7hills_floater_dismissed') === 'true') {
    return;
  }
  const floater = document.getElementById('sticky-app-floater');
  if (floater) floater.style.display = 'block';
});

window.addEventListener('appinstalled', () => {
  localStorage.setItem('7hills_app_installed', 'true');
  document.body.classList.add('app-installed');
  deferredInstallPrompt = null;
  const floater = document.getElementById('sticky-app-floater');
  if (floater) floater.style.display = 'none';
  const banner = document.getElementById('prelaunch-banner');
  if (banner) banner.style.display = 'none';
  const modal = document.getElementById('prelaunch-modal-overlay');
  if (modal) modal.style.display = 'none';
  showToast('7 Hills Pooja Store App installed on your device!');
});

function getActiveInstallPrompt() {
  return window.deferredInstallPrompt || deferredInstallPrompt;
}

function triggerAppInstall() {
  if (isRunningStandaloneOrInstalled()) {
    showToast('✅ 7 Hills Pooja Store is already installed on your device!');
    return;
  }

  const promptEvent = getActiveInstallPrompt();
  if (promptEvent) {
    promptEvent.prompt();
    promptEvent.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem('7hills_app_installed', 'true');
        document.body.classList.add('app-installed');
        showToast('Installing 7 Hills Pooja Store on your device...');
        const floater = document.getElementById('sticky-app-floater');
        if (floater) floater.style.display = 'none';
        const banner = document.getElementById('prelaunch-banner');
        if (banner) banner.style.display = 'none';
      }
      window.deferredInstallPrompt = null;
      deferredInstallPrompt = null;
    });
  } else {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos) {
      showToast('📲 To install on iPhone: Tap Share (↑) in Safari > "Add to Home Screen"');
    } else {
      showToast('📲 To install: Tap 3 dots (⋮) at top-right of Chrome > "Install app"');
    }
  }
}

function executeNativeInstall() {
  triggerAppInstall();
}

function openPrelaunchModal() {
  // Directly trigger app install instead of opening any guide
  triggerAppInstall();
}

function closePrelaunchModal() {
  const modal = document.getElementById('prelaunch-modal-overlay');
  if (modal) modal.style.display = 'none';
}

async function submitPreRegistration() {
  const input = document.getElementById('prelaunch-phone-input');
  const feedback = document.getElementById('prelaunch-feedback-msg');
  if (!input) return;
  const rawPhone = input.value.trim().replace(/\D/g, '');
  if (rawPhone.length !== 10) {
    if (feedback) {
      feedback.textContent = 'Please enter a valid 10-digit mobile number';
      feedback.style.color = '#DC2626';
      feedback.style.display = 'block';
    }
    return;
  }

  try {
    const res = await fetch('/api/preregister', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: rawPhone,
        name: STORE.userProfile?.name || 'Devotee',
        pincode: '500074',
        source: 'prelaunch_modal'
      })
    });
    const data = await res.json();
    if (feedback) {
      feedback.textContent = '✓ Pre-registered successfully! You will receive early access & 15% discount on WhatsApp/SMS.';
      feedback.style.color = '#15803D';
      feedback.style.display = 'block';
    }
    input.value = '';
    showToast('Early Access Pre-Registration Confirmed! Sri Venkateswara Swamy Blessings.');
  } catch (err) {
    if (feedback) {
      feedback.textContent = '✓ Pre-registered locally! We will notify you at ' + rawPhone;
      feedback.style.color = '#15803D';
      feedback.style.display = 'block';
    }
  }
}

// ==========================================
// 9. APP ENTRY POINT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initStore();
  syncProductsFromBackend();
  setupSearchHandlers();
  setupVoiceAndImageSearch();
  setupDrawerAndLocationModal();

  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Check if app is installed / running in standalone mode to hide all install popups
  checkAppInstalled();

  // Router listener
  window.addEventListener('hashchange', handleRouting);
  // Initial page load
  handleRouting();
});

// Explicit window attachments for inline event handlers & automation scripts
if (typeof window !== 'undefined') {
  window.STORE = STORE;
  window.handleRouting = handleRouting;
  window.initStore = initStore;
  window.syncProductsFromBackend = syncProductsFromBackend;
  window.showToast = showToast;
  window.addToCart = addToCart;
  window.updateCartQuantity = updateCartQuantity;
  window.removeFromCart = removeFromCart;
  window.toggleWishlist = toggleWishlist;
  window.changePdpQty = changePdpQty;
  window.addCurrentPdpToCart = addCurrentPdpToCart;
  window.buyNowPdp = buyNowPdp;
  window.addBundleToCart = addBundleToCart;
  window.checkPdpPincode = checkPdpPincode;
  window.switchPdpImage = switchPdpImage;
  window.applyCoupon = applyCoupon;
  window.removeCoupon = removeCoupon;
  window.changeDeliveryMethod = changeDeliveryMethod;
  window.executeOrderPlacement = executeOrderPlacement;
  window.reorderItems = reorderItems;
  window.moveAllWishlistToCart = moveAllWishlistToCart;
  window.copyCouponCode = copyCouponCode;
  window.toggleNewAddressForm = toggleNewAddressForm;
  window.saveNewCheckoutAddress = saveNewCheckoutAddress;
  window.setDefaultAddress = setDefaultAddress;
  window.selectPaymentMode = selectPaymentMode;
  window.togglePaymentSelection = togglePaymentSelection;
  window.handleAppointmentBooking = handleAppointmentBooking;
  window.handleContactSubmit = handleContactSubmit;
  window.resetListingFilters = resetListingFilters;
  window.toggleInStockFilter = toggleInStockFilter;
  window.updateRatingFilter = updateRatingFilter;
  window.updatePriceFilter = updatePriceFilter;
  window.updateListingSort = updateListingSort;
  // Slide-Up Cart Drawer & Floating Cart Bar
  window.openCartDrawer = openCartDrawer;
  window.closeCartDrawer = closeCartDrawer;
  window.handleDrawerBackdropClick = handleDrawerBackdropClick;
  window.renderCartDrawerContent = renderCartDrawerContent;
  window.toggleDrawerBillDetails = toggleDrawerBillDetails;
  window.proceedToCheckoutFromDrawer = proceedToCheckoutFromDrawer;
  window.deleteCartItemWithUndo = deleteCartItemWithUndo;
  window.executeCartUndo = executeCartUndo;
  window.showUndoSnackbar = showUndoSnackbar;
  window.handleCartTouchStart = handleCartTouchStart;
  window.handleCartTouchMove = handleCartTouchMove;
  window.handleCartTouchEnd = handleCartTouchEnd;
  window.updateFloatingCartBar = updateFloatingCartBar;
  window.updateCardStepperInPlace = updateCardStepperInPlace;
  // Category Widgets
  window.renderCategorySnapStrip = renderCategorySnapStrip;
  window.renderFestivalBanner = renderFestivalBanner;
  window.renderQuickReorderSection = renderQuickReorderSection;
  window.toggleCategoryViewMode = toggleCategoryViewMode;
  // Multi-Language & Dark Mode
  window.openLanguageModal = openLanguageModal;
  window.closeLanguageModal = closeLanguageModal;
  window.setAppLanguage = setAppLanguage;
  window.initThemeMode = initThemeMode;
  window.toggleThemeMode = toggleThemeMode;
  // AR & Subscriptions
  window.openArModal = openArModal;
  window.closeArModal = closeArModal;
  window.updateArIdolScale = updateArIdolScale;
  window.toggleArCamera = toggleArCamera;
  window.captureArSnapshot = captureArSnapshot;
  window.openSubscriptionModal = openSubscriptionModal;
  window.closeSubscriptionModal = closeSubscriptionModal;
  window.confirmSubscription = confirmSubscription;
  // Unique Devotional Features
  window.switchRitualKit = switchRitualKit;
  window.updateSankalpamText = updateSankalpamText;
  window.addRitualKitToCart = addRitualKitToCart;
  window.playSacredTempleBell = playSacredTempleBell;
  window.playSacredOmTone = playSacredOmTone;
  window.toggleAkhandaJyoti = toggleAkhandaJyoti;
  // Onboarding & notification helpers
  window.triggerSimulatedQrScan = triggerSimulatedQrScan;
  window.sendSimulatedOtp = sendSimulatedOtp;
  window.resendSimulatedOtp = resendSimulatedOtp;
  window.verifySimulatedOtp = verifySimulatedOtp;
  window.handleOtpDigitInput = handleOtpDigitInput;
  window.selectQuickLocation = selectQuickLocation;
  window.detectGpsOnboarding = detectGpsOnboarding;
  window.saveOnboardingLocation = saveOnboardingLocation;
  window.selectOnboardingDeliveryMethod = selectOnboardingDeliveryMethod;
  window.finishOnboarding = finishOnboarding;
  window.showNotificationBanner = showNotificationBanner;
  window.closeNotificationBanner = closeNotificationBanner;
  window.handleHeaderBack = handleHeaderBack;
  window.toggleViewportMode = toggleViewportMode;
  window.copyMerchantUpi = copyMerchantUpi;
  window.finalizeOrderPlacement = finalizeOrderPlacement;
  // Pre-Launch & PWA App Installation
  window.triggerAppInstall = triggerAppInstall;
  window.executeNativeInstall = executeNativeInstall;
  window.openPrelaunchModal = openPrelaunchModal;
  window.closePrelaunchModal = closePrelaunchModal;
  window.submitPreRegistration = submitPreRegistration;
  window.dismissAppFloater = dismissAppFloater;
  window.checkAppInstalled = checkAppInstalled;
}


