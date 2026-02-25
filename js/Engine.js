import { Grid } from './Grid.js';
import { InputHandler } from './Input.js';
import { Bike } from './Bike.js';
import { Renderer } from './Renderer.js';
import { AudioManager } from './Audio.js';

export class Engine {
    constructor() {
        this.config = {
            gridSize: 100,
            tickRate: 15, // Bazni tick rate (biće pregažen brzinom iz menija)
            cellSize: 8
        };

        this.grid = new Grid(this.config.gridSize);
        this.input = new InputHandler();
        this.renderer = new Renderer('game', this.config);
        this.audio = new AudioManager();
        
        this.lastTime = 0;
        this.accumulator = 0;
        this.tickTime = 0; 
        
        this.players = [];
        this.isRunning = false;
        this.currentMode = 2; 
        this.selectedSpeed = 80; 
        this.introOpacity = 1;

        this.scores = { p1: 0, p2: 0, p3: 0, p4: 0 };
        this.ui = {
            status: document.getElementById('game-status'),
            overlay: document.getElementById('overlay'),
            overlayText: document.getElementById('overlay-text'),
            fps: document.getElementById('fps')
        };
    }

    /**
     * @param {number} playerCount - 2 ili 4
     * @param {number} gameSpeed - ms po tiku
     */
    init(playerCount, gameSpeed) {
        if (playerCount) this.currentMode = playerCount;
        if (gameSpeed) this.selectedSpeed = gameSpeed;

        this.tickTime = this.selectedSpeed;

        if (this.audio.ctx.state === 'suspended') {
            this.audio.ctx.resume();
        }

        this.grid.clear();
        this.players = [];

        const size = this.config.gridSize;
        const offset = 15;

        const configs = [
            { id: 1, x: offset, y: size/2, dx: 1, dy: 0, color: '#00f2ff', isAI: false },
            { id: 2, x: size - offset, y: size/2, dx: -1, dy: 0, color: '#ff2d55', isAI: true },
            { id: 3, x: size/2, y: offset, dx: 0, dy: 1, color: '#39ff14', isAI: true },
            { id: 4, x: size/2, y: size - offset, dx: 0, dy: -1, color: '#ffcc00', isAI: true }
        ];

        for (let i = 0; i < this.currentMode; i++) {
            const c = configs[i];
            this.players.push(new Bike(c.id, c.x, c.y, c.dx, c.dy, c.color, c.isAI));
        }

        this.updateUISlots();
        this.showStageIntro();
    }

    updateUISlots() {
        for (let i = 1; i <= 4; i++) {
            const box = document.getElementById(`p${i}-ui`);
            if (box) {
                if (i <= this.currentMode) {
                    box.classList.remove('hidden');
                } else {
                    box.classList.add('hidden');
                }
            }
        }
    }

    showStageIntro() {
        this.isRunning = false;
        this.introOpacity = 0; 
        let counter = 0;
        const texts = ["3", "2", "1", "GO!"];
        
        // RESETUJEMO AUDIO LOOP PRI SVAKOM INTROU
        this.audio.stopLoop();

        this.ui.status.style.color = "var(--neon-cyan)";
        this.ui.status.innerText = "";
        
        const fadeEffect = setInterval(() => {
            if (this.introOpacity < 1) {
                this.introOpacity += 0.05;
            } else {
                this.introOpacity = 1;
                clearInterval(fadeEffect);
            }
        }, 50);

        const introInterval = setInterval(() => {
            if (counter < texts.length) {
                this.ui.status.innerText = texts[counter];
                // Ovde je tišina (izbacili smo playTurn)
                counter++;
            } else {
                clearInterval(introInterval);
                this.ui.status.innerText = "SYSTEM ACTIVE";
                
                // POKREĆEMO AUDIO
                this.audio.playEngineStart();
                
                this.isRunning = true;
                this.introOpacity = 1; 
                this.lastTime = performance.now();
                this.accumulator = 0;
            }
        }, 700);
    }
    
    start(mode, speed) {
        this.init(mode, speed);
        this.audio.playBackground();

        if (!this.loopStarted) {
            this.loopStarted = true;
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    loop(currentTime) {
        const delta = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.isRunning) {
            this.accumulator += delta;
            while (this.accumulator >= this.tickTime) {
                this.update();
                this.accumulator -= this.tickTime;
            }
        }

        // POPRAVKA: Prosleđivanje isRunning i introOpacity rendereru
        this.renderer.draw(
            this.players, 
            this.input.isTurbo, 
            this.isRunning, 
            this.introOpacity
        );
        
        if (this.ui.fps) {
            this.ui.fps.innerText = Math.round(1000 / (delta || 1));
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    update() {
    // 1. Dinamička brzina (Tick Rate)
    const activeSpeed = this.input.isTurbo ? (this.selectedSpeed / 2.2) : this.selectedSpeed;
    this.tickTime = activeSpeed;

    // 2. Vizuelni Turbo Feedback i Audio Pitch Shift
    if (this.input.isTurbo) {
        document.body.classList.add('turbo-active');
        // Podižemo ton motora za .wav loop
        this.audio.updateEnginePitch(true);
    } else {
        document.body.classList.remove('turbo-active');
        // Vraćamo ton motora na normalu
        this.audio.updateEnginePitch(false);
    }

    const humanPlayer = this.players[0];

    for (let player of this.players) {
        if (player.dead) continue;

        // 3. Logika kretanja (AI vs Human)
        if (player.isAI) {
            player.think(this.grid, humanPlayer);
        } else {
            const nextMove = this.input.getNext();
            if (nextMove) {
                player.turn(nextMove);
                // Reprodukcija tvog .wav fajla za skretanje
                this.audio.playTurn();
            }
        }

        const nextPos = player.getNextPosition();

        // 4. Detekcija kolizije
        if (this.grid.isOccupied(nextPos.x, nextPos.y)) {
            player.dead = true;
            
            // Zaustavljanje loop-a i reprodukcija .wav eksplozije
            this.audio.playExplosion();

            // Haptički feedback za mobilne uređaje
            if (navigator.vibrate && !player.isAI) {
                navigator.vibrate([100, 50, 200]);
            }

            const s = this.config.cellSize;
            this.renderer.createExplosion(
                player.x * s + s / 2, 
                player.y * s + s / 2, 
                player.color
            );

            this.checkWinCondition();
            continue; 
        }

        // 5. Izvršavanje pokreta i markiranje grida
        player.move();
        this.grid.occupy(player.x, player.y, player.id);
    }
}

    checkWinCondition() {
        const alive = this.players.filter(p => !p.dead);
        
        if (alive.length <= 1) {
            this.isRunning = false;
            document.body.classList.remove('turbo-active');
            
            if (alive.length === 1) {
                const winner = alive[0];
                const scoreKey = `p${winner.id}`;
                this.scores[scoreKey]++;
                
                this.updateUI(winner.id === 1 ? "STABLE" : `CORE_${winner.id-1} DOMINANT`, winner.color);
            } else {
                this.updateUI("TOTAL COLLISION", "#fff");
            }

            setTimeout(() => this.showOverlay(), 1200);
        }
    }

    updateUI(msg, color) {
        for (let i = 1; i <= 4; i++) {
            const scoreEl = document.getElementById(`p${i}-score`);
            if (scoreEl) {
                const oldScore = scoreEl.innerText;
                const newScore = this.scores[`p${i}`] || 0;
                
                if (oldScore != newScore) {
                    scoreEl.style.animation = 'none';
                    scoreEl.offsetHeight; 
                    scoreEl.style.animation = 'blink 0.3s 3';
                }
                
                scoreEl.innerText = newScore;
            }
        }
        this.ui.status.innerText = msg;
        this.ui.status.style.color = color;
    }

    showOverlay() {
        this.ui.overlay.classList.remove('hidden');
        const p1Dead = this.players[0].dead;
        this.ui.overlayText.innerText = p1Dead ? "TERMINATED" : "DOMINATED";
        this.ui.overlayText.style.color = p1Dead ? "var(--neon-magenta)" : "var(--neon-cyan)";
        
        const restartBtn = document.getElementById('mobile-restart');
        const exitBtn = document.getElementById('mobile-exit');

        if (restartBtn) {
            restartBtn.onclick = () => {
                this.ui.overlay.classList.add('hidden');
                this.restart();
            };
        }
        if (exitBtn) {
            exitBtn.onclick = () => {
                location.reload();
            };
        }

        const handleEndGameInput = (e) => {
            if (e.code === 'Space' && !this.isRunning) {
                window.removeEventListener('keydown', handleEndGameInput);
                this.ui.overlay.classList.add('hidden');
                this.restart();
            } 
            else if (e.code === 'Escape') {
                window.removeEventListener('keydown', handleEndGameInput);
                location.reload(); 
            }
        };

        window.addEventListener('keydown', handleEndGameInput);
    }

    restart() {
        this.init(this.currentMode, this.selectedSpeed); 
    }
}