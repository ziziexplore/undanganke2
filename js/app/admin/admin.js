import { auth } from './auth.js';
import { navbar } from './navbar.js';
import { util } from '../../common/util.js';
import { dto } from '../../connection/dto.js';
import { theme } from '../../common/theme.js';
import { lang } from '../../common/language.js';
import { storage } from '../../common/storage.js';
import { session } from '../../common/session.js';
import { offline } from '../../common/offline.js';
import { comment } from '../components/comment.js';
import { request, HTTP_GET, HTTP_PATCH, HTTP_PUT } from '../../connection/request.js';

export const admin = (() => {

    /**
     * @returns {Promise<void>}
     */
    const getUserStats = () => auth.getDetailUser().then((res) => {

        util.safeInnerHTML(document.getElementById('dashboard-name'), `${util.escapeHtml(res.data.name)}<i class="fa-solid fa-hands text-warning ms-2"></i>`);
        document.getElementById('dashboard-email').textContent = res.data.email;
        document.getElementById('dashboard-accesskey').value = res.data.access_key;
        document.getElementById('button-copy-accesskey').setAttribute('data-copy', res.data.access_key);

        document.getElementById('form-name').value = util.escapeHtml(res.data.name);
        document.getElementById('form-timezone').value = res.data.tz;
        document.getElementById('filterBadWord').checked = Boolean(res.data.is_filter);
        document.getElementById('confettiAnimation').checked = Boolean(res.data.is_confetti_animation);
        document.getElementById('replyComment').checked = Boolean(res.data.can_reply);
        document.getElementById('editComment').checked = Boolean(res.data.can_edit);
        document.getElementById('deleteComment').checked = Boolean(res.data.can_delete);
        document.getElementById('dashboard-tenorkey').value = res.data.tenor_key;

        storage('config').set('tenor_key', res.data.tenor_key);

        request(HTTP_GET, '/api/stats').token(session.getToken()).send().then((resp) => {
            document.getElementById('count-comment').textContent = String(resp.data.comments).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-like').textContent = String(resp.data.likes).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-present').textContent = String(resp.data.present).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            document.getElementById('count-absent').textContent = String(resp.data.absent).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        });
    });

    /**
     * @param {HTMLElement} checkbox
     * @param {string} type
     * @returns {void}
     */
    const changeCheckboxValue = (checkbox, type) => {
        const label = util.disableCheckbox(checkbox);

        request(HTTP_PATCH, '/api/user')
            .token(session.getToken())
            .body({ [type]: checkbox.checked })
            .send()
            .finally(() => label.restore());
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const tenor = (button) => {
        const btn = util.disableButton(button);

        const form = document.getElementById('dashboard-tenorkey');
        form.disabled = true;

        request(HTTP_PATCH, '/api/user')
            .token(session.getToken())
            .body({ tenor_key: form.value.length ? form.value : null })
            .send()
            .then(() => alert(`success ${form.value.length ? 'add' : 'remove'} tenor key`))
            .finally(() => {
                form.disabled = false;
                btn.restore();
            });
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const regenerate = (button) => {
        if (!confirm('Are you sure?')) {
            return;
        }

        const btn = util.disableButton(button);

        request(HTTP_PUT, '/api/key')
            .token(session.getToken())
            .send(dto.statusResponse)
            .then((res) => {
                if (!res.data.status) {
                    return;
                }

                getUserStats();
            })
            .finally(() => btn.restore());
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const changePassword = (button) => {
        const old = document.getElementById('old_password');
        const newest = document.getElementById('new_password');

        if (old.value.length === 0 || newest.value.length === 0) {
            alert('Password cannot be empty');
            return;
        }

        old.disabled = true;
        newest.disabled = true;

        const btn = util.disableButton(button);

        request(HTTP_PATCH, '/api/user')
            .token(session.getToken())
            .body({
                old_password: old.value,
                new_password: newest.value,
            })
            .send(dto.statusResponse)
            .then((res) => {
                if (!res.data.status) {
                    return;
                }

                old.value = null;
                newest.value = null;
                alert('Success change password');
            })
            .finally(() => {
                btn.restore(true);

                old.disabled = false;
                newest.disabled = false;
            });
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const changeName = (button) => {
        const name = document.getElementById('form-name');

        if (name.value.length === 0) {
            alert('Name cannot be empty');
            return;
        }

        name.disabled = true;
        const btn = util.disableButton(button);

        request(HTTP_PATCH, '/api/user')
            .token(session.getToken())
            .body({ name: name.value })
            .send(dto.statusResponse)
            .then((res) => {
                if (!res.data.status) {
                    return;
                }

                util.safeInnerHTML(document.getElementById('dashboard-name'), `${util.escapeHtml(name.value)}<i class="fa-solid fa-hands text-warning ms-2"></i>`);
                alert('Success change name');
            })
            .finally(() => {
                name.disabled = false;
                btn.restore(true);
            });
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const download = (button) => {
        const btn = util.disableButton(button);
        request(HTTP_GET, '/api/download')
            .token(session.getToken())
            .withDownload('download', 'csv')
            .send()
            .finally(() => btn.restore());
    };

    /**
     * @returns {void}
     */
    const enableButtonName = () => {
        const btn = document.getElementById('button-change-name');
        if (btn.disabled) {
            btn.disabled = false;
        }
    };

    /**
     * @returns {void}
     */
    const enableButtonPassword = () => {
        const btn = document.getElementById('button-change-password');
        const old = document.getElementById('old_password');

        if (btn.disabled && old.value.length !== 0) {
            btn.disabled = false;
        }
    };

    /**
     * @param {HTMLFormElement} form 
     * @param {string|null} [query=null] 
     * @returns {void}
     */
    const openLists = (form, query = null) => {
        let timezones = Intl.supportedValuesOf('timeZone');
        const dropdown = document.getElementById('dropdown-tz-list');

        if (query && query.trim().length > 0) {
            const filtered = timezones.filter((tz) => tz.toLowerCase().includes(query.trim().toLowerCase()));
            if (filtered.length > 0) {
                timezones = filtered;
            }
        }

        if (query === null) {
            document.addEventListener('click', (e) => {
                if (!form.contains(e.target) && !dropdown.contains(e.target)) {
                    if (form.value.trim().length <= 0) {
                        form.setCustomValidity('Timezone cannot be empty.');
                        form.reportValidity();
                        return;
                    }

                    form.setCustomValidity('');
                    dropdown.classList.add('d-none');
                }
            }, { once: true, capture: true });
        }

        dropdown.replaceChildren();
        dropdown.classList.remove('d-none');
        timezones.slice(0, 20).forEach((tz, i) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action py-1 small';
            item.textContent = tz;
            item.onclick = () => {
                form.value = tz;
                dropdown.classList.add('d-none');
                document.getElementById('button-timezone').disabled = false;
            };
            dropdown.appendChild(item);
        });
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const changeTz = (button) => {
        const tz = document.getElementById('form-timezone');

        if (tz.value.length === 0) {
            alert('Time zone cannot be empty');
            return;
        }

        tz.disabled = true;
        const btn = util.disableButton(button);

        request(HTTP_PATCH, '/api/user')
            .token(session.getToken())
            .body({ tz: tz.value })
            .send(dto.statusResponse)
            .then((res) => {
                if (!res.data.status) {
                    return;
                }

                alert('Success change tz');
            })
            .finally(() => {
                tz.disabled = false;
                btn.restore(true);
            });
    };

    /**
     * @returns {void}
     */
    const logout = () => {
        if (!confirm('Are you sure?')) {
            return;
        }

        auth.clearSession();
    };

    /**
     * @returns {void}
     */
    const domLoaded = () => {
        lang.init();
        lang.setDefault('en');

        offline.init();
        theme.spyTop();

        const booted = () => getUserStats().then(() => {
            comment.init();
            comment.show();
        });

        document.addEventListener('hidden.bs.modal', booted);

        try {
            const raw = window.location.hash.slice(1);
            if (raw.length > 0) {
                session.setToken(raw);
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            const exp = session.decode()?.exp;
            if (!exp || exp < (Date.now() / 1000)) {
                throw new Error('Invalid token');
            }

            booted();
        } catch {
            auth.clearSession();
        }
    };

    /**
     * @returns {object}
     */
    const init = () => {
        auth.init();
        theme.init();
        session.init();

        if (!session.isAdmin()) {
            storage('owns').clear();
            storage('likes').clear();
            storage('config').clear();
            storage('comment').clear();
            storage('session').clear();
            storage('information').clear();
        }

        window.addEventListener('DOMContentLoaded', domLoaded);

        return {
            util,
            theme,
            comment,
            admin: {
                auth,
                navbar,
                logout,
                tenor,
                download,
                regenerate,
                changeName,
                changePassword,
                changeCheckboxValue,
                enableButtonName,
                enableButtonPassword,
                openLists,
                changeTz,
            },
        };
    };

    return {
        init,
    };
})();