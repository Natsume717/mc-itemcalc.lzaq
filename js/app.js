let recipes = {};
let items = {};
let categories = {};

// データの読み込み
async function loadData() {
    try {
        const [recipesResponse, itemsResponse, categoriesResponse] = await Promise.all([
            fetch('data/recipes.json'),
            fetch('data/items.json'),
            fetch('data/categories.json')
        ]);

        recipes = await recipesResponse.json();
        items = await itemsResponse.json();
        categories = await categoriesResponse.json();

        initializeUI();
    } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
    }
}

// 材料の計算（再帰的に中間材料も計算）
function calculateMaterialsRecursive(itemId, amount, results = {}) {
    if (!recipes[itemId]) {
        // レシピがない場合は直接材料として追加
        results[itemId] = (results[itemId] || 0) + amount;
        return results;
    }

    const recipe = recipes[itemId];
    const craftCount = Math.ceil(amount / recipe.output);

    // 各材料を計算
    for (const [material, materialAmount] of Object.entries(recipe.materials)) {
        const totalMaterialAmount = materialAmount * craftCount;
        calculateMaterialsRecursive(material, totalMaterialAmount, results);
    }

    return results;
}

function calculateMaterials() {
    const itemType = document.getElementById('itemType').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const unit = document.getElementById('unit').value;
    const resultDiv = document.getElementById('result');

    if (!recipes[itemType]) {
        resultDiv.innerHTML = '選択されたアイテムのレシピが見つかりません。';
        return;
    }

    // 単位変換
    let actualQuantity = quantity;
    if (unit === 'lc') {
        const stack = items[itemType].maxStack;
        actualQuantity = quantity * stack * 54;
    }

    // 必要なクラフト回数を計算
    const craftCount = Math.ceil(actualQuantity / recipes[itemType].output);

    // 材料を計算（中間材料を含む）
    const materials = calculateMaterialsRecursive(itemType, actualQuantity);

    let result = `<h3>${items[itemType].name} ${actualQuantity}個の作成に必要な材料：</h3>`;
    result += `<p>（クラフト回数: ${craftCount}回）</p>`;
    result += '<ul>';

    // 材料を表示
    for (const [materialId, amount] of Object.entries(materials)) {
        result += `<li>${items[materialId].name}: ${amount}個</li>`;
    }

    result += '</ul>';
    resultDiv.innerHTML = result;
}

function initializeUI() {
    const app = document.getElementById('app');
    
    // カテゴリごとにアイテムをグループ化
    const categorizedItems = {};
    for (const [itemId, item] of Object.entries(items)) {
        if (recipes[itemId]) {  // レシピがあるアイテムのみ表示
            if (!categorizedItems[item.category]) {
                categorizedItems[item.category] = [];
            }
            categorizedItems[item.category].push({
                id: itemId,
                name: item.name
            });
        }
    }

    // カテゴリの順序に従ってソート
    const sortedCategories = Object.entries(categories)
        .sort(([, a], [, b]) => a.order - b.order);

    app.innerHTML = `
        <div class="calculator">
            <div class="input-group">
                <label for="itemType">アイテムの種類：</label>
                <select id="itemType">
                    ${sortedCategories.map(([categoryId, category]) => `
                        <optgroup label="${category.name}">
                            ${categorizedItems[categoryId]?.map(item => 
                                `<option value="${item.id}">${item.name}</option>`
                            ).join('') || ''}
                        </optgroup>
                    `).join('')}
                </select>
            </div>
            <div class="input-group">
                <label for="quantity">作成する数：</label>
                <input type="number" id="quantity" min="1" value="1">
                <select id="unit">
                    <option value="piece">個</option>
                    <option value="lc">LC（ラージチェスト）</option>
                </select>
            </div>
            <button onclick="calculateMaterials()">計算</button>
            <div id="result"></div>
        </div>
    `;
}

// ページ読み込み時にデータを読み込む
document.addEventListener('DOMContentLoaded', loadData); 