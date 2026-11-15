/**
 * Временные подписи. Переедут в контент на задаче 7.5, когда появится таблица стадий.
 */

const STAGE_LABELS: Record<string, string> = {
  stage_dying: 'Последний очаг',
}

export function stageLabel(stageId: string): string {
  return STAGE_LABELS[stageId] ?? stageId
}
