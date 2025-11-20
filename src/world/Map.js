export default class Map {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = new Array(width * height).fill(0);

        // Create some walls (simple box for now)
        for (let x = 0; x < width; x++) {
            this.setTile(x, 0, 1);
            this.setTile(x, height - 1, 1);
        }
        for (let y = 0; y < height; y++) {
            this.setTile(0, y, 1);
            this.setTile(width - 1, y, 1);
        }

        // Random obstacles
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * (width - 2)) + 1;
            const y = Math.floor(Math.random() * (height - 2)) + 1;
            this.setTile(x, y, 1);
        }
    }

    setTile(x, y, type) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y * this.width + x] = type;
        }
    }

    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[y * this.width + x];
        }
        return 1; // Out of bounds is a wall
    }

    draw(ctx, camera) {
        const startCol = Math.floor(camera.x / this.tileSize);
        const endCol = startCol + (camera.width / this.tileSize) + 1;
        const startRow = Math.floor(camera.y / this.tileSize);
        const endRow = startRow + (camera.height / this.tileSize) + 1;

        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                const tile = this.getTile(x, y);
                if (tile === 1) {
                    ctx.fillStyle = '#222';
                    ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                    // Border for "tech" look
                    ctx.strokeStyle = '#333';
                    ctx.strokeRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                } else {
                    // Floor grid
                    ctx.strokeStyle = '#111';
                    ctx.strokeRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }
    }

    checkCollision(x, y, radius) {
        // Check corners of the bounding box
        const points = [
            { x: x - radius, y: y - radius },
            { x: x + radius, y: y - radius },
            { x: x - radius, y: y + radius },
            { x: x + radius, y: y + radius }
        ];

        for (const p of points) {
            const tileX = Math.floor(p.x / this.tileSize);
            const tileY = Math.floor(p.y / this.tileSize);
            if (this.getTile(tileX, tileY) === 1) {
                return true;
            }
        }
        return false;
    }
}
