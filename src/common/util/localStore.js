import _ from 'lodash';

class LocalStore {

    static getStorage() {
        return (typeof window !== 'undefined' ? window : global).localStorage;
    }

    static list(namespace) {
        const storage = LocalStore.getStorage();
        return _(_.range(0, storage.length)).map(index=> {
            const key = storage.key(index);
            if(!namespace || _.startsWith(key, namespace)){
                return storage.getItem(key);
            }
        }).compact().value();
    }

    static store(key, value, namespace) {
        const storage = LocalStore.getStorage();
        storage.setItem((namespace ? namespace + ':' + key : key), value);
    }

    static load(key, namespace) {
        const storage = LocalStore.getStorage();
        return storage.getItem((namespace ? namespace + ':' + key : key));
    }
}

export default LocalStore;