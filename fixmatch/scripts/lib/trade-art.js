/**
 * The trade tiles of the app for the website: the eight drawings in assets/brand/trade-art.json
 * in the trade colours of src/constants/theme.ts (TradeColors), as inline SVG. Like the app's
 * TradeArt they are decorative: the trade's name is always written next to them.
 */
const fs = require('node:fs');
const path = require('node:path');

/** The light trade colours, `{ vvs: { tile, deep, highlight, soft, onSoft }, … }`, read from theme.ts as text. */
function readTradeColors(root) {
  const source = fs.readFileSync(path.join(root, 'src/constants/theme.ts'), 'utf8');
  const block = source.match(/const TRADE_LIGHT[^=]*= \{([\s\S]*?)\n\};/)?.[1];
  if (!block) throw new Error('src/constants/theme.ts: TRADE_LIGHT findes ikke');
  const colors = {};
  for (const [, id, body] of block.matchAll(/^\s*(\w+): \{([^}]*)\}/gm)) {
    colors[id] = Object.fromEntries([...body.matchAll(/(\w+): '(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1], m[2]]));
  }
  return colors;
}

const ATTRIBUTES = {
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
};

/**
 * `tile(id, { size, radius })` returns the tile of one trade as an SVG string (hidden from
 * screen readers), and `colors` the trade colours.
 */
function tradeArt(root) {
  const art = JSON.parse(fs.readFileSync(path.join(root, 'assets/brand/trade-art.json'), 'utf8'));
  const colors = readTradeColors(root);
  const unit = art.size;
  let count = 0;
  const tile = (id, { size = 64, radius = 0.25 } = {}) => {
    const color = colors[id];
    const shapes = art.art[id];
    if (!color || !shapes) throw new Error(`Ukendt fag til fag-flisen: ${id}`);
    const paint = (value) =>
      ({ white: '#FFFFFF', deep: color.deep, highlight: color.highlight, tile: color.tile })[value] ?? value;
    const drawing = shapes
      .map(({ el, ...shape }) => {
        const attributes = Object.entries(shape)
          .map(([key, value]) => {
            const name = ATTRIBUTES[key] ?? key;
            return `${name}="${name === 'fill' || name === 'stroke' ? paint(value) : value}"`;
          })
          .join(' ');
        return `<${el} ${attributes}/>`;
      })
      .join('');
    // The rounded tile clips the drawing, like the app. SVG ids are global on a page, so each tile gets its own.
    const clip = `trade-${id}-${++count}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="trade-tile" width="${size}" height="${size}" viewBox="0 0 ${unit} ${unit}" aria-hidden="true" focusable="false"><clipPath id="${clip}"><rect width="${unit}" height="${unit}" rx="${radius * unit}"/></clipPath><g clip-path="url(#${clip})"><rect width="${unit}" height="${unit}" fill="${color.tile}"/>${drawing}</g></svg>`;
  };
  return { tile, colors };
}

module.exports = { readTradeColors, tradeArt };
