/**
 * Один шаг вместо трёх: сохранить всё, сделать снимок и отправить на GitHub.
 *
 *   npm run push
 *   npm run push "M1: первая глава"
 *
 * Если изменений нет — просто отправит то, что уже накопилось.
 */

import { execFileSync } from 'node:child_process'

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: options.stdio ?? 'pipe' })
}

function fail(message) {
  console.error(`\n${message}\n`)
  process.exit(1)
}

let remotes
try {
  remotes = git(['remote']).trim()
} catch {
  fail('Похоже, git не установлен или папка не является репозиторием.')
}

if (remotes === '') {
  fail(
    [
      'Репозиторий ещё не связан с GitHub.',
      'Один раз выполни в папке проекта:',
      '',
      '  git remote add origin https://github.com/ТВОЙ_ЛОГИН/ИМЯ_РЕПОЗИТОРИЯ.git',
      '  git push -u origin main',
      '',
      'Первый раз GitHub попросит войти — откроется браузер. Дальше вход запомнится.',
    ].join('\n'),
  )
}

git(['add', '-A'], { stdio: 'inherit' })

const staged = git(['diff', '--cached', '--name-only']).trim()

if (staged === '') {
  console.log('Новых изменений нет — отправляю то, что уже сохранено.')
} else {
  const message =
    process.argv.slice(2).join(' ').trim() ||
    `Обновление: ${new Date().toLocaleString('ru-RU')}`

  console.log(`Сохраняю: ${message}`)
  git(['commit', '-m', message], { stdio: 'inherit' })
}

try {
  git(['push'], { stdio: 'inherit' })
  console.log('\nГотово. Изменения ушли на GitHub.')
} catch {
  fail(
    'Не удалось отправить. Проверь интернет и вход в GitHub.\n' +
      'Если просят пароль — GitHub больше не принимает пароль от аккаунта: нужен токен\n' +
      'или вход через Git Credential Manager (обычно открывается сам).',
  )
}
