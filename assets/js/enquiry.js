(() => {
  'use strict';

  /* ---------- enquiry form: Web3Forms emails each enquiry to you.
     Until formKey is set, it opens the visitor's email app with everything filled in instead. ---------- */
  const SITE = window.SITE || {};
  const form = document.getElementById('enquiry');
  const status = document.getElementById('form-status');
  if (!form) return;

  /* ---------- shoot date: a calendar in the site's style instead of the browser's own.
     The date input stays in the page as a hidden field, so the form still sends shoot_date
     (and without this script the plain browser date box still works). ---------- */
  const dateInput = form.querySelector('input[type="date"]');
  if (dateInput) datePicker(dateInput);

  function datePicker(input) {
    const ARROW = d => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (d < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const wrap = document.createElement('div');
    wrap.className = 'datepick';
    input.parentNode.insertBefore(wrap, input);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'datepick-btn';
    btn.id = input.id;
    input.removeAttribute('id');
    input.type = 'hidden';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="datepick-text">Pick a day</span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    const pop = document.createElement('div');
    pop.className = 'datepick-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Choose a shoot date');
    pop.hidden = true;
    wrap.append(btn, input, pop);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let view = new Date(today.getFullYear(), today.getMonth(), 1);
    let sel = null;
    const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const long = new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const month = new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' });

    function render(focusDay) {
      const y = view.getFullYear(), m = view.getMonth();
      const lead = (new Date(y, m, 1).getDay() + 6) % 7; // weeks start on Monday
      const days = new Date(y, m + 1, 0).getDate();
      const thisMonth = y === today.getFullYear() && m === today.getMonth();
      let h = '<div class="dp-head"><button type="button" class="dp-nav" data-step="-1" aria-label="Previous month"' + (thisMonth ? ' disabled' : '') + '>' + ARROW(-1) + '</button>' +
        '<p class="dp-month" aria-live="polite">' + month.format(view) + '</p>' +
        '<button type="button" class="dp-nav" data-step="1" aria-label="Next month">' + ARROW(1) + '</button></div><div class="dp-grid">';
      ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].forEach(d => { h += '<span class="dp-wd" aria-hidden="true">' + d + '</span>'; });
      for (let i = 0; i < lead; i++) h += '<span></span>';
      for (let d = 1; d <= days; d++) {
        const dt = new Date(y, m, d);
        const on = sel && +dt === +sel;
        h += '<button type="button" class="dp-day' + (+dt === +today ? ' is-today' : '') + (on ? ' is-sel' : '') + '" data-d="' + d + '"' +
          (dt < today ? ' disabled' : '') + ' aria-label="' + long.format(dt) + '"' + (on ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
      }
      h += '</div>';
      if (sel) h += '<button type="button" class="dp-clear mono">Clear date</button>';
      pop.innerHTML = h;
      if (focusDay) {
        const b = pop.querySelector('[data-d="' + focusDay + '"]:not([disabled])') || pop.querySelector('.dp-day:not([disabled])');
        if (b) b.focus();
      }
    }
    function open() {
      if (sel) view = new Date(sel.getFullYear(), sel.getMonth(), 1);
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      render(sel ? sel.getDate() : today.getDate());
    }
    function close(refocus) {
      pop.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus();
    }
    function set(d) {
      sel = d;
      input.value = d ? iso(d) : '';
      btn.querySelector('.datepick-text').textContent = d ? long.format(d) : 'Pick a day';
      btn.classList.toggle('has-value', !!d);
    }

    btn.addEventListener('click', () => (pop.hidden ? open() : close()));
    pop.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.step) {
        view = new Date(view.getFullYear(), view.getMonth() + Number(b.dataset.step), 1);
        render();
        const nav = pop.querySelector('[data-step="' + b.dataset.step + '"]:not([disabled])');
        if (nav) nav.focus();
      } else if (b.dataset.d) {
        set(new Date(view.getFullYear(), view.getMonth(), Number(b.dataset.d)));
        close(true);
      } else if (b.classList.contains('dp-clear')) {
        set(null);
        close(true);
      }
    });
    pop.addEventListener('keydown', e => {
      if (e.key === 'Escape') { close(true); return; }
      const b = document.activeElement;
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step || !b.dataset.d) return;
      e.preventDefault();
      const t = new Date(view.getFullYear(), view.getMonth(), Number(b.dataset.d) + step);
      if (t < today) return;
      view = new Date(t.getFullYear(), t.getMonth(), 1);
      render(t.getDate());
    });
    /* the event path, not e.target: changing month redraws the calendar, so the clicked arrow
       is no longer inside it by the time this runs */
    document.addEventListener('click', e => { if (!pop.hidden && !e.composedPath().includes(wrap)) close(); });
    form.addEventListener('reset', () => set(null));
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    if (data.botcheck) return;
    delete data.botcheck;

    if (!SITE.formKey) {
      const body = 'Name: ' + data.name + '\nEmail: ' + data.email + '\nProject: ' + data.project_type +
        (data.shoot_date ? '\nShoot date: ' + data.shoot_date : '') + '\n\n' + data.message;
      location.href = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent('Enquiry: ' + data.project_type) +
        '&body=' + encodeURIComponent(body);
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    status.textContent = 'Sending…';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.assign({
          access_key: SITE.formKey,
          subject: 'New enquiry from the Kutt website: ' + data.project_type,
          from_name: 'Kutt website',
          replyto: data.email
        }, data))
      });
      const out = await res.json();
      if (!out.success) throw new Error(out.message);
      form.reset();
      status.textContent = 'Sent. I’ll get back to you soon.';
    } catch (_) {
      status.textContent = 'That didn’t send. Please email ' + SITE.email + ' instead.';
    }
    btn.disabled = false;
  });
})();
