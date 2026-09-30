// Draws the tool cards, and the apps' row below them, from the registry kit/nest-nav.js exposes,
// so this page and every tool's bar list the same tools from one place.
(function () {
  'use strict';

  var registry = window.NestTools;
  if (!registry) return;

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

  function draw(id, entries, build) {
    var list = document.getElementById(id);
    if (list) entries.forEach((entry) => list.append(build(entry)));
  }

  draw('tools', registry.tools, (tool) => card(tool, 'h2', mark(tool, 'card-icon')));
  // The apps sit under the "More from Nests" h2, so their names are one level down.
  draw('apps', registry.apps, (app) => {
    var item = card(app, 'h3', preview(app));
    item.classList.add('card-feature');
    return item;
  });
})();
