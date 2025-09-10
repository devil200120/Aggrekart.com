import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useGoogleTranslate } from "../../hooks/useGoogleTranslate";
import "./GoogleTranslate.css";

const GoogleTranslate = ({ isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const dropdownRef = useRef(null);

  const { changeLanguage, getCurrentLanguage } = useGoogleTranslate();
  const currentLang = getCurrentLanguage();

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

  const getCurrentLanguageInfo = () => {
    return (
      supportedLanguages.find((lang) => lang.code === currentLang) ||
      supportedLanguages[0]
    );
  };

  const handleLanguageChange = (langCode) => {
    if (langCode === currentLang || isTranslating) return;

    setIsTranslating(true);
    setIsOpen(false);
    changeLanguage(langCode);
  };

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

  const currentLangInfo = getCurrentLanguageInfo();

  return (
    <div
      className={`google-translate-container ${isMobile ? "mobile-version" : "desktop-version"}`}
    >
      <div className="custom-translate-selector" ref={dropdownRef}>
        <button
          className="translate-trigger"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isTranslating}
          title={`Current language: ${currentLangInfo.nativeName}`}
        >
          <div className="translate-info">
            <Globe size={16} className="globe-icon" />
            {!isMobile && <span className="translate-label">Translate</span>}
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
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`language-option ${currentLang === lang.code ? "active" : ""}`}
                  disabled={isTranslating || currentLang === lang.code}
                  title={`Translate to ${lang.nativeName}`}
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
