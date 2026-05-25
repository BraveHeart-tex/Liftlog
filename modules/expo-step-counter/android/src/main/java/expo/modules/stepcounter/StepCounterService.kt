package expo.modules.stepcounter

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat

class StepCounterService : Service(), SensorEventListener {
    private lateinit var sensorManager: SensorManager
    private var stepCounterSensor: Sensor? = null

    private var healthConnectBaseline: Int = 0
    private var sensorBaseline: Float? = null
    private var latestSensorValue: Float? = null
    private var latestDisplayedSteps: Int = 0
    private var stepGoal: Int = DEFAULT_STEP_GOAL
    private var isCounting: Boolean = false

    override fun onCreate() {
        super.onCreate()

        sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager
        stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)

        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val baseline = intent.getIntExtra(EXTRA_HEALTH_CONNECT_BASELINE, 0)
                val goal = intent.getIntExtra(EXTRA_STEP_GOAL, DEFAULT_STEP_GOAL)
                startStepCounting(baseline, goal)
            }
            ACTION_UPDATE_BASELINE -> {
                val baseline = intent.getIntExtra(EXTRA_HEALTH_CONNECT_BASELINE, 0)
                val goal = intent.getIntExtra(EXTRA_STEP_GOAL, DEFAULT_STEP_GOAL)
                if (isCounting) {
                    updateBaseline(baseline, goal)
                } else {
                    startStepCounting(baseline, goal)
                }
            }
            ACTION_STOP -> {
                stopStepCounting()
                stopSelf()
            }
            else -> {
                if (!isCounting) {
                    startStepCounting(healthConnectBaseline, stepGoal)
                }
            }
        }

        return START_REDELIVER_INTENT
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_STEP_COUNTER) return

        val currentSensorValue = event.values.firstOrNull() ?: return

        if (sensorBaseline == null) {
            sensorBaseline = currentSensorValue
        }

        latestSensorValue = currentSensorValue

        val liveDelta =
                (currentSensorValue - (sensorBaseline ?: currentSensorValue))
                        .toInt()
                        .coerceAtLeast(0)

        latestDisplayedSteps = healthConnectBaseline + liveDelta

        updateNotification(latestDisplayedSteps)

        StepCounterEventBus.emitStepCountChanged(
                StepCounterEvent(
                        steps = latestDisplayedSteps,
                        healthConnectBaseline = healthConnectBaseline,
                        liveDelta = liveDelta,
                        sensorValue = latestSensorValue
                )
        )
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    private fun startStepCounting(nextHealthConnectBaseline: Int, nextStepGoal: Int) {
        healthConnectBaseline = nextHealthConnectBaseline.coerceAtLeast(0)
        stepGoal = nextStepGoal.coerceAtLeast(1)
        latestDisplayedSteps = healthConnectBaseline

        if (!hasActivityRecognitionPermission()) {
            StepCounterEventBus.emitError("ACTIVITY_RECOGNITION permission is missing")
            stopSelf()
            return
        }

        val sensor = stepCounterSensor

        if (sensor == null) {
            StepCounterEventBus.emitError(
                    "TYPE_STEP_COUNTER sensor is not available on this device"
            )
            stopSelf()
            return
        }

        if (isCounting) {
            updateBaseline(nextHealthConnectBaseline, nextStepGoal)
            return
        }

        try {
            startForeground(NOTIFICATION_ID, buildNotification(latestDisplayedSteps))
        } catch (error: Throwable) {
            StepCounterEventBus.emitError(
                    "Failed to start step counter service: ${error.message ?: "Unknown error"}"
            )
            stopSelf()
            return
        }

        sensorBaseline = null
        latestSensorValue = null

        val registered =
                sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)

        if (!registered) {
            StepCounterEventBus.emitError("Failed to register step counter sensor listener")
            stopSelf()
            return
        }

        isCounting = true
        emitCurrentState()
    }

    private fun updateBaseline(nextHealthConnectBaseline: Int, nextStepGoal: Int) {
        healthConnectBaseline = nextHealthConnectBaseline.coerceAtLeast(0)
        stepGoal = nextStepGoal.coerceAtLeast(1)

        // Health Connect may have caught up with steps we were temporarily adding
        // as live delta. Reset this to avoid double-counting old live steps.
        sensorBaseline = null
        latestSensorValue = null
        latestDisplayedSteps = healthConnectBaseline

        updateNotification(latestDisplayedSteps)
        emitCurrentState()
    }

    private fun stopStepCounting() {
        if (isCounting) {
            sensorManager.unregisterListener(this)
            isCounting = false
        }

        sensorBaseline = null
        latestSensorValue = null

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION") stopForeground(true)
        }
    }

    override fun onDestroy() {
        stopStepCounting()
        super.onDestroy()
    }

    private fun emitCurrentState() {
        val liveDelta = (latestDisplayedSteps - healthConnectBaseline).coerceAtLeast(0)

        StepCounterEventBus.emitStepCountChanged(
                StepCounterEvent(
                        steps = latestDisplayedSteps,
                        healthConnectBaseline = healthConnectBaseline,
                        liveDelta = liveDelta,
                        sensorValue = latestSensorValue
                )
        )
    }

    private fun hasActivityRecognitionPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return true
        }

        return ActivityCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION) ==
                PackageManager.PERMISSION_GRANTED
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val channel =
                NotificationChannel(
                                NOTIFICATION_CHANNEL_ID,
                                NOTIFICATION_CHANNEL_NAME,
                                NotificationManager.IMPORTANCE_LOW
                        )
                        .apply {
                            description = "Shows live step count while step tracking is active"
                            setShowBadge(false)
                        }

        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)
    }

    private fun updateNotification(displayedSteps: Int) {
        val notificationManager = getSystemService(NotificationManager::class.java)

        notificationManager.notify(NOTIFICATION_ID, buildNotification(displayedSteps))
    }

    private fun buildNotification(displayedSteps: Int): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)

        val pendingIntent =
                launchIntent?.let {
                    PendingIntent.getActivity(
                            this,
                            0,
                            it,
                            PendingIntent.FLAG_UPDATE_CURRENT or pendingIntentImmutableFlag()
                    )
                }

        val progress = ((displayedSteps.toDouble() / stepGoal) * 100).toInt().coerceIn(0, 100)

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("LiftLog steps")
                .setContentText("$displayedSteps / $stepGoal steps today")
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setProgress(100, progress, false)
                .setContentIntent(pendingIntent)
                .build()
    }

    private fun pendingIntentImmutableFlag(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_IMMUTABLE
        } else {
            0
        }
    }

    companion object {
        const val ACTION_START = "expo.modules.stepcounter.START"
        const val ACTION_STOP = "expo.modules.stepcounter.STOP"
        const val ACTION_UPDATE_BASELINE = "expo.modules.stepcounter.UPDATE_BASELINE"

        const val EXTRA_HEALTH_CONNECT_BASELINE = "healthConnectBaseline"
        const val EXTRA_STEP_GOAL = "stepGoal"

        private const val DEFAULT_STEP_GOAL = 10000
        private const val NOTIFICATION_CHANNEL_ID = "activity_steps"
        private const val NOTIFICATION_CHANNEL_NAME = "Steps"
        private const val NOTIFICATION_ID = 1001
    }
}
