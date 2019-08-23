/**
 * Imitates the end of the video.
 */
function PlaybackEndAddon() {
    this.TAG = 'PlaybackEndAddon';

    this.onInit = function(video) {
        this.initProps(video);
        this.addAdditionalFunctions(video);
    };

    this.onSrcChange = function(video) {
        this.imitatePlaying(video);
    };

    this.initProps = function(video) {
        video.properties.webkitDecodedFrameCount = 500;
        video.properties.webkitAudioDecodedByteCount = 203004;
        video.properties.webkitVideoDecodedByteCount = 2898507;
        video.properties.networkState = 2;
        video.properties.readyState = 4;
        video.properties.paused = false;

        // ??
        video.properties.videoWidth = 1280;
        video.properties.videoHeight = 1280;

        video.properties.baseURI = 'https://www.youtube.com/tv#/watch/video/idle?v=bR66Yyj3p48&resume';
        video.properties.currentSrc = 'blob:https://www.youtube.com/2abe4fbe-1ff7-456c-9dc5-a28539e2035d';

        video.properties.duration = 749;

        // video.properties.currentTime = 21.665161;
        video.properties.src = 'blob:https://www.youtube.com/2abe4fbe-1ff7-456c-9dc5-a28539e2035d';
    };

    this.addAdditionalFunctions = function(video) {
        var $this = this;
        video.imitateEnding = function() {
            Log.d($this.TAG, "End of the video is reached...");
            $this.imitateEndingInt(video);
        };

        video.imitatePosition = function(pos, length) {
            Log.d($this.TAG, "Changing position of the video...");
            $this.imitatePositionInt(video, pos, length);
        };
    };

    this.imitatePlaying = function(video) {
        var i = 0;
        var $this = this;
        video.properties.currentTime = 0;
        video.properties.paused = false;
        video.properties.ended = false;
        var interval = setInterval(function() {
            Log.d($this.TAG, "imitatePlaying...");

            if (i > 3) {
                clearInterval(interval);
                return;
            } else {
                i++;
            }

            video.properties.currentTime++;
            video.listeners['pause'][0]({type: 'pause', isTrusted: true});
            video.listeners['timeupdate'][0]({type: 'timeupdate', isTrusted: true});
        }, 100);
    };

    this.imitateEndingInt = function(video) {
        var i = 0;
        var $this = this;
        var curTime = video.properties.currentTime;
        var url = location.href;
        video.properties.currentTime = video.properties.duration;
        video.properties.paused = true;
        video.properties.ended = true;
        var interval = setInterval(function() {
            Log.d($this.TAG, "imitateEndingInt...");

            var urlChanged = location.href != url;

            if (i >= 3 || urlChanged) {
                clearInterval(interval);

                // do cleanup, prepare for playing
                video.properties.currentTime = curTime;
                video.properties.paused = false;
                video.properties.ended = false;
                return;
            } else {
                i++;
            }

            video.listeners['pause'][0]({type: 'pause', isTrusted: true});
            video.listeners['timeupdate'][0]({type: 'timeupdate', isTrusted: true});
        }, 100);
    };

    this.imitatePositionInt = function(video, pos, length) {
        var i = 0;
        var $this = this;
        var curTime = video.properties.currentTime;
        var duration = video.properties.duration;
        var url = location.href;
        video.properties.currentTime = pos;
        video.properties.duration = length;
        video.properties.paused = true;
        var interval = setInterval(function() {
            Log.d($this.TAG, "imitatePositionInt");

            var urlChanged = location.href != url;

            if (i >= 3 || urlChanged) {
                clearInterval(interval);

                // do cleanup, prepare for playing
                // video.properties.currentTime = curTime;
                // video.properties.duration = duration;
                // video.properties.paused = false;
                return;
            } else {
                i++;
            }

            video.listeners['pause'][0]({type: 'pause', isTrusted: true});
            video.listeners['timeupdate'][0]({type: 'timeupdate', isTrusted: true});
        }, 100);
    };
}
