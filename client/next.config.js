const { PHASE_DEVELOPMENT_SERVER: dev, PHASE_PRODUCTION_BUILD: prod } = require('next/constants')

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
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                // pathname: '/account123/**',
            },
        ]
    },
    output: 'standalone',
    trailingSlash: true,
}



/**
 * @returns {import('next').NextConfig}
 **/
module.exports = (phase, { defaultConfig }) => {

    switch (phase) {
        case dev:
            return ({
                ...baseConfig,
                experimental:{
                    reactCompiler: true,
                }
            });
        case prod:
            return ({
                ...baseConfig,
            });
        default: return baseConfig
    }
}
