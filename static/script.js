document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const gvcDateInput = document.getElementById('gvc-date');
    const templateContent = document.getElementById('template-content');
    let currentCategory = 'general';
    const timezoneSelect = document.getElementById('timezone-select');
    let currentTimezone = 'UTC+2'; // Default timezone

    // Set default date for GVC date input
    const today = new Date().toISOString().split('T')[0];
    gvcDateInput.value = today;

    // Store timezone in localStorage
    timezoneSelect.value = localStorage.getItem('timezone') || 'UTC+2';
    currentTimezone = timezoneSelect.value;

    timezoneSelect.addEventListener('change', function() {
        currentTimezone = this.value;
        localStorage.setItem('timezone', currentTimezone);
        updateSignature();
    });

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

            // Clear template editor when switching tabs
            templateContent.value = '';
        });
    });

    // Template button functionality
    const templateButtons = document.querySelectorAll('.template-button');
    const saveButton = document.getElementById('save-template');
    const copyButton = document.getElementById('copy-template');
    const agentNameInput = document.getElementById('agent-name');

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

    // Template button functionality
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
                // Replace [Your Name] with the user's name if it exists
                const agentName = agentNameInput.value.trim();
                if (agentName) {
                    templateContent.value = data.replace(/\[Your Name\]/g, agentName);
                } else {
                    templateContent.value = data;
                }
            } catch (error) {
                console.error('Error loading template:', error);
                // Only show error alert if the template content is empty
                if (!templateContent.value) {
                    alert('Error loading template');
                }
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
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(templateContent.value);
            alert('Template copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy template');
        }
    });

    // Function to update signature with current name and timezone
    function updateSignature() {
        if (templateContent.value) {
            const agentName = agentNameInput.value.trim();
            const timezoneText = timezoneSelect.options[timezoneSelect.selectedIndex].text;
            const timezoneValue = timezoneSelect.value;
            
            // Extract just the city name from the timezone text (e.g., "UTC-3 (Buenos Aires)" -> "Buenos Aires")
            const cityName = timezoneText.match(/\((.*?)\)/)[1];
            
            // Replace the timezone part in the existing signature
            templateContent.value = templateContent.value.replace(
                /Working Hours: Sun-Thu 10:00 - 17:00.*$/,
                `Working Hours: Sun-Thu 10:00 - 17:00 ${cityName} Timezone (${timezoneValue})`
            );
        }
    }

    // Update signature when agent name changes
    agentNameInput.addEventListener('change', updateSignature);

    // Update signature when timezone changes
    timezoneSelect.addEventListener('change', updateSignature);
}); 