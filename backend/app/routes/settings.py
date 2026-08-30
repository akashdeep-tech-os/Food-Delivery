from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.settings import AppSettings
from app.utils.dependencies import require_admin
from app.utils.exceptions import NotFoundException

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
def list_settings(db: Session = Depends(get_db), _=Depends(require_admin)):
    settings_list = db.query(AppSettings).all()
    return {s.key: {"value": s.value, "description": s.description} for s in settings_list}


@router.put("/{key}")
def update_setting(key: str, body: dict, db: Session = Depends(get_db), _=Depends(require_admin)):
    setting = db.query(AppSettings).filter(AppSettings.key == key).first()
    if not setting:
        setting = AppSettings(key=key, value=str(body.get("value", "")), description=body.get("description"))
        db.add(setting)
    else:
        setting.value = str(body.get("value", setting.value))
        if "description" in body:
            setting.description = body["description"]
    db.commit()
    return {"message": "Setting updated", "success": True}
