from flask import Blueprint

MANIFEST = {
    "id":           "addizioni",
    "name":         "Addizioni",
    "version":      "1.0.0",
    "free":         False,          # requires operator token activation
    "levels":       list(range(1, 11)),   # addend 1–10
    "game_modes":   ["explorer", "mission", "speedrun", "boss_battle", "galaxy_cup"],
    "ui_script":    "addizioni/game.js",
    "badge_prefix": "addizioni",
    "description":  "Padroneggia le addizioni con numeri fino a 20",
}

BADGES = {
    "addizioni:first_contact":   "Primo Contatto",
    "addizioni:master_p1":       "Maestro del +1",
    "addizioni:master_p2":       "Maestro del +2",
    "addizioni:master_p3":       "Maestro del +3",
    "addizioni:master_p4":       "Maestro del +4",
    "addizioni:master_p5":       "Maestro del +5",
    "addizioni:master_p6":       "Maestro del +6",
    "addizioni:master_p7":       "Maestro del +7",
    "addizioni:master_p8":       "Maestro del +8",
    "addizioni:master_p9":       "Maestro del +9",
    "addizioni:master_p10":      "Maestro del +10",
    "addizioni:galaxy_explorer": "Esploratore Galattico",
    "addizioni:perfect_session": "Sessione Perfetta",
    "addizioni:speed_demon":     "Demone della Velocità",
    "addizioni:seven_day_streak":"Striscia di 7 Giorni",
    "addizioni:perfect_mission": "Missione Perfetta",
}


def create_blueprint():
    bp = Blueprint('addizioni', __name__, url_prefix='/modules/addizioni')
    from . import routes
    routes.register(bp)
    return bp
