
class Train {
    constructor(data) {
        data = data || {};
        this.id = data.id;
        this.name = data.name;
        this.stops = data.stops;
        this.payingStops = data.payingStops;
        this.phasedOut = data.phasedOut;
    }
}

export default Train;