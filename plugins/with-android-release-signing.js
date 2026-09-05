const { withAppBuildGradle } = require('@expo/config-plugins');

const SIGNING_ENVIRONMENT_VARIABLES = [
  'LIFTLOG_ANDROID_KEYSTORE_PATH',
  'LIFTLOG_ANDROID_KEY_ALIAS',
  'LIFTLOG_ANDROID_STORE_PASSWORD',
  'LIFTLOG_ANDROID_KEY_PASSWORD'
];

const RELEASE_BUILD_CONFIGURATION = `
def liftlogReleaseBuild =
    System.getenv('LIFTLOG_ANDROID_RELEASE_BUILD') == '1' ||
    gradle.startParameter.taskNames.any {
        it.toLowerCase().contains('release')
    }

def liftlogAndroidVersionCode = findProperty('androidVersionCode')

if (liftlogReleaseBuild) {
    def liftlogMissingSigningVariables = ${JSON.stringify(
      SIGNING_ENVIRONMENT_VARIABLES
    )}.findAll {
        !System.getenv(it)
    }

    if (!liftlogMissingSigningVariables.isEmpty()) {
        throw new GradleException(
            "Missing Android release signing environment variable(s): " +
            liftlogMissingSigningVariables.join(', ')
        )
    }

    def liftlogKeystorePath =
        System.getenv('LIFTLOG_ANDROID_KEYSTORE_PATH')

    if (!file(liftlogKeystorePath).isFile()) {
        throw new GradleException(
            'Android release keystore does not exist at LIFTLOG_ANDROID_KEYSTORE_PATH'
        )
    }

    if (!liftlogAndroidVersionCode) {
        throw new GradleException(
            'androidVersionCode Gradle property is required for LiftLog release builds'
        )
    }

    try {
        def parsedVersionCode = liftlogAndroidVersionCode.toInteger()

        if (parsedVersionCode <= 0) {
            throw new GradleException(
                'androidVersionCode Gradle property must be a positive integer'
            )
        }
    } catch (NumberFormatException ignored) {
        throw new GradleException(
            'androidVersionCode Gradle property must be a positive integer'
        )
    }
}
`;

const RELEASE_SIGNING_CONFIG = `
        release {
            def liftlogKeystorePath =
                System.getenv("LIFTLOG_ANDROID_KEYSTORE_PATH")

            storeFile liftlogKeystorePath ? file(liftlogKeystorePath) : null
            storePassword System.getenv("LIFTLOG_ANDROID_STORE_PASSWORD") ?: ""
            keyAlias System.getenv("LIFTLOG_ANDROID_KEY_ALIAS") ?: ""
            keyPassword System.getenv("LIFTLOG_ANDROID_KEY_PASSWORD") ?: ""
        }
`;

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, configMod => {
    if (configMod.modResults.language !== 'groovy') {
      throw new Error(
        'with-android-release-signing requires a Groovy app build.gradle'
      );
    }

    let contents = configMod.modResults.contents;

    const signingConfigsMarker = '    }\n    buildTypes {';

    if (!contents.includes(signingConfigsMarker)) {
      throw new Error(
        'Could not find the Android signingConfigs block in generated app/build.gradle'
      );
    }

    contents = contents.replace(
      signingConfigsMarker,
      `${RELEASE_SIGNING_CONFIG}    }\n    buildTypes {`
    );

    const releaseSigningConfig =
      /buildTypes \{([\s\S]*?)release \{([\s\S]*?)signingConfig signingConfigs\.debug/;

    if (!releaseSigningConfig.test(contents)) {
      throw new Error(
        'Could not find the generated Android release signing configuration'
      );
    }

    contents = contents.replace(
      releaseSigningConfig,
      'buildTypes {$1release {$2signingConfig signingConfigs.release'
    );

    const androidBlockMarker = 'android {\n';

    if (!contents.includes(androidBlockMarker)) {
      throw new Error(
        'Could not find the Android block in generated app/build.gradle'
      );
    }

    contents = contents.replace(
      androidBlockMarker,
      `${RELEASE_BUILD_CONFIGURATION}\n${androidBlockMarker}`
    );

    const versionCodePattern = /versionCode\s+\d+/;

    if (!versionCodePattern.test(contents)) {
      throw new Error(
        'Could not find the generated Android versionCode configuration'
      );
    }

    contents = contents.replace(
      versionCodePattern,
      'versionCode (liftlogAndroidVersionCode ?: 1).toInteger()'
    );

    configMod.modResults.contents = contents;

    return configMod;
  });
};
