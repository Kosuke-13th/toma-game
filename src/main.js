// main.js
// Phaserの起動設定とシーン登録のみを行います。
// 基本的に他のメンバーが頻繁に触る必要がないよう、シンプルに保っています。

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2d5a1b',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [PrepareScene, ClassroomScene, GameOverScene]
};

const game = new Phaser.Game(config);