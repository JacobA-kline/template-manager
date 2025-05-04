# Template Manager

A Flask-based web application for managing email templates, deployed on Google Cloud Run.

## Features

- Template management with categories
- Dynamic timezone and working hours configuration
- Time slot generation for meetings
- Responsive web interface

## Local Development

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

## Deployment to Google Cloud Run

### Prerequisites

- Google Cloud SDK installed
- Docker installed
- Access to a Google Cloud project with Cloud Run and Cloud Build enabled

### Steps

1. Set your Google Cloud project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

2. Enable required APIs:
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

3. Build and deploy using Cloud Build:
```bash
gcloud builds submit --config cloudbuild.yaml
```

### Manual Deployment

1. Build the container:
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/template-manager .
```

2. Push to Container Registry:
```bash
docker push gcr.io/YOUR_PROJECT_ID/template-manager
```

3. Deploy to Cloud Run:
```bash
gcloud run deploy template-manager \
  --image gcr.io/YOUR_PROJECT_ID/template-manager \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Environment Variables

The application uses the following environment variables:

- `PORT`: The port the application listens on (default: 8080)
- `FLASK_ENV`: The Flask environment (development/production)

## Security Considerations

- The application runs as a non-root user in the container
- All dependencies are pinned to specific versions
- Sensitive files are excluded from the Docker build context
- Cloud Run provides automatic HTTPS and scaling

## Monitoring and Logging

- Application logs are automatically collected in Cloud Logging
- Cloud Run provides basic metrics in the Google Cloud Console
- For advanced monitoring, consider integrating with Cloud Monitoring

## License

This project is licensed under the MIT License - see the LICENSE file for details. 