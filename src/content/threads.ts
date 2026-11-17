/**
 * Открытые нити (7.13).
 *
 * Нить — это ситуация в деревне, а не задание в списке: человек стоит у своей
 * беды, и видно, что ему нужно. Ни маркеров, ни «!» над головой.
 */

export interface ThreadRequirement {
  itemId: string
  count: number
}

export interface ThreadDef {
  id: string
  npcName: string
  /** Короткая подпись при наведении. */
  short: string
  /** Где стоит человек. */
  x: number
  y: number
  /** Где видна беда: лужа под протекающей крышей. Не у каждой нити есть. */
  drip?: { x: number; y: number }
  title: string
  text: string
  requirements: readonly ThreadRequirement[]
  rewardMoney: number
  journalDone: string
  /** Награда сверх денег: житель начинает работать на склад. */
  workNote?: string
}

export const ROOF_THREAD: ThreadDef = {
  id: 'thread_roof',
  npcName: 'Марта',
  short: 'чинит крышу',
  x: 330,
  y: 545,
  drip: { x: 300, y: 520 },
  title: 'Прохудившаяся крыша',
  text: 'Марта стоит под стрехой и смотрит, как капает. Внутри спят дети, и одеяла уже не спасают. Подпереть стропила ветками мало — нужны две доски, а без крепких веток их не подвязать.',
  requirements: [
    { itemId: 'branch', count: 4 },
    { itemId: 'plank', count: 2 },
  ],
  rewardMoney: 8,
  journalDone: 'Марта закрыла крышу. Ночью я слышал, как в её доме впервые за неделю смеются.',
}

export const THREADS: readonly ThreadDef[] = [
  ROOF_THREAD,
  {
    id: 'thread_hungry',
    npcName: 'Агафья',
    short: 'смотрит в пустую миску',
    x: 870,
    y: 545,
    title: 'Пустая миска',
    text: 'Старуха сидит на пороге и держит миску, в которой давно ничего не было. Она не просит — просто сидит так с утра. У неё двое внуков, и оба молчат.',
    requirements: [
      { itemId: 'berry', count: 3 },
      { itemId: 'meat', count: 1 },
    ],
    rewardMoney: 4,
    journalDone: 'Агафья накормила внуков. Вечером она принесла мне горсть сушёных яблок и ничего не сказала.',
  },
  {
    id: 'thread_plough',
    npcName: 'Ондрей',
    short: 'чинит плуг',
    x: 300,
    y: 860,
    title: 'Сломанный плуг',
    text: 'Ондрей сидит на земле рядом с плугом, у которого треснуло дышло. Он пробует связать его ремнём и понимает, что не поможет. Без плуга поле простоит пустым.',
    requirements: [
      { itemId: 'plank', count: 2 },
      { itemId: 'branch', count: 3 },
    ],
    rewardMoney: 10,
    journalDone: 'Плуг починили. Ондрей сказал, что поле вспашут до конца недели, и впервые за месяц посмотрел мне в глаза.',
  },
]

export function threadById(id: string): ThreadDef | undefined {
  return THREADS.find((thread) => thread.id === id)
}
