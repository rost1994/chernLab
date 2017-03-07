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
     *  @param _borderIntersectCallback closure -  function that "returns" point inside contour or "move" to some distance
     *  @param _leftSide float[][] - matrix of system's right sides
     *  @param _rightSide float[] - array of system's left sides
     */
    var _t = 0,
        _tStep = 0.1,
        _gamma = [],
        _gammaW = [],
        _xy0 = [],
        _xyAngular = [],
        _xyGammaW = [],
        _eps = 0,
        _xy,
        _borderIntersectCallback,
        _leftSide = [],
        _rightSide = [];

    /**
     * @param xy0 Object[]
     * @param xyAngular int[]
     * @param eps float
     * @param borderIntersectCallback closure
     */
    this.initialize = function (xy0, xyAngular, eps, borderIntersectCallback) {
        _xy0 = xy0;
        _xyAngular = xyAngular;
        _eps = eps;
        _borderIntersectCallback = borderIntersectCallback;

        _xy = function (index) {
            if (index < 0 || index >= _xy0.length - 1 || !_xy0[index] || !_xy0[index + 1]) {
                throw new Error('Non-existent index!');
            }

            return {
                x: (_xy0[index].x + _xy0[index + 1].x) / 2,
                y: (_xy0[index].y + _xy0[index + 1].y) / 2
            };
        };
    };

    /**
     * Processes one step of method
     */
    this.evaluate = function () {
        // Calculate tStep, fill gammaW, etc.
        if (_t !== 0) {
            _dataPrepare();
        }

        // Let's recalculate coordinates of gammaW points
        _processGammaWCoordinates();

        // Let's get matrix of left sides and array of right sides:
        if (_leftSide.length === 0) {
            _getLeftSide();
        }

        _getRightSide();

        var gauss = new Gauss(_leftSide, _rightSide);
        _gamma = gauss.solve();
    };

    /**
     *  normal(x{k}, y{k})
     *  @param index int
     *  @return Object
     *  @private
     */
    var _normal = function (index) {
        var xy0k = _xy0[index],
            xy0k1 = _xy0[index + 1];

        var divisor = Math.sqrt(Math.pow((xy0k1[0] - xy0k[0]), 2) + Math.pow((xy0k1[1] - xy0k[1]), 2));

        return {
            x: -(xy0k1[1] - xy0k[1]) / divisor,
            y: (xy0k1[0] - xy0k[0]) / divisor
        };
    };

    /**
     *  v[k](x{n-2},y{n-2})
     *  @param indexGamma int
     *  @param x float
     *  @param y float
     *  @return Object
     */
    var _speedVector = function (indexGamma, x, y) {
        var divisor = Math.max(
            _eps,
            Math.sqrt(Math.pow((x - _xy0[indexGamma].x), 2) + Math.pow((y - _xy0[indexGamma].y), 2))
        );

        divisor *= divisor;

        return {
            x: 1 / (2 * Math.PI) * (_xy0[indexGamma].y - y) / divisor,
            y: 1 / (2 * Math.PI) * (x - _xy0[indexGamma].x) / divisor
        };
    };

    /**
     *  v(x{n-2},y{n-2}, gammaW[0], gammaW[1])
     *  @param indexGammaW int
     *  @param x float
     *  @param y float
     *  @return Object
     */
    var _speedVectorW = function (indexGammaW, x, y) {
        var divisor = Math.max(
            _eps,
            Math.sqrt(Math.pow((x - _xyGammaW[indexGammaW].x), 2) + Math.pow((y - _xyGammaW[indexGammaW].y), 2))
        );

        divisor *= divisor;

        return {
            x: 1 / (2 * Math.PI) * (_xyGammaW[indexGammaW].y - y) / divisor,
            y: 1 / (2 * Math.PI) * (x - _xyGammaW[indexGammaW].x) / divisor
        };
    };

    /**
     * @private
     */
    var _processGammaWCoordinates = function () {
        for (var i = 0; i < _gammaW.length; ++i) {
            var vT = _getPointSpeed(_xyGammaW[i].x, _xyGammaW[i].y);

            var xyGammaTemp = [
                xyGammaW[i].x + _tStep * vT.x,
                xyGammaW[i].y + _tStep * vT.y
            ];

            xyGammaW[i] = _borderIntersectCallback(xyGammaW[i], xyGammaTemp);
        }
    };

    /**
     * @param x float
     * @param y float
     * @return Object
     * @private
     */
    var _getPointSpeed = function (x, y) {
        // var z = {
        //     x: vInf[0],
        //     y: vInf[1]
        // };
        // TODO: VInf was at this place
        var z = {
                x: 0,
                y: 0
            },
            temp;

        for (var k = 0; k < _gamma.length; ++k) {
            temp = _speedVector(k, x, y);
            z.x += temp.x * gamma[k];
            z.y += temp.y * gamma[k];
        }

        for (k = 0; k < _gammaW.length; ++k) {
            temp = _speedVectorW(k, x, y);
            z.x += temp.x * gammaW[k];
            z.y += temp.y * gammaW[k];
        }

        return z;
    };

    /**
     * Let's get matrix of left sides and array of right sides
     * @private
     */
    var _getLeftSide = function () {
        var j = 0;
        _leftSide = [];

        for (var i = 0; i < _xy0.length - 1; ++i) {
            var normalTemp = _normal(i);
            _leftSide[i] = [];

            for (j = 0; j < _xy0.length; ++j) {
                var xyTemp = _xy(i),
                    vTemp = _speedVector(j, xyTemp.x, xyTemp.y);
                _leftSide[i][j] = vTemp.x * normalTemp.x + vTemp.y * normalTemp.y;
            }
        }

        _leftSide[_xy0.length - 1] = [];
        for (j = 0; j < _xy0.length; ++j) {
            _leftSide[_xy0.length - 1][j] = 1;
        }
    };

    /**
     * @private
     */
    var _getRightSide = function () {
        var j = 0;

        _rightSide = [];

        for (var i = 0; i < _xy0.length - 1; ++i) {
            var normalTemp = _normal(i);
            // rightSide[i] = -(vInf[0] * normalTemp[0] + vInf[1] * normalTemp[1]);
            // TODO: VInf was there
            _rightSide[i] = -(normalTemp.x + normalTemp.y);

            for (j = 0; j < _gammaW.length; ++j) {
                var vectorW = _speedVectorW(j, _xy0[i].x, _xy0[i].y);
                _rightSide[i] -= _gammaW[j] * (vectorW.x * normalTemp.x + vectorW.y * normalTemp.y);
            }
        }

        // TODO: gammaInf was there
        // _rightSide[_xy0.length - 1] = gammaInf;
        _rightSide[_xy0.length - 1] = 0;
        for (j = 0; j < _gammaW.length; ++j) {
            _rightSide[_xy0.length - 1] -= _gammaW[j];
        }
    };

    /**
     * @private
     */
    var _dataPrepare = function () {
        var angularSpeed = [],
            i;

        for(i = 0; i < _xyAngular.length; ++i) {
            angularSpeed.push(_getPointSpeed(_xy0[_xyAngular[i]].x, _xy0[_xyAngular[i]].y));
        }

        angularSpeed.forEach(function (item, index, array) {
            array[index] = Math.sqrt(Math.pow(item[0], 2) + Math.pow(item[1], 2));
        });

        var maxSpeed = Math.max.apply(Math, angularSpeed);

        _tStep = _eps / maxSpeed;

        _t += _tStep;
        for (i = 0; i < _xyAngular.length; ++i) {
            _gammaW.push(_gamma[_xyAngular[i]]);
            _xyGammaW.push({
                x: _xy0[_xyAngular[i]].x,
                y: _xy0[_xyAngular[i]].y
            });
        }
    };
};
