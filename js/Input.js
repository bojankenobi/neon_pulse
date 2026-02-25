export class InputHandler {
    constructor() {
        this.queue = [];
        this.isTurbo = false;
        this.lastTouchTime = 0; // Za detekciju Double Tap-a (Turbo)

        // 1. TASTATURA
        window.addEventListener('keydown', (e) => {
            // Sprečavamo podrazumevane akcije (skrolovanje strelicama i Space)
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
                e.preventDefault();
            }

            // Turbo aktivacija (Shift)
            if (e.key === 'Shift') {
                this.isTurbo = true;
            }

            this.onKeyDown(e);
        }, { passive: false });

        window.addEventListener('keyup', (e) => {
            // Deaktivacija turba
            if (e.key === 'Shift') {
                this.isTurbo = false;
            }
        });

        // 2. MOBILNE KONTROLE (Inicijalizacija sa malim delay-om)
        setTimeout(() => this.setupMobileControls(), 500);
    }

    onKeyDown(e) {
        const mapping = {
            'ArrowUp': {x: 0, y: -1}, 'w': {x: 0, y: -1}, 'W': {x: 0, y: -1},
            'ArrowDown': {x: 0, y: 1}, 's': {x: 0, y: 1}, 'S': {x: 0, y: 1},
            'ArrowLeft': {x: -1, y: 0}, 'a': {x: -1, y: 0}, 'A': {x: -1, y: 0},
            'ArrowRight': {x: 1, y: 0}, 'd': {x: 1, y: 0}, 'D': {x: 1, y: 0}
        };
        
        if (mapping[e.key]) {
            if (this.queue.length < 2) {
                this.queue.push(mapping[e.key]);
            }
        }
    }

    // --- MOBILNA LOGIKA SA VIBRACIJOM ---
    setupMobileControls() {
        const zones = {
            'touch-up': {x: 0, y: -1},
            'touch-down': {x: 0, y: 1},
            'touch-left': {x: -1, y: 0},
            'touch-right': {x: 1, y: 0}
        };

        const controlsContainer = document.getElementById('touch-controls');

        Object.entries(zones).forEach(([id, direction]) => {
            const el = document.getElementById(id);
            if (el) {
                // TOUCH START - Detekcija skretanja i Turba
                el.addEventListener('touchstart', (e) => {
                    // KLJUČNO: Sprečava sistemsko zumiranje/skrolovanje na Samsung S20
                    if (e.cancelable) e.preventDefault();
                    
                    if (controlsContainer) controlsContainer.classList.add('active');

                    // 1. Detekcija smera
                    if (this.queue.length < 2) {
                        this.queue.push(direction);
                        
                        // HAPTIČKI FIDBEK: Kratka vibracija za svako skretanje
                        if (navigator.vibrate) {
                            navigator.vibrate(15);
                        }
                    }

                    // 2. Detekcija Double Tap za Turbo
                    const now = performance.now();
                    const timespan = now - this.lastTouchTime;
                    
                    if (timespan < 300 && timespan > 0) { 
                        this.isTurbo = true;
                        // Jača vibracija za aktivaciju turba
                        if (navigator.vibrate) {
                            navigator.vibrate(40);
                        }
                        // Automatsko gašenje turba na mobilnom nakon 1.5s (da ne troši bateriju/energiju)
                        setTimeout(() => this.isTurbo = false, 1500);
                    }
                    
                    this.lastTouchTime = now;
                }, { passive: false });

                // TOUCH END - Sprečava "ghost" klikove i čisti UI
                el.addEventListener('touchend', (e) => {
                    if (e.cancelable) e.preventDefault();
                    if (controlsContainer) controlsContainer.classList.remove('active');
                }, { passive: false });
            }
        });

        // Globalno sprečavanje gestova na celom ekranu da igra ne "beži"
        document.addEventListener('touchmove', (e) => {
            if (e.cancelable) e.preventDefault();
        }, { passive: false });
    }

    getNext() {
        return this.queue.shift();
    }

    clearQueue() {
        this.queue = [];
        this.isTurbo = false;
    }
}