const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2d5a1b',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

let player;
let zombies;
let cursors;
let hp = 100;
let hpText;
let lastDamageTime = 0;

function preload() {}

function create() {
  // 学校の建物（灰色の四角）
  const graphics = this.add.graphics();
  graphics.fillStyle(0x888888);
  graphics.fillRect(300, 200, 200, 150);
  this.add.text(370, 265, 'TEST', {
    fontSize: '24px',
    fill: '#ffffff'
  });

  // プレイヤー（青い四角）
  player = this.add.rectangle(400, 450, 32, 32, 0x0000ff);
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);

  // ゾンビグループ
  zombies = this.physics.add.group();
  // ゾンビを4体追加
  const positions = [
    { x: 50, y: 50 },
    { x: 750, y: 50 },
    { x: 50, y: 550 },
    { x: 750, y: 550 }
  ];
  positions.forEach(pos => {
    const zombie = this.add.rectangle(pos.x, pos.y, 32, 32, 0x00ff00);
    this.physics.add.existing(zombie);
    zombies.add(zombie);
  });

  // キーボード設定
  cursors = this.input.keyboard.createCursorKeys();

  // HPテキスト
  hpText = this.add.text(16, 16, 'HP: 100', {
    fontSize: '24px',
    fill: '#ffffff'
  });
}

function update(time) {
  // プレイヤーの移動
  player.body.setVelocity(0);
  if (cursors.left.isDown) player.body.setVelocityX(-200);
  if (cursors.right.isDown) player.body.setVelocityX(200);
  if (cursors.up.isDown) player.body.setVelocityY(-200);
  if (cursors.down.isDown) player.body.setVelocityY(200);

  // ゾンビがプレイヤーに向かって移動
  zombies.getChildren().forEach(zombie => {
    this.physics.moveToObject(zombie, player, 80);

    // ゾンビがプレイヤーに触れたらダメージ
    const distance = Phaser.Math.Distance.Between(
      zombie.x, zombie.y, player.x, player.y
    );
    if (distance < 32 && time - lastDamageTime > 1000) {
      hp -= 10;
      lastDamageTime = time;
      hpText.setText('HP: ' + hp);

      if (hp <= 0) {
        hpText.setText('ゲームオーバー');
        player.body.setVelocity(0);
        cursors = {};
      }
    }
  });
}