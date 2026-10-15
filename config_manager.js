// config_manager.js 

class ConfigManager {
    constructor() {
        this.config = this.getDefaultConfig();
        this.adjustConfigForMobile();
    }

    getDefaultConfig() {
        return {
            MAX_PARTICLES: 20000,
            PARTICLE_DENSITY: 1/7,
            TRANSITION_DURATION: 1000,
            MOUSE_EFFECT: { RADIUS: 15 },
            ANIMATION: {
                ATTRACTION_FORCE: 0.15,
                REPULSION_FORCE: 0.8,
                FRICTION: 0.96,
            },
            PARTICLE: {
                BASE_RADIUS: { MIN: 1, MAX: 2.5 },
                INITIAL_VELOCITY: 1.5,
                COLOR: '#e870d6',
                SHAPE: 'circle',
                TRAIL: false,
                GLOW: false
            },
            TEXT: {
                CONTENT: 'I Love you Ulya <3',
                FONT_SIZE: 200,
                COLOR: '#fea6ff',
                ANIMATION: 'none'
            },
            BACKGROUND_COLOR: '#fdbcf5',
            IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        };
    }

    adjustConfigForMobile() {
    // Больше не режем частицы — пусть код сам считает нужное количество
    // Оставляем только настройку размера, если нужно
    if (this.config.IS_MOBILE) {
        this.config.PARTICLE.BASE_RADIUS.MIN = 0.8;
        this.config.PARTICLE.BASE_RADIUS.MAX = 1.8;
    }
}

    getConfig(key) {
        return key.split('.').reduce((obj, k) => obj && obj[k], this.config);
    }

    updateConfig(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const obj = keys.reduce((o, k) => o[k] = o[k] || {}, this.config);
        obj[lastKey] = value;
    }

    resetToDefaults() {
        this.config = this.getDefaultConfig();
        this.adjustConfigForMobile();
    }
}
