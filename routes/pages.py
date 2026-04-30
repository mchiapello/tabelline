from flask import Blueprint, render_template, request

pages_bp = Blueprint('pages', __name__)


@pages_bp.route('/')
def landing():
    return render_template('landing.html')


@pages_bp.route('/journey')
def journey():
    return render_template('journey.html')


@pages_bp.route('/game')
def game():
    mode  = request.args.get('mode', 'explorer')
    table = request.args.get('table', '2')
    return render_template('game.html', mode=mode, table=table)


@pages_bp.route('/profile')
def profile():
    return render_template('profile.html')


@pages_bp.route('/auth/login')
def auth_login():
    return render_template('auth/login.html')


@pages_bp.route('/auth/register')
def auth_register():
    return render_template('auth/register.html')


# ── Legacy routes (Italian verbs section) ────────────────────────────────────
@pages_bp.route('/matematica')
def matematica():
    return render_template('matematica_landing.html')


@pages_bp.route('/matematica/addizioni')
def matematica_addizioni():
    return render_template('addizioni.html')


@pages_bp.route('/matematica/sottrazioni')
def matematica_sottrazioni():
    return render_template('sottrazioni.html')


@pages_bp.route('/matematica/moltiplicazioni')
def matematica_moltiplicazioni():
    return render_template('index.html')


@pages_bp.route('/italiano')
def italiano():
    return render_template('italiano.html')


@pages_bp.route('/italiano/verbi')
def italiano_verbi():
    return render_template('italiano/verbi.html')
