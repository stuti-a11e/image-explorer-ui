// Global variables
let csvData = [];
let currentTab = 'analytics';
let currentExplorerView = 'storeRank';
let currentPage = 1;
const itemsPerPage = 20;

// Analytics pagination variables
let eligibilityCurrentPage = 1;
let storeRankCurrentPage = 1;
let eligibilityData = [];
let storeRankData = [];
let currentEligibilitySort = 'eligible';
let currentEligibilityLimit = 30;
let currentStoreRankLimit = 30;
let storeRankCumulative = false;

// Explorer filter variables
let selectedStoreRankRange = null;
let allQueries = [];
let selectedQuery = '';

// Image modal variables
let currentImageZoom = 1;
let isImageZoomed = false;

// Charts
let eligibilityChart = null;
let storeRankChart = null;
let storeRankHistogram = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM Content Loaded ===');
    
    // Set up file input listener
    const csvFileInput = document.getElementById('csvFile');
    if (csvFileInput) {
        csvFileInput.addEventListener('change', handleFileUpload);
        console.log('File input listener added');
    }
    
    // Load existing state
    loadState();
    
    // If CSV data is already loaded, update controls
    if (csvData && csvData.length > 0) {
        console.log('CSV data already loaded, updating controls...');
        updateFileUploadInfo(csvData.length);
        updateAnalytics();
        updateExplorerControls();
    }
    
    // Initialize expandable sections
    initializeExpandableSections();
    
    console.log('App initialization complete');
});

// Manual refresh function for debugging
function refreshQueryDropdown() {
    console.log('=== Manual refresh called ===');
    console.log('CSV data length:', csvData.length);
    console.log('CSV data sample (first 3 rows):', csvData.slice(0, 3));
    
    if (csvData.length > 0) {
        console.log('Sample ingestion queries:', csvData.slice(0, 5).map(row => row.ingestion_query));
        updateExplorerControls();
    } else {
        console.log('No CSV data available');
        alert('No CSV data loaded. Please load a CSV file first.');
    }
}

// Test function to check data
function testCSVData() {
    console.log('=== Testing CSV Data ===');
    console.log('Total rows:', csvData.length);
    
    if (csvData.length > 0) {
        console.log('First row:', csvData[0]);
        console.log('All ingestion queries:', csvData.map(row => row.ingestion_query));
        console.log('Unique queries:', [...new Set(csvData.map(row => row.ingestion_query).filter(Boolean))]);
    } else {
        console.log('No CSV data available');
    }
}

// Manual test function for dropdown
function testDropdownManually() {
    console.log('=== Manual Dropdown Test ===');
    
    // Test 1: Check if CSV data exists
    console.log('1. CSV Data Check:');
    console.log('   - csvData length:', csvData.length);
    console.log('   - csvData type:', typeof csvData);
    console.log('   - csvData is array:', Array.isArray(csvData));
    
    if (csvData.length > 0) {
        console.log('   - First row:', csvData[0]);
        console.log('   - Sample ingestion_query:', csvData[0].ingestion_query);
    }
    
    // Test 2: Check if allQueries array exists
    console.log('2. AllQueries Array Check:');
    console.log('   - allQueries length:', allQueries.length);
    console.log('   - allQueries content:', allQueries);
    
    // Test 3: Check if dropdown element exists
    console.log('3. Dropdown Element Check:');
    const dropdownOptions = document.getElementById('queryDropdownOptions');
    console.log('   - Element found:', !!dropdownOptions);
    if (dropdownOptions) {
        console.log('   - Element ID:', dropdownOptions.id);
        console.log('   - Element classes:', dropdownOptions.className);
        console.log('   - Current HTML:', dropdownOptions.innerHTML);
        console.log('   - Children count:', dropdownOptions.children.length);
    }
    
    // Test 4: Check if search input exists
    console.log('4. Search Input Check:');
    const searchInput = document.getElementById('querySearchInput');
    console.log('   - Search input found:', !!searchInput);
    if (searchInput) {
        console.log('   - Input value:', searchInput.value);
        console.log('   - Input placeholder:', searchInput.placeholder);
    }
    
    // Test 5: Try to manually populate
    console.log('5. Manual Population Test:');
    if (csvData.length > 0 && allQueries.length > 0) {
        console.log('   - Attempting manual population...');
        populateQueryDropdown();
    } else {
        console.log('   - Cannot populate: missing data');
    }
    
    // Test 6: Show dropdown manually
    console.log('6. Manual Dropdown Show:');
    if (dropdownOptions) {
        console.log('   - Forcing dropdown to show...');
        showQueryDropdown();
        setTimeout(() => {
            console.log('   - Hiding dropdown after 3 seconds...');
            hideQueryDropdown();
        }, 3000);
    }
}

// Initialize expandable sections
function initializeExpandableSections() {
    // Expand first section by default
    toggleSection('eligibilitySection');
}

// Toggle expandable sections
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const header = section.previousElementSibling;
    const content = section;
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        header.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        header.classList.add('expanded');
    }
}

// Sort eligibility data
function sortEligibility(sortBy) {
    currentEligibilitySort = sortBy;
    
    // Update active button
    document.querySelectorAll('.sort-button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Sort the data
    if (sortBy === 'eligible') {
        eligibilityData.sort((a, b) => b.eligible - a.eligible);
    } else {
        eligibilityData.sort((a, b) => b.notEligible - a.notEligible);
    }
    
    // Reset to first page and update display
    eligibilityCurrentPage = 1;
    updateEligibilityDisplay();
}

// Update eligibility display with pagination
function updateEligibilityDisplay() {
    currentEligibilityLimit = parseInt(document.getElementById('eligibilityLimit').value);
    
    if (eligibilityData.length === 0) return;
    
    // Apply limit
    let displayData = eligibilityData;
    if (currentEligibilityLimit !== 'all') {
        displayData = eligibilityData.slice(0, currentEligibilityLimit);
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(displayData.length / 30);
    const startIndex = (eligibilityCurrentPage - 1) * 30;
    const endIndex = startIndex + 30;
    const pageData = displayData.slice(startIndex, endIndex);
    
    // Update pagination info
    const totalQueries = displayData.length;
    const startQuery = startIndex + 1;
    const endQuery = Math.min(endIndex, totalQueries);
    document.getElementById('eligibilityPaginationInfo').textContent = 
        `Showing ${startQuery}-${endQuery} of ${totalQueries} queries`;
    
    // Update chart with page data
    updateEligibilityChart(pageData);
    
    // Update table with page data
    updateEligibilityTable(pageData);
    
    // Update pagination
    updateAnalyticsPagination('eligibilityPagination', totalPages, eligibilityCurrentPage, 'eligibility');
}

// Update store rank display with pagination
function updateStoreRankDisplay() {
    currentStoreRankLimit = parseInt(document.getElementById('storeRankLimit').value);
    storeRankCumulative = document.getElementById('storeRankCumulative').checked;
    
    if (storeRankData.length === 0) return;
    
    // Apply limit
    let displayData = storeRankData;
    if (currentStoreRankLimit !== 'all') {
        displayData = storeRankData.slice(0, currentStoreRankLimit);
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(displayData.length / 30);
    const startIndex = (storeRankCurrentPage - 1) * 30;
    const endIndex = startIndex + 30;
    const pageData = displayData.slice(startIndex, endIndex);
    
    // Update pagination info
    const totalQueries = displayData.length;
    const startQuery = startIndex + 1;
    const endQuery = Math.min(endIndex, totalQueries);
    document.getElementById('storeRankPaginationInfo').textContent = 
        `Showing ${startQuery}-${endQuery} of ${totalQueries} queries`;
    
    // Update chart with page data
    updateStoreRankChart(pageData);
    
    // Update table with page data
    updateStoreRankTable(pageData);
    
    // Update pagination
    updateAnalyticsPagination('storeRankPagination', totalPages, storeRankCurrentPage, 'storeRank');
}

// Update analytics pagination
function updateAnalyticsPagination(paginationId, totalPages, currentPage, type) {
    const pagination = document.getElementById(paginationId);
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (type === 'eligibility') {
            eligibilityCurrentPage--;
            updateEligibilityDisplay();
        } else {
            storeRankCurrentPage--;
            updateStoreRankDisplay();
        }
    };
    pagination.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.onclick = () => {
                if (type === 'eligibility') {
                    eligibilityCurrentPage = i;
                    updateEligibilityDisplay();
                } else {
                    storeRankCurrentPage = i;
                    updateStoreRankDisplay();
                }
            };
            pagination.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '8px 16px';
            pagination.appendChild(ellipsis);
        }
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (type === 'eligibility') {
            eligibilityCurrentPage++;
            updateEligibilityDisplay();
        } else {
            storeRankCurrentPage++;
            updateStoreRankDisplay();
        }
    };
    pagination.appendChild(nextBtn);
}

// Toggle metadata expansion in image cards
function toggleMetadata(cardId) {
    const metadata = document.getElementById(`metadata-${cardId}`);
    const toggle = document.getElementById(`toggle-${cardId}`);
    const indicator = document.getElementById(`indicator-${cardId}`);
    
    if (metadata.classList.contains('expanded')) {
        metadata.classList.remove('expanded');
        toggle.classList.remove('expanded');
        indicator.classList.remove('expanded');
        toggle.innerHTML = 'Show Details <span class="toggle-icon">▼</span>';
    } else {
        metadata.classList.add('expanded');
        toggle.classList.add('expanded');
        indicator.classList.add('expanded');
        toggle.innerHTML = 'Hide Details <span class="toggle-icon">▲</span>';
    }
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log('=== File upload started ===');
    console.log('File name:', file.name);
    console.log('File size:', file.size);

    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('=== File read complete ===');
        console.log('File content length:', e.target.result.length);
        
        Papa.parse(e.target.result, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log('=== Papa Parse complete ===');
                console.log('Parse results:', results);
                console.log('Data rows:', results.data ? results.data.length : 0);
                console.log('First row sample:', results.data ? results.data[0] : 'No data');
                
                if (results.data && results.data.length > 0) {
                    csvData = results.data.map(row => ({
                        alle_ingestion_id: row.alle_ingestion_id || '',
                        alle_media_key: row.alle_media_key || '',
                        ingestion_query: row.ingestion_query || '',
                        store_rank: row.store_rank || '0',
                        syn_con_image_selection: row.syn_con_image_selection || '',
                        brisque_score: row.brisque_score || '0',
                        eligible: row.eligible || '',
                        image_url: row.image_url || ''
                    }));
                    
                    console.log('=== Data processing complete ===');
                    console.log('Processed CSV data length:', csvData.length);
                    console.log('Sample processed row:', csvData[0]);
                    console.log('Sample ingestion query:', csvData[0]?.ingestion_query);
                    
                    showMessage(`Successfully loaded ${csvData.length} records from CSV`, 'success');
                    updateFileUploadInfo(csvData.length);
                    updateAnalytics();
                    
                    // Ensure explorer controls are updated
                    setTimeout(() => {
                        updateExplorerControls();
                    }, 100);
                    
                    saveState();
                } else {
                    console.error('No data found in CSV file');
                    showMessage('No data found in CSV file', 'error');
                }
            },
            error: function(error) {
                console.error('Papa Parse error:', error);
                showMessage('Error parsing CSV file: ' + error.message, 'error');
            }
        });
    };
    
    reader.onerror = function(error) {
        console.error('File read error:', error);
        showMessage('Error reading file: ' + error.message, 'error');
    };
    
    reader.readAsText(file);
}

// Load existing CSV data
function loadExistingCSV() {
    console.log('=== Loading existing CSV ===');
    
    // Try to load the clean CSV first, then fallback to the original
    fetch('clean_image_report.csv')
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            return fetch('eligible_image_report_20250829_1551.csv').then(r => r.text());
        })
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    if (results.data && results.data.length > 0) {
                        csvData = results.data.map(row => ({
                            alle_ingestion_id: row.alle_ingestion_id || '',
                            alle_media_key: row.alle_media_key || '',
                            ingestion_query: row.ingestion_query || '',
                            store_rank: row.store_rank || '0',
                            syn_con_image_selection: row.syn_con_image_selection || '',
                            brisque_score: row.brisque_score || '0',
                            eligible: row.eligible || '',
                            image_url: row.image_url || ''
                        }));
                        
                        showMessage(`Successfully loaded ${csvData.length} records from existing CSV`, 'success');
                        updateFileUploadInfo(csvData.length);
                        updateAnalytics();
                        updateExplorerControls(); // Ensure this gets called
                        saveState();
                    } else {
                        showMessage('No data found in existing CSV file', 'error');
                    }
                },
                error: function(error) {
                    showMessage('Error parsing existing CSV file: ' + error.message, 'error');
                }
            });
        })
        .catch(error => {
            showMessage('Error loading existing CSV file: ' + error.message, 'error');
        });
}

// Update file upload info display
function updateFileUploadInfo(count) {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileUploadInfo = document.getElementById('fileUploadInfo');
    const fileCount = document.getElementById('fileCount');
    const totalCount = document.getElementById('totalCount');
    
    if (count > 0) {
        fileUploadArea.style.display = 'none';
        fileUploadInfo.style.display = 'flex';
        fileCount.textContent = `${count} files`;
        totalCount.textContent = `loaded`;
    } else {
        fileUploadArea.style.display = 'flex';
        fileUploadInfo.style.display = 'none';
    }
}

// Show message to user
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert after header
    const header = document.querySelector('.header');
    header.parentNode.insertBefore(messageDiv, header.nextSibling);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Set up range filter event listeners
function setupRangeFilters() {
    const brisqueScoreFilter = document.getElementById('brisqueScoreFilter');
    const eligibilityFilter = document.getElementById('eligibilityFilter');
    const synConFilter = document.getElementById('synConFilter');
    const storeRankCumulativeExplorer = document.getElementById('storeRankCumulativeExplorer');

    if (brisqueScoreFilter) brisqueScoreFilter.addEventListener('input', debounce(updateExplorerFilters, 300));
    if (eligibilityFilter) eligibilityFilter.addEventListener('change', updateExplorerFilters);
    if (synConFilter) synConFilter.addEventListener('change', updateExplorerFilters);
    if (storeRankCumulativeExplorer) storeRankCumulativeExplorer.addEventListener('change', updateExplorerFilters);
}

// Set up control event listeners
function setupControlListeners() {
    // Add any additional control event listeners here
}

// Update explorer filters
function updateExplorerFilters() {
    if (currentExplorerView === 'storeRank') {
        updateStoreRankExplorer();
    } else {
        updateQueryImageView();
    }
}

// Debounce function for input handling
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update store rank explorer
function updateStoreRankExplorer() {
    if (csvData.length === 0) return;

    const brisqueScore = parseFloat(document.getElementById('brisqueScoreFilter')?.value) || 999;
    const eligibility = document.getElementById('eligibilityFilter')?.value || '';
    const synCon = document.getElementById('synConFilter')?.checked || false;
    const cumulative = document.getElementById('storeRankCumulativeExplorer')?.checked || false;

    // Filter data
    let filteredData = csvData.filter(row => {
        const brisqueScoreValue = parseFloat(row.brisque_score) || 0;
        const rowEligibility = row.eligible || '';
        const rowSynCon = row.syn_con_image_selection || '';
        const rowQuery = row.ingestion_query || '';

        // Apply filters
        if (brisqueScoreValue > brisqueScore) return false;
        if (eligibility && rowEligibility !== eligibility) return false;
        if (synCon && (rowSynCon !== '1' && rowSynCon !== '1.0' && rowSynCon !== 'true')) return false;
        if (selectedQuery && rowQuery !== selectedQuery) return false;

        return true;
    });

    // Apply store rank range filter
    if (selectedStoreRankRange) {
        const [min, max] = selectedStoreRankRange.split('-').map(Number);
        
        if (cumulative) {
            // Cumulative: show all images below the max value
            filteredData = filteredData.filter(row => {
                const storeRank = parseInt(row.store_rank) || 0;
                return storeRank < max;
            });
        } else {
            // Fixed range: show only images in the specific range
            filteredData = filteredData.filter(row => {
                const storeRank = parseInt(row.store_rank) || 0;
                return storeRank >= min && storeRank < max;
            });
        }
    }

    // Update histogram
    updateStoreRankHistogram(filteredData);

    // Update image grid
    updateImageGrid(filteredData, 'storeRankImageGrid', 'storeRankImagePagination');
}

// Update query image view
function updateQueryImageView() {
    if (csvData.length === 0) return;

    const brisqueScore = parseFloat(document.getElementById('brisqueScoreFilter')?.value) || 999;
    const eligibility = document.getElementById('eligibilityFilter')?.value || '';
    const synCon = document.getElementById('synConFilter')?.checked || false;
    const cumulative = document.getElementById('storeRankCumulativeExplorer')?.checked || false;

    // Filter data
    let filteredData = csvData.filter(row => {
        const brisqueScoreValue = parseFloat(row.brisque_score) || 0;
        const rowEligibility = row.eligible || '';
        const rowSynCon = row.syn_con_image_selection || '';
        const rowQuery = row.ingestion_query || '';

        // Apply filters
        if (brisqueScoreValue > brisqueScore) return false;
        if (eligibility && rowEligibility !== eligibility) return false;
        if (synCon && (rowSynCon !== '1' && rowSynCon !== '1.0' && rowSynCon !== 'true')) return false;
        if (selectedQuery && rowQuery !== selectedQuery) return false;

        return true;
    });

    // Apply store rank range filter if selected
    if (selectedStoreRankRange) {
        const [min, max] = selectedStoreRankRange.split('-').map(Number);
        
        if (cumulative) {
            // Cumulative: show all images below the max value
            filteredData = filteredData.filter(row => {
                const storeRank = parseInt(row.store_rank) || 0;
                return storeRank < max;
            });
        } else {
            // Fixed range: show only images in the specific range
            filteredData = filteredData.filter(row => {
                const storeRank = parseInt(row.store_rank) || 0;
                return storeRank >= min && storeRank < max;
            });
        }
    }

    // Update image grid
    updateImageGrid(filteredData, 'queryImageGrid', 'queryImagePagination');
}

// Update store rank histogram with new ranges
function updateStoreRankHistogram(data) {
    if (storeRankHistogram) {
        storeRankHistogram.destroy();
    }

    const ctx = document.getElementById('storeRankHistogram');
    if (!ctx) return;

    // Group data by store rank ranges (updated ranges)
    const ranges = [
        { min: 0, max: 10, label: '0-9' },
        { min: 10, max: 30, label: '10-29' },
        { min: 30, max: 50, label: '30-49' },
        { min: 50, max: 70, label: '50-69' },
        { min: 70, max: 100, label: '70-99' },
        { min: 100, max: 200, label: '100-199' }
    ];

    const rangeCounts = ranges.map(range => {
        return data.filter(row => {
            const storeRank = parseInt(row.store_rank) || 0;
            return storeRank >= range.min && storeRank < range.max;
        }).length;
    });

    const labels = ranges.map(r => r.label);

    storeRankHistogram = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Images',
                data: rangeCounts,
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update image grid
function updateImageGrid(data, gridId, paginationId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = '<div class="loading">No images match the current filters</div>';
        return;
    }

    // Paginate data
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = data.slice(startIndex, endIndex);

    // Create image cards
    pageData.forEach(row => {
        const card = createImageCard(row);
        grid.appendChild(card);
    });

    // Update pagination
    updatePagination(paginationId, totalPages, currentPage, data.length);
}

// Update pagination
function updatePagination(paginationElement, totalPages, currentPage, totalItems) {
    const pagination = document.getElementById(paginationElement);
    if (!pagination) return;

    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            updateExplorerFilters();
        }
    };
    pagination.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.onclick = () => {
                currentPage = i;
                updateExplorerFilters();
            };
            pagination.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '8px 16px';
            pagination.appendChild(ellipsis);
        }
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateExplorerFilters();
        }
    };
    pagination.appendChild(nextBtn);
}

// Update explorer controls
function updateExplorerControls() {
    console.log('=== updateExplorerControls called ===');
    console.log('CSV data length:', csvData.length);
    console.log('CSV data type:', typeof csvData);
    console.log('CSV data is array:', Array.isArray(csvData));
    
    if (csvData.length === 0) {
        console.log('No CSV data available');
        console.log('csvData:', csvData);
        return;
    }

    // Extract all unique queries from CSV data
    const allQueriesFromData = csvData.map(row => row.ingestion_query).filter(Boolean);
    console.log('Raw queries from data:', allQueriesFromData);
    console.log('Raw queries length:', allQueriesFromData.length);
    console.log('Sample rows:', csvData.slice(0, 3));
    
    allQueries = [...new Set(allQueriesFromData)];
    console.log('Unique queries found:', allQueries);
    console.log('Number of unique queries:', allQueries.length);
    
    // Populate the dropdown
    populateQueryDropdown();
}

// Populate query dropdown
function populateQueryDropdown() {
    console.log('=== populateQueryDropdown called ===');
    console.log('allQueries array:', allQueries);
    console.log('allQueries length:', allQueries.length);
    
    const dropdownOptions = document.getElementById('queryDropdownOptions');
    if (!dropdownOptions) {
        console.error('Dropdown options element not found!');
        console.error('Looking for element with ID: queryDropdownOptions');
        console.error('Available elements:', document.querySelectorAll('[id*="query"]));
        return;
    }
    
    console.log('Found dropdown element, clearing and populating...');
    console.log('Dropdown element:', dropdownOptions);
    console.log('Dropdown current HTML:', dropdownOptions.innerHTML);
    
    // Clear existing options
    dropdownOptions.innerHTML = '';
    
    // Add "All Queries" option first
    const allOption = document.createElement('div');
    allOption.className = 'dropdown-option';
    allOption.setAttribute('data-value', '');
    allOption.textContent = 'All Queries';
    allOption.onclick = () => selectQuery('');
    dropdownOptions.appendChild(allOption);
    
    // Add all actual queries
    allQueries.forEach((query, index) => {
        console.log(`Adding query ${index + 1}:`, query);
        const option = document.createElement('div');
        option.className = 'dropdown-option';
        option.setAttribute('data-value', query);
        option.textContent = query;
        option.onclick = () => selectQuery(query);
        dropdownOptions.appendChild(option);
    });
    
    console.log('Dropdown populated with', dropdownOptions.children.length, 'total options');
    console.log('Dropdown HTML after population:', dropdownOptions.innerHTML);
    
    // Force show the dropdown to verify it's populated
    setTimeout(() => {
        console.log('Forcing dropdown to show...');
        showQueryDropdown();
        setTimeout(() => {
            console.log('Hiding dropdown after 2 seconds...');
            hideQueryDropdown();
        }, 2000); // Hide after 2 seconds
    }, 100);
}

// Show query dropdown
function showQueryDropdown() {
    const dropdownOptions = document.getElementById('queryDropdownOptions');
    if (dropdownOptions) {
        console.log('Showing dropdown with', dropdownOptions.children.length, 'options'); // Debug log
        dropdownOptions.classList.add('show');
        dropdownOptions.style.display = 'block';
    } else {
        console.log('Dropdown options element not found in showQueryDropdown'); // Debug log
    }
}

// Hide query dropdown
function hideQueryDropdown() {
    // Delay hiding to allow for option selection
    setTimeout(() => {
        const dropdownOptions = document.getElementById('queryDropdownOptions');
        if (dropdownOptions) {
            console.log('Hiding dropdown'); // Debug log
            dropdownOptions.classList.remove('show');
            dropdownOptions.style.display = 'none';
        }
    }, 200);
}

// Filter query dropdown based on search input
function filterQueryDropdown() {
    const searchInput = document.getElementById('querySearchInput');
    const dropdownOptions = document.getElementById('queryDropdownOptions');
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!dropdownOptions) return;
    
    // Show dropdown when typing
    showQueryDropdown();
    
    // Get all options
    const options = dropdownOptions.querySelectorAll('.dropdown-option');
    
    options.forEach(option => {
        const query = option.textContent.toLowerCase();
        if (query.includes(searchTerm)) {
            option.style.display = 'block';
        } else {
            option.style.display = 'none';
        }
    });
}

// Handle Enter key press for search
function handleSearchEnter(event) {
    if (event.key === 'Enter') {
        const searchInput = document.getElementById('querySearchInput');
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm) {
            // Find exact match first
            const exactMatch = allQueries.find(query => 
                query.toLowerCase() === searchTerm.toLowerCase()
            );
            
            if (exactMatch) {
                selectQuery(exactMatch);
            } else {
                // Find partial match
                const partialMatch = allQueries.find(query => 
                    query.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                if (partialMatch) {
                    selectQuery(partialMatch);
                } else {
                    // No match found, show message
                    showMessage(`No query found matching "${searchTerm}"`, 'info');
                }
            }
        }
        
        // Hide dropdown
        hideQueryDropdown();
    }
}

// Select query from dropdown
function selectQuery(query) {
    selectedQuery = query;
    const searchInput = document.getElementById('querySearchInput');
    
    if (searchInput) {
        searchInput.value = query;
    }
    
    // Hide dropdown
    hideQueryDropdown();
    
    // Update filters
    updateExplorerFilters();
}

// Select store rank range
function selectStoreRankRange(range) {
    selectedStoreRankRange = range;
    
    // Update button states
    document.querySelectorAll('.rank-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update filters
    updateExplorerFilters();
}

// Open image modal
function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    
    modalImage.src = imageSrc;
    modal.classList.add('show');
    
    // Reset zoom
    resetImageZoom();
    
    // Close modal on background click
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeImageModal();
        }
    };
    
    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });
}

// Close image modal
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('show');
    resetImageZoom();
}

// Toggle image zoom
function toggleImageZoom() {
    if (isImageZoomed) {
        resetImageZoom();
    } else {
        zoomIn();
    }
}

// Zoom in
function zoomIn() {
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        currentImageZoom = Math.min(currentImageZoom * 1.5, 3);
        modalImage.style.transform = `scale(${currentImageZoom})`;
        isImageZoomed = true;
        modalImage.classList.add('zoomed');
    }
}

// Zoom out
function zoomOut() {
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        currentImageZoom = Math.max(currentImageZoom / 1.5, 0.5);
        modalImage.style.transform = `scale(${currentImageZoom})`;
        isImageZoomed = currentImageZoom > 1;
        if (!isImageZoomed) {
            modalImage.classList.remove('zoomed');
        }
    }
}

// Reset image zoom
function resetImageZoom() {
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        currentImageZoom = 1;
        modalImage.style.transform = 'scale(1)';
        isImageZoomed = false;
        modalImage.classList.remove('zoomed');
    }
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // If switching to explorer tab, ensure controls are updated
    if (tabName === 'explorer') {
        updateExplorerControls();
    }
    
    // Save state
    saveState();
}

function switchExplorerView(viewName) {
    currentExplorerView = viewName;
    
    // Update view buttons
    document.querySelectorAll('.view-button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update view visibility
    document.querySelectorAll('.explorer-view').forEach(view => view.classList.remove('active'));
    if (viewName === 'storeRank') {
        document.getElementById('storeRankView').classList.add('active');
    } else {
        document.getElementById('queryView').classList.add('active');
    }
    
    // Update controls and data
    if (viewName === 'storeRank') {
        updateStoreRankExplorer();
    } else {
        updateQueryImageView();
    }
    
    // Save state
    saveState();
}

function updateAnalytics() {
    if (csvData.length === 0) return;

    updateEligibilityAnalytics();
    updateStoreRankAnalytics();
}

function updateEligibilityAnalytics() {
    // Group data by ingestion query
    const queryGroups = {};
    csvData.forEach(row => {
        const query = row.ingestion_query || 'Unknown';
        if (!queryGroups[query]) {
            queryGroups[query] = { eligible: 0, notEligible: 0 };
        }
        if (row.eligible === 'eligible') {
            queryGroups[query].eligible++;
        } else {
            queryGroups[query].notEligible++;
        }
    });

    // Convert to array and sort by eligible count (default)
    eligibilityData = Object.keys(queryGroups).map(query => ({
        query: query,
        eligible: queryGroups[query].eligible,
        notEligible: queryGroups[query].notEligible,
        total: queryGroups[query].eligible + queryGroups[query].notEligible
    })).sort((a, b) => b.eligible - a.eligible);

    // Update display
    updateEligibilityDisplay();
}

function updateStoreRankAnalytics() {
    // Group data by ingestion query and store rank ranges
    const queryGroups = {};
    const rankRanges = [
        { min: 0, max: 10, label: '<10' },
        { min: 10, max: 30, label: '<30' },
        { min: 30, max: 50, label: '<50' },
        { min: 50, max: 70, label: '<70' },
        { min: 70, max: 100, label: '<100' },
        { min: 100, max: 999, label: '≥100' }
    ];

    csvData.forEach(row => {
        const query = row.ingestion_query || 'Unknown';
        const storeRank = parseInt(row.store_rank) || 0;

        if (!queryGroups[query]) {
            queryGroups[query] = rankRanges.map(() => 0);
        }

        // Find which range this store rank falls into
        for (let i = 0; i < rankRanges.length; i++) {
            if (storeRank >= rankRanges[i].min && storeRank < rankRanges[i].max) {
                queryGroups[query][i]++;
                break;
            }
        }
    });

    // Convert to array and sort by total count
    storeRankData = Object.keys(queryGroups).map(query => ({
        query: query,
        ranges: queryGroups[query],
        total: queryGroups[query].reduce((sum, count) => sum + count, 0)
    })).sort((a, b) => b.total - a.total);

    // Update display
    updateStoreRankDisplay();
}

function updateEligibilityChart(data) {
    // Prepare chart data
    const queries = data.map(item => item.query);
    const eligibleData = data.map(item => item.eligible);
    const notEligibleData = data.map(item => item.notEligible);

    // Update chart
    if (eligibilityChart) {
        eligibilityChart.destroy();
    }

    const ctx = document.getElementById('eligibilityChart').getContext('2d');
    eligibilityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: queries,
            datasets: [
                {
                    label: 'Eligible',
                    data: eligibleData,
                    backgroundColor: '#10b981',
                    stack: 'Stack 0'
                },
                {
                    label: 'Not Eligible',
                    data: notEligibleData,
                    backgroundColor: '#ef4444',
                    stack: 'Stack 0'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function updateEligibilityTable(data) {
    const tbody = document.querySelector('#eligibilityTable tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const percentage = ((item.eligible / item.total) * 100).toFixed(1);

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.query}</td>
            <td>${item.eligible}</td>
            <td>${item.notEligible}</td>
            <td>${item.total}</td>
            <td>${percentage}%</td>
        `;
    });
}

function updateStoreRankChart(data) {
    // Prepare chart data
    const queries = data.map(item => item.query);
    const rankRanges = ['<10', '<30', '<50', '<70', '<100', '≥100'];
    
    let datasets;
    if (storeRankCumulative) {
        // Cumulative ranges: <30 includes <10, <50 includes <30, etc.
        datasets = rankRanges.map((range, index) => {
            const cumulativeData = data.map(item => {
                let sum = 0;
                for (let i = 0; i <= index; i++) {
                    sum += item.ranges[i];
                }
                return sum;
            });
            return {
                label: range,
                data: cumulativeData,
                backgroundColor: getColorForIndex(index)
            };
        });
    } else {
        // Fixed ranges: <30 is only 10-29, <50 is only 30-49, etc.
        datasets = rankRanges.map((range, index) => ({
            label: range,
            data: data.map(item => item.ranges[index]),
            backgroundColor: getColorForIndex(index)
        }));
    }

    // Update chart
    if (storeRankChart) {
        storeRankChart.destroy();
    }

    const ctx = document.getElementById('storeRankChart').getContext('2d');
    storeRankChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: queries,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function updateStoreRankTable(data) {
    const tbody = document.querySelector('#storeRankTable tbody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = tbody.insertRow();
        
        if (storeRankCumulative) {
            // Show cumulative totals
            let cumulative = 0;
            const cumulativeData = item.ranges.map((count, index) => {
                cumulative += count;
                return cumulative;
            });
            
            row.innerHTML = `
                <td>${item.query}</td>
                <td>${cumulativeData[0]}</td>
                <td>${cumulativeData[1]}</td>
                <td>${cumulativeData[2]}</td>
                <td>${cumulativeData[3]}</td>
                <td>${cumulativeData[4]}</td>
                <td>${cumulativeData[5]}</td>
            `;
        } else {
            // Show fixed ranges
            row.innerHTML = `
                <td>${item.query}</td>
                <td>${item.ranges[0]}</td>
                <td>${item.ranges[1]}</td>
                <td>${item.ranges[2]}</td>
                <td>${item.ranges[3]}</td>
                <td>${item.ranges[4]}</td>
                <td>${item.ranges[5]}</td>
            `;
        }
    });
}

function updateExplorerControls() {
    if (csvData.length === 0) return;

    // Update query dropdown
    const uniqueQueries = [...new Set(csvData.map(row => row.ingestion_query).filter(Boolean))];
    const dropdown = document.getElementById('queryDropdown');
    dropdown.innerHTML = '<option value="">Select a query...</option>';
    uniqueQueries.forEach(query => {
        const option = document.createElement('option');
        option.value = query;
        option.textContent = query;
        dropdown.appendChild(option);
    });
}

function createImageCard(row) {
    const card = document.createElement('div');
    card.className = 'image-card';
    
    const imageUrl = row.image_url || 'https://via.placeholder.com/350x350?text=No+Image';
    const cardId = Math.random().toString(36).substr(2, 9);
    
    card.innerHTML = `
        <div class="image-container">
            <img src="${imageUrl}" alt="Image" onerror="this.src='https://via.placeholder.com/350x350?text=Image+Error'">
            <button class="zoom-button" onclick="openImageModal('${imageUrl}')" title="Zoom Image">🔍</button>
            <div class="dropdown-indicator" id="indicator-${cardId}" onclick="toggleMetadata('${cardId}')">
                <span class="arrow">▼</span>
            </div>
        </div>
        <div class="metadata">
            <button class="metadata-toggle" id="toggle-${cardId}" onclick="toggleMetadata('${cardId}')">
                Show Details <span class="toggle-icon">▼</span>
            </button>
            
            <div class="collapsible-metadata" id="metadata-${cardId}">
                <div class="metadata-row">
                    <span class="label">Alle Ingestion ID:</span>
                    <span class="value" style="font-size: 14px;">${row.alle_ingestion_id || 'N/A'}</span>
                </div>
                <div class="metadata-row">
                    <span class="label">Media Key:</span>
                    <span class="value">${row.alle_media_key || 'N/A'}</span>
                </div>
                <div class="metadata-row">
                    <span class="label">Ingestion Query:</span>
                    <span class="value">${row.ingestion_query || 'N/A'}</span>
                </div>
                <div class="metadata-row">
                    <span class="label">Store Rank:</span>
                    <span class="value">${row.store_rank || 'N/A'}</span>
                </div>
                <div class="metadata-row">
                    <span class="label">Brisque Score:</span>
                    <span class="value">${row.brisque_score || 'N/A'}</span>
                </div>
                <div class="metadata-row">
                    <span class="label">Syncon:</span>
                    <span class="syncon-badge">${row.syn_con_image_selection || 'N/A'}</span>
                </div>
                <div class="metadata-row">
                    <span class="label">Status:</span>
                    <span class="eligible-badge ${row.eligible === 'eligible' ? 'eligible' : 'not-eligible'}">
                        ${row.eligible || 'Unknown'}
                    </span>
                </div>
                <div class="metadata-row">
                    <span class="label">Image URL:</span>
                    <span class="value" style="word-break: break-all; font-size: 12px;">
                        ${row.image_url ? row.image_url.substring(0, 50) + '...' : 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

function updatePagination(paginationElement, totalPages, currentPage) {
    paginationElement.innerHTML = '';
    
    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        currentPage--;
        updateCurrentView();
    };
    paginationElement.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.onclick = () => {
                currentPage = i;
                updateCurrentView();
            };
            paginationElement.appendChild(pageBtn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '8px 16px';
            paginationElement.appendChild(ellipsis);
        }
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        currentPage++;
        updateCurrentView();
    };
    paginationElement.appendChild(nextBtn);
}

function updateCurrentView() {
    if (currentExplorerView === 'storeRank') {
        updateStoreRankExplorer();
    } else {
        updateQueryImageView();
    }
}

function getColorForIndex(index) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[index % colors.length];
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.file-upload'));
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function saveState() {
    const state = {
        currentTab,
        currentExplorerView,
        currentPage,
        eligibilityCurrentPage,
        storeRankCurrentPage,
        currentEligibilitySort,
        currentEligibilityLimit,
        currentStoreRankLimit,
        storeRankCumulative,
        selectedStoreRankRange,
        selectedQuery,
        currentImageZoom,
        isImageZoomed
    };
    localStorage.setItem('imageIngestionAppState', JSON.stringify(state));
    localStorage.setItem('imageIngestionCSVData', JSON.stringify(csvData));
}

function loadState() {
    try {
        const state = JSON.parse(localStorage.getItem('imageIngestionAppState'));
        if (state) {
            currentTab = state.currentTab || 'analytics';
            currentExplorerView = state.currentExplorerView || 'storeRank';
            currentPage = state.currentPage || 1;
            eligibilityCurrentPage = state.currentEligibilityPage || 1;
            storeRankCurrentPage = state.storeRankCurrentPage || 1;
            currentEligibilitySort = state.currentEligibilitySort || 'eligible';
            currentEligibilityLimit = state.currentEligibilityLimit || 30;
            currentStoreRankLimit = state.currentStoreRankLimit || 30;
            storeRankCumulative = state.storeRankCumulative || false;
            selectedStoreRankRange = state.selectedStoreRankRange || null;
            selectedQuery = state.selectedQuery || '';
            currentImageZoom = state.currentImageZoom || 1;
            isImageZoomed = state.isImageZoomed || false;
            
            // Update UI to match state
            if (currentTab === 'explorer') {
                switchTab('explorer');
            }
        }
        
        // Try to load CSV data from localStorage
        const savedCSVData = localStorage.getItem('imageIngestionCSVData');
        if (savedCSVData) {
            try {
                csvData = JSON.parse(savedCSVData);
                console.log('Loaded CSV data from localStorage:', csvData.length, 'rows');
                
                // Extract queries and populate dropdown
                const queries = csvData.map(row => row.ingestion_query).filter(Boolean);
                allQueries = [...new Set(queries)];
                console.log('Extracted queries from saved data:', allQueries.length);
                
                // Update UI
                updateFileUploadInfo(csvData.length);
                updateAnalytics();
                updateExplorerControls();
            } catch (e) {
                console.error('Error parsing saved CSV data:', e);
                csvData = [];
            }
        }
    } catch (e) {
        console.log('No saved state found');
    }
} 

// Force populate dropdown function
function forcePopulateDropdown() {
    console.log('=== Force populate dropdown ===');
    
    if (csvData.length === 0) {
        alert('No CSV data available. Please load a CSV file first.');
        return;
    }
    
    // Extract queries manually
    const queries = csvData.map(row => row.ingestion_query).filter(Boolean);
    const uniqueQueries = [...new Set(queries)];
    
    console.log('Found queries:', uniqueQueries);
    
    // Update global variable
    allQueries = uniqueQueries;
    
    // Populate dropdown
    populateQueryDropdown();
    
    alert(`Dropdown populated with ${uniqueQueries.length} unique queries`);
} 