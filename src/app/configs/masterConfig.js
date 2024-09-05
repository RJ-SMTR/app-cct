import i18next from 'i18next';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18next.addResourceBundle('en', 'navigation', en);
i18next.addResourceBundle('tr', 'navigation', tr);
i18next.addResourceBundle('ar', 'navigation', ar);

const masterConfig = [
    {
        id: 'Home-component',
        title: 'Home',
        translate: 'Home',
        type: 'item',
        icon: 'heroicons-outline:home',
        url: 'admin',

    },
    {
        id: 'upload-component',
        title: 'Upload',
        translate: 'Upload',
        type: 'item',
        icon: 'heroicons-outline:upload',
        url: 'upload',
    },
    {
        id: 'trigger-component',
        title: 'trigger',
        translate: 'Disparo',
        type: 'item',
        icon: 'heroicons-solid:mail',
        url: 'disparo',
    },

    {
        id: 'Financeiro',
        title: 'Financeiro',
        subtitle: '',
        type: 'group',
        icon: '',
        children: [
            {
                id: 'trigger-component',
                title: 'trigger',
                translate: 'Lançamentos Financeiros',
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
        ]
    },
    {
        id: 'Relatórios',
        title: 'Relatórios',
        subtitle: '',
        type: 'group',
        icon: '',
        children: [
            {
                id: 'trigger-component',
                title: 'report',
                translate: 'Relatório ',
                type: 'item',
                icon: 'heroicons-outline:document-report',
                url: 'relatorio',
            },
            {
                id: 'trigger-component',
                title: 'report',
                translate: 'Relatório Lançamentos',
                type: 'item',
                icon: 'heroicons-outline:document-report',
                url: 'relatorio-lançamento',
            },
        ]
    },
  

];

export default masterConfig;
