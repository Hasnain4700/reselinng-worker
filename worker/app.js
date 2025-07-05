import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, update } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC8p7M9mym1tfqqr32tQwBN8BEHV3QH6XU",
    authDomain: "reselling-cd237.firebaseapp.com",
    databaseURL: "https://reselling-cd237-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "reselling-cd237",
    storageBucket: "reselling-cd237.firebasestorage.app",
    messagingSenderId: "511305304581",
    appId: "1:511305304581:web:38b2ecaca17ae9fad6ea6c",
    measurementId: "G-CKTRY9H56K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// DOM Elements
const modal = document.getElementById('newOrderModal');
const newOrderBtn = document.getElementById('newOrderBtn');
const closeBtn = document.querySelector('.close');
const orderForm = document.getElementById('newOrderForm');
const ordersTableBody = document.getElementById('ordersTableBody');

// Stats Elements
const totalOrdersEl = document.getElementById('totalOrders');
const pendingOrdersEl = document.getElementById('pendingOrders');
const completedOrdersEl = document.getElementById('completedOrders');
const cancelledOrdersEl = document.getElementById('cancelledOrders');
const totalProfitEl = document.getElementById('totalProfit');

// Modal Controls with Animation
newOrderBtn.onclick = () => {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
};

closeBtn.onclick = () => {
    closeModal();
};

window.onclick = (event) => {
    if (event.target === modal) {
        closeModal();
    }
};

function closeModal() {
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.opacity = '1';
        document.body.style.overflow = 'auto'; // Restore scrolling
    }, 300);
}

// Handle New Order Submission
orderForm.onsubmit = async (e) => {
    e.preventDefault();
    
    const newOrder = {
        customerName: document.getElementById('customerName').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
        productCode: document.getElementById('productCode').value,
        profit: parseFloat(document.getElementById('profit').value),
        status: 'pending',
        timestamp: Date.now()
    };

    try {
        // Push new order to Firebase
        await push(ref(database, 'orders'), newOrder);
        closeModal();
        orderForm.reset();
        showNotification('Order added successfully!', 'success');
    } catch (error) {
        showNotification('Error adding order: ' + error.message, 'error');
    }
};

// Listen for Orders Updates
onValue(ref(database, 'orders'), (snapshot) => {
    const orders = snapshot.val() || {};
    updateOrdersTable(orders);
    updateStats(orders);
});

// Update Orders Table with Animation
function updateOrdersTable(orders) {
    ordersTableBody.innerHTML = '';
    
    Object.entries(orders).forEach(([id, order]) => {
        const row = document.createElement('tr');
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        
        row.innerHTML = `
            <td>${id.slice(-6).toUpperCase()}</td>
            <td>${order.customerName}</td>
            <td>${order.productCode}</td>
            <td>${order.address}</td>
            <td>${order.phone}</td>
            <td>$${order.profit.toFixed(2)}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
            </td>
        `;
        
        ordersTableBody.appendChild(row);
        
        // Trigger animation after a small delay
        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, 50);
    });

    // Status changes are now handled by admin panel only
}

// Update Stats with Animation
function updateStats(orders) {
    const stats = Object.values(orders).reduce((acc, order) => {
        acc.total++;
        acc[order.status]++;
        if (order.status !== 'cancelled') {
            acc.totalProfit += order.profit;
        }
        return acc;
    }, {
        total: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
        totalProfit: 0
    });

    animateNumber(totalOrdersEl, stats.total);
    animateNumber(pendingOrdersEl, stats.pending);
    animateNumber(completedOrdersEl, stats.completed);
    animateNumber(cancelledOrdersEl, stats.cancelled);
    animateNumber(totalProfitEl, stats.totalProfit, true);
}

// Animate number changes
function animateNumber(element, newValue, isCurrency = false) {
    const start = parseInt(element.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const duration = 500; // Animation duration in milliseconds
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (newValue - start) * progress);
        element.textContent = isCurrency ? `$${current.toFixed(2)}` : current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Enhanced Notification System
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    document.body.appendChild(notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    });
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 0.5rem;
        color: white;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
        z-index: 1001;
    }
    
    .notification.success {
        background-color: #059669;
    }
    
    .notification.error {
        background-color: #dc2626;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;

document.head.appendChild(style); 