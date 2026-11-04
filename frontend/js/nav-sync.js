/**
 * Nav-Sync: Ensures consistent navigation across all EXO ERP pages.
 * Loads and delegates to the unified sidebar.js component.
 */

(function() {
    if (!document.querySelector('script[src*="sidebar.js"]')) {
        const s = document.createElement('script');
        s.src = '/js/sidebar.js';
        document.body.appendChild(s);
    }
})();
