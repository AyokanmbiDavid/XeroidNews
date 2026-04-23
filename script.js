const API_KEY = '9c744a0f8934447eae399b3ab9802ad2';
const STORAGE_KEY = 'XeroidNews_Wishlist';

let currentPage = 1;
let currentArticles = [];
let currentLang = 'en';
let wishlist = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// --- 1. SIDEBAR TOGGLE LOGIC ---
window.toggleMenu = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;

    const isClosed = sidebar.style.transform === 'translateX(-100%)' || sidebar.style.transform === '';

    if (isClosed) {
        sidebar.style.transform = 'translateX(0px)';
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.style.transform = 'translateX(-100%)';
        overlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
};

// --- 2. API FETCHING ---
window.fetchNews = async (query = 'trending', isLoadMore = false, category = '') => {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    if (!isLoadMore) {
        grid.innerHTML = Array(3).fill('<div class="skeleton w-full aspect-[4/5] rounded-[45px]"></div>').join('');
        currentPage = 1;
    }

    const searchQuery = query || 'latest';
    let url = `https://newsapi.org/v2/everything?q=${searchQuery}&language=${currentLang}&pageSize=6&page=${currentPage}&apiKey=${API_KEY}`;
    
    if (category) {
        url = `https://newsapi.org/v2/top-headlines?category=${category}&language=${currentLang}&pageSize=6&page=${currentPage}&apiKey=${API_KEY}`;
        const title = document.getElementById('viewTitle');
        if(title) title.innerText = category.charAt(0).toUpperCase() + category.slice(1);
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.articles) {
            currentArticles = isLoadMore ? [...currentArticles, ...data.articles] : data.articles;
            renderHome(currentArticles);
        }
    } catch (e) {
        grid.innerHTML = `<p class="text-center py-10 opacity-50">Please run on Localhost/Server.</p>`;
    }
};

// --- 3. CATEGORY & LANG HELPERS ---
window.fetchByCategory = (cat) => {
    window.fetchNews('', false, cat);
    window.toggleMenu();
};

window.changeLang = () => {
    currentLang = document.getElementById('langSelect').value;
    window.fetchNews('trending');
    window.toggleMenu();
};

// --- 4. HOME RENDERING ---
function renderHome(articles) {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    grid.innerHTML = articles.map((art, index) => {
        const isFav = wishlist.some(i => i.url === art.url);
        return `
        <div class="group cursor-pointer" onclick="window.goToDetails(${index})">
            <div class="relative w-full aspect-[4/5] rounded-[45px] overflow-hidden shadow-xl mb-4">
                <img src="${art.urlToImage || 'https://via.placeholder.com/600'}" class="w-full h-full object-cover transition duration-700 group-hover:scale-110">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-8 flex flex-col justify-end">
                    <span class="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">${art.source.name}</span>
                    <h3 class="text-white text-xl font-bold leading-tight line-clamp-2">${art.title}</h3>
                </div>
                <button onclick="event.stopPropagation(); window.toggleWishlist(${index})" class="absolute top-6 right-6 w-12 h-12 glass rounded-full flex items-center justify-center text-white">
                    <span class="material-symbols-outlined ${isFav ? 'fill-1 text-red-500' : ''}">favorite</span>
                </button>
            </div>
        </div>`;
    }).join('');
}

// --- 5. WISHLIST LOGIC ---
window.toggleWishlist = (index) => {
    const art = currentArticles[index];
    const foundIdx = wishlist.findIndex(item => item.url === art.url);
    if (foundIdx > -1) wishlist.splice(foundIdx, 1);
    else wishlist.push(art);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    updateWishlistUI();
    renderHome(currentArticles);
};

window.renderWishlist = () => {
    const grid = document.getElementById('wishlistGrid');
    if (!grid) return;
    if (wishlist.length === 0) {
        grid.innerHTML = `<div class="text-center py-20 opacity-30"><span class="material-symbols-outlined text-6xl">heart_broken</span><p>Empty Wishlist</p></div>`;
        return;
    }
    grid.innerHTML = wishlist.map((art, i) => `
        <div class="group cursor-pointer" onclick="window.goToWishlistDetails(${i})">
            <div class="relative w-full aspect-[4/5] rounded-[45px] overflow-hidden shadow-xl mb-4">
                <img src="${art.urlToImage || 'https://via.placeholder.com/600'}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-8 flex flex-col justify-end">
                    <h3 class="text-white text-xl font-bold leading-tight line-clamp-2">${art.title}</h3>
                </div>
                <button onclick="event.stopPropagation(); window.removeWishlist(${i})" class="absolute top-6 right-6 w-12 h-12 glass rounded-full flex items-center justify-center text-red-500">
                    <span class="material-symbols-outlined fill-1">delete</span>
                </button>
            </div>
        </div>`).join('');
};

window.removeWishlist = (i) => {
    wishlist.splice(i, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    window.renderWishlist();
    updateWishlistUI();
};

// --- 6. NAVIGATION & DETAILS ---
window.goToDetails = (index) => {
    localStorage.setItem('Xeroid_Temp_Article', JSON.stringify(currentArticles[index]));
    localStorage.setItem('Xeroid_Related', JSON.stringify(currentArticles.slice(0, 5)));
    window.location.href = 'details.html';
};

window.goToWishlistDetails = (index) => {
    localStorage.setItem('Xeroid_Temp_Article', JSON.stringify(wishlist[index]));
    localStorage.setItem('Xeroid_Related', JSON.stringify(wishlist.slice(0, 5)));
    window.location.href = 'details.html';
};

window.renderDetailsPage = () => {
    const container = document.getElementById('detailsContent');
    const rawData = localStorage.getItem('Xeroid_Temp_Article');
    if (!container || !rawData) return;

    const art = JSON.parse(rawData);
    const related = JSON.parse(localStorage.getItem('Xeroid_Related')) || [];

    container.innerHTML = `
        <div class="animate-in fade-in duration-700">
            <div class="w-full h-80 rounded-[45px] overflow-hidden mb-6 shadow-xl relative">
                <img src="${art.urlToImage || 'https://via.placeholder.com/600'}" class="w-full h-full object-cover">
            </div>
            <span class="text-indigo-600 font-bold text-xs uppercase tracking-widest">${art.source.name}</span>
            <h1 class="text-2xl font-bold text-slate-900 mt-2 mb-4">${art.title}</h1>
            <p class="text-slate-600 leading-relaxed mb-8">${art.description || ''}<br><br>${art.content || 'Content available on source.'}</p>
            <a href="${art.url}" target="_blank" class="w-full py-5 bg-slate-900 text-white rounded-[30px] font-bold flex items-center justify-center gap-2 mb-12 shadow-lg">
                <span class="material-symbols-outlined">language</span> Read Full Article
            </a>
            <h2 class="text-lg font-bold mb-6">Related News</h2>
            <div class="space-y-4 pb-20">
                ${related.map(r => `
                    <div class="glass p-3 rounded-[32px] flex gap-4 items-center border-none">
                        <img src="${r.urlToImage || 'https://via.placeholder.com/200'}" class="w-16 h-16 rounded-2xl object-cover">
                        <h4 class="text-[11px] font-bold line-clamp-2">${r.title}</h4>
                    </div>`).join('')}
            </div>
        </div>`;
};

function updateWishlistUI() {
    const badge = document.getElementById('wishlistCount');
    if (badge) {
        badge.innerText = wishlist.length;
        badge.classList.toggle('hidden', wishlist.length === 0);
    }
}
// --- THE SHARE FUNCTION ---
window.shareNews = () => {
    const rawData = localStorage.getItem('Xeroid_Temp_Article');
    if (!rawData) return;

    const art = JSON.parse(rawData);
    const myAppUrl = window.location.origin; // Your website link

    if (navigator.share) {
        navigator.share({
            title: art.title,
            text: `Check out this story: "${art.title}"\n\nRead more on the source: ${art.url}\n\nShared via XeroidNews:`,
            url: myAppUrl
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    } else {
        // Fallback for desktop browsers that don't support native sharing
        alert("Sharing not supported on this browser. Copy the link: " + art.url);
    }
};

// ALIAS: This ensures that even if you call "SharedNews", it still works!
window.SharedNews = window.shareNews; 


// --- 7. INITIALIZATION (The Fixed Block) ---
document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on and run appropriate function
    if (document.getElementById('newsGrid')) {
        window.fetchNews('trending');
    }
    if (document.getElementById('wishlistGrid')) {
        window.renderWishlist();
    }
    if (document.getElementById('detailsContent')) {
        window.renderDetailsPage();
    }
    updateWishlistUI();
});

window.searchNews = () => window.fetchNews(document.getElementById('newsQuery').value || 'trending');
window.loadMore = () => { currentPage++; window.fetchNews('trending', true); };
