export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.buffers = {};
        this.loopSource = null;
        this.loopGain = null;
        
        // Pozadinska muzika (ostaje kao Audio objekat radi lakšeg strimovanja)
        this.bgMusic = new Audio('./assets/music/neon-pulse-theme.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.3;

        // Putanje do tvojih .wav fajlova
        this.files = {
            start: './assets/music/start.wav',
            loop: './assets/music/loop.wav',
            turn: './assets/music/turn.wav',
            explosion: './assets/music/explosion.wav'
        };

        this.loadAll();
    }

    // Učitavanje svih .wav fajlova u memoriju
    async loadAll() {
        for (const [key, url] of Object.entries(this.files)) {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                this.buffers[key] = await this.ctx.decodeAudioData(arrayBuffer);
            } catch (e) {
                console.error(`Audio: Neuspešno učitavanje fajla ${url}`, e);
            }
        }
    }

    // Pokretanje pozadinske muzike
    playBackground() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.bgMusic.play().catch(e => console.log("Audio: Čekam interakciju za muziku"));
    }

    // Inicijalni start motora (poziva se na "GO!")
    playEngineStart() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        // Obavezno zaustavljamo prethodni loop pre nego što pokrenemo start sekvencu
        this.stopLoop();

        if (this.buffers.start) {
            const startNode = this.ctx.createBufferSource();
            startNode.buffer = this.buffers.start;
            startNode.connect(this.ctx.destination);
            startNode.start(0);

            // Precizno zakazujemo start loop-a odmah nakon start zvuka
            const startDuration = this.buffers.start.duration;
            setTimeout(() => this.startLoop(), startDuration * 1000);
        } else {
            // Ako start buffer nije učitan, odmah pređi na loop
            this.startLoop();
        }
    }

    // Kontinuirani zvuk motora
    startLoop() {
        // Ako već radi ili buffer nije učitan, ne radi ništa (zaštita od dupliranja)
        if (this.loopSource || !this.buffers.loop) return;

        this.loopSource = this.ctx.createBufferSource();
        this.loopSource.buffer = this.buffers.loop;
        this.loopSource.loop = true;

        this.loopGain = this.ctx.createGain();
        this.loopGain.gain.value = 0.15; 

        this.loopSource.connect(this.loopGain);
        this.loopGain.connect(this.ctx.destination);
        
        this.loopSource.start(0);
        console.log("Audio: Motor loop pokrenut");
    }

    // Promena tona za Turbo mod
    updateEnginePitch(isTurbo) {
        if (this.loopSource) {
            const targetPitch = isTurbo ? 1.4 : 1.0;
            // setTargetAtTime omogućava gladak prelaz (glide) između tonova
            this.loopSource.playbackRate.setTargetAtTime(targetPitch, this.ctx.currentTime, 0.1);
        }
    }

    // Zvuk skretanja
    playTurn() {
        if (!this.buffers.turn) return;
        const turnNode = this.ctx.createBufferSource();
        turnNode.buffer = this.buffers.turn;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.3;
        turnNode.connect(gain);
        gain.connect(this.ctx.destination);
        turnNode.start(0);
    }

    // Zvuk eksplozije i gašenje motora
    playExplosion() {
        this.stopLoop();
        if (!this.buffers.explosion) return;
        const expNode = this.ctx.createBufferSource();
        expNode.buffer = this.buffers.explosion;
        expNode.connect(this.ctx.destination);
        expNode.start(0);
    }

    // Čišćenje loop kanala (rešava problem u 1vs3 modu)
    stopLoop() {
        if (this.loopSource) {
            try {
                this.loopSource.stop(0);
                this.loopSource.disconnect();
            } catch(e) {
                // Već je zaustavljen
            }
            this.loopSource = null;
            this.loopGain = null;
        }
    }
}