import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { translationAPI } from "../services/api";
import toast from "react-hot-toast";

const LanguageContext = createContext({});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [translationCache, setTranslationCache] = useState(new Map());

  // Load supported languages
  useEffect(() => {
    loadSupportedLanguages();
  }, []);

  // Set user's preferred language when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.preferredLanguage) {
      changeLanguage(user.preferredLanguage);
    } else {
      // Try to get from localStorage or browser
      const savedLanguage = localStorage.getItem("aggrekart_language");
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      } else {
        // Auto-detect browser language
        const browserLang = navigator.language.split("-")[0];
        const supported = supportedLanguages.find(
          (lang) => lang.code === browserLang
        );
        if (supported) {
          setCurrentLanguage(browserLang);
        }
      }
    }
  }, [isAuthenticated, user, supportedLanguages]);

  // Load translations when language changes
  useEffect(() => {
    if (currentLanguage) {
      loadTranslations(currentLanguage);
    }
  }, [currentLanguage]);

  const loadSupportedLanguages = async () => {
    try {
      const response = await translationAPI.getSupportedLanguages();
      if (response.success) {
        setSupportedLanguages(response.data);
      }
    } catch (error) {
      console.error("Failed to load supported languages:", error);
      // Set default languages if API fails
      setSupportedLanguages([
        {
          code: "en",
          name: "English",
          nativeName: "English",
          isRTL: false,
          flag: "🇺🇸",
        },
        {
          code: "hi",
          name: "Hindi",
          nativeName: "हिन्दी",
          isRTL: false,
          flag: "🇮🇳",
        },
        {
          code: "or",
          name: "Odia",
          nativeName: "ଓଡ଼ିଆ",
          isRTL: false,
          flag: "🇮🇳",
        },
      ]);
    }
  };

  const loadTranslations = async (language, context = "general") => {
    try {
      console.log("🔍 Loading translations for:", language, context);
      setLoading(true);

      // Check cache first
      const cacheKey = `${language}_${context}`;
      if (translationCache.has(cacheKey)) {
        console.log("✅ Found cached translations for:", language);
        setTranslations(translationCache.get(cacheKey));
        setLoading(false);
        return;
      }

      console.log("🌐 Fetching translations from API for:", language);
      const response = await translationAPI.getTranslations(language, context);
      console.log("📦 Translation API response:", response);

      if (response.success) {
        console.log(
          "✅ Translations loaded:",
          Object.keys(response.data).length,
          "keys"
        );
        console.log("📝 Sample translations:", response.data);
        setTranslations(response.data);

        // Update cache
        setTranslationCache((prev) => {
          const newCache = new Map(prev);
          newCache.set(cacheKey, response.data);
          return newCache;
        });
      } else {
        console.warn(
          "⚠️ Translation API returned unsuccessful response:",
          response
        );
      }
    } catch (error) {
      console.error("❌ Failed to load translations:", error);
      setTranslations({});
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = useCallback(
    async (newLanguage, updateUser = true) => {
      if (newLanguage === currentLanguage) return;

      try {
        setCurrentLanguage(newLanguage);
        localStorage.setItem("aggrekart_language", newLanguage);

        // Enhanced authentication check with debugging
        console.log("🔍 Authentication check:");
        console.log("isAuthenticated:", isAuthenticated);
        console.log("user exists:", !!user);
        console.log("user object:", user); // Added detailed user logging
        console.log("user.id:", user?.id);
        console.log("user._id:", user?._id); // Check if it's _id instead of id
        console.log("updateUser:", updateUser);

        // Only update user preference if ALL conditions are met
        // Check for both id and _id as MongoDB uses _id
        if (isAuthenticated && user && (user.id || user._id) && updateUser) {
          console.log("🔐 Attempting to update user language preference...");
          try {
            await translationAPI.updateUserLanguage(newLanguage);
            console.log("✅ User language preference updated successfully");
          } catch (error) {
            console.warn(
              "⚠️ Failed to update user language preference:",
              error
            );

            // If it's a 401 error, clean up invalid tokens
            if (error.response?.status === 401) {
              console.warn("🧹 Cleaning up invalid authentication token");
              // Clear invalid token from cookies
              document.cookie =
                "aggrekart_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            }

            // Don't throw error here - language change should still work locally
          }
        } else {
          console.log(
            "👤 User not authenticated or updateUser disabled - language changed locally only"
          );
          console.log("Condition breakdown:");
          console.log("- isAuthenticated:", isAuthenticated);
          console.log("- user exists:", !!user);
          console.log("- user has id:", !!(user?.id || user?._id));
          console.log("- updateUser:", updateUser);
        }

        // Show success message
        const langName =
          supportedLanguages.find((l) => l.code === newLanguage)?.nativeName ||
          newLanguage;
        toast.success(`Language changed to ${langName}`);
      } catch (error) {
        console.error("Failed to change language:", error);
        toast.error("Failed to change language");
      }
    },
    [currentLanguage, isAuthenticated, user, supportedLanguages]
  );

  const translate = useCallback(
    (key, defaultValue = null, interpolation = {}) => {
      if (!key) return defaultValue || "";

      let translation = translations[key] || defaultValue || key;

      // Handle interpolation
      if (Object.keys(interpolation).length > 0) {
        Object.entries(interpolation).forEach(([placeholder, value]) => {
          translation = translation.replace(
            new RegExp(`{{${placeholder}}}`, "g"),
            value
          );
        });
      }

      return translation;
    },
    [translations]
  );

  const translatePlural = useCallback(
    (key, count, defaultSingular = null, defaultPlural = null) => {
      const singularKey = key;
      const pluralKey = `${key}_plural`;

      if (count === 1) {
        return translate(singularKey, defaultSingular);
      } else {
        return translate(
          pluralKey,
          defaultPlural || translate(singularKey, defaultSingular)
        );
      }
    },
    [translate]
  );

  const getCurrentLanguageInfo = useCallback(() => {
    return (
      supportedLanguages.find((lang) => lang.code === currentLanguage) ||
      supportedLanguages[0]
    );
  }, [currentLanguage, supportedLanguages]);

  const isRTL = useCallback(() => {
    const currentLang = getCurrentLanguageInfo();
    return currentLang?.isRTL || false;
  }, [getCurrentLanguageInfo]);

  const formatNumber = useCallback(
    (number, options = {}) => {
      try {
        const currentLang = getCurrentLanguageInfo();
        return new Intl.NumberFormat(currentLang?.code || "en", options).format(
          number
        );
      } catch (error) {
        return number.toString();
      }
    },
    [getCurrentLanguageInfo]
  );

  const formatCurrency = useCallback(
    (amount, currency = "INR") => {
      try {
        const currentLang = getCurrentLanguageInfo();
        return new Intl.NumberFormat(currentLang?.code || "en-IN", {
          style: "currency",
          currency: currency,
        }).format(amount);
      } catch (error) {
        return `₹${amount}`;
      }
    },
    [getCurrentLanguageInfo]
  );

  const formatDate = useCallback(
    (date, options = {}) => {
      try {
        const currentLang = getCurrentLanguageInfo();
        return new Intl.DateTimeFormat(
          currentLang?.code || "en",
          options
        ).format(new Date(date));
      } catch (error) {
        return new Date(date).toLocaleDateString();
      }
    },
    [getCurrentLanguageInfo]
  );

  // Preload translations for specific keys
  const preloadTranslations = useCallback(
    async (keys, context = "general") => {
      try {
        const response = await translationAPI.getSpecificTranslations(
          currentLanguage,
          keys.join(","),
          context
        );
        if (response.success) {
          setTranslations((prev) => ({ ...prev, ...response.data }));
        }
      } catch (error) {
        console.error("Failed to preload translations:", error);
      }
    },
    [currentLanguage]
  );

  const value = {
    currentLanguage,
    supportedLanguages,
    translations,
    loading,
    changeLanguage,
    translate,
    translatePlural,
    getCurrentLanguageInfo,
    isRTL,
    formatNumber,
    formatCurrency,
    formatDate,
    preloadTranslations,
    // Shorthand for translate
    t: translate,
    // Shorthand for translatePlural
    tp: translatePlural,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
