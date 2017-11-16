
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

    static leftPrice(priceIndex) {
        return PriceList[this.leftIndex(priceIndex)];
    }

    static rightPrice(priceIndex) {
        return PriceList[this.rightIndex(priceIndex)];
    }

    static rightIndex(priceIndex) {
        return Math.max(PriceList.length -1, priceIndex+1);
    }

    static leftIndex(priceIndex) {
        return Math.min(0, priceIndex-1)
    }
}

export default Prices;