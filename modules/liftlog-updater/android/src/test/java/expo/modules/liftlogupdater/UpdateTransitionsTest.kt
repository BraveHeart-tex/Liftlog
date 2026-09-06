package expo.modules.liftlogupdater

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class UpdateTransitionsTest {
  @Test
  fun `installed requested version wins over stale installer state`() {
    assertEquals(
      UpdateStage.SUCCEEDED,
      UpdateTransitions.reconciledStage(UpdateStage.COMMITTED, 8, 8, false)
    )
  }

  @Test
  fun `committed attempt remains live while installer session exists`() {
    assertEquals(
      UpdateStage.COMMITTED,
      UpdateTransitions.reconciledStage(UpdateStage.COMMITTED, 7, 8, true)
    )
  }

  @Test
  fun `missing committed session fails instead of creating a duplicate`() {
    assertEquals(
      UpdateStage.FAILED,
      UpdateTransitions.reconciledStage(UpdateStage.COMMITTED, 7, 8, false)
    )
  }

  @Test
  fun `callback identity requires the durable attempt and session`() {
    assertTrue(UpdateTransitions.acceptsCallback("attempt-a", 42, "attempt-a", 42))
    assertFalse(UpdateTransitions.acceptsCallback("attempt-a", 42, "attempt-b", 42))
    assertFalse(UpdateTransitions.acceptsCallback("attempt-a", 42, "attempt-a", 41))
  }
}
