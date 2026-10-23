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
    mode       = request.args.get('mode', 'explorer')
    table      = request.args.get('table', '2')
    tables_raw = request.args.get('tables', '')
    tables     = [int(t) for t in tables_raw.split(',') if t.strip().isdigit()] or [int(table)]
    num        = request.args.get('num', '10')
    timer      = request.args.get('timer', '0')
    facilitato = request.args.get('facilitato', '0')
    return render_template('game.html', mode=mode, table=table, tables=tables,
                            num=num, timer=timer, facilitato=facilitato)


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
