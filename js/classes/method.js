var Method = function () {
    /**
     *  @param _t float - current time
     *  @param _tStep float - step of time grid (some number from begin conditions)
     *  @param _gamma float[] - array of unknown intensity in each point of grid
     *  @param _gammaW [float[],..] - array of unknown intensity in each wind point
     *  @param _xy0 [{float, float}[]] - array of initial points for contour
     *  @param _xyAngular int[] - array of indexes for angular initial points for contour
     *  @param _xyGammaW [{float, float}[][]] - array of moved angular initial points for contour
     *  @param _eps float - max distance for neighbors points of contour
     */
    var _t,
        _tStep = 0.1,
        _gamma = [],
        _gammaW = [],
        _xy0 = [],
        _xyAngular = [],
        _xyGammaW = [],
        _eps = 0;



    /**
     *  normal(x{k}, y{k})
     *  @param index int
     *  @return float[]
     *  @private
     */
    var _normal = function (index) {
        xy0k = xy0[index];
        xy0k1 = xy0[index + 1];

        var divisor = Math.sqrt(Math.pow((xy0k1[0] - xy0k[0]), 2) + Math.pow((xy0k1[1] - xy0k[1]), 2));

        return [
            -(xy0k1[1] - xy0k[1]) / divisor,
            (xy0k1[0] - xy0k[0]) / divisor
        ];
    };

    /**
     *  v[k](x{n-2},y{n-2})
     *  @param indexGamma int
     *  @param x float
     *  @param y float
     *  @return float[]
     */
    var _speedVector = function (indexGamma, x, y) {
        var divisor = Math.max(
            _eps,
            Math.sqrt(Math.pow((x - xy0[indexGamma][0]), 2) + Math.pow((y - xy0[indexGamma][1]), 2))
        );

        divisor *= divisor;

        return [
            1 / (2 * Math.PI) * (xy0[indexGamma][1] - y) / divisor,
            1 / (2 * Math.PI) * (x - xy0[indexGamma][0]) / divisor
        ];
    };

    /**
     *  v(x{n-2},y{n-2}, gammaW[0], gammaW[1])
     *  @param indexGammaW int
     *  @param x float
     *  @param y float
     *  @return float[]
     */
    var _speedVectorW = function (indexGammaW, x, y) {
        var divisor = Math.max(
            _eps,
            Math.sqrt(Math.pow((x - xyGammaW[indexGammaW][0]), 2) + Math.pow((y - xyGammaW[indexGammaW][1]), 2))
        );

        divisor *= divisor;

        return [
            1 / (2 * Math.PI) * (xyGammaW[indexGammaW][1] - y) / divisor,
            1 / (2 * Math.PI) * (x - xyGammaW[indexGammaW][0]) / divisor
        ];
    };
};
