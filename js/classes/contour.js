/**
 * @constructor
 */
var Contour = function () {
    var _a,
        _b,
        _alpha,
        _delta,
        _radius,
        _n,
        _points = [],
        _discretePoints = [];

    /**
     * Initialize Contour with given lengths
     * @param a float - width
     * @param b float - height
     * @param alpha float - angle of circle sector,
     * @param delta float - 'y' offset of circle,
     * @param radius float - radius
     * @param n int   - number of points
     * @param p {float, float} - center of top left contour point
     */
    this.initialize = function(a, b, alpha, delta, radius, n, p) {
        _a = a;
        _b = b;
        _alpha = alpha;
        _delta = delta;
        _n = n;
        _radius = radius || Contour.RADIUS;
        p = p || {x: 0, y: (2 * _radius)};

        _pointsCalculate(p);
    };

    /**
     * Return an array of contour points
     * @returns {{float, float}[]}
     */
    this.getPoints = function () {
        return _points;
    };

    /**
     * Return an array of discrete points
     * @returns int[]
     */
    this.getDiscretePoints = function () {
        return _discretePoints;
    };

    /**
     * Fill _points and _discretePoints arrays
     * @param p - {float, float} - center
     * @private
     */
    var _pointsCalculate = function (p) {
        var segmentLength = _radius * (2 * Math.PI - _alpha),
            length = 2 * _a + _b + segmentLength,
            hordX = (function () {
                var hordSquare = 2 * Math.pow(_radius, 2) * (1 - Math.cos(_alpha));
                return Math.sqrt(hordSquare - Math.pow((_b - _delta), 2));
            })(),
            step = length / _n;

        var i;

        for (i = _a; i >= 0; i -= step) {
            _points.push({
                x: p.x + i,
                y: p.y
            });
        }
        _points[_points.length - 1].x = p.x;

        _discretePoints.push(0, _points.length - 1);

        for (i = p.y + - step; i >= p.y - _b; i -= step) {
            _points.push({
                x: p.x,
                y: i
            });
        }
        _points[_points.length - 1].y = p.y - _b;

        _discretePoints.push(_points.length - 1);

        for (i = _a - step; i >= 0; i -= step) {
            _points.push({
                x: p.x + _a - i,
                y: p.y - _b
            });
        }
        _points[_points.length - 1].x = p.x + _a;

        _discretePoints.push(_points.length - 1);

        var nLeft = _n - _points.length + 1,
            angleStep = (2 * Math.PI - _alpha) / nLeft,
            x0 = _a + hordX + p.x,
            y0 = p.y - _delta - _radius,
            rotateAngle = Math.PI / 2 + _alpha;

        for (i = Math.PI / 2 + _alpha + angleStep; i <= 2.5 * Math.PI; i += angleStep) {
            var tempX = _radius * Math.cos(i),
                tempY = _radius * Math.sin(i);
            _points.push({
                x: x0 + tempX,
                y: y0 + tempY
            });
        }
        _points[_points.length - 1] = {
            x: p.x + _a + hordX,
            y: p.y - _delta
        };

        _discretePoints.push(_points.length - 1);
    }
};

Contour.RADIUS = 1;