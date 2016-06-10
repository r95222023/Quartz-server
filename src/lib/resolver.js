var resolves = {},
    rejects = {};

function set(type, id, resolve, reject) {
    resolves[type] = resolves[type] || {};
    resolves[type][id] = resolve;

    rejects[type] = rejects[type] || {};
    rejects[type][id] = reject;
}

function get(type, id) {
    if (typeof resolves[type] !== 'object') return null;
    if (typeof rejects[type] !== 'object') return null;

    return [resolves[type][id] || null, rejects[type][id] || null];
}

function remove(type, id) {
    if (resolves[type]) delete resolves[type][id];
    if (rejects[type]) delete rejects[type][id];
}

function resolve(type, id, value) {
    if (resolves[type] && typeof resolves[type][id] === 'function') resolves[type][id](value);
}

function reject(type, id, error) {
    if (rejects[type] && typeof rejects[type][id] === 'function') rejects[type][id](error);
}

module.exports = {
    get: get,
    set: set,
    remove: remove,
    resolve: resolve,
    reject: reject
};