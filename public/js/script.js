const gallery = document.getElementById('gallery');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalLocation = document.getElementById('modal-location');
const modalDescription = document.getElementById('modal-description');
const modalPhotographer = document.getElementById('modal-photographer');
const aboutLink = document.getElementById('about-link');
const aboutText = document.getElementById('about-text');
const closeBtns = document.getElementsByClassName('close');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const themeToggle = document.getElementById('theme-toggle');

const apiUrl = 'https://image-gallery-nu-opal.vercel.app/api';

let images = [];
let currentPage = 1;
const imagesPerPage = 12;
let isLoading = false;

const photographerInfo = `
    Piotr Kluk is a professional photographer based in England with over 15 years of experience capturing stunning landscapes and cityscapes. 
    His work has been featured in National Geographic and he has won multiple international awards for his breathtaking imagery.
    Piotr's approach combines technical expertise with an artistic eye, resulting in photographs that not only document scenes but also evoke deep emotions.
    He specializes in high-definition photography, allowing viewers to experience the intricate details of each captured moment.
`;

const fetchImages = async () => {
    try {
        const response = await fetch(`${apiUrl}/images`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        images = data.images;
        loadImages();
    } catch (error) {
        console.error('Error fetching images:', error);
    }
};

const loadImages = (page = 1) => {
    if (isLoading) return;
    isLoading = true;

    const start = (page - 1) * imagesPerPage;
    const end = start + imagesPerPage;
    const imagesToLoad = images.slice(start, end);

    imagesToLoad.forEach((src, index) => {
        const item = document.createElement('div');
        item.classList.add('gallery-item');
        
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Image ${index + 1}`;
        img.loading = 'lazy';
        
        const title = document.createElement('div');
        title.classList.add('gallery-item-title');
        title.textContent = `Image ${index + 1}`;
        
        item.appendChild(img);
        item.appendChild(title);
        item.addEventListener('click', () => openModal(start + index));
        gallery.appendChild(item);
    });

    isLoading = false;
    currentPage++;
};

const openModal = (index) => {
    const src = images[index];
    modalImage.src = src;
    modalImage.alt = `Image ${index + 1}`;
    modalTitle.textContent = `Image ${index + 1}`;
    modalDate.textContent = `Date: Unknown`;
    modalLocation.textContent = `Location: Unknown`;
    modalDescription.textContent = `Description: Not available`;
    modalPhotographer.textContent = `Photo by: Piotr Kluk`;
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
};

const closeModal = () => {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
};

Array.from(closeBtns).forEach(btn => {
    btn.onclick = closeModal;
});

aboutLink.addEventListener('click', (event) => {
    event.preventDefault();
    aboutText.textContent = photographerInfo;
    aboutModal.style.display = 'block';
    setTimeout(() => aboutModal.classList.add('show'), 10);
});

window.onclick = (event) => {
    if (event.target == modal) {
        closeModal();
    }
};

const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadImages(currentPage);
    }
};

fullscreenBtn.addEventListener('click', () => {
    if (modalImage.requestFullscreen) {
        modalImage.requestFullscreen();
    } else if (modalImage.webkitRequestFullscreen) { /* Safari */
        modalImage.webkitRequestFullscreen();
    } else if (modalImage.msRequestFullscreen) { /* IE11 */
        modalImage.msRequestFullscreen();
    }
});

const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeToggleIcon(theme);
};

const updateThemeToggleIcon = (theme) => {
    themeToggle.innerHTML = theme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
};

const toggleTheme = () => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
};

// Set initial theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

// Event listeners
themeToggle.addEventListener('click', toggleTheme);
window.addEventListener('scroll', handleScroll);

// Initial load
fetchImages();
