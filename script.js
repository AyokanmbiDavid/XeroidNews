const API_KEY = 'pub_42e9fc3d5f024a249292caf9f3aef7f6';
const STORAGE_KEY = 'XeroidNews_Wishlist';

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

// --- 2. API FETCHING (Updated for NewsData.io) ---
window.fetchNews = async (query = 'trending', isLoadMore = false, category = '') => {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    if (!isLoadMore) {
        grid.innerHTML = Array(3).fill('<div class="skeleton w-full aspect-[4/5] rounded-[45px] bg-slate-200 animate-pulse"></div>').join('');
    }

    // NewsData.io URL format
    let targetUrl = `https://newsdata.io/api/1/news?apikey=${API_KEY}&language=${currentLang}&q=${query}`;
    
    if (category) {
        targetUrl = `https://newsdata.io/api/1/news?apikey=${API_KEY}&language=${currentLang}&category=${category}`;
        const title = document.getElementById('viewTitle');
        if(title) title.innerText = category.charAt(0).toUpperCase() + category.slice(1);
    }

    try {
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        if (data.results) {
            // Map NewsData fields to match your original UI variables
            const formattedArticles = data.results.map(art => ({
                title: art.title,
                description: art.description || 'No description available.',
                content: art.content || art.description || 'Full content available at the source.',
                url: art.link,
                urlToImage: art.image_url || 'https://via.placeholder.com/600',
                source: { name: art.source_id || 'News' },
                publishedAt: art.pubDate
            }));

            currentArticles = isLoadMore ? [...currentArticles, ...formattedArticles] : formattedArticles;
            renderHome(currentArticles);
        }
    } catch (e) {
        grid.innerHTML = `<p class="text-center py-10 opacity-50">Connection Error or API Limit reached.</p>`;
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
                <img src="${art.urlToImage}" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" onerror="this.src='https://via.placeholder.com/600'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-8 flex flex-col justify-end">
                    <span class="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-1">${art.source.name}</span>
                    <h3 class="text-white text-xl font-bold leading-tight line-clamp-2">${art.title}</h3>
                    <p class="text-white/60 text-xs mt-2 line-clamp-2">${art.description}</p>
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
        grid.innerHTML = `<div class="text-center py-20 opacity-30"><p>Empty Wishlist</p></div>`;
        return;
    }
    grid.innerHTML = wishlist.map((art, i) => `
        <div class="group cursor-pointer" onclick="window.goToWishlistDetails(${i})">
            <div class="relative w-full aspect-[4/5] rounded-[45px] overflow-hidden shadow-xl mb-4">
                <img src="${art.urlToImage}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/600'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-8 flex flex-col justify-end">
                    <h3 class="text-white text-xl font-bold line-clamp-2">${art.title}</h3>
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

// --- 6. NAVIGATION & FULL DETAILS ---
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
                <img src="${art.urlToImage}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/600'">
            </div>
            <span class="text-indigo-600 font-bold text-xs uppercase tracking-widest">${art.source.name}</span>
            <h1 class="text-2xl font-bold text-slate-900 mt-2 mb-4 leading-tight">${art.title}</h1>
            
            <div class="text-slate-700 leading-relaxed mb-8 space-y-4 text-lg">
                <p class="font-semibold text-slate-900 italic">"${art.description}"</p>
                <p>${art.content}</p>
            </div>

            <a href="${art.url}" target="_blank" class="w-full py-5 bg-slate-900 text-white rounded-[30px] font-bold flex items-center justify-center gap-2 mb-12 shadow-lg">
                <span class="material-symbols-outlined">language</span> Read Full Article on ${art.source.name}
            </a>

            <h2 class="text-lg font-bold mb-6">More from this feed</h2>
            <div class="space-y-4 pb-20">
                ${related.map(r => `
                    <div class="glass p-3 rounded-[32px] flex gap-4 items-center border-none">
                        <img src="${r.urlToImage || 'https://via.placeholder.com/200'}" class="w-16 h-16 rounded-2xl object-cover" onerror="this.src='https://via.placeholder.com/600'">
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

// --- 7. SHARE & INITIALIZATION ---
window.shareNews = () => {
    const rawData = localStorage.getItem('Xeroid_Temp_Article');
    if (!rawData) return;
    const art = JSON.parse(rawData);
    if (navigator.share) {
        navigator.share({ title: art.title, url: art.url });
    } else {
        alert("Link: " + art.url);
    }
};

window.SharedNews = window.shareNews; 

document.addEventListener('DOMContentLoaded', () => {
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
