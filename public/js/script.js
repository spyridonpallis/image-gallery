const gallery = document.getElementById('gallery');
const modal = document.getElementById('modal');
const aboutModal = document.getElementById('about-modal');
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

let currentPage = 1;
const imagesPerPage = 12;
let isLoading = false;

let images = JSON.parse(localStorage.getItem('images')) || [
    {
        src: 'https://picsum.photos/800/600?random=1',
        title: 'Sunset over London',
        date: '2024-03-15',
        location: 'London, England',
        description: 'A breathtaking view of the sun setting over the iconic London skyline, casting golden hues across the city.',
        photographer: 'Piotr Kluk'
    },
    // Add more sample images here
];

const photographerInfo = `
    Piotr Kluk is a professional photographer based in England with over 15 years of experience capturing stunning landscapes and cityscapes. 
    His work has been featured in National Geographic and he has won multiple international awards for his breathtaking imagery.
    Piotr's approach combines technical expertise with an artistic eye, resulting in photographs that not only document scenes but also evoke deep emotions.
    He specializes in high-definition photography, allowing viewers to experience the intricate details of each captured moment.
`;

const loadImages = (page = 1) => {
    if (isLoading) return;
    isLoading = true;

    const start = (page - 1) * imagesPerPage;
    const end = start + imagesPerPage;
    const imagesToLoad = images.slice(start, end);

    imagesToLoad.forEach((image, index) => {
        const item = document.createElement('div');
        item.classList.add('gallery-item');
        
        const img = document.createElement('img');
        img.src = image.src;
        img.alt = image.title;
        img.loading = 'lazy';
        
        const title = document.createElement('div');
        title.classList.add('gallery-item-title');
        title.textContent = image.title;
        
        item.appendChild(img);
        item.appendChild(title);
        item.addEventListener('click', () => openModal(start + index));
        gallery.appendChild(item);
    });

    isLoading = false;
    currentPage++;
};

const openModal = (index) => {
    const image = images[index];
    modalImage.src = image.src;
    modalImage.alt = image.title;
    modalTitle.textContent = image.title;
    modalDate.textContent = `Date: ${image.date}`;
    modalLocation.textContent = `Location: ${image.location}`;
    modalDescription.textContent = image.description;
    modalPhotographer.textContent = `Photo by: ${image.photographer}`;
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
};

const closeModal = () => {
    modal.classList.remove('show');
    aboutModal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        aboutModal.style.display = 'none';
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
    if (event.target == modal || event.target == aboutModal) {
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
loadImages();