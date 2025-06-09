// --- Start of Embedded admin-dashboard.js ---
// Global Variables
let currentAdminSection = 'dashboard'; // Renamed to avoid conflict if any
let ordersData = []; // Renamed
let productsData = []; // Renamed
let adminReviewsData = []; // Renamed
let categoriesData = []; // Renamed


document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initializeAdminDashboard();
    setupGlobalEventListeners(); // Renamed
});

function checkAdminAuth() {
    fetch('/api/admin/auth_check')
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in) {
                window.location.href = '/admin/login'; // Redirect to admin login page
            } else {
                // Optionally set username if available from session/API
                // document.getElementById('adminUsernameDisplay').textContent = data.username || 'Admin';
                // document.getElementById('adminUsernameHeader').textContent = data.username || 'Admin';
            }
        })
        .catch(error => {
            console.error("Auth check failed:", error);
            window.location.href = '/admin/login';
        });
}

function adminLogout() { // Renamed
    fetch('/api/admin/logout')
        .then(() => {
            window.location.href = '/admin/login';
        });
}

async function initializeAdminDashboard() { // Renamed
    // Attach event listeners to sidebar menu items
    document.querySelectorAll('.sidebar-menu a.menu-item').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.dataset.page;
            showAdminPage(pageId); // Renamed
        });
    });
    
    // Attach listener to logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', adminLogout);
    }

    // Load initial data and show dashboard
    await loadCategoriesAdmin(); // Renamed
    await loadProductsAdmin();   // Renamed
    await loadReviewsAdmin();    // Renamed
    await loadOrdersAdmin();     // Renamed
    
    showAdminPage('dashboard'); // Show dashboard by default
}

function setupGlobalEventListeners() { // Renamed
    const productModal = document.getElementById('productModal');
    const showAddProductModalBtn = document.getElementById('showAddProductModalBtn');
    const closeProductModalBtn = document.getElementById('closeProductModalBtn');
    const productForm = document.getElementById('productForm');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const orderStatusFilter = document.getElementById('orderStatusFilter');

    if (showAddProductModalBtn) showAddProductModalBtn.addEventListener('click', () => openProductModal());
    if (closeProductModalBtn) closeProductModalBtn.addEventListener('click', () => closeProductModal());
    if (productForm) productForm.addEventListener('submit', handleProductFormSubmit);
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', addCategoryAdmin);
    if (orderStatusFilter) orderStatusFilter.addEventListener('change', (e) => displayOrdersAdmin(e.target.value));
    
    const productImageFile = document.getElementById('productImageFile');
    if(productImageFile) {
        productImageFile.addEventListener('change', function(event) {
            const preview = document.getElementById('productImagePreview');
            if (event.target.files && event.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                reader.readAsDataURL(event.target.files[0]);
            } else {
                preview.style.display = 'none';
                preview.src = '#';
            }
        });
    }
}

function showAdminPage(pageId) { // Renamed
    document.querySelectorAll('.main-content .page').forEach(page => {
        page.style.display = 'none';
    });
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.style.display = 'block';
    }

    document.querySelectorAll('.sidebar-menu a.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeLink = document.querySelector(`.sidebar-menu a.menu-item[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    currentAdminSection = pageId;

    // Call data loading/refresh functions for the specific page
    if (pageId === 'dashboard') loadDashboardAdminData(); // Renamed
    if (pageId === 'orders') displayOrdersAdmin(document.getElementById('orderStatusFilter').value || 'all'); // Renamed
    if (pageId === 'products') displayProductsAdmin(); // Renamed
    if (pageId === 'categories') displayCategoriesAdmin(); // Renamed
    if (pageId === 'reviews') displayReviewsAdmin(); // Renamed
    if (pageId === 'analytics') loadAnalyticsAdminData(); // Renamed
}

// --- Dashboard Specific ---
async function loadDashboardAdminData() {
    // Fetch all necessary data if not already loaded, or re-fetch for freshness
    // For simplicity, assuming data is loaded during initializeAdminDashboard
    
    // Calculate stats
    const today = new Date().toDateString();
    const todayCompletedOrders = ordersData.filter(order => new Date(order.date).toDateString() === today && order.status === 'completed');
    const todaySales = todayCompletedOrders.reduce((sum, order) => sum + order.total, 0);
    
    const totalOrders = ordersData.length; // Or filter by a certain period
    const totalProducts = productsData.length;
    const avgRating = adminReviewsData.length > 0 ? 
        (adminReviewsData.reduce((sum, review) => sum + review.rating, 0) / adminReviewsData.length) : 0;

    const statsGrid = document.getElementById('statsGridContainer');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <h3 class="stat-title">Today's Sales</h3>
                <div class="stat-icon orange"><i class="fas fa-dollar-sign"></i></div>
            </div>
            <p class="stat-value">PHP ${todaySales.toFixed(2)}</p>
        </div>
        <div class="stat-card yellow">
            <div class="stat-header">
                <h3 class="stat-title">Orders Today (Completed)</h3>
                <div class="stat-icon yellow"><i class="fas fa-shopping-bag"></i></div>
            </div>
            <p class="stat-value">${todayCompletedOrders.length}</p>
        </div>
        <div class="stat-card red">
            <div class="stat-header">
                <h3 class="stat-title">Total Products</h3>
                <div class="stat-icon red"><i class="fas fa-box"></i></div>
            </div>
            <p class="stat-value">${totalProducts}</p>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <h3 class="stat-title">Average Rating</h3>
                <div class="stat-icon orange"><i class="fas fa-star"></i></div>
            </div>
            <p class="stat-value">${avgRating.toFixed(1)}</p>
        </div>
    `;
    
    renderRecentOrders(); // Renamed
    renderSalesChart(); // Renamed
}

function renderRecentOrders() { // Renamed
    const recentOrdersList = document.getElementById('recentOrdersList');
    if (!recentOrdersList) return;
    
    const recent = ordersData.slice(0, 5); // Get 5 most recent
    recentOrdersList.innerHTML = recent.map(order => `
        <div class="order-item">
            <div class="order-info">
                <h4>#${order.id} - ${order.full_name}</h4>
                <p>${new Date(order.date).toLocaleString()}</p>
            </div>
            <div class="order-status">
                <span class="status-badge status-${order.status.replace(/\s+/g, '-').toLowerCase()}">${order.status}</span>
                <p class="order-total">PHP ${order.total.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
    if (recent.length === 0) recentOrdersList.innerHTML = "<p>No recent orders.</p>";
}

let salesChartInstance = null;
async function renderSalesChart() { // Renamed
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;

    try {
        const response = await fetch('/api/sales_overview'); // Assuming this endpoint exists and returns { sale_date, total_sales }
        const salesData = await response.json();

        const labels = salesData.map(d => new Date(d.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const data = salesData.map(d => d.total_sales);

        if (salesChartInstance) {
            salesChartInstance.destroy();
        }
        salesChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales (PHP)',
                    data: data,
                    backgroundColor: 'rgba(255, 107, 53, 0.6)',
                    borderColor: 'rgba(255, 107, 53, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    } catch (error) {
        console.error('Error fetching/rendering sales chart:', error);
        canvas.parentElement.innerHTML = "<p class='text-center text-danger'>Could not load sales chart.</p>";
    }
}


// --- Orders Specific ---
async function loadOrdersAdmin() { // Renamed
    try {
        const response = await fetch('/api/orders');
        ordersData = await response.json();
        displayOrdersAdmin('all'); // Display all orders initially
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

function displayOrdersAdmin(filterStatus = 'all') { // Renamed
    const ordersTableBody = document.getElementById('ordersTableBody');
    if (!ordersTableBody) return;

    const filtered = filterStatus === 'all' ? ordersData : ordersData.filter(o => o.status === filterStatus);

    ordersTableBody.innerHTML = filtered.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.full_name}</td>
            <td>${order.mobile_number}</td>
            <td>
                ${order.items && JSON.parse(order.items).map(item => `<div>${item.name} (x${item.quantity})</div>`).join('')}
            </td>
            <td>PHP ${order.total.toFixed(2)}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>
                <span class="status-badge status-${order.status.replace(/\s+/g, '-').toLowerCase()}">${order.status}</span>
            </td>
            <td>
                <select onchange="updateOrderStatusAdmin(${order.id}, this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="ready for pickup" ${order.status === 'ready for pickup' ? 'selected' : ''}>Ready for Pickup</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
        </tr>
    `).join('');
     if (filtered.length === 0) ordersTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No orders found for this filter.</td></tr>`;
}
window.updateOrderStatusAdmin = async function(orderId, newStatus) { // Make it global
    try {
        await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        showAdminNotification('Order status updated!'); // Renamed
        loadOrdersAdmin(); // Refresh orders list
        if(currentAdminSection === 'dashboard') loadDashboardAdminData(); // Refresh dashboard if on it
    } catch (error) {
        console.error('Error updating order status:', error);
        showAdminNotification('Failed to update status.');
    }
};


// --- Products Specific ---
async function loadProductsAdmin() { // Renamed
    try {
        const response = await fetch('/api/products');
        productsData = await response.json();
        displayProductsAdmin();
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

function displayProductsAdmin() { // Renamed
    const grid = document.getElementById('adminProductsGrid');
    if (!grid) return;
    grid.innerHTML = productsData.map(product => `
        <div class="product-card-admin">
            <img src="/${product.image}" alt="${product.name}">
            <div class="product-info-admin">
                <h3>${product.name}</h3>
                <span class="category">${product.category}</span>
                <p class="description-admin">${product.description || 'No description.'}</p>
                <p class="price">PHP ${product.price.toFixed(2)}</p>
                <div class="actions">
                    <button class="btn btn-secondary btn-small" onclick="openProductModal(${product.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button flex: 1; background: #dc3545; class="btn btn-danger btn-small" onclick="deleteProductAdmin(${product.id})"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        </div>
    `).join('');
    if (productsData.length === 0) grid.innerHTML = "<p>No products found.</p>";
}

let editingProductId = null;
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    const preview = document.getElementById('productImagePreview');
    
    form.reset();
    preview.style.display = 'none';
    preview.src = '#';
    populateCategoryDropdownModal(); // Renamed

    if (productId) {
        editingProductId = productId;
        const product = productsData.find(p => p.id === productId);
        title.textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('productNameModal').value = product.name;
        document.getElementById('productCategoryModal').value = product.category;
        document.getElementById('productPriceModal').value = product.price;
        document.getElementById('productDescriptionModal').value = product.description || '';
        document.getElementById('isPopularModal').checked = product.is_popular || false;
        if (product.image) {
            preview.src = `/${product.image}`;
            preview.style.display = 'block';
        }
    } else {
        editingProductId = null;
        title.textContent = 'Add New Product';
    }
    if(modal) modal.style.display = 'flex';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if(modal) modal.style.display = 'none';
    document.getElementById('productForm').reset();
    document.getElementById('productImagePreview').style.display = 'none';
}

async function handleProductFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productNameModal').value;
    const category = document.getElementById('productCategoryModal').value;
    const price = parseFloat(document.getElementById('productPriceModal').value);
    const description = document.getElementById('productDescriptionModal').value;
    const imageFile = document.getElementById('productImageFile').files[0];
    const isPopular = document.getElementById('isPopularModal').checked;

    let imageUrl = editingProductId ? productsData.find(p=>p.id===parseInt(id))?.image : null;

    if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        try {
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (uploadData.error) throw new Error(uploadData.error);
            imageUrl = uploadData.filePath;
        } catch (err) {
            showAdminNotification(`Image upload error: ${err.message}`); return;
        }
    }
    
    const productData = { name, category, price, description, image: imageUrl, is_popular: isPopular };

    const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
    const method = editingProductId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!res.ok) throw new Error(`Server error: ${res.statusText}`);
        await loadProductsAdmin(); // Refresh product list
        closeProductModal();
        showAdminNotification(`Product ${editingProductId ? 'updated' : 'added'} successfully!`);
    } catch (err) {
        showAdminNotification(`Error saving product: ${err.message}`);
    }
}
window.deleteProductAdmin = async function(productId) { // Make global
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        showAdminNotification('Product deleted!');
        loadProductsAdmin();
    } catch (err) { showAdminNotification('Error deleting product.'); }
};


// --- Categories Specific ---
async function loadCategoriesAdmin() { // Renamed
    try {
        const response = await fetch('/api/categories');
        categoriesData = await response.json();
        displayCategoriesAdmin();
        populateCategoryDropdownModal(); // For product modal
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

function displayCategoriesAdmin() { // Renamed
    const list = document.getElementById('categoriesListAdmin');
    if (!list) return;
    list.innerHTML = categoriesData.map(cat => `
        <div class="category-item-admin">
            <span style="font-weight: bold;">${cat.name}</span>
            <button style="background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 5px;" class="btn btn-danger btn-small" onclick="deleteCategoryAdmin(${cat.id})"><i class="fas fa-trash"></i> Delete</button>
        </div>
    `).join('');
    if (categoriesData.length === 0) list.innerHTML = "<p>No categories found.</p>";
}

function populateCategoryDropdownModal() { // Renamed
    const select = document.getElementById('productCategoryModal');
    if (!select) return;
    select.innerHTML = '<option value="">Select Category</option>' + categoriesData.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
}

async function addCategoryAdmin() { // Renamed
    const nameInput = document.getElementById('newCategoryNameInput');
    const name = nameInput.value.trim();
    if (!name) { showAdminNotification('Category name cannot be empty.'); return; }

    try {
        const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || `Server error: ${res.statusText}`);
        }
        nameInput.value = '';
        showAdminNotification('Category added!');
        loadCategoriesAdmin(); // Refresh
    } catch (err) { showAdminNotification(`Error adding category: ${err.message}`); }
}
window.deleteCategoryAdmin = async function(categoryId) { // Make global
    if (!confirm('Are you sure you want to delete this category? This might affect products in this category.')) return;
    try {
        await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
        showAdminNotification('Category deleted!');
        loadCategoriesAdmin();
    } catch (err) { showAdminNotification('Error deleting category.'); }
};

// --- Reviews Specific ---
async function loadReviewsAdmin() { // Renamed
    try {
        const response = await fetch('/api/reviews');
        adminReviewsData = await response.json();
        displayReviewsAdmin();
    } catch (error) {
        console.error('Error fetching reviews:', error);
    }
}

function displayReviewsAdmin() { // Renamed
    const grid = document.getElementById('adminReviewsGrid');
    if (!grid) return;
    grid.innerHTML = adminReviewsData.map(review => `
        <div style="border: 1px solid #eee; border-radius: 8px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3>${review.name}</h3>
                <button style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; font-size: 0.8rem;" onclick="deleteReviewAdmin(${review.id})">Delete</button>
            </div>
            <div style="margin-bottom: 10px;">${'⭐'.repeat(review.rating)}</div>
            <p>"${review.text}"</p>
            <small style="color: #666;">${new Date(review.date).toLocaleString()}</small>
        </div>
    `).join('');
    if (adminReviewsData.length === 0) grid.innerHTML = "<p>No reviews found.</p>";
}
window.deleteReviewAdmin = async function(reviewId) { // Make global
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
        await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
        showAdminNotification('Review deleted!');
        loadReviewsAdmin();
        if(currentAdminSection === 'dashboard') loadDashboardAdminData();
    } catch (err) { showAdminNotification('Error deleting review.'); }
};

// --- Analytics Specific ---
let popularItemsChartInstance = null;
let orderStatusChartInstance = null;

async function loadAnalyticsAdminData() { // Renamed
    // For popular items, we might need a new endpoint or derive from orders
    // For order status, we can derive from ordersData
    renderPopularItemsChart();
    renderOrderStatusChart();
}

async function renderPopularItemsChart() {
    const canvas = document.getElementById('popularItemsChart');
    if (!canvas) return;

    // This requires processing ordersData to count item occurrences
    const itemCounts = {};
    ordersData.forEach(order => {
        try {
            const items = JSON.parse(order.items);
            items.forEach(item => {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
            });
        } catch (e) { console.error("Error parsing items for order", order.id, e); }
    });
    
    const sortedItems = Object.entries(itemCounts).sort(([,a],[,b]) => b-a).slice(0, 5); // Top 5
    const labels = sortedItems.map(([name]) => name);
    const data = sortedItems.map(([,count]) => count);

    if (popularItemsChartInstance) popularItemsChartInstance.destroy();
    popularItemsChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Popular Items',
                data: data,
                backgroundColor: ['#ff6b35', '#f7931e', '#ff8a65', '#ffb74d', '#e74c3c'],
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderOrderStatusChart() {
    const canvas = document.getElementById('orderStatusChart');
    if (!canvas) return;

    const statusCounts = ordersData.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    const backgroundColors = labels.map(label => {
        if (label === 'completed') return 'rgba(40, 167, 69, 0.7)';
        if (label === 'pending') return 'rgba(255, 193, 7, 0.7)';
        if (label === 'cancelled') return 'rgba(220, 53, 69, 0.7)';
        if (label === 'preparing') return 'rgba(0, 123, 255, 0.7)';
        if (label === 'ready for pickup') return 'rgba(108, 117, 125, 0.7)';
        return 'rgba(108, 117, 125, 0.7)';
    });


    if (orderStatusChartInstance) orderStatusChartInstance.destroy();
    orderStatusChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Order Status',
                data: data,
                backgroundColor: backgroundColors,
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}


// --- Utility ---
function showAdminNotification(message) { // Renamed
    const notification = document.createElement('div');
    notification.className = 'admin-notification'; // Use a distinct class if needed
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: var(--brand-orange); color: white;
        padding: 12px 18px; border-radius: 6px; z-index: 10001; /* Higher z-index for admin */
        box-shadow: 0 3px 10px rgba(0,0,0,0.15);
        font-size: 0.9rem;
        animation: adminSlideIn 0.3s ease, adminSlideOut 0.3s ease 2.7s forwards;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Add keyframes for admin notifications if not already present
const adminNotificationStyle = document.createElement('style');
adminNotificationStyle.textContent = `
    @keyframes adminSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes adminSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(adminNotificationStyle);

// --- End of Embedded admin-dashboard.js ---
