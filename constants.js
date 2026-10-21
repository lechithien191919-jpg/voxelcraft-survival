const BLOCK = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    SAND: 6,
    WATER: 7,
    COAL: 8,
    IRON: 9,
    PLANKS: 10,
    TORCH: 11,
    GLASS: 12
};

const BLOCK_NAMES = {
    1: "Cỏ", 2: "Đất", 3: "Đá", 4: "Gỗ", 5: "Lá cây", 6: "Cát", 7: "Nước", 8: "Đá Than", 9: "Quặng Sắt", 10: "Ván Gỗ", 11: "Đuốc", 12: "Thủy Tinh"
};

const ITEMS_DEF = {
    1: { name: "Cỏ", maxStack: 64, type: "block" },
    2: { name: "Đất", maxStack: 64, type: "block" },
    3: { name: "Đá", maxStack: 64, type: "block" },
    4: { name: "Gỗ", maxStack: 64, type: "block" },
    5: { name: "Lá cây", maxStack: 64, type: "block" },
    6: { name: "Cát", maxStack: 64, type: "block" },
    8: { name: "Than", maxStack: 64, type: "item" },
    9: { name: "Quặng Sắt", maxStack: 64, type: "block" },
    10: { name: "Ván Gỗ", maxStack: 64, type: "block" },
    11: { name: "Đuốc", maxStack: 64, type: "block" },
    12: { name: "Thủy Tinh", maxStack: 64, type: "block" },
    101: { name: "Cuốc Gỗ", maxStack: 1, type: "tool", toolType: "pickaxe", tier: 1 },
    102: { name: "Rìu Gỗ", maxStack: 1, type: "tool", toolType: "axe", tier: 1 },
    103: { name: "Kiếm Gỗ", maxStack: 1, type: "weapon", dmg: 4 }
};

const CRAFTING_RECIPES = [
    { output: { id: 10, count: 4 }, ingredients: [{ id: 4, count: 1 }] },
    { output: { id: 101, count: 1 }, ingredients: [{ id: 10, count: 3 }] },
    { output: { id: 102, count: 1 }, ingredients: [{ id: 10, count: 3 }] },
    { output: { id: 103, count: 1 }, ingredients: [{ id: 10, count: 2 }] }
];
