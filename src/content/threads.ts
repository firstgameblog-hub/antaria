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
  /** С какой стадии просьба появляется. Без поля — с самого начала. */
  requiresStage?: string
  /** Где видна беда: лужа под протекающей крышей. Не у каждой нити есть. */
  drip?: { x: number; y: number }
  title: string
  text: string
  requirements: readonly ThreadRequirement[]
  rewardMoney: number
  journalDone: string
  /** Сцена после выполнения: житель хочет поговорить. */
  followUpScene?: string
  /** Подпись, когда просьба выполнена, а разговор ещё не случился. */
  followUpLabel?: string
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
  followUpScene: 'marta_after',
  followUpLabel: 'хочет поговорить',
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
    followUpScene: 'agafya_after',
    followUpLabel: 'ждёт у порога',
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
    followUpScene: 'ondrey_after',
    followUpLabel: 'зовёт к полю',
  },
  {
    id: 'thread_fence',
    npcName: 'Прохор',
    short: 'подпирает плетень',
    x: 610,
    y: 700,
    requiresStage: 'stage_first_smoke',
    title: 'Поваленный плетень',
    text: 'Ночью ветер положил плетень у огорода. Прохор держит его плечом и говорит, что так и стоять будет, если не подвязать. Веток у него нет: старые сгнили ещё до зимы.',
    requirements: [
      { itemId: 'branch', count: 6 },
      { itemId: 'rope', count: 2 },
    ],
    rewardMoney: 9,
    journalDone: 'Плетень подняли. Прохор обвязал его верёвкой и сказал, что теперь до весны.',
    followUpLabel: 'хочет сказать спасибо',
  },
  {
    id: 'thread_child',
    npcName: 'Федора',
    short: 'держит ребёнка на руках',
    x: 790,
    y: 760,
    requiresStage: 'stage_first_smoke',
    title: 'Жар у ребёнка',
    text: 'У Федоры младший горит третий день. Она не плачет — просто сидит и держит его, будто теплом можно вылечить. Нужен отвар и травы, которых у неё нет.',
    requirements: [
      { itemId: 'herb', count: 4 },
      { itemId: 'broth', count: 1 },
    ],
    rewardMoney: 6,
    journalDone: 'Ребёнок Федоры уснул к вечеру. Она вышла во двор и долго стояла, ничего не говоря.',
  },
  {
    id: 'thread_well',
    npcName: 'Мирон',
    short: 'смотрит в колодец',
    x: 480,
    y: 340,
    requiresStage: 'stage_first_smoke',
    title: 'Ослабший сруб',
    text: 'Сруб колодца поехал набок. Мирон говорит, что вода пока есть, но сруб надо обложить камнем, пока он не сложился внутрь. Камня в деревне мало.',
    requirements: [
      { itemId: 'stone', count: 4 },
      { itemId: 'plank', count: 2 },
    ],
    rewardMoney: 11,
    journalDone: 'Сруб обложили камнем. Мирон проверил ведром: вода чистая, стенки держат.',
  },
  {
    id: 'thread_charcoal',
    npcName: 'Тихон',
    short: 'копает угольную яму',
    x: 450,
    y: 470,
    requiresStage: 'stage_trade_road',
    title: 'Угольная яма',
    text: 'Тихон хочет жечь уголь, чтобы кузня не вставала. Яма уже выкопана, но обложить её нечем: нужны брёвна на укрепление и камень на подпор.',
    requirements: [
      { itemId: 'log', count: 4 },
      { itemId: 'stone', count: 2 },
    ],
    rewardMoney: 12,
    journalDone: 'Угольную яму обложили. Тихон поджёг первую кучу и сказал, что дыма будет на всю округу.',
  },
  {
    id: 'thread_road',
    npcName: 'Староста',
    short: 'меряет дорогу шагами',
    x: 700,
    y: 380,
    requiresStage: 'stage_trade_road',
    title: 'Разбитая дорога',
    text: 'Староста ходит по дороге и считает шаги. На южном повороте телеги продавили колею: после дождя там стоит вода по колено. Нужна гать.',
    requirements: [
      { itemId: 'stone', count: 6 },
      { itemId: 'plank', count: 4 },
    ],
    rewardMoney: 16,
    journalDone: 'Гать выложили за один день. Староста прошёл по ней туда и обратно, будто не верил.',
  },
  {
    id: 'thread_wagon',
    npcName: 'Возчик',
    short: 'кричит на ось',
    x: 600,
    y: 820,
    requiresStage: 'stage_trade_road',
    title: 'Лопнувшая ось',
    text: 'Возчик пришёл с юга и встал у ворот: ось лопнула на повороте. Он говорит, что до города не доедет, а без товара ему нечем платить за постой.',
    requirements: [
      { itemId: 'plank', count: 3 },
      { itemId: 'rope', count: 2 },
    ],
    rewardMoney: 14,
    journalDone: 'Ось связали и подтесали. Возчик уехал к вечеру, оставив на память медную пуговицу.',
  },
]

export function threadById(id: string): ThreadDef | undefined {
  return THREADS.find((thread) => thread.id === id)
}
