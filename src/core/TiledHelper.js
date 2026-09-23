// TiledHelper.js
// Tiledのオブジェクトレイヤーから、カスタムプロパティを安全に取り出すための共通処理。
// データそのもの(座標・接続先など)は持たない。Tiledが書き出したJSONの「読み出し方」だけを担当する。

// Tiledのオブジェクトのプロパティ配列から、指定した名前の値を取り出す
// 例: getTiledProperty(exitObject, 'targetScene') → 'CorridorScene'
function getTiledProperty(tiledObject, propName) {
  const prop = tiledObject.properties.find(p => p.name === propName);
  return prop ? prop.value : undefined;
}