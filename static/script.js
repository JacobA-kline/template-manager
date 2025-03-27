document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    let currentCategory = 'general';

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
        });
    });

    // Template button functionality
    const templateButtons = document.querySelectorAll('.template-button');
    const templateContent = document.getElementById('template-content');
    const saveButton = document.getElementById('save-template');
    const copyButton = document.getElementById('copy-template');

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
}); 