let permissionsData = [];
const permissionsBody = document.getElementById('permissionsBody');
const searchNameInput = document.getElementById('searchName');
const filterProtectionSelect = document.getElementById('filterProtection');

// Create a table row element for each permission
function createTableRow(permission) {
  const row = document.createElement('tr');

  // Permission name cell
  const nameCell = document.createElement('td');
  nameCell.textContent = permission.permissionId;
  row.appendChild(nameCell);

  // API level cell
  const apiLevelCell = document.createElement('td');
  apiLevelCell.textContent = permission.apiLevel;
  row.appendChild(apiLevelCell);

  // Protection level cell (display multiple levels if available)
  const protectionCell = document.createElement('td');
  protectionCell.textContent = permission.protectionLevel?.join(', ');
  row.appendChild(protectionCell);

  // Description cell with proper newline handling
  const descCell = document.createElement('td');
  descCell.textContent = permission.description;
  row.appendChild(descCell);

  return row;
}

// Render permissions based on filtered data
function displayPermissions(data) {
  permissionsBody.innerHTML = '';
  if (data.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.setAttribute('colspan', '4');
    cell.textContent = 'No permissions match the filter criteria.';
    row.appendChild(cell);
    permissionsBody.appendChild(row);
  }
  data.forEach(permission => {
    permissionsBody.appendChild(createTableRow(permission));
  });
  resultsCount.textContent = `${data.length} result${data.length === 1 ? '' : 's'} found`;
}

// Populate the dropdown with unique protection level options
function populateProtectionOptions(data) {
  const protectionLevels = new Set();
  data.forEach(permission => {
    permission.protectionLevel?.forEach(level => {
      protectionLevels.add(level);
    });
  });

  // Clear any existing options
  const filterProtectionSelect = document.querySelector('#filterProtection');

  // Add each sorted protection level as an option
  Array.from(protectionLevels).sort().forEach(level => {
    const option = document.createElement('option');
    option.value = level;
    option.textContent = level;
    filterProtectionSelect.appendChild(option);
  });
}

// Filter permissions by name and protection level
function filterPermissions() {
  const searchTerm = searchNameInput.value.toLowerCase();
  const protectionFilter = filterProtectionSelect.value;
  const filteredData = permissionsData.filter(permission => {
    const matchesName = permission.permissionId.toLowerCase().includes(searchTerm) ||
                        permission.fullPermissionId.toLowerCase().includes(searchTerm);
    const matchesProtection = protectionFilter === "" || permission.protectionLevel?.includes(protectionFilter);
    return matchesName && matchesProtection;
  });
  displayPermissions(filteredData);
}

async function init() {
  try {
    const response = await fetch('./permissions.json');
    permissionsData = await response.json();
    displayPermissions(permissionsData);
    // Populate the dropdown with the unique protection level options
    populateProtectionOptions(permissionsData);
  } catch (error) {
    console.error('Error loading permissions data:', error);
  }

  // Event listeners for filters
  searchNameInput.addEventListener('input', filterPermissions);
  filterProtectionSelect.addEventListener('change', filterPermissions);
}

init();