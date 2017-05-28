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
        contoursNum = 25,
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
        renderEpsilon = (plotXY[1].y - plotXY[0].y) / 60;

        contour.initialize(a, alpha, delta, radius, n, p);
        method.initialize(
            contour.getPoints(),
            contour.getWindDiscretePoints(),
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

    $('#auto').click(function () {
       $('#next, #condition').hide();
       var doFun = function () {
           solution.hide();
           graph.html('');

           var nNext = parseInt($('#n-next').val());
           for(var j = 0; j < nNext; ++j) {
               method.evaluate();
           }
           solution.show();

           viewCallback();
           document.getElementById('graph').on('plotly_afterplot', function() {
               setTimeout(doFun, 10);
           });
       };
       doFun();
    });

    $('#next').click(function () {
        // $('#condition').hide();
        solution.hide();
        graph.html('');

        var nNext = parseInt($('#n-next').val());
        for(var j = 0; j < nNext; ++j) {
            method.evaluate();
        }

        solution.show();

        viewCallback();
    });

    var viewControl = function() {
        if ($(this).val() === 'speed') {
            viewCallback = function () {
                var data = getContour(),
                    speedData = method.getSpeed(plotXY, renderEpsilon),
                    i;

                var shapes = [];

                for (i = 0; i < speedData[0].length; ++i) {
                    if (Math.sqrt(Math.pow(speedData[2][i].x, 2)+Math.pow(speedData[2][i].y, 2)) < renderEpsilon * 0.1) continue;
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

                // Just for testing
                (function () {
                    var vortexData = method.getVortex(plotXY),
                        resTest = {
                            x: [],
                            y: [],
                            color: [],
                            size: []
                        };

                    for (var ind = 0; ind < vortexData[0].length; ++ind) {
                        resTest.x.push(vortexData[0][ind]);
                        resTest.y.push(vortexData[1][ind]);
                        resTest.color.push(vortexData[2][ind]);
                        resTest.size.push(0.0043 * 6);
                    }

                    data.push(
                        {
                            x: resTest.x,
                            y: resTest.y,
                            mode: 'markers',
                            type: 'scatter',
                            marker: {
                                sizemode: 'diameter',
                                size: resTest.size,
                                sizeref: 0.0043,
                                color: resTest.color,
                                showscale: true,
                                colorbar: {
                                    len: 0.5
                                }
                            }
                        }
                    );
                })();

                drawGraph(data, shapes);
            };
        } else if ($(this).val() === 'speedConcentration') {
            viewCallback = function () {
                var data = getContour(),
                    speedData = method.getSpeed(plotXY, renderEpsilon),
                    i,
                    z = [];

                for (i = 0; i < speedData[2].length; ++i) {
                    z.push(Math.sqrt(Math.pow(speedData[2][i].x, 2) + Math.pow(speedData[2][i].y, 2)));
                }

                data.push({
                    z: z,
                    x: speedData[0],
                    y: speedData[1],
                    type: 'contour',
                    ncontours: contoursNum,
                    colorscale: [[0, 'rgb(255,255,255)'], [1, 'rgb(0,0,0)']],
                    colorbar: {
                        x: 1.11
                    }
                });

                // Just for testing
                (function(){
                    var resTest = {
                            x: [],
                            y: [],
                            color: [],
                            size: []
                        },
                        vortexData = method.getVortex(plotXY);

                    for(var ind = 0; ind < vortexData[0].length; ++ ind) {
                        resTest.x.push(vortexData[0][ind]);
                        resTest.y.push(vortexData[1][ind]);
                        resTest.color.push(vortexData[2][ind]);
                        resTest.size.push(0.0043 * 6);
                    }

                    data.push(
                        {
                            x: resTest.x,
                            y: resTest.y,
                            mode: 'markers',
                            type: 'scatter',
                            marker: {
                                sizemode: 'diameter',
                                size: resTest.size,
                                sizeref: 0.0043,
                                color: resTest.color,
                                showscale: true,
                                colorbar: {
                                    len: 0.5
                                }
                            }
                        }
                    );
                })();

                drawGraph(data);
            };
        } else if ($(this).val() === 'pressure') {
            viewCallback = function () {
                var data = getContour(),
                    speedData = method.getSpeed(plotXY, renderEpsilon),
                    i,
                    z = [];

                for (i = 0; i < speedData[2].length; ++i) {
                    var element = 1 - (speedData[2][i].x * speedData[2][i].x + speedData[2][i].y * speedData[2][i].y);
                    element += 2 * method.getDfiDt(speedData[0][i], speedData[1][i]);
                    z.push(element);
                }

                data.push({
                    z: z,
                    x: speedData[0],
                    y: speedData[1],
                    type: 'contour',
                    ncontours: contoursNum * 3,
                    colorscale: [[0, 'rgb(255,255,255)'], [1, 'rgb(0,0,0)']],
                    colorbar: {
                        x: 1.11
                    }
                });

                // Just for testing
                (function () {
                    var vortexData = method.getVortex(plotXY),
                        resTest = {
                            x: [],
                            y: [],
                            color: [],
                            size: []
                        };

                    for (var ind = 0; ind < vortexData[0].length; ++ind) {
                        resTest.x.push(vortexData[0][ind]);
                        resTest.y.push(vortexData[1][ind]);
                        resTest.color.push(vortexData[2][ind]);
                        resTest.size.push(0.0043 * 6);
                    }

                    data.push(
                        {
                            x: resTest.x,
                            y: resTest.y,
                            mode: 'markers',
                            type: 'scatter',
                            marker: {
                                sizemode: 'diameter',
                                size: resTest.size,
                                sizeref: 0.0043,
                                color: resTest.color,
                                showscale: true,
                                colorbar: {
                                    len: 0.5
                                }
                            }
                        }
                    );
                })();

                drawGraph(data);
            };
        } else if ($(this).val() === 'flowLines') {
            viewCallback = function () {
                var data = getContour(),
                    flowLinesData = method.getPsi(plotXY, renderEpsilon);

                data.push({
                    z: flowLinesData[2],
                    x: flowLinesData[0],
                    y: flowLinesData[1],
                    type: 'contour',
                    ncontours: contoursNum,
                    colorscale: [[0, 'rgb(255,255,255)'], [1, 'rgb(0,0,0)']],
                    colorbar: {
                        x: 1.11
                    }
                });

                // Just for testing
                (function () {
                    var resTest = {
                            x: [],
                            y: [],
                            color: [],
                            size: []
                        },
                        vortexData = method.getVortex(plotXY);

                    for(var ind = 0; ind < vortexData[0].length; ++ ind) {
                        resTest.x.push(vortexData[0][ind]);
                        resTest.y.push(vortexData[1][ind]);
                        resTest.color.push(vortexData[2][ind]);
                        resTest.size.push(0.0043 * 6);
                    }

                    data.push(
                        {
                            x: resTest.x,
                            y: resTest.y,
                            mode: 'markers',
                            type: 'scatter',
                            marker: {
                                sizemode: 'diameter',
                                size: resTest.size,
                                sizeref: 0.0043,
                                showscale: true,
                                colorbar: {
                                    len: 0.5
                                }
                            }
                        }
                    );
                })();

                drawGraph(data);
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
