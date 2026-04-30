from flask import Blueprint

MANIFEST = {
    "id":           "moltiplicazioni",
    "name":         "Moltiplicazioni",
    "version":      "1.0.0",
    "free":         True,
    "tables":       list(range(2, 11)),
    "game_modes":   ["explorer", "mission", "speedrun", "boss_battle", "galaxy_cup"],
    "ui_script":    "moltiplicazioni/game.js",
    "badge_prefix": "moltiplicazioni",
}

BADGES = {
    "moltiplicazioni:first_contact":  "Primo Contatto",
    "moltiplicazioni:master_x2":      "Maestro del ×2",
    "moltiplicazioni:master_x5":      "Maestro del ×5",
    "moltiplicazioni:master_x10":     "Maestro del ×10",
    "moltiplicazioni:master_x3":      "Maestro del ×3",
    "moltiplicazioni:master_x4":      "Maestro del ×4",
    "moltiplicazioni:master_x6":      "Maestro del ×6",
    "moltiplicazioni:master_x9":      "Maestro del ×9",
    "moltiplicazioni:master_x7":      "Maestro del ×7",
    "moltiplicazioni:master_x8":      "Maestro del ×8",
    "moltiplicazioni:galaxy_explorer": "Esploratore Galattico",
    "moltiplicazioni:perfect_session": "Sessione Perfetta",
    "moltiplicazioni:speed_demon":     "Demone della Velocità",
    "moltiplicazioni:comeback_kid":    "Comeback Kid",
    "moltiplicazioni:seven_day_streak": "Striscia di 7 Giorni",
    "moltiplicazioni:perfect_mission": "Missione Perfetta",
}


def create_blueprint():
    bp = Blueprint('moltiplicazioni', __name__, url_prefix='/modules/moltiplicazioni')
    from . import routes
    routes.register(bp)
    return bp
