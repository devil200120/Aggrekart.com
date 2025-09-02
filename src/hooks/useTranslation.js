import { useLanguage } from '../context/LanguageContext';

export const useTranslation = () => {
  const { translate, translateText, currentLanguage, isRTL } = useLanguage();

  return {
    t: translate,
    tAsync: translateText,
    currentLanguage,
    isRTL
  };
};

export default useTranslation;