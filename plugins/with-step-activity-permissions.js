const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const { ensurePermissions } = AndroidConfig.Permissions;

const PERMISSIONS = [
  'android.permission.health.READ_STEPS',
  'android.permission.health.READ_HEALTH_DATA_HISTORY',
  'android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_DATA_SYNC'
];

module.exports = function withStepActivityPermissions(config) {
  return withAndroidManifest(config, config => {
    ensurePermissions(config.modResults, PERMISSIONS);

    return config;
  });
};
