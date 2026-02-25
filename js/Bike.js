export class Bike {
    constructor(id, x, y, dx, dy, color, isAI = false) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.isAI = isAI;
        this.trail = [{x: this.x, y: this.y}];
        this.dead = false;
    }

    // AI Mozak: Odlučuje gde da skrene
    think(grid, enemy = null) {
    if (!this.isAI || this.dead) return;

    const distToWall = this.countFreeSpace(grid, this.x + this.dx, this.y + this.dy);
    
    // Logika skretanja
    if (distToWall < 5 || Math.random() < 0.05) {
        this.findBestMove(grid, enemy);
    }
}

    findBestMove(grid, enemy) {
    const moves = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
    let bestMove = null;
    let highScore = -1000;

    for (let m of moves) {
        if (m.x === -this.dx && m.y === -this.dy) continue; // Ne može nazad
        
        let score = this.countFreeSpace(grid, this.x + m.x, this.y + m.y);
        
        // Ako je agresivan, pokušava da se približi protivniku
        if (this.personality === 'AGRESIVAN' && enemy) {
            const dist = Math.abs((this.x + m.x) - enemy.x) + Math.abs((this.y + m.y) - enemy.y);
            score -= dist * 0.5; // Što bliže, to bolje
        }

        if (score > highScore) {
            highScore = score;
            bestMove = m;
        }
    }
    if (bestMove) { this.dx = bestMove.x; this.dy = bestMove.y; }
}

    // Pomoćna funkcija: Broji koliko polja je slobodno u jednom pravcu
    countFreeSpace(grid, startX, startY) {
        let count = 0;
        let tx = startX;
        let ty = startY;
        
        // Gledamo do 10 polja unapred (balans između pameti i performansi)
        for (let i = 0; i < 10; i++) {
            if (!grid.isOccupied(tx, ty)) {
                count++;
                tx += this.dx;
                ty += this.dy;
            } else {
                break;
            }
        }
        return count;
    }

    getNextPosition() {
        return { x: this.x + this.dx, y: this.y + this.dy };
    }

    turn(newDir) {
        // Zabrana skretanja za 180 stepeni (direktno u svoj rep)
        if (newDir.x !== -this.dx || newDir.y !== -this.dy) {
            this.dx = newDir.x;
            this.dy = newDir.y;
        }
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;
        this.trail.push({x: this.x, y: this.y});
    }
}