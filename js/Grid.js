export class Grid {
    constructor(size) {
        this.size = size;
        this.data = new Uint8Array(size * size);
    }

    isOccupied(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) return true;
        return this.data[y * this.size + x] !== 0;
    }

    occupy(x, y, id) {
        this.data[y * this.size + x] = id;
    }

    clear() {
        this.data.fill(0);
    }
}