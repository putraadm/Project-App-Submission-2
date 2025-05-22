// CSS imports
import '../styles/styles.css';

import App from './pages/app';
import config from './config';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

async function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeUserToPush(registration) {
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: await urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  return subscription;
}

async function sendSubscriptionToServer(subscription) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.warn('No auth token found, cannot subscribe to push notifications');
    return;
  }
  const response = await fetch(`${config.BASE_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(subscription),
  });
  if (!response.ok) {
    throw new Error('Failed to subscribe to push notifications');
  }
  return await response.json();
}

async function unsubscribeUserFromPush(registration) {
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found, cannot unsubscribe from push notifications');
      return;
    }
    const response = await fetch(`${config.BASE_URL}/notifications/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    if (!response.ok) {
      throw new Error('Failed to unsubscribe from push notifications');
    }
    await subscription.unsubscribe();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  const navList = document.getElementById('nav-list');

  function updateNav() {
    const token = localStorage.getItem('authToken');
    navList.innerHTML = '';

    navList.appendChild(createNavItem('#/', 'Beranda'));
    if (token) {
      navList.appendChild(createNavItem('#/add', 'Add Story'));
      navList.appendChild(createNavItem('#/logout', 'Logout'));
      navList.appendChild(createNavItem('#/subscribe', 'Subscribe'));
    } else {
      navList.appendChild(createNavItem('#/login', 'Login'));
      navList.appendChild(createNavItem('#/register', 'Register'));
    }
  }

  function createNavItem(href, text) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    a.tabIndex = 0;
    li.appendChild(a);
    return li;
  }

  // Handle logout route
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#/logout') {
      localStorage.removeItem('authToken');
      updateNav();
      window.location.hash = '#/';
      // Unsubscribe from push notifications on logout
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(unsubscribeUserFromPush).catch(console.error);
      }
    } else if (window.location.hash === '#/subscribe') {
      // Handle subscribe/unsubscribe toggle
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(async (registration) => {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            // Already subscribed, so unsubscribe
            await unsubscribeUserFromPush(registration);
            alert('Unsubscribed from push notifications.');
          } else {
            // Not subscribed, so subscribe
            const newSubscription = await subscribeUserToPush(registration);
            await sendSubscriptionToServer(newSubscription);
            alert('Subscribed to push notifications.');
          }
        }).catch(console.error);
      } else {
        alert('Service Worker not supported in this browser.');
      }
      // Reset hash to home after action
      window.location.hash = '#/';
    }
  });

  updateNav();

  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
    updateNav();
  });

  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.bundle.js');
        console.log('Service Worker registered with scope:', registration.scope);

        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const subscription = await subscribeUserToPush(registration);
            await sendSubscriptionToServer(subscription);
            console.log('User subscribed to push notifications');
          }
        } else if (Notification.permission === 'granted') {
          const subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            const newSubscription = await subscribeUserToPush(registration);
            await sendSubscriptionToServer(newSubscription);
            console.log('User subscribed to push notifications');
          }
        }
      } catch (error) {
        console.error('Service Worker registration or push subscription failed:', error);
      }
    });
  }
});
