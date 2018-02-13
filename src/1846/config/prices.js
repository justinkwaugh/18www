import _ from 'lodash';

const PriceList = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 112, 124, 137, 150, 165, 180, 195, 212, 230, 250, 270, 295, 320, 345, 375, 405, 475, 510, 550];

class Prices {

    constructor(definition) {

    }

    static getPriceList() {
        return PriceList;
    }

    static price(priceIndex) {
        return PriceList[priceIndex];
    }

    static leftPrice(priceIndex, count) {
        return PriceList[this.leftIndex(priceIndex, count)];
    }

    static leftIndex(priceIndex, count) {
        if(!_.isNumber(count)) {
            count = 1;
        }
        return Math.max(0, priceIndex-count)
    }

    static rightPrice(priceIndex, count) {
        return PriceList[this.rightIndex(priceIndex, count)];
    }

    static rightIndex(priceIndex, count) {
        if(!_.isNumber(count)) {
            count = 1;
        }
        return Math.min(PriceList.length -1, priceIndex+count);
    }


}

export default Prices;