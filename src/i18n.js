import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      "home": "Home",
      "products": "Products",
      "orders": "Orders",
      "my_orders": "My Orders", 
      "profile": "Profile",
      "wishlist": "Wishlist",
      "cart": "Cart",
      "support": "Support",
      "settings": "Settings",
      "logout": "Logout",
      
      // Admin/Supplier
      "dashboard": "Dashboard",
      "manage_products": "Manage Products",
      "admin_panel": "Admin Panel",
      "users": "Users",
      "suppliers": "Suppliers",
      "reports_analytics": "Reports & Analytics",
      
      // Common
      "welcome": "Welcome to AggreKart",
      "search": "Search",
      "loading": "Loading...",
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "add": "Add",
      "remove": "Remove",
      
      // Products
      "cement": "Cement",
      "bricks": "Bricks", 
      "sand": "Sand",
      "aggregates": "Aggregates",
      "tmt_steel": "TMT Steel",
      "red_bricks": "Red Bricks",
      "cc_blocks": "CC Blocks",
      "price": "Price",
      "quantity": "Quantity",
      "in_stock": "In Stock",
      "out_of_stock": "Out of Stock",
      "add_to_cart": "Add to Cart",
      "buy_now": "Buy Now",
      
      // Messages
      "language_changed": "Language changed successfully",
      "connecting_buyers": "Connecting buyers with quarries for high-quality aggregates."
    }
  },
  hi: {
    translation: {
      // Navigation  
      "home": "होम",
      "products": "उत्पाद",
      "orders": "ऑर्डर", 
      "my_orders": "मेरे ऑर्डर",
      "profile": "प्रोफ़ाइल",
      "wishlist": "इच्छा सूची",
      "cart": "कार्ट", 
      "support": "सहायता",
      "settings": "सेटिंग्स",
      "logout": "लॉग आउट",
      
      // Admin/Supplier
      "dashboard": "डैशबोर्ड",
      "manage_products": "उत्पाद प्रबंधन",
      "admin_panel": "एडमिन पैनल", 
      "users": "उपयोगकर्ता",
      "suppliers": "आपूर्तिकर्ता",
      "reports_analytics": "रिपोर्ट और विश्लेषण",
      
      // Common
      "welcome": "AggreKart में आपका स्वागत है",
      "search": "खोजें",
      "loading": "लोड हो रहा है...",
      "save": "सेव करें", 
      "cancel": "रद्द करें",
      "delete": "हटाएं",
      "edit": "संपादित करें",
      "add": "जोड़ें",
      "remove": "हटाएं",
      
      // Products
      "cement": "सीमेंट",
      "bricks": "ईंट",
      "sand": "रेत", 
      "aggregates": "एग्रीगेट्स",
      "tmt_steel": "टीएमटी स्टील",
      "red_bricks": "लाल ईंट",
      "cc_blocks": "सीसी ब्लॉक",
      "price": "कीमत",
      "quantity": "मात्रा",
      "in_stock": "स्टॉक में",
      "out_of_stock": "स्टॉक में नहीं",
      "add_to_cart": "कार्ट में डालें",
      "buy_now": "अभी खरीदें",
      
      // Messages
      "language_changed": "भाषा सफलतापूर्वक बदली गई",
      "connecting_buyers": "उच्च गुणवत्ता वाले एग्रीगेट्स के लिए खरीदारों को क्वारी से जोड़ना।"
    }
  },
  or: {
    translation: {
      // Navigation
      "home": "ଘର",
      "products": "ଉତ୍ପାଦ",
      "orders": "ଅର୍ଡର",
      "my_orders": "ମୋ ଅର୍ଡର",
      "profile": "ପ୍ରୋଫାଇଲ",
      "wishlist": "ଇଚ୍ଛା ତାଲିକା",
      "cart": "କାର୍ଟ",
      "support": "ସାହାଯ୍ୟ", 
      "settings": "ସେଟିଂ",
      "logout": "ଲଗ୍ ଆଉଟ୍",
      
      // Admin/Supplier
      "dashboard": "ଡ୍ୟାସବୋର୍ଡ",
      "manage_products": "ଉତ୍ପାଦ ପରିଚାଳନା",
      "admin_panel": "ଆଡମିନ୍ ପ୍ୟାନେଲ",
      "users": "ଉପଯୋଗକର୍ତ୍ତା",
      "suppliers": "ଯୋଗାଣକାରୀ",
      "reports_analytics": "ରିପୋର୍ଟ ଏବଂ ବିଶ୍ଳେଷଣ",
      
      // Common
      "welcome": "AggreKart ରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ",
      "search": "ଖୋଜନ୍ତୁ",
      "loading": "ଲୋଡ୍ ହେଉଛି...",
      "save": "ସେଭ୍ କରନ୍ତୁ",
      "cancel": "ବାତିଲ୍",
      "delete": "ଡିଲିଟ୍",
      "edit": "ଏଡିଟ୍",
      "add": "ଯୋଗ କରନ୍ତୁ",
      "remove": "ହଟାନ୍ତୁ",
      
      // Products  
      "cement": "ସିମେଣ୍ଟ",
      "bricks": "ଇଟା",
      "sand": "ବାଲି",
      "aggregates": "ଏଗ୍ରିଗେଟ୍ସ",
      "tmt_steel": "ଟିଏମଟି ଷ୍ଟିଲ୍",
      "red_bricks": "ଲାଲ୍ ଇଟା",
      "cc_blocks": "ସିସି ବ୍ଲକ୍",
      "price": "ଦାମ",
      "quantity": "ପରିମାଣ",
      "in_stock": "ଷ୍ଟକରେ ଅଛି",
      "out_of_stock": "ଷ୍ଟକରେ ନାହିଁ",
      "add_to_cart": "କାର୍ଟରେ ଯୋଗ କରନ୍ତୁ",
      "buy_now": "ବର୍ତ୍ତମାନ କିଣନ୍ତୁ",
      
      // Messages
      "language_changed": "ଭାଷା ସଫଳତାରେ ବଦଳାଯାଇଛି",
      "connecting_buyers": "ଉଚ୍ଚ ଗୁଣବତ୍ତା ଏଗ୍ରିଗେଟ୍ସ ପାଇଁ କ୍ରେତାମାନଙ୍କୁ ଖଣି ସହିତ ଯୋଡ଼ିବା।"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'navigator'],
      caches: ['localStorage', 'cookie']
    },
    
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;