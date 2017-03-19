$(function () {
    var n,
        plotXY = [
            {
                x: 0,
                y: 0
            },
            {
                x: 1,
                y: 1
            }
        ],
        a,
        alpha,
        delta,
        radius,
        gammaInf,
        vWhistle = {
            x: 0,
            y: 0
        },
        p,
        solution = $('#solution'),
        graph = $('#graph'),
        contour = new Contour(),
        method = new Method(),
        viewCallback,
        renderEpsilon = 1;

    $('#eval').click(function () {
        $(this).hide();
        solution.hide();
        graph.html('');

        n = parseInt($('#n-count').val());
        plotXY[0].x = parseFloat($('#a-x').val());
        plotXY[0].y = parseFloat($('#a-y').val());
        plotXY[1].x = parseFloat($('#b-x').val());
        plotXY[1].y = parseFloat($('#b-y').val());
        a = parseFloat($('#model-a').val());
        alpha = parseFloat($('#model-alpha').val());
        delta = parseFloat($('#model-delta').val());
        radius = parseFloat($('#model-radius').val());
        gammaInf = parseFloat($('#gamma-inf').val());
        vWhistle.x = parseFloat($('#v-inf-x').val());
        vWhistle.y = parseFloat($('#v-inf-y').val());
        p = {
            x: parseFloat($('#contour-x').val()),
            y: parseFloat($('#contour-y').val())
        };
        renderEpsilon = (plotXY[1].y - plotXY[0].y) / 20;

        contour.initialize(a, alpha, delta, radius, n, p);
        method.initialize(
            contour.getPoints(),
            contour.getDiscretePoints(),
            contour.getEpsilon(),
            gammaInf,
            vWhistle,
            contour.getWhistleIndexes(),
            contour.correctBorderIntersectCallback
        );
        method.evaluate();

        solution.show();

        $('.view').click(viewControl);
    });

    $('#next').click(function () {
        solution.hide();
        graph.html('');

        method.evaluate();
        solution.show();

        viewCallback();
    });

    var viewControl = function() {
        if ($(this).val() === 'speed') {
            viewCallback = function () {
                var data = getContour(),
                    speedData = method.getSpeed(plotXY, renderEpsilon),
                    vortexData = method.getVortex(plotXY),
                    i;

                var shapes = [];

                for (i = 0; i < speedData[0].length; ++i) {
                    //var divider = Math.sqrt(Math.pow(speedData[2][i].x, 2) + Math.pow(speedData[2][i].y, 2)),
                    shapes.push(
                        {
                            type: 'line',
                            x0: speedData[0][i],
                            y0: speedData[1][i],
                            x1: speedData[0][i] + speedData[2][i].x,
                            y1: speedData[1][i] + speedData[2][i].y,
                            line: {
                                color: 'rgb(55, 128, 191)'
                            }
                        }
                    );
                }

                data.push(
                    {
                        x: vortexData[0],
                        y: vortexData[1],
                        mode: 'markers',
                        type: 'scatter'
                    }
                );

                drawGraph(data, shapes);
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
    };

    /**
     * Return contour points data
     * @return object[]
     */
    var getContour = function () {
        var points = contour.getPoints(),
            discretePoints = contour.getDiscretePoints();

        var xPoints = [],
            yPoints = [];

        for (var i = 0; i < points.length; ++i) {
            xPoints.push(points[i].x);
            yPoints.push(points[i].y);
        }

        var data = [
            {
                x: xPoints,
                y: yPoints,
                type: 'scatter'
            }
        ];

        var pointsArrayX = discretePoints.map(function (x) {
                return points[x].x;
            }),
            pointsArrayY = discretePoints.map(function (x) {
                return points[x].y;
            });

        data.push(
            {
                x: pointsArrayX,
                y: pointsArrayY,
                mode: 'markers',
                type: 'scatter'
            }
        );

        return data;
    };

    /**
     * @param data object[]
     * @param shapes object[]
     */
    var drawGraph = function (data, shapes) {
        shapes = shapes || [];

        var graphWidth = 1000,
            graphHeight = graphWidth * (plotXY[1].y - plotXY[0].y) / (plotXY[1].x - plotXY[0].x);

        var layout = {
            showlegend: true,
            xaxis: {range: [plotXY[0].x, plotXY[1].x]},
            yaxis: {range: [plotXY[0].y, plotXY[1].y]},
            width: graphWidth,
            height: graphHeight,
            shapes: shapes
        };

        Plotly.newPlot('graph', data, layout);
    };
});
