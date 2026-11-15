/**
 * Названия стадий. Переедут в контент на задаче 7.5, когда появится таблица стадий.
 *
 * Регистр один на все стадии: короткая фраза, как название главы книги.
 */

const STAGE_LABELS: Record<string, string> = {
  stage_dying: 'Последний очаг',
  stage_first_smoke: 'Первый дым',
  stage_strong_village: 'Крепкое село',
  stage_trade_road: 'Торговый путь',
  stage_stone_belt: 'Каменный пояс',
  stage_free_town: 'Вольный посад',
  stage_white_city: 'Белый город',
  stage_throne_city: 'Стольный град',
  stage_capital: 'Столица Антарии',
}

export function stageLabel(stageId: string): string {
  return STAGE_LABELS[stageId] ?? stageId
}
