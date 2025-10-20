from flask import Flask, request, jsonify, send_from_directory
import os
import requests

# Defaults: use the host you provided; allow override via env.
OLLAMA_SCHEME = os.getenv("OLLAMA_SCHEME", "http")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "192.168.50.53")
OLLAMA_PORT = os.getenv("OLLAMA_PORT", "11434")
OLLAMA_BASE = f"{OLLAMA_SCHEME}://{OLLAMA_HOST}:{OLLAMA_PORT}"
# Endpoint used by Ollama for generation -- configurable via env if different
OLLAMA_GENERATE_PATH = os.getenv("OLLAMA_GENERATE_PATH", "/api/generate")
OLLAMA_URL = OLLAMA_BASE + OLLAMA_GENERATE_PATH

DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "my-model")

app = Flask(__name__, static_folder="../frontend", static_url_path="/")


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/models", methods=["GET"])
def list_models():
    """
    Query the local Ollama HTTP API for available models.
    Tries a small set of common endpoints until one succeeds.
    Returns JSON: { "models": ["model1", "model2"] }
    """
    candidates = ["/api/models", "/api/list", "/models", "/list"]
    errors = []
    for path in candidates:
        try:
            url = OLLAMA_BASE + path
            resp = requests.get(url, timeout=10)
            if resp.status_code != 200:
                errors.append((url, resp.status_code))
                continue
            # Try JSON first
            ct = resp.headers.get("Content-Type", "")
            models = []
            if "json" in ct:
                try:
                    body = resp.json()
                    # common shapes: list of names, list of objects, or dict with key 'models'
                    if isinstance(body, list):
                        # could be list of strings or list of dicts
                        if body and isinstance(body[0], dict) and "name" in body[0]:
                            models = [m.get("name") for m in body]
                        else:
                            models = [str(m) for m in body]
                    elif isinstance(body, dict):
                        if "models" in body and isinstance(body["models"], list):
                            models = [m.get("name") if isinstance(m, dict) else str(m) for m in body["models"]]
                        elif "data" in body and isinstance(body["data"], list):
                            # some APIs wrap results in data
                            models = [str(m) for m in body["data"]]
                        else:
                            # try to extract values
                            models = [str(v) for v in body.values()]
                    else:
                        models = []
                except Exception:
                    models = []
            else:
                # fallback: parse plain text lines
                text = resp.text
                lines = [l.strip() for l in text.splitlines() if l.strip()]
                models = lines

            # Normalize and dedupe
            models = [m for m in models if m]
            # final dedupe preserving order
            seen = set()
            out = []
            for m in models:
                if m not in seen:
                    seen.add(m)
                    out.append(m)
            if out:
                return jsonify({"models": out}), 200
        except Exception as e:
            errors.append((path, str(e)))
            continue

    return jsonify({"models": [], "error": "Unable to list models", "tried": candidates, "errors": errors}), 502


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Proxy endpoint:
    Expects JSON: { "prompt": "...", "model": "optional-model-name", "max_tokens": 512 }
    Forwards request to the local Ollama HTTP API and returns its response.
    """
    body = request.get_json(force=True, silent=True) or {}
    prompt = body.get("prompt", "")
    model = body.get("model", DEFAULT_MODEL)
    max_tokens = body.get("max_tokens", 512)

    payload = {
        "model": model,
        "prompt": prompt,
        "max_tokens": max_tokens
    }

    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=60)
        # Return raw content and preserve content-type if possible
        content_type = resp.headers.get("Content-Type", "text/plain; charset=utf-8")
        return (resp.content, resp.status_code, {"Content-Type": content_type})
    except Exception as e:
        return jsonify({"error": "Failed to reach Ollama API", "detail": str(e)}), 502


if __name__ == "__main__":
    # For simple local testing only. In production run behind gunicorn.
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5000"))
    app.run(host=host, port=port, debug=os.getenv("FLASK_DEBUG", "0") == "1")
