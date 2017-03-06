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
        p,
        solution = $('#solution'),
        graph = $('#graph'),
        contour = new Contour(),
        method = new Method();

    $('#eval').click(function () {
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
        p = {
            x: parseFloat($('#contour-x').val()),
            y: parseFloat($('#contour-y').val())
        };

        contour.initialize(a, alpha, delta, radius, n, p);
        method.initialize(
            contour.getPoints(),
            contour.getDiscretePoints(),
            contour.getEpsilon(),
            contour.getBorderIntersectCallback(plotXY)
        );
        method.evaluate();

        solution.show();

        $('.view').click(viewControl);
    });

    $('#next').click(function () {
        solution.hide();
        graph.html('');

        afterView();
        method.evaluate();
        solution.show();

        viewCallback();
    })
});

/**
 * Draws contour
 * @param contour {Contour}
 */
var drawContour = function (contour) {
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

    var graphWidth = 1000,
        graphHeight = graphWidth * (plotXY[1].y - plotXY[0].y) / (plotXY[1].x - plotXY[0].x);

    var layout = {
        showlegend: true,
        xaxis: {range: [plotXY[0].x, plotXY[1].x]},
        yaxis: {range: [plotXY[0].y, plotXY[1].y]},
        width: graphWidth,
        height: graphHeight
    };

    Plotly.newPlot('graph', data, layout);
};
