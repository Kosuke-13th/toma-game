// EntityFactory.js
// プレイヤー/NPC/ゾンビの生成処理を一元管理するクラスです。
// 見た目(rectangle → sprite への差し替え)をここに集約することで、
// 将来ドット絵を導入する際にシーン側のコードを変更せずに済むようにします。
// 現時点ではまだ空です。今後、createPlayer() などのメソッドを追加していきます。

class EntityFactory {
  constructor(scene) {
    this.scene = scene;
  }
}