const apiUrl = 'https://image-gallery-nu-opal.vercel.app/api';

// Elements
const loginForm = document.getElementById('login-form');
const adminControls = document.getElementById('admin-controls');
const passwordInput = document.getElementById('admin-password');
const loginButton = document.getElementById('login-button');
const addPhotoButton = document.getElementById('add-photo-button');
const photoList = document.getElementById('sortable-photo-list');
const newPhotoFile = document.getElementById('new-photo-file');

// Stored images
let images = JSON.parse(localStorage.getItem('images')) || [];

// Functions
const updatePhotoList = () => {
  photoList.innerHTML = '';
  images.forEach((image, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <img src="${image.src}" alt="Photo ${index + 1}" style="width: 50px; height: 50px; object-fit: cover;">
      <button class="remove-photo" data-index="${index}">Remove</button>
    `;
    photoList.appendChild(li);
  });

  new Sortable(photoList, {
    animation: 150,
    onEnd: () => {
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

const resetForm = () => {
  newPhotoFile.value = '';
};

// Event Listeners
loginButton.addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    const response = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: passwordInput.value }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Login response data:', data); // Debug statement

    if (data.success) {
      loginForm.style.display = 'none';
      adminControls.style.display = 'block';
      updatePhotoList();
      showMessage('Login successful!');
    } else {
      showMessage('Incorrect password. Please try again.', true);
    }
  } catch (error) {
    console.error('Login error:', error);
    showMessage(`An error occurred during login: ${error.message}. Please try again.`, true);
  }
});

addPhotoButton.addEventListener('click', async () => {
  const file = newPhotoFile.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Upload response data:', data); // Debug statement

      const newImage = {
        src: data.imageUrl
      };

      images.unshift(newImage);
      saveImages();
      updatePhotoList();
      showMessage('Photo added successfully!');
      resetForm();
    } catch (error) {
      console.error('Error during fetch:', error);
      showMessage(`Error uploading photo: ${error.message}`, true);
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

// Check if user is already logged in
const checkLoginStatus = async () => {
  try {
    const response = await fetch(`${apiUrl}/test`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Check login status response:', data); // Debug statement

      adminControls.style.display = 'block';
      updatePhotoList();
    } else {
      console.log('User is not logged in'); // Debug statement
      window.location.href = '/login.html'; // Redirect to login page
    }
  } catch (error) {
    console.error('Error checking login status:', error);
    window.location.href = '/login.html'; // Redirect to login page
  }
};

// Call this when the page loads
checkLoginStatus();
updatePhotoList();
