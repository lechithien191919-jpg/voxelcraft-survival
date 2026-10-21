class UIManager {
    constructor(gameInstance) {
        this.game = gameInstance;
    }

    updateInventoryUI() {
        let grid = document.getElementById('inv-grid-container');
        grid.innerHTML = '';
        for (let i = 0; i < 36; i++) {
            let slot = document.createElement('div');
            slot.className = 'slot';
            let item = this.game.inventory[i];
            if (item) {
                slot.innerHTML = `<span class="icon">${item.id > 100 ? '⚔️' : '🧱'}</span><span class="count">${item.count}</span>`;
            }
            grid.appendChild(slot);
        }

        let craftGrid = document.getElementById('crafting-grid-container');
        craftGrid.innerHTML = '';
        CRAFTING_RECIPES.forEach((rec, idx) => {
            let btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.fontSize = '0.9rem';
            btn.style.padding = '8px';
            btn.innerHTML = `Chế tạo: ${ITEMS_DEF[rec.output.id].name} (x${rec.output.count})`;
            btn.onclick = () => this.game.craftItem(idx);
            craftGrid.appendChild(btn);
        });
    }

    updateHotbarUI(inventory, hotbarSlot) {
        let hotbar = document.getElementById('hotbar');
        hotbar.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            let slot = document.createElement('div');
            slot.className = `slot ${i === hotbarSlot ? 'selected' : ''}`;
            let item = inventory[i];
            if (item) {
                slot.innerHTML = `<span class="icon">${item.id > 100 ? '⚔️' : '🧱'}</span><span class="count">${item.count}</span>`;
            }
            hotbar.appendChild(slot);
        }
    }
}
