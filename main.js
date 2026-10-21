class VoxelGame {
    constructor() {
        this.engine = new Engine3D('canvas-container');
        this.player = new PlayerManager();
        this.ui = new UIManager(this);

        this.inventory = Array(36).fill(null);
        this.hotbarSlot = 0;
        this.inventory[0] = { id: 1, count: 64, type: 'block' }; // Cỏ
        this.inventory[1] = { id: 3, count: 64, type: 'block' }; // Đá
        this.inventory[2] = { id: 4, count: 64, type: 'block' }; // Gỗ

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
        } catch(e) {}
    }

    playSound(type) {
        if (!document.getElementById('audio-toggle').checked || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        let osc = this.audioCtx.createOscillator();
        let gain = this.audioCtx.createGain();
        osc.connect(gain); gain.connect(this.audioCtx.destination);
        let now = this.audioCtx.currentTime;
        osc.frequency.setValueAtTime(type === 'break' ? 120 : 250, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
    }

    startWorld(loadSaved = false) {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('crosshair').classList.remove('hidden');
        if (this.isMobile) document.getElementById('mobile-controls').style.display = 'block';

        this.player.pos.set(0, 30, 0);
        this.gameStarted = true;
        this.lastTime = performance.now();
        this.ui.updateHotbarUI(this.inventory, this.hotbarSlot);
        this.gameLoop();
    }

    initControls() {
        document.addEventListener('click', () => {
            if (this.gameStarted && !this.paused && !this.isMobile) document.body.requestPointerLock();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.gameStarted || this.paused || (!document.pointerLockElement && !this.isMobile)) return;
            this.player.yaw -= e.movementX * 0.003;
            this.player.pitch -= e.movementY * 0.003;
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
            let touchId = null, joyCenter = { x: 0, y: 0 };

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
                        let dx = t.clientX - joyCenter.x, dy = t.clientY - joyCenter.y;
                        let dist = Math.min(50, Math.hypot(dx, dy)), angle = Math.atan2(dy, dx);
                        joyStick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
                        this.mobileMoveDir = { x: Math.cos(angle)*(dist/50), z: Math.sin(angle)*(dist/50) };
                    }
                }
            });

            let endJoy = (e) => {
                for (let t of e.changedTouches) {
                    if (t.identifier === touchId) { touchId = null; joyStick.style.transform = `translate(0px, 0px)`; this.mobileMoveDir = null; }
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
                lastTouchX = e.touches[0].clientX; lastTouchY = e.touches[0].clientY;
            });
            window.addEventListener('touchmove', (e) => {
                if (e.target.closest('#mobile-controls') || e.target.closest('.window-box')) return;
                let t = e.touches[0];
                this.player.yaw -= (t.clientX - lastTouchX) * 0.005;
                this.player.pitch -= (t.clientY - lastTouchY) * 0.005;
                this.player.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.player.pitch));
                lastTouchX = t.clientX; lastTouchY = t.clientY;
            });
        }
    }

    togglePause() {
        this.paused = !this.paused;
        let pauseMenu = document.getElementById('pause-menu');
        if (this.paused) pauseMenu.classList.remove('hidden');
        else pauseMenu.classList.add('hidden');
    }

    resumeGame() { this.paused = false; document.getElementById('pause-menu').classList.add('hidden'); }
    returnToMenu() { location.reload(); }
    openInventory() { this.paused = true; document.getElementById('inventory-screen').classList.remove('hidden'); this.ui.updateInventoryUI(); }
    closeInventory() { this.paused = false; document.getElementById('inventory-screen').classList.add('hidden'); }

    breakBlock() {
        let dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(1,0,0), this.player.pitch).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.yaw);
        for (let dist = 1; dist <= 5; dist += 0.3) {
            let p = this.engine.camera.position.clone().add(dir.clone().multiplyScalar(dist));
            let bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z);
            if (this.engine.getBlock(bx, by, bz) !== BLOCK.AIR) {
                let blockId = this.engine.getBlock(bx, by, bz);
                this.engine.setBlock(bx, by, bz, BLOCK.AIR);
                this.playSound('break');
                this.addItemToInventory(blockId, 1);
                break;
            }
        }
    }

    placeBlock() {
        let item = this.inventory[this.hotbarSlot];
        if (!item || item.count <= 0) return;

        let dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(1,0,0), this.player.pitch).applyAxisAngle(new THREE.Vector3(0,1,0), this.player.yaw);
        let lastP = null;
        for (let dist = 1; dist <= 5; dist += 0.3) {
            let p = this.engine.camera.position.clone().add(dir.clone().multiplyScalar(dist));
            let bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z);
            if (this.engine.getBlock(bx, by, bz) !== BLOCK.AIR) {
                if (lastP) {
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
            if (this.inventory[i] && this.inventory[i].id === id) {
                this.inventory[i].count += count;
                this.ui.updateHotbarUI(this.inventory, this.hotbarSlot);
                return;
            }
        }
        for (let i = 0; i < this.inventory.length; i++) {
            if (!this.inventory[i]) {
                this.inventory[i] = { id: id, count: count, type: 'block' };
                this.ui.updateHotbarUI(this.inventory, this.hotbarSlot);
                return;
            }
        }
    }

    update(dt) {
        if (!this.gameStarted || this.paused) return;
        this.player.updatePosition(dt, this.keys, this.mobileMoveDir, this.engine);
        this.player.updateCamera(this.engine.camera);
        this.engine.updateChunksAroundPlayer(this.player.pos, 3);
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
        
