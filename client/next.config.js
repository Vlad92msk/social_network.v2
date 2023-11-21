const { PHASE_DEVELOPMENT_SERVER: dev, PHASE_PRODUCTION_BUILD: prod } = require('next/constants')
const withNextIntl = require('next-intl/plugin')('./i18n.ts')

/**
 * БАЗОВЫЙ КОНФИГ ДЛЯ ВСЕХ СБОРОК
 * @type {import('next').NextConfig}
 **/
const baseConfig= {
    webpack: (config, { isServer, dev }) => {
        const isDevMode = dev;

        return config;
    },
    env: {APPLE_ID: 'APPLE_ID',
        APPLE_SECRET: 'APPLE_SECRET',
        GOOGLE_ID: '232906585557-9k9ckn13pgdvovf4p2fn73amkqe25m7a.apps.googleusercontent.com',
        GOOGLE_SECRET: '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',
        NEXTAUTH_SECRET: 'ptnvr',
        NEXTAUTH_URL: 'http://localhost:3000' // ??????
    },
    images: {
        // Указываем домены с которых можно получать картинок с внешних сервисов
        domains: ['lh3.googleusercontent.com'],
    },
    output: 'standalone',
    trailingSlash: true,
}


// Обертка базового конфига с помощью withNextIntl
const intlConfig = withNextIntl({ ...baseConfig });

/**
 * @returns {import('next').NextConfig}
 **/
module.exports = (phase, { defaultConfig }) => {

    switch (phase) {
        case dev:
            return ({
                ...intlConfig,
            });
        case prod:
            return ({
                ...intlConfig,
            });
        default: return intlConfig
    }
}