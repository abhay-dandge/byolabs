let socket = null;
let terminal = null;


function connect() {

    const host =
        document.getElementById("host").value.trim();

    const port =
        document.getElementById("port").value.trim();

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value;


    if (!host || !port || !username || !password) {

        alert("Please fill all fields.");

        return;
    }


    // Hide login screen

    document.getElementById("login").style.display =
        "none";


    // Show terminal

    document.getElementById("terminal").style.display =
        "block";


    // Create terminal

    terminal = new Terminal({

        cursorBlink: true,

        fontSize: 14,

        convertEol: true,

        scrollback: 5000,

        theme: {

            background: "#000000",

            foreground: "#ffffff",

            cursor: "#ffffff"

        }

    });


    terminal.open(
        document.getElementById("terminal")
    );


    // Determine WebSocket protocol

    const protocol =
        window.location.protocol === "https:"
            ? "wss://"
            : "ws://";


    // Create WebSocket

    socket = new WebSocket(
        protocol +
        window.location.host +
        "/terminal"
    );


    // WebSocket connected

    socket.onopen = function () {

        terminal.write(
            "\x1b[33mConnecting to SSH server...\x1b[0m\r\n"
        );


        // Send SSH information

        socket.send(host);

        socket.send(port);

        socket.send(username);

        socket.send(password);

    };


    // SSH output -> terminal

    socket.onmessage = function(event) {

        terminal.write(
            event.data
        );

    };


    // Keyboard input -> SSH

    terminal.onData(function(data) {

        if (
            socket &&
            socket.readyState === WebSocket.OPEN
        ) {

            socket.send(data);

        }

    });


    // Connection closed

    socket.onclose = function() {

        terminal.write(
            "\r\n\r\n\x1b[31mSSH connection closed.\x1b[0m\r\n"
        );

    };


    // Connection error

    socket.onerror = function() {

        terminal.write(
            "\r\n\r\n\x1b[31mWebSocket connection error.\x1b[0m\r\n"
        );

    };

}
