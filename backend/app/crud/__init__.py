"""CRUD operations package."""

# Re-export for backward compatibility
from app.crud.character import (
    create_character,
    delete_character,
    get_characters_by_storyboard,
    update_character,
)
from app.crud.helpers import get_owned_project, get_owned_storyboard
from app.crud.item import (
    create_item,
    delete_item,
    get_item_by_id,
    get_items_by_owner,
    update_item,
)
from app.crud.project import (
    create_project,
    delete_project,
    get_project_by_id,
    get_projects_by_user,
    update_project,
)
from app.crud.scene import (
    create_scene,
    delete_scene,
    get_scenes_by_storyboard,
    update_scene,
)
from app.crud.setting import (
    create_setting,
    delete_setting,
    get_settings_by_storyboard,
    update_setting,
)
from app.crud.storyboard import (
    create_storyboard,
    delete_storyboard,
    delete_storyboard_analysis,
    get_storyboard_by_id,
    get_storyboard_by_project,
    update_storyboard,
)
from app.crud.user import (
    authenticate,
    create_user,
    get_user_by_email,
    update_user,
)

__all__ = [
    # User CRUD
    "create_user",
    "update_user",
    "get_user_by_email",
    "authenticate",
    # Item CRUD
    "create_item",
    "get_item_by_id",
    "get_items_by_owner",
    "update_item",
    "delete_item",
    # Project CRUD
    "create_project",
    "get_project_by_id",
    "get_projects_by_user",
    "update_project",
    "delete_project",
    # StoryBoard CRUD
    "create_storyboard",
    "get_storyboard_by_id",
    "get_storyboard_by_project",
    "update_storyboard",
    "delete_storyboard",
    "delete_storyboard_analysis",
    # Character CRUD
    "create_character",
    "get_characters_by_storyboard",
    "update_character",
    "delete_character",
    # Setting CRUD
    "create_setting",
    "get_settings_by_storyboard",
    "update_setting",
    "delete_setting",
    # Scene CRUD
    "create_scene",
    "get_scenes_by_storyboard",
    "update_scene",
    "delete_scene",
    # Helpers
    "get_owned_project",
    "get_owned_storyboard",
]
