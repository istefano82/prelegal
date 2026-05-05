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


class ValidationError(Exception):
    """Raised when domain-level validation fails."""

    def __init__(self, message: str, field: str | None = None):
        self.message = message
        self.field = field
        super().__init__(message)


class NotFoundError(Exception):
    """Raised when a resource cannot be found."""

    def __init__(self, resource: str, resource_id: str):
        self.message = f"{resource} '{resource_id}' not found"
        self.resource = resource
        self.resource_id = resource_id
        super().__init__(self.message)


class WeakPasswordError(ValidationError):
    """Raised when password does not meet strength requirements."""

    pass
