// ClassroomScene.js
// 脱出フェーズの1マップ目(教室)。
// 段階②: ゾンビ4体を追加し、接触ダメージとゲームオーバー判定を確認する。

class ClassroomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ClassroomScene' });
  }

  create() {
    this.inputManager = new InputManager(this);
    this.isGameOver = false;

    // 学校の建物(仮の灰色の四角)
    const graphics = this.add.graphics();
    graphics.fillStyle(0x888888);
    graphics.fillRect(300, 200, 200, 150);
    this.add.text(370, 265, 'TEST', {
      fontSize: '24px',
      fill: '#ffffff'
    });

    // プレイヤー(青い四角)
    this.player = this.add.rectangle(400, 450, 32, 32, 0x0000ff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // HP管理(段階②で追加)
    this.maxHp = 100;
    this.hp = this.maxHp;
    this.lastDamageTime = 0;
    this.damageInterval = 1000; // 被弾の無敵時間(ms)。後で難易度調整用に変数化

    this.hpText = this.add.text(16, 16, `HP: ${this.hp}`, {
      fontSize: '18px',
      fill: '#ffffff'
    });

      this.zombies = this.physics.add.group();
    const positions = [
      { x: 50,  y: 50,  type: 'normal' },
      { x: 750, y: 50,  type: 'elite'  },
      { x: 50,  y: 550, type: 'normal' },
      { x: 750, y: 550, type: 'boss'   }
    ];
    positions.forEach(pos => {
      const stats = ZOMBIE_DATA[pos.type];
      const zombie = this.add.rectangle(pos.x, pos.y, 32, 32, stats.color);
      this.physics.add.existing(zombie);
      zombie.moveSpeed = stats.moveSpeed;
      zombie.damage = stats.damage;
      zombie.zombieType = pos.type; // 後でフェーズ6(掴み)で種類を見分けるために保持
      this.zombies.add(zombie);
    });

    // 脱出ポイント(水色のエリア)
    this.exitZone = this.add.rectangle(700, 500, 80, 80, 0x00ffff, 0.4);
    this.exitStayTime = 0;
    this.exitRequiredTime = 3000;

    this.exitText = this.add.text(16, 48, '', {
      fontSize: '18px',
      fill: '#ffff00'
    });

    this.add.text(16, 80, '矢印キーで移動。水色エリアに3秒滞在でクリア', {
      fontSize: '14px',
      fill: '#ffffff'
    });

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
    const speed = 200;
    this.player.body.setVelocity(move.x * speed, move.y * speed);

    // ゾンビがプレイヤーを追跡 + 接触ダメージ判定
    this.zombies.getChildren().forEach(zombie => {
      // --- 【改善①：重なり防止】速度を直接上書きせず、徐々に近づける（慣性を入れる） ---
      // プレイヤーへの角度を計算
      const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, this.player.x, this.player.y);
      
      // 目標となる速度
      const targetVx = Math.cos(angle) * zombie.moveSpeed;
      const targetVy = Math.sin(angle) * zombie.moveSpeed;
      
      // 現在の速度から目標速度へ、毎フレーム10%ずつ近づける（補間処理）
      // これにより、コライダーによる「押し戻し（反発速度）」が消されずに残り、綺麗に滑り合って重ならなくなります
      zombie.body.setVelocity(
        Phaser.Math.Linear(zombie.body.velocity.x, targetVx, 0.1),
        Phaser.Math.Linear(zombie.body.velocity.y, targetVy, 0.1)
      );

      // --- 【改善②：ダメージ判定】コライダーの密着(32px)を考慮して判定距離を35pxに広げる ---
      const distance = Phaser.Math.Distance.Between(
        zombie.x, zombie.y, this.player.x, this.player.y
      );

      if (distance < 35 && time - this.lastDamageTime > this.damageInterval) {
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

    // 脱出ポイントの滞在判定
    const distToExit = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.exitZone.x, this.exitZone.y
    );

    if (distToExit < 50) {
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