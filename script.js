// アイテムとレシピのデータを読み込む
let items = {};
let recipes = {};

// データの読み込み
async function loadData() {
    try {
        const [itemsResponse, recipesResponse] = await Promise.all([
            fetch('data/items.json'),
            fetch('data/recipes.json')
        ]);
        items = await itemsResponse.json();
        recipes = await recipesResponse.json();
        initializeItemSelect();
        initializeUnitSelect();
    } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
    }
}

// アイテム選択プルダウンの初期化
function initializeItemSelect() {
    const itemSelect = $('#itemSelect');
    
    // カテゴリごとにアイテムをグループ化
    const categories = {};
    Object.entries(items).forEach(([id, item]) => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push({
            id: id,
            name: item.name
        });
    });

    // カテゴリごとにオプションを追加
    Object.entries(categories).forEach(([category, items]) => {
        const optgroup = $('<optgroup>').attr('label', getCategoryName(category));
        items.forEach(item => {
            optgroup.append($('<option>').val(item.id).text(item.name));
        });
        itemSelect.append(optgroup);
    });

    // select2の初期化
    itemSelect.select2({
        theme: 'bootstrap-5',
        width: '100%',
        placeholder: 'アイテムを選択してください',
        allowClear: true,
        language: {
            noResults: function() {
                return 'アイテムが見つかりません';
            }
        }
    });

    // アイテム選択時のイベントハンドラ
    itemSelect.on('change', calculateMaterials);
    $('#quantity').on('input', calculateMaterials);
}

// 単位選択の初期化
function initializeUnitSelect() {
    $('#unitSelect').on('change', calculateMaterials);
}

// カテゴリ名を日本語に変換
function getCategoryName(category) {
    const categoryNames = {
        'building_blocks': '建築ブロック',
        'storage': '収納',
        'materials': '材料'
    };
    return categoryNames[category] || category;
}

// 材料の計算
function calculateMaterials() {
    const selectedItem = $('#itemSelect').val();
    const quantity = parseInt($('#quantity').val()) || 1;
    const unitType = $('#unitSelect').val();
    
    if (!selectedItem) {
        $('#materialsList').empty();
        return;
    }

    // LCの場合は54スタック分の計算
    const selectedItemData = items[selectedItem];
    const actualQuantity = unitType === 'lc' ? 
        quantity * 54 * selectedItemData.maxStack : 
        quantity;
    
    const materials = calculateRequiredMaterials(selectedItem, actualQuantity, recipes);
    displayResults(materials);
}

// 必要な材料を計算
function calculateRequiredMaterials(targetItem, targetQuantity, recipes) {
    const materials = {};

    // 目標アイテムのレシピを探す
    const targetRecipe = recipes[targetItem];
    if (!targetRecipe) return materials;

    // レシピの出力量に対する比率を計算
    const batches = Math.ceil(targetQuantity / targetRecipe.output);
    const ratio = batches;

    // 材料の必要量を計算
    Object.entries(targetRecipe.materials).forEach(([material, quantity]) => {
        const requiredQuantity = quantity * ratio;
        materials[material] = requiredQuantity;
    });

    return materials;
}

// 材料リストを表示
function displayResults(materials) {
    const resultsDiv = document.getElementById('materialsList');
    resultsDiv.innerHTML = '';
    
    // クラフト回数を計算
    const selectedItem = document.getElementById('itemSelect').value;
    const recipe = recipes[selectedItem];
    const quantity = parseInt(document.getElementById('quantity').value);
    const unitType = document.getElementById('unitSelect').value;
    const actualQuantity = unitType === 'lc' ? 
        quantity * 54 * items[selectedItem].maxStack : 
        quantity;
    const craftCount = Math.ceil(actualQuantity / recipe.output);
    
    // クラフト回数を表示
    const craftInfo = document.createElement('div');
    craftInfo.className = 'alert alert-info mb-3';
    craftInfo.innerHTML = `クラフト回数: ${craftCount}回`;
    resultsDiv.appendChild(craftInfo);
    
    const ul = document.createElement('ul');
    ul.className = 'list-group';
    
    for (const [itemId, amount] of Object.entries(materials)) {
        const item = items[itemId];
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        // LCとスタック数に変換
        const maxStack = item.maxStack;
        const totalStacks = Math.floor(amount / maxStack);
        const remainder = amount % maxStack;
        const lcCount = Math.floor(totalStacks / 54);
        const remainingStacks = totalStacks % 54;
        
        let displayAmount = '';
        if (lcCount > 0) {
            displayAmount = `${lcCount}LC`;
            if (remainingStacks > 0) {
                displayAmount += ` + ${remainingStacks}スタック`;
            }
            displayAmount += ` (合計: ${amount}個)`;
        } else if (totalStacks > 0) {
            displayAmount = `${totalStacks}スタック`;
            if (remainder > 0) {
                displayAmount += ` + ${remainder}個`;
            }
        } else {
            displayAmount = `${amount}個`;
        }
        
        li.innerHTML = `
            <span>${item.name}</span>
            <span class="badge bg-primary rounded-pill">${displayAmount}</span>
        `;
        ul.appendChild(li);
    }
    
    resultsDiv.appendChild(ul);
}

// ページ読み込み時にデータを読み込む
document.addEventListener('DOMContentLoaded', loadData); 