package expo.modules.liftlogupdater

import expo.modules.kotlin.exception.CodedException

internal class UpdaterException(code: String, message: String, cause: Throwable? = null) :
  CodedException(code, message, cause)
