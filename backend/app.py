from flask import Flask, request, Response
import socket
import threading
import time
import json
from flask_cors import CORS
import os  # <-- nécessaire pour récupérer la variable d'environnement PORT

app = Flask(__name__)
CORS(app)

def scan_port(ip, port):
    try:
        sock = socket.socket()
        sock.settimeout(0.5)
        sock.connect((ip, port))
        try:
            service = socket.getservbyport(port, "tcp")
        except:
            service = "Inconnu"
        sock.close()
        print(f"Port {port} ouvert, service: {service}")  # LOG ici
        return {"port": port, "status": "open", "service": service}
    except Exception as e:
        return None

@app.route("/scan-stream", methods=["GET"])
def scan_stream():
    ip = request.args.get("target", "127.0.0.1")
    port_range = request.args.get("portRange", "20-100")
    threads_count = int(request.args.get("threads", 10))

    try:
        start_port, end_port = map(int, port_range.split("-"))
        start_port = max(1, start_port)
        end_port = min(65535, end_port)
    except:
        start_port, end_port = 20, 100

    def generate():
        sem = threading.Semaphore(threads_count)
        results = []
        results_lock = threading.Lock()

        def worker(p):
            with sem:
                res = scan_port(ip, p)
                if res:
                    with results_lock:
                        results.append(res)

        threads = []
        for port in range(start_port, end_port + 1):
            t = threading.Thread(target=worker, args=(port,))
            t.start()
            threads.append(t)

        sent_ports = set()
        while any(t.is_alive() for t in threads) or len(sent_ports) < len(results):
            with results_lock:
                new_results = [r for r in results if r["port"] not in sent_ports]
            for r in new_results:
                yield f"data: {json.dumps(r)}\n\n"
                sent_ports.add(r["port"])
            time.sleep(0.1)

        yield "event: done\ndata: Scan terminé\n\n"

    return Response(generate(), mimetype="text/event-stream")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # <-- récupère le port Render
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)
