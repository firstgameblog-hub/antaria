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
  {
    id: 'thread_wall_gap',
    npcName: 'Гаврила',
    short: 'заделывает пролом',
    x: 900,
    y: 300,
    requiresStage: 'stage_stone_belt',
    title: 'Пролом в стене',
    text: 'В кладке у восточной стены выпал зуб: три камня держались на честном слове и не удержались. Гаврила говорит, что зимой туда полезет ветер, а летом — кто похуже.',
    requirements: [
      { itemId: 'stone', count: 16 },
      { itemId: 'plank', count: 6 },
    ],
    rewardMoney: 28,
    journalDone: 'Пролом заделали. Гаврила простучал всю стену и пометил мелом ещё три места — на будущее.',
  },
  {
    id: 'thread_bellows',
    npcName: 'Савелий',
    short: 'разбирает мехи',
    x: 400,
    y: 520,
    requiresStage: 'stage_stone_belt',
    title: 'Мехи не держат',
    text: 'Кузнец Савелий разложил на земле мехи и смотрит на прорехи. Без них горн не даёт жара, а без жара не выйдет ни гвоздя, ни подковы.',
    requirements: [
      { itemId: 'steel', count: 3 },
      { itemId: 'plank', count: 2 },
    ],
    rewardMoney: 32,
    journalDone: 'Мехи перебрали и зажали стальными пластинами. Горн снова ревёт так, что слышно на другом конце посада.',
  },
  {
    id: 'thread_new_well',
    npcName: 'Марья',
    short: 'носит воду издалека',
    x: 760,
    y: 300,
    requiresStage: 'stage_stone_belt',
    title: 'Второй колодец',
    text: 'На восточном краю воды нет: Марья таскает ведра через всё поселение. Она просит не за себя — «детям тяжело». Нужен камень на сруб и брёвна на ворот.',
    requirements: [
      { itemId: 'stone', count: 8 },
      { itemId: 'log', count: 4 },
    ],
    rewardMoney: 24,
    journalDone: 'Вырыли второй колодец. Марья первой набрала воды и вылила её обратно — чтобы проверить, что не уйдёт.',
  },
  {
    id: 'thread_counters',
    npcName: 'Приказчик',
    short: 'считает на коленке',
    x: 520,
    y: 720,
    requiresStage: 'stage_free_town',
    title: 'Прилавки без прилавков',
    text: 'Приказчик разложил товар прямо на земле и злится: на посаде торгуют больше, чем могут разложить. Нужны доски на прилавки и верёвки, чтобы связать рамы.',
    requirements: [
      { itemId: 'plank', count: 4 },
      { itemId: 'rope', count: 2 },
    ],
    rewardMoney: 34,
    journalDone: 'Прилавки поставили в ряд. Приказчик впервые записал выручку не на ладони.',
  },
  {
    id: 'thread_inn',
    npcName: 'Селифан',
    short: 'ждёт постояльцев',
    x: 980,
    y: 620,
    requiresStage: 'stage_free_town',
    title: 'Постоялый двор',
    text: 'Селифан хочет открыть постоялый двор: чужие люди идут через посад и негде им спать. Нужны брёвна на пристройку и доски на полати.',
    requirements: [
      { itemId: 'log', count: 6 },
      { itemId: 'plank', count: 3 },
    ],
    rewardMoney: 38,
    journalDone: 'Постоялый двор открыли. К вечеру у Селифана уже спали двое — возчик и человек без имени.',
  },
  {
    id: 'thread_scales',
    npcName: 'Влас',
    short: 'ищет гири',
    x: 860,
    y: 880,
    requiresStage: 'stage_free_town',
    title: 'Кривые весы',
    text: 'Влас держит караванную контору и говорит, что весы врут на полторы меры. Гости уже начали это замечать. Нужна сталь на гири и верёвки на подвес.',
    requirements: [
      { itemId: 'steel', count: 2 },
      { itemId: 'rope', count: 4 },
    ],
    rewardMoney: 42,
    journalDone: 'Гири отлили, весы выверили. Влас повесил на дверь табличку: «Вешаем честно».',
  },
  {
    id: 'thread_scriptorium',
    npcName: 'Аким',
    short: 'пишет на щепках',
    x: 300,
    y: 480,
    requiresStage: 'stage_white_city',
    title: 'Писарская изба',
    text: 'Аким ведёт городские книги и пишет на щепках: бумаги нет, стола нет, чернильница одна на всех. Просит доски на стол и сталь на перья.',
    requirements: [
      { itemId: 'plank', count: 3 },
      { itemId: 'steel', count: 1 },
    ],
    rewardMoney: 40,
    journalDone: 'Писарская обзавелась столом. Аким первым делом переписал список жителей — впервые целиком.',
  },
  {
    id: 'thread_hospital',
    npcName: 'Аглая',
    short: 'моет руки',
    x: 980,
    y: 820,
    requiresStage: 'stage_white_city',
    title: 'Госпиталь на дому',
    text: 'Аглая лечит всех в своей избе и уже не справляется: травы кончились, отвара нет. Она просит запас, а не чудо.',
    requirements: [
      { itemId: 'herb', count: 6 },
      { itemId: 'broth', count: 2 },
    ],
    rewardMoney: 36,
    journalDone: 'У Аглаи теперь есть запас. Она разложила травы по пучкам и подписала каждый — чтобы ночью не искать.',
  },
  {
    id: 'thread_bridge',
    npcName: 'Демьян',
    short: 'смотрит на брод',
    x: 700,
    y: 900,
    requiresStage: 'stage_white_city',
    title: 'Мост через брод',
    text: 'Через брод переходят вброд, а по весне — вплавь. Демьян говорит, что городу нужен мост, и что он знает, как его ставить. Нужен камень и доски.',
    requirements: [
      { itemId: 'stone', count: 12 },
      { itemId: 'plank', count: 6 },
    ],
    rewardMoney: 48,
    journalDone: 'Мост встал за три дня. Первым по нему прошёл Демьян — медленно, проверяя каждую доску.',
  },
]

export function threadById(id: string): ThreadDef | undefined {
  return THREADS.find((thread) => thread.id === id)
}
