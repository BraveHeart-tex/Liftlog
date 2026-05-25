package expo.modules.stepcounter

import android.Manifest
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

class StepCounterService : Service(), SensorEventListener {
    private lateinit var sensorManager: SensorManager
    private var stepCounterSensor: Sensor? = null

    private var healthConnectBaseline: Int = 0
    private var sensorBaseline: Float? = null
    private var latestSensorValue: Float? = null
    private var latestDisplayedSteps: Int = 0
    private var isCounting: Boolean = false

    override fun onCreate() {
        super.onCreate()

        sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager
        stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val baseline = intent.getIntExtra(EXTRA_HEALTH_CONNECT_BASELINE, 0)
                startStepCounting(baseline)
            }
            ACTION_UPDATE_BASELINE -> {
                val baseline = intent.getIntExtra(EXTRA_HEALTH_CONNECT_BASELINE, 0)
                updateBaseline(baseline)
            }
            ACTION_STOP -> {
                stopStepCounting()
                stopSelf()
            }
            else -> {
                if (!isCounting) {
                    startStepCounting(healthConnectBaseline)
                }
            }
        }

        return START_NOT_STICKY
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

    private fun startStepCounting(nextHealthConnectBaseline: Int) {
        healthConnectBaseline = nextHealthConnectBaseline.coerceAtLeast(0)
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
            emitCurrentState()
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

    private fun updateBaseline(nextHealthConnectBaseline: Int) {
        healthConnectBaseline = nextHealthConnectBaseline.coerceAtLeast(0)

        // Health Connect may have caught up with steps we were temporarily adding
        // as live delta. Reset this to avoid double-counting old live steps.
        sensorBaseline = null
        latestSensorValue = null
        latestDisplayedSteps = healthConnectBaseline

        emitCurrentState()
    }

    private fun stopStepCounting() {
        if (isCounting) {
            sensorManager.unregisterListener(this)
            isCounting = false
        }

        sensorBaseline = null
        latestSensorValue = null
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

    companion object {
        const val ACTION_START = "expo.modules.stepcounter.START"
        const val ACTION_STOP = "expo.modules.stepcounter.STOP"
        const val ACTION_UPDATE_BASELINE = "expo.modules.stepcounter.UPDATE_BASELINE"

        const val EXTRA_HEALTH_CONNECT_BASELINE = "healthConnectBaseline"
    }
}
