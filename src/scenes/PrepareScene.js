// PrepareScene.js
// 準備フェーズ。NPCと最大3回会話してバフを獲得し、ClassroomSceneへ遷移する。

class PrepareScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PrepareScene' });
  }

  create() {
    this.inputManager = new InputManager(this);

    this.maxTalkCount = 3;      // 会話できる回数
    this.talkCount = 0;
    this.gotBuffs = [];         // 獲得したバフID
    this.isTransitioning = false;
    this.talkDistance = 50;     // 話しかけられる距離

    // プレイヤー(青い四角)
    this.player = this.add.rectangle(400, 300, 32, 32, 0x0000ff);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // NPC5人(黄色い四角 + 名前)
    this.npcs = NPC_DATA.map(data => {
      const rect = this.add.rectangle(data.x, data.y, 32, 32, 0xffcc00);
      this.physics.add.existing(rect, true);  // ← 追加: 第2引数 true で静的ボディ(動かない)
      this.add.text(data.x, data.y - 28, data.name, {
        fontSize: '14px', fill: '#ffffff'
      }).setOrigin(0.5);
      return { data, rect, talked: false };
    });

    // ← 追加: プレイヤーとNPCが重ならないようにする
    this.physics.add.collider(this.player, this.npcs.map(npc => npc.rect));

    // 表示テキスト
    this.countText = this.add.text(16, 16, '', { fontSize: '18px', fill: '#ffffff' });
    this.buffText  = this.add.text(16, 44, '', { fontSize: '16px', fill: '#00ff88' });
    this.hintText  = this.add.text(400, 550, '', {
      fontSize: '18px', fill: '#ffff00'
    }).setOrigin(0.5);
    this.messageText = this.add.text(400, 500, '', {
      fontSize: '20px', fill: '#ffffff'
    }).setOrigin(0.5);
    this.updateTexts();
  }

  update() {
    if (this.isTransitioning) return;

    // プレイヤー移動
    const move = this.inputManager.getMoveVector(0);
    const speed = 200;
    this.player.body.setVelocity(move.x * speed, move.y * speed);

    // 話しかけられる範囲内で、いちばん近い未会話のNPCを探す
    let target = null;
    let minDist = this.talkDistance;
    this.npcs.forEach(npc => {
      if (npc.talked) return;
      const d = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, npc.rect.x, npc.rect.y
      );
      if (d < minDist) {
        minDist = d;
        target = npc;
      }
    });

    this.hintText.setText(target ? `スペースキーで ${target.data.name} に話しかける` : '');

    if (target && this.inputManager.isConfirmJustPressed(0)) {
      this.talkTo(target);
    }
  }

  talkTo(npc) {
    npc.talked = true;
    npc.rect.setFillStyle(0x666666); // 会話済みは灰色にする
    this.talkCount++;

    if (npc.data.buffId) {
      this.gotBuffs.push(npc.data.buffId);
      this.messageText.setText(`${npc.data.name}: 「${BUFF_DATA[npc.data.buffId].name}をあげる」`);
    } else {
      this.messageText.setText(`${npc.data.name}: 「がんばってね」(何ももらえなかった)`);
    }
    this.updateTexts();

    // 規定回数に達したら、結果を見せてから脱出フェーズへ
    if (this.talkCount >= this.maxTalkCount) {
      this.isTransitioning = true;
      this.player.body.setVelocity(0);
      this.hintText.setText('');
      this.time.delayedCall(1500, () => {
        this.scene.start('ClassroomScene', { buffs: this.gotBuffs });
      });
    }
  }

  updateTexts() {
    this.countText.setText(`会話回数: ${this.talkCount} / ${this.maxTalkCount}`);
    const names = this.gotBuffs.map(id => BUFF_DATA[id].name);
    this.buffText.setText(`獲得バフ: ${names.length ? names.join('、') : 'なし'}`);
  }
}