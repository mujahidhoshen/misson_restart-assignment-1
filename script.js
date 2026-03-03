// API Endpoints
const API_BASE_URL = "https://fakestoreapi.com";
const PRODUCTS_ENDPOINT = `${API_BASE_URL}/products`;
const CATEGORIES_ENDPOINT = `${API_BASE_URL}/products/categories`;

// State Management
const state = {
  products: [],
  categories: [],
  cart: [],
  selectedCategory: null,
  currentProduct: null,
};

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  loadLocalStorage();
  initializeEventListeners();

  // Load initial data based on current page
  if (document.getElementById("trending-products")) {
    loadTrendingProducts();
  }

  if (document.getElementById("products-grid")) {
    loadCategories();
    loadAllProducts();
  }

  updateCartCount();
});

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
  // Cart button
  const cartBtn = document.getElementById("cart-btn");
  if (cartBtn) {
    cartBtn.addEventListener("click", toggleCartSidebar);
  }

  // Cart close button
  const cartClose = document.querySelector(".cart-close");
  if (cartClose) {
    cartClose.addEventListener("click", toggleCartSidebar);
  }

  // Modal close button
  const modalClose = document.querySelector(".modal-close");
  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  // Modal background click
  const modal = document.getElementById("product-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Newsletter form
  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", handleNewsletterSubmit);
  }

  // Hamburger menu
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      hamburger.classList.toggle("active");
    });
  }
}

// ===== API CALLS =====
async function loadCategories() {
  try {
    const response = await fetch(CATEGORIES_ENDPOINT);
    state.categories = await response.json();
    renderCategories();
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

async function loadAllProducts() {
  showLoadingSpinner(true);
  try {
    const response = await fetch(PRODUCTS_ENDPOINT);
    state.products = await response.json();
    renderProducts(state.products);
  } catch (error) {
    console.error("Error loading products:", error);
  } finally {
    showLoadingSpinner(false);
  }
}

async function loadProductsByCategory(category) {
  showLoadingSpinner(true);
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/category/${category}`,
    );
    const products = await response.json();
    renderProducts(products);
  } catch (error) {
    console.error("Error loading products by category:", error);
  } finally {
    showLoadingSpinner(false);
  }
}

async function loadTrendingProducts() {
  try {
    const response = await fetch(PRODUCTS_ENDPOINT);
    const products = await response.json();

    // Get top 3 rated products (by highest rating)
    const trending = products
      .sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0))
      .slice(0, 3);

    renderTrendingProducts(trending);
  } catch (error) {
    console.error("Error loading trending products:", error);
  }
}

// ===== RENDER FUNCTIONS =====
function renderCategories() {
  const categoriesContainer = document.getElementById("categories");
  if (!categoriesContainer) return;

  categoriesContainer.innerHTML = "";

  // Add "All Products" button
  const allBtn = document.createElement("button");
  allBtn.className = "category-btn active";
  allBtn.textContent = "All Products";
  allBtn.addEventListener("click", () => {
    document
      .querySelectorAll(".category-btn")
      .forEach((btn) => btn.classList.remove("active"));
    allBtn.classList.add("active");
    state.selectedCategory = null;
    loadAllProducts();
  });
  categoriesContainer.appendChild(allBtn);

  // Add category buttons
  state.categories.forEach((category) => {
    const btn = document.createElement("button");
    btn.className = "category-btn";
    btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".category-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.selectedCategory = category;
      loadProductsByCategory(category);
    });
    categoriesContainer.appendChild(btn);
  });
}

function renderProducts(products) {
  const productsGrid = document.getElementById("products-grid");
  if (!productsGrid) return;

  if (products.length === 0) {
    productsGrid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No products found.</p>';
    return;
  }

  productsGrid.innerHTML = products
    .map((product) => createProductCard(product))
    .join("");

  // Add event listeners to product cards
  document.querySelectorAll(".btn-details").forEach((btn, index) => {
    btn.addEventListener("click", () => {
      state.currentProduct = products[index];
      openModal(products[index]);
    });
  });

  document.querySelectorAll(".btn-cart").forEach((btn, index) => {
    btn.addEventListener("click", () => {
      addToCart(products[index]);
    });
  });
}

function renderTrendingProducts(products) {
  const trendingContainer = document.getElementById("trending-products");
  if (!trendingContainer) return;

  trendingContainer.innerHTML = products
    .map((product) => createProductCard(product))
    .join("");

  // Add event listeners
  const cards = trendingContainer.querySelectorAll(".product-card");
  cards.forEach((card, index) => {
    card.querySelector(".btn-details").addEventListener("click", () => {
      openModal(products[index]);
    });
    card.querySelector(".btn-cart").addEventListener("click", () => {
      addToCart(products[index]);
    });
  });
}

function createProductCard(product) {
  const rating = product.rating?.rate || 0;
  const count = product.rating?.count || 0;
  const stars =
    "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));

  return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-meta">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    <div class="product-rating">
                        <span class="stars">${stars}</span>
                        <span>${rating.toFixed(1)}</span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn-details">Details</button>
                    <button class="btn-cart">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
}

// ===== MODAL FUNCTIONS =====
function openModal(product) {
  const modal = document.getElementById("product-modal");

  document.getElementById("modal-product-image").src = product.image;
  document.getElementById("modal-product-title").textContent = product.title;
  document.getElementById("modal-product-description").textContent =
    product.description;
  document.getElementById("modal-product-category").textContent =
    product.category.toUpperCase();

  const rating = product.rating?.rate || 0;
  const count = product.rating?.count || 0;
  const stars =
    "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  document.getElementById("modal-product-rating").innerHTML = `
        <span class="stars">${stars}</span>
        <span>${rating.toFixed(1)} (${count} reviews)</span>
    `;

  document.getElementById("modal-product-price").textContent =
    `$${product.price.toFixed(2)}`;

  // Update button actions
  document.getElementById("modal-add-to-cart").onclick = () => {
    addToCart(product);
    closeModal();
  };

  document.getElementById("modal-buy-now").onclick = () => {
    alert(`Proceeding to checkout for: ${product.title}`);
    closeModal();
  };

  modal.classList.add("show");
}

function closeModal() {
  const modal = document.getElementById("product-modal");
  modal.classList.remove("show");
}

// ===== CART FUNCTIONS =====
function addToCart(product) {
  const existingItem = state.cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    state.cart.push({
      ...product,
      quantity: 1,
    });
  }

  updateCartCount();
  saveLocalStorage();
  showNotification(`${product.title} added to cart!`);
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.id !== productId);
  updateCartCount();
  renderCartItems();
  saveLocalStorage();
}

function updateQuantity(productId, quantity) {
  const item = state.cart.find((item) => item.id === productId);
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveLocalStorage();
    renderCartItems();
  }
}

function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
  }
}

function renderCartItems() {
  const cartItemsContainer = document.getElementById("cart-items");
  if (!cartItemsContainer) return;

  if (state.cart.length === 0) {
    cartItemsContainer.innerHTML =
      '<div class="empty-cart"><p>Your cart is empty</p></div>';
    document.getElementById("cart-total").textContent = "$0.00";
    return;
  }

  cartItemsContainer.innerHTML = state.cart
    .map(
      (item) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        </div>
    `,
    )
    .join("");

  // Update total price
  const total = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  document.getElementById("cart-total").textContent = `$${total.toFixed(2)}`;
}

function toggleCartSidebar() {
  const cartSidebar = document.getElementById("cart-sidebar");
  cartSidebar.classList.toggle("open");

  if (cartSidebar.classList.contains("open")) {
    renderCartItems();
  }
}

// ===== HELPER FUNCTIONS =====
function showLoadingSpinner(show) {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.classList.toggle("show", show);
  }
}

function showNotification(message) {
  // Create a simple notification (you can enhance this)
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  alert(`Thank you for subscribing with ${email}!`);
  e.target.reset();
}

// ===== LOCAL STORAGE =====
function saveLocalStorage() {
  localStorage.setItem("swiftcart-cart", JSON.stringify(state.cart));
}

function loadLocalStorage() {
  const savedCart = localStorage.getItem("swiftcart-cart");
  if (savedCart) {
    state.cart = JSON.parse(savedCart);
  }
}

// Add CSS animation for notification
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
