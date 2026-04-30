from importlib import import_module

_registry = {}


def load_active_modules(app):
    _try_load(app, 'moltiplicazioni')


def _try_load(app, module_id):
    try:
        mod = import_module(f'modules.{module_id}')
        bp  = mod.create_blueprint()
        app.register_blueprint(bp, url_prefix='/api/v1/modules/moltiplicazioni')
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


def is_registered(module_id):
    return _registry.get(module_id, {}).get('health') == 'registered'


def user_can_access_module(user_id, module_id):
    info = _registry.get(module_id)
    if not info or info['health'] != 'registered':
        return False
    if info['manifest'].get('free'):
        return True
    return False


def get_health():
    return {mid: {'health': v['health'], 'manifest': v.get('manifest')}
            for mid, v in _registry.items()}
