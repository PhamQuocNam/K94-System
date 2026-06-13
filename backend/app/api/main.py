from fastapi import APIRouter

from app.api.routes import (
    characters,
    items,
    login,
    private,
    projects,
    scenes,
    settings as settings_routes,
    storyboard,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(projects.router)
api_router.include_router(storyboard.router)
api_router.include_router(characters.router)
api_router.include_router(settings_routes.router)
api_router.include_router(scenes.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
