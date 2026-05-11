"""Module-level slowapi limiter, shared between main.py and feature routers."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
