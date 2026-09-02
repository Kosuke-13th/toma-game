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

    // ゾンビ4体(段階②で追加。まだ通常タイプのみ、ステータスは仮の固定値)
    this.zombies = this.physics.add.group();
    const positions = [
      { x: 50, y: 50 },
      { x: 750, y: 50 },
      { x: 50, y: 550 },
      { x: 750, y: 550 }
    ];
    positions.forEach(pos => {
      const zombie = this.add.rectangle(pos.x, pos.y, 32, 32, 0x00aa00);
      this.physics.add.existing(zombie);
      zombie.moveSpeed = 80;   // 仮値。後でzombieData.jsから読み込む形にする
      zombie.damage = 10;      // 仮値。後でzombieData.jsから読み込む形にする
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

    // --- [追加] プレイヤーとゾンビが重ならないように衝突判定を追加 ---
    this.physics.add.collider(this.player, this.zombies);

    // --- [追加] ゾンビ同士も重ならないようにしたい場合はこちらも追加 ---
    this.physics.add.collider(this.zombies, this.zombies);

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