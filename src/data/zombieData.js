// ゾンビ3タイプのステータス定義。数値は仮。調整はこのファイルだけで行う
const ZOMBIE_DATA = {
  normal: { name: '通常ゾンビ',     moveSpeed: 80,  damage: 10,  color: 0x00aa00 },
  elite:  { name: 'エリートゾンビ', moveSpeed: 120, damage: 20,  color: 0xff8800 },
  boss:   { name: 'ボスゾンビ',     moveSpeed: 160, damage: 100, color: 0xcc0000 }
};