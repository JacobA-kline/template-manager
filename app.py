from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = os.urandom(24)

# Load templates from JSON file
def load_templates():
    try:
        with open('templates.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            'general': {},
            'gvc': {},
            'internal': {},
            'specialist': {}
        }

# Save templates to JSON file
def save_templates(templates):
    with open('templates.json', 'w') as f:
        json.dump(templates, f, indent=4)

@app.route('/')
def index():
    templates = load_templates()
    return render_template('index.html', templates=templates)

@app.route('/get_template/<category>/<template_name>')
def get_template(category, template_name):
    templates = load_templates()
    if category in templates and template_name in templates[category]:
        return jsonify(templates[category][template_name])
    return jsonify({'error': 'Template not found'}), 404

@app.route('/save_template', methods=['POST'])
def save_template():
    data = request.json
    templates = load_templates()
    category = data.get('category')
    template_name = data.get('template_name')
    content = data.get('content')
    
    if category and template_name and content:
        if category not in templates:
            templates[category] = {}
        templates[category][template_name] = content
        save_templates(templates)
        return jsonify({'success': True})
    return jsonify({'error': 'Invalid data'}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8090) 