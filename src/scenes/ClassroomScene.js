// ClassroomScene.js
// 脱出フェーズの1マップ目(教室)。
// Tiledで作成したマップ(classroom.json)を読み込み、壁・入場位置・脱出ポイントを反映する。
// ゾンビ4体の接触ダメージとゲームオーバー判定は段階②のまま。

class ClassroomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ClassroomScene' });
  }

  init(data) {
    this.buffs = data.buffs || [];
  }

  preload() {
    // 画像のキーは、Tiled上のタイルセット名(tileset_school)と同じにする
    this.load.image('tileset_school', 'assets/images/tileset_school.png');
    this.load.tilemapTiledJSON('classroom', 'assets/tilemaps/classroom.json');
  }

  create() {
    this.inputManager = new InputManager(this);
    this.isGameOver = false;

    // --- Tiledマップの表示 ---
    const map = this.make.tilemap({ key: 'classroom' });
    const tileset = map.addTilesetImage('tileset_school', 'tileset_school');
    map.createLayer('ground', tileset, 0, 0);
    const wallsLayer = map.createLayer('walls', tileset, 0, 0);
    wallsLayer.setCollisionByExclusion([-1]); // wallsに描いたタイルはすべて壁(空白以外が衝突)

    // --- objectsレイヤーから座標を取得(nameで探す) ---
    const entry = map.findObject('objects', obj => obj.name === 'entry_west');
    const goal = map.findObject('objects', obj => obj.name === 'goal');
    if (!entry || !goal) {
      console.error('objectsレイヤーに entry_west / goal が見つかりません。名前の綴りを確認してください');
    }

    // プレイヤー(青い四角)。入場位置に置く(ポイントは座標変換なし)
    this.player = this.add.rectangle(entry.x, entry.y, 32, 32, 0x0000ff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(24, 24).setOffset(4, 4);  

    // 準備フェーズで獲得したバフを脱出フェーズの初期値へ反映
    this.maxHp = this.buffs.includes('hpUp') ? 150 : 100;
    this.hp = this.maxHp;
    this.playerSpeed = this.buffs.includes('speedUp') ? 300 : 200;
    this.isInvincible = this.buffs.includes('invincible');
    this.lastDamageTime = 0;
    this.damageInterval = 1000; // 被弾の無敵時間(ms)。後で難易度調整用に変数化

    this.hpText = this.add.text(16, 16, `HP: ${this.hp}`, {
      fontSize: '18px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    // ゾンビ(960×544画面の四隅付近。Tiledの zombie_○○ へ移行するまでの仮座標)
    this.zombies = this.physics.add.group();
    const positions = [
      { x: 64,  y: 64,  type: 'normal' },
      { x: 896, y: 64,  type: 'elite'  },
      { x: 64,  y: 480, type: 'normal' },
      { x: 896, y: 480, type: 'boss'   }
    ];
    positions.forEach(pos => {
      const stats = ZOMBIE_DATA[pos.type];
      const zombie = this.add.rectangle(pos.x, pos.y, 32, 32, stats.color);
      this.physics.add.existing(zombie);
      zombie.body.setSize(24, 24).setOffset(4, 4);
      zombie.moveSpeed = stats.moveSpeed;
      zombie.damage = stats.damage;
      zombie.zombieType = pos.type; // 後でフェーズ6(掴み)で種類を見分けるために保持
      this.zombies.add(zombie);
    });

    // 脱出ポイント(Tiledの矩形は左上基準なので、中心座標に変換して置く)
    this.exitZone = this.add.rectangle(
      goal.x + goal.width / 2,
      goal.y + goal.height / 2,
      goal.width,
      goal.height,
      0x00ffff,
      0.4
    );
    this.physics.add.existing(this.exitZone, true); // true = 静的ボディ(動かない)
    this.exitStayTime = 0;
    this.exitRequiredTime = 3000;

    this.exitText = this.add.text(16, 48, '', {
      fontSize: '18px',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    });

    this.add.text(16, 80, '矢印キーで移動。水色エリアに3秒滞在でクリア', {
      fontSize: '14px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    // --- 壁との衝突 ---
    this.physics.add.collider(this.player, wallsLayer);
    this.physics.add.collider(this.zombies, wallsLayer);

    // ゾンビ同士: 衝突の直前に「動かせる」状態へ戻す → 重なり防止が効く
    this.physics.add.collider(this.zombies, this.zombies, null, (z1, z2) => {
      z1.body.immovable = false;
      z2.body.immovable = false;
      return true; // 衝突処理を続行
    });

    // プレイヤー vs ゾンビ: 衝突の直前にゾンビを「動かせない」状態にする → プレイヤーは押せない
    this.physics.add.collider(this.player, this.zombies, null, (player, zombie) => {
      zombie.body.immovable = true;
      return true;
    });
  }

  update(time, delta) {
    if (this.isGameOver) return; // ゲームオーバー後は何もしない

    // プレイヤー移動
    const move = this.inputManager.getMoveVector(0);
    this.player.body.setVelocity(move.x * this.playerSpeed, move.y * this.playerSpeed);

    // ゾンビがプレイヤーを追跡 + 接触ダメージ判定
    this.zombies.getChildren().forEach(zombie => {
      // --- 【改善①:重なり防止】速度を直接上書きせず、徐々に近づける(慣性を入れる) ---
      const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, this.player.x, this.player.y);

      const targetVx = Math.cos(angle) * zombie.moveSpeed;
      const targetVy = Math.sin(angle) * zombie.moveSpeed;

      // 現在の速度から目標速度へ、毎フレーム10%ずつ近づける(補間処理)
      zombie.body.setVelocity(
        Phaser.Math.Linear(zombie.body.velocity.x, targetVx, 0.1),
        Phaser.Math.Linear(zombie.body.velocity.y, targetVy, 0.1)
      );

      // --- 【改善②:ダメージ判定】コライダーの密着(32px)を考慮して判定距離を35pxに広げる ---
      const distance = Phaser.Math.Distance.Between(
        zombie.x, zombie.y, this.player.x, this.player.y
      );

      if (!this.isInvincible && distance < 35 && time - this.lastDamageTime > this.damageInterval) {
        this.hp -= zombie.damage;
        this.lastDamageTime = time;
        this.hpText.setText(`HP: ${Math.max(this.hp, 0)}`);

        if (this.hp <= 0) {
          this.isGameOver = true;
          this.player.body.setVelocity(0);
          this.scene.start('GameOverScene', { result: 'gameover' });
        }
      }
    });

    // 脱出ポイントの滞在判定(矩形の重なりで判定)
    if (this.physics.overlap(this.player, this.exitZone)) {
      this.exitStayTime += delta;
      const remaining = Math.ceil((this.exitRequiredTime - this.exitStayTime) / 1000);
      this.exitText.setText(`脱出まで: ${Math.max(remaining, 0)}秒`);

      if (this.exitStayTime >= this.exitRequiredTime) {
        this.isGameOver = true;
        this.scene.start('GameOverScene', { result: 'clear' });
      }
    } else {
      this.exitStayTime = 0;
      this.exitText.setText('');
    }
  }
}