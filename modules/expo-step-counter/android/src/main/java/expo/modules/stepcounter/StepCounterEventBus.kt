package expo.modules.stepcounter

data class StepCounterEvent(
        val steps: Int,
        val healthConnectBaseline: Int,
        val liveDelta: Int,
        val sensorValue: Float?
)

object StepCounterEventBus {
    private var stepCountChangedListener: ((StepCounterEvent) -> Unit)? = null
    private var errorListener: ((String) -> Unit)? = null

    fun setStepCountChangedListener(callback: ((StepCounterEvent) -> Unit)?) {
        stepCountChangedListener = callback
    }

    fun setErrorListener(callback: ((String) -> Unit)?) {
        errorListener = callback
    }

    fun emitStepCountChanged(event: StepCounterEvent) {
        stepCountChangedListener?.invoke(event)
    }

    fun emitError(message: String) {
        errorListener?.invoke(message)
    }
}
