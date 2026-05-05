class AuthError(Exception):
    """Raised when authentication fails."""

    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class OwnershipError(Exception):
    """Raised when a user tries to access a resource they do not own."""

    def __init__(self, message: str = "Access denied"):
        self.message = message
        super().__init__(message)
