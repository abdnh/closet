from typing import Union

from aqt import mw

from ..gui.settings import Settings

from .utils import occlude_shortcut, occlusion_behavior, max_height, AcceptBehaviors


def set_settings(
    shortcut: str,
    behavior: AcceptBehaviors,
    maxheight: int,
):
    occlude_shortcut.value = shortcut
    occlusion_behavior.value = behavior
    max_height.value = maxheight


def show_settings():
    dialog = Settings(mw, set_settings)

    dialog.setupUi(
        occlude_shortcut.value,
        occlusion_behavior.value,
        max_height.value,
    )
    return dialog.exec_()


def init_addon_manager():
    mw.addonManager.setConfigAction(__name__, show_settings)
