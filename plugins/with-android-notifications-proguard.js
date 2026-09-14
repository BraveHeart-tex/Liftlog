const { readFile, writeFile } = require('node:fs/promises');
const { join } = require('node:path');
const {
  createRunOncePlugin,
  withDangerousMod
} = require('expo/config-plugins');

const KEEP_RULE = '-keep class expo.modules.notifications.** { *; }';

function withAndroidNotificationsProguard(config) {
  return withDangerousMod(config, [
    'android',
    async configMod => {
      const proguardPath = join(
        configMod.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );
      const contents = await readFile(proguardPath, 'utf8');

      if (!contents.includes(KEEP_RULE)) {
        await writeFile(
          proguardPath,
          `${contents.trimEnd()}\n\n# expo-notifications uses reflection-based Java serialization.\n${KEEP_RULE}\n`
        );
      }

      return configMod;
    }
  ]);
}

module.exports = createRunOncePlugin(
  withAndroidNotificationsProguard,
  'with-android-notifications-proguard',
  '1.0.0'
);
