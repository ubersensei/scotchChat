$(document).ready(function () {

//    var socket; // a global variable.

    var socket = io('http://localhost:8081/', {reconnection: false});
    var intervalID;
    var reconnectCount = 0;


    $('#chatButton').click(function () {
        if ($('#chat input').val() != "") {
            socket.emit('chat', JSON.stringify({msg: $('#chat input').val()}));
            $('#chat input').val('');
        }
    });


    socket.emit('join', JSON.stringify({}));

    socket.on('connect', function () {
        console.log('connected');
    });
    socket.on('connecting', function () {
        console.log('connecting');
    });
    socket.on('disconnect', function () {
        console.log('disconnect');
        intervalID = setInterval(tryReconnect, 4000);
    });
    socket.on('connect_failed', function () {
        console.log('connect_failed');
    });
    socket.on('error', function (err) {
        console.log('error: ' + err);
    });
    socket.on('reconnect_failed', function () {
        console.log('reconnect_failed');
    });
    socket.on('reconnect', function () {
        console.log('reconnected ');
    });
    socket.on('reconnecting', function () {
        console.log('reconnecting');
    });


    var tryReconnect = function () {
        ++reconnectCount;
        if (reconnectCount == 5) {
            clearInterval(intervalID);
        }
        console.log('Making a dummy http call to set jsessionid (before we do socket.io reconnect)');
        $.ajax('/regenerateSession')
            .done(function () {
                console.log("http request succeeded");
                //reconnect the socket AFTER we receive jsessionid set
                socket.io.reconnect();
                //                            socket.reconnect();
                clearInterval(intervalID);
                reconnectCount = 0;
            }).error(function (err) {
                console.log("http request failed (probably server not up yet)");
            });
    };


    socket.on('chat', function(message){
        var content;
        var chatMessage = JSON.parse(message);

        if (chatMessage.category == "join") {
            content = chatMessage.user + chatMessage.msg;
        }

        if (chatMessage.category == "chat") {
            content = chatMessage.user + " says: " + chatMessage.msg;
        }

        // what if you cannot handle the message ? validation
        $('#messages').append($('<li>').text(content));
    });


});