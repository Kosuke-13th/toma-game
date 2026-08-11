// PrepareScene.js
// 準備フェーズ。まずは画面切り替えの確認だけできればよいので、
// NPCや会話ロジックはまだ実装せず、テキストとボタンのみ用意します。

class PrepareScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PrepareScene' });
  }

  create() {
    this.input = this.input; // 明示: Phaser標準のinputをそのまま使う
    this.inputManager = new InputManager(this);

    this.add.text(200, 250, '準備フェーズ(仮)', {
      fontSize: '28px',
      fill: '#ffffff'
    });

    this.add.text(200, 300, 'スペースキーで脱出フェーズへ', {
      fontSize: '18px',
      fill: '#ffffff'
    });
  }

  update() {
    if (this.inputManager.isConfirmJustPressed(0)) {
      this.scene.start('ClassroomScene');
    }
  }
}