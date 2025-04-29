document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const gvcDateInput = document.getElementById('gvc-date');
    const templateContent = document.getElementById('template-content');
    let currentCategory = 'general';
    const timezoneSelect = document.getElementById('timezone-select');
    let currentTimezone = 'UTC+2'; // Default timezone
    const startTimeSelect = document.getElementById('start-time');
    const endTimeSelect = document.getElementById('end-time');
    const workingDaysSelect = document.getElementById('working-days');

    // Set default date for GVC date input
    const today = new Date().toISOString().split('T')[0];
    gvcDateInput.value = today;

    // Store timezone in localStorage
    timezoneSelect.value = localStorage.getItem('timezone') || 'UTC+2';
    currentTimezone = timezoneSelect.value;

    // Store working days in localStorage
    workingDaysSelect.value = localStorage.getItem('workingDays') || 'Sun-Thu';

    timezoneSelect.addEventListener('change', function() {
        currentTimezone = this.value;
        localStorage.setItem('timezone', currentTimezone);
        updateSignature();
    });

    // Update signature when start time changes
    startTimeSelect.addEventListener('change', function() {
        console.log('Start time changed to:', this.value); // Debugging line
        updateSignature();
    });

    // Update signature when end time changes
    endTimeSelect.addEventListener('change', function() {
        console.log('End time changed to:', this.value); // Debugging line
        updateSignature();
    });

    // Update signature when working days change
    workingDaysSelect.addEventListener('change', function() {
        localStorage.setItem('workingDays', this.value);
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
    const copyButton = document.getElementById('copy-template');
    const agentNameInput = document.getElementById('agent-name');

    // Store agent name in localStorage
    agentNameInput.value = localStorage.getItem('agentName') || '';
    
    // Capitalize first letter of each word
    function capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    agentNameInput.addEventListener('input', function() {
        this.value = this.value.toLowerCase();
        console.log(this.value);
        this.value = capitalizeWords(this.value);
        localStorage.setItem('agentName', this.value);
    
        const newAgentName = this.value.trim();
        const oldAgentName = localStorage.getItem('previousAgentName') || '';
    
        const templateElement = document.querySelector('#template-content');
        let currentText = templateElement.value;
    
        if (newAgentName) {
            // Replace both previous agent name and [Your Name]
            if (oldAgentName) {
                const escapedOldName = oldAgentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape RegEx chars
                const nameRegex = new RegExp(`\\b${escapedOldName}\\b`, 'g');
                currentText = currentText.replace(nameRegex, newAgentName);
            }
            
            // Also replace [Your Name] placeholder if it exists
            currentText = currentText.replace(/\[Your Name\]/g, newAgentName);
    
            templateElement.value = currentText;
    
            // Save new name as previous
            localStorage.setItem('previousAgentName', newAgentName);
    
            // Also update signature in case timezone or name changed
            updateSignature();
        } else {
            // If name is empty, restore [Your Name] placeholder
            if (oldAgentName) {
                const escapedOldName = oldAgentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const nameRegex = new RegExp(`\\b${escapedOldName}\\b`, 'g');
                currentText = currentText.replace(nameRegex, '[Your Name]');
                templateElement.value = currentText;
                localStorage.removeItem('previousAgentName');
            }
        }
    });
    

    // Template button functionality
    templateButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const templateName = button.getAttribute('data-template');
    
            // Mark this template as active
            templateButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
    
            try {
                const response = await fetch(`/get_template/${currentCategory}/${templateName}`);
                const data = await response.json();
                if (data.error) {
                    alert('Template not found');
                    return;
                }
                // Replace [Your Name] with agent's name
                const agentName = agentNameInput.value.trim();
                templateContent.value = agentName
                    ? data.replace(/\[Your Name\]/g, agentName)
                    : data;
    
                if (templateContent.value.includes('[TIME_AVAILABILITY]')) {
                    updateTimeAvailability();
                }
    
                updateSignature();
            } catch (error) {
                console.error('Error loading template:', error);
                alert('Error loading template');
            }
        });
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
            const timezoneText = timezoneSelect.options[timezoneSelect.selectedIndex].text;
            const timezoneValue = timezoneSelect.value;
            const startTime = startTimeSelect.value;
            const endTime = endTimeSelect.value;
            const workingDays = workingDaysSelect.value;
            
            // Extract just the city name from the timezone text (e.g., "UTC-3 (Buenos Aires)" -> "Buenos Aires")
            const cityName = timezoneText.match(/\((.*?)\)/)[1];
            
            // Replace the timezone part in the existing signature using multiline flag
            const lines = templateContent.value.split('\n');
            const newSignature = `Working Hours: ${workingDays} ${startTime} - ${endTime} ${cityName} Timezone (${timezoneValue})`;
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('Working Hours:')) {
                    lines[i] = newSignature;
                    // If this is a GVC template (has time availability), preserve the following lines
                    if (lines[i + 1] && lines[i + 1].trim() === '') {
                        i++; // Skip the next empty line
                    }
                }
            }
            
            templateContent.value = lines.join('\n');
        }
    }

    // Update signature when agent name changes
    agentNameInput.addEventListener('change', updateSignature);

    // Update signature when timezone changes
    timezoneSelect.addEventListener('change', updateSignature);

    // Update signature when start time changes
    startTimeSelect.addEventListener('change', updateSignature);

    // Update signature when end time changes
    endTimeSelect.addEventListener('change', updateSignature);

    // Update signature when working days change
    workingDaysSelect.addEventListener('change', updateSignature);

    // Function to generate time slots
    function generateTimeSlots(date, timezone) {
        const startTime = startTimeSelect.value;
        const endTime = endTimeSelect.value;
        
        // Parse start and end times
        const [startHour] = startTime.split(':').map(Number);
        const [endHour] = endTime.split(':').map(Number);
        
        // Parse the date string (format: YYYY-MM-DD)
        const [year, month, day] = date.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day); // month is 0-based in JavaScript
        const nextDate = new Date(year, month - 1, day + 1);
        
        // Get the next two days based on working days
        const days = [currentDate, nextDate];
        
        // Generate time slots for each day
        let timeSlots = [];
        days.forEach(day => {
            const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
            const month = day.toLocaleDateString('en-US', { month: 'long' });
            const date = day.getDate();
            const year = day.getFullYear();
            
            // Generate slots for each half hour
            for (let hour = startHour; hour < endHour; hour++) {
                // Full hour slot
                timeSlots.push(`${dayName}, ${month} ${date}, ${year}, ${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00 ${timezone}`);
                
                // Half hour slot
                timeSlots.push(`${dayName}, ${month} ${date}, ${year}, ${hour.toString().padStart(2, '0')}:30-${(hour + 1).toString().padStart(2, '0')}:30 ${timezone}`);
            }
        });
        
        return timeSlots.join('\n');
    }

    // Function to update time availability in templates
    function updateTimeAvailability() {
        const date = gvcDateInput.value;
        const timezone = timezoneSelect.value;
        
        // Get the timezone text (e.g., "UTC+3 (Jerusalem)")
        const timezoneText = timezoneSelect.options[timezoneSelect.selectedIndex].text;
        // Extract just the UTC offset (e.g., "UTC+3")
        const utcOffset = timezoneText.match(/UTC[+-]\d+(?::\d+)?/)[0];
        
        const timeSlots = generateTimeSlots(date, utcOffset);
        
        // If template content contains time availability, update it
        if (templateContent.value.includes('[TIME_AVAILABILITY]')) {
            templateContent.value = templateContent.value.replace('[TIME_AVAILABILITY]', timeSlots);
        }
    }

    // Function to update template with time availability
    async function updateTemplateWithTimeAvailability(templateName) {
        try {
            const response = await fetch(`/get_template/gvc/${templateName}`);
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
            
            // Update time availability
            updateTimeAvailability();
            
            // Update signature with current working hours and timezone
            updateSignature();
        } catch (error) {
            console.error('Error loading template:', error);
            alert('Error loading template');
        }
    }

    // Add event listeners for date and timezone changes
    gvcDateInput.addEventListener('change', () => {
        if (currentCategory === 'gvc') {
            const templatesToUpdate = [
                'OFFER INCRUP AGENT1',
                'OFFER INCRUP AGENT2',
                'OFFER INCRUP CUSTOMER',
                'NOT SHOWING UP'
            ];
            
            // Check if current template is one that needs updating
            const currentTemplate = document.querySelector('.template-button.active');
            if (currentTemplate && templatesToUpdate.includes(currentTemplate.getAttribute('data-template'))) {
                updateTemplateWithTimeAvailability(currentTemplate.getAttribute('data-template'));
            }
        }
    });

    timezoneSelect.addEventListener('change', () => {
        if (currentCategory === 'gvc') {
            const templatesToUpdate = [
                'OFFER INCRUP AGENT1',
                'OFFER INCRUP AGENT2',
                'OFFER INCRUP CUSTOMER',
                'NOT SHOWING UP'
            ];
            
            // Check if current template is one that needs updating
            const currentTemplate = document.querySelector('.template-button.active');
            if (currentTemplate && templatesToUpdate.includes(currentTemplate.getAttribute('data-template'))) {
                updateTemplateWithTimeAvailability(currentTemplate.getAttribute('data-template'));
            }
        }
    });

    // Initial update
    updateTimeAvailability();
}); 