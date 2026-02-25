import { Engine } from './Engine.js';

window.addEventListener('load', () => {
    // Inicijalizacija engine-a
    const game = new Engine();
    const menu = document.getElementById('main-menu');
    const startBtn = document.getElementById('start-btn');
    
    // Inicijalne vrednosti (podrazumevane)
    let selectedPlayerCount = 2;
    let selectedSpeed = 80;

    // Funkcija za "buđenje" audia na mobilnim uređajima
    const unlockAudio = () => {
        if (game.audio) {
            game.audio.playBackground(); // Ovo aktivira AudioContext i pušta muziku
        }
    };

    // Upravljanje dugmićima u meniju
    const menuButtons = document.querySelectorAll('.menu-btn:not(#start-btn)');

    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Aktiviramo audio na bilo koji klik u meniju (prevencija za mobilne)
            unlockAudio();

            // Pronalazimo srodnu dugmad u istoj sekciji da im skinemo 'active' klasu
            const parent = btn.parentElement;
            parent.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
            
            // Aktiviramo kliknuto dugme
            btn.classList.add('active');

            // Ažuriramo vrednosti ako su kliknuti
            if (btn.dataset.players) {
                selectedPlayerCount = parseInt(btn.dataset.players);
            }
            if (btn.dataset.speed) {
                selectedSpeed = parseInt(btn.dataset.speed);
            }
        });
    });

    // START DUGME - Pokretanje sistema
    startBtn.addEventListener('click', () => {
        // Ključno za PWA na Samsung S20 Ultra: Otključaj audio pre sakrivanja menija
        unlockAudio();

        // Sakrivamo meni
        menu.classList.add('hidden');

        // Pokrećemo igru sa odabranim parametrima
        game.start(selectedPlayerCount, selectedSpeed);
    });

    // Restart logike na Escape
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            if (menu.classList.contains('hidden')) {
                // Ako smo u igri, Escape radi reload (povratak u meni)
                location.reload();
            }
        }
    });

    // Opciono: SPACE na overlay-u za restart runde
    window.addEventListener('keydown', (e) => {
        const overlay = document.getElementById('overlay');
        if (e.code === 'Space' && overlay && !overlay.classList.contains('hidden')) {
            unlockAudio(); // Osiguranje audia i pri restartu
            game.start(selectedPlayerCount, selectedSpeed);
        }
    });
});