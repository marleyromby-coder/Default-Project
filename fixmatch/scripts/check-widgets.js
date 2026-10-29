#!/usr/bin/env node
/**
 * Checks the home and lock screen widgets without a Mac or an iPhone.
 *
 *   npm run widgets:check
 *
 * Builds the expo-widgets JS runtime and the layout registry the same way Xcode does,
 * then renders every widget in every family it supports, in light and dark mode, with
 * its gallery props and with saved businesses – like WidgetsJSRuntime.swift on the
 * phone. Fails if a layout throws or renders nothing.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fixmatch-widgets-'));

const plugin = require(path.join(ROOT, 'app.json')).expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-widgets');
const widgets = plugin[1].widgets;

function run(script, args) {
  const result = spawnSync(process.execPath, [require.resolve(`expo-widgets/scripts/${script}`), ...args], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, EXPO_OFFLINE: '1' },
  });
  if (result.status !== 0) throw new Error(`${script} failed`);
}

const configPath = path.join(out, 'config.json');
fs.writeFileSync(
  configPath,
  JSON.stringify({ widgets: widgets.map((w) => ({ name: w.name, initialLayout: w.ios.initialLayout })) }),
);
run('build-bundle.mjs', [ROOT, 'ios', path.join(out, 'ExpoWidgets.bundle')]);
run('build-layout-registry.mjs', [ROOT, 'ios', path.join(out, 'registry.json'), configPath]);

const registry = JSON.parse(fs.readFileSync(path.join(out, 'registry.json'), 'utf8'));
const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(out, 'ExpoWidgets.bundle'), 'utf8'), context);

const sampleBusiness = (id, name, open) => ({
  id,
  name,
  initials: name.slice(0, 2).toUpperCase(),
  mark: { light: { background: '#E1E8EE', letters: '#2F5D84' }, dark: { background: '#232E33', letters: '#A9BDCF' } },
  trade: "VVS'er",
  status: open ? 'Åben til 16.00' : 'Åbner i morgen kl. 7.00',
  open,
  price: '580–660 kr./time',
  url: `fixmatch://virksomhed/${id}`,
});
const saved = [sampleBusiness('a', 'Rørfalken', true), sampleBusiness('b', 'Fjordvand VVS', false)];

let renders = 0;
const failures = [];
for (const widget of widgets) {
  const entry = registry.widgets[widget.name];
  if (!entry?.layout) {
    failures.push(`${widget.name}: no layout registered`);
    continue;
  }
  context.__expoWidgetLayout = vm.runInContext(`(${entry.layout})`, context);
  const variants = [entry.initialProps, { ...entry.initialProps, saved }];
  for (const props of variants)
    for (const widgetFamily of widget.ios.supportedFamilies)
      for (const colorScheme of ['light', 'dark']) {
        try {
          const tree = context.__expoWidgetRender(props, {
            widgetFamily,
            colorScheme,
            widgetRenderingMode: widgetFamily.startsWith('accessory') ? 'vibrant' : 'fullColor',
            timestamp: Date.now(),
          });
          if (!tree || typeof tree !== 'object' || !tree.type) throw new Error('rendered nothing');
          renders += 1;
        } catch (error) {
          failures.push(`${widget.name} ${widgetFamily} ${colorScheme}: ${error.message}`);
        }
      }
}

fs.rmSync(out, { recursive: true, force: true });
if (failures.length) {
  console.error(`Widgets: ${failures.length} fejl\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log(`Widgets: ${renders} visninger renderet uden fejl (${widgets.map((w) => w.name).join(', ')}).`);
