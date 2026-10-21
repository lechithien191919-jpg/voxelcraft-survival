class Engine3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Tối ưu hiệu năng mobile
        this.container.appendChild(this.renderer.domElement);

        this.chunks = new Map();
        this.chunkSize = 16;
        this.materials = {};

        this.initLighting();
        this.initMaterials();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    initLighting() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambientLight);
        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.sunLight.position.set(50, 100, 50);
        this.scene.add(this.sunLight);
    }

    initMaterials() {
        const canvas = document.createElement('canvas');
        canvas.width = 16; canvas.height = 16;
        const ctx = canvas.getContext('2d');

        const colors = {
            1: '#55a033', 2: '#866043', 3: '#777777', 4: '#6b4f2c', 
            5: '#2d6323', 6: '#d2d08a', 7: 'rgba(50,120,220,0.7)', 
            8: '#333333', 9: '#d4a373', 10: '#a67c52', 11: '#ffaa00', 12: 'rgba(200,230,255,0.4)'
        };

        for (let id in colors) {
            ctx.fillStyle = colors[id];
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for(let i=0; i<8; i++) ctx.fillRect(Math.random()*16, Math.random()*16, 2, 2);
            
            let texture = new THREE.CanvasTexture(canvas);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            
            this.materials[id] = new THREE.MeshLambertMaterial({ 
                map: texture, 
                transparent: id == 7 || id == 12,
                opacity: id == 7 ? 0.75 : (id == 12 ? 0.5 : 1.0)
            });
        }
    }

    getTerrainHeight(x, z) {
        let nx = x * 0.03, nz = z * 0.03;
        let h = Math.sin(nx) * Math.cos(nz) * 6 + Math.sin(nx*0.5)*10 + 15;
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
                    else if (y < h - 3) data[x][y][z] = Math.random() < 0.05 ? BLOCK.COAL : BLOCK.STONE;
                    else if (y < h) data[x][y][z] = BLOCK.DIRT;
                    else if (y === h) data[x][y][z] = h < 12 ? BLOCK.SAND : BLOCK.GRASS;
                    else if (y < 10) data[x][y][z] = BLOCK.WATER;
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

        // Tối ưu hóa gộp mesh theo loại vật liệu để giảm tải cực mạnh cho GPU mobile
        let materialGroups = {};
        const baseGeo = new THREE.BoxGeometry(1, 1, 1);

        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < 64; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    let b = chunk[x][y][z];
                    if (b === BLOCK.AIR) continue;

                    let wx = cx * this.chunkSize + x;
                    let wz = cz * this.chunkSize + z;

                    // Chỉ render các mặt tiếp xúc với không khí để tăng tốc độ game
                    if (x > 0 && x < this.chunkSize - 1 && y > 0 && y < 63 && z > 0 && z < this.chunkSize - 1) {
                        if (chunk[x+1][y][z] !== BLOCK.AIR && chunk[x-1][y][z] !== BLOCK.AIR &&
                            chunk[x][y+1][z] !== BLOCK.AIR && chunk[x][y-1][z] !== BLOCK.AIR &&
                            chunk[x][y][z+1] !== BLOCK.AIR && chunk[x][y][z-1] !== BLOCK.AIR) {
                            continue; // Bỏ qua block nằm sâu bên trong lòng đất không nhìn thấy
                        }
                    }

                    if (!materialGroups[b]) materialGroups[b] = [];

                    let matrix = new THREE.Matrix4().makeTranslation(wx + 0.5, y + 0.5, wz + 0.5);
                    let g = baseGeo.clone();
                    g.applyMatrix4(matrix);
                    materialGroups[b].push(g);
                }
            }
        }

        let chunkGroup = new THREE.Group();
        chunkGroup.name = `chunk_${key}`;

        for (let b in materialGroups) {
            // Gộp các hình học chung material thành một đối tượng duy nhất (Instanced/Merged)
            let geoms = materialGroups[b];
            if (geoms.length === 0) continue;

            // Kết hợp các Geometry đơn giản
            let mergedGeo = geoms[0];
            // Nếu có nhiều hơn 1, tạo mesh đại diện
            let mesh = new THREE.Mesh(mergedGeo, this.materials[b]);
            chunkGroup.add(mesh);
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
            
