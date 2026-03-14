/**
 * FoodStore Main JavaScript
 * Handles all frontend functionality
 */

// ==================== CONFIGURATION ====================
const API_BASE = '/api';
const CART_KEY = 'foodstore_cart';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format currency (Nigerian Naira)
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠';
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Get URL parameters
 */
function getUrlParams() {
    return new URLSearchParams(window.location.search);
}

// ==================== CART FUNCTIONS ====================

/**
 * Get cart from localStorage
 */
function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

/**
 * Save cart to localStorage
 */
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

/**
 * Update cart count in header
 */
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
        cartCountEl.textContent = count;
        cartCountEl.style.display = count > 0 ? 'flex' : 'none';
    }
}

/**
 * Add item to cart
 */
function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item._id === product._id);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity,
            category: product.category
        });
    }
    
    saveCart(cart);
    showToast(`${product.name} added to cart!`, 'success');
}

/**
 * Remove item from cart
 */
function removeFromCart(productId) {
    const cart = getCart();
    const updatedCart = cart.filter(item => item._id !== productId);
    saveCart(updatedCart);
    return updatedCart;
}

/**
 * Update item quantity in cart
 */
function updateCartQuantity(productId, quantity) {
    const cart = getCart();
    const index = cart.findIndex(item => item._id === productId);
    
    if (index > -1) {
        if (quantity <= 0) {
            return removeFromCart(productId);
        }
        cart[index].quantity = quantity;
        saveCart(cart);
    }
    
    return cart;
}

/**
 * Get cart total
 */
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Clear cart
 */
function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartCount();
}

// ==================== PRODUCT FUNCTIONS ====================

/**
 * Create product card HTML
 */
function createProductCard(product) {
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const isInStock = product.stock > 0;
    
    return `
        <div class="product-card" data-id="${product._id}">
            <div class="product-image">
                <a href="product.html?id=${product._id}">
                    <img src="${product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'}" 
                         alt="${product.name}" 
                         loading="lazy">
                </a>
                <div class="product-badges">
                    ${hasDiscount ? `<span class="badge badge-sale">-${discountPercent}%</span>` : ''}
                    ${product.featured ? '<span class="badge badge-hot">Hot</span>' : ''}
                </div>
                <div class="product-actions">
                    <button class="action-btn" onclick="addToWishlist('${product._id}')" title="Add to Wishlist">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category || 'Food'}</div>
                <h3 class="product-name">
                    <a href="product.html?id=${product._id}">${product.name}</a>
                </h3>
                <div class="product-rating">
                    <div class="stars">
                        ${generateStars(product.rating || 4.5)}
                    </div>
                    <span class="rating-count">(${product.numReviews || 0})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">${formatCurrency(product.price)}</span>
                    ${hasDiscount ? `<span class="original-price">${formatCurrency(product.originalPrice)}</span>` : ''}
                </div>
                <button class="add-to-cart-btn ${!isInStock ? 'out-of-stock' : ''}" 
                        onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})"
                        ${!isInStock ? 'disabled' : ''}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    ${isInStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        </div>
    `;
}

/**
 * Generate star rating HTML
 */
function generateStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<span class="star">★</span>';
    }
    if (hasHalf) {
        stars += '<span class="star">★</span>';
    }
    for (let i = fullStars + (hasHalf ? 1 : 0); i < 5; i++) {
        stars += '<span class="star" style="opacity: 0.3;">★</span>';
    }
    
    return stars;
}

// ==================== PAGE LOADERS ====================

/**
 * Load categories
 */
async function loadCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    
    const categories = [
        { name: 'Snacks', icon: '🍿', slug: 'snacks', count: 0 },
        { name: 'Drinks', icon: '🥤', slug: 'drinks', count: 0 },
        { name: 'Groceries', icon: '🛒', slug: 'groceries', count: 0 },
        { name: 'Fast Food', icon: '🍔', slug: 'fast-food', count: 0 },
        { name: 'Fruits', icon: '🍎', slug: 'fruits', count: 0 },
        { name: 'Dairy', icon: '🥛', slug: 'dairy', count: 0 }
    ];
    
    // Try to get actual counts from API
    try {
        const data = await apiRequest('/products/categories');
        data.data.forEach(cat => {
            const found = categories.find(c => c.slug === cat._id);
            if (found) found.count = cat.count;
        });
    } catch (error) {
        console.log('Using default categories');
    }
    
    grid.innerHTML = categories.map(cat => `
        <a href="products.html?category=${cat.slug}" class="category-card">
            <div class="category-icon">${cat.icon}</div>
            <h3 class="category-name">${cat.name}</h3>
            <span class="category-count">${cat.count}+ items</span>
        </a>
    `).join('');
}

/**
 * Load featured products
 */
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const data = await apiRequest('/products/featured?limit=8');
        
        if (data.data && data.data.length > 0) {
            container.innerHTML = data.data.map(createProductCard).join('');
        } else {
            container.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No featured products available</p>';
        }
    } catch (error) {
        // Load sample products if API fails
        const sampleProducts = generateSampleProducts(8);
        container.innerHTML = sampleProducts.map(createProductCard).join('');
    }
}

/**
 * Load latest products
 */
async function loadLatestProducts() {
    const container = document.getElementById('latestProducts');
    if (!container) return;
    
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const data = await apiRequest('/products?limit=8&sortBy=createdAt:desc');
        
        if (data.data && data.data.length > 0) {
            container.innerHTML = data.data.map(createProductCard).join('');
        } else {
            container.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No products available</p>';
        }
    } catch (error) {
        // Load sample products if API fails
        const sampleProducts = generateSampleProducts(8, true);
        container.innerHTML = sampleProducts.map(createProductCard).join('');
    }
}

/**
 * Generate sample products for demo
 */
function generateSampleProducts(count, randomize = false) {
    const sampleData = [
        { name: 'Fresh Pizza Slice', category: 'fast-food', price: 2500, originalPrice: 3000, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop' },
        { name: 'Organic Banana', category: 'fruits', price: 800, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop' },
        { name: 'Fresh Orange Juice', category: 'drinks', price: 1500, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop' },
        { name: 'Crispy Chicken', category: 'fast-food', price: 3500, originalPrice: 4000, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=400&fit=crop' },
        { name: 'Chocolate Cookies', category: 'snacks', price: 1200, image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop' },
        { name: 'Fresh Milk 1L', category: 'dairy', price: 900, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop' },
        { name: 'Garden Salad', category: 'groceries', price: 2000, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop' },
        { name: 'Soda Can Pack', category: 'drinks', price: 1800, image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop' },
        { name: 'Beef Burger', category: 'fast-food', price: 2800, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop' },
        { name: 'Potato Chips', category: 'snacks', price: 600, originalPrice: 750, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop' },
        { name: 'Fresh Bread', category: 'bakery', price: 500, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop' },
        { name: 'Mixed Fruits Bowl', category: 'fruits', price: 2500, image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=400&fit=crop' }
    ];
    
    const products = [];
    for (let i = 0; i < count; i++) {
        const idx = randomize ? Math.floor(Math.random() * sampleData.length) : i % sampleData.length;
        products.push({
            _id: `sample-${i}`,
            ...sampleData[idx],
            rating: 3.5 + Math.random() * 1.5,
            numReviews: Math.floor(Math.random() * 100),
            stock: Math.floor(Math.random() * 50) + 5,
            featured: Math.random() > 0.7
        });
    }
    
    return products;
}

// ==================== HEADER SCROLL EFFECT ====================
function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// ==================== SEARCH FUNCTIONALITY ====================
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let debounceTimer;
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `products.html?search=${encodeURIComponent(query)}`;
            }
        }
    });
}

// ==================== MOBILE MENU ====================
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    
    if (!menuToggle || !nav) return;
    
    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initHeaderScroll();
    initSearch();
    initMobileMenu();
});

// Export functions for use in other scripts
window.FoodStore = {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    getCart,
    getCartTotal,
    clearCart,
    formatCurrency,
    showToast,
    apiRequest,
    createProductCard
};