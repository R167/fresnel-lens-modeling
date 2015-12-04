var canvas = document.getElementById("main_canvas");
var ctx = canvas.getContext("2d");
var debug = false;
var offset = 0;
var light = {
    x: 450,
    y: 300,
    radius: 7,
    beams: 16
};

var lens = {
    x: light.x,
    y: light.y,
    distance: 50,
    height: 500,
    width: 10,
    divisions: 3,
    segments: 100,
    ior: 1.512,
    sections: [],
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function lightSource() {
    ctx.beginPath();
    ctx.fillStyle = "yellow";
    ctx.lineStyle = "black";
    ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function drawLens() {
    ctx.beginPath();
    ctx.lineStyle = "black";
    ctx.moveTo(lens.x + lens.distance + lens.width, lens.y + lens.height / 2);
    ctx.lineTo(lens.x + lens.distance, lens.y + lens.height / 2);
    ctx.lineTo(lens.x + lens.distance, lens.y - lens.height / 2);
    ctx.lineTo(lens.x + lens.distance + lens.width, lens.y - lens.height / 2);
    for (coords in lens.sections) {
        ctx.lineTo(lens.sections[coords].x, lens.sections[coords].y);
        if (debug) {
            ctx.lineTo(lens.x + lens.distance, lens.sections[coords].y);
            ctx.moveTo(lens.sections[coords].x, lens.sections[coords].y);
        }
    }
    ctx.closePath();
    ctx.stroke();
    if (debug) {
        for (coords in lens.sections) {
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.arc(lens.sections[coords].x, lens.sections[coords].y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function lightBeams() {
    var division = (lens.height - 2 * offset) / light.beams;
    var top = lens.y - lens.height / 2 + division / 2 + offset;
    var currentSegment = 1;
    ctx.beginPath();
    for (distance = 0; distance < light.beams; distance++) {
        var x = lens.x + lens.distance,
            y = top + division * distance,
            angle = Math.atan((y - light.y) / (x - light.x));
        ctx.moveTo(light.x, light.y);
        ctx.lineTo(x, y);
        newAngle = refract(angle, Math.PI / 2, 1, lens.ior);
        var backup = currentSegment;
        var p1 = {
            x: x,
            y: y
        };
        var p2 = {
            x: Math.cos(newAngle) * 1500 + x,
            y: Math.sin(-newAngle) * 1500 + y
        };
        var found = false,
            result;
        while (currentSegment < lens.sections.length && !found) {
            found = doLineSegmentsIntersect(p1, p2, lens.sections[currentSegment - 1], lens.sections[currentSegment]);
            currentSegment++;
        }
        currentSegment--;
        if (found) {
            var result = checkLineIntersection(p1, p2, lens.sections[currentSegment - 1], lens.sections[currentSegment])
            ctx.lineTo(result.x, result.y)
            ctx.lineTo(1000, result.y)
        } else {
            //ctx.lineTo(p2.x, p2.y);
            console.log("FAILED TO INTERSECT!");
            currentSegment = backup;
        }
    }
    ctx.stroke();
}

// broken
function lightBeamsRadial() {
    var top = lens.y - lens.height / 2;
    var upper = Math.atan((light.y - top) / (lens.x + lens.distance - light.x));
    var lower = Math.atan((top + lens.height - light.y) / (lens.x + lens.distance - light.x));
    var division = (upper + lower) / light.beams;
    ctx.beginPath();
    for (distance = 0; distance < light.beams; distance++) {
        var x = lens.x + lens.distance,
            y = top + lens.height / 2 + (x - light.x) * Math.tan(division * distance - upper),
            angle = Math.atan((y - light.y) / (x - light.x));
        console.log(y);
        ctx.moveTo(light.x, light.y);
        ctx.lineTo(x, y);
        newAngle = refract(angle, Math.PI / 2, 1, lens.ior);
        ctx.lineTo(Math.cos(newAngle) * 150 + x, Math.sin(-newAngle) * 150 + y);
    }
    ctx.stroke();
}

function refract(angle, surfaceAngle, ior1, ior2) {
    normal = surfaceAngle + Math.PI / 2;
    angle -= normal;
    return Math.asin(ior1 * Math.sin(angle) / ior2) - Math.PI + normal;
}

function refract2(angle1, angle2, ior1, ior2) {
    var difference = angle1 - angle2 - Math.PI;
    var offset = - Math.atan(Math.sin(difference) / (ior1 / ior2 - Math.cos(difference)))
    return angle1 + offset - Math.PI / 2;
}

function computeLens() {
    var top = lens.y - lens.height / 2;
    lens.sections = [{
        x: 0,
        y: 0
    }];
    var total = 0;
    var bust = 0;
    var division = (lens.height - offset * 2) / lens.segments;
    var previousX = 0;
    for (distance = 0; distance <= lens.segments; distance++) {
        var x = lens.x + lens.distance + lens.width,
            y = top + offset + division * distance,
            angle = Math.atan((y - light.y) / (x - light.x));
        var newAngle = refract(angle, Math.PI / 2, 1, lens.ior);
        var nextAngle = refract2(newAngle, 0, lens.ior, 1);
        var offsetX = Math.cos(nextAngle);
        var offsetY = Math.sin(nextAngle);
        if (offsetX > 0) {
            bust -= offsetX;
        }
        total += offsetY;
        lens.sections.push({
            x: offsetX,
            y: offsetY
        });
    }
    var ratio = lens.height / total;
    bust *= ratio;
    var lensBase = lens.x + lens.distance + lens.width;
    var previous = {
        x: lensBase,
        y: top
    };
    var maxX = bust / lens.divisions + lensBase;
    if (debug) {
        ctx.beginPath();
        ctx.moveTo(maxX, 0);
        ctx.lineTo(maxX, 600);
        ctx.stroke();
    }
    var max = lens.sections.length;
    for (i = 0; i < max; i++) {
        lens.sections[i].x = previous.x - lens.sections[i].x * ratio;
        previous.x = lens.sections[i].x;
        lens.sections[i].y = previous.y + lens.sections[i].y * ratio;
        previous.y = lens.sections[i].y;
        if (previous.x > maxX + 0.1) {
            max++;
            i++;
            lens.sections.splice(i, 0, {
                x: lensBase,
                y: previous.y
            });
            previous.x = lensBase;
        } else if (previous.x < lensBase - 0.1) {
            max++;
            i++;
            lens.sections.splice(i, 0, {
                x: maxX,
                y: previous.y
            });
            previous.x = maxX;
        }
    }
}

function computeOffset() {
    var top = lens.y - lens.height / 2;
    for (i = 0; i < lens.height / 2; i += 0.1) {
        var x = lens.x + lens.distance,
            y = top + i,
            angle = Math.atan((y - light.y) / (x - light.x));
        var newAngle = refract(angle, Math.PI / 2, 1, lens.ior);
        if (top < y - lens.width * Math.tan(newAngle)) {
            offset = i;
            break;
        }
    }
}

var followMouse = false;

function controlMouse(button) {
    followMouse = !followMouse;
    if (followMouse) {
        button.value = 'following';
    } else {
        button.value = 'not following';
    }
}

function redraw() {
    computeOffset();
    clearCanvas();
    computeLens();
    drawLens();
    lightBeams();
    lightSource();
    var divisor = followMouse ? 20 : 1;
    setTimeout(redraw, 1000 / divisor);
}

function setXY(event) {
    if (followMouse) {
        var rect = canvas.getBoundingClientRect();
        var newX = (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
        if (newX < lens.x + lens.distance) {
            light.x = newX;
        }
    }
}

redraw();
