document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const gvcDateInput = document.getElementById('gvc-date');
    let currentCategory = 'general';

    // Set default date for GVC date input
    const today = new Date().toISOString().split('T')[0];
    gvcDateInput.value = today;

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');
            currentCategory = tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tab) {
                    content.classList.add('active');
                }
            });

            // Show/hide GVC date input
            gvcDateInput.style.display = tab === 'gvc' ? 'block' : 'none';
        });
    });

    // Template button functionality
    const templateButtons = document.querySelectorAll('.template-button');
    const templateContent = document.getElementById('template-content');
    const saveButton = document.getElementById('save-template');
    const copyButton = document.getElementById('copy-template');
    const agentNameInput = document.getElementById('agent-name');
    const addDateBtn = document.getElementById('add-date');
    const addTimeBtn = document.getElementById('add-time');
    const addDateTimeBtn = document.getElementById('add-datetime');

    // Store agent name in localStorage
    agentNameInput.value = localStorage.getItem('agentName') || '';
    
    // Capitalize first letter of each word
    function capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    agentNameInput.addEventListener('input', function() {
        // Remove any existing capitalization
        this.value = this.value.toLowerCase();
        // Capitalize first letter of each word
        this.value = capitalizeWords(this.value);
        localStorage.setItem('agentName', this.value);
    });

    // Format date and time functions
    function formatDate() {
        const date = new Date();
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function formatTime() {
        const date = new Date();
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // Add date/time to cursor position
    function insertAtCursor(text) {
        const cursorPos = templateContent.selectionStart;
        const textBefore = templateContent.value.substring(0, cursorPos);
        const textAfter = templateContent.value.substring(cursorPos);
        templateContent.value = textBefore + text + textAfter;
    }

    // Add signature to template
    function addSignature() {
        const agentName = agentNameInput.value.trim();
        if (!agentName) return;

        if (!templateContent.value.includes('Best regards,')) {
            templateContent.value += '\n\nBest regards,\n' + agentName;
        }
    }

    // Button event listeners
    addDateBtn.addEventListener('click', () => {
        insertAtCursor(formatDate());
    });

    addTimeBtn.addEventListener('click', () => {
        insertAtCursor(formatTime());
    });

    addDateTimeBtn.addEventListener('click', () => {
        insertAtCursor(formatDate() + ' at ' + formatTime());
    });

    templateButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const templateName = button.getAttribute('data-template');
            try {
                const response = await fetch(`/get_template/${currentCategory}/${templateName}`);
                const data = await response.json();
                if (data.error) {
                    alert('Template not found');
                    return;
                }
                templateContent.value = data;
                // Add signature after template is loaded
                setTimeout(addSignature, 100);
            } catch (error) {
                console.error('Error loading template:', error);
                alert('Error loading template');
            }
        });
    });

    // Save template functionality
    saveButton.addEventListener('click', async () => {
        const templateName = prompt('Enter template name:');
        if (!templateName) return;

        try {
            const response = await fetch('/save_template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category: currentCategory,
                    template_name: templateName,
                    content: templateContent.value
                })
            });

            const data = await response.json();
            if (data.success) {
                alert('Template saved successfully!');
            } else {
                alert('Error saving template');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Error saving template');
        }
    });

    // Copy to clipboard functionality
    copyButton.addEventListener('click', () => {
        templateContent.select();
        document.execCommand('copy');
        alert('Template copied to clipboard!');
    });

    // Update signature when agent name changes
    agentNameInput.addEventListener('change', () => {
        if (templateContent.value) {
            // Remove existing signature if present
            templateContent.value = templateContent.value.replace(/\n\nBest regards,\n.*$/, '');
            addSignature();
        }
    });
}); 