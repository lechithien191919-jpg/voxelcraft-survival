class PlayerManager {
    constructor() {
        this.pos = new THREE.Vector3(0, 45, 0);
        this.vel = new THREE.Vector3(0, 0, 0);
        this.speed = 4.5;
        this.jumpForce = 8;
        this.onGround = false;
        this.hp = 20;
        this.food = 20;
        this.yaw = 0;
        this.pitch = 0;
    }

    updatePosition(dt, keys, mobileMoveDir, engine3D) {
        let moveDir = new THREE.Vector3();
        let forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0,1,0), this.yaw);
        let right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), this.yaw);

        if (keys['KeyW']) moveDir.add(forward);
        if (keys['KeyS']) moveDir.sub(forward);
        if (keys['KeyD']) moveDir.add(right);
        if (keys['KeyA']) moveDir.sub(right);

        if (mobileMoveDir) {
            moveDir.add(forward.clone().multiplyScalar(-mobileMoveDir.z));
            moveDir.add(right.clone().multiplyScalar(mobileMoveDir.x));
        }

        moveDir.normalize();
        this.pos.x += moveDir.x * this.speed * dt;
        this.pos.z += moveDir.z * this.speed * dt;

        this.vel.y -= 20 * dt;
        this.pos.y += this.vel.y * dt;

        let groundHeight = engine3D.getTerrainHeight(Math.floor(this.pos.x), Math.floor(this.pos.z)) + 1.8;
        if (this.pos.y <= groundHeight) {
            this.pos.y = groundHeight;
            this.vel.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        if (keys['Space'] && this.onGround) {
            this.vel.y = this.jumpForce;
        }
    }

    updateCamera(camera) {
        camera.position.copy(this.pos);
        let euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        camera.quaternion.setFromEuler(euler);
    }
}
