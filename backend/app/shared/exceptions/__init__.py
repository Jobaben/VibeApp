"""Custom exceptions for the application."""


class NotFoundException(Exception):
    """Exception raised when a resource is not found."""
    def __init__(self, resource: str, identifier: str):
        self.message = f"{resource} with identifier '{identifier}' was not found."
        super().__init__(self.message)


class ValidationException(Exception):
    """Exception raised when validation fails."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class UnauthorizedException(Exception):
    """Exception raised when user is not authorized."""
    def __init__(self, message: str = "Unauthorized access"):
        self.message = message
        super().__init__(self.message)


class ForbiddenException(Exception):
    """Exception raised when user doesn't have permission."""
    def __init__(self, message: str = "Access forbidden"):
        self.message = message
        super().__init__(self.message)
