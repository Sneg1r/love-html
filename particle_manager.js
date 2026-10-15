// particle_manager.js

class ParticleManager {
    constructor(canvasManager, configManager) {
        this.canvasManager = canvasManager;
        this.configManager = configManager;
        this.particles = [];
        this.targetParticleCount = this.configManager.getConfig('MAX_PARTICLES');
        this.setupResizeListener();
    }

    initParticles() {
        this.particles = [];
        document.getElementById('debug').textContent = 'Частиц: ' + this.particles.length;
    }

    setupResizeListener() {
        this.canvasManager.getCanvas().addEventListener('canvasResized', (event) => {
            this.adjustParticlesOnResize(event.detail);
        });
    }

    adjustParticlesOnResize(resizeDetail) {
        const { oldWidth, oldHeight, newWidth, newHeight } = resizeDetail;
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;
        
        this.particles.forEach(particle => {
            particle.x *= scaleX;
            particle.y *= scaleY;
            particle.targetX *= scaleX;
            particle.targetY *= scaleY;
        });

        // Asegurarse de que las partículas estén dentro de los nuevos límites
        this.particles.forEach(particle => {
            particle.x = Utils.clamp(particle.x, particle.radius, newWidth - particle.radius);
            particle.y = Utils.clamp(particle.y, particle.radius, newHeight - particle.radius);
        });
    }

    containParticle(particle) {
        const width = this.canvasManager.getWidth();
        const height = this.canvasManager.getHeight();
        const margin = particle.radius;
        particle.x = Math.max(margin, Math.min(width - margin, particle.x));
        particle.y = Math.max(margin, Math.min(height - margin, particle.y));
    }

    updateAndDrawParticles(mouseX, mouseY, isMouseInContainer) {
        const ctx = this.canvasManager.getContext();
        const width = this.canvasManager.getWidth();
        const height = this.canvasManager.getHeight();

        ctx.clearRect(0, 0, width, height);

        this.particles.forEach(particle => {
            particle.update(width, height, mouseX, mouseY, isMouseInContainer);
            particle.draw(ctx);
        });
    }

    updateParticleTargets(textPoints) {
    // Сколько точек — столько и частиц (но не больше MAX_PARTICLES)
    const maxParticles = this.configManager.getConfig('MAX_PARTICLES');
    const neededCount = Math.min(textPoints.length, maxParticles);

    const width = this.canvasManager.getWidth();
    const height = this.canvasManager.getHeight();

    // Если частиц больше, чем нужно — обрезаем
    if (this.particles.length > neededCount) {
        this.particles.splice(neededCount);
    }
    // Если меньше — добавляем новые
    while (this.particles.length < neededCount) {
        this.particles.push(
            new Particle(Utils.random(0, width), Utils.random(0, height), this.configManager)
        );
    }

    // Раздаём цели: каждая частица получает свою точку
    for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].setTarget(textPoints[i].x, textPoints[i].y);
    }
}

    adjustParticleCount(textPoints) {
        const width = this.canvasManager.getWidth();
        const height = this.canvasManager.getHeight();

        if (this.particles.length > textPoints.length) {
            this.particles.splice(textPoints.length);
        } else if (this.particles.length < textPoints.length) {
            for (let i = this.particles.length; i < textPoints.length; i++) {
                const newParticle = new Particle(
                    Utils.random(0, width),
                    Utils.random(0, height),
                    this.configManager
                );
                newParticle.setTarget(textPoints[i].x, textPoints[i].y);
                this.particles.push(newParticle);
            }
        }
    }

    updateParticleSizes() {
        const minRadius = this.configManager.getConfig('PARTICLE.BASE_RADIUS.MIN');
        const maxRadius = this.configManager.getConfig('PARTICLE.BASE_RADIUS.MAX');
        this.particles.forEach(particle => {
            particle.radius = Utils.random(minRadius, maxRadius);
        });
    }

    updateParticleColors() {
        const color = this.configManager.getConfig('PARTICLE.COLOR');
        this.particles.forEach(particle => {
            particle.color = color;
        });
    }

    updateParticleShapes() {
        const shape = this.configManager.getConfig('PARTICLE.SHAPE');
        this.particles.forEach(particle => {
            particle.shape = shape;
        });
    }
}
