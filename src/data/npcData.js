// NPCデータ。buffId が null のNPCは何も渡さない(ハズレ役)
const NPC_DATA = [
  { id: 'npc1', name: '先生',   x: 150, y: 150, buffId: 'hpUp' },
  { id: 'npc2', name: '友人A',  x: 650, y: 150, buffId: 'speedUp' },
  { id: 'npc3', name: '友人B',  x: 400, y: 100, buffId: 'invincible' },
  { id: 'npc4', name: '用務員', x: 200, y: 400, buffId: null },
  { id: 'npc5', name: '生徒',   x: 600, y: 400, buffId: null }
];