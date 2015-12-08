(function ($) {
    $(window).resize(fixCanvas);

    function fixCanvas() {
        var canvas = document.getElementById("main_canvas");
        var height = $(window).height() - 10;
        canvas.width = $('#canvas_container').width();
        canvas.height = height;
        light.y = canvas.height / 2;
        lens.y = canvas.height / 2;
        $('#height').attr('max', height - 4);
        if (lens.height > height - 4) {
            lens.height = height - 4;
            $('#height').attr('value', height - 4);
            $('#height-count').text('Height: ' + (height - 4));
        }
        redraw();
    }

    function forceBounds(id, min, max) {
        var slider = $('#' + id);
        var counter = $('#' + id + '-count');
        if (!!min) {
            if (parseInt(slider.val()) < min) {
                slider.val(min);
                counter.text(id + ': ' + min);
                lens[id] = min;
            }
            slider.attr('min', min);
        }
        if (!!max) {
            if (!!max && parseInt(slider.val()) > max) {
                slider.val(max);
                counter.text(id + ': ' + max);
                lens[id] = max;
            }
            slider.attr('max', max);
        }
    }

    fixCanvas();

    $('.slider').change(function () {
        var slider = $(this);
        var id = slider.attr('id');
        var counter = $('#' + id + '-count');
        var text = id;
        var matchData = id.match(/beams-(\w+)/);

        if (matchData) {
            light.beams[matchData[1]] = parseInt(slider.val());
            text = 'Beam ' + matchData[1];
        } else {
            lens[id] = parseInt(slider.val());
        }

        counter.text(text + ': ' + slider.val());

        switch (id) {
        case 'divisions':
            forceBounds('segments', parseInt(slider.val()) * 5);
            break;
        default:
        }

        redraw();
    })
})(jQuery);
