// Clinic hours, live open/closed status and the booking form.
// Hours per weekday (0 = Sunday): [open, close] in hours, null = closed.
export const HOURS = [null, [8, 15], [8, 15], [8, 15], [8, 15], [8, 15], [8, 13]];
const fmtH = (h) => `${Math.floor(h) % 12 || 12}${h % 1 ? ':30' : ''} ${h < 12 ? 'AM' : 'PM'}`;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function initStatus() {
  const now = new Date();
  document.querySelector('[data-today]').textContent = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const today = HOURS[now.getDay()], h = now.getHours() + now.getMinutes() / 60;
  const label = document.querySelector('[data-open-label]'), hours = document.querySelector('[data-open-hours]');
  const dot = document.querySelector('[data-open-dot]');
  if (today && h >= today[0] && h < today[1]) {
    label.textContent = "We're Open Clinic";
    hours.textContent = `${fmtH(today[0])} – ${fmtH(today[1])}`;
  } else {
    dot.classList.add('is-closed');
    label.textContent = "We're Closed Now";
    let d = now.getDay(), add = 0;
    if (!today || h >= today[1]) do { d = (d + 1) % 7; add++; } while (!HOURS[d]);
    hours.textContent = `Opens ${add === 0 ? 'today' : add === 1 ? 'tomorrow' : DAYS[d]} at ${fmtH(HOURS[d][0])}`;
  }
}

export function initBooking(form) {
  const dateIn = form.querySelector('input[type=date]');
  const dateField = dateIn.closest('.field');
  const dateLabel = form.querySelector('[data-date-label]');
  const timeBtn = form.querySelector('[data-time-btn]');
  const timeField = timeBtn.closest('.field');
  const list = form.querySelector('.times');
  const timeIn = form.querySelector('input[name=time]');
  const msg = form.querySelector('.form__msg');

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = new Date();
  dateIn.min = iso(today);
  const max = new Date(); max.setDate(max.getDate() + 90); dateIn.max = iso(max);

  const selected = () => (dateIn.value ? new Date(`${dateIn.value}T00:00`) : null);

  function renderTimes() {
    const d = selected();
    const hrs = d ? HOURS[d.getDay()] : HOURS[1];
    if (!hrs) { list.innerHTML = '<li class="times__empty">Closed on Sundays — pick another day</li>'; return; }
    const isToday = d && iso(d) === iso(new Date());
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    let html = '';
    for (let t = hrs[0]; t < hrs[1]; t += 0.5) {
      const off = isToday && t <= nowH + 1;
      html += `<li role="option" data-t="${fmtH(t)}" class="${off ? 'is-off' : ''}" aria-selected="${timeIn.value === fmtH(t)}">${fmtH(t)}</li>`;
    }
    list.innerHTML = html;
  }
  const open = (v) => { list.hidden = !v; timeBtn.setAttribute('aria-expanded', v); if (v) renderTimes(); };

  dateIn.addEventListener('click', () => dateIn.showPicker?.());
  dateIn.addEventListener('change', () => {
    const d = selected();
    dateField.classList.toggle('is-set', !!d);
    dateField.classList.remove('is-error');
    dateLabel.textContent = d ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select Date';
    if (d && !HOURS[d.getDay()]) { msg.className = 'form__msg is-err'; msg.textContent = 'We are closed on Sundays — please choose another day.'; }
    else if (msg.classList.contains('is-err')) msg.textContent = '';
    timeIn.value = ''; timeBtn.textContent = 'Select Time'; timeField.classList.remove('is-set');
  });
  timeBtn.addEventListener('click', () => open(list.hidden));
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-t]');
    if (!li) return;
    timeIn.value = li.dataset.t; timeBtn.textContent = li.dataset.t;
    timeField.classList.add('is-set'); timeField.classList.remove('is-error');
    open(false);
  });
  document.addEventListener('click', (e) => { if (!timeField.contains(e.target)) open(false); });
  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-error'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    const bad = [];
    if (!f.name.value.trim()) bad.push(f.name.closest('.field'));
    if (!/^\S+@\S+\.\S+$/.test(f.email.value)) bad.push(f.email.closest('.field'));
    const d = selected();
    if (!d || !HOURS[d.getDay()]) bad.push(dateField);
    if (!timeIn.value) bad.push(timeField);
    bad.forEach((el) => el.classList.add('is-error'));
    if (bad.length) { msg.className = 'form__msg is-err'; msg.textContent = 'Please fill in the highlighted fields.'; return; }
    msg.className = 'form__msg is-ok';
    msg.textContent = `Thanks, ${f.name.value.trim().split(' ')[0]}! We've pencilled you in for ${dateLabel.textContent} at ${timeIn.value}. A confirmation is on its way to ${f.email.value}.`;
    form.reset();
    dateLabel.textContent = 'Select Date'; timeBtn.textContent = 'Select Time';
    dateField.classList.remove('is-set'); timeField.classList.remove('is-set');
  });
}
