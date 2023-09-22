import i18next from 'i18next';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18next.addResourceBundle('en', 'navigation', en);
i18next.addResourceBundle('tr', 'navigation', tr);
i18next.addResourceBundle('ar', 'navigation', ar);

const navAdminConfig = [
    {
        id: 'Home-component',
        title: 'Home',
        translate: 'Home',
        type: 'item',
        icon: 'heroicons-outline:home',
        url: '/',
    },
  
   
];

export default navAdminConfig;
