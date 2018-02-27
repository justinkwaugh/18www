import _ from 'lodash';
import LZString from 'lz-string'
import BrowserDetect from 'common/util/browserDetect';

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

    static storeCompressed(key, value, namespace) {
        const storage = LocalStore.getStorage();
        const compressed = BrowserDetect.isIE() ? LZString.compressToEncodedURIComponent() : LZString.compress(value);
        storage.setItem((namespace ? namespace + ':' + key : key), compressed);
    }

    static load(key, namespace) {
        const storage = LocalStore.getStorage();
        return storage.getItem((namespace ? namespace + ':' + key : key));
    }

    static loadCompressed(key, namespace) {
        const storage = LocalStore.getStorage();
        const item = storage.getItem((namespace ? namespace + ':' + key : key));
        const decompressed = BrowserDetect.isIE() ? LZString.decompressFromEncodedURIComponent() : LZString.decompress(item);
        return decompressed || item;
    }
}

export default LocalStore;