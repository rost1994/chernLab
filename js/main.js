/**
 * Firstly, we have letter "П", (three lines), where lengths of each line are equal
 * a - length of each side
 * n - step of grid
 * vInf - initial speed (some number from begin conditions)
 * gammaInf - circulation (some number from begin conditions)
 * tBeg - initial time moment
 * tStep - step of time grid (some number from begin conditions)
 * xyBeg[2] - left down initial coordinate of letter
 * plotXY[2][2] - coordinates of plot
 */
var a = 1,
    n = 10,
    vInf = [1, 0],
    gammaInf = 10,
    xyBeg = [1, 1],
    tBeg = 0,
    t,
    tStep = 0.1,
    contoursNum = 25,
    plotXY = [[0, 2.2], [0, 2.2]];

/**
 *  gamma[n] - array of unknown intensity in each point of grid
 *  gammaW[N] - array of unknown intensity in each wind point
 */
var gamma = [],
    gammaW = [];

/**
 *	pointDelta min radius between 2 points
 */
var pointDelta = function() {
	return 1.5 * a / (n - 1);
}

/**
 *  normal(x{k}, y{k})
 */
var normal = function (index) {
    xy0k = xy0[index];
    xy0k1 = xy0[index + 1];

    var divisor = Math.sqrt((xy0k1[0] - xy0k[0]) * (xy0k1[0] - xy0k[0]) + (xy0k1[1] - xy0k[1]) * (xy0k1[1] - xy0k[1]));

    return [
        -(xy0k1[1] - xy0k[1]) / divisor,
        (xy0k1[0] - xy0k[0]) / divisor
    ];
};

/**
 *  v[k](x{n-2},y{n-2})
 */
var v_vector = function (indexGamma, x, y) {
    var divisor = Math.max((pointDelta()), Math.sqrt(Math.pow((x - xy0[indexGamma][0]), 2) + Math.pow((y - xy0[indexGamma][1]), 2)));
    divisor *= divisor;

    return [
        1 / (2 * Math.PI) * (xy0[indexGamma][1] - y) / divisor,
        1 / (2 * Math.PI) * (x - xy0[indexGamma][0]) / divisor
    ];
};

var calculateTStep = function () {
    var delta = (pointDelta());

	var angularSpeed = [];
	
	for(var i = 0; i < xyAngular.length; ++i) {
		angularSpeed.push(getPointSpeed(xy0[xyAngular[i]][0], xy0[xyAngular[i]][1]));
	}

    angularSpeed.forEach(function (item, index, array) {
        array[index] = Math.sqrt(Math.pow(item[0], 2) + Math.pow(item[1], 2));
    });

    var maxSpeed = Math.max.apply(Math, angularSpeed);

    tStep = delta / maxSpeed;
};

/**
 *  v(x{n-2},y{n-2}, gammaW[0], gammaW[1])
 */
var v_vector_w = function (indexGammaW, x, y) {
    var divisor = Math.max((pointDelta()), Math.sqrt(Math.pow((x - xyGammaW[indexGammaW][0]), 2) + Math.pow((y - xyGammaW[indexGammaW][1]), 2)));
    divisor *= divisor;

    return [
        1 / (2 * Math.PI) * (xyGammaW[indexGammaW][1] - y) / divisor,
        1 / (2 * Math.PI) * (x - xyGammaW[indexGammaW][0]) / divisor
    ];
};

/**
 * rightSide[n] - array of system's left sides
 * leftSide[n][n] - matrix of system's right sides
 */
var leftSide = [],
    rightSide = [];

var viewCallback;

/**
 *  xy0[n][2] - array of initial points for letter "П"
 *  xyAngular[4] - array of indexes for angular initial points for letter "П"
 *  xyGammaW[P][2] - array of moved angular initial points for letter "П"
 */
var xy0 = [],
    xyAngular = [],
    xyGammaW = [],
    xy = function (index) {
        if (index < 0 || index >= n - 1 || !xy0[index] || !xy0[index + 1]) {
            throw new LogicException('Non-existent index!')
        }

        return [
            (xy0[index][0] + xy0[index + 1][0]) / 2,
            (xy0[index][1] + xy0[index + 1][1]) / 2
        ]
    };

	var repeatSteps = 500;

$(function () {
    $('#eval').click(function () {
        $('#solution').hide();
        $('#graph').html('');
        n = parseInt($('#n-count').val());
        plotXY[0][0] = parseFloat($('#a-x').val());
        plotXY[0][1] = parseFloat($('#b-x').val());
        plotXY[1][0] = parseFloat($('#a-y').val());
        plotXY[1][1] = parseFloat($('#b-y').val());
        vInf[0] = parseFloat($('#v-x').val());
        vInf[1] = parseFloat($('#v-y').val());
        gammaInf = parseFloat($('#gamma').val());
        tStep = parseFloat($('#t-step').val());
        tBeg = parseFloat($('#t-beg').val());
        t = tBeg;

        enrichXY();
        evaluate();
        $('#solution').show();
        $('.view').click(viewControl);
    });

    $('#next').click(function () {
        $('#solution').hide();
        $('#graph').html('');

        if ($('#forceCalc').prop('checked')) {
            for (var i = 0; i < repeatSteps; ++i) {
                afterView();
                evaluate();
            }

            $('#solution').show();
            viewCallback();
        } else {
            afterView();
            evaluate();
            $('#solution').show();
            viewCallback();
        }
    })
});

function viewControl() {
    if ($(this).val() === 'speed') {
        viewCallback = function () {
            var vPlot = getSpeed(a / 4),
                xGammaW = [],
                yGammaW = [];

            for (var i = 0; i < xyAngular.length; ++i) {
                xGammaW[i] = [];
                yGammaW[i] = [];
            }

            for (var i = 0; i < xyGammaW.length; ++i) {
                if (((xyGammaW[i][0] >= plotXY[0][0]) && (xyGammaW[i][0] <= plotXY[0][1]))
                    && ((xyGammaW[i][1] >= plotXY[1][0]) && (xyGammaW[i][1] <= plotXY[1][1]))) {
                    for (var k = 0; k < xyAngular.length; ++k) {
                        if (xyGammaW[i][2] === xyAngular[k]) {
                            xGammaW[k].push(xyGammaW[i][0]);
                            yGammaW[k].push(xyGammaW[i][1]);
                        }
                    }
                }
            }

            var data = [
                    {
						x: [2, 1, 1, 2],
						y: [1, 1, 2, 2],
                        type: 'scatter'
                    }
                ],
                annotations = [];

            for (var i = 0; i < xyAngular.length; ++i) {
                data.push(
                    {
                        x: xGammaW[i],
                        y: yGammaW[i],
                        mode: 'markers',
                        type: 'scatter'
                    }
                );
            }

            for (var i = 0; i < vPlot[0].length; ++i) {
                var divider = Math.sqrt(Math.pow(vPlot[2][i][0], 2) + Math.pow(vPlot[2][i][1], 2)),
                    axV = 50 * vPlot[2][i][0],
                    ayV = 50 * vPlot[2][i][1];

                annotations.push({
                    x: vPlot[0][i],
                    y: vPlot[1][i],
                    xref: 'x',
                    yref: 'y',
                    showarrow: true,
                    arrowsize: 0.6,
                    arrowhead: 1,
                    arrowcolor: 'rgba(0, 0, 0, 0.5)',
                    ax: -axV,
                    ay: ayV
                });
            }

            var layout = {
                showlegend: true,
                annotations: annotations
            };

            Plotly.newPlot('graph', data, layout);
        };
    } else if ($(this).val() === 'speedConcentration') {
        viewCallback = function () {
            var vPlot = getSpeed(pointDelta() * 2),
                z = [];

            for (var i = 0; i < vPlot[0].length; ++i) {
                var element = Math.sqrt(Math.pow(vPlot[2][i][0], 2) + Math.pow(vPlot[2][i][1], 2));

                z.push(element);
            }


            var data = [
                {
                    z: z,
                    x: vPlot[0],
                    y: vPlot[1],
                    type: 'contour',
                    ncontours: contoursNum,
					colorscale: [[0, 'rgb(255,255,255)'], [1, 'rgb(0,0,0)']]
                },
                {
                    x: [2, 1, 1, 2],
                    y: [1, 1, 2, 2],
                    type: 'scatter'
                }
            ];

            Plotly.newPlot('graph', data);
        };
    } else if ($(this).val() === 'pressure') {
        viewCallback = function () {
            var vPlot = getSpeed(pointDelta() * 2),
                z = [],
                vInfSq = vInf[0] * vInf[0] + vInf[1] * vInf[1],
				temp = [];

			for (var i = 0; i < gammaW.length; ++i) {
				for (var l = 0; l < xyAngular.length; ++l) {
					if (xyGammaW[i][2] === xyAngular[l]) {
						break;
					}
				}

				temp.push(getPointSpeed(xy0[xyAngular[l]][0], xy0[xyAngular[l]][1]));
			}

            for (var i = 0; i < vPlot[0].length; ++i) {
                var element = 1 - (vPlot[2][i][0] * vPlot[2][i][0] + vPlot[2][i][1] * vPlot[2][i][1]) / vInfSq;

                if (Math.abs(t - tBeg) < 0.0001) {
                    element -= 2 * getDfiDt(vPlot[0][i], vPlot[1][i], temp) / vInfSq;
                }


                z.push(element);
            }


            var data = [
                {
                    z: z,
                    x: vPlot[0],
                    y: vPlot[1],
                    type: 'contour',
                    ncontours: contoursNum,
					colorscale: [[0, 'rgb(255,255,255)'], [1, 'rgb(0,0,0)']]
                },
                {
                    x: [2, 1, 1, 2],
                    y: [1, 1, 2, 2],
                    type: 'scatter'
                }
            ];

            Plotly.newPlot('graph', data);
        };
    } else if ($(this).val() === 'dfiDt') {
        viewCallback = function() {
            var result = [[],[],[]],
                step = pointDelta() * 2,
				temp = [];
				
			for (var i = 0; i < gammaW.length; ++i) {
				for (var l = 0; l < xyAngular.length; ++l) {
					if (xyGammaW[i][2] === xyAngular[l]) {
						break;
					}
				}

				temp.push(getPointSpeed(xy0[xyAngular[l]][0], xy0[xyAngular[l]][1]));
			}

            for (var i = plotXY[0][0]; i < plotXY[0][1]; i = i + step) {
                for (var j = plotXY[1][0]; j < plotXY[1][1]; j = j + step) {
                    result[0].push(i);
                    result[1].push(j);
                    result[2].push(getDfiDt(i, j, temp));
                }
            }

            var data = [
                {
                    z: result[2],
                    x: result[0],
                    y: result[1],
                    type: 'contour',
                    ncontours: contoursNum,
					colorscale: [[0, 'rgb(255,255,255)'], [1, 'rgb(0,0,0)']]
                },
                {
                    x: [2, 1, 1, 2],
                    y: [1, 1, 2, 2],
                    type: 'scatter'
                }
            ];

            Plotly.newPlot('graph', data);
        };
    } else if ($(this).val() === 'potential') {
        viewCallback = function () {
            var fi = getFi();

            var data = [
                {
                    z: fi[2],
                    x: fi[0],
                    y: fi[1],
                    type: 'contour',
                    ncontours: contoursNum,
					colorscale: [[0, 'rgb(255,255,255)'], [1, 'rgb(0,0,0)']]
                },
                {
                    x: [2, 1, 1, 2],
                    y: [1, 1, 2, 2],
                    type: 'scatter'
                }
            ];

            Plotly.newPlot('graph', data);
        };
    } else if ($(this).val() === 'potentialDip') {
        viewCallback = function () {
            var fi = getFiDip();

            var data = [
                {
                    z: fi[2],
                    x: fi[0],
                    y: fi[1],
                    type: 'contour',
                    ncontours: contoursNum,
					colorscale: [[0, 'rgb(255,255,255)'], [1, 'rgb(0,0,0)']]
                },
                {
                    x: [2, 1, 1, 2],
                    y: [1, 1, 2, 2],
                    type: 'scatter'
                }
            ];

            Plotly.newPlot('graph', data);
        };
    } else if ($(this).val() === 'flowLines') {
        viewCallback = function () {
            var psi = getPsi();

            var data = [
                {
                    z: psi[2],
                    x: psi[0],
                    y: psi[1],
                    type: 'contour',
                    ncontours: contoursNum,
					colorscale: [[0, 'rgb(255,255,255)'], [1, 'rgb(0,0,0)']]
                },
                {
                    x: [2, 1, 1, 2],
                    y: [1, 1, 2, 2],
                    type: 'scatter'
                }
            ];

            Plotly.newPlot('graph', data);
        };
    }

    viewCallback();

    $('#view-controls').hide();
    $('#eval').hide();
}

function enrichXY() {
    /**
     *  Firstly, let's generate array of xy0
     *  step - step of letters's grid
     */
    var step = pointDelta() * 2;

    xy0 = [];
    xyAngular = [];

    // For first '_' we have:
    var tempN = Math.floor(n / 3) + 1;
    for (var i = 0; i < tempN; ++i) {
        var point = [
            xyBeg[0] + a - i * step,
            xyBeg[1]
        ];

        xy0.push(point);
    }

    xyAngular.push(0);
    xyAngular.push(xy0.length - 1);

    // For '|' we have:
    tempN = Math.floor(n / 3);
    for (i = 1; i <= tempN; ++i) {
        var point = [
            xyBeg[0],
            xyBeg[1] + i * step
        ];

        xy0.push(point);
    }
    xyAngular.push(xy0.length - 1);

    // For second '-' we have:
    //for (i = tempN - 1; i >= 0; --i) {
	for (i = 1; i <= tempN; ++i) {
        var point = [
            xyBeg[0] + i * step,
            xyBeg[1] + a
        ];

        xy0.push(point);
    }
    xyAngular.push(xy0.length - 1);
}

function evaluate() {
    // Let's recalculate coordinates of gammaW points
    processGammaWCoordinates();

    // Let's get matrix of left sides and array of right sides:
    if (leftSide.length === 0) {
        getLeftSide();
    }

    getRightSide();

    var gauss = new Gauss(leftSide, rightSide);
    gamma = gauss.solve();
}

function afterView() {
    calculateTStep();
    t += tStep;
    for (var i = 0; i < xyAngular.length; ++i) {
        gammaW.push(gamma[xyAngular[i]]);
        xyGammaW.push([
            xy0[xyAngular[i]][0],
            xy0[xyAngular[i]][1],
            xyAngular[i]
        ]);
    }
}

function getLeftSide() {
    leftSide = [];

    for (var i = 0; i < n - 1; ++i) {
        var normalTemp = normal(i);
        leftSide[i] = [];

        for (var j = 0; j < n; ++j) {
            var xyTemp = xy(i),
                vTemp = v_vector(j, xyTemp[0], xyTemp[1]);
            leftSide[i][j] = vTemp[0] * normalTemp[0] + vTemp[1] * normalTemp[1];
        }
    }

    leftSide[n - 1] = [];
    for (var j = 0; j < n; ++j) {
        leftSide[n - 1][j] = 1;
    }
}

function getRightSide() {
    rightSide = [];

    for (var i = 0; i < n - 1; ++i) {
        var normalTemp = normal(i);
        rightSide[i] = -(vInf[0] * normalTemp[0] + vInf[1] * normalTemp[1]);

        for (var j = 0; j < gammaW.length; ++j) {
            var vectorW = v_vector_w(j, xy0[i][0], xy0[i][1]);
            rightSide[i] -= gammaW[j] * (vectorW[0] * normalTemp[0] + vectorW[1] * normalTemp[1]);
        }
    }

    rightSide[n - 1] = gammaInf;
    for (var j = 0; j < gammaW.length; ++j) {
        rightSide[n - 1] -= gammaW[j];
    }
}

function processGammaWCoordinates() {
    for (var i = 0; i < gammaW.length; ++i) {
        var vT = getPointSpeed(xyGammaW[i][0], xyGammaW[i][1]);

        var xyGammaTemp = [
            xyGammaW[i][0] + tStep * vT[0],
            xyGammaW[i][1] + tStep * vT[1],
            xyGammaW[i][2]
        ];

		xyGammaW[i] = correctBorderIntersect(xyGammaW[i], xyGammaTemp);
    }
}

function correctBorderIntersect(pointOld, pointNew) {
    var middlePointX = (pointOld[0] + pointNew[0]) / 2,
        middlePointY = (pointOld[1] + pointNew[1]) / 2,
        delta = pointDelta() + 0.001;

    if ((middlePointY > xyBeg[1]) && (middlePointY < xyBeg[1] + 1)) {
        if (((pointNew[0] > xyBeg[0]) && (pointOld[0] < xyBeg[0]))
            || ((pointNew[0] < xyBeg[0]) && (pointOld[0] > xyBeg[0]))) {

            pointNew[0] = xyBeg[0] - (pointNew[0] - pointOld[0]);
        }
    }

    if ((middlePointX > xyBeg[0]) && (middlePointX < xyBeg[0] + 1)) {
        if (((pointNew[1] > xyBeg[1] + 1) && (pointOld[1] < xyBeg[1] + 1))
            || ((pointNew[1] < xyBeg[1] + 1) && (pointOld[1] > xyBeg[1] + 1))) {

            pointNew[1] = xyBeg[1] + 1 - (pointNew[1] - pointOld[1]);
        }

		if (((pointNew[1] > xyBeg[1]) && (pointOld[1] < xyBeg[1]))
            || ((pointNew[1] < xyBeg[1]) && (pointOld[1] > xyBeg[1]))) {

            pointNew[1] = xyBeg[1] - (pointNew[1] - pointOld[1]);
        }
    }

    var inStripCheck = function (pointIn, pointOther, coordIntersect, coordBeg, coordEnd) {
            return (pointIn > (coordIntersect - delta)) &&
                (pointIn < (coordIntersect + delta)) &&
                (pointOther > coordBeg) &&
                (pointOther < coordEnd);
        },
        correctStripIntersect = function (pointOldCoord, coordInterset, invert) {
			if (pointOldCoord < coordInterset) {
                return coordInterset - delta;
            } else if (pointOldCoord > coordInterset) {
                return coordInterset + delta;
            } else if (pointOldCoord === coordInterset) {
				return invert ? coordInterset - delta : coordInterset + delta;
			}
        };

    if (inStripCheck(pointNew[0], pointNew[1], xyBeg[0], xyBeg[1], xyBeg[1] + a)) {
        pointNew[0] = correctStripIntersect(pointOld[0], xyBeg[0], false);
    } else if (inStripCheck(pointNew[1], pointNew[0], xyBeg[1] + a, xyBeg[0], xyBeg[0] + a)) {
        pointNew[1] = correctStripIntersect(pointOld[1], xyBeg[1] + a, false);
	} else if (inStripCheck(pointNew[1], pointNew[0], xyBeg[1], xyBeg[0], xyBeg[0] + a)) {
        pointNew[1] = correctStripIntersect(pointOld[1], xyBeg[1], true);
    }

    return pointNew;
}

function getSpeed(step) {
    var result = [
        [],
        [],
        []
    ];

    for (var i = plotXY[0][0] + step / 2; i < plotXY[0][1]; i = i + step) {
        for (var j = plotXY[1][0] + step / 2; j < plotXY[1][1]; j = j + step) {
            var z = getPointSpeed(i, j);

            result[0].push(i);
            result[1].push(j);
            result[2].push(z);
        }
    }

    return result;
}

function getDfiDt(x, y, tempV) {
	result = 0;
	
	for (var j = 0; j < n - 1; ++j) {
		var sum = 0;
		for (var i = 0; i <=j; ++i) {
			sum += gamma[i];
		}
		
		result += sum / (2 * Math.PI) * (((xy0[j][1] + xy0[j+1][1])/2 - y) * (xy0[j+1][0] - xy0[j][0]) + (x - (xy0[j][0] + xy0[j+1][0])/2) * (xy0[j+1][1] - xy0[j][1])) / (Math.pow((x - (xy0[j][0] + xy0[j+1][0])/2), 2) + Math.pow(((xy0[j][1] + xy0[j+1][1])/2 - y), 2));
	}

	for (var p = 0; p < xyAngular.length; ++p) {
		if (gammaW[xyAngular[p]]) {
			result += gammaW[xyAngular[p]] / (2 * Math.PI) * (((xyGammaW[xyAngular[p]][1] + xy0[xyAngular[p]][1])/2 - y) * (xyGammaW[xyAngular[p]][0] - xy0[xyAngular[p]][0]) + (x - (xyGammaW[xyAngular[p]][0] + xy0[xyAngular[p]][0])/2) * (xyGammaW[xyAngular[p]][1] - xy0[xyAngular[p]][1])) / (Math.pow((x - (xyGammaW[xyAngular[p]][0] + xy0[xyAngular[p]][0])/2), 2) + Math.pow(((xyGammaW[xyAngular[p]][1] + xy0[xyAngular[p]][1])/2 - y), 2));
		}
	}

	for (var i = 0; i < gammaW.length; ++i) {
		for (var l = 0; l < xyAngular.length; ++l) {
			if (xyGammaW[i][2] === xyAngular[l]) {
				break;
			}
		}

		var temp1 = v_vector_w(i, x, y),
			temp2 = tempV[i];
		result += gammaW[i] * (temp1[0] * temp2[0] + temp1[1] * temp2[1]);
	}

	return result;
}

function getPointSpeed(x, y) {
    var z = [
        vInf[0],
        vInf[1]
    ];

    for (var k = 0; k < n; ++k) {
        var temp = v_vector(k, x, y);
        z[0] += temp[0] * gamma[k];
        z[1] += temp[1] * gamma[k];
    }

    for (k = 0; k < gammaW.length; ++k) {
        var temp = v_vector_w(k, x, y);
        z[0] += temp[0] * gammaW[k];
        z[1] += temp[1] * gammaW[k];
    }

    return z;
}

function getFi() {
    var result = [
        [],
        [],
        []
    ];

    var step = pointDelta() * 2;
    for (var i = plotXY[0][0]; i < plotXY[0][1]; i = i + step) {
        for (var j = plotXY[1][0]; j < plotXY[1][1]; j = j + step) {
            var z = vInf[0] * i + vInf[1] * j;

            for (var k = 0; k < n; ++k) {
                z += gamma[k] * (1 / (2 * Math.PI) * Math.atan((j - xy0[k][1]) / (i - xy0[k][0])));
            }

            for (var k = 0; k < gammaW.length; ++k) {
                z += gammaW[k] * (1 / (2 * Math.PI) * Math.atan((j - xyGammaW[k][1]) / (i - xyGammaW[k][0])));
            }

            result[0].push(i);
            result[1].push(j);
            result[2].push(z);
        }
    }

    return result;
}

function getFiDip() {
    var result = [
        [],
        [],
        []
    ];

    var step = pointDelta() * 2;
    for (var i = plotXY[0][0]; i < plotXY[0][1]; i = i + step) {
        for (var j = plotXY[1][0]; j < plotXY[1][1]; j = j + step) {
            var z = vInf[0] * i + vInf[1] * j,
                tempVar = 0;

            for (var k = 0; k < n - 1; ++k) {
                var sum = 0;

                for (var l = 0; l <= k; ++l) {
                    sum += gamma[l];
                }


                var rj = Math.max((pointDelta()), Math.sqrt(Math.pow((i - (xy0[k][0] + xy0[k + 1][0]) / 2), 2) + Math.pow((j - (xy0[k][1] + xy0[k + 1][1]) / 2), 2)));
                rj *= rj;

                tempVar += sum * ((xy0[k + 1][1] - xy0[k][1]) * (i - (xy0[k][0] + xy0[k + 1][0]) / 2) - (xy0[k + 1][0] - xy0[k][0]) * (j - (xy0[k][1] + xy0[k + 1][1]) / 2)) / rj / (2 * Math.PI);
            }

            for (var k = 0; k < gammaW.length - 1; ++k) {
                var sum = 0;

                for (var l = 0; l <= k; ++l) {
                    sum += gammaW[l];
                }

                var distance = Math.sqrt(Math.pow(xyGammaW[k][0] - xyGammaW[k + 1][0], 2) + Math.pow(xyGammaW[k][1] - xyGammaW[k + 1][1], 2));

                var rj = Math.max(distance, Math.sqrt(Math.pow((i - (xyGammaW[k][0] + xyGammaW[k + 1][0]) / 2), 2) + Math.pow((j - (xyGammaW[k][1] + xyGammaW[k + 1][1]) / 2), 2)));
                rj *= rj;

                tempVar += sum * ((xyGammaW[k + 1][1] - xyGammaW[k][1]) * (i - (xyGammaW[k][0] + xyGammaW[k + 1][0]) / 2) - (xyGammaW[k + 1][0] - xyGammaW[k][0]) * (j - (xyGammaW[k][1] + xyGammaW[k + 1][1]) / 2)) / rj / (2 * Math.PI);
            }

            z += tempVar + gammaInf * Math.atan((j - xy0[n - 1][1]) / (i - xy0[n - 1][0])) / (2 * Math.PI);
            result[0].push(i);
            result[1].push(j);
            result[2].push(z);
        }
    }

    return result;
}

function getPsi() {
    var result = [
        [],
        [],
        []
    ];

    var step = pointDelta() * 2;
    for (var i = plotXY[0][0]; i < plotXY[0][1]; i = i + step) {
        for (var j = plotXY[1][0]; j < plotXY[1][1]; j = j + step) {
            var z = vInf[0] * j - vInf[1] * i,
                tempVarGamma = 1,
                tempVarGammaW = 1;

            for (var k = 0; k < n; ++k) {
                var rj = Math.max((pointDelta()), Math.sqrt(Math.pow((i - xy0[k][0]), 2) + Math.pow((j - xy0[k][1]), 2)));
                tempVarGamma *= Math.pow(rj, (gamma[k] / (2 * Math.PI)));
            }

            for (var k = 0; k < gammaW.length; ++k) {
                var rj = Math.max((pointDelta()), Math.sqrt(Math.pow((i - xyGammaW[k][0]), 2) + Math.pow((j - xyGammaW[k][1]), 2)));
                tempVarGammaW *= Math.pow(rj, (gammaW[k] / (2 * Math.PI)));
            }

            z = z - tempVarGamma - tempVarGammaW;
            result[0].push(i);
            result[1].push(j);
            result[2].push(z);
        }
    }

    return result;
}

function LogicException(message) {
    this.message = message;
    this.name = "Logic exception of program";
}
