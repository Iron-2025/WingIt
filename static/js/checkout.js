document.addEventListener('DOMContentLoaded', function() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const checkoutItemsContainer = document.getElementById('checkoutItemsContainer');
    const checkoutTotalAmount = document.getElementById('checkoutTotalAmount');
    const submitOrderBtn = document.getElementById('submitOrderBtn');

    function updateCheckoutDisplay() {
        if (cart.length === 0) {
            checkoutItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            checkoutTotalAmount.textContent = '₱0.00';
            return;
        }

        checkoutItemsContainer.innerHTML = cart.map(item => `
            <div class="order-item">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>Qty: ${item.quantity}</p>
                </div>
                <div class="item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        checkoutTotalAmount.textContent = `₱${total.toFixed(2)}`;
    }

    async function handleOrderSubmit() {
        const fullName = document.getElementById('fullName').value.trim();
        const mobileNumber = document.getElementById('mobileNumber').value.trim();
        const email = document.getElementById('email').value.trim();
        const referenceCode = document.getElementById('referenceCode').value.trim();

        if (!fullName || !mobileNumber || !referenceCode) {
            alert('Please fill in all required fields.');
            return;
        }

        const order = {
            fullName,
            mobileNumber,
            email,
            referenceCode,
            items: JSON.stringify(cart),
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            date: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order),
            });

            if (!response.ok) {
                throw new Error('Failed to submit order');
            }

            const savedOrder = await response.json();
            localStorage.removeItem('cart');
            
            document.getElementById('step-information').classList.add('hidden');
            const confirmationStep = document.getElementById('step-confirmation');
            confirmationStep.classList.remove('hidden');
            document.getElementById('orderNumber').textContent = savedOrder.id;

        } catch (error) {
            console.error('Error submitting order:', error);
            alert('There was an error submitting your order. Please try again.');
        }
    }

    if (submitOrderBtn) {
        submitOrderBtn.addEventListener('click', handleOrderSubmit);
    }

    updateCheckoutDisplay();
});
