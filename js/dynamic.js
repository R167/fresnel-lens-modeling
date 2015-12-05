(function($) {
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

    fixCanvas();

    $('.slider').change(function() {
        var slider = $(this);
        var id = slider.attr('id');
        var counter = $('#' + id + '-count');

        if (id == 'beams') {
            light.beams = parseInt(slider.val());
        } else {
            lens[id] = parseInt(slider.val());
        }

        counter.text(id + ': ' + slider.val());
        redraw();
    })
})(jQuery);
