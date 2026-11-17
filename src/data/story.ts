/**
 * Схема сцены (2.3.6, 9.2).
 *
 * Сцена — это последовательность «битов»: абзац текста, иногда с выбором.
 * Никаких квестов и маркеров: только то, что герой видит и решает.
 */

export interface StoryChoice {
  id: string
  text: string
  /** Флаг, который ставится при выборе: имя и значение. */
  flag: string
  value: string
  /** Что герой думает после выбора. Показывается отдельным абзацем. */
  after?: string
  /** Иллюстрация к этому абзацу: id картинки из ui/illustrations. */
  art?: string
  /** Действие в мире, а не только флаг: например, найм охраны. */
  action?: string
}

export interface StoryBeat {
  id: string
  text: string
  /** Иллюстрация к абзацу: id картинки из ui/illustrations. null — без картинки. */
  art?: string | null
  choices?: readonly StoryChoice[]
  /** Запись в дневник-хронику (9.4), когда бит показан. */
  journal?: string
}

export interface StoryScene {
  id: string
  title: string
  /** Иллюстрация по умолчанию для всех абзацев сцены. */
  art?: string
  beats: readonly StoryBeat[]
}
