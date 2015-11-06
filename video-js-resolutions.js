var PREF_KEY = 'videojs-res-pref';

videojs.plugin('resolutions', function (options) {
  var player = this;

  player.ready(function () {
    var playerEl = player.el();
    var sources = Array.apply(null, playerEl.querySelectorAll('video source'));
    var bucketedSources = {};
    sources.forEach(function (source) {
      var type = source.getAttribute('type');
      bucketedSources[type] || (bucketedSources[type] = []);
      bucketedSources[type].push(source);
    });

    var resolutions = bucketedSources['video/mp4']
    var Html5 = videojs.Html5;

    if (!(Html5.isSupported() && Html5.canPlaySource(resolutions[0]))) {
      return; // we only have multi-res for html5/mp4 video
    }

    var menuItems = resolutions.map(function (resolution, index) {
      return '<li class="vjs-menu-item vjs-selected" role="button" aria-live="polite" tabindex="'+index+'" aria-selected="false">'
      +   resolution.dataset.res
      + '</li>';
    });

    resChangeButton = document.createElement('div');
    resChangeButton.className = 'vjs-resolutions-button vjs-menu-button vjs-control';
    resChangeButton.innerHTML =
      '<div class="vjs-control-content">'
      + '</div>'
      + '<div class="vjs-menu">'
      +   '<ul class="vjs-menu-content">'
      +     menuItems.join('')
      +   '</ul>'
      + '</div>'
    ;


    var controlBar = player.controlBar.el();
    var menu = resChangeButton.querySelector('.vjs-menu');

    controlBar.appendChild(resChangeButton);

    resChangeButton.querySelector('.vjs-control-content').addEventListener('click', toggleMenu);

    Array.apply(null, resChangeButton.querySelectorAll('.vjs-menu-item')).forEach(function (item, index) {
      item.addEventListener('click', function (event) {
         setResolution(resolutions[index]);
      });
    });

    setInitialResolution();

    function toggleMenu () {
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }

    function setResolution (source) {
      menu.style.display = 'none';
      if (this.currentSource === source) {
        player.trigger('resolutionchange');
        return this;
      }

      var currentTime = player.currentTime();
      var remainPaused = player.paused();

      player.pause();
      player.src(''); // Stops download of current source. Only covers Html5
      player.src(source.getAttribute('src'));
      player.ready(function () {
        player.one('loadeddata', function () {
          player.currentTime(currentTime);
        });

        player.trigger('resolutionchange');

        if (!remainPaused) {
          player.load();
          player.play();
        }

        window.localStorage.setItem(PREF_KEY, source.dataset.res);
      });
    };

    function setInitialResolution () {
      var storedPref = window.localStorage.getItem(PREF_KEY);
      if (storedPref) {
        var preferredSource = playerEl.querySelector('video source[data-res="'+storedPref+'"]');
      }
      var source = preferredSource || playerEl.querySelector('video source[data-default=true]');
      if (source) {
        setResolution(source);
      }
    }
  });
});
