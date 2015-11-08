exports.display = function(){
    //Set these to avoid having to enter them everytime
    var URL = 'wss://httpapi.labs.nuance.com/v1?';

    var APP_ID = "NMDPTRIAL_swirlinq_gmail_com20151106193600";
    var APP_KEY = "ae4f1f5f9029912a6baf42798ca88b2325c4b631cbb954bd992cfb2d5fe7890d36a86dc6d1fef13dae33b63adb415d01061332d1cc878e65b38a9212711b1fa7";
    var USER_ID = "awesome";
    var NLU_TAG = "";
    console.log('Hello from Nuance!');


    var userMedia = undefined;
    navigator.getUserMedia = navigator.getUserMedia
    || navigator.webkitGetUserMedia
    || navigator.mozGetUserMedia
    || navigator.msGetUserMedia;


    if(!navigator.getUserMedia){
        console.log("No getUserMedia Support in this Browser");
    }
    
    navigator.getUserMedia({
        audio:true
    }, function(stream){
        userMedia = stream;
    }, function(error){
        console.error("Could not get User Media: " + error);
    });

    //
    // APP STATE
    var isRecording = false;
    // NODES
    var $content = $('#content');
    var $url = $('#url');
    var $appKey = $('#app_key');
    var $appId = $('#app_id');
    var $userId = $('#user_id');
    var $nluTag = $('#nlu_tag');
    var $textNluTag = $("#text_nlu_tag");
    var $connect = $('#connect');
    var $ttsGo = $('#tts_go');
    var $ttsText = $('#tts_text');
    var $ttsDebug = $('#tts_debug_output');
    var $asrRecord = $('#recordButton');
    var $asrLabel = $('#asr_label');
    var $nluExecute = $('#nlu_go');
    var $asrViz = $('#asr_viz');
    var $asrDebug = $('#asr_debug_output');
    var $nluDebug = $('#nlu_debug_output');
    var $asrVizCtx = $asrViz.get()[0].getContext('2d');

    var dLog = function dLog(msg, logger){
        var d = new Date();
        logger.prepend('<div><em>'+d.toISOString()+'</em> &nbsp; <pre>'+msg+'</pre></div>');
    };


    //
    // Connect
    function connect() {

        // INIT THE SDK
        Nuance.connect({
            appId: APP_ID,
            appKey: APP_KEY,
            userId: USER_ID,
            url: URL,

            onopen: function() {
                console.log("Websocket Opened");
                $content.addClass('connected');
            },
            onclose: function() {
                console.log("Websocket Closed");
                $content.removeClass('connected');
            },
            onmessage: function(msg) {
                if (msg.message == "query_response") {
                    postText(msg);
                }
                if(msg.message == "volume") {
                   viz(msg.volume);
                } else if (msg.result_type == "NMDP_TTS_CMD") {
                    dLog(JSON.stringify(msg, null, 2), $ttsDebug);
                } else if (msg.result_type == "NDSP_ASR_APP_CMD") {
                    if(msg.nlu_interpretation_results.status === 'success'){
                        dLog(JSON.stringify(msg, null, 2), $asrDebug);
                    } else {
                        dLog(JSON.stringify(msg.nlu_interpretation_results.payload.interpretations, null, 2), $asrDebug);
                    }
                } else if (msg.result_type === "NDSP_APP_CMD") {
                    if(msg.nlu_interpretation_results.status === 'success'){
                        dLog(JSON.stringify(msg.nlu_interpretation_results.payload.interpretations, null, 2), $nluDebug);
                    } else {
                        dLog(JSON.stringify(msg, null, 2), $nluDebug);
                    }
                } else if (msg.result_type === "NVC_ASR_CMD"){
                    dLog(JSON.stringify(msg, null, 2), $asrDebug);
                }
            },
            onerror: function(error) {
                console.error(error);
                $content.removeClass('connected');
            }

        });
    };
    $connect.on('click', connect);

    var postText = function (msg) {
        console.log("-------------------NUANCE-----------------");
        console.log(msg);
        console.log(msg.transcriptions[0]);
        console.log('Sending text to server');
        $('#response').hide();
        $('#response').text(msg.transcriptions[0]);
        $('#response').slideDown(300);
    };

    $url.val(URL || '');
    $appId.val(APP_ID || '');
    $appKey.val(APP_KEY || '');
    $userId.val(USER_ID || '');
    $nluTag.val(NLU_TAG || '');
    $textNluTag.val(NLU_TAG || '');


    // Disconnect
    $(window).unload(function(){
        Nuance.disconnect();
    });




    //
    // TTS
    function tts(evt){
        Nuance.playTTS({
            language: 'eng-USA',
            voice: 'ava',
            text: $ttsText.val()
        });
    };
    $ttsGo.on('click', tts);


    //
    // ASR / NLU
    function asr(evt){
      console.log('Clicked record button');
        if(isRecording) {
            Nuance.stopASR();
            $asrLabel.text('RECORD');
        } else {
            cleanViz();
            console.log('Recording');
            var options = {
                userMedia: userMedia
            };
            if($nluTag.val()) {
                options.nlu = true;
                options.tag = $nluTag.val();
            }
            Nuance.startASR(options);
            $asrLabel.text('STOP RECORDING');
        }
        isRecording = !isRecording;
    };
    $asrRecord.on('click', asr);

    // 
    // NLU / Text
    function textNlu(evt){
        var options = {
            text: $("#nlu_text").val(),
            tag: $textNluTag.val()
        };
        Nuance.startTextNLU(options);
    }
    $nluExecute.on('click', textNlu);

    //
    // ASR Volume visualization

    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                function(callback, element){
                    window.setTimeout(callback, 1000 / 60);
                };
    })();

    var asrVizData = {};
    function cleanViz(){
        var parentWidth = $asrViz.parent().width();
        $asrViz[0].getContext('2d').canvas.width = parentWidth;
        asrVizData = {
            w: parentWidth,
            h: 256,
            col: 0,
            tickWidth: 0.5
        };
        var w = asrVizData.w, h = asrVizData.h;
        $asrVizCtx.clearRect(0, 0, w, h); // TODO: pull out height/width
        $asrVizCtx.strokeStyle = '#333';
        var y = (h/2) + 0.5;
        $asrVizCtx.moveTo(0,y);
        $asrVizCtx.lineTo(w-1,y);
        $asrVizCtx.stroke();
        asrVizData.col = 0;
    };

    function viz(amplitudeArray){
        var h = asrVizData.h;
        requestAnimFrame(function(){
            // Drawing the Time Domain onto the Canvas element
            var min = 999999;
            var max = 0;
            for(var i=0; i<amplitudeArray.length; i++){
                var val = amplitudeArray[i]/asrVizData.h;
                if(val>max){
                    max=val;
                } else if(val<min){
                    min=val;
                }
            }
            var yLow = h - (h*min) - 1;
            var yHigh = h - (h*max) - 1;
            $asrVizCtx.fillStyle = '#6d8f52';
            $asrVizCtx.fillRect(asrVizData.col,yLow,asrVizData.tickWidth,yHigh-yLow);
            asrVizData.col += 1;
            if(asrVizData.col>=asrVizData.w){
                asrVizData.col = 0;
                cleanViz();
            }
        });
    };
    cleanViz();
    connect();

};