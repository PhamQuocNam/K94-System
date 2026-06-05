"""Logging configuration using Loguru."""

import os
import sys
from pathlib import Path
from typing import Literal

from loguru import logger

# Remove default handler
logger.remove()

# Log levels
LogLevel = Literal["TRACE", "DEBUG", "INFO", "SUCCESS", "WARNING", "ERROR", "CRITICAL"]

# Get log level from environment or default to INFO
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Console log format with colors
CONSOLE_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)

# File log format (no colors)
FILE_FORMAT = (
    "{time:YYYY-MM-DD HH:mm:ss} | "
    "{level: <8} | "
    "{name}:{function}:{line} | "
    "{message}"
)


def setup_logging(
    log_level: str = LOG_LEVEL,
    log_file: str | None = None,
    rotation: str = "500 MB",
    retention: str = "30 days",
    compression: str = "zip",
) -> None:
    """Set up logging with console and optional file handlers.

    Args:
        log_level: Minimum log level (TRACE, DEBUG, INFO, SUCCESS, WARNING, ERROR, CRITICAL)
        log_file: Path to log file. If None, only console logging is enabled.
        rotation: Log file rotation size (e.g., "500 MB", "10:00", "weekly")
        retention: How long to keep logs (e.g., "30 days", "1 week", "6 months")
        compression: Compression format for rotated logs (zip, gz, tar)
    """
    # Ensure log level is uppercase
    log_level = log_level.upper() if log_level else "INFO"

    # Console handler with colors
    logger.add(
        sys.stderr,
        format=CONSOLE_FORMAT,
        level=log_level,
        colorize=True,
        backtrace=True,
        diagnose=True,
    )

    # File handler (optional)
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        logger.add(
            log_path,
            format=FILE_FORMAT,
            level=log_level,
            rotation=rotation,
            retention=retention,
            compression=compression,
            backtrace=True,
            diagnose=True,
        )


def get_logger(name: str | None = None):
    """Get a logger instance.

    Args:
        name: Logger name (typically __name__ from calling module)

    Returns:
        Logger instance
    """
    if name:
        return logger.bind(name=name)
    return logger


# Export the logger
__all__ = ["logger", "setup_logging", "get_logger", "LOG_LEVEL"]
