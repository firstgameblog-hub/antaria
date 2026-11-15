/* Заглушка загрузки. Настоящий экран появится на вехе M0 вместе со сценой деревни. */

import './styles.css'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Не найден корневой элемент #app')

app.innerHTML = `
  <main class="boot">
    <h1 class="boot__title">Хроники Антарии</h1>
    <p class="boot__subtitle">Деревня, которой ещё нет</p>
    <p class="boot__note">Каркас проекта собран. Сцена деревни появится на вехе M0.</p>
  </main>
`
