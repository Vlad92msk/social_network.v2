const { PHASE_DEVELOPMENT_SERVER: dev, PHASE_PRODUCTION_BUILD: prod } = require('next/constants')
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

/**
 * БАЗОВЫЙ КОНФИГ ДЛЯ ВСЕХ СБОРОК
 * @type {import('next').NextConfig}
 **/
const baseConfig= {
    webpack: (config, { isServer, dev }) => {
        const isDevMode = dev;

        // Обновляем правило для SVG файлов
        config.module.rules.push({
            test: /\.svg$/,
            use: [{
                loader: '@svgr/webpack',
                options: {
                    typescript: true,
                    dimensions: false
                }
            }]
        });

        config.experiments = {
            ...config.experiments,
            topLevelAwait: true,
        };

        return config;
    },
    env: {
        APPLE_ID: 'APPLE_ID',
        APPLE_SECRET: 'APPLE_SECRET',
        GOOGLE_ID: '232906585557-9k9ckn13pgdvovf4p2fn73amkqe25m7a.apps.googleusercontent.com',
        GOOGLE_SECRET: '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',
        NEXTAUTH_SECRET: 'ptnvr',
        NEXTAUTH_URL: 'http://localhost:3000',
        DB_URL: 'http://localhost:3001'
    },
    images: {
        // Указываем домены с которых можно получать картинок с внешних сервисов
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                // pathname: '/account123/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3001',
                // pathname: '/uploads/**',
            },
        ]
    },
    output: 'standalone',
    trailingSlash: true,
    experimental: {
        esmExternals: true,
    }
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
                experimental:{
                    reactCompiler: false,
                }
            });
        case prod:
            return ({
                ...intlConfig,
            });
        default: return intlConfig
    }
}
