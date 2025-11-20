export default class Map {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = [];
        this.generate();
    }

    generate() {
        // Initialize with random noise
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Borders are always walls
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    this.tiles[y][x] = 1;
                } else {
                    // 40% chance to start as wall
                    this.tiles[y][x] = Math.random() < 0.4 ? 1 : 0;
                }
            }
        }

        // Cellular Automata Smoothing (5 iterations)
        for (let i = 0; i < 5; i++) {
            this.smooth();
        }
    }

    smooth() {
        const newTiles = [];
        for (let y = 0; y < this.height; y++) {
            newTiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    newTiles[y][x] = 1;
                    continue;
                }

                const neighbors = this.countNeighbors(x, y);
                if (neighbors > 4) {
                    newTiles[y][x] = 1;
                } else if (neighbors < 4) {
                    newTiles[y][x] = 0;
                } else {
                    newTiles[y][x] = this.tiles[y][x];
                }
            }
        }
        this.tiles = newTiles;
    }

    countNeighbors(gridX, gridY) {
        let count = 0;
        for (let y = gridY - 1; y <= gridY + 1; y++) {
            for (let x = gridX - 1; x <= gridX + 1; x++) {
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    if (x !== gridX || y !== gridY) {
                        count += this.tiles[y][x];
                    }
                } else {
                    count++; // Out of bounds counts as wall
                }
            }
        }
        return count;
    }

    setTile(x, y, type) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y][x] = type;
        }
    }

    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[y][x];
        }
        return 1; // Out of bounds is a wall
    }

    checkCollision(x, y, radius) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);

        // Check surrounding tiles
        for (let ty = tileY - 1; ty <= tileY + 1; ty++) {
            for (let tx = tileX - 1; tx <= tileX + 1; tx++) {
                if (ty >= 0 && ty < this.height && tx >= 0 && tx < this.width) {
                    if (this.tiles[ty][tx] === 1) {
                        // AABB Collision for simplicity (Circle vs Rect)
                        const closestX = Math.max(tx * this.tileSize, Math.min(x, (tx + 1) * this.tileSize));
                        const closestY = Math.max(ty * this.tileSize, Math.min(y, (ty + 1) * this.tileSize));

                        const dx = x - closestX;
                        const dy = y - closestY;

                        if ((dx * dx + dy * dy) < (radius * radius)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    draw(ctx, camera) {
        const startX = Math.floor(camera.x / this.tileSize);
        const endX = Math.floor((camera.x + camera.width) / this.tileSize) + 1;
        const startY = Math.floor(camera.y / this.tileSize);
        const endY = Math.floor((camera.y + camera.height) / this.tileSize) + 1;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                    if (this.tiles[y][x] === 1) {
                        ctx.fillStyle = '#111';
                        ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                        ctx.strokeStyle = '#00f3ff';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

                        // Inner glow
                        ctx.shadowColor = '#00f3ff';
                        ctx.shadowBlur = 5;
                        ctx.fillStyle = '#002233';
                        ctx.fillRect(x * this.tileSize + 4, y * this.tileSize + 4, this.tileSize - 8, this.tileSize - 8);
                        ctx.shadowBlur = 0;
                    } else {
                        // Floor pattern
                        if ((x + y) % 2 === 0) {
                            ctx.fillStyle = '#050505';
                            ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                        }
                    }
                }
            }
        }
    }
}
