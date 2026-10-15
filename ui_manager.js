// UIManager.js

class UIManager {
    constructor(animationController) {
        this.animationController = animationController;
        this.configManager = animationController.configManager;
    }

    adjustControlsLayout() {
        // панели нет — ничего не делаем
    }

    cleanup() {
        // нечего чистить
    }
}