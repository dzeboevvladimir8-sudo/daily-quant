import { start } from './ui.js';

fetch('data/problems.json')
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(start)
  .catch(() => {
    document.getElementById('app').innerHTML =
      '<div class="notice">Couldn\'t load the problems. Start the app from the project folder with <code>python -m http.server 8000</code> and open http://localhost:8000.</div>';
  });
