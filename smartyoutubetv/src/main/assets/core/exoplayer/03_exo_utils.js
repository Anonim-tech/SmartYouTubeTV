console.log("Scripts::Running core script exo_utils.js");

/**
 * Note: if you intend to rename this var don't forget to do the same inside
 * <b>GetButtonStatesCommand</b> and <b>SyncButtonsCommand</b> classes<br/>
 *
 * Usage: <b>PressCommandBase.java</b><br/>
 * <code>ExoUtils.triggerEvent(ExoUtils.$('%s'), 'keyup', 13);</code><br/>
 *
 * Usage: <b>PressCommandBase.java</b><br/>
 * <code>ExoUtils.isDisabled(targetButton) && app && app.onGenericBooleanResult(false, %s);</code>
 * @constructor empty
 */
var ExoUtils = {
    TAG: 'ExoUtils',
    ACTION_CLOSE_SUGGESTIONS: "action_close_suggestions",
    ACTION_PLAYBACK_STARTED: "action_playback_started",

    // events order:
    // emptied
    // play
    // loadstart
    // loadedmetadata
    // loadeddata (first frame of the video has been loaded)
    // playing
    preparePlayer: function() {
        var $this = this;
        var player = Utils.$('video');
        var onPlayDelayMS = 2000;
        var onLoadDelayMS = 1000;

        if (!player || player.preparePlayerDone)
            return;

        // we can't pause video because history will not work
        function onLoad() {
            Log.d($this.TAG, 'preparePlayer: video has been loaded into webview... force start playback');
            setTimeout(function() {
                player.paused && player.play();
            }, onLoadDelayMS);
        }

        function onPlaying() {
            setTimeout(function() {
                Log.d($this.TAG, "preparePlayer: oops, video not paused yet... doing pause...");
                //$this.sendAction(ExoUtils.ACTION_PLAYBACK_STARTED);
                player.pause(); // prevent background playback
            }, onPlayDelayMS);
        }

        // once player is created it will be reused by other videos
        // 'loadeddata' is first event when video can be muted
        player.addEventListener(DefaultEvents.PLAYER_DATA_LOADED, onLoad, false);
        player.addEventListener(DefaultEvents.PLAYER_PLAYING, onPlaying, false);

        Utils.overrideProp(player, 'volume', 0);

        player.preparePlayerDone = true;
    },

    /**
     * Used when calling through app boundaries.
     */
    getButtonStates: function() {
        YouTubeUtils.hidePlayerBackground();
        YouTubeUtils.disablePlayerSuggestions();
        this.preparePlayer();
        new SuggestionsWatcher(null); // init watcher

        var states = {};

        // NOTE: we can't delay here so process in reverse order
        var reversedKeys = Object.keys(PlayerActivityMapping).reverse();

        for (var idx in reversedKeys) {
            var key = reversedKeys[idx];
            var selector = PlayerActivityMapping[key];
            var btn = ExoButton.fromSelector(selector);
            var newName = PlayerActivity[key];
            var isChecked = btn.getChecked();
            if (isChecked === null) // exclude disabled buttons from result
                continue;
            states[newName] = isChecked;
        }

        states[PlayerActivity.VIDEO_DATE] = YouTubeUtils.getVideoDate();
        states[PlayerActivity.VIDEO_VIEW_COUNT] = YouTubeUtils.getViewCount();
        states[PlayerActivity.SCREEN_WIDTH] = DeviceUtils.getScreenWidth();

        // don't let app to close video player (see ActionsReceiver.java)
        if (window.lastButtonName && window.lastButtonName == PlayerActivity.TRACK_ENDED) {
            states[PlayerActivity.BUTTON_NEXT] = null;
        }

        if (YouTubeUtils.isPlayerClosed()) {
            YouTubeUtils.showPlayerBackground();
        }

        Log.d(this.TAG, "getButtonStates: " + JSON.stringify(states));
        return states;
    },

    /**
     * Used when calling through app boundaries.
     */
    syncButtons: function(states) {
        var $this = this;
        // 'likes not saved' fix
        setTimeout(function() {
            $this.syncButtonsReal(states);
        }, 100);
    },

    syncButtonsReal: function(states) {
        this.preparePlayer();
        new SuggestionsWatcher(null); // init watcher

        window.lastButtonName = null;

        Log.d(this.TAG, "syncButtons: " + JSON.stringify(states));

        for (var key in PlayerActivity) {
            var btnId = PlayerActivity[key];
            var isChecked = states[btnId];
            if (isChecked == undefined) // button gone, removed etc..
                continue;
            var selector = PlayerActivityMapping[key];
            var btn = ExoButton.fromSelector(selector);
            btn.setChecked(isChecked);
        }
    },

    sendAction: function(action) {
        // code that sends string constant to activity
        if (app && app.onGenericStringResult) {
            Log.d(this.TAG, "sending action to the main app: " + action);
            app.onGenericStringResult(action);
        } else {
            Log.d(this.TAG,"app not found");
        }
    }
};