/* ============================================================================
   INVENTORY MANAGEMENT SYSTEM - JAVASCRIPT
   ============================================================================ */

// ============================================================================
// SIDEBAR TOGGLE FUNCTIONALITY
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Sidebar toggle button
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('show');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', function(event) {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
          sidebar.classList.remove('show');
        }
      }
    });
  }

  // Close sidebar on window resize if expanded on mobile
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768 && sidebar) {
      sidebar.classList.remove('show');
    }
  });
});

// ============================================================================
// FORM VALIDATION
// ============================================================================

function validateForm(formElement) {
  // Bootstrap form validation
  if (!formElement.checkValidity() === false) {
    event.preventDefault();
    event.stopPropagation();
  }
  formElement.classList.add('was-validated');
}

// Add event listeners to forms with validation
const forms = document.querySelectorAll('form');
forms.forEach(function(form) {
  form.addEventListener('submit', function(event) {
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }
    form.classList.add('was-validated');
  });
});

// ============================================================================
// CONFIRMATION DIALOGS
// ============================================================================

// Add confirmation to delete forms
const deleteForms = document.querySelectorAll('form[action*="remove_product"], form[action*="delete"]');
deleteForms.forEach(function(form) {
  form.addEventListener('submit', function(event) {
    if (!confirm('Are you sure you want to delete this item?')) {
      event.preventDefault();
    }
  });
});

// ============================================================================
// AUTO-DISMISS ALERTS
// ============================================================================

// Auto-dismiss success alerts after 5 seconds
const successAlerts = document.querySelectorAll('.alert-success');
successAlerts.forEach(function(alert) {
  setTimeout(function() {
    const bsAlert = new bootstrap.Alert(alert);
    bsAlert.close();
  }, 5000);
});

// ============================================================================
// TOOLTIP INITIALIZATION (Bootstrap Tooltips)
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Initialize Bootstrap popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function(popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
});

// ============================================================================
// ACTIVE NAVIGATION LINK HIGHLIGHTING
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.nav-link');
  const currentLocation = window.location.pathname;

  navLinks.forEach(function(link) {
    const href = link.getAttribute('href');
    if (href && currentLocation.includes(href.replace(/\//g, ''))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});

// ============================================================================
// QUANTITY INPUT HANDLERS
// ============================================================================

// Prevent negative numbers in quantity fields
const quantityInputs = document.querySelectorAll('input[name="quantity"], input[name="stock"]');
quantityInputs.forEach(function(input) {
  input.addEventListener('input', function() {
    if (this.value < 0) {
      this.value = 0;
    }
  });
  
  input.addEventListener('change', function() {
    if (this.value === '' || this.value < 0) {
      this.value = 0;
    }
  });
});

// ============================================================================
// PRICE INPUT FORMATTING
// ============================================================================

// Format price inputs to 2 decimal places
const priceInputs = document.querySelectorAll('input[name="price"], input[name="sale_price"]');
priceInputs.forEach(function(input) {
  input.addEventListener('blur', function() {
    if (this.value) {
      this.value = parseFloat(this.value).toFixed(2);
    }
  });
});

// ============================================================================
// SEARCH FORM HANDLERS
// ============================================================================

// Highlight search input on focus
const searchInputs = document.querySelectorAll('input[type="search"]');
searchInputs.forEach(function(input) {
  input.addEventListener('focus', function() {
    this.parentElement.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
  });
  
  input.addEventListener('blur', function() {
    this.parentElement.style.boxShadow = 'none';
  });
});

// ============================================================================
// TABLE ROW HIGHLIGHTING
// ============================================================================

// Add hover effect to table rows
const tableRows = document.querySelectorAll('table tbody tr');
tableRows.forEach(function(row) {
  row.addEventListener('mouseenter', function() {
    this.style.backgroundColor = '#f8f9fa';
  });
  
  row.addEventListener('mouseleave', function() {
    this.style.backgroundColor = '';
  });
});

// ============================================================================
// RESPONSIVE NAVIGATION
// ============================================================================

// Handle sidebar visibility on small screens
function handleWindowResize() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth > 768 && sidebar) {
    sidebar.classList.remove('show');
  }
}

window.addEventListener('resize', handleWindowResize);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency values
 * @param {number} value - The value to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

/**
 * Format date values
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The alert type (success, info, warning, danger)
 */
function showToast(message, type = 'info') {
  const alertClass = `alert-${type}`;
  const alertHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  const alertContainer = document.querySelector('.main-content-inner') || document.body;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = alertHTML;
  alertContainer.insertBefore(tempDiv.firstElementChild, alertContainer.firstChild);
  
  setTimeout(function() {
    const alert = alertContainer.querySelector('.alert');
    if (alert) {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }
  }, 5000);
}

// ============================================================================
// CONSOLE INITIALIZATION MESSAGE
// ============================================================================

console.log('%cInventory Management System', 'font-size: 16px; font-weight: bold; color: #0d6efd;');
console.log('%cApplication initialized successfully', 'font-size: 12px; color: #6c757d;');
