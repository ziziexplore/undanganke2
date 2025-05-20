export const progress = (() => {

    /**
     * @type {HTMLElement|null}
     */
    let info = null;

    /**
     * @type {HTMLElement|null}
     */
    let bar = null;

    let total = 0;
    let loaded = 0;
    let valid = true;

    /**
     * @type {Promise<void>|null}
     */
    let cancelProgress = null;

    /**
     * @returns {void}
     */
    const add = () => {
        total += 1;
    };

    /**
     * @returns {string}
     */
    const showInformation = () => {
        return `(${loaded}/${total}) [${parseInt((loaded / total) * 100).toFixed(0)}%]`;
    };

    /**
     * @param {string} type
     * @param {boolean} [skip=false]
     * @returns {void}
     */
    const complete = (type, skip = false) => {
        if (!valid) {
            return;
        }

        loaded += 1;
        info.innerText = `Loading ${type} ${skip ? 'skipped' : 'complete'} ${showInformation()}`;
        bar.style.width = Math.min((loaded / total) * 100, 100).toString() + '%';

        if (loaded === total) {
            document.dispatchEvent(new Event('progress.done'));
        }
    };

    /**
     * @param {string} type
     * @returns {void}
     */
    const invalid = (type) => {
        if (valid) {
            valid = false;
            bar.style.backgroundColor = 'red';
            info.innerText = `Error loading ${type} ${showInformation()}`;
            document.dispatchEvent(new Event('progress.invalid'));
        }
    };

    /**
     * @returns {Promise<void>|null}
     */
    const getAbort = () => cancelProgress;

    /**
     * @returns {void}
     */
    const init = () => {
        info = document.getElementById('progress-info');
        bar = document.getElementById('progress-bar');
        info.classList.remove('d-none');
        cancelProgress = new Promise((res) => document.addEventListener('progress.invalid', res));
    };

    return {
        init,
        add,
        invalid,
        complete,
        getAbort,
    };
})();