import { Particle } from './Particle.js';

export class Renderer {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.config = config;
        this.canvas.width = config.gridSize * config.cellSize;
        this.canvas.height = config.gridSize * config.cellSize;

        this.particles = [];
        console.log("Renderer: Sistem optimizovan za 60 FPS", this.canvas);
    }

    clear() {
        // Duboka crna pozadina procesora
        this.ctx.fillStyle = '#010103';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // --- OPTIMIZOVANA DINAMIČKA MREŽA ---
        const s = this.config.cellSize;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath(); // Batching grid linija za bolje performanse
        for (let i = 0; i <= this.config.gridSize; i += 5) {
            const alpha = (i / this.config.gridSize) * 0.15; 
            this.ctx.strokeStyle = `rgba(0, 242, 255, ${alpha + 0.05})`;
            
            // Vertikalne
            this.ctx.moveTo(i * s, 0);
            this.ctx.lineTo(i * s, this.canvas.height);
            // Horizontalne
            this.ctx.moveTo(0, i * s);
            this.ctx.lineTo(this.canvas.width, i * s);
        }
        this.ctx.stroke();
    }

    createExplosion(x, y, color) {
        // Smanjen broj čestica na 40 za stabilniji FPS pri masovnim sudarima
        for (let i = 0; i < 40; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    // DODATO: isRunning i introOpacity kao parametri za kontrolu fade-in efekta
    draw(players, isTurbo = false, isRunning = true, introOpacity = 1) {
        this.ctx.save(); 
        
        if (isTurbo) {
            const shakeX = (Math.random() - 0.5) * 7;
            const shakeY = (Math.random() - 0.5) * 7;
            this.ctx.translate(shakeX, shakeY);
        }

        this.clear(); 
        const s = this.config.cellSize;

        // 1. SUPTILNA MAGLA NA HORIZONTU
        const fog = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.4);
        fog.addColorStop(0, 'rgba(1, 1, 3, 0.3)'); 
        fog.addColorStop(1, 'rgba(1, 1, 3, 0)');   
        this.ctx.fillStyle = fog;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. ČESTICE EKSPLOZIJE (Lighter blending za neonski žar)
        this.ctx.globalCompositeOperation = 'lighter';
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => { p.update(); p.draw(this.ctx); });
        this.ctx.globalCompositeOperation = 'source-over';

        // 3. RENDER IGRAČA I OPTIMIZOVANIH SVETLOSNIH ZIDOVA
        players.forEach(player => {
            // Crtamo trag samo ako postoji, nezavisno od fade-in-a glave
            if (player.trail.length >= 2) {
                const wallHeight = s * 1.5;

                // --- A. BLOOM LAYER ---
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'screen'; 
                this.ctx.shadowBlur = 30;
                this.ctx.shadowColor = player.color;
                this.ctx.strokeStyle = player.color;
                this.ctx.lineWidth = s * 0.4;
                this.ctx.globalAlpha = 0.15;
                this.renderTrailPath(player, s, 0);

                this.ctx.shadowBlur = 15;
                this.ctx.globalAlpha = 0.3;
                this.ctx.lineWidth = 2;
                this.renderTrailPath(player, s, 0);
                this.ctx.restore();

                // --- B. VERTIKALNI ZID ---
                this.ctx.save();
                this.ctx.strokeStyle = player.color;
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = 0.5;
                this.renderTrailPath(player, s, -wallHeight * 0.5);

                this.ctx.strokeStyle = "#ffffff";
                this.ctx.lineWidth = 0.5;
                this.ctx.globalAlpha = 0.6;
                this.renderTrailPath(player, s, -wallHeight * 0.5);
                this.ctx.restore();
            }

            // --- C. NAGLAŠENI 3D MOTOR (Sa Fade-in logikom) ---
            if (!player.dead) {
                this.ctx.save();
                // Primena prozirnosti: ako igra stoji, koristimo introOpacity
                this.ctx.globalAlpha = isRunning ? 1 : introOpacity;
                this.renderBike(player, s);
                this.ctx.restore();
            }
        });

        this.ctx.restore(); 
        this.renderVignette();
    }

    renderTrailPath(player, s, yOffset) {
        this.ctx.beginPath();
        const start = player.trail[0];
        this.ctx.moveTo(start.x * s + s / 2, start.y * s + s / 2 + yOffset);
        
        for (let i = 1; i < player.trail.length; i++) {
            const pos = player.trail[i];
            this.ctx.lineTo(pos.x * s + s / 2, pos.y * s + s / 2 + yOffset);
        }
        this.ctx.stroke();
    }

    renderBike(player, s) {
        const px = player.x * s;
        const py = player.y * s;

        // Senka motora
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(px + 4, py + 4, s, s);

        this.ctx.save();
        this.ctx.translate(px + s/2, py + s/2);
        
        if (player.dx === 1)  this.ctx.rotate(0);
        if (player.dx === -1) this.ctx.rotate(Math.PI);
        if (player.dy === 1)  this.ctx.rotate(Math.PI / 2);
        if (player.dy === -1) this.ctx.rotate(-Math.PI / 2);

        const length = s * 2.2; 
        const width = s * 1.2;

        const bodyGrad = this.ctx.createLinearGradient(-length/2, 0, length/2, 0);
        bodyGrad.addColorStop(0, player.color); 
        bodyGrad.addColorStop(0.5, "#ffffff"); 
        bodyGrad.addColorStop(1, player.color); 

        this.ctx.fillStyle = bodyGrad;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = player.color;
        this.ctx.fillRect(-length/2, -width/2, length, width);

        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(length/8, -width/3, length/3, width/1.5);
        this.ctx.restore();
    }

    renderVignette() {
        const vignette = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.4,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.8
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.8)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}