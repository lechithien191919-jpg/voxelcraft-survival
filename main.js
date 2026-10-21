class VoxelGame {
    constructor() {
        this.engine = new Engine3D('canvas-container');
        this.player = new PlayerManager();
        this.ui = new UIManager(this);

        this.inventory = Array(36).fill(null);
        this.hotbarSlot = 0;
        this.inventory[0] = { id: 4, count: 10 };
        this.inventory[1] = { id: 101, count: 1 };
        this.inventory[2] = { id: 11, count: 16 };

        this.worldTime = 6000;
        this.dayDuration = 120000;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.gameStarted = false;
        this.paused = false;

        this.initAudio();
        this.initControls();

        document.getElementById('loading-overlay').style.opacity = '0';
        setTimeout(() => document.getElementById('loading-overlay').style.display = 'none', 500);
    }

    initAudio() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        } catch(e) { console.log('Web Audio API không được hỗ trợ'); }
    }

    playSound(type) {
        if (!document.getElementById('audio-toggle').checked || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        
        let osc = this.audioCtx.createOscillator();
        let gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        
        let now = this.audioCtx.currentTime;
        if (type === 'break') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'place') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(350, now + 0.08);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
            osc.start(now); osc.stop(now + 0.08);
        }
    }

    startWorld(loadSaved = false) {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('crosshair').classList.remove('hidden');
        if (this.isMobile) document.getElementById('mobile-controls').style.display = 'block';

        if (loadSaved && localStorage.getItem('voxelcraft_save')) {
            this.loadGame();
        } else {
            this.player.pos.set(0, 45, 0);
        }

        this.gameStarted = true;
        this.lastTime = performance.now();
        this.ui.updateHotbarUI(this.inventory, this.hotbarSlot);
        this.gameLoop();
    }

    initControls() {
        document.addEventListener('click', () => {
            if (this.gameStarted && !this.paused && !this.isMobile) {
                document.body.requestPointerLock();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.gameStarted || this.paused || (!document.pointerLockElement && !this.isMobile)) return;
            let movementX = e.movementX || e.mozMovementX || 0;
            let movementY = e.movementY || e.mozMovementY || 0;
            
            this.player.yaw -= movementX * 0.003;
            this.player.pitch -= movementY * 0.003;
            this.player.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.player.pitch));
        });

        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') this.togglePause();
            if (e.code >= 'Digit1' && e.code <= 'Digit9') {
                this.hotbarSlot = parseInt(e.code[5]) - 1;
                this.ui.updateHotbarUI(this.inventory, this.hotbarSlot);
            }
            if (e.code === 'KeyE') this.openInventory();
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        if (this.isMobile) {
            let joyBase = document.getElementById('joystick-base');
            let joyStick = document.getElementById('joystick-stick');
            let touchId = null;
            let joyCenter = { x: 0, y: 0 };

            joyBase.addEventListener('touchstart', (e) => {
                let t = e.changedTouches[0];
                touchId = t.identifier;
                let rect = joyBase.getBoundingClientRect();
                joyCenter.x = rect.left + rect.width/2;
                joyCenter.y = rect.top + rect.height/2;
            });

            joyBase.addEventListener('touchmove', (e) => {
                for (let t of e.changedTouches) {
                    if (t.identifier === touchId) {
                        let dx = t.clientX - joyCenter.x;
                        let dy = t.clientY - joyCenter.y;
                        let dist = Math.min(50, Math.hypot(dx, dy));
                        let angle = Math.atan2(dy, dx);
                        joyStick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
                        this.mobileMoveDir = { x: Math.cos(angle)*(dist/50), z: Math.sin(angle)*(dist/50) };
                    }
                }
            });

            let endJoy = (e) => {
                for (let t of e.changedTouches) {
                    if (t.identifier === touchId) {
                        touchId = null;
                        joyStick.style.transform = `translate(0px, 0px)`;
                        this.mobileMoveDir = null;
                    }
                }
            };
            joyBase.addEventListener('touchend', endJoy);
            joyBase.addEventListener('touchcancel', endJoy);

            document.getElementById('btn-jump').addEventListener('touchstart', () => { if (this.player.onGround) this.player.vel.y = this.player.jumpForce; });
            document.getElementById('btn-break').addEventListener('touchstart', () => this.breakBlock());
            document.getElementById('btn-action').addEventListener('touchstart', () => this.placeBlock());
            document.getElementById('btn-inv').addEventListener('touchstart', () => this.openInventory());

            let lastTouchX = 0, lastTouchY = 0;
            window.addEventListener('touchstart', (e) => {
                if (e.target.closest('#mobile-controls') || e.target.closest('.window-box')) return;
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            });
            window.addEventListener('touchmove', (e) => {
                if (e.target.closest('#mobile-controls') || e.target.closest('.window-box')) return;
                let t = e.touches[0];
                let dx = t.clientX - lastTouchX;
                let dy = t.clientY - lastTouchY;
                this.player.yaw -= dx * 0.005;
                this.player.pitch -= dy * 0.005;
                this.player.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.player.pitch));
                lastTouchX = t.clientX;
                lastTouchY = t.clientY;
            });
        }
    }

    togglePause() {
        this.paused = !this.paused;
        let pauseMenu = document.getElementById('pause-menu');
        if (this.paused) {
            pauseMenu.classList.remove('hidden');
            document.exitPointerLock();
        } else {
            pauseMenu.classList.add('hidden');
        }
    }

    resumeGame() { this.paused = false; document.getElementById('pause-menu').classList.add('hidden'); }
    returnToMenu() { location.reload(); }

    openInventory() {
        this.paused = true;
        document.getElementById('inventory-screen').classList.remove('hidden');
        this.ui.updateInventoryUI();
    }

    closeInventory() {
        this.paused = false;
        document.getElementById('inventory-screen').classList.add('hidden');
    }

    openSettings() { document.getElementById('settings-screen').classList.remove('hidden'); }
    closeSettings() { document.getElementById('settings-screen').classList.add('hidden'); }

    craftItem(recipeIdx) {
        let rec = CRAFTING_RECIPES[recipeIdx];
        let hasAll = rec.ingredients.every(ing => {
            let total = this.inventory.reduce((sum, item) => (item && item.id === ing.id) ? sum + item.count : sum, 0);
            return total >= ing.count;
        });

        if (hasAll) {
            rec.ingredients.forEach(ing => {
                let rem = ing.count;
                for (let i = 0; i < this.inventory.length; i++) {
                    if (this.inventory[i] && this.inventory[i].id === ing.id) {
                        if (this.inventory[i].count >= rem) {
                            this.inventory[i].count -= rem;
                            if (this.inventory[i].count === 0) this.inventory[i] = null;
                            rem = 0;
                            break;
                        } else {
                            rem -= this.inventory[i].count;
                            this.inventory[i] = null;
                        }
                    }
                }
            });

            let added = false;
            for (let i = 0; i < this.inventory.length; i++) {
                if (this.inventory[i] && this.inventory[i].id === rec.output.id && this.inventory[i].count < ITEMS_DEF[rec.output.id].maxStack) {
                    this.inventory[i].count += rec.output.count;
                    added = true;
                    break;
                }
            }
            if (!added) {
                for (let i = 0; i < this.inventory.length; i++) {
                    if (!this.inventory[i]) {
                        this.inventory[i] = { id: rec.output.id, count: rec.output.count };
                        added = true;
                        break;
                    }
                }
            }
            this.ui.updateInventoryUI();
            this.ui.updateHotbarUI(this.inventory, this.hotbarSlot);
        }
    }

    breakBlock() {
        let raycaster = new THREE.Raycaster();
        let dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(1,0,0), this.player.pitch).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.yaw);
        raycaster.set(this.engine.camera.position, dir);

        for (let dist = 1; dist <= 5; dist += 0.5) {
            let p = this.engine.camera.position.clone().add(dir.clone().multiplyScalar(dist));
            let bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z);
            let b = this.engine.getBlock(bx, by, bz);
            if (b !== BLOCK.AIR && b !== BLOCK.WATER) {
                this.engine.setBlock(bx, by, bz, BLOCK.AIR);
                this.playSound('break');
                this.addItemToInventory(b, 1);
                break;
            }
        }
    }

    placeBlock() {
        let item = this.inventory[this.hotbarSlot];
        if (!item || item.type !== 'block') return;

        let raycaster = new THREE.Raycaster();
        let dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(1,0,0), this.player.pitch).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.yaw);
        raycaster.set(this.engine.camera.position, dir);

        let lastP = null;
        for (let dist = 1; dist <= 5; dist += 0.3) {
            let p = this.engine.camera.position.clone().add(dir.clone().multiplyScalar(dist));
            let bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z);
            let b = this.engine.getBlock(bx, by, bz);
            if (b !== BLOCK.AIR && b !== BLOCK.WATER) {
                if (lastP) {
                    let px = Math.floor(this.player.pos.x), py = Math.floor(this.player.pos.y), pz = Math.floor(this.player.pos.z);
                    if (lastP.x === px && (lastP.y === py || lastP.y === py+1) && lastP.z === pz) return;

                    this.engine.setBlock(lastP.x, lastP.y, lastP.z, item.id);
                    this.playSound('place');
                    item.count--;
                    if (item.count <= 0) this.inventory[this.hotbarSlot] = null;
                    this.ui.updateHotbarUI(this.inventory, this.hotbarSlot);
                }
                break;
            }
            lastP = { x: bx, y: by, z: bz };
        }
    }

    addItemToInventory(id, count) {
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i] && this.inventory[i].id === id && this.inventory[i].count < ITEMS_DEF[id].maxStack) {
                this.inventory[i].count += count;
                this.ui.updateHotbarUI(this.inventory, this.hotbarSlot);
                return;
            }
        }
        for (let i = 0; i < this.inventory.length; i++) {
            if (!this.inventory[i]) {
                this.inventory[i] = { id: id, count: count };
                this.ui.updateHotbarUI(this.inventory, this.hotbarSlot);
                return;
            }
        }
    }

    saveGameManually() {
        let saveData = {
            pos: { x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z },
            inventory: this.inventory,
            worldTime: this.worldTime
        };
        localStorage.setItem('voxelcraft_save', JSON.stringify(saveData));
        alert('Đã lưu thế giới thành công!');
    }

    loadGame() {
        let data = JSON.parse(localStorage.getItem('voxelcraft_save'));
        if (data) {
            this.player.pos.set(data.pos.x, data.pos.y, data.pos.z);
            this.inventory = data.inventory;
            this.worldTime = data.worldTime || 6000;
        }
    }

    update(dt) {
        if (!this.gameStarted || this.paused) return;

        this.worldTime = (this.worldTime + dt * 1000 * (24000 / this.dayDuration)) % 24000;
        let hours = Math.floor(this.worldTime / 1000 + 6) % 24;
        let mins = Math.floor((this.worldTime % 1000) / 1000 * 60);
        document.getElementById('time-val').innerText = `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;

        let sunAngle = (this.worldTime / 24000) * Math.PI * 2;
        this.engine.sunLight.position.set(Math.cos(sunAngle) * 100, Math.sin(sunAngle) * 100, 50);
        let intensity = Math.max(0.1, Math.sin(sunAngle));
        this.engine.sunLight.intensity = intensity;
        this.engine.scene.background.setHSL(0.55, 0.5, intensity * 0.4 + 0.1);

        this.player.updatePosition(dt, this.keys, this.mobileMoveDir, this.engine);
        this.player.updateCamera(this.engine.camera);

        let rd = parseInt(document.getElementById('render-dist').value) || 4;
        this.engine.updateChunksAroundPlayer(this.player.pos, rd);
    }

    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        let now = performance.now();
        let dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (dt > 0.1) dt = 0.1;

        document.getElementById('fps-val').innerText = Math.round(1 / dt);

        this.update(dt);
        this.engine.renderScene();
    }
}

const game = new VoxelGame();
