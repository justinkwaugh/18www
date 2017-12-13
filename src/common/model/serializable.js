import _ from 'lodash';
import ko from 'knockout';

const classRegistry = {};

class Serializable {
    serialize() {
        return JSON.stringify(this);
    }

    getTypeName() {
        return this.constructor.name;
    }

    toJSON() {
        const plainObject = _.toPlainObject(this);
        plainObject.className = this.getTypeName();
        _.each(plainObject, (value, key) => {
            if(ko.isObservable(value) && !ko.isComputed(value)) {
                plainObject[key] = value();
            }
        });
        return plainObject;
    }

    clone() {
        return Serializable.deserialize(this.serialize());
    }

    static deserialize(definition) {
        let objDefinition = _.isString(definition) ? JSON.parse(definition) : definition;
        let objClass = this;

        if(!_.isPlainObject(objDefinition)) {
            return objDefinition;
        }

        objDefinition = this.deserializeCollection(objDefinition);

        if(this.prototype.constructor.name === 'Serializable') {
            objClass = classRegistry[objDefinition.className];
        }

        if(!objClass) {
            throw Error('Attempt to deserialize unknown Serializable ' + objDefinition.className);
        }
        return new objClass(objDefinition);
    }

    static registerClass() {
        classRegistry[this.prototype.constructor.name] = this;
    }

    static deserializeCollection(obj) {
        _.each(obj, (value, keyOrIndex) => {
            if (_.isPlainObject(value) && value.className) {
                obj[keyOrIndex] = this.deserialize(value);
            }
            else if (_.isArray(value) || _.isPlainObject(value)) {
                this.deserializeCollection(value);
            }
        });

        return obj;
    }
}

export default Serializable