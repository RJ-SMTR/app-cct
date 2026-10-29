import i18next from 'i18next';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import { authRoles } from 'src/app/auth';
import tr from './navigation-i18n/tr';

i18next.addResourceBundle('en', 'navigation', en);
i18next.addResourceBundle('tr', 'navigation', tr);
i18next.addResourceBundle('ar', 'navigation', ar);

// Estrutura: Dashboard, Administrativo, Financeiro, Pagamentos, Pendências e Regularizações e Administração do Sistema.
// Menu "Lançamentos Financeiro" e seus submenus seguem ocultos a pedido.
const masterConfig = [
    {
        id: 'dashboard-pagamentos-component',
        auth: authRoles.masterTi,
        title: 'Dashboard de Pagamentos',
        translate: 'Dashboard de Pagamentos',
        type: 'item',
        icon: 'heroicons-outline:chart-bar',
        url: 'dashboard-pagamentos',
    },
    // 1. ADMINISTRATIVO - gestão cadastral e entrada de dados
    {
        id: 'Administrativo',
        title: 'Administrativo',
        subtitle: '',
        type: 'collapse',
        icon: 'heroicons-outline:briefcase',
        children: [
            {
                id: 'Home-component',
                title: 'Permissionários',
                translate: 'Permissionários',
                type: 'item',
                icon: 'material-symbols-outlined:airport_shuttle',
                url: 'admin',
            },
            {
                id: 'upload-component',
                title: 'Upload de arquivos',
                translate: 'Upload de arquivos',
                type: 'item',
                icon: 'heroicons-outline:upload',
                url: 'upload',
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
            {
                id: 'agentes-component',
                title: 'Guardadores',
                translate: 'Guardadores',
                type: 'item',
                icon: 'material-symbols-outlined:parking_sign',
                url: 'agentes',
            },
        ],
    },
    // 2. FINANCEIRO - consulta financeira, execução e controle dos pagamentos
    {
        id: 'Financeiro',
        title: 'Financeiro',
        subtitle: '',
        type: 'collapse',
        icon: 'heroicons-outline:currency-dollar',
        url: 'group-finan-pai',
        children: [
            {
                id: 'ordem-pagamento-component',
                auth: authRoles.masterTi,
                title: 'Ordens de Pagamento',
                translate: 'Ordens de Pagamento',
                type: 'collapse',
                icon: 'heroicons-outline:credit-card',
                children: [
                    {
                        id: 'ordem-pagamento-permissionario-component',
                        title: 'Permissionário',
                        translate: 'Permissionário',
                        type: 'item',
                        icon: 'material-symbols-outlined:airport_shuttle',
                        url: 'ordem-pagamento/permissionario',
                    },
                    {
                        id: 'ordem-pagamento-guardador-component',
                        title: 'Guardador',
                        translate: 'Guardador',
                        type: 'item',
                        icon: 'material-symbols-outlined:parking_sign',
                        url: 'ordem-pagamento/guardador',
                    },
                ],
            },
            {
                id: 'trigger-component',
                title: 'balance',
                translate: 'Extrato',
                type: 'item',
                icon: 'heroicons-outline:currency-dollar',
                url: 'extrato-contas',
            },
            {
                id: 'report-component',
                title: 'report',
                translate: 'Relatórios',
                type: 'item',
                icon: 'material-outline:ballot',
                url: 'relatorio',
            },
        ],
    },
    // 3. PAGAMENTOS - organização dos pagamentos por modalidade e situação
    {
        id: 'pagamentos-component',
        auth: authRoles.masterTi,
        title: 'Pagamentos',
        translate: 'Pagamentos',
        type: 'collapse',
        icon: 'heroicons-outline:cash',
        children: [
            {
                id: 'pagamentos-consorcios-component',
                title: 'Consórcios',
                translate: 'Consórcios',
                type: 'item',
                icon: 'heroicons-outline:office-building',
                url: 'pagamentos/consorcios',
            },
            {
                id: 'pagamentos-modais-component',
                title: 'Modais',
                translate: 'Modais',
                type: 'item',
                icon: 'heroicons-outline:truck',
                url: 'pagamentos/modais',
            },
            {
                id: 'pagamentos-guardadores-component',
                title: 'Guardadores',
                translate: 'Guardadores',
                type: 'item',
                icon: 'material-symbols-outlined:parking_sign',
                url: 'pagamentos/guardadores',
            },
        ],
    },
    // 4. PENDÊNCIAS E REGULARIZAÇÕES - tratamento de exceções e situações pendentes
    {
        id: 'pendencias-component',
        auth: authRoles.masterTi,
        title: 'Pendências e Regularizações',
        translate: 'Pendências e Regularizações',
        type: 'collapse',
        icon: 'heroicons-outline:clipboard-list',
        children: [
            {
                id: 'pagamentos-indevidos-component',
                title: 'Indevidos de Guardadores',
                translate: 'Indevidos de Guardadores',
                type: 'item',
                icon: 'heroicons-outline:exclamation-circle',
                url: 'pagamentos/indevidos',
            },
            {
                id: 'pagamentos-pendentes-permissionarios-component',
                title: 'Pendências de Permissionários',
                translate: 'Pendências de Permissionários',
                type: 'item',
                icon: 'material-symbols-outlined:airport_shuttle',
                url: 'pagamentos/pendentes/permissionarios',
            },
            {
                id: 'pagamentos-pendentes-guardadores-component',
                title: 'Pendências de Guardadores',
                translate: 'Pendências de Guardadores',
                type: 'item',
                icon: 'material-symbols-outlined:parking_sign',
                url: 'pagamentos/pendentes/guardadores',
            },
        ],
    },
    // 5. ADMINISTRAÇÃO DO SISTEMA - configuração, acesso e rastreabilidade
    {
        id: 'Configuracoes',
        title: 'Administração do Sistema',
        subtitle: '',
        type: 'collapse',
        icon: 'heroicons-outline:cog',
        children: [
            {
                id: 'change-password-component',
                title: 'Alterar Senha',
                translate: 'Alterar Senha',
                type: 'item',
                icon: 'heroicons-outline:key',
                url: 'change-password',
            },
            {
                id: 'auditoria-component',
                auth: authRoles.masterTi,
                title: 'Auditoria',
                translate: 'Auditoria',
                type: 'item',
                icon: 'heroicons-outline:shield-check',
                url: 'auditoria',
            },
            {
                id: 'controle-remessa-erros-component',
                auth: authRoles.masterTi,
                title: 'Controle Remessa Erros',
                translate: 'Controle Remessa Erros',
                type: 'item',
                icon: 'heroicons-outline:exclamation',
                url: 'controle-remessa-erros',
            },
        ],
    },
];

export default masterConfig;
