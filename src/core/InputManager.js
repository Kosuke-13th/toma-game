// InputManager.js
// キーボード/ゲームパッドの入力を抽象化するクラスです。
// シーン側は「InputManagerの決定ボタンが押されたか」だけを見ればよく、
// キーボードかパッドかを意識しなくて済むようにします。
//
// 開発中はキーボードのみで動作確認し、将来的にパッドを繋いだ分だけ
// プレイヤーが増える仕組みに拡張していきます。

class InputManager {
  constructor(scene) {
    this.scene = scene;

    // 開発用: キーボード(プレイヤー1のフォールバックとして扱う)
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.confirmKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 将来のパッド対応用の土台(今は使わないが型だけ用意しておく)
    this.pads = []; // 接続されたパッドを後で格納する
  }

  // 現在フレームでの移動方向を返す(-1, 0, 1のベクトル)
  // 今はキーボードのみ。将来的にはplayerIndexごとに対応パッドを見る形に拡張する。
  getMoveVector(playerIndex = 0) {
    let x = 0;
    let y = 0;

    if (playerIndex === 0) {
      if (this.cursors.left.isDown) x -= 1;
      if (this.cursors.right.isDown) x += 1;
      if (this.cursors.up.isDown) y -= 1;
      if (this.cursors.down.isDown) y += 1;
    }

    // playerIndex 1, 2 は将来パッド対応時にここへ追加する

    return { x, y };
  }

  // 決定ボタン(会話開始・掴み解除など)が「押された瞬間」かどうか
  isConfirmJustPressed(playerIndex = 0) {
    if (playerIndex === 0) {
      return Phaser.Input.Keyboard.JustDown(this.confirmKey);
    }
    return false;
  }

  // 現在アクティブなプレイヤー人数を返す
  // 開発中はキーボードのみなので常に1人。将来はパッド接続数に応じて変わる。
  getActivePlayerCount() {
    return 1; // TODO: パッド接続時は接続数に応じて変更する
  }
}