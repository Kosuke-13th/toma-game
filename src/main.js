// main.js
// Phaserの起動設定とシーン登録のみを行います。
// 基本的に他のメンバーが頻繁に触る必要がないよう、シンプルに保っています。

const config = {
  type: Phaser.AUTO,
  width: 960,              // 30タイル × 32px
  height: 544,             // 17タイル × 32px
  pixelArt: true,          // ドット絵・タイルをくっきり表示する
  backgroundColor: '#2d5a1b',
  scale: {
    mode: Phaser.Scale.FIT,               // 縦横比を保って画面に合わせて拡大縮小
    autoCenter: Phaser.Scale.CENTER_BOTH  // 中央に配置
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [PrepareScene, ClassroomScene, GameOverScene]
};

const game = new Phaser.Game(config);