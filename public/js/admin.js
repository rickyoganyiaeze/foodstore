/**
 * Admin Dashboard JavaScript
 * Complete Updated Version with Mobile Icons
 */
const API = '/api';
let token = localStorage.getItem('adminToken');

// --- Utility Functions ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
}

async function apiRequest(endpoint, options = {}) {
    const res = await fetch(`${API}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

// --- Auth Check & Init ---
document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    loadDashboardData();
    loadProducts();
    loadOrders();
});

// --- Section Navigation ---
function showSection(section) {
    document.querySelectorAll('.admin-nav-link').forEach(el => el.classList.remove('active'));
    if (event && event.target) event.target.closest('.admin-nav-link').classList.add('active');
    
    document.getElementById('dashboardSection').style.display = section === 'dashboard' ? 'block' : 'none';
    document.getElementById('productsSection').style.display = section === 'products' ? 'block' : 'none';
    document.getElementById('ordersSection').style.display = section === 'orders' ? 'block' : 'none';
}

// --- Dashboard Data ---
async function loadDashboardData() {
    try {
        const products = await apiRequest('/products');
        document.getElementById('totalProducts').textContent = products.data?.length || 0;
        
        const orders = await apiRequest('/orders');
        const orderData = orders.data || [];
        
        document.getElementById('totalOrders').textContent = orderData.length;
        const pending = orderData.filter(o => o.orderStatus === 'pending').length;
        document.getElementById('pendingOrders').textContent = pending;
        
        const revenue = orderData.reduce((sum, o) => sum + (o.total || 0), 0);
        document.getElementById('totalRevenue').textContent = formatCurrency(revenue);

        const tbody = document.getElementById('recentOrdersTable');
        tbody.innerHTML = orderData.slice(0, 5).map(order => `
            <tr>
                <td><strong>${order.orderNumber || order._id}</strong></td>
                <td>${order.customer?.name || 'N/A'}</td>
                <td>${formatCurrency(order.total)}</td>
                <td><span class="status-badge ${order.orderStatus}">${order.orderStatus}</span></td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// --- Products Management ---
async function loadProducts() {
    try {
        const data = await apiRequest('/products');
        const tbody = document.getElementById('productsTable');
        tbody.innerHTML = (data.data || []).map(product => `
            <tr>
                <td>
                    <div class="product-thumb">
                        <img src="${product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=50&h=50&fit=crop'}" alt="${product.name}">
                    </div>
                </td>
                <td><strong>${product.name}</strong></td>
                <td>${product.category}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.stock}</td>
                <td>
                    <!-- Edit Icon Button -->
                    <button class="btn-icon" onclick="editProduct('${product._id}')" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <!-- Delete Icon Button -->
                    <button class="btn-icon" onclick="deleteProduct('${product._id}')" title="Delete" style="margin-left: 8px; color: var(--error); border-color: var(--error);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Failed to load products', 'error');
    }
}

function openProductModal(product = null) {
    document.getElementById('productModal').classList.add('active');
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    
    if (product) {
        document.getElementById('productModalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = product._id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productOriginalPrice').value = product.originalPrice || '';
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productFeatured').checked = product.featured ? true : false;
    } else {
        document.getElementById('productModalTitle').textContent = 'Add New Product';
        document.getElementById('productFeatured').checked = false;
    }
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

async function saveProduct() {
    const id = document.getElementById('productId').value;
    const form = new FormData();
    
    form.append('name', document.getElementById('productName').value);
    form.append('price', document.getElementById('productPrice').value);
    form.append('originalPrice', document.getElementById('productOriginalPrice').value || '');
    form.append('category', document.getElementById('productCategory').value);
    form.append('stock', document.getElementById('productStock').value);
    form.append('description', document.getElementById('productDescription').value);
    form.append('featured', document.getElementById('productFeatured').checked);

    const imageInput = document.getElementById('productImage');
    if (imageInput.files[0]) {
        form.append('image', imageInput.files[0]);
    }

    try {
        const endpoint = id ? `/products/${id}` : '/products';
        const method = id ? 'PUT' : 'POST';
        
        const res = await fetch(`${API}${endpoint}`, {
            method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message);
        
        showToast(`Product ${id ? 'updated' : 'created'} successfully`);
        closeProductModal();
        loadProducts();
        loadDashboardData();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function editProduct(id) {
    try {
        const data = await apiRequest(`/products/${id}`);
        openProductModal(data.data);
    } catch (error) {
        showToast('Failed to fetch product', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        await apiRequest(`/products/${id}`, { method: 'DELETE' });
        showToast('Product deleted successfully');
        loadProducts();
    } catch (error) {
        showToast('Failed to delete product', 'error');
    }
}

// --- Orders Management ---
async function loadOrders() {
    try {
        const data = await apiRequest('/orders');
        const tbody = document.getElementById('ordersTable');
        tbody.innerHTML = (data.data || []).map(order => `
            <tr>
                <td><strong>${order.orderNumber}</strong></td>
                <td>${order.customer?.name || 'N/A'}<br><small style="color: var(--text-muted)">${order.customer?.email || ''}</small></td>
                <td>${order.items?.length || 0} item(s)</td>
                <td>${formatCurrency(order.total)}</td>
                <td><span class="status-badge ${order.paymentStatus}">${order.paymentStatus}</span></td>
                <td><span class="status-badge ${order.orderStatus}">${order.orderStatus}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="viewOrder('${order._id}')">View</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Failed to load orders', 'error');
    }
}

async function viewOrder(id) {
    try {
        const data = await apiRequest(`/orders/${id}`);
        const order = data.data;
        
        document.getElementById('orderModalBody').innerHTML = `
            <div style="display: grid; gap: 16px;">
                <div><strong>Order Number:</strong> ${order.orderNumber}</div>
                <div><strong>Customer:</strong> ${order.customer?.name} (${order.customer?.email})</div>
                <div><strong>Phone:</strong> ${order.customer?.phone}</div>
                <div><strong>Address:</strong> ${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}</div>
                <hr style="border-color: var(--border-color);">
                <strong>Items:</strong>
                ${order.items.map(item => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <span>${item.name} x ${item.quantity}</span>
                        <span>${formatCurrency(item.price * item.quantity)}</span>
                    </div>
                `).join('')}
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                    <span>Total</span>
                    <span>${formatCurrency(order.total)}</span>
                </div>
                <div style="margin-top: 16px;">
                    <label><strong>Update Status:</strong></label>
                    <select id="orderStatusSelect" class="search-input" style="width: 100%; margin-top: 8px;">
                        <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.orderStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button class="btn btn-primary btn-sm" style="width: 100%; margin-top: 8px;" onclick="updateOrderStatus('${order._id}')">Update Status</button>
                </div>
            </div>
        `;
        document.getElementById('orderModal').classList.add('active');
    } catch (error) {
        showToast('Failed to load order details', 'error');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

async function updateOrderStatus(id) {
    const newStatus = document.getElementById('orderStatusSelect').value;
    try {
        await apiRequest(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ orderStatus: newStatus })
        });
        showToast('Order status updated');
        closeOrderModal();
        loadOrders();
        loadDashboardData();
    } catch (error) {
        showToast('Failed to update status', 'error');
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}