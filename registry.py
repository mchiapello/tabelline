from importlib import import_module

_registry = {}

# Modules to load at startup — add new modules here
_MODULES = ['moltiplicazioni', 'addizioni']


def load_active_modules(app):
    for module_id in _MODULES:
        _try_load(app, module_id)


def _try_load(app, module_id):
    try:
        mod = import_module(f'modules.{module_id}')
        bp  = mod.create_blueprint()
        app.register_blueprint(bp, url_prefix=f'/api/v1/modules/{module_id}')
        _registry[module_id] = {
            'blueprint': bp,
            'manifest':  mod.MANIFEST,
            'health':    'registered',
        }
        app.logger.info(f'Module {module_id} loaded OK')
    except Exception as e:
        _registry[module_id] = {
            'blueprint': None,
            'manifest':  None,
            'health':    'broken',
            'error':     str(e),
        }
        app.logger.error(f'Module {module_id} failed to load: {e}')


def is_registered(module_id: str) -> bool:
    return _registry.get(module_id, {}).get('health') == 'registered'


def is_activated(module_id: str) -> bool:
    """
    Layer 2 check: is there an active token row in module_tokens for this module?
    Free modules skip this check.
    """
    info = _registry.get(module_id)
    if not info or info['health'] != 'registered':
        return False
    if info['manifest'].get('free'):
        return True     # free modules are always activated

    # Non-free: require an active row in module_tokens
    try:
        from database import get_connection
        conn = get_connection()
        row  = conn.execute(
            'SELECT active FROM module_tokens WHERE module_id=? AND active=1',
            (module_id,)
        ).fetchone()
        conn.close()
        return bool(row)
    except Exception:
        return False


def user_can_access_module(user_id, module_id: str) -> bool:
    """Full 3-layer check. Layer 3 (user assignment) is a future extension."""
    # Layer 1: registered and healthy
    if not is_registered(module_id):
        return False
    # Layer 2: activated (token in DB for non-free modules)
    if not is_activated(module_id):
        return False
    # Layer 3: user assignment — not yet implemented, always passes
    return True


def get_health():
    result = {}
    for mid, v in _registry.items():
        result[mid] = {
            'health':    v['health'],
            'manifest':  v.get('manifest'),
            'activated': is_activated(mid),
            'error':     v.get('error'),
        }
    return result
