---
title: PrideConnect Adaptive Recommender
emoji: ✈️
colorFrom: red
colorTo: blue
sdk: docker
app_port: 7860
---

# PrideConnect Adaptive Recommender API

This API hosts the model service used by the PrideConnect web application. The app sends numeric compatibility features for new requests and member ratings. The service fits separate regularized logistic-regression models for request acceptance and recommendation relevance. Names, profile text, messages, email addresses, and user IDs are not sent to this service. It can run as a Docker Space on Hugging Face or as a Python web service on Render.

The API is protected by a bearer token. For Hugging Face, make the Space public so the web server can reach it, then add a Space secret named `ML_SERVICE_TOKEN`. For Render, add the same name in its environment settings. Add the same random secret to the web application's server environment as `ML_SERVICE_TOKEN`, and set `ML_SERVICE_URL` to the hosted service URL. Never place the token in browser code or commit it to Git.

## API

- `GET /health` checks that the service is running.
- `GET /docs` shows the interactive API documentation.
- `POST /predict` accepts numeric request-outcome examples, optional match-rating examples, and candidate feature arrays. It returns acceptance and relevance estimates, learned feature weights, training counts, and influence confidence for both models.

The web application remains the source of truth for request outcomes and match ratings. Both models are fit from those examples on each inference request, so Space restarts do not erase learning history. The acceptance model needs at least 12 labeled requests and four examples of both outcomes. The relevance model needs at least eight ratings and three examples of both classes (useful and not useful). Until those thresholds are met, the website relies on the transparent profile/network score. These prototype models are not validated evidence of real-world quality.

## Local run

```bash
cd ml/huggingface
python -m venv .venv
pip install -r requirements.txt
$env:ML_SERVICE_TOKEN = "replace-with-a-long-random-secret"
uvicorn app:app --reload --port 7860
```

On macOS/Linux, set the secret with `export ML_SERVICE_TOKEN="replace-with-a-long-random-secret"` before starting Uvicorn.

To deploy this directory as a Hugging Face Docker Space, see the [Hugging Face Docker Spaces guide](https://huggingface.co/docs/hub/main/spaces-sdks-docker). To deploy it as a free Render Python web service, set the root directory to `ml/huggingface`, build command to `pip install -r requirements.txt`, and start command to `uvicorn app:app --host 0.0.0.0 --port $PORT`.
