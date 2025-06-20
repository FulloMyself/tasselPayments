let cart = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  loadCart();
});

// Add to Cart from overlay
document.getElementById("overlay-add-to-cart-btn").addEventListener("click", function () {
  const productId = parseInt(this.getAttribute("data-product-id"));
  addToCart(productId);
  document.getElementById("product-overlay").style.display = "none";
  document.body.style.overflow = "";
});

// Toggle Cart Panel
function toggleCart() {
  const cartSection = document.getElementById("cart-section");
  const overlay = document.getElementById("cart-overlay");
  const cartIcon = document.getElementById("cart-icon");
  const iconSymbol = document.getElementById("cart-icon-symbol");

  const isOpen = cartSection.classList.toggle("open");
  overlay.classList.toggle("active");
  cartIcon.classList.toggle("cart-open");

  if (isOpen) {
    iconSymbol.textContent = "✕";
    iconSymbol.classList.add("rotate");
    cartIcon.setAttribute("title", "Close cart");

    setTimeout(() => {
      iconSymbol.classList.remove("rotate");
    }, 600);
  } else {
    iconSymbol.textContent = "🛒";
    cartIcon.setAttribute("title", "Open cart");
  }
}

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");
const sortBy = document.getElementById("sortBy");

let allProducts = []; // Will be filled by fetch
let filteredProducts = [];

  // Filter + Sort Logic
function applyFilters() {
  let filtered = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchInput.value.toLowerCase());
    const matchesCategory = categoryFilter.value === "all" || product.category === categoryFilter.value;
    const price = parseFloat(product.price);
    const min = parseFloat(minPrice.value) || 0;
    const max = parseFloat(maxPrice.value) || Infinity;
    const matchesPrice = price >= min && price <= max;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Sort
  switch (sortBy.value) {
    case "priceLowHigh":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "priceHighLow":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "nameAZ":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "nameZA":
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
  }

  filteredProducts = filtered;
  displayProducts(filteredProducts);
}

// Event Listeners
[searchInput, categoryFilter, minPrice, maxPrice, sortBy].forEach(input => {
  input.addEventListener("input", applyFilters);
});

// Fetch and Display Products
function fetchProducts() {
  fetch("products.json")
    .then((res) => res.json())
    .then((data) => {
      allProducts = data;
      filteredProducts = [...allProducts];
      applyFilters(); // Will render with current filter values
    })
    .catch((error) => console.error("Error loading products:", error));
}

function displayProducts(products) {
  const productContainer = document.querySelector(".products");
  productContainer.innerHTML = "";

  products.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.classList.add("product-card");
    productCard.setAttribute("data-product-id", product.id);

    const priceHTML =
      product.salePrice && product.salePrice < product.price
        ? `<div class="price">
             <span class="original-price">R${product.price}</span>
             <span class="sale-price">R${product.salePrice}</span>
           </div>`
        : `<div class="price">R${product.price}</div>`;

    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        ${priceHTML}
        <button onclick="addToCart(${product.id})">Add to Cart</button>
      </div>`;

    if (product.salePrice && product.salePrice < product.price) {
      const saleBadge = document.createElement("div");
      saleBadge.className = "sale-badge";
      saleBadge.textContent = "SALE";
      productCard.appendChild(saleBadge);
    }

    productContainer.appendChild(productCard);
  });

  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      if (e.target.tagName === "BUTTON") return;
      const productId = parseInt(this.getAttribute("data-product-id"));
      openProductOverlay(productId);
    });
  });
}

// Add to Cart
function addToCart(productId) {
  fetch("products.json")
    .then((response) => response.json())
    .then((products) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const cartItem = cart.find((item) => item.id === productId);
      const { finalPrice } = getFinalPrice(product);
      const price = parseFloat(finalPrice);

      if (cartItem) {
        if (cartItem.quantity < product.stock) {
          cartItem.quantity++;
        } else {
          alert("Stock limit reached!");
          return;
        }
      } else {
        cart.push({ ...product, price, quantity: 1 });
      }

      updateCart();
      showToast(`${product.name} added to cart!`);
    });
}

function showToast(message = "Item added to cart!") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  toastMessage.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Remove from Cart
function removeFromCart(index) {
  const cartItems = document.getElementById("cart-items");
  const cartItemElements = cartItems.getElementsByClassName("cart-item");
  const itemToRemove = cartItemElements[index];
  if (itemToRemove) {
    itemToRemove.classList.add("slide-out");
    setTimeout(() => {
      cart.splice(index, 1);
      updateCart();
    }, 500); // Match this to your CSS animation duration
  }
}

// Update Cart
function updateCart() {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const cartCount = document.getElementById("cart-count");
  const cartIcon = document.getElementById("cart-icon");

  const clearCartBtn = document.getElementById("clear-cart-btn");
  const checkoutBtn = document.getElementById("checkout-btn");
  const orderNowBtn = document.getElementById("order-now-btn");

  cartItems.innerHTML = "";
  let total = 0;
  let itemCount = 0;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <p class="empty-cart-message">
        Your cart is empty 😔<br>
        Start exploring and add your favorite products!
      </p>`;
    clearCartBtn.style.display = "none";
    orderNowBtn.style.display = "none";
    checkoutBtn.style.display = "none";
  } else {
    clearCartBtn.style.display = "block";
    orderNowBtn.style.display = "block";
    checkoutBtn.style.display = "block";

    cart.forEach((item, index) => {
      total += item.price * item.quantity;
      itemCount += item.quantity;

      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.innerHTML = `
        <span class="cart-item-name">${item.name}</span>
        <div class="cart-item-row">
          <input type="number" min="1" max="99" maxlength="2" value="${item.quantity}" data-index="${index}" class="quantity-input">
          <span class="cart-item-price">R${(item.price * item.quantity).toFixed(2)}</span>
          <button class="remove-cart-item" onclick="removeFromCart(${index})" title="Remove">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `;

      cartItems.appendChild(cartItem);
    });
  }

  // Before updating the text, check if the value is different
  if (cartTotal.textContent !== total.toFixed(2)) {
    cartTotal.textContent = total.toFixed(2);
    cartTotal.classList.remove('bounce');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cartTotal.classList.add('bounce');
      });
    });
  } else {
    cartTotal.textContent = total.toFixed(2);
  }

  cartCount.textContent = itemCount;

  cartIcon.classList.remove("animate");
  void cartIcon.offsetWidth;
  cartIcon.classList.add("animate");

  saveCart();
}

// Clear Cart
document.getElementById("clear-cart-btn").addEventListener("click", () => {
  if (cart.length === 0) return;
  const confirmClear = confirm("Are you sure you want to remove all items from the cart?");
  if (confirmClear) {
    // Animate all cart items
    const cartItemsContainer = document.getElementById("cart-items");
    const cartItemElements = cartItemsContainer.querySelectorAll(".cart-item");
    cartItemElements.forEach((item, idx) => {
      // Stagger the animation for a nicer effect (optional)
      setTimeout(() => {
        item.classList.add("slide-out");
      }, idx * 60);
    });

    // Wait for the animation to finish, then clear the cart
    setTimeout(() => {
      cart = [];
      updateCart();
      showToast("Cart cleared.");
    }, 600); // Match this to your animation duration
  }
});

// Modal logic
const orderModal = document.getElementById("order-modal");
const closeOrderModal = document.getElementById("close-order-modal");
const orderForm = document.getElementById("order-form");

document.getElementById("order-now-btn").addEventListener("click", function () {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  orderModal.style.display = "flex";
  document.body.style.overflow = "hidden";
});

closeOrderModal.onclick = function () {
  orderModal.style.display = "none";
  document.body.style.overflow = "";
};

window.onclick = function (event) {
  if (event.target === orderModal) {
    orderModal.style.display = "none";
    document.body.style.overflow = "";
  }
};

document.getElementById('order-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const name = document.getElementById('order-name').value.trim();
  const email = document.getElementById('order-email').value.trim();

  if (!name || !email || cart.length === 0) {
    alert('Please fill in your name, email, and add at least one item to the cart.');
    return;
  }

  const cartToSend = cart.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price
  }));

  // Calculate total
  const total = cartToSend.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const response = await fetch('https://tasselorders.onrender.com/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, cart: cartToSend, total })
    });

    if (response.ok) {
      alert('Order sent successfully!');
      cart = [];
      updateCart();
      orderModal.style.display = "none";
      document.body.style.overflow = "";
    } else {
      alert('Failed to send order.');
    }
  } catch (err) {
    alert('Error sending order.');
  }
});

// Email validation helper
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Checkout with Yoco
document.getElementById('checkout-btn').addEventListener('click', function () {
  const yoco = new window.YocoSDK({
    publicKey: 'pk_live_ef0d3b5d8o5MMB37c214'
  });

  const total = parseFloat(document.getElementById('cart-total').textContent);
  yoco.showPopup({
    amountInCents: Math.round(total * 100),
    currency: 'ZAR',
    name: 'Tassel Beauty And Wellness Studio',
    description: 'Online Store Purchase',
    callback: function (result) {
      if (result.error) {
        alert('Payment failed: ' + result.error.message);
      } else {
        // Send result.token to your server for processing
        fetch('https://tasselorders.onrender.com/api/yoco-charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: result.token,
            amountInCents: Math.round(total * 100)
          })
        })
        .then(res => res.json())
        .then(data => {
          // handle payment result
          alert('Payment successful! Token: ' + result.token);
          // Optionally clear the cart or show a success message
        });
      }
    }
  });
});

// Cart Persistence
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCart() {
  const saved = localStorage.getItem("cart");
  if (saved) {
    cart = JSON.parse(saved);
    updateCart();
  }
}

// Close Cart on Escape
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    const cart = document.getElementById("cart-section");
    const overlay = document.getElementById("cart-overlay");

    if (cart.classList.contains("open")) {
      cart.classList.remove("open");
      overlay.classList.remove("active");
    }
  }
});

// Product Overlay
function openProductOverlay(productId) {
  fetch("products.json")
    .then((response) => response.json())
    .then((products) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const { finalPrice, originalPrice } = getFinalPrice(product);

      document.getElementById("overlay-product-img").src = product.image;
      document.getElementById("overlay-product-name").textContent = product.name;
      document.getElementById("overlay-product-description").textContent = product.description;
      document.getElementById("overlay-product-price").textContent = `R${finalPrice}`;

      const originalPriceEl = document.getElementById("overlay-product-original-price");
      if (originalPrice) {
        originalPriceEl.textContent = `R${originalPrice}`;
        originalPriceEl.style.display = "inline";
      } else {
        originalPriceEl.style.display = "none";
      }

      const saleBadge = document.getElementById("overlay-sale-badge");
      saleBadge.style.display = product.salePrice && product.salePrice < product.price ? "block" : "none";

      const overlayButton = document.getElementById("overlay-add-to-cart-btn");
      overlayButton.setAttribute("data-product-id", productId);

      document.getElementById("product-overlay").style.display = "flex";
      document.body.style.overflow = "hidden";
    });
}

function getFinalPrice(product) {
  const finalPrice = product.salePrice && product.salePrice < product.price
    ? product.salePrice
    : product.price;

  const originalPrice = product.salePrice && product.salePrice < product.price
    ? product.price
    : null;

  return {
    finalPrice: finalPrice.toFixed(2),
    originalPrice: originalPrice ? originalPrice.toFixed(2) : null
  };
}

document.getElementById("close-overlay").addEventListener("click", () => {
  document.getElementById("product-overlay").style.display = "none";
  document.body.style.overflow = "";
});

// Count from localStorage
function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  cartCount.textContent = cartItems.length;
}

// Remove the old update-cart-btn event listener block
document.addEventListener("input", function (event) {
  if (event.target.classList.contains("quantity-input")) {
    const index = parseInt(event.target.getAttribute("data-index"));
    const newQuantity = parseInt(event.target.value);

    if (!isNaN(newQuantity) && newQuantity > 0 && newQuantity <= cart[index].stock) {
      cart[index].quantity = newQuantity;
      updateCart();
    }
  }
});
