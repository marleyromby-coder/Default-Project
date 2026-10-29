/**
 * Adds two things to the widget extension that expo-widgets does not do (yet):
 *
 * 1. The FixMatch logo as images in an asset catalog (FixMatchMark, FixMatchGlyph and
 *    FixMatchGlyphMono from assets/brand/widget/, rendered by `npm run brand:render`), so the
 *    widgets show the real mark with `<Image assetName="FixMatchMark" />`.
 * 2. iOS 27's extra-large portrait size (`systemExtraLargePortrait`, 4 × 6) for the widgets
 *    listed in `extraLargePortrait`. The family only exists in the iOS 27 SDK, so it is added
 *    behind `#if compiler(>=6.4)` (Xcode 27) and `#available(iOS 27.0, *)`: older Xcode
 *    versions and older iPhones simply keep the other sizes.
 *
 * Must be listed before "expo-widgets" in app.json: config plugins run their mods in reverse
 * order, so this one then runs after expo-widgets has generated the target.
 */
const fs = require('node:fs');
const path = require('node:path');

const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const TARGET = 'ExpoWidgetsTarget';
const CATALOG = 'FixMatchBrand.xcassets';
const IMAGES = [
  { name: 'FixMatchMark' },
  { name: 'FixMatchGlyph' },
  // Tinted by iOS on the lock screen and in tinted home screen mode.
  { name: 'FixMatchGlyphMono', template: true },
];

/** Wraps the families of a generated widget so the iOS 27 size is added where it exists. */
function addExtraLargePortrait(source, widgetName) {
  const pattern = /\.supportedFamilies\(\[([^\]]*)\]\)/;
  if (!pattern.test(source)) {
    throw new Error(`with-fixmatch-widgets: no supportedFamilies in ${widgetName}.swift`);
  }
  return `${source.replace(pattern, '.supportedFamilies(fixMatchFamilies([$1]))')}

// Added by plugins/with-fixmatch-widgets.js: the iOS 27 extra-large portrait size.
private func fixMatchFamilies(_ families: [WidgetFamily]) -> [WidgetFamily] {
#if compiler(>=6.4)
  if #available(iOS 27.0, *) {
    return families + [.systemExtraLargePortrait]
  }
#endif
  return families
}
`;
}

function writeCatalog(projectRoot, targetDirectory) {
  const catalog = path.join(targetDirectory, CATALOG);
  fs.mkdirSync(catalog, { recursive: true });
  const info = { author: 'xcode', version: 1 };
  fs.writeFileSync(path.join(catalog, 'Contents.json'), `${JSON.stringify({ info }, null, 2)}\n`);
  for (const image of IMAGES) {
    const set = path.join(catalog, `${image.name}.imageset`);
    fs.mkdirSync(set, { recursive: true });
    const images = [{ idiom: 'universal', scale: '1x' }];
    for (const scale of ['2x', '3x']) {
      const file = `${image.name}@${scale}.png`;
      const source = path.join(projectRoot, 'assets/brand/widget', file);
      if (!fs.existsSync(source)) {
        throw new Error(
          `with-fixmatch-widgets: ${path.relative(projectRoot, source)} is missing. Run npm run brand:render.`,
        );
      }
      fs.copyFileSync(source, path.join(set, file));
      images.push({ filename: file, idiom: 'universal', scale });
    }
    const contents = {
      images,
      info,
      ...(image.template ? { properties: { 'template-rendering-intent': 'template' } } : {}),
    };
    fs.writeFileSync(path.join(set, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`);
  }
}

const withFixMatchWidgets = (config, { extraLargePortrait = [] } = {}) => {
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const targetDirectory = path.join(config.modRequest.platformProjectRoot, TARGET);
      if (!fs.existsSync(targetDirectory)) {
        throw new Error('with-fixmatch-widgets: the widget target is missing. List this plugin before "expo-widgets".');
      }
      for (const name of extraLargePortrait) {
        const file = path.join(targetDirectory, `${name}.swift`);
        fs.writeFileSync(file, addExtraLargePortrait(fs.readFileSync(file, 'utf8'), name));
      }
      writeCatalog(config.modRequest.projectRoot, targetDirectory);
      return config;
    },
  ]);

  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const target = project.pbxTargetByName(TARGET);
    const targetUuid = project.findTargetKey(TARGET);
    const groupKey = project.findPBXGroupKey({ name: TARGET });
    if (!target || !targetUuid || !groupKey) {
      throw new Error('with-fixmatch-widgets: the widget target is missing. List this plugin before "expo-widgets".');
    }
    const alreadyAdded = Object.values(project.pbxFileReferenceSection()).some(
      (ref) => typeof ref === 'object' && ref.path === CATALOG,
    );
    if (alreadyAdded) return config;

    // Added by hand like expo-widgets does: xcode's addResourceFile expects a "Resources" group.
    const file = project.addFile(CATALOG, groupKey, { lastKnownFileType: 'folder.assetcatalog' });
    if (!file) throw new Error('with-fixmatch-widgets: could not add the asset catalog to the widget target.');
    file.uuid = project.generateUuid();
    file.target = targetUuid;
    project.addToPbxBuildFileSection(file);

    const phases = project.hash.project.objects.PBXResourcesBuildPhase ?? {};
    let phase = target.buildPhases.map((ref) => phases[ref.value]).find(Boolean);
    if (!phase) {
      project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', targetUuid);
      const objects = project.hash.project.objects.PBXResourcesBuildPhase;
      phase = target.buildPhases.map((ref) => objects[ref.value]).find(Boolean);
    }
    phase.files.push({ value: file.uuid, comment: `${CATALOG} in Resources` });
    return config;
  });
};

module.exports = withFixMatchWidgets;
