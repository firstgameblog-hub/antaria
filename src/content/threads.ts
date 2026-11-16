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
  /** Где видна беда: лужа под протекающей крышей. */
  drip: { x: number; y: number }
  title: string
  text: string
  requirements: readonly ThreadRequirement[]
  rewardMoney: number
  journalDone: string
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

export const THREADS: readonly ThreadDef[] = [ROOF_THREAD]

export function threadById(id: string): ThreadDef | undefined {
  return THREADS.find((thread) => thread.id === id)
}
