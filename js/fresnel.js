var canvas = document.getElementById("main_canvas");
var ctx = canvas.getContext("2d");
var debug = {
    normal: false,
    trace: false,
    max: false,
};

debug.on = (function () {
    for (key in debug) {
        if (typeof debug[key] == 'boolean') {
            debug[key] = true;
        }
    }
});

debug.off = (function () {
    for (key in debug) {
        if (typeof debug[key] == 'boolean') {
            debug[key] = false;
        }
    }
});

var offset = 0;
var light = {
    x: 350,
    y: 300,
    radius: 10,
    beams: {
        count: 16,
        gap: 20,
        span: 20,
        delta: 10,
    }
};

var lens = {
    x: light.x,
    y: light.y,
    distance: 150,
    height: 500,
    width: 10,
    divisions: 4,
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
        if (debug.trace) {
            ctx.lineTo(lens.x + lens.distance, lens.sections[coords].y);
            ctx.moveTo(lens.sections[coords].x, lens.sections[coords].y);
        }
    }
    ctx.closePath();
    ctx.fillStyle = "#efefef";
    ctx.fill();
    ctx.lineStyle = "#000000";
    ctx.stroke();
    if (debug.trace) {
        for (coords in lens.sections) {
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.arc(lens.sections[coords].x, lens.sections[coords].y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawFollowArea() {
    if (followMouse) {
        ctx.fillStyle = "rgba(195, 48, 48, 0.41)";
        ctx.fillRect(0, lens.y - lens.height / 4, lens.x + lens.distance, lens.height / 2);
    }
}

function lightBeams() {
    ctx.lineStyle = "#000000";
    var division = (lens.height - 2 * offset) / light.beams.count;
    var top = lens.y - lens.height / 2 + division / 2 + offset;
    ctx.beginPath();
    for (distance = 0; distance < light.beams.count; distance++) {
        var x = lens.x + lens.distance,
            y = top + division * distance,
            angle = Math.atan((y - light.y) / (x - light.x));
        ctx.moveTo(light.x, light.y);
        ctx.lineTo(x, y);
        if (debug.normal) {
            var normal = 0;
            ctx.moveTo(x - 20, y)
            ctx.lineTo(x + 20, y)
            ctx.moveTo(x, y);
        }
        newAngle = refract(angle, Math.PI / 2, 1, lens.ior);
        var p1 = {
            x: x,
            y: y
        };
        var p2 = {
            x: Math.cos(newAngle) * 1500 + x,
            y: Math.sin(-newAngle) * 1500 + y
        };
        var found = false,
            p3,
            p4,
            result = {
                distance: Infinity,
                p3: undefined,
                p4: undefined
            };
        for (currentSegment = 1; currentSegment < lens.sections.length; currentSegment++) {
            p3 = lens.sections[currentSegment - 1];
            p4 = lens.sections[currentSegment];
            newResult = checkLineIntersection(p1, p2, p3, p4);
            if (newResult.onLine1 && newResult.onLine2) {
                found = true;
                newResult.distance = pointDistance(p1, newResult);
                if (newResult.distance < result.distance) {
                    result = newResult;
                    result.p3 = p3;
                    result.p4 = p4;
                }
            }
        }
        if (found) {
            ctx.lineTo(result.x, result.y);
            if (debug.normal) {
                var normal = -Math.atan((result.p4.y - result.p3.y) / (result.p4.x - result.p3.x)) + Math.PI / 2;
                ctx.moveTo(result.x - Math.cos(normal) * 20, result.y + Math.sin(normal) * 20)
                ctx.lineTo(result.x + Math.cos(normal) * 20, result.y - Math.sin(normal) * 20)
                ctx.moveTo(result.x, result.y);
            }
            ctx.lineTo(1500, result.y)
        } else {
            console.log("FAILED TO INTERSECT!");
        }
    }
    ctx.stroke();
}

function refractBroken(angle, surfaceAngle, ior1, ior2) {
    angle = normalize(angle);
    var normal = normalize(surfaceAngle - Math.PI / 2);
    if (normal > Math.PI) {
        normal -= Math.PI;
    }
    if (Math.abs(normal - angle) < Math.PI / 2 && angle > Math.PI / 2 && angle < Math.PI / 2 * 3) {
        logAngle(normal, "problem")
    }
    var angleA;
    if (normal > angle && normal <= angle + Math.PI) {
        angleA = normal - angle;
    } else {
        angleA = angle - normal;
    }
    return normal - Math.asin(ior1 / ior2 * Math.sin(angleA));
}

function refract(angle, surfaceAngle, ior1, ior2) {
    normal = surfaceAngle + Math.PI / 2;
    angle -= normal;
    return Math.asin(ior1 * Math.sin(angle) / ior2) - Math.PI + normal;
}

function refract2(angle1, angle2, ior1, ior2) {
    var difference = angle1 - angle2 - Math.PI;
    var offset = -Math.atan(Math.sin(difference) / (ior1 / ior2 - Math.cos(difference)))
    return angle1 + offset - Math.PI / 2;
}

function normalize(angle) {
    return (angle + 2 * Math.PI) % (2 * Math.PI);
}

function logAngle(angle, name) {
    angle = normalize(angle);
    console.log({
        rad: angle,
        deg: angle * 180 / Math.PI,
        name: name
    });
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
    if (debug.max) {
        ctx.beginPath();
        ctx.moveTo(maxX, 0);
        ctx.lineTo(maxX, 1000);
        ctx.stroke();
    }
    var max = lens.sections.length;
    var p1 = {
            x: maxX,
            y: top - 1
        },
        p2 = {
            x: maxX,
            y: top + lens.height + 1
        };
    var p3 = {
            x: lensBase,
            y: top - 1
        },
        p4 = {
            x: lensBase,
            y: top + lens.height + 1
        };
    for (i = 0; i < max; i++) {
        lens.sections[i].x = previous.x - lens.sections[i].x * ratio;
        previous.x = lens.sections[i].x;
        lens.sections[i].y = previous.y + lens.sections[i].y * ratio;
        previous.y = lens.sections[i].y;
        if (previous.x > maxX + 0.00000001 && i != 0) {
            var result = checkLineIntersection(lens.sections[i - 1], lens.sections[i], p1, p2)
            lens.sections[i].x = result.x;
            lens.sections[i].y = result.y;
            max++;
            i++;
            lens.sections.splice(i, 0, {
                x: lensBase,
                y: result.y
            });
            max++;
            i++;
            lens.sections.splice(i, 0, {
                x: previous.x - result.x + lensBase,
                y: previous.y
            });
            previous.x = previous.x - result.x + lensBase;
        } else if (previous.x < lensBase && i != max - 1) {
            var result = checkLineIntersection(lens.sections[i - 1], lens.sections[i], p3, p4)
            lens.sections[i].x = result.x;
            lens.sections[i].y = result.y;
            max++;
            i++;
            lens.sections.splice(i, 0, {
                x: maxX,
                y: result.y
            });
            max++;
            i++;
            lens.sections.splice(i, 0, {
                x: maxX + previous.x - result.x,
                y: previous.y
            });
            previous.x = maxX + previous.x - result.x;
        }
    }
}

var marchOffset = 0;

function march(lineFunction) {
    ctx.setLineDash([light.beams.span, light.beams.gap]);
    marchOffset = (marchOffset + light.beams.delta / 10.0) % (light.beams.span + light.beams.gap)
    ctx.lineDashOffset = -marchOffset;
    lineFunction.call();
    ctx.setLineDash([]);
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
var redrawLock = false;
var killLoop = false;
var lineDash = false;

function redraw() {
    if (!redrawLock) {
        redrawLock = true;
        computeOffset();
        clearCanvas();
        drawFollowArea();
        computeLens();
        drawLens();
        if (lineDash) {
            march(lightBeams);
        } else {
            lightBeams();
        }
        lightSource();
        redrawLock = false;
    }
}

function controlMouse(button) {
    followMouse = !followMouse;
    redraw();
    if (followMouse) {
        button.value = 'Following (try the red)';
        killLoop = false;
        if (!lineDash) {
            loop();
        }
    } else {
        button.value = 'Not Following';
        killLoop = !lineDash;
    }
}

function controlMarch(button) {
    lineDash = !lineDash;
    redraw();
    if (lineDash) {
        button.value = 'Moving';
        killLoop = false;
        if (!followMouse) {
            loop();
        }
    } else {
        button.value = 'Not Moving';
        killLoop = !followMouse;
    }
}

function loop() {
    redraw();
    if (killLoop) {
        killLoop = false;
    } else {
        setTimeout(loop, 1000 / 20.0);
    }
}

function setXY(event) {
    if (followMouse) {
        var rect = canvas.getBoundingClientRect();
        var newX = (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
        var newY = (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
        if (newX < lens.x + lens.distance - 20 && newY > lens.y - lens.height / 4 && newY < lens.y + lens.height / 4) {
            light.x = newX;
        }
    }
}
