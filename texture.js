class TextureManager {
    constructor() {
        this.materials = {};
        this.generateMaterials();
    }

    generateMaterials() {
        // Sử dụng MeshLambertMaterial với màu sắc chuẩn Minecraft voxel giúp load siêu nhanh, không bị kẹt
        this.materials[BLOCK.GRASS] = new THREE.MeshLambertMaterial({ color: 0x55a033 }); // Cỏ xanh
        this.materials[BLOCK.DIRT] = new THREE.MeshLambertMaterial({ color: 0x866043 });  // Đất nâu
        this.materials[BLOCK.STONE] = new THREE.MeshLambertMaterial({ color: 0x777777 }); // Đá xám
        this.materials[BLOCK.WOOD] = new THREE.MeshLambertMaterial({ color: 0x6b4f2c });  // Gỗ
        this.materials[BLOCK.LEAVES] = new THREE.MeshLambertMaterial({ color: 0x2d6323, transparent: true, opacity: 0.9 }); // Lá
        this.materials[BLOCK.SAND] = new THREE.MeshLambertMaterial({ color: 0xd2d08a });  // Cát
        this.materials[BLOCK.WATER] = new THREE.MeshLambertMaterial({ color: 0x3278dc, transparent: true, opacity: 0.75 }); // Nước
        
        // Các block khác dùng chung vật liệu cơ bản
        this.materials[BLOCK.PLANKS] = this.materials[BLOCK.WOOD];
        this.materials[BLOCK.COAL] = this.materials[BLOCK.STONE];
        this.materials[BLOCK.IRON] = this.materials[BLOCK.STONE];
        this.materials[BLOCK.TORCH] = this.materials[BLOCK.STONE];
        this.materials[BLOCK.GLASS] = this.materials[BLOCK.WATER];
    }
}
