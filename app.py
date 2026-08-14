import asyncio
import paramiko

from fastapi import FastAPI, Request, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles


app = FastAPI()

# Serve /static/*
app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)

templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={}
    )


@app.websocket("/terminal")
async def terminal(websocket: WebSocket):

    await websocket.accept()

    ssh = None
    channel = None
    output_task = None

    try:

        # Receive SSH connection details
        host = await websocket.receive_text()
        port = int(await websocket.receive_text())
        username = await websocket.receive_text()
        password = await websocket.receive_text()

        await websocket.send_text(
            "\r\n\x1b[33mConnecting to SSH server...\x1b[0m\r\n"
        )

        # SSH client
        ssh = paramiko.SSHClient()

        ssh.set_missing_host_key_policy(
            paramiko.AutoAddPolicy()
        )

        # Connect to SSH server
        ssh.connect(
            hostname=host,
            port=port,
            username=username,
            password=password,
            timeout=10,
            look_for_keys=False,
            allow_agent=False
        )

        await websocket.send_text(
            "\r\n\x1b[32mSSH connected successfully!\x1b[0m\r\n\r\n"
        )

        # Interactive shell
        channel = ssh.invoke_shell(
            term="xterm",
            width=120,
            height=40
        )

        channel.settimeout(0.1)

        async def read_ssh_output():

            while True:

                try:

                    if channel.recv_ready():

                        data = channel.recv(4096)

                        if data:

                            await websocket.send_text(
                                data.decode(
                                    errors="ignore"
                                )
                            )

                except Exception:

                    break

                await asyncio.sleep(0.01)

        output_task = asyncio.create_task(
            read_ssh_output()
        )

        # Browser -> SSH
        while True:

            data = await websocket.receive_text()

            if channel:

                channel.send(data)

    except paramiko.AuthenticationException:

        try:

            await websocket.send_text(
                "\r\n\x1b[31mSSH authentication failed.\x1b[0m\r\n"
            )

        except Exception:
            pass

    except paramiko.SSHException as e:

        try:

            await websocket.send_text(
                f"\r\n\x1b[31mSSH error: {e}\x1b[0m\r\n"
            )

        except Exception:
            pass

    except Exception as e:

        try:

            await websocket.send_text(
                f"\r\n\x1b[31mConnection error: {e}\x1b[0m\r\n"
            )

        except Exception:
            pass

    finally:

        if output_task:

            output_task.cancel()

        if channel:

            try:
                channel.close()
            except Exception:
                pass

        if ssh:

            try:
                ssh.close()
            except Exception:
                pass
