const API = (() => {
    const BASE = '/api/v1';

    function getToken() {
        return localStorage.getItem('mq_access_token');
    }

    async function request(method, path, body = null) {
        const headers = { 'Content-Type': 'application/json' };
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(BASE + path, opts);

        if (res.status === 401) {
            const refreshed = await tryRefresh();
            if (refreshed) return request(method, path, body);
            window.dispatchEvent(new CustomEvent('mq:auth-expired'));
            throw new Error('auth_expired');
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw Object.assign(new Error(err.error || 'request_failed'), { status: res.status, body: err });
        }

        return res.json();
    }

    async function tryRefresh() {
        const rt = localStorage.getItem('mq_refresh_token');
        if (!rt) return false;
        try {
            const res = await fetch(BASE + '/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: rt })
            });
            if (!res.ok) return false;
            const data = await res.json();
            localStorage.setItem('mq_access_token', data.access_token);
            return true;
        } catch {
            return false;
        }
    }

    return {
        get:    (path)       => request('GET',    path),
        post:   (path, body) => request('POST',   path, body),
        put:    (path, body) => request('PUT',    path, body),
        delete: (path)       => request('DELETE', path),
    };
})();
