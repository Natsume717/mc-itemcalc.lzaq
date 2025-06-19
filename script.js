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
        if (!recipes[id]) return; // レシピが存在しないアイテムは除外
        // カテゴリが複数ある場合は分割してすべてに追加
        const cats = item.category ? item.category.split('|') : [];
        cats.forEach(cat => {
            if (!categories[cat]) {
                categories[cat] = [];
            }
            categories[cat].push({
                id: id,
                name: item.name
            });
        });
    });

    // カテゴリごとにオプションを追加
    Object.entries(categories).forEach(([category, items]) => {
        if (!category) return; // 空カテゴリはスキップ
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

// 再帰的に材料ツリーをカード風HTMLで生成（子素材は折り畳み）
function renderMaterialsTreeBox(itemId, amount, depth = 0, isNested = false) {
    const boxStyle = `margin-left:${depth * 24}px; display: flex; align-items: center;`;
    const nameHtml = `<span class='item-name'>${items[itemId]?.name || itemId}</span>`;
    const qtyHtml = `<span class='item-quantity'>${amount}個</span>`;
    let detailsHtml = '';
    let boxClass = 'material-box' + (isNested ? ' nested' : '');
    if (recipes[itemId]) {
        const recipe = recipes[itemId];
        const materials = Object.entries(recipe.materials);
        if (materials.length > 0) {
            detailsHtml = `<details style='margin-left:1em;'><summary style='cursor:pointer;'>素材を見る</summary>`;
            for (const [material, materialAmount] of materials) {
                const totalMaterialAmount = materialAmount * Math.ceil(amount / recipe.output);
                detailsHtml += renderMaterialsTreeBox(material, totalMaterialAmount, 0, true);
            }
            detailsHtml += `</details>`;
        } else {
            detailsHtml = `<span style='margin-left:1em; min-width: 6em; display:inline-block;'></span>`;
        }
    } else {
        detailsHtml = `<span style='margin-left:1em; min-width: 6em; display:inline-block;'></span>`;
    }
    return `<div class='${boxClass}' style='${boxStyle}'>${nameHtml} ${qtyHtml} ${detailsHtml}</div>`;
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
    
    // ツリー表示（指定アイテム自身は表示せず、素材から表示）
    const treeDiv = document.createElement('div');
    treeDiv.className = 'materials-tree-box';
    let treeHtml = '';
    if (recipe) {
        for (const [material, materialAmount] of Object.entries(recipe.materials)) {
            const totalMaterialAmount = materialAmount * craftCount;
            treeHtml += renderMaterialsTreeBox(material, totalMaterialAmount, 0);
        }
    }
    treeDiv.innerHTML = treeHtml;
    resultsDiv.appendChild(treeDiv);

    // クラフト回数を素材ツリーの下に表示
    const craftInfo = document.createElement('div');
    craftInfo.className = 'alert alert-info mb-3';
    craftInfo.innerHTML = `クラフト回数: ${craftCount}回`;
    resultsDiv.appendChild(craftInfo);
}

// ページ読み込み時にデータを読み込む
document.addEventListener('DOMContentLoaded', loadData); 