
class BrowserDetect {
    static supportTouch() {
        return /(iphone|ipod|ipad|android|iemobile|blackberry|bada)/.test(window.navigator.userAgent.toLowerCase());
    }

}

export default BrowserDetect