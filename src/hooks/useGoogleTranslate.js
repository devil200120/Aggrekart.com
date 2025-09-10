import { useEffect, useCallback } from 'react';

export const useGoogleTranslate = () => {
  // Clean up Google elements
  const cleanupGoogleElements = useCallback(() => {
    const elementsToHide = [
      ".goog-te-banner-frame",
      ".goog-te-ftab", 
      "#goog-gt-tt",
      ".goog-te-balloon-frame",
      ".goog-te-spinner",
      ".goog-te-menu-frame",
      ".skiptranslate",
      'iframe[src*="translate.googleapis.com"]',
    ];

    elementsToHide.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        element.style.display = "none !important";
        element.style.visibility = "hidden !important";
        element.style.opacity = "0 !important";
      });
    });

    if (document.body.style.top) {
      document.body.style.top = "";
    }
    if (document.body.style.position === "relative") {
      document.body.style.position = "";
    }

    const googleElement = document.querySelector("#google_translate_element");
    if (googleElement) {
      googleElement.style.display = "none !important";
    }
  }, []);

  // Initialize Google Translate globally
  const initializeGoogleTranslate = useCallback(() => {
    // Prevent multiple initializations
    if (window.googleTranslateInitialized) {
      return;
    }

    if (window.google?.translate || document.querySelector('script[src*="translate.google.com"]')) {
      window.googleTranslateInitialized = true;
      cleanupGoogleElements();
      return;
    }

    window.googleTranslateElementInit = () => {
      try {
        // Create hidden container if it doesn't exist
        let container = document.querySelector("#google_translate_element");
        if (!container) {
          container = document.createElement("div");
          container.id = "google_translate_element";
          container.style.cssText = "display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute; left: -9999px; top: -9999px;";
          document.body.appendChild(container);
        }

        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,mr,te,bn,ta,gu,kn,ml,pa,or,as",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true,
          },
          "google_translate_element"
        );

        window.googleTranslateInitialized = true;
        
        setTimeout(() => {
          cleanupGoogleElements();
          const cleanupInterval = setInterval(cleanupGoogleElements, 2000);
          setTimeout(() => clearInterval(cleanupInterval), 30000);
        }, 1000);

        console.log("Google Translate initialized globally");
      } catch (error) {
        console.error("Google Translate initialization failed:", error);
      }
    };

    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => {
      console.error("Failed to load Google Translate script");
    };

    document.head.appendChild(script);
  }, [cleanupGoogleElements]);

  // Change language function that works globally
  const changeLanguage = useCallback((langCode) => {
    try {
      console.log(`Changing language to: ${langCode}`);
      
      // Save language preference
      localStorage.setItem("googleTranslate_lang", langCode);

      if (langCode === "en") {
        // Clear Google Translate cookie for English
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      } else {
        // Set Google Translate cookie for other languages
        const googTransValue = `/en/${langCode}`;
        document.cookie = `googtrans=${googTransValue}; path=/; domain=${window.location.hostname}`;
        document.cookie = `googtrans=${googTransValue}; path=/;`;
      }

      // Show loading message
      const loadingMessage = document.createElement('div');
      loadingMessage.innerHTML = `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 20px 30px;
          border-radius: 10px;
          z-index: 9999;
          text-align: center;
          font-size: 16px;
          font-weight: 500;
        ">
          <div style="margin-bottom: 10px;">🌍 Changing language...</div>
          <div style="font-size: 14px; opacity: 0.8;">Please wait</div>
        </div>
      `;
      document.body.appendChild(loadingMessage);

      // Force reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error("Language change failed:", error);
      // Fallback: Always reload on error
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, []);

  // Get current language
  const getCurrentLanguage = useCallback(() => {
    try {
      const cookies = document.cookie.split(";");
      const googTransCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("googtrans=")
      );

      if (googTransCookie) {
        const value = googTransCookie.split("=")[1];
        const langCode = value.split("/")[2] || "en";
        return langCode;
      }
      return localStorage.getItem("googleTranslate_lang") || "en";
    } catch (error) {
      return "en";
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeGoogleTranslate();

    // Set up mutation observer for cleanup
    const observer = new MutationObserver(() => {
      cleanupGoogleElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Periodic cleanup
    const cleanupInterval = setInterval(cleanupGoogleElements, 3000);

    return () => {
      observer.disconnect();
      clearInterval(cleanupInterval);
    };
  }, [initializeGoogleTranslate, cleanupGoogleElements]);

  return {
    changeLanguage,
    getCurrentLanguage,
  };
};