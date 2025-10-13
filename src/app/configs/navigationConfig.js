import i18next from 'i18next';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18next.addResourceBundle('en', 'navigation', en);
i18next.addResourceBundle('tr', 'navigation', tr);
i18next.addResourceBundle('ar', 'navigation', ar);

const navigationConfig = [
  // {
  //   id: 'Home-component',
  //   title: 'Home',
  //   translate: 'Home',
  //   type: 'item',
  //   icon: 'heroicons-outline:home',
  //   url: '/',
  // },
  {
    id: 'profile',
    title: 'Perfil',
    translate: 'Perfil',
    type: 'item',
    icon: 'heroicons-outline:user-circle',
    url: 'profile',
  },
  {
    id: 'extract',
    title: 'Financeiro',
    translate: 'Financeiro',
    type: 'item',
    icon: 'heroicons-outline:currency-dollar',
    url: 'extrato',
  },
  {
    id: 'trigger-component',
    title: 'report',
    translate: 'Relatório',
    type: 'item',
    icon: 'heroicons-outline:document-report',
    url: 'relatorio-vanzeiro',
  },
  {
    id: 'support',
    title: 'Suporte',
    translate: 'Suporte',
    type: 'item',
    icon: 'material-outline:contact_support',
    target: '_blank',
    url: 'https://transportes.prefeitura.rio/atendimentodigital/',
  },
];

export default navigationConfig;
