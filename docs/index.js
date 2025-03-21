let itemsData = null;
let modal = null;
let currentSection = null;
let initialValues = {
  top: 0,
  bottom: 0
};

let lastValues = {
    top: 0,
    bottom: 0
};

let differenceTimeouts = {
    top: null,
    bottom: null
};

// Load data when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    itemsData = await response.json();
    console.log('Loaded data:', itemsData);
    
    // Initialize Bootstrap modal
    modal = new bootstrap.Modal(document.getElementById('itemsModal'));
    
    // Add event listener for modal hidden event
    document.getElementById('itemsModal').addEventListener('hidden.bs.modal', () => {
      document.getElementById('itemsModal').classList.remove('rotated');
    });

    // Restore saved state
    restoreState();
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Failed to load items data. Please check the console for details.');
  }
});

// Save state to local storage
function saveState() {
  const state = {
    top: {
      name: document.getElementById('topHeader').textContent,
      value: document.getElementById('topNumber').textContent,
      initialValue: initialValues.top
    },
    bottom: {
      name: document.getElementById('bottomHeader').textContent,
      value: document.getElementById('bottomNumber').textContent,
      initialValue: initialValues.bottom
    }
  };
  localStorage.setItem('berserkHeroesState', JSON.stringify(state));
}

function setBackgroundImages(sectionElement, elements) {
  // Remove existing background container if it exists
  const existingContainer = sectionElement.querySelector('.background-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  if (!elements || elements.length === 0) {
    sectionElement.style.backgroundImage = 'none';
    return;
  }

  // Create new background container
  const container = document.createElement('div');
  container.className = 'background-container';

  // Create a part for each element
  elements.forEach(element => {
    const part = document.createElement('div');
    part.className = 'background-part';
    part.style.backgroundImage = `url('imgs/${element.toLowerCase()}.jpg')`;
    container.appendChild(part);
  });

  sectionElement.appendChild(container);
}

function selectItem(name) {
  const headerId = currentSection === 'top' ? 'topHeader' : 'bottomHeader';
  const sectionElement = currentSection === 'top' ? 
    document.querySelector('.top-section') : 
    document.querySelector('.bottom-section');
  const numberId = currentSection === 'top' ? 'topNumber' : 'bottomNumber';
  
  // Find the selected item in itemsData
  const selectedItem = itemsData.find(item => item.Name === name);
  if (selectedItem) {
    // Set the header text
    document.getElementById(headerId).textContent = name;
    
    // Set initial counter value based on Life property
    const lifeValue = selectedItem.Life || 0;
    document.getElementById(numberId).textContent = lifeValue;
    
    // Store the initial value for reset functionality
    initialValues[currentSection] = lifeValue;
    lastValues[currentSection] = lifeValue;
    
    // Set background images
    setBackgroundImages(sectionElement, selectedItem.Elements);

    // Save state after selection
    saveState();
  }
  
  modal.hide();
}

function showDifference(section, newValue) {
    const diffElement = document.getElementById(`${section}Difference`);
    const lastValue = lastValues[section];
    const difference = newValue - lastValue;
    
    // Clear any existing timeout
    if (differenceTimeouts[section]) {
        clearTimeout(differenceTimeouts[section]);
    }
    
    // Update the difference display
    diffElement.textContent = difference > 0 ? `+${difference}` : difference.toString();
    diffElement.className = 'difference-counter visible';
    
    // Set timeout to fade out the difference after 1.5 seconds
    differenceTimeouts[section] = setTimeout(() => {
        diffElement.className = 'difference-counter fade-out';
        
        // Update the last value after the fade out animation
        setTimeout(() => {
            diffElement.className = 'difference-counter';
            lastValues[section] = newValue;
        }, 300);
    }, 1500);
}

function incrementNumber(elementId) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent);
    const newValue = currentValue + 1;
    
    // Update the display
    element.textContent = newValue;
    
    // Show difference
    const section = elementId === 'topNumber' ? 'top' : 'bottom';
    showDifference(section, newValue);
    
    // Save state
    saveState();
}

function decrementNumber(elementId) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent);
    const newValue = currentValue - 1;
    
    // Update the display
    element.textContent = newValue;
    
    // Show difference
    const section = elementId === 'topNumber' ? 'top' : 'bottom';
    showDifference(section, newValue);
    
    // Save state
    saveState();
}

function getElementColor(element) {
  const colors = {
    'Степи': '#dcce5f',
    'Леса': '#91b45c',
    'Болота': '#8a8c1f',
    'Горы': '#327196',
    'Тьма': '#5b4872',
    'Нейтральная': '#7a2e21'
  };
  return colors[element] || '#000000';
}

function createElementCircles(elements) {
  if (!elements || !Array.isArray(elements)) return '';
  return elements.map(element => 
    `<span class="element-circle" style="background-color: ${getElementColor(element)}" title="${element}"></span>`
  ).join('');
}

function filterItems(items, searchText, showStandardOnly) {
  return items.filter(item => {
    const matchesSearch = searchText === '' || 
      item.Name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStandard = !showStandardOnly || item.IsStandard;
    return matchesSearch && matchesStandard;
  });
}

function showItems(section) {
  if (!itemsData || !Array.isArray(itemsData)) {
    console.error('Items data not loaded properly:', itemsData);
    alert('Items data not available. Please try again later.');
    return;
  }
  
  currentSection = section;
  const modalElement = document.getElementById('itemsModal');
  
  // Add rotation class if opened from top section
  if (section === 'top') {
    modalElement.classList.add('rotated');
  }
  
  const itemsList = document.getElementById('itemsList');
  const searchInput = document.getElementById('searchInput');
  const standardFilter = document.getElementById('standardFilter');
  
  // Reset filters
  searchInput.value = '';
  standardFilter.checked = false;
  
  // Add event listeners for filters
  searchInput.addEventListener('input', updateItemsList);
  standardFilter.addEventListener('change', updateItemsList);
  
  function updateItemsList() {
    const searchText = searchInput.value;
    const showStandardOnly = standardFilter.checked;
    
    // Group items by SetName
    const groupedItems = itemsData.reduce((groups, item) => {
      const setName = item.SetName || 'Uncategorized';
      if (!groups[setName]) {
        groups[setName] = {
          setNumber: item.SetNumber || 0,
          items: []
        };
      }
      groups[setName].items.push(item);
      return groups;
    }, {});

    // Convert to array and sort by SetNumber
    const sortedGroups = Object.entries(groupedItems)
      .sort(([, a], [, b]) => b.setNumber - a.setNumber);

    // Clear current list
    itemsList.innerHTML = '';

    // Create list items for each group
    sortedGroups.forEach(([setName, group]) => {
      // Filter items in the group
      const filteredItems = filterItems(group.items, searchText, showStandardOnly);
      
      // Only show groups that have filtered items
      if (filteredItems.length > 0) {
        // Add group header
        const headerLi = document.createElement('li');
        headerLi.className = 'list-group-item list-group-item-secondary fw-bold';
        headerLi.textContent = setName;
        itemsList.appendChild(headerLi);

        // Add filtered items in the group
        filteredItems.forEach(item => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex align-items-center';
          
          // Create container for name and circles
          const contentDiv = document.createElement('div');
          contentDiv.className = 'd-flex align-items-center gap-2';
          
          // Add name
          const nameSpan = document.createElement('span');
          nameSpan.textContent = item.Name;
          contentDiv.appendChild(nameSpan);
          
          // Add element circles
          const circlesDiv = document.createElement('div');
          circlesDiv.className = 'd-flex gap-1';
          circlesDiv.innerHTML = createElementCircles(item.Elements);
          contentDiv.appendChild(circlesDiv);
          
          li.appendChild(contentDiv);
          li.onclick = () => selectItem(item.Name);
          itemsList.appendChild(li);
        });
      }
    });
  }
  
  // Initial render
  updateItemsList();
  modal.show();
}

function resetNumber(elementId, section) {
    document.getElementById(elementId).textContent = initialValues[section];
    lastValues[section] = initialValues[section];
    
    saveState();
}

// Restore state from local storage
function restoreState() {
  const savedState = localStorage.getItem('berserkHeroesState');
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      
      // Restore top section
      if (state.top.name !== 'Герой не выбран') {
        const topItem = itemsData.find(item => item.Name === state.top.name);
        if (topItem) {
          document.getElementById('topHeader').textContent = state.top.name;
          document.getElementById('topNumber').textContent = state.top.value;
          initialValues.top = state.top.initialValue;
          lastValues.top = state.top.value;
          
          // Set background images
          setBackgroundImages(document.querySelector('.top-section'), topItem.Elements);
        }
      }
      
      // Restore bottom section
      if (state.bottom.name !== 'Герой не выбран') {
        const bottomItem = itemsData.find(item => item.Name === state.bottom.name);
        if (bottomItem) {
          document.getElementById('bottomHeader').textContent = state.bottom.name;
          document.getElementById('bottomNumber').textContent = state.bottom.value;
          initialValues.bottom = state.bottom.initialValue;
          lastValues.bottom = state.bottom.value;

          // Set background images
          setBackgroundImages(document.querySelector('.bottom-section'), bottomItem.Elements);
        }
      }
    } catch (error) {
      console.error('Error restoring state:', error);
    }
  }
}
