import i18next from 'i18next';
import { authRoles } from 'src/app/auth';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18next.addResourceBundle('en', 'navigation', en);
i18next.addResourceBundle('tr', 'navigation', tr);
i18next.addResourceBundle('ar', 'navigation', ar);

const pagamentosConfig = [
  {
    id: 'pagamentos',
    title: 'Pagamentos',
    translate: 'Pagamentos',
    type: 'item',
    icon: 'material-symbols-outlined:payment',
    url: 'pagamentos',
    auth: authRoles.admin,
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

export default pagamentosConfig;
