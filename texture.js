class TextureManager {
    constructor() {
        this.materials = {};
        this.generateTextures();
    }

    createPixelTexture(drawCallback) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        drawCallback(ctx);

        let texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    generateTextures() {
        // 1. Cỏ (Mặt trên xanh, viền đất)
        const grassTex = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#55a033';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#448822';
            for(let i=0; i<12; i++) ctx.fillRect(Math.random()*16, Math.random()*16, 2, 2);
        });

        // 2. Đất
        const dirtTex = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#866043';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#5c4028';
            for(let i=0; i<15; i++) ctx.fillRect(Math.random()*16, Math.random()*16, 2, 2);
        });

        // 3. Đá
        const stoneTex = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#777777';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#555555';
            for(let i=0; i<20; i++) ctx.fillRect(Math.random()*16, Math.random()*16, 2, 2);
        });

        // 4. Gỗ
        const woodTex = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#6b4f2c';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#4a351d';
            ctx.fillRect(4, 0, 8, 16);
        });

        // 5. Lá cây
        const leavesTex = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#2d6323';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#1e4217';
            for(let i=0; i<10; i++) ctx.fillRect(Math.random()*16, Math.random()*16, 3, 3);
        });

        // 6. Cát
        const sandTex = this.createPixelTexture(ctx => {
            ctx.fillStyle = '#d2d08a';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#b5b36f';
            for(let i=0; i<10; i++) ctx.fillRect(Math.random()*16, Math.random()*16, 2, 2);
        });

        // 7. Nước
        const waterTex = this.createPixelTexture(ctx => {
            ctx.fillStyle = 'rgba(50,120,220,0.75)';
            ctx.fillRect(0, 0, 16, 16);
        });

        // Đăng ký materials chuẩn
        this.materials[BLOCK.GRASS] = new THREE.MeshLambertMaterial({ map: grassTex });
        this.materials[BLOCK.DIRT] = new THREE.MeshLambertMaterial({ map: dirtTex });
        this.materials[BLOCK.STONE] = new THREE.MeshLambertMaterial({ map: stoneTex });
        this.materials[BLOCK.WOOD] = new THREE.MeshLambertMaterial({ map: woodTex });
        this.materials[BLOCK.LEAVES] = new THREE.MeshLambertMaterial({ map: leavesTex, transparent: true, opacity: 0.9 });
        this.materials[BLOCK.SAND] = new THREE.MeshLambertMaterial({ map: sandTex });
        this.materials[BLOCK.WATER] = new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.7 });
        this.materials[BLOCK.PLANKS] = this.materials[BLOCK.WOOD];
        this.materials[BLOCK.COAL] = this.materials[BLOCK.STONE];
        this.materials[BLOCK.IRON] = this.materials[BLOCK.STONE];
        this.materials[BLOCK.TORCH] = this.materials[BLOCK.STONE];
        this.materials[BLOCK.GLASS] = this.materials[BLOCK.WATER];
    }
          }
