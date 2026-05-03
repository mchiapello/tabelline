#!/usr/bin/env python3
"""
Generate and store an activation token for a non-free module.

Usage:
    python scripts/generate_token.py <module_id>

Example:
    python scripts/generate_token.py addizioni

The script:
  1. Generates a random UUID token (printed once — save it!)
  2. Hashes it with bcrypt
  3. Inserts/replaces the row in module_tokens (active=0 by default)
  4. Prints the curl command to activate it

After running this script, activate the module with:
    curl -X POST http://localhost:5002/api/v1/operator/modules/<id>/activate \\
         -H 'Content-Type: application/json' \\
         -d '{"token": "<plaintext_token>"}'
"""

import sys
import os
import uuid
import bcrypt
import sqlite3

# Resolve project root (one level up from scripts/)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB   = os.environ.get('DATABASE', os.path.join(ROOT, 'mathquest.db'))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    module_id = sys.argv[1].strip()

    # Generate token
    token      = str(uuid.uuid4())
    token_hash = bcrypt.hashpw(token.encode(), bcrypt.gensalt(rounds=12)).decode()

    # Store in DB
    conn = sqlite3.connect(DB)
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("""
        INSERT INTO module_tokens (module_id, token_hash, active, pending_restart)
        VALUES (?, ?, 0, 0)
        ON CONFLICT(module_id) DO UPDATE SET
            token_hash      = excluded.token_hash,
            active          = 0,
            pending_restart = 0
    """, (module_id, token_hash))
    conn.commit()
    conn.close()

    print()
    print(f"  Module:  {module_id}")
    print(f"  Token:   {token}")
    print()
    print("  ⚠️  Save this token — it cannot be recovered from the database.")
    print()
    print("  Activate with:")
    print(f'  curl -X POST http://localhost:5002/api/v1/operator/modules/{module_id}/activate \\')
    print(f'       -H \'Content-Type: application/json\' \\')
    print(f'       -d \'{{"token": "{token}"}}\'')
    print()


if __name__ == '__main__':
    main()
