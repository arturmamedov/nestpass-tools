// Draws the tool cards, and the apps' row below them, from the registry kit/nest-nav.js exposes,
// so this page and every tool's bar list the same tools from one place. The quick links and the
// social links are the page's own: they come from links.json, which nothing else reads.
(function () {
  'use strict';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // "nestpass.ai/activities": where the tool lives, without the scheme or the trailing slash.
  function place(href) {
    var url = new URL(href);
    return (url.host + url.pathname).replace(/\/$/, '');
  }

  function draw(id, entries, build) {
    var list = document.getElementById(id);
    if (list) entries.forEach((entry) => list.append(build(entry)));
  }

  function tools(registry) {
    // `lead` is what tops the card: a tool's icon, or an app's preview.
    function card(entry, heading, lead) {
      var item = el('li', 'card');
      var name = el(heading, 'card-name');
      var link = el('a', '', entry.name);
      link.href = entry.href;
      name.append(link);
      var foot = el('div', 'card-foot');
      var open = el('span', 'card-open', 'Open');
      open.setAttribute('aria-hidden', 'true');
      foot.append(el('span', 'card-place', place(entry.href)), open);
      item.append(lead, name, el('p', 'card-blurb', entry.blurb), foot);
      return item;
    }

    function mark(entry, className) {
      var node = el('span', className);
      node.innerHTML = entry.icon; // a constant of the kit, never page input
      return node;
    }

    // The app's screenshot, or its icon on the hero's gradient until it has one.
    function preview(app) {
      if (!app.preview) return mark(app, 'card-preview');
      var box = el('span', 'card-preview');
      var img = el('img');
      img.src = new URL(app.preview, registry.hub).href;
      img.alt = ''; // the card's name, right below it, says what it shows
      box.append(img);
      return box;
    }

    draw('tools', registry.tools, (tool) => card(tool, 'h2', mark(tool, 'card-icon')));
    // The apps sit under the "More from Nests" h2, so their names are one level down.
    draw('apps', registry.apps, (app) => {
      var item = card(app, 'h3', preview(app));
      item.classList.add('card-feature');
      return item;
    });
  }

  // The same 24×24 stroke icons as the kit's tools.
  function icon(paths) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'
    );
  }

  // A link's `type` picks its icon. Left out, it follows from where the link goes (SOURCES).
  var ICONS = {
    drive: icon('<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>'),
    notion: icon('<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9h17M9.5 9v11"/>'),
    docs: icon('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
    design: icon('<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.8 1.7-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3z"/><path d="M7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01"/>'),
    link: icon('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'),
  };

  // Where a link goes: the name its tile shows, and the icon it gets by default.
  var SOURCES = [
    { hosts: /(^|\.)(drive|docs)\.google\.com$/, label: 'Google Drive', type: 'drive' },
    { hosts: /(^|\.)notion\.(site|so|com)$/, label: 'Notion', type: 'notion' },
  ];

  // Quick links and socials open in a new tab: people look something up and come back here.
  // The tools keep the tab, as the bar does.
  function external(href, className, text) {
    var a = el('a', className, text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }

  function tile(link) {
    var host = new URL(link.href).hostname;
    var source = SOURCES.find((s) => s.hosts.test(host)) || { label: host.replace(/^www\./, ''), type: 'link' };
    var a = external(link.href, 'tile');
    var mark = el('span', 'tile-icon');
    mark.innerHTML = ICONS[link.type] || ICONS[source.type]; // constants above, never page input
    var label = el('span', 'tile-source', source.label + ' ');
    var arrow = el('span', '', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    label.append(arrow);
    a.append(mark, el('span', 'tile-name', link.name), label);
    if (link.note) a.append(el('span', 'tile-note', link.note));
    var item = el('li');
    item.append(a);
    return item;
  }

  function links(config) {
    var box = document.getElementById('links');
    if (box && config.groups && config.groups.length) {
      config.groups.forEach((group) => {
        var list = el('ul', 'tiles');
        group.links.forEach((link) => list.append(tile(link)));
        box.append(el('h3', 'group-name', group.name), list);
      });
      box.closest('section').hidden = false;
    }
    draw('social', config.social || [], (social) => {
      var a = external(social.href, '', social.name);
      var item = el('li');
      item.append(a);
      return item;
    });
  }

  if (window.NestTools) tools(window.NestTools);
  // Without links.json the page is the tools alone: the section stays hidden.
  fetch('links.json')
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('links.json: ' + res.status))))
    .then(links)
    .catch(() => {});
})();
