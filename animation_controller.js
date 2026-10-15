// animation_controller.js

class AnimationController {
    constructor(container) {
        this.container = container;
        this.configManager = new ConfigManager();
        this.canvasManager = new CanvasManager(container);
        this.textRenderer = new TextRenderer(this.canvasManager, this.configManager);
        this.particleManager = new ParticleManager(this.canvasManager, this.configManager);
        this.uiManager = new UIManager(this);
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseInContainer = false;
        this.isPaused = false;
        this.isPressed = false;
        this.savedTargets = null;
        this.isExploding = false;

        this.setupEventListeners();
        this.updateParticleTargets();
    }

    setupEventListeners() {
    const canvas = this.canvasManager.getCanvas();

    window.addEventListener('resize', Utils.debounce(this.handleResize.bind(this), 250));

    canvas.addEventListener('mousemove', Utils.throttle(this.handlePointerMove.bind(this), 16));
    canvas.addEventListener('touchmove', this.handlePointerMove.bind(this), { passive: false });

    canvas.addEventListener('mouseenter', () => this.isMouseInContainer = true);
    canvas.addEventListener('mouseleave', () => this.isMouseInContainer = false);
    canvas.addEventListener('touchstart', () => this.isMouseInContainer = true);
    canvas.addEventListener('touchend', () => this.isMouseInContainer = false);

    // Нажатие — частицы в центр
    canvas.addEventListener('mousedown', () => this.onPressStart());
    canvas.addEventListener('mouseup', () => this.onPressEnd());
    canvas.addEventListener('mouseleave', () => this.onPressEnd());

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.onPressStart();
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.onPressEnd();
    }, { passive: false });
}

    handlePointerMove(e) {
    if (e.cancelable) e.preventDefault();
    const canvas = this.canvasManager.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    // Пересчитываем координаты с учётом того, что canvas "больше" экрана (dpr)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    this.mouseX = (clientX - rect.left) * scaleX;
    this.mouseY = (clientY - rect.top) * scaleY;
}

   handleResize() {
    this.canvasManager.resizeCanvas();
    this.updateParticleTargets();
}
    animate(timestamp) {
        if (this.isPaused) return;

        const ctx = this.canvasManager.getContext();
        const width = this.canvasManager.getWidth();
        const height = this.canvasManager.getHeight();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);
        
        if (this.configManager.getConfig('TEXT.ANIMATION') !== 'none') {
            this.applyTextAnimation(timestamp);
        }
        
        this.textRenderer.drawGuideText();
        this.particleManager.updateAndDrawParticles(this.mouseX, this.mouseY, this.isMouseInContainer);

        requestAnimationFrame(this.animate.bind(this));
    }

    applyTextAnimation(timestamp) {
        const ctx = this.canvasManager.getContext();
        const width = this.canvasManager.getWidth();
        const height = this.canvasManager.getHeight();
        const centerX = width / 2;
        const centerY = height / 2;
        
        switch(this.configManager.getConfig('TEXT.ANIMATION')) {
            case 'pulse':
                const scale = 1 + 0.05 * Math.sin(timestamp / 500);
                ctx.setTransform(scale, 0, 0, scale, centerX * (1 - scale), centerY * (1 - scale));
                break;
            case 'rotate':
                const angle = Math.sin(timestamp / 1000) * Math.PI / 32;
                ctx.translate(centerX, centerY);
                ctx.rotate(angle);
                ctx.translate(-centerX, -centerY);
                break;
        }
    }

    updateParticleTargets() {
        const textPoints = this.textRenderer.getTextPoints(this.particleManager.targetParticleCount);
        this.particleManager.updateParticleTargets(textPoints);
    }

    start() {
        this.isPaused = false;
        requestAnimationFrame(this.animate.bind(this));
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.start();
        }
    }

    cleanup() {
        window.removeEventListener('resize', this.handleResize);
        const canvas = this.canvasManager.getCanvas();
        canvas.removeEventListener('mousemove', this.handlePointerMove);
        canvas.removeEventListener('touchmove', this.handlePointerMove);
        canvas.removeEventListener('mouseenter', () => this.isMouseInContainer = true);
        canvas.removeEventListener('mouseleave', () => this.isMouseInContainer = false);
        canvas.removeEventListener('touchstart', () => this.isMouseInContainer = true);
        canvas.removeEventListener('touchend', () => this.isMouseInContainer = false);
        canvas.removeEventListener('mousedown', this.onPressStart);
        canvas.removeEventListener('mouseup', this.onPressEnd);
        canvas.removeEventListener('mouseleave', this.onPressEnd);

        this.particleManager.cleanup();
        this.textRenderer.cleanup();
        this.canvasManager.cleanup();
        this.uiManager.cleanup();
    }

    onPressStart() {
    if (this.isPressed) return;
    this.isPressed = true;
    this.isExploding = false;

    // сохраняем цели частиц (координаты букв)
    this.savedTargets = this.particleManager.particles.map(p => ({
        x: p.targetX,
        y: p.targetY
    }));

    // отправляем все частицы в центр
    const cx = this.canvasManager.getWidth() / 2;
    const cy = this.canvasManager.getHeight() / 2;
    this.particleManager.particles.forEach(p => {
        p.setTarget(cx, cy);
    });
}

onPressEnd() {
    if (!this.isPressed) return;
    this.isPressed = false;

    // ВЗРЫВ: даём каждой частице случайную скорость во все стороны
    const explodePower = 45; // сила взрыва — крути это число
    this.particleManager.particles.forEach(p => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * explodePower + explodePower * 0.5;
        p.vx += Math.cos(angle) * speed;
        p.vy += Math.sin(angle) * speed;
    });

    // возвращаем цели на буквы — пружинка сама их притянет обратно
    if (this.savedTargets) {
        this.particleManager.particles.forEach((p, i) => {
            if (this.savedTargets[i]) {
                p.setTarget(this.savedTargets[i].x, this.savedTargets[i].y);
            }
        });
        this.savedTargets = null;
    }
}
}
