$(function () {
  var current = 0;

  // Phases: [targetPercent, msPerStep]
  var phases = [
    [28,  16],
    [52,  24],
    [74,  30],
    [91,  38],
    [100, 12]
  ];

  function animateTo(target, delay, done) {
    function step() {
      if (current < target) {
        current++;
        $('.loader-bar-fill').css('width', current + '%');
        $('.loader-percent').text(current + '%');
        setTimeout(step, delay);
      } else {
        done && done();
      }
    }
    step();
  }

  function runPhases(i) {
    if (i >= phases.length) {
      // Finished — flash done color, then fade out loader
      $('.loader-percent').addClass('done');
      setTimeout(function () {
        $('#loader').addClass('hide');
        // Wait for fade-out transition, then show content
        setTimeout(function () {
          $('#loader').hide();
          $('#content').addClass('visible');
        }, 700);
      }, 350);
      return;
    }
    animateTo(phases[i][0], phases[i][1], function () {
      setTimeout(function () { runPhases(i + 1); }, 100);
    });
  }

  // Kick off after a short initial pause
  setTimeout(function () { runPhases(0); }, 250);
});
$(function () {
 
      // Toggle menu open/close
      $('#menuBtn').on('click', function () {
        var isOpen = $('#drawer').toggleClass('open').hasClass('open');
        $(this).toggleClass('open', isOpen);
        $(this).attr('aria-expanded', isOpen);
        $('body').css('overflow', isOpen ? 'hidden' : '');
      });
 
      // Close drawer when any nav link is clicked
      $('#drawer a').on('click', function () {
        $('#drawer').removeClass('open');
        $('#menuBtn').removeClass('open');
        $('body').css('overflow', '');
      });
 
    });