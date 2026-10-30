const out = document.getElementById('salida');
const show = async (res) => {
  const body = res.status === 204 ? '' : JSON.stringify(await res.json(), null, 2);
  out.textContent = `HTTP ${res.status}\n${body}`;
  document.getElementById('cookie').textContent = JSON.stringify(document.cookie);
};

document.getElementById('login').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target));
  show(await fetch('/api/usuarios/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
});


document.getElementById('sigIn').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target));
  show(await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
});

document.querySelectorAll('button[data-url]').forEach((button) =>
  button.addEventListener('click', async () => show(await fetch(button.dataset.url, { method: button.dataset.method || 'GET' }))),
);
