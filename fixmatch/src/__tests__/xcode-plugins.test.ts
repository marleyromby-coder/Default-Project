// The config plugins are plain Node.js (CommonJS), run by `expo prebuild`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { patchPodfile } = require('../../plugins/with-quiet-xcode');

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
    expect(patched).toContain("phase.always_out_of_date = '1'");
    expect(patched).toMatch(/post_integrate do \|installer\|[\s\S]*expo-configure-project\.sh/);
    expect(patched).toContain('react_native_post_install(installer)');
  });

  it('patches the Podfile only once', () => {
    const once = patchPodfile(PODFILE);
    expect(patchPodfile(once)).toBe(once);
  });

  it('refuses a Podfile it does not recognise', () => {
    expect(() => patchPodfile("target 'FixMatch' do\nend\n")).toThrow(/with-quiet-xcode/);
  });
});
