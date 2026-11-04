/**
 * EXO GLOBAL ERP — Progressive Web App (PWA) Install Manager
 * Supports:
 * - Desktop Chrome / Edge / Brave (Windows, macOS, Linux)
 * - Android Chrome / Samsung Internet
 * - Apple iOS Safari (iPhone & iPad "Add to Home Screen" guidance)
 */

(function () {
    let deferredPrompt = null;

    // Check if app is already running in standalone (installed) mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true ||
                         document.referrer.includes('android-app://');

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((reg) => console.log('✅ EXO PWA Service Worker Registered:', reg.scope))
                .catch((err) => console.warn('PWA Service Worker Registration Failed:', err));
        });
    }

    // Capture Native Install Prompt (Chromium, Android, Windows, macOS)
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent default mini-infobar on mobile
        e.preventDefault();
        deferredPrompt = e;
        console.log('💡 PWA Install prompt captured');

        // Show install button across UI
        showInstallButtons(true);

        // Optional: show floating bottom install toast once per session if not dismissed
        if (!sessionStorage.getItem('exo_pwa_banner_dismissed') && !isStandalone) {
            setTimeout(showFloatingInstallBanner, 3000);
        }
    });

    window.addEventListener('appinstalled', () => {
        console.log('🎉 EXO ERP App Installed successfully');
        deferredPrompt = null;
        showInstallButtons(false);
        const banner = document.getElementById('exo-pwa-floating-banner');
        if (banner) banner.remove();
        showPwaToast('🎉 EXO ERP app installed on this device!');
    });

    // Public method callable from anywhere: install button, sidebar, topbar
    window.installExoApp = async function () {
        if (isStandalone) {
            showPwaToast('EXO ERP is already running as an installed app.');
            return;
        }

        if (deferredPrompt) {
            // Native install prompt (Desktop Chrome/Edge, Android)
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install: ${outcome}`);
            deferredPrompt = null;
            showInstallButtons(false);
            const banner = document.getElementById('exo-pwa-floating-banner');
            if (banner) banner.remove();
        } else if (isIOS) {
            // Show iOS specific Add to Home Screen modal
            showIOSInstallModal();
        } else {
            // Desktop or unsupported browser instructions
            showGenericInstallModal();
        }
    };

    function showInstallButtons(show) {
        if (isStandalone) return;
        const btns = document.querySelectorAll('.exo-pwa-install-trigger');
        btns.forEach(btn => {
            btn.style.display = show ? 'flex' : 'none';
        });
    }

    // Floating Bottom Banner
    function showFloatingInstallBanner() {
        if (document.getElementById('exo-pwa-floating-banner') || isStandalone) return;

        const banner = document.createElement('div');
        banner.id = 'exo-pwa-floating-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #0f172a, #1e293b);
            border: 1px solid rgba(14, 165, 233, 0.4);
            border-radius: 16px;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.5);
            z-index: 999998;
            max-width: 90vw;
            width: 460px;
            animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            color: #fff;
            font-family: 'Inter', -apple-system, sans-serif;
        `;

        banner.innerHTML = `
            <img src="/exologo.png" alt="EXO" style="width:42px; height:42px; border-radius:10px; object-fit:contain; background:#fff; padding:4px;" />
            <div style="flex:1;">
                <div style="font-weight:700; font-size:14px; color:#fff;">Install EXO ERP App</div>
                <div style="font-size:12px; color:#94a3b8;">Install on your desktop or mobile home screen for the best full-screen experience.</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button onclick="window.installExoApp()" style="
                    background: linear-gradient(135deg, #0ea5e9, #6366f1);
                    color: white; border: none; border-radius: 8px;
                    padding: 8px 16px; font-weight: 700; font-size: 13px;
                    cursor: pointer; white-space: nowrap; transition: 0.2s;
                ">Install</button>
                <button onclick="dismissPwaBanner()" style="
                    background: transparent; color: #94a3b8; border: none;
                    cursor: pointer; font-size: 18px; padding: 4px;
                "><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;

        // Inject keyframes if missing
        if (!document.getElementById('exo-pwa-anim-css')) {
            const s = document.createElement('style');
            s.id = 'exo-pwa-anim-css';
            s.textContent = `
                @keyframes pwaSlideUp {
                    from { transform: translate(-50%, 40px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `;
            document.head.appendChild(s);
        }

        document.body.appendChild(banner);
    }

    window.dismissPwaBanner = function () {
        sessionStorage.setItem('exo_pwa_banner_dismissed', 'true');
        const b = document.getElementById('exo-pwa-floating-banner');
        if (b) {
            b.style.opacity = '0';
            b.style.transform = 'translate(-50%, 20px)';
            b.style.transition = 'all 0.3s ease';
            setTimeout(() => b.remove(), 300);
        }
    };

    // iOS Add-to-Home-Screen Guidance Modal
    function showIOSInstallModal() {
        let modal = document.getElementById('exo-ios-install-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'exo-ios-install-modal';
            modal.style.cssText = `
                position: fixed; inset: 0; z-index: 9999999;
                background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
                display: flex; align-items: center; justify-content: center;
                padding: 20px; font-family: 'Inter', -apple-system, sans-serif;
            `;
            modal.innerHTML = `
                <div style="
                    background: #1e293b; border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px; padding: 24px; max-width: 380px; width: 100%;
                    color: #fff; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                    position: relative;
                ">
                    <button onclick="document.getElementById('exo-ios-install-modal').remove()" style="
                        position: absolute; top: 16px; right: 16px; background: none;
                        border: none; color: #94a3b8; font-size: 20px; cursor: pointer;
                    ">&times;</button>
                    <img src="/exologo.png" style="width: 56px; height: 56px; border-radius: 12px; margin-bottom: 12px; background:#fff; padding:6px; object-fit:contain;" />
                    <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 6px;">Install EXO ERP on iPhone / iPad</h3>
                    <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">Follow these 3 quick steps in Safari:</p>

                    <div style="display:flex; flex-direction:column; gap:14px; text-align:left; font-size:13px; color:#e2e8f0;">
                        <div style="display:flex; align-items:center; gap:12px; background:#0f172a; padding:12px; border-radius:12px;">
                            <span style="background:#0ea5e9; color:#fff; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px;">1</span>
                            <span>Tap the <strong>Share</strong> button <i class="fa-solid fa-arrow-up-from-bracket" style="color:#0ea5e9; margin-left:4px;"></i> at the bottom of Safari.</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px; background:#0f172a; padding:12px; border-radius:12px;">
                            <span style="background:#0ea5e9; color:#fff; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px;">2</span>
                            <span>Scroll down and select <strong>"Add to Home Screen"</strong> <i class="fa-regular fa-square-plus" style="color:#0ea5e9; margin-left:4px;"></i>.</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px; background:#0f172a; padding:12px; border-radius:12px;">
                            <span style="background:#0ea5e9; color:#fff; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px;">3</span>
                            <span>Tap <strong>Add</strong> at the top right. Launch EXO ERP directly like a native iOS app!</span>
                        </div>
                    </div>

                    <button onclick="document.getElementById('exo-ios-install-modal').remove()" style="
                        margin-top: 22px; width: 100%; padding: 12px; border-radius: 10px;
                        background: #0ea5e9; color: #fff; font-weight: 700; border: none; cursor: pointer;
                    ">Got it</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    function showGenericInstallModal() {
        if (document.getElementById('exo-generic-install-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'exo-generic-install-modal';
        modal.style.cssText = `
            position: fixed; inset: 0; z-index: 9999999;
            background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center; padding: 20px;
        `;
        modal.innerHTML = `
            <div style="
                background: #1e293b; border: 1px solid rgba(255,255,255,0.15);
                border-radius: 20px; max-width: 380px; width: 100%; padding: 24px;
                text-align: center; color: white; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            ">
                <button onclick="document.getElementById('exo-generic-install-modal').remove()" style="
                    position: absolute; top: 16px; right: 16px; background: none;
                    border: none; color: #94a3b8; font-size: 20px; cursor: pointer;
                ">&times;</button>
                <img src="exologo.png?v=2" style="width: 64px; height: 64px; border-radius: 12px; margin-bottom: 12px; object-fit:contain; filter: brightness(0) invert(1);" />
                <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 8px;">Install EXO ERP App</h3>
                <p style="font-size: 13px; color: #94a3b8; margin-bottom: 18px;">To install on your phone or desktop:</p>
                <div style="display:flex; flex-direction:column; gap:12px; text-align:left; font-size:13px; color:#e2e8f0; margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:12px; background:#0f172a; padding:12px; border-radius:12px;">
                        <span style="background:#0ea5e9; color:#fff; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px;">1</span>
                        <span>Tap browser menu <strong>(⋮ or ⋯)</strong> at the top right.</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; background:#0f172a; padding:12px; border-radius:12px;">
                        <span style="background:#0ea5e9; color:#fff; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px;">2</span>
                        <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; background:#0f172a; padding:12px; border-radius:12px;">
                        <span style="background:#0ea5e9; color:#fff; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px;">3</span>
                        <span>Confirm <strong>Install</strong> to launch like a native application!</span>
                    </div>
                </div>
                <button onclick="document.getElementById('exo-generic-install-modal').remove()" style="
                    width: 100%; padding: 12px; border-radius: 10px;
                    background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; font-weight: 700; border: none; cursor: pointer;
                ">Got it</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function showPwaToast(msg) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px);
            color: #fff; padding: 12px 24px; border-radius: 30px;
            border: 1px solid #0ea5e9; font-size: 13px; font-weight: 600;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 9999999;
            font-family: 'Inter', -apple-system, sans-serif;
            animation: pwaSlideUp 0.3s ease;
        `;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Auto-expose on document load
    document.addEventListener('DOMContentLoaded', () => {
        // Show install button for iOS users automatically
        if (isIOS && !isStandalone) {
            showInstallButtons(true);
        }
    });
})();
