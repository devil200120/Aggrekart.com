// filepath: c:\Users\KIIT0001\Desktop\builder_website using mern\front-end\app\src\components\common\LanguageSelector.jsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./LanguageSelector.css";

export const LanguageSelector = ({ variant = "dropdown", className = "" }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const supportedLanguages = [
    { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
    { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  ];

  const currentLangInfo =
    supportedLanguages.find((lang) => lang.code === i18n.language) ||
    supportedLanguages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = async (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  if (variant === "inline") {
    return (
      <div className={`language-selector inline ${className}`}>
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`lang-button ${i18n.language === lang.code ? "active" : ""}`}
            title={lang.nativeName}
          >
            <span className="flag">{lang.flag}</span>
            <span className="code">{lang.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`language-selector dropdown ${className}`}
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="selector-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="current-language">
          <span className="flag">{currentLangInfo?.flag}</span>
          <span className="name">{currentLangInfo?.nativeName}</span>
        </div>
        <ChevronDown
          size={16}
          className={`chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="language-dropdown">
          <div className="dropdown-header">
            <Globe size={14} />
            <span>Choose Language</span>
          </div>
          <ul className="language-list" role="listbox">
            {supportedLanguages.map((lang) => (
              <li key={lang.code} role="option">
                <button
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`language-option ${i18n.language === lang.code ? "active" : ""}`}
                >
                  <div className="language-info">
                    <span className="flag">{lang.flag}</span>
                    <div className="names">
                      <span className="native-name">{lang.nativeName}</span>
                      <span className="english-name">{lang.name}</span>
                    </div>
                  </div>
                  {i18n.language === lang.code && (
                    <Check size={16} className="check-icon" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Compact version for mobile/header
export const CompactLanguageSelector = ({ className = "" }) => {
  return (
    <LanguageSelector variant="dropdown" className={`compact ${className}`} />
  );
};

// Modal version for settings page
export const LanguageModal = ({ isOpen, onClose, className = "" }) => {
  const {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    getCurrentLanguageInfo,
  } = useLanguage();

  const handleLanguageChange = async (langCode) => {
    await changeLanguage(langCode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="language-modal-overlay" onClick={onClose}>
      <div className="language-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select Language</h3>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="language-grid">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`language-card ${currentLanguage === lang.code ? "active" : ""}`}
              >
                <div className="card-content">
                  {lang.flag && <span className="flag large">{lang.flag}</span>}
                  <div className="language-details">
                    <span className="native-name">{lang.nativeName}</span>
                    <span className="english-name">{lang.name}</span>
                  </div>
                  {currentLanguage === lang.code && (
                    <Check size={20} className="check-icon" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
