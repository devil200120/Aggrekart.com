import React, { useEffect, useState, useCallback, useRef } from "react";
import { Globe, ChevronDown } from "lucide-react";
import "./GoogleTranslate.css";

const GoogleTranslate = () => {
  const [currentLang, setCurrentLang] = useState("en");
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const translateRef = useRef(null);
  const dropdownRef = useRef(null);

  const supportedLanguages = [
    { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
    { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳" },
    { code: "as", name: "Assamese", nativeName: "অসমীয়া", flag: "🇮🇳" },
  ];

  // Get current language info
  const getCurrentLanguageInfo = () => {
    return (
      supportedLanguages.find((lang) => lang.code === currentLang) ||
      supportedLanguages[0]
    );
  };

  // Initialize Google Translate widget
  const initializeGoogleTranslate = useCallback(() => {
    if (isInitialized || window.google?.translate) return;

    // Check if script already exists
    if (document.querySelector('script[src*="translate.google.com"]')) {
      setIsInitialized(true);
      return;
    }

    window.googleTranslateElementInit = () => {
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: supportedLanguages
              .map((lang) => lang.code)
              .join(","),
            layout:
              window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true,
          },
          "google_translate_element"
        );

        setIsInitialized(true);

        // Hide Google's UI elements after initialization
        setTimeout(() => {
          hideBannerAndElements();
        }, 500);
      } catch (error) {
        console.error("Google Translate initialization failed:", error);
      }
    };

    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => {
      console.error("Failed to load Google Translate script");
    };

    document.head.appendChild(script);
  }, [isInitialized]);

  // Hide Google's banner and UI elements
  const hideBannerAndElements = useCallback(() => {
    const elementsToHide = [
      ".goog-te-banner-frame.skiptranslate",
      ".goog-te-ftab",
      "#goog-gt-tt",
      ".goog-te-balloon-frame",
      'iframe[src*="translate.googleapis.com"]',
      ".goog-te-spinner",
    ];

    elementsToHide.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        element.style.display = "none !important";
        element.style.visibility = "hidden !important";
        element.style.opacity = "0 !important";
        element.remove?.();
      });
    });

    // Hide the default Google Translate dropdown
    const googleElement = document.querySelector("#google_translate_element");
    if (googleElement) {
      googleElement.style.display = "none";
    }

    // Remove Google's added styles that affect page layout
    const googleStyles = document.querySelectorAll('style[id*="goog"]');
    googleStyles.forEach((style) => {
      if (style.textContent?.includes("body{top:")) {
        style.remove();
      }
    });
  }, []);

  // Get current Google Translate language
  const detectCurrentLanguage = useCallback(() => {
    try {
      // Check Google Translate cookie
      const cookies = document.cookie.split(";");
      const googTransCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("googtrans=")
      );

      if (googTransCookie) {
        const value = googTransCookie.split("=")[1];
        const langCode = value.split("/")[2] || "en";
        return langCode;
      }

      // Check if page is translated by looking for Google's translation elements
      const translateElements = document.querySelectorAll('[class*="goog-te"]');
      if (translateElements.length > 0) {
        // Try to detect from page content or other indicators
        return currentLang;
      }

      return "en";
    } catch (error) {
      console.warn("Error detecting language:", error);
      return "en";
    }
  }, [currentLang]);

  // Change language without page reload
  const changeLanguage = useCallback(
    async (langCode) => {
      if (langCode === currentLang || isTranslating) return;

      setIsTranslating(true);
      setIsOpen(false);

      try {
        // Method 1: Use Google Translate API directly if available
        if (window.google?.translate) {
          const translateElement = window.google.translate.TranslateElement?.();

          // Clear previous translation
          const googTransCookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
          document.cookie = googTransCookie;

          // Trigger translation without reload
          if (langCode === "en") {
            // Restore original content
            restoreOriginalContent();
          } else {
            // Apply translation
            await applyTranslation(langCode);
          }
        } else {
          // Fallback: Set cookie and use Google's standard method
          const googTransCookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
          document.cookie = googTransCookie;

          // Trigger Google Translate refresh without full page reload
          if (window.google?.translate?.TranslateElement) {
            window.location.href = window.location.href.split("#")[0];
          }
        }

        setCurrentLang(langCode);

        // Save language preference
        localStorage.setItem("googleTranslate_lang", langCode);
      } catch (error) {
        console.error("Translation failed:", error);
        // Fallback to page reload only if necessary
        if (!window.google?.translate) {
          const googTransCookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
          document.cookie = googTransCookie;
          window.location.reload();
        }
      } finally {
        setIsTranslating(false);
      }
    },
    [currentLang, isTranslating]
  );

  // Restore original content (English)
  const restoreOriginalContent = useCallback(() => {
    try {
      // Remove translation cookies
      document.cookie =
        "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" +
        window.location.hostname;

      // Find and restore original text
      const translatedElements = document.querySelectorAll(
        '[class*="goog-te"], [jstcache]'
      );
      translatedElements.forEach((element) => {
        if (element.hasAttribute("jstcache")) {
          // This is a Google Translate modified element
          const originalText =
            element.getAttribute("data-original-text") || element.textContent;
          if (originalText && originalText !== element.textContent) {
            element.textContent = originalText;
          }
        }
      });
    } catch (error) {
      console.warn("Could not restore original content:", error);
    }
  }, []);

  // Apply translation to page
  const applyTranslation = useCallback(async (langCode) => {
    try {
      if (!window.google?.translate) return;

      // Store original text before translation
      const textNodes = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while ((node = textNodes.nextNode())) {
        if (
          node.textContent.trim() &&
          !node.parentElement?.hasAttribute("data-original-text")
        ) {
          node.parentElement?.setAttribute(
            "data-original-text",
            node.textContent
          );
        }
      }

      // Trigger Google Translate
      const event = new CustomEvent("googleTranslate", {
        detail: { targetLanguage: langCode },
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.warn("Translation application failed:", error);
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Initialize component
  useEffect(() => {
    // Load saved language preference
    const savedLang =
      localStorage.getItem("googleTranslate_lang") || detectCurrentLanguage();
    setCurrentLang(savedLang);

    // Initialize Google Translate
    initializeGoogleTranslate();

    // Set up mutation observer to hide Google elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === 1 &&
              (node.className?.includes?.("goog-te") ||
                node.id?.includes?.("goog"))
            ) {
              setTimeout(hideBannerAndElements, 100);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [initializeGoogleTranslate, hideBannerAndElements, detectCurrentLanguage]);

  // Periodically clean up Google elements
  useEffect(() => {
    const cleanupInterval = setInterval(hideBannerAndElements, 2000);
    return () => clearInterval(cleanupInterval);
  }, [hideBannerAndElements]);

  const currentLangInfo = getCurrentLanguageInfo();

  return (
    <div className="google-translate-container" ref={translateRef}>
      {/* Hidden Google Translate Element */}
      <div id="google_translate_element" style={{ display: "none" }}></div>

      {/* Custom Language Selector */}
      <div className="custom-translate-selector" ref={dropdownRef}>
        <button
          className="translate-trigger"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isTranslating}
        >
          <div className="translate-info">
            <Globe size={16} className="globe-icon" />
            <span className="translate-label">Translate</span>
            <div className="current-lang">
              <span className="flag">{currentLangInfo.flag}</span>
              <span className="lang-name">{currentLangInfo.nativeName}</span>
            </div>
          </div>
          <ChevronDown
            size={14}
            className={`chevron ${isOpen ? "rotated" : ""} ${isTranslating ? "spinning" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="translate-dropdown">
            <div className="dropdown-header">
              <Globe size={14} />
              <span>Select Language</span>
            </div>

            <div className="language-list">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`language-option ${currentLang === lang.code ? "active" : ""}`}
                  disabled={isTranslating || currentLang === lang.code}
                >
                  <span className="flag">{lang.flag}</span>
                  <div className="lang-details">
                    <span className="native-name">{lang.nativeName}</span>
                    <span className="english-name">{lang.name}</span>
                  </div>
                  {currentLang === lang.code && (
                    <span className="checkmark">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="dropdown-footer">
              <small>Powered by Google Translate</small>
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {isTranslating && (
        <div className="translate-loading">
          <div className="loading-spinner"></div>
          <span>Translating...</span>
        </div>
      )}
    </div>
  );
};

export default GoogleTranslate;
