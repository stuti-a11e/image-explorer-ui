// Global variables
let csvData = [];
let currentTab = 'analytics';
let currentExplorerView = 'storeRank';
let currentPage = 1;
const itemsPerPage = 50;

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

// Update file upload info
function updateFileUploadInfo(count) {
    const fileUploadInfo = document.getElementById('fileUploadInfo');
    const fileCount = document.getElementById('fileCount');
    const totalCount = document.getElementById('totalCount');
    
    if (fileUploadInfo && fileCount && totalCount) {
        fileUploadInfo.style.display = 'flex';
        fileCount.textContent = `loaded ${count} files`;
        totalCount.textContent = `from CSV file`;
    }
}

// Show message
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert after header
    const header = document.querySelector('.header');
    if (header) {
        header.parentNode.insertBefore(messageDiv, header.nextSibling);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
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
        console.error('Available elements:', document.querySelectorAll('[id*="query"]'));
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

// Update explorer filters
function updateExplorerFilters() {
    // Reset to first page when filters change
    currentPage = 1;
    
    if (currentExplorerView === 'storeRank') {
        updateStoreRankExplorer();
    } else {
        updateQueryImageView();
    }
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

// Create image card
function createImageCard(row) {
    const card = document.createElement('div');
    card.className = 'image-card';
    
    const imageUrl = row.image_url || 'https://via.placeholder.com/350x350?text=No+Image';
    const cardId = Math.random().toString(36).substr(2, 9);
    
    card.innerHTML = `
        <div class="image-container">
            <img src="${imageUrl}" alt="Image" onerror="this.src='https://via.placeholder.com/350x350?text=Image+Error'">
            <button class="zoom-button" onclick="openImageModal('${imageUrl}')" title="Zoom Image">🔍</button>
                           <button class="info-button" onclick="showImageInfo('${cardId}', '${imageUrl}', '${row.alle_ingestion_id || ''}', '${row.alle_media_key || ''}', '${row.store_rank || ''}', '${row.brisque_score || ''}', '${row.syn_con_image_selection || ''}', '${row.eligible || ''}', '${row.ingestion_query || ''}', '${imageUrl}')" title="Image Information">ℹ️</button>
        </div>
    `;
    
    return card;
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

// Switch tabs
function switchTab(tabName) {
    currentTab = tabName;
    
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab pane
    const selectedPane = document.getElementById(tabName);
    if (selectedPane) {
        selectedPane.style.display = 'block';
    }
    
    // Add active class to selected tab button
    const selectedButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Update explorer controls if switching to explorer tab
    if (tabName === 'explorer') {
        updateExplorerControls();
    }
}

// Switch explorer views
function switchExplorerView(view) {
    currentExplorerView = view;
    
    // Hide all explorer views
    document.querySelectorAll('.explorer-view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Remove active class from all explorer tab buttons
    document.querySelectorAll('.explorer-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected view
    const selectedView = document.getElementById(view + 'View');
    if (selectedView) {
        selectedView.classList.add('active');
    }
    
    // Add active class to selected button
    const selectedButton = event.target;
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Update the current view
    updateCurrentView();
}

// Update current view
function updateCurrentView() {
    if (currentExplorerView === 'storeRank') {
        updateStoreRankExplorer();
    } else {
        updateQueryImageView();
    }
}

// Update image grid
function updateImageGrid(data, gridId, paginationId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (data.length === 0) {
        grid.innerHTML = '<div class="message info">No images found matching the current filters.</div>';
        return;
    }
    
    // Calculate pagination
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
    updatePagination(document.getElementById(paginationId), totalPages, currentPage, (newPage) => {
        currentPage = newPage;
        updateCurrentView();
    });
}

// Update pagination
function updatePagination(paginationElement, totalPages, currentPage, onPageChange) {
    if (!paginationElement) return;
    
    paginationElement.innerHTML = '';
    
    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        onPageChange(currentPage - 1);
    };
    paginationElement.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.onclick = () => {
                onPageChange(i);
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
        onPageChange(currentPage + 1);
    };
    paginationElement.appendChild(nextBtn);
}

// Update store rank histogram
function updateStoreRankHistogram(data) {
    const canvas = document.getElementById('storeRankHistogram');
    if (!canvas) return;
    
    // Destroy existing chart
    if (storeRankHistogram) {
        storeRankHistogram.destroy();
    }
    
    // Group data by store rank ranges
    const ranges = ['0-10', '10-30', '30-50', '50-70', '70-100', '100-200'];
    const counts = ranges.map(range => {
        const [min, max] = range.split('-').map(Number);
        return data.filter(row => {
            const storeRank = parseInt(row.store_rank) || 0;
            return storeRank >= min && storeRank < max;
        }).length;
    });
    
    // Create chart
    const ctx = canvas.getContext('2d');
    storeRankHistogram = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges,
            datasets: [{
                label: 'Number of Images',
                data: counts,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
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
                title: {
                    display: true,
                    text: 'Store Rank Distribution'
                }
            }
        }
    });
}

// Update analytics
function updateAnalytics() {
    updateEligibilityAnalytics();
    updateStoreRankAnalytics();
}

// Update eligibility analytics
function updateEligibilityAnalytics() {
    if (csvData.length === 0) return;
    
    // Group data by ingestion query and eligibility
    const queryEligibility = {};
    csvData.forEach(row => {
        const query = row.ingestion_query || 'Unknown';
        const eligible = row.eligible || 'Unknown';
        
        if (!queryEligibility[query]) {
            queryEligibility[query] = { eligible: 0, notEligible: 0 };
        }
        
        if (eligible === 'eligible') {
            queryEligibility[query].eligible++;
        } else {
            queryEligibility[query].notEligible++;
        }
    });
    
    // Convert to arrays for chart
    const queries = Object.keys(queryEligibility);
    const eligibleCounts = queries.map(query => queryEligibility[query].eligible);
    const notEligibleCounts = queries.map(query => queryEligibility[query].notEligible);
    
    // Store data for pagination
    eligibilityData = queries.map((query, index) => ({
        query,
        eligible: eligibleCounts[index],
        notEligible: notEligibleCounts[index]
    }));
    
    // Update display
    updateEligibilityDisplay();
}

// Update store rank analytics
function updateStoreRankAnalytics() {
    if (csvData.length === 0) return;
    
    // Group data by store rank ranges
    const ranges = ['0-10', '10-30', '30-50', '50-70', '70-100', '100-200'];
    const counts = ranges.map(range => {
        const [min, max] = range.split('-').map(Number);
        return csvData.filter(row => {
            const storeRank = parseInt(row.store_rank) || 0;
            return storeRank >= min && storeRank < max;
        }).length;
    });
    
    // Store data for pagination
    storeRankData = ranges.map((range, index) => ({
        range,
        count: counts[index]
    }));
    
    // Update display
    updateStoreRankDisplay();
}

// Update eligibility display
function updateEligibilityDisplay() {
    const container = document.getElementById('eligibilitySection');
    if (!container) return;
    
    // Apply sorting and limits
    let displayData = [...eligibilityData];
    
    if (currentEligibilitySort === 'eligible') {
        displayData.sort((a, b) => b.eligible - a.eligible);
    } else {
        displayData.sort((a, b) => b.notEligible - a.notEligible);
    }
    
    displayData = displayData.slice(0, currentEligibilityLimit);
    
    // Create chart
    const canvas = container.querySelector('canvas');
    if (canvas) {
        if (eligibilityChart) {
            eligibilityChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        eligibilityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: displayData.map(d => d.query),
                datasets: [
                    {
                        label: 'Eligible',
                        data: displayData.map(d => d.eligible),
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Not Eligible',
                        data: displayData.map(d => d.notEligible),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Eligibility by Ingestion Query'
                    }
                }
            }
        });
    }
    
    // Update table
    updateEligibilityTable(displayData);
    
    // Update pagination
    updateAnalyticsPagination('eligibilityPagination', eligibilityData.length, currentEligibilityLimit, eligibilityCurrentPage, (page) => {
        eligibilityCurrentPage = page;
        updateEligibilityDisplay();
    });
}

// Update store rank display
function updateStoreRankDisplay() {
    const container = document.getElementById('storeRankSection');
    if (!container) return;
    
    // Apply limits
    let displayData = storeRankData.slice(0, currentStoreRankLimit);
    
    // Create chart
    const canvas = container.querySelector('canvas');
    if (canvas) {
        if (storeRankChart) {
            storeRankChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        storeRankChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: displayData.map(d => d.range),
                datasets: [{
                    label: 'Number of Images',
                    data: displayData.map(d => d.count),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Store Rank Distribution'
                    }
                }
            }
        });
    }
    
    // Update table
    updateStoreRankTable(displayData);
    
    // Update pagination
    updateAnalyticsPagination('storeRankPagination', storeRankData.length, currentStoreRankLimit, storeRankCurrentPage, (page) => {
        storeRankCurrentPage = page;
        updateStoreRankDisplay();
    });
}

// Update eligibility table
function updateEligibilityTable(data) {
    const table = document.getElementById('eligibilityTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const total = item.eligible + item.notEligible;
        const percentage = total > 0 ? ((item.eligible / total) * 100).toFixed(1) : '0.0';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.query}</td>
            <td>${item.eligible}</td>
            <td>${item.notEligible}</td>
            <td>${total}</td>
            <td>${percentage}%</td>
        `;
        tbody.appendChild(row);
    });
}

// Update store rank table
function updateStoreRankTable(data) {
    const table = document.getElementById('storeRankTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.range}</td>
            <td>${item.count}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update analytics pagination
function updateAnalyticsPagination(containerId, totalItems, limit, currentPage, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / limit);
    
    container.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        onPageChange(currentPage - 1);
    };
    container.appendChild(prevBtn);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === currentPage ? 'active' : '';
            pageBtn.onclick = () => {
                onPageChange(i);
            };
            container.appendChild(pageBtn);
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
        onPageChange(currentPage + 1);
    };
    container.appendChild(nextBtn);
}

// Sort eligibility data
function sortEligibility(sortBy) {
    currentEligibilitySort = sortBy;
    eligibilityCurrentPage = 1;
    updateEligibilityDisplay();
}

// Image modal functions
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

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('show');
    resetImageZoom();
}

function toggleImageZoom() {
    if (isImageZoomed) {
        resetImageZoom();
    } else {
        zoomIn();
    }
}

function zoomIn() {
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        currentImageZoom *= 1.5;
        modalImage.style.transform = `scale(${currentImageZoom})`;
        isImageZoomed = true;
    }
}

function zoomOut() {
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        currentImageZoom /= 1.5;
        modalImage.style.transform = `scale(${currentImageZoom})`;
        isImageZoomed = currentImageZoom > 1;
    }
}

function resetImageZoom() {
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        currentImageZoom = 1;
        modalImage.style.transform = 'scale(1)';
        isImageZoomed = false;
    }
}

// Show image info popup
function showImageInfo(cardId, imageUrl, alleIngestionId, alleMediaKey, storeRank, brisqueScore, synCon, eligible, ingestionQuery, imageUrlParam) {
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'image-info-popup';
    popup.id = `popup-${cardId}`;
    
    // Create popup content
    popup.innerHTML = `
        <div class="image-info-content">
            <div class="image-info-header">
                <h3>Image Information</h3>
                <button class="close-button" onclick="closeImageInfo('${cardId}')">&times;</button>
            </div>
            <div class="image-info-body">
                <div class="image-info-image">
                    <img src="${imageUrl}" alt="Image" onerror="this.src='https://via.placeholder.com/300x300?text=Image+Error'">
                </div>
                <div class="image-info-details">
                    <div class="info-row">
                        <span class="info-label">Alle Ingestion ID:</span>
                        <span class="info-value">${alleIngestionId || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Alle Media Key:</span>
                        <span class="info-value">${alleMediaKey || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Store Rank:</span>
                        <span class="info-value">${storeRank || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Brisque Score:</span>
                        <span class="info-value">${brisqueScore || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Syncon:</span>
                        <span class="info-value">${synCon || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Eligible:</span>
                        <span class="info-value eligible-badge ${eligible === 'eligible' ? 'eligible' : 'not-eligible'}">${eligible || 'Unknown'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Ingestion Query:</span>
                        <span class="info-value">${ingestionQuery || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Image URL:</span>
                        <span class="info-value" style="word-break: break-all; max-width: 300px;">${imageUrlParam || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add popup to body
    document.body.appendChild(popup);
    
    // Show popup
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
    
    // Close popup on background click
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            closeImageInfo(cardId);
        }
    });
    
    // Close popup on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageInfo(cardId);
        }
    });
}

// Close image info popup
function closeImageInfo(cardId) {
    const popup = document.getElementById(`popup-${cardId}`);
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 300);
    }
}

// Save and load state
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