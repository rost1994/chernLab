

$(function () {
    var n,
        plotXY = [[], []],
        a,
        alpha,
        delta,
        radius,
        p;

    $('#eval').click(function () {
        $('#solution').show();
        $('#graph').html('');

        n = parseInt($('#n-count').val());
        plotXY[0][0] = parseFloat($('#a-x').val());
        plotXY[0][1] = parseFloat($('#b-x').val());
        plotXY[1][0] = parseFloat($('#a-y').val());
        plotXY[1][1] = parseFloat($('#b-y').val());
        a = parseFloat($('#model-a').val());
        alpha = parseFloat($('#model-alpha').val());
        delta = parseFloat($('#model-delta').val());
        radius = parseFloat($('#model-radius').val());
        p = {
            x: parseFloat($('#contour-x').val()),
            y: parseFloat($('#contour-y').val())
        };

        var contour = new Contour();
        contour.initialize(a, alpha, delta, radius, n, p);

        var points = contour.getPoints(),
            discretePoints = contour.getDiscretePoints(),
            espilon = contour.getEpsilon();

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
            graphHeight = graphWidth * (plotXY[1][1] - plotXY[1][0]) / (plotXY[0][1] - plotXY[0][0]);

        var layout = {
            showlegend: true,
            xaxis: {range: [plotXY[0][0], plotXY[0][1]]},
            yaxis: {range: [plotXY[1][0], plotXY[1][1]]},
            width: graphWidth,
            height: graphHeight
        };

        Plotly.newPlot('graph', data, layout);
    });
});
