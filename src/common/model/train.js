import short from 'short-uuid';
import Serializable from 'common/model/serializable';
import Route from 'common/model/route';
import TrainDefinitions from '1846/config/trainDefinitions';

class Train extends Serializable{
    constructor(data) {
        super();
        data = data || {};
        this.id = data.id || short().new();
        this.type = data.type;
        this.lastRoute = data.lastRoute;
        this.route = data.route || new Route({trainType: this.type, color: 1, companyId: data.companyId});
        this.purchased = data.purchased;
        this.phasedOut = data.phasedOut;
    }
    getName() {
        return TrainDefinitions[this.type].name;
    }
}

Train.registerClass();

export default Train;