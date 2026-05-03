from flask import request, jsonify
from database import get_db
from auth import optional_token
from . import MANIFEST, BADGES
from .game import (generate_explorer_session, generate_boss_battle,
                   generate_mission_session, generate_speedrun_session,
                   generate_galaxy_cup, score_session, build_reward_event,
                   LEVEL_ORDER)


def register(bp):

    @bp.route('/session/start', methods=['POST'])
    @optional_token
    def session_start(payload):
        data        = request.get_json() or {}
        mode        = data.get('mode', 'explorer')
        level       = int(data.get('level') or data.get('table') or 1)
        session_key = data.get('session_key', 'guest')
        user_id     = payload['sub'] if payload else None

        db = get_db()

        if mode == 'explorer':
            questions = generate_explorer_session(level)
        elif mode == 'boss_battle':
            questions = generate_boss_battle(level)
        elif mode == 'mission':
            questions = generate_mission_session(level)
        elif mode == 'speedrun':
            questions = generate_speedrun_session(level)
        elif mode == 'galaxy_cup':
            unlocked  = _get_unlocked(db, user_id, session_key)
            questions = generate_galaxy_cup(unlocked)
        else:
            return jsonify({'error': 'invalid_mode'}), 400

        db.execute(
            'INSERT INTO addi_sessions (user_id, session_key, mode, level) VALUES (?,?,?,?)',
            (user_id, session_key, mode, level)
        )
        db.commit()
        session_id = db.execute(
            'SELECT id FROM addi_sessions WHERE session_key=? ORDER BY id DESC LIMIT 1',
            (session_key,)
        ).fetchone()['id']

        client_questions = [
            {'id': i, 'addend_a': q['addend_a'], 'addend_b': q['addend_b']}
            for i, q in enumerate(questions)
        ]
        return jsonify({'session_id': session_id, 'questions': client_questions})

    @bp.route('/session/answer', methods=['POST'])
    @optional_token
    def session_answer(payload):
        data        = request.get_json() or {}
        session_id  = data.get('session_id')
        addend_a    = int(data.get('addend_a', 0))
        addend_b    = int(data.get('addend_b', 0))
        user_answer = data.get('user_answer')
        response_ms = int(data.get('response_ms', 0))
        user_id     = payload['sub'] if payload else None

        correct_ans = addend_a + addend_b
        is_correct  = (int(user_answer) == correct_ans) if user_answer is not None else False
        stars       = (3 if response_ms <= 5000 else 2) if is_correct else 1

        db = get_db()
        db.execute("""
            INSERT INTO addi_answers
                (session_id, addend_a, addend_b, correct_ans, user_ans, is_correct, response_ms)
            VALUES (?,?,?,?,?,?,?)
        """, (session_id, addend_a, addend_b, correct_ans,
              user_answer, int(is_correct), response_ms))
        db.execute("""
            UPDATE addi_sessions
            SET total_q = total_q + 1, correct_q = correct_q + ?
            WHERE id=?
        """, (int(is_correct), session_id))
        db.commit()

        return jsonify({
            'correct':      is_correct,
            'correct_ans':  correct_ans,
            'stars':        stars,
            'coins_earned': 2 if is_correct else 0,
            'xp_earned':    4 if is_correct else 0,
        })

    @bp.route('/session/finish', methods=['POST'])
    @optional_token
    def session_finish(payload):
        data        = request.get_json() or {}
        session_id  = data.get('session_id')
        session_key = data.get('session_key', 'guest')
        user_id     = payload['sub'] if payload else None

        db   = get_db()
        sess = db.execute('SELECT * FROM addi_sessions WHERE id=?', (session_id,)).fetchone()
        if not sess:
            return jsonify({'error': 'session_not_found'}), 404

        db.execute("UPDATE addi_sessions SET finished_at=datetime('now') WHERE id=?", (session_id,))
        db.commit()

        answers    = db.execute(
            'SELECT is_correct, response_ms FROM addi_answers WHERE session_id=? ORDER BY id',
            (session_id,)
        ).fetchall()
        answer_list = [dict(a) for a in answers]

        score          = score_session(answer_list)
        mode           = sess['mode']
        level          = sess['level']
        prev_unlocked  = _get_unlocked(db, user_id, session_key)
        reward         = build_reward_event(score, mode, level, prev_unlocked, answer_list)

        if mode == 'boss_battle':
            db.execute("""
                INSERT INTO addi_boss_battles (user_id, session_key, level, score_pct, passed)
                VALUES (?,?,?,?,?)
            """, (user_id, session_key, level, score['score_pct'], int(score['passed'])))
            db.commit()

        all_passed = db.execute("""
            SELECT COUNT(DISTINCT level) as n FROM addi_boss_battles
            WHERE passed=1 AND (user_id=? OR session_key=?)
        """, (user_id, session_key)).fetchone()['n']
        if all_passed >= 10:
            reward['badges_earned'].append('addizioni:galaxy_explorer')
            reward['badges_earned'] = list(set(reward['badges_earned']))

        if user_id:
            from routes.api import apply_reward_event
            apply_reward_event(user_id, reward)
            for bid in reward['badges_earned']:
                db.execute('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?,?)',
                           (user_id, bid))
            db.commit()

        return jsonify({
            'score':   score,
            'reward':  reward,
            'session_summary': {'mode': mode, 'level': level},
            'badge_names': {bid: BADGES.get(bid, bid) for bid in reward['badges_earned']},
        })

    @bp.route('/manifest')
    def manifest():
        return jsonify(MANIFEST)

    @bp.route('/stats')
    @optional_token
    def stats(payload):
        session_key = request.args.get('session_key', 'guest')
        user_id     = payload['sub'] if payload else None
        db          = get_db()
        rows        = db.execute("""
            SELECT level, SUM(total_q) as total, SUM(correct_q) as correct
            FROM addi_sessions
            WHERE (user_id=? OR session_key=?)
            GROUP BY level
        """, (user_id, session_key)).fetchall()
        result = {r['level']: {
            'total':    r['total'],
            'correct':  r['correct'],
            'accuracy': round(r['correct'] / r['total'] * 100, 1) if r['total'] else 0,
        } for r in rows}
        return jsonify({'stats': result})


def _get_unlocked(db, user_id, session_key):
    rows = db.execute("""
        SELECT DISTINCT level FROM addi_boss_battles
        WHERE passed=1 AND (user_id=? OR session_key=?)
    """, (user_id, session_key)).fetchall()
    return [r['level'] for r in rows]
