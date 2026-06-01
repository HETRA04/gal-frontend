// Runs only inside the native iOS/Android app — safe no-op in browser
;(function () {
  if (!window.Capacitor?.isNativePlatform?.()) return

  var ONESIGNAL_APP_ID = 'd3cc5490-9f95-4ae9-8308-092265465519'
  var _ran = false

  function onReady() {
    if (_ran) return; _ran = true
    var P = window.Capacitor.Plugins

    // OneSignal
    if (P.OneSignal) {
      P.OneSignal.initialize(ONESIGNAL_APP_ID)
    }
    // Request permission (SDK v5 splits into sub-plugin)
    var OSN = P.OneSignalNotifications || P.OneSignal?.Notifications
    if (OSN?.requestPermission) {
      OSN.requestPermission({ fallbackToSettings: true }).catch(function () {})
    }

    // Status bar — white bg, dark icons
    if (P.StatusBar) {
      P.StatusBar.setStyle({ style: 'DARK' }).catch(function () {})
      P.StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(function () {})
    }
  }

  // Capacitor fires this when the bridge is ready
  document.addEventListener('deviceready', onReady)
  // Fallback for when bridge is injected before DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(onReady, 50) })
  } else {
    setTimeout(onReady, 50)
  }

  // Called by app.js requireRole() after login — links Supabase UID to OneSignal
  window._syncOSUser = function (userId) {
    var OS = window.Capacitor?.Plugins?.OneSignal
    if (OS?.login) OS.login(userId).catch(function () {})
  }

  window._clearOSUser = function () {
    var OS = window.Capacitor?.Plugins?.OneSignal
    if (OS?.logout) OS.logout().catch(function () {})
  }
})()
