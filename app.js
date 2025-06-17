// アイテムのレシピデータ
const recipes = {
    'concrete_powder': {
        'sand': 4,
        'gravel': 4,
        'dye': 1
    },
    'chest': {
        'planks': 8
    }
};

// アイテムの表示名
const itemNames = {
    'concrete_powder': 'コンクリートパウダー',
    'sand': '砂',
    'gravel': '砂利',
    'dye': '染料',
    'chest': 'チェスト',
    'planks': '木材'
};

// アイテムごとの最大スタック数
const maxStack = {
    'concrete_powder': 64,
    'chest': 64
};

// 計算結果を表示する関数
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
        const stack = maxStack[itemType] || 64;
        actualQuantity = quantity * stack * 54;
    }

    let result = `<h3>${itemNames[itemType]} ${actualQuantity}個の作成に必要な材料：</h3>`;
    result += '<ul>';

    for (const [material, amount] of Object.entries(recipes[itemType])) {
        const totalAmount = amount * actualQuantity;
        result += `<li>${itemNames[material]}: ${totalAmount}個</li>`;
    }

    result += '</ul>';
    resultDiv.innerHTML = result;
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="calculator">
            <div class="input-group">
                <label for="itemType">アイテムの種類：</label>
                <select id="itemType">
                    <option value="concrete_powder">コンクリートパウダー</option>
                    <option value="chest">チェスト</option>
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
}); 