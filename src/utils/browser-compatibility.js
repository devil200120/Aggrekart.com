// JavaScript to handle cross-browser compatibility issues
// Add this to your main.jsx or App.jsx file

// 1. Fix for 100vh on mobile browsers
function setVhProperty() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set on load and resize
window.addEventListener('load', setVhProperty);
window.addEventListener('resize', setVhProperty);

// 2. Feature detection and polyfills
function addBrowserCompatibility() {
  // Add browser-specific classes to body
  const isIE = /MSIE|Trident/.test(navigator.userAgent);
  const isEdge = /Edge/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isIE) document.body.classList.add('browser-ie');
  if (isEdge) document.body.classList.add('browser-edge');
  if (isFirefox) document.body.classList.add('browser-firefox');
  if (isSafari) document.body.classList.add('browser-safari');
  if (isChrome) document.body.classList.add('browser-chrome');
  if (isMobile) document.body.classList.add('device-mobile');

  // CSS Grid support detection
  if (!CSS.supports('display', 'grid')) {
    document.body.classList.add('no-css-grid');
  }

  // Flexbox support detection
  if (!CSS.supports('display', 'flex')) {
    document.body.classList.add('no-flexbox');
  }

  // CSS Custom Properties support
  if (!CSS.supports('color', 'var(--fake-var)')) {
    document.body.classList.add('no-css-variables');
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addBrowserCompatibility);
} else {
  addBrowserCompatibility();
}

// 3. Intersection Observer polyfill for older browsers
if (!('IntersectionObserver' in window)) {
  // Simple fallback for scroll-based animations
  window.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe(element) {
      // Simple visibility check
      const checkVisibility = () => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (isVisible) {
          this.callback([{ isIntersecting: true, target: element }]);
        }
      };
      window.addEventListener('scroll', checkVisibility);
      checkVisibility();
    }
    unobserve() {}
    disconnect() {}
  };
}

// 4. Smooth scroll polyfill for Safari and IE
if (!('scrollBehavior' in document.documentElement.style)) {
  // Simple smooth scroll implementation
  function smoothScrollTo(element) {
    const targetPosition = element.offsetTop;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 500;
    let start = null;

    function animation(currentTime) {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function easeInOutQuad(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
  }

  // Override smooth scroll behavior
  document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
      e.preventDefault();
      const target = document.querySelector(e.target.getAttribute('href'));
      if (target) smoothScrollTo(target);
    }
  });
}

// 5. Fix for iOS zoom on input focus
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea, select')) {
      document.querySelector('meta[name=viewport]').setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1'
      );
    }
  });

  document.addEventListener('focusout', () => {
    document.querySelector('meta[name=viewport]').setAttribute(
      'content',
      'width=device-width, initial-scale=1'
    );
  });
}

export { setVhProperty, addBrowserCompatibility };