document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const gvcDateInput = document.getElementById('gvc-date');
    const templateContent = document.getElementById('template-content');
    const timezoneSelect = document.getElementById('timezone-select');
    const startTimeSelect = document.getElementById('start-time');
    const endTimeSelect = document.getElementById('end-time');
    const workingDaysSelect = document.getElementById('working-days');
    const agentNameInput = document.getElementById('agent-name');
    const templateButtons = document.querySelectorAll('.template-button');
    const copyButton = document.getElementById('copy-template');

    let currentCategory = 'general';
    const today = new Date().toISOString().split('T')[0];
    gvcDateInput.value = today;

    timezoneSelect.value = localStorage.getItem('timezone') || 'UTC+2';
    workingDaysSelect.value = localStorage.getItem('workingDays') || 'Sun-Thu';
    agentNameInput.value = localStorage.getItem('agentName') || '';

    // Store the original template text
    let originalTemplate = '';

    function generateTimeSlots(date, utcOffset) {
        // Parse the input date
        const selectedDate = new Date(date);
        
        // Create arrays for both days
        const timeSlots = [];
        
        // Generate slots for both days
        for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
            const currentDate = new Date(selectedDate);
            currentDate.setDate(selectedDate.getDate() + dayOffset);
            
            // Format the date as "Day, Month Day, Year"
            const formattedDate = currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            
            // Get start and end times from the select elements
            const startTime = startTimeSelect.value;
            const endTime = endTimeSelect.value;
            
            // Parse hours and minutes
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            
            // Convert to total minutes for easier calculation
            let currentMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;
            
            // Generate time slots for the day
            while (currentMinutes < endMinutes) {
                const currentHour = Math.floor(currentMinutes / 60);
                const currentMin = currentMinutes % 60;
                
                // Format the current time
                const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
                
                // Calculate next time (30 minutes later)
                const nextMinutes = currentMinutes + 30;
                const nextHour = Math.floor(nextMinutes / 60);
                const nextMin = nextMinutes % 60;
                const nextTime = `${nextHour.toString().padStart(2, '0')}:${nextMin.toString().padStart(2, '0')}`;
                
                timeSlots.push(`${formattedDate}, ${currentTime}-${nextTime} ${utcOffset}`);
                
                // Move to next slot
                currentMinutes = nextMinutes;
            }
        }
        
        return timeSlots.join('\n');
    }

    function updateTimeAvailability() {
        const date = gvcDateInput.value;
        const timezoneText = timezoneSelect.options[timezoneSelect.selectedIndex].text;
        const utcOffset = timezoneText.match(/UTC[+-]\d+(?::\d+)?/)[0];
        
        const timeSlots = generateTimeSlots(date, utcOffset);
        
        // Update the template content with time slots
        if (templateContent.value.includes('[TIME_AVAILABILITY]')) {
            templateContent.value = templateContent.value.replace('[TIME_AVAILABILITY]', timeSlots);
        }
    }

    function replacePlaceholders(templateText) {
        const timezoneText = timezoneSelect.options[timezoneSelect.selectedIndex].text;
        const timezoneValue = timezoneSelect.value;
        const startTime = startTimeSelect.value;
        const endTime = endTimeSelect.value;
        const workingDays = workingDaysSelect.value;
        const agentName = agentNameInput.value.trim();
        const cityMatch = timezoneText.match(/\((.*?)\)/);
        const cityName = cityMatch ? cityMatch[1] : '[CITY]';

        // Capitalize first letter of agent name
        const formattedAgentName = agentName ? agentName.charAt(0).toUpperCase() + agentName.slice(1) : '[Your Name]';

        console.log('Replacing placeholders with values:');
        console.log('Timezone:', timezoneValue);
        console.log('Start Time:', startTime);
        console.log('End Time:', endTime);
        console.log('Working Days:', workingDays);
        console.log('Agent Name:', formattedAgentName);
        console.log('City Name:', cityName);

        let updatedText = templateText
            .replace(/\[CITY\]/g, cityName)
            .replace(/\[TIMEZONE\]/g, timezoneValue)
            .replace(/\[WORKING_DAYS\]/g, workingDays)
            .replace(/\[START_TIME\]/g, startTime)
            .replace(/\[END_TIME\]/g, endTime)
            .replace(/\[Your Name\]/g, formattedAgentName);

        // If the template contains time availability, update it
        if (updatedText.includes('[TIME_AVAILABILITY]')) {
            const date = gvcDateInput.value;
            const utcOffset = timezoneText.match(/UTC[+-]\d+(?::\d+)?/)[0];
            const timeSlots = generateTimeSlots(date, utcOffset);
            updatedText = updatedText.replace('[TIME_AVAILABILITY]', timeSlots);
        }

        return updatedText;
    }

    function updateSignature() {
        console.log('Updating signature...');
        if (templateContent.value) {
            if (originalTemplate) {
                templateContent.value = replacePlaceholders(originalTemplate);
            } else {
                templateContent.value = replacePlaceholders(templateContent.value);
            }
        }
    }

    function updateTemplateContent() {
        if (templateContent.value) {
            templateContent.value = replacePlaceholders(originalTemplate || templateContent.value);
            console.log('Updated template:', templateContent.value);
        }
    }

    // Trigger update whenever any of these fields change
    [timezoneSelect, startTimeSelect, endTimeSelect, workingDaysSelect, agentNameInput, gvcDateInput].forEach(el => {
        el.addEventListener('change', () => {
            console.log(`Updated value for ${el.id}:`, el.value);
            updateSignature();
            updateTemplateContent();
            localStorage.setItem(el.id.replace('-', ''), el.value);  // Store updated values
        });
    });

    // Initialize with the current stored values
    updateSignature();

    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');
            currentCategory = tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tab) content.classList.add('active');
            });

            gvcDateInput.style.display = tab === 'gvc' ? 'block' : 'none';
            templateContent.value = '';  // Clear template content on tab switch
        });
    });

    // Handle template button clicks
    templateButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const templateName = button.getAttribute('data-template');
            console.log(`Selected template: ${templateName}`);

            templateButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            try {
                const res = await fetch(`/get_template/${currentCategory}/${templateName}`);
                const data = await res.json();
                if (data.error) return alert('Template not found');

                // Store the original template
                originalTemplate = data;
                templateContent.value = replacePlaceholders(data);
                updateTemplateContent();
            } catch (err) {
                console.error('Error loading template:', err);
                alert('Error loading template');
            }
        });
    });

    // Copy to clipboard
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(templateContent.value);
            alert('Template copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy template');
        }
    });

    // Handle agent name input change
    agentNameInput.addEventListener('input', function() {
        const newName = this.value.trim();
        console.log(`Agent name changed to: ${newName}`);

        localStorage.setItem('agentName', newName);
        updateSignature();
        updateTemplateContent();
    });

    // Initialize template content on load
    updateTemplateContent();
});
