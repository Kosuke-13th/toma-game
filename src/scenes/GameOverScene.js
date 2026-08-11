// GameOverScene.js
// クリア/ゲームオーバー結果を表示するだけの画面。
// data.result が 'clear' か 'gameover' かで表示を切り替えます。

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.result = data.result || 'gameover';
  }

  create() {
    this.inputManager = new InputManager(this);

    const message = this.result === 'clear' ? 'クリア!' : 'ゲームオーバー';
    const color = this.result === 'clear' ? '#00ff00' : '#ff0000';

    this.add.text(300, 250, message, {
      fontSize: '32px',
      fill: color
    });

    this.add.text(220, 320, 'スペースキーで準備フェーズへ戻る', {
      fontSize: '18px',
      fill: '#ffffff'
    });
  }

  update() {
    if (this.inputManager.isConfirmJustPressed(0)) {
      this.scene.start('PrepareScene');
    }
  }
}