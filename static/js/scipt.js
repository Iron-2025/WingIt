// Global Variables
let currentSlide = 0;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentRating = 0;

let menuItems = [];
let reviews = [];
let currentPage = 1;
const itemsPerPage = 6;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    await fetchCategories();
    await fetchMenuItems();
    await fetchReviews();
    setupNavigation();
    setupCarousel();
    displayMenuItems('all');
    displayReviews();
    setupReviewForm();
    updateCartDisplay();
}

async function fetchCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        const categoriesContainer = document.getElementById('menuCategories');
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.textContent = category.name;
            button.onclick = () => filterMenu(category.name);
            categoriesContainer.appendChild(button);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function fetchMenuItems() {
    try {
        const response = await fetch('/api/products');
        menuItems = await response.json();
    } catch (error) {
        console.error('Error fetching menu items:', error);
    }
}

async function fetchReviews() {
    try {
        const response = await fetch('/api/reviews');
        reviews = await response.json();
    } catch (error) {
        console.error('Error fetching reviews:', error);
    }
}

// Navigation
function setupNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Carousel Functions
function setupCarousel() {
    setInterval(function() {
        changeSlide(1);
    }, 5000); // Auto-advance every 5 seconds
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide += direction;
    
    if (currentSlide >= slides.length) {
        currentSlide = 0;
    } else if (currentSlide < 0) {
        currentSlide = slides.length - 1;
    }
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function currentSlideSet(n) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = n - 1;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

// Menu Functions
function displayMenuItems(category) {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    const filteredItems = category === 'all' ? menuItems : menuItems.filter(item => item.category === category);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    menuGrid.innerHTML = paginatedItems.map(item => `
        <div class="menu-item" data-category="${item.category}">
            <img src="/${item.image}" alt="${item.name}">
            <div class="menu-item-content">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="menu-item-footer">
                    <span class="price">$${item.price.toFixed(2)}</span>
                    <button class="add-to-cart" onclick="addToCart(${item.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    setupPagination(filteredItems.length);
}

function setupPagination(totalItems) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    const pageCount = Math.ceil(totalItems / itemsPerPage);
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= pageCount; i++) {
        const button = document.createElement('button');
        button.innerText = i;
        button.onclick = () => {
            currentPage = i;
            displayMenuItems(document.querySelector('.category-btn.active').textContent.toLowerCase());
        };
        if (i === currentPage) {
            button.classList.add('active');
        }
        paginationContainer.appendChild(button);
    }
}

function filterMenu(category) {
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayMenuItems(category);
}

// Cart Functions
function addToCart(itemId) {
    const item = menuItems.find(item => item.id === itemId);
    if (!item) return;
    
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    saveCart();
    
    // Show feedback
    showNotification('Item added to cart!');
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartDisplay();
    saveCart();
}

function updateQuantity(itemId, change) {
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else {
        updateCartDisplay();
        saveCart();
    }
}

function updateCartDisplay() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartCount || !cartItems || !cartTotal) return;
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-center">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>PHP ${item.price.toFixed(2)} each</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="quantity-btn" onclick="removeFromCart(${item.id})" style="background: var(--secondary-red);">×</button>
                </div>
            </div>
        `).join('');
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
}

function toggleCart() {
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay) {
        cartOverlay.classList.toggle('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            checkout();
        });
    }
});

async function checkout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }

    const fullName = document.getElementById('fullName').value;
    const mobileNumber = document.getElementById('mobileNumber').value;
    const email = document.getElementById('email').value;
    const referenceCode = document.getElementById('referenceCode').value;

    if (!fullName || !mobileNumber || !referenceCode) {
        showNotification('Please fill in all required fields.');
        return;
    }

    const order = {
        fullName,
        mobileNumber,
        email,
        referenceCode,
        items: JSON.stringify(cart),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString(),
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(order),
        });
        const savedOrder = await response.json();

        // Clear cart
        cart = [];
        updateCartDisplay();
        saveCart();

        // Close cart and show success
        toggleCart();
        showNotification(`Order placed successfully! Your Order ID is: ${savedOrder.id}`);
    } catch (error) {
        console.error('Error placing order:', error);
        showNotification('Failed to place order.');
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Review Functions
let currentReviewSlide = 0;
function displayReviews() {
    const reviewsCarousel = document.getElementById('reviewsCarousel');
    if (!reviewsCarousel) return;

    reviewsCarousel.innerHTML = reviews.map((review, index) => `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}">
            <div class="review-card">
                ${review.image ? `<img src="/${review.image}" alt="Review image">` : ''}
                <div class="review-header">
                    <span class="review-name">${review.name}</span>
                    <div class="review-rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                </div>
                <p class="review-text">${review.text}</p>
                ${review.url ? `<a href="${review.url}" target="_blank">Source</a>` : ''}
                <small class="review-date">${new Date(review.date).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
}

function changeReviewSlide(direction) {
    const slides = document.querySelectorAll('#reviewsCarousel .carousel-slide');
    if (slides.length === 0) return;

    slides[currentReviewSlide].classList.remove('active');
    currentReviewSlide += direction;

    if (currentReviewSlide >= slides.length) {
        currentReviewSlide = 0;
    } else if (currentReviewSlide < 0) {
        currentReviewSlide = slides.length - 1;
    }

    slides[currentReviewSlide].classList.add('active');
}

function setupReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    const stars = document.querySelectorAll('.stars i');
    
    if (!reviewForm || !stars.length) return;
    
    // Setup star rating
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            currentRating = index + 1;
            updateStarDisplay();
        });
        
        star.addEventListener('mouseover', function() {
            highlightStars(index + 1);
        });
    });
    
    document.querySelector('.stars').addEventListener('mouseleave', function() {
        updateStarDisplay();
    });
    
    // Setup form submission
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitReview();
    });
}

function updateStarDisplay() {
    const stars = document.querySelectorAll('.stars i');
    stars.forEach((star, index) => {
        if (index < currentRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

async function submitReview() {
    const name = document.getElementById('reviewName').value;
    const text = document.getElementById('reviewText').value;

    if (!name || !text || currentRating === 0) {
        showNotification('Please fill in all fields and select a rating.');
        return;
    }

    const newReview = {
        name: name,
        rating: currentRating,
        text: text,
        date: new Date().toISOString()
    };

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newReview),
        });
        const savedReview = await response.json();
        reviews.unshift(savedReview);
        displayReviews();

        // Reset form
        document.getElementById('reviewForm').reset();
        currentRating = 0;
        updateStarDisplay();
        showNotification('Review submitted successfully!');
    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification('Failed to submit review.');
    }
}

// Utility Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-orange);
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9999;
        box-shadow: var(--shadow);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
