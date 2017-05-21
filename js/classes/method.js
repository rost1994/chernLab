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
     *  @param _borderIntersectCallback closure -  function that "returns" point
     *  inside contour or "move" to some distance
     *  @param _leftSide float[][] - matrix of system's right sides
     *  @param _rightSide float[] - array of system's left sides
     *  @param _gammaInf float - circulation (some number from begin conditions)
     *  @param _vWhistle {float, float} - initial speed of whistle (some number from begin conditions)
     *  @param _whistleIndexes integer[] - indexes of whistle
     */
    var _t = false,
        _tStep = 0.1,
        _gamma = [],
        _gammaOld = [],
        _gammaW = [],
        _xy0 = [],
        _xyAngular = [],
        _xyGammaW = [],
        _eps = 0,
        _xy,
        _borderIntersectCallback,
        _leftSide = [],
        _rightSide = [],
        _gammaInf = 0,
        _vWhistle = {
            x: 0,
            y: 0
        },
        _whistleIndexes = [];

    /**
     * @param xy0 Object[]
     * @param xyAngular int[]
     * @param eps float
     * @param gammaInf float
     * @param vWhistle object
     * @param whistleIndexes integer[]
     * @param borderIntersectCallback closure
     */
    this.initialize = function (xy0, xyAngular, eps, gammaInf, vWhistle, whistleIndexes, borderIntersectCallback) {
        _xy0 = xy0;
        _xyAngular = xyAngular;
        _eps = eps;
        _gammaInf = gammaInf || _gammaInf;
        _vWhistle = vWhistle;
        _whistleIndexes = whistleIndexes;
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
        if (_t !== false) {
            _dataPrepare();
        } else {
            _t = 0;
        }

        // Let's recalculate coordinates of gammaW points
        _processGammaWCoordinates();

        // Let's get matrix of left sides and array of right sides:
        if (_leftSide.length === 0) {
            _getLeftSide();
        }

        _getRightSide();

        var gauss = new Gauss(_leftSide, _rightSide);
        _gammaOld = _gamma;
        _gamma = gauss.solve();
    };

    /**
     * Return array of speed.
     * @param xyCoord object
     * @param step float
     * @return {[float,float,float]}
     */
    this.getSpeed = function(xyCoord, step) {
        var result = [
                [],
                [],
                []
            ],
            i;

        var wMod = Math.sqrt(Math.pow(_vWhistle.x, 2) + Math.pow(_vWhistle.y, 2));
        for (i = xyCoord[0].x + step / 2; i < xyCoord[1].x; i = i + step) {
            for (var j = xyCoord[0].y + step / 2; j < xyCoord[1].y; j = j + step) {
                var z = _getPointSpeed(i, j);
                z.x *= step / wMod;
                z.y *= step / wMod;

                result[0].push(i);
                result[1].push(j);
                result[2].push(z);
            }
        }

        return result;
    };

    this.getDfiDt = function(x, y) {
        if (_t == false) {
            return 0;
        }

        var result = 0,
        i;

        for (var j = 0; j < _gamma.length - 1; ++j) {
            var sum = 0,
                yTemp = (_xy0[j].y + _xy0[j + 1].y) / 2 - y,
                xTemp = x - (_xy0[j].x + _xy0[j + 1].x) / 2;
            for (i = 0; i <= j; ++i) {
                var wj = _xyAngular.indexOf(i);
                if (wj !== -1) {
                    sum += _gammaOld[i] / _tStep;
                }
                sum += (_gamma[i] - _gammaOld[i]) / _tStep;
            }

            result += sum / (2 * Math.PI) * (yTemp * (_xy0[j + 1].x - _xy0[j].x) + xTemp * (_xy0[j + 1].y - _xy0[j].y))
                / (Math.pow(xTemp, 2) + Math.pow(yTemp, 2));
        }

        for (var p = 0; p < _xyAngular.length; ++p) {
            var angularIndex = _xyGammaW.length - (_xyAngular.length - p),
                yTemp = (_xyGammaW[angularIndex].y + _xy0[_xyAngular[p]].y) / 2 - y,
                xTemp = x - (_xyGammaW[angularIndex].x + _xy0[_xyAngular[p]].x) / 2;

            result += (_gammaOld[_xyAngular[p]] / _tStep + (_gamma[_xyAngular[p]] - _gammaOld[_xyAngular[p]]) / _tStep) / (2 * Math.PI) *
                (yTemp * (_xy0[_xyAngular[p]].x - _xyGammaW[angularIndex].x) +
                xTemp * (_xy0[_xyAngular[p]].y - _xyGammaW[angularIndex].y))
                / (Math.pow(xTemp, 2) + Math.pow(yTemp, 2));
        }

        for (var j = 0; j < _gamma.length; ++j) {
            var temp1 = _getPointSpeed(_xy0[j].x, _xy0[j].y),
                temp2 = _speedVector(j, x, y);
            result -= _gamma[j] * (temp1.x * temp2.x + temp1.y * temp2.y);
        }

        for(var t = 0; t < _gammaW.length; t++) {
            var temp1 = _speedVectorW(t, x, y),
                temp2 = _getPointSpeed(_xyGammaW[t].x, _xyGammaW[t].y);
            result -= _gammaW[t] * (temp1.x * temp2.x + temp1.y * temp2.y);
        }

        return result;
    };

    // For debugging
    this.getNormales = function () {
        var result = [];
        for (var i = 0; i < _xy0.length - 1; ++i) {
            var norm = _normal(i);

            result.push({
                type: 'line',
                x0: _xy(i).x,
                y0: _xy(i).y,
                x1: _xy(i).x + norm.x * 0.25,
                y1: _xy(i).y + norm.y * 0.25,
                line: {
                    color: 'rgb(0, 0, 20)'
                }
            });
        }
        return result;
    };

    this.getGamma = function () {
        return _gamma;
    };

    /**
     * Return array of speed.
     * @param xyCoord object
     * @return {[float,float]}
     */
    this.getVortex = function (xyCoord) {
        var result = [
            [],
            [],
            []
        ];

        for (var i = 0; i < _xyGammaW.length; ++i) {
            if (((_xyGammaW[i].x >= xyCoord[0].x) && (_xyGammaW[i].x <= xyCoord[1].x))
                && ((_xyGammaW[i].y >= xyCoord[0].y) && (_xyGammaW[i].y <= xyCoord[1].y))) {
                result[0].push(_xyGammaW[i].x);
                result[1].push(_xyGammaW[i].y);
                result[2].push(_gammaW[i]);
            }
        }

        return result;
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

        var divisor = Math.sqrt(Math.pow((xy0k1.x - xy0k.x), 2) + Math.pow((xy0k1.y - xy0k.y), 2));

        return {
            x: -(xy0k1.y - xy0k.y) / divisor,
            y: (xy0k1.x - xy0k.x) / divisor
        };
    };

    /**
     *  v[k](x{n-2},y{n-2})
     *  @param indexGamma int
     *  @param x float
     *  @param y float
     *  @return Object
     *  @private
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
        var vT = [],
            i;

        for (i = 0; i < _gammaW.length; ++i) {
            vT[i] = _getPointSpeed(_xyGammaW[i].x, _xyGammaW[i].y);
        }

        for (i = 0; i < _gammaW.length; ++i) {

            var xyGammaTemp = {
                x: _xyGammaW[i].x + _tStep * vT[i].x,
                y: _xyGammaW[i].y + _tStep * vT[i].y
            };

            _xyGammaW[i] = _borderIntersectCallback(_xyGammaW[i], xyGammaTemp);
        }
    };

    /**
     * @param x float
     * @param y float
     * @return Object
     * @private
     */
    var _getPointSpeed = function (x, y) {
        var z = {
                x: 0,
                y: 0
            },
            temp;

        for (var k = 0; k < _gamma.length; ++k) {
            temp = _speedVector(k, x, y);

            z.x += temp.x * _gamma[k];
            z.y += temp.y * _gamma[k];
        }

        for (k = 0; k < _gammaW.length; ++k) {
            temp = _speedVectorW(k, x, y);
            z.x += temp.x * _gammaW[k];
            z.y += temp.y * _gammaW[k];
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
            var normalTemp = _normal(i),
                xyTemp = _xy(i);
            _leftSide[i] = [];

            for (j = 0; j < _xy0.length; ++j) {
                var vTemp = _speedVector(j, xyTemp.x, xyTemp.y);
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
            // TODO: VInf was there
            // rightSide[i] = -(vInf[0] * normalTemp[0] + vInf[1] * normalTemp[1]);
            _rightSide[i] = 0;
            if (_whistleIndexes.indexOf(i) !== -1) {
                _rightSide[i] += (_vWhistle.x) * normalTemp.x + (_vWhistle.y) * normalTemp.y;
            }

            for (j = 0; j < _gammaW.length; ++j) {
                var vectorW = _speedVectorW(j, _xy0[i].x, _xy0[i].y);
                _rightSide[i] -= _gammaW[j] * (vectorW.x * normalTemp.x + vectorW.y * normalTemp.y);
            }
        }

        // TODO: gammaInf was there
        _rightSide[_xy0.length - 1] = _gammaInf;
        for (j = 0; j < _gammaW.length; ++j) {
            _rightSide[_xy0.length - 1] -= _gammaW[j];
        }
    };

    /**
     * @private
     */
    var _dataPrepare = function () {
        for (i = 0; i < _xyAngular.length; ++i) {
            _gammaW.push(_gamma[_xyAngular[i]]);
            _xyGammaW.push({
                x: _xy0[_xyAngular[i]].x,
                y: _xy0[_xyAngular[i]].y,
            });
        }

        var angularSpeed = [],
            i;

        for(i = 0; i < _xyAngular.length; ++i) {
            angularSpeed.push(_getPointSpeed(_xy0[_xyAngular[i]].x, _xy0[_xyAngular[i]].y));
        }

        angularSpeed.forEach(function (item, index, array) {
            array[index] = Math.sqrt(Math.pow(item.x, 2) + Math.pow(item.y, 2));
        });

        var maxSpeed = Math.max.apply(Math, angularSpeed);

        _tStep = _eps / maxSpeed;

        _t += _tStep;
    };
};
