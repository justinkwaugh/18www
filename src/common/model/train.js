import short from 'short-uuid';
import Serializable from 'common/model/serializable';
import Route from 'common/model/route';

class Train extends Serializable{
    constructor(data) {
        super();
        data = data || {};
        this.id = data.id || short().new();
        this.type = data.type;
        this.lastRoute = data.lastRoute;
        this.route = data.route || new Route({trainType: this.type});
        this.phasedOut = data.phasedOut;
    }
}

Train.registerClass();

export default Train;