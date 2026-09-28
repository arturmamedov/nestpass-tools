// Draws the tool cards from the registry kit/nest-nav.js exposes, so this page and every
// tool's bar list the same tools from one place.
(function () {
  'use strict';

  var list = document.getElementById('tools');
  var registry = window.NestTools;
  if (!list || !registry) return;

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

  registry.tools.forEach(function (tool) {
    var card = el('li', 'card');
    var mark = el('span', 'card-icon');
    mark.innerHTML = tool.icon; // a constant of the kit, never page input
    var name = el('h2', 'card-name');
    var link = el('a', '', tool.name);
    link.href = tool.href;
    name.append(link);
    var foot = el('div', 'card-foot');
    var open = el('span', 'card-open', 'Open');
    open.setAttribute('aria-hidden', 'true');
    foot.append(el('span', 'card-place', place(tool.href)), open);
    card.append(mark, name, el('p', 'card-blurb', tool.blurb), foot);
    list.append(card);
  });
})();
