(() => {
  'use strict';

  /* ---------- enquiry form: Web3Forms emails each enquiry to you.
     Until formKey is set, it opens the visitor's email app with everything filled in instead. ---------- */
  const SITE = window.SITE || {};
  const form = document.getElementById('enquiry');
  const status = document.getElementById('form-status');
  if (!form) return;

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
      status.textContent = 'Sent. I’ll be in touch within a day.';
    } catch (_) {
      status.textContent = 'That didn’t send. Please email ' + SITE.email + ' instead.';
    }
    btn.disabled = false;
  });
})();
