package expo.modules.stepcounter

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorManager
import android.os.Build
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoStepCounterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoStepCounter")

    Events("onStepCountChanged", "onStepCounterError")

    Function("start") { healthConnectBaseline: Int ->
      val context =
              appContext.reactContext
                      ?: throw IllegalStateException("React context is not available")

      val intent =
              Intent(context, StepCounterService::class.java).apply {
                action = StepCounterService.ACTION_START
                putExtra(StepCounterService.EXTRA_HEALTH_CONNECT_BASELINE, healthConnectBaseline)
              }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    Function("stop") {
      val context =
              appContext.reactContext
                      ?: throw IllegalStateException("React context is not available")

      val intent =
              Intent(context, StepCounterService::class.java).apply {
                action = StepCounterService.ACTION_STOP
              }

      context.startService(intent)
    }

    Function("updateBaseline") { healthConnectBaseline: Int ->
      val context =
              appContext.reactContext
                      ?: throw IllegalStateException("React context is not available")

      val intent =
              Intent(context, StepCounterService::class.java).apply {
                action = StepCounterService.ACTION_UPDATE_BASELINE
                putExtra(StepCounterService.EXTRA_HEALTH_CONNECT_BASELINE, healthConnectBaseline)
              }

      context.startService(intent)
    }

    Function("isStepCounterAvailable") {
      val context =
              appContext.reactContext
                      ?: throw IllegalStateException("React context is not available")

      val sensorManager = context.getSystemService(SensorManager::class.java)

      sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null
    }

    Function("hasActivityRecognitionPermission") {
      val context =
              appContext.reactContext
                      ?: throw IllegalStateException("React context is not available")

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        true
      } else {
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACTIVITY_RECOGNITION) ==
                PackageManager.PERMISSION_GRANTED
      }
    }

    OnStartObserving {
      StepCounterEventBus.setStepCountChangedListener { event ->
        sendEvent(
                "onStepCountChanged",
                mapOf(
                        "steps" to event.steps,
                        "healthConnectBaseline" to event.healthConnectBaseline,
                        "liveDelta" to event.liveDelta,
                        "sensorValue" to event.sensorValue
                )
        )
      }

      StepCounterEventBus.setErrorListener { message ->
        sendEvent("onStepCounterError", mapOf("message" to message))
      }
    }

    OnStopObserving {
      StepCounterEventBus.setStepCountChangedListener(null)
      StepCounterEventBus.setErrorListener(null)
    }
  }
}
