// The config plugins are plain Node.js (CommonJS), run by `expo prebuild`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { patchPodfile, withSwiftHeaderFlags } = require('../../plugins/with-quiet-xcode');

const PODFILE = `platform :ios, '16.4'

target 'FixMatch' do
  post_install do |installer|
    react_native_post_install(installer)
  end
end
`;

describe('with-quiet-xcode', () => {
  it('hides pod warnings, marks scripts without outputs and filters the Expo core warning', () => {
    const patched = patchPodfile(PODFILE);
    expect(patched).toContain("platform :ios, '16.4'\n# Added by plugins/with-quiet-xcode.js\ninhibit_all_warnings!");
    expect(patched).toContain(
      '  post_install do |installer|\n    # Added by plugins/with-quiet-xcode.js\n    installer.pods_project.targets.each do |target|',
    );
    // CocoaPods leaves output_paths nil on phases without outputs.
    expect(patched).toContain(
      "phase.always_out_of_date = '1' if Array(phase.output_paths).empty? && Array(phase.output_file_list_paths).empty?",
    );
    expect(patched).toMatch(/post_integrate do \|installer\|[\s\S]*expo-configure-project\.sh/);
    expect(patched).toContain('react_native_post_install(installer)');
  });

  it('silences the headers Swift imports, in the pods and in our targets', () => {
    expect(patchPodfile(PODFILE)).toContain(`configuration.build_settings['OTHER_SWIFT_FLAGS'] = "#{flags} -Xcc -w"`);
    expect(withSwiftHeaderFlags(undefined)).toBe('"$(inherited) -Xcc -w"');
    expect(withSwiftHeaderFlags('"$(inherited) -D EXPO_CONFIGURATION_DEBUG"')).toBe(
      '"$(inherited) -D EXPO_CONFIGURATION_DEBUG -Xcc -w"',
    );
    expect(withSwiftHeaderFlags('"$(inherited) -Xcc -w"')).toBe('"$(inherited) -Xcc -w"');
  });

  it('patches the Podfile only once', () => {
    const once = patchPodfile(PODFILE);
    expect(patchPodfile(once)).toBe(once);
  });

  it('refuses a Podfile it does not recognise', () => {
    expect(() => patchPodfile("target 'FixMatch' do\nend\n")).toThrow(/with-quiet-xcode/);
  });
});

describe('npm run ios:xcode', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { readTeam, applyTeam } = require('../../scripts/open-xcode');
  const project = `
		13B07F941A680F5B00A75B9A /* Debug */ = {
			buildSettings = {
				PRODUCT_BUNDLE_IDENTIFIER = dk.fixmatch.app;
			};
		};
		61740330E7C444D485AC5133 /* Debug */ = {
			buildSettings = {
				PRODUCT_BUNDLE_IDENTIFIER = "dk.fixmatch.app.widgets";
			};
		};
		83CBBA201A601CBA00E9B192 /* Debug */ = {
			buildSettings = {
				SDKROOT = iphoneos;
			};
		};`;

  it('keeps the signing team for the app and the widget when ios/ is made again', () => {
    const signed = applyTeam(project, 'AB12CD34EF');
    expect(signed.match(/DEVELOPMENT_TEAM = AB12CD34EF;/g)).toHaveLength(2);
    expect(readTeam(signed)).toBe('AB12CD34EF');
    expect(applyTeam(signed, 'AB12CD34EF')).toBe(signed);
    expect(applyTeam(signed, 'ZZ99YY88XX').match(/DEVELOPMENT_TEAM/g)).toHaveLength(2);
    expect(readTeam(project)).toBeUndefined();
  });
});
