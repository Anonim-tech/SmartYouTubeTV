/**
 * Imitates the end of the video.
 */
function PlaybackEndAddon() {
    this.TAG = 'PlaybackEndAddon';
    this.videoId = '';

    this.onInit = function(video) {
        this.initProps(video);
        this.addAdditionalFunctions(video);
    };

    this.onSrcChange = function(video) {
        // Src may be changed after video is closed.
        // Ignore such events.
        if (YouTubeUtils.isPlayerOpened()) {
            this.imitatePlaying(video);
        }
    };

    this.checkUrlChanged = function() {
        var params = Utils.getQueryParams(location.href);

        if (params.v && params.v != this.videoId) {
            Log.d(this.TAG, "Video id is changed!");
            this.videoId = params.v;
            return true;
        }

        return false;
    };

    this.initProps = function(video) {
        PlaybackStateUtil.justCreated(video);
    };

    this.addAdditionalFunctions = function(video) {
        var $this = this;

        video.imitatePlaying = function() {
            Log.d($this.TAG, "Pretending that there is a video playback. Needed to make suggestions working.");
            $this.imitatePlayingCheck(video);
        };

        video.imitateEnding = function() {
            Log.d($this.TAG, "End of the video is reached...");
            $this.imitateEndingIntCheck(video);
        };

        video.imitatePosition = function(pos, length) {
            Log.d($this.TAG, "Changing position of the video...");
            $this.imitatePositionIntCheck(video, pos, length);
        };

        video.backPressed = function() {
            Log.d($this.TAG, "User pressed back button...");
            PlaybackEndAddon.playbackStarted = false;

            PlaybackStateUtil.videoClosed(video);
        };
    };

    this.checkLocking = function(fn) {
        var $this = this;

        if (PlaybackEndAddon.locked) {
            setTimeout(function() {
                Log.d($this.TAG, "Check locking..." + fn);
                $this.checkLocking(fn);
            }, 3000);
        } else {
            PlaybackEndAddon.locked = true;
            fn();
        }
    };

    this.imitatePlayingCheck = function(video) {
        var $this = this;

        this.checkLocking(function() {
            $this.imitatePlaying(video);
        });
    };

    this.imitatePlaying = function(video) {
        var i = 0;
        var $this = this;

        PlaybackStateUtil.startPlaying(video);

        var interval = setInterval(function() {
            Log.d($this.TAG, "imitatePlaying: duration: " + video.duration + ", currentTime: " + video.currentTime);

            if (i > 3) {
                clearInterval(interval);
                PlaybackEndAddon.locked = false; // reset lock!!!
                PlaybackEndAddon.playbackStarted = true;

                return;
            } else {
                i++;
            }

            video.properties.currentTime++;

            video.listeners['pause'][0]({type: 'pause', isTrusted: true});
            video.listeners['timeupdate'][0]({type: 'timeupdate', isTrusted: true});
        }, 100);
    };

    this.imitateEndingIntCheck = function(video) {
        var $this = this;

        if (!PlaybackEndAddon.playbackStarted) {
            Log.d(this.TAG, "Playback not properly started");
            this.imitatePlayingCheck(video);
        }

        this.checkLocking(function() {
            $this.imitateEndingInt(video);
        });
    };

    /**
     * VIDEO EVENTS: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#Events
     */
    this.imitateEndingInt = function(video) {
        var i = 0;
        var $this = this;
        var url = location.href;

        PlaybackStateUtil.endReached(video);

        var interval = setInterval(function() {
            Log.d($this.TAG, "imitateEndingInt: duration: " + video.duration + ", currentTime: " + video.currentTime);

            var urlChanged = location.href != url;

            if (i >= 3 || urlChanged) {
                Log.d($this.TAG, "Url changed? " + urlChanged);

                clearInterval(interval);
                PlaybackEndAddon.locked = false; // reset lock!!!
                PlaybackEndAddon.playbackStarted = false;

                PlaybackStateUtil.videoClosed(video);

                return;
            } else {
                i++;
            }

            // test
            //video.listeners['play'][0]({type: 'play', isTrusted: true});
            //video.listeners['progress'][0]({type: 'progress', isTrusted: true});

            video.listeners['pause'][0]({type: 'pause', isTrusted: true});
            // imitate ending, note that currentTime should be equals to duration
            video.listeners['timeupdate'][0]({type: 'timeupdate', isTrusted: true});

            //video.listeners['ended'][0]({type: 'ended', isTrusted: true});
        }, 100);
    };

    this.imitatePositionIntCheck = function(video, pos, length) {
        var $this = this;

        this.checkLocking(function() {
            $this.imitatePositionInt(video, pos, length);
        });
    };

    /**
     * VIDEO EVENTS: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#Events
     */
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
            Log.d($this.TAG, "imitatePositionInt: duration: " + video.duration + ", currentTime: " + video.currentTime);

            var urlChanged = location.href != url;

            if (i >= 3 || urlChanged) {
                clearInterval(interval);
                PlaybackEndAddon.locked = false; // reset lock!!!

                // do cleanup, prepare for playing
                // video.properties.currentTime = curTime;
                // video.properties.duration = duration;
                // video.properties.paused = false;
                return;
            } else {
                i++;
            }

            // test
            //video.listeners['play'][0]({type: 'play', isTrusted: true});
            //video.listeners['progress'][0]({type: 'progress', isTrusted: true});

            //video.listeners['durationchange'][0]({type: 'durationchange', isTrusted: true});

            // prevent playback from ending while in the background
            video.listeners['pause'][0]({type: 'pause', isTrusted: true});
            // imitate playing
            video.listeners['timeupdate'][0]({type: 'timeupdate', isTrusted: true});
        }, 100);
    };
}
