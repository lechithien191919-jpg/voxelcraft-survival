class Engine3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.container.appendChild(this.renderer.domElement);

        this.chunks = new Map();
        this.chunkSize = 16;
        
        // Khởi tạo quản lý texture riêng biệt
        this.textureManager = new TextureManager();
        this.materials = this.textureManager.materials;

        this.initLighting();
        window.addEventListener('resize', () => this.onWindowResize());
    }

    initLighting() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(this.ambientLight);
        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
        this.sunLight.position.set(50, 100, 50);
        this.scene.add(this.sunLight);
    }

    getTerrainHeight(x, z) {
        let nx = x * 0.03, nz = z * 0.03;
        let h = Math.sin(nx) * Math.cos(nz) * 5 + Math.sin(nx*0.5)*8 + 12;
        return Math.floor(h);
    }

    getBlock(x, y, z) {
        let cx = Math.floor(x / this.chunkSize);
        let cz = Math.floor(z / this.chunkSize);
        let key = `${cx},${cz}`;
        let chunk = this.chunks.get(key);
        if (!chunk) return BLOCK.AIR;
        
        let lx = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        let lz = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
        if (y < 0 || y >= 64) return BLOCK.AIR;
        return chunk[lx][y][lz];
    }

    setBlock(x, y, z, val) {
        let cx = Math.floor(x / this.chunkSize);
        let cz = Math.floor(z / this.chunkSize);
        let key = `${cx},${cz}`;
        let chunk = this.chunks.get(key);
        if (!chunk) {
            chunk = this.generateChunkData(cx, cz);
            this.chunks.set(key, chunk);
        }
        let lx = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        let lz = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
        if (y >= 0 && y < 64) {
            chunk[lx][y][lz] = val;
            this.rebuildChunkMesh(cx, cz);
        }
    }

    generateChunkData(cx, cz) {
        let data = Array(this.chunkSize).fill(0).map(() => 
            Array(64).fill(0).map(() => Array(this.chunkSize).fill(BLOCK.AIR))
        );

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                let wx = cx * this.chunkSize + x;
                let wz = cz * this.chunkSize + z;
                let h = this.getTerrainHeight(wx, wz);

                for (let y = 0; y < 64; y++) {
                    if (y === 0) data[x][y][z] = BLOCK.STONE;
                    else if (y < h - 3) data[x][y][z] = BLOCK.STONE;
                    else if (y < h) data[x][y][z] = BLOCK.DIRT;
                    else if (y === h) data[x][y][z] = h < 10 ? BLOCK.SAND : BLOCK.GRASS;
                }
            }
        }
        return data;
    }

    rebuildChunkMesh(cx, cz) {
        let key = `${cx},${cz}`;
        let chunk = this.chunks.get(key);
        if (!chunk) return;

        if (this.scene.getObjectByName(`chunk_${key}`)) {
            let oldMesh = this.scene.getObjectByName(`chunk_${key}`);
            this.scene.remove(oldMesh);
        }

        let chunkGroup = new THREE.Group();
        chunkGroup.name = `chunk_${key}`;
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);

        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < 64; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    let b = chunk[x][y][z];
                    if (b === BLOCK.AIR) continue;

                    let wx = cx * this.chunkSize + x;
                    let wz = cz * this.chunkSize + z;

                    let mesh = new THREE.Mesh(boxGeo, this.materials[b] || this.materials[BLOCK.STONE]);
                    mesh.position.set(wx + 0.5, y + 0.5, wz + 0.5);
                    chunkGroup.add(mesh);
                }
            }
        }

        this.scene.add(chunkGroup);
    }

    updateChunksAroundPlayer(playerPos, renderDist) {
        let pcx = Math.floor(playerPos.x / this.chunkSize);
        let pcz = Math.floor(playerPos.z / this.chunkSize);

        for (let x = -renderDist; x <= renderDist; x++) {
            for (let z = -renderDist; z <= renderDist; z++) {
                let cx = pcx + x;
                let cz = pcz + z;
                let key = `${cx},${cz}`;
                if (!this.chunks.has(key)) {
                    let data = this.generateChunkData(cx, cz);
                    this.chunks.set(key, data);
                    this.rebuildChunkMesh(cx, cz);
                }
            }
        }
    }

    renderScene() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

