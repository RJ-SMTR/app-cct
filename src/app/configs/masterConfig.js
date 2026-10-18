import i18next from 'i18next';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18next.addResourceBundle('en', 'navigation', en);
i18next.addResourceBundle('tr', 'navigation', tr);
i18next.addResourceBundle('ar', 'navigation', ar);

const masterConfig = [
    {
        id: 'dashboard-pagamentos-component',
        title: 'Dashboard de Pagamentos',
        translate: 'Dashboard de Pagamentos',
        type: 'item',
        icon: 'heroicons-outline:chart-bar',
        url: 'dashboard-pagamentos',
    },
    {
        id: 'Administrativo',
        title: 'Administrativo',
        subtitle: '',
        type: 'collapse',
        icon: 'heroicons-outline:briefcase',
        children: [

            {
                id: 'Home-component',
                title: 'Permissionário',
                translate: 'Permissionário',
                type: 'item',
                icon: 'material-symbols-outlined:airport_shuttle',
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
            // {
            //     id: 'trigger-component',
            //     title: 'trigger',
            //     translate: 'Disparo',
            //     type: 'item',
            //     icon: 'heroicons-solid:mail',
            //     url: 'disparo',
            // },

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
                title: 'Guardador',
                translate: 'Guardador',
                type: 'item',
                icon: 'material-symbols-outlined:parking_sign',
                url: 'agentes',
            },
        ]

    },
    // GRUPO FINANCEIRO
    {
        id: 'Financeiro',
        title: 'Financeiro',
        subtitle: '',
        type: 'collapse',
        icon: 'heroicons-outline:currency-dollar',
        url: 'group-finan-pai',
        children: [
            // {
            //     id: 'Agendamento',
            //     title: 'Agendar Pagamentos',
            //     subtitle: '',
            //     type: 'item',
            //     icon: '',
            //     url: 'group-finan',


            // },

            // {
            //     id: 'trigger-component',
            //     title: 'report',
            //     translate: 'Agendar Remessa ',
            //     type: 'item',
            //     icon: 'heroicons-outline:document-report',
            //     url: 'agendar',
            // },
            // {
            //     id: 'trigger-component',
            //     title: 'balance',
            //     translate: 'Aprovação Remessa ',
            //     type: 'item',
            //     icon: 'heroicons-outline:currency-dollar',
            //     url: 'aprovacao-remessa',
            // },
            {
                id: 'Visão Financeira',
                title: 'Visão Financeira',
                subtitle: '',
                type: 'item',
                icon: '',
                url: 'group-finan',

            },
            {
                id: 'ordem-pagamento-component',
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
                id: 'pagamentos-component',
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
                    // Menu "Pendente" e submenus ocultados a pedido (backend ainda não implementado).
                    // {
                    //     id: 'pagamentos-pendente-component',
                    //     title: 'Pendente',
                    //     translate: 'Pendente',
                    //     type: 'collapse',
                    //     icon: 'heroicons-outline:clock',
                    //     children: [
                    //         {
                    //             id: 'pagamentos-pendente-consorcios-component',
                    //             title: 'Consórcios',
                    //             translate: 'Consórcios',
                    //             type: 'item',
                    //             icon: 'heroicons-outline:office-building',
                    //             url: 'pagamentos/pendente/consorcios',
                    //         },
                    //         {
                    //             id: 'pagamentos-pendente-modais-component',
                    //             title: 'Modais',
                    //             translate: 'Modais',
                    //             type: 'item',
                    //             icon: 'heroicons-outline:truck',
                    //             url: 'pagamentos/pendente/modais',
                    //         },
                    //         {
                    //             id: 'pagamentos-pendente-guardadores-component',
                    //             title: 'Guardadores',
                    //             translate: 'Guardadores',
                    //             type: 'item',
                    //             icon: 'material-symbols-outlined:parking_sign',
                    //             url: 'pagamentos/pendente/guardadores',
                    //         },
                    //     ],
                    // },
                ],
            },
            {
                id: 'report-component',
                title: 'report',
                translate: 'Relatórios',
                type: 'item',
                icon: 'material-outline:ballot',
                url: 'relatorio',
            },
            {
                id: 'trigger-component',
                title: 'balance',
                translate: 'Extrato ',
                type: 'item',
                icon: 'heroicons-outline:currency-dollar',
                url: 'extrato-contas',
            },


            // Menu "Lançamentos Financeiro" e submenus ocultados a pedido.
            // {
            //     id: 'Financeiro',
            //     title: 'Lançamentos Financeiro',
            //     subtitle: '',
            //     type: 'item',
            //     icon: '',
            //     url: 'group-finan',
            // },
            // {
            //     id: 'trigger-component',
            //     title: 'trigger',
            //     translate: 'Lançamentos',
            //     type: 'item',
            //     icon: 'heroicons-outline:plus-circle',
            //     url: 'lancamentos',
            // },
            // {
            //     id: 'trigger-component',
            //     title: 'trigger',
            //     translate: 'Alçada de Aprovação',
            //     type: 'item',
            //     icon: 'heroicons-outline:currency-dollar',
            //     url: 'aprovação',
            // },
            // {
            //     id: 'trigger-component',
            //     title: 'report',
            //     translate: 'Relatório Lançamentos',
            //     type: 'item',
            //     icon: 'heroicons-outline:document-report',
            //     url: 'relatorio-lançamento',
            // },
        ]

    },
    // GRUPO CONFIGURAÇÕES
    {
        id: 'Configuracoes',
        title: 'Configurações',
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
        ],
    },




];

export default masterConfig;
