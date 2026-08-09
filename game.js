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
let hp;
let hpText;
let lastDamageTime;

// タイマー関連変数
let timeLeft;
let timerText;
let isGameOver;

function preload() {}

function create() {
  // --- 変数の初期化（リトライ時に状態をリセットするため） ---
  hp = 100;
  timeLeft = 30;
  lastDamageTime = 0;
  isGameOver = false;

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
  this.physics.add.collider(zombies, zombies);
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

  // HPテキスト（左上）
  hpText = this.add.text(16, 16, 'HP: 100', {
    fontSize: '24px',
    fill: '#ffffff'
  });

  // タイマーテキスト（右上）
  timerText = this.add.text(650, 16, 'TIME: ' + timeLeft, {
    fontSize: '24px',
    fill: '#ffffff'
  });

  // 1秒ごとに実行されるタイマーイベント
  this.time.addEvent({
    delay: 1000,
    callback: onTimerEvent,
    callbackScope: this,
    loop: true
  });

  // --- クリック（タップ）でのリトライイベント設定 ---
  this.input.on('pointerdown', () => {
    // ゲームオーバーまたはクリア時のみシーンを再起動
    if (isGameOver) {
      this.scene.restart();
    }
  });
}

function update(time) {
  // ゲーム終了時は操作を受け付けない
  if (isGameOver) return;

  // プレイヤーの移動処理
  player.body.setVelocity(0);
  if (cursors.left.isDown) player.body.setVelocityX(-200);
  if (cursors.right.isDown) player.body.setVelocityX(200);
  if (cursors.up.isDown) player.body.setVelocityY(-200);
  if (cursors.down.isDown) player.body.setVelocityY(200);

  // ゾンビがプレイヤーに向かって移動
  zombies.getChildren().forEach(zombie => {
    this.physics.moveToObject(zombie, player, 80);

    // ゾンビとプレイヤーの接触判定（ダメージ処理）
    const distance = Phaser.Math.Distance.Between(
      zombie.x, zombie.y, player.x, player.y
    );
    if (distance < 32 && time - lastDamageTime > 1000) {
      hp -= 10;
      lastDamageTime = time;
      hpText.setText('HP: ' + hp);

      // HPゼロでゲームオーバー処理
      if (hp <= 0) {
        showEndScreen(this, 'GAME OVER', '#ff0000');
      }
    }
  });
}

// タイマーイベント用関数
function onTimerEvent() {
  if (isGameOver) return;

  timeLeft--;
  timerText.setText('TIME: ' + timeLeft);

  // 0秒でゲームクリア処理
  if (timeLeft <= 0) {
    showEndScreen(this, 'GAME CLEAR', '#ffff00');
  }
}

// --- ゲーム終了画面の共通処理関数 ---
function showEndScreen(scene, message, textColor) {
  isGameOver = true;

  // メインテキスト表示
  scene.add.text(400, 260, message, {
    fontSize: '64px',
    fill: textColor
  }).setOrigin(0.5);

  // 案内テキスト（クリックで再挑戦）表示
  scene.add.text(400, 340, 'Click to Restart', {
    fontSize: '28px',
    fill: '#ffffff'
  }).setOrigin(0.5);

  // 物理演算を停止
  scene.physics.pause();
}