import i18next from 'i18next';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18next.addResourceBundle('en', 'navigation', en);
i18next.addResourceBundle('tr', 'navigation', tr);
i18next.addResourceBundle('ar', 'navigation', ar);

const navAdminConfig = [
   
    {
        id: 'trigger-component',
        title: 'trigger',
        translate: `Lançamentos Financeiros`,
        type: 'item',
        icon: 'heroicons-outline:plus-circle',
        url: 'lancamentos',
    },
    {
        id: 'trigger-component',
        title: 'trigger',
        translate: 'Alçada de Aprovação',
        type: 'item',
        icon: 'heroicons-outline:currency-dollar',
        url: 'aprovação',
    },
    {
        id: 'trigger-component',
        title: 'trigger',
        translate: 'Movimentações Financeiras',
        type: 'item',
        icon: 'heroicons-outline:currency-dollar',
        url: 'extrato-lançamentos',
    },


];

export default navAdminConfig;
