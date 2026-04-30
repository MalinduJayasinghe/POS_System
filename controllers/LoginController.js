
const CREDENTIALS = { username: 'admin', password: '1234' };

let loggedInUser = null;


// ------------------------ Login Form ------------------------
    $('#login-form').on('submit', function (e) {
    e.preventDefault(); // stop the page from refreshing

    const username = $('#login-username').val();
    const password = $('#login-password').val();

    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        $('#login-error').hide();
        loggedInUser = username;
        showView('dashboard');
        renderDashboard();
    } else {
        $('#login-error').show();
    }
});


// ------------------------ Logout Button ------------------------
$('#btn-logout').on('click', function () {
    loggedInUser  = null;
    currentOrder  = { customerId: null, items: [] };
    showView('login');
});


// ------------------------ Logout Button for other navbars ------------------------
$(function () {
    $('#btn-cus-logout, #btn-logout-items, #btn-logout-orders, #btn-logout-history').on('click', function () {
        $('#btn-logout').trigger('click');
    });
});


// ------------------------ Show Bootstrap toast notification ------------------------

const showToast = (message, type = 'success') => {
    const toastId = 'toast-' + Date.now();
    const iconMap = { success: '✓', danger: '✕', warning: '⚠', info: 'ℹ' };
    const icon    = iconMap[type] || '•';
    const bgClass = type === 'warning' ? 'bg-warning text-dark' : 'bg-' + type + ' text-white';

    const html = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} border-0" role="alert" style="min-width:260px; border-radius:10px;">
            <div class="d-flex">
                <div class="toast-body fw-semibold">${icon} ${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto"
                        data-bs-dismiss="toast"></button>
            </div>
        </div>`;

    $('#toast-area').append(html);
    const el    = document.getElementById(toastId);
    const toast = new bootstrap.Toast(el, { delay: 3200 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
};


// ------------------------ Switch which view (page) is visible ------------------------

const showView = (viewId) => {
    $('.view').removeClass('active');
    $('#' + viewId).addClass('active');
    $('.nav-link-item').removeClass('active');
    $(`.nav-link-item[data-view="${viewId}"]`).addClass('active');
    window.scrollTo(0, 0);
};