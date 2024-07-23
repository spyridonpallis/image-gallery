const adminPassword = 'your_secure_password_here'; // Change this to a secure password

const loginForm = document.getElementById('login-form');
const adminControls = document.getElementById('admin-controls');
const passwordInput = document.getElementById('admin-password');
const loginButton = document.getElementById('login-button');
const addPhotoButton = document.getElementById('add-photo-button');
const photoList = document.getElementById('sortable-photo-list');
const newPhotoFile = document.getElementById('new-photo-file');

let images = JSON.parse(localStorage.getItem('images')) || [];

const updatePhotoList = () => {
    photoList.innerHTML = '';
    images.forEach((image, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${image.src}" alt="${image.title}" style="width: 50px; height: 50px; object-fit: cover;">
            <span>${image.title}</span>
            <button class="remove-photo" data-index="${index}">Remove</button>
        `;
        photoList.appendChild(li);
    });

    // Initialize drag-and-drop functionality
    new Sortable(photoList, {
        animation: 150,
        onEnd: () => {
            // Update the order of images after drag-and-drop
            const newOrder = Array.from(photoList.children).map(li => {
                const index = li.querySelector('.remove-photo').dataset.index;
                return images[index];
            });
            images = newOrder;
            saveImages();
        }
    });
};

const showMessage = (message, isError = false) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.className = `message ${isError ? 'error' : 'success'}`;
    adminControls.insertBefore(messageElement, adminControls.firstChild);
    setTimeout(() => messageElement.remove(), 5000);
};

const saveImages = () => {
    localStorage.setItem('images', JSON.stringify(images));
};

loginButton.addEventListener('click', () => {
    if (passwordInput.value === adminPassword) {
        loginForm.style.display = 'none';
        adminControls.style.display = 'block';
        updatePhotoList();
    } else {
        showMessage('Incorrect password. Please try again.', true);
    }
});

addPhotoButton.addEventListener('click', async () => {
    const file = newPhotoFile.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
  
      try {
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData
        });
  
        if (response.ok) {
          const data = await response.json();
          const newImage = {
            src: data.imageUrl,
            title: document.getElementById('new-photo-title').value,
            date: document.getElementById('new-photo-date').value,
            location: document.getElementById('new-photo-location').value,
            description: document.getElementById('new-photo-description').value,
            photographer: 'Piotr Kluk'
          };
  
          if (newImage.title && newImage.date && newImage.location && newImage.description) {
            images.unshift(newImage);
            saveImages();
            updatePhotoList();
            showMessage('Photo added successfully!');
            resetForm();
          } else {
            showMessage('Please fill in all fields.', true);
          }
        } else {
          showMessage('Error uploading photo. Please try again.', true);
        }
      } catch (error) {
        showMessage('Error adding photo. Please try again.', true);
      }
    } else {
      showMessage('Please select an image file.', true);
    }
  });

photoList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-photo')) {
        const index = e.target.dataset.index;
        const confirmRemove = confirm('Are you sure you want to remove this photo?');
        if (confirmRemove) {
            images.splice(index, 1);
            saveImages();
            updatePhotoList();
            showMessage('Photo removed successfully!');
        }
    }
});

const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
};

const resetForm = () => {
    newPhotoFile.value = '';
    document.getElementById('new-photo-title').value = '';
    document.getElementById('new-photo-date').value = '';
    document.getElementById('new-photo-location').value = '';
    document.getElementById('new-photo-description').value = '';
};

// Initialize the admin panel
updatePhotoList();